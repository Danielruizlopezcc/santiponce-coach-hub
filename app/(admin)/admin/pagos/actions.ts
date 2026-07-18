'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminAuditLog } from '@/lib/audit'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'
import {
  createTutorFeeStripeSchedule,
  validateFirstDueDate,
  type TutorFeeChargeDraft,
} from '@/lib/tutor-fee-billing'

const RECEIPT_BUCKET_NAME = 'finance-receipts'
const RECEIPT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function normalizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildReceiptPath(file: File) {
  const safeName = normalizeFileName(file.name)
  return `justificantes/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`
}

function getStoragePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${RECEIPT_BUCKET_NAME}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '')
}

async function removeFinanceReceipt(supabase: ReturnType<typeof createAdminClient>, receiptUrl: string | null | undefined) {
  const path = getStoragePathFromPublicUrl(receiptUrl)
  if (!path) return
  await supabase.storage.from(RECEIPT_BUCKET_NAME).remove([path])
}

async function uploadFinanceReceipt(supabase: ReturnType<typeof createAdminClient>, receipt: File) {
  if (!RECEIPT_ALLOWED_TYPES.includes(receipt.type)) {
    throw new Error('El justificante debe ser una imagen (JPG, PNG, WEBP) o un PDF.')
  }

  const { error: bucketError } = await supabase.storage.createBucket(RECEIPT_BUCKET_NAME, {
    public: true,
  })

  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(bucketError.message)
  }

  const receiptPath = buildReceiptPath(receipt)
  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_BUCKET_NAME)
    .upload(receiptPath, receipt, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrlData } = supabase.storage
    .from(RECEIPT_BUCKET_NAME)
    .getPublicUrl(receiptPath)

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL del justificante.')
  }

  return publicUrlData.publicUrl
}

export type FinanceMovementActionState = {
  ok: boolean
  message: string
}

export type FeeTemplateActionState = {
  ok: boolean
  message: string
}

export type AthleteFeeAssignmentState = {
  ok: boolean
  message: string
}

const financeMovementSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['ingreso', 'gasto'], {
    message: 'Selecciona si es un ingreso o un gasto.',
  }),
  concepto: z.string().trim().min(2, 'Escribe un concepto.').max(120, 'El concepto es demasiado largo.'),
  detalle: z.string().trim().max(500, 'El detalle es demasiado largo.').optional(),
  categoria: z.string().trim().min(2, 'Selecciona una categoría.').max(80),
  metodoPago: z.enum(['cash', 'transfer', 'bizum', 'card', 'stripe', 'other'], {
    message: 'Selecciona un método de pago.',
  }),
  estado: z.enum(['confirmed', 'pending', 'void'], {
    message: 'Selecciona un estado.',
  }),
  seasonId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
  vendorId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
  removeReceipt: z.coerce.boolean().optional(),
  importe: z.coerce
    .number({ message: 'Introduce un importe válido.' })
    .positive('El importe debe ser mayor que cero.')
    .max(999_999, 'El importe es demasiado alto.'),
})

const vendorSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(2, 'Escribe el nombre del proveedor.').max(140),
  cif: z.string().trim().max(20, 'El CIF/NIF es demasiado largo.').optional(),
  contactoNombre: z.string().trim().max(140).optional(),
  contactoEmail: z
    .string()
    .trim()
    .transform((value) => value || '')
    .pipe(z.string().email('Correo no válido.').or(z.literal(''))),
  contactoTelefono: z.string().trim().max(40, 'El teléfono es demasiado largo.').optional(),
  notas: z.string().trim().max(500, 'Las notas son demasiado largas.').optional(),
  activo: z.coerce.boolean(),
})

const feeTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(2, 'Escribe el nombre de la cuota.').max(120),
  tipo: z.string().trim().min(2, 'Escribe el tipo de cuota.').max(80),
  importe: z.coerce
    .number({ message: 'Introduce un precio total válido.' })
    .positive('El precio total debe ser mayor que cero.')
    .max(999_999, 'El precio total es demasiado alto.'),
  isPublic: z.coerce.boolean(),
  splitPayment: z.coerce.boolean(),
  chargeFrequency: z.string().trim().max(80).optional(),
  chargeCount: z.coerce.number().int().positive().optional(),
}).superRefine((values, ctx) => {
  if (!values.splitPayment) return
  if (!values.chargeFrequency) {
    ctx.addIssue({ code: 'custom', path: ['chargeFrequency'], message: 'Indica la frecuencia de cargos.' })
  }
  if (!values.chargeCount || values.chargeCount < 2) {
    ctx.addIssue({ code: 'custom', path: ['chargeCount'], message: 'El número total de cargos debe ser mayor que 1.' })
  }
})

const athleteFeeAssignmentSchema = z.object({
  athleteId: z.string().uuid('No se ha podido identificar el deportista.'),
  feeTemplateId: z.string().uuid('Selecciona una cuota.'),
  chargeDay: z.coerce.number().int().min(1, 'El día debe estar entre 1 y 28.').max(28, 'El día debe estar entre 1 y 28.'),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Selecciona el mes de inicio.'),
})

function getFrequencyMonths(value: string | null) {
  if (value === 'cada_2_meses') return 2
  if (value === 'cada_3_meses') return 3
  if (value === 'cada_6_meses') return 6
  return 1
}

function addMonths(year: number, monthIndex: number, monthsToAdd: number) {
  return new Date(Date.UTC(year, monthIndex + monthsToAdd, 1))
}

function toDueDate(startMonth: string, chargeDay: number, offsetMonths: number) {
  const [year, month] = startMonth.split('-').map(Number)
  const date = addMonths(year, month - 1, offsetMonths)
  date.setUTCDate(chargeDay)
  return date.toISOString().slice(0, 10)
}

async function getPaidEnrollmentCreditCents(athleteId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('athlete_id', athleteId)
    .eq('payment_type', 'enrollment')
    .eq('status', 'paid')

  if (error) throw new Error(error.message)

  return (data ?? []).reduce((sum, payment) => sum + Number(payment.amount_cents ?? 0), 0)
}

export async function createFinanceMovementAction(
  _prevState: FinanceMovementActionState,
  formData: FormData,
): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()
  const parsed = financeMovementSchema.safeParse({
    id: formData.get('id') || undefined,
    tipo: formData.get('tipo'),
    concepto: formData.get('concepto'),
    detalle: formData.get('detalle'),
    categoria: formData.get('categoria'),
    metodoPago: formData.get('metodoPago'),
    estado: formData.get('estado'),
    seasonId: formData.get('seasonId'),
    vendorId: formData.get('vendorId'),
    removeReceipt: formData.get('removeReceipt') === 'on',
    importe: formData.get('importe'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos del movimiento.',
    }
  }

  const supabase = createAdminClient()
  const { id, tipo, concepto, detalle, categoria, metodoPago, estado, seasonId, vendorId, removeReceipt, importe } = parsed.data
  const receipt = formData.get('receipt')
  const receiptFile = receipt instanceof File && receipt.size > 0 ? receipt : null

  const payload: Record<string, unknown> = {
    movement_type: tipo === 'ingreso' ? 'income' : 'expense',
    concept: concepto,
    detail: detalle || null,
    category: categoria,
    payment_method: metodoPago,
    status: estado,
    season_id: seasonId ?? null,
    vendor_id: tipo === 'gasto' ? vendorId ?? null : null,
    amount_cents: Math.round(importe * 100),
    currency: 'eur',
  }

  let previousReceiptUrl: string | null | undefined
  if (id && (receiptFile || removeReceipt)) {
    const { data: current } = await supabase
      .from('admin_finance_movements')
      .select('receipt_url')
      .eq('id', id)
      .maybeSingle()
    previousReceiptUrl = current?.receipt_url
  }

  if (receiptFile) {
    try {
      payload.receipt_url = await uploadFinanceReceipt(supabase, receiptFile)
    } catch (uploadError) {
      return {
        ok: false,
        message: uploadError instanceof Error ? uploadError.message : 'No se ha podido subir el justificante.',
      }
    }
  } else if (removeReceipt) {
    payload.receipt_url = null
  }

  const { error } = id
    ? await supabase.from('admin_finance_movements').update(payload).eq('id', id)
    : await supabase.from('admin_finance_movements').insert({
        ...payload,
        created_by: admin.id,
      })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  if (receiptFile || removeReceipt) {
    await removeFinanceReceipt(supabase, previousReceiptUrl)
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'finance_movement.upsert',
    entityType: 'admin_finance_movement',
    entityId: id ?? null,
    summary: id ? 'Actualizó un movimiento manual de contabilidad.' : 'Creó un movimiento manual de contabilidad.',
    metadata: {
      tipo,
      concepto,
      categoria,
      metodoPago,
      estado,
      importe,
    },
  })

  revalidatePath('/admin/pagos')
  return {
    ok: true,
    message: id ? 'Movimiento actualizado correctamente.' : 'Movimiento guardado correctamente.',
  }
}

export async function deleteFinanceMovementAction(id: string): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()

  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'No se ha podido identificar el movimiento.',
    }
  }

  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from('admin_finance_movements')
    .select('receipt_url')
    .eq('id', parsed.data)
    .maybeSingle()

  const { error } = await supabase
    .from('admin_finance_movements')
    .delete()
    .eq('id', parsed.data)

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  await removeFinanceReceipt(supabase, current?.receipt_url)

  await createAdminAuditLog({
    actor: admin,
    action: 'finance_movement.delete',
    entityType: 'admin_finance_movement',
    entityId: parsed.data,
    summary: 'Eliminó un movimiento manual de contabilidad.',
  })

  revalidatePath('/admin/pagos')
  return {
    ok: true,
    message: 'Movimiento eliminado correctamente.',
  }
}

export async function createFeeTemplateAction(
  _prevState: FeeTemplateActionState,
  formData: FormData,
): Promise<FeeTemplateActionState> {
  const admin = await requireAdminAction()
  const splitPayment = formData.get('splitPayment') === 'on'
  const parsed = feeTemplateSchema.safeParse({
    id: formData.get('id') || undefined,
    nombre: formData.get('nombre'),
    tipo: formData.get('tipo'),
    importe: formData.get('importe'),
    isPublic: formData.get('isPublic') === 'on',
    splitPayment,
    chargeFrequency: splitPayment ? formData.get('chargeFrequency') : undefined,
    chargeCount: splitPayment ? formData.get('chargeCount') : undefined,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cuota.',
    }
  }

  const values = parsed.data
  const supabase = createAdminClient()
  const payload = {
    name: values.nombre,
    fee_type: values.tipo,
    total_amount_cents: Math.round(values.importe * 100),
    currency: 'eur',
    is_public: values.isPublic,
    split_payment: values.splitPayment,
    charge_frequency: values.splitPayment ? values.chargeFrequency : null,
    charge_count: values.splitPayment ? values.chargeCount : null,
  }
  const { error } = values.id
    ? await supabase.from('admin_fee_templates').update(payload).eq('id', values.id)
    : await supabase.from('admin_fee_templates').insert({
        ...payload,
        created_by: admin.id,
      })

  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'fee_template.upsert',
    entityType: 'admin_fee_template',
    entityId: values.id ?? null,
    summary: values.id ? 'Actualizó una plantilla de cuota.' : 'Creó una plantilla de cuota.',
    metadata: {
      nombre: values.nombre,
      tipo: values.tipo,
      importe: values.importe,
      splitPayment: values.splitPayment,
      chargeCount: values.chargeCount ?? null,
    },
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: values.id ? 'Cuota actualizada correctamente.' : 'Cuota guardada correctamente.' }
}

export async function deleteFeeTemplateAction(id: string): Promise<FeeTemplateActionState> {
  const admin = await requireAdminAction()

  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar la cuota.' }

  const supabase = createAdminClient()
  const { count, error: assignmentError } = await supabase
    .from('tutor_fee_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('fee_template_id', parsed.data)
    .neq('status', 'canceled')

  if (assignmentError) return { ok: false, message: assignmentError.message }
  if ((count ?? 0) > 0) {
    return { ok: false, message: 'No se puede eliminar una cuota con asignaciones activas.' }
  }

  const { error } = await supabase.from('admin_fee_templates').delete().eq('id', parsed.data)
  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'fee_template.delete',
    entityType: 'admin_fee_template',
    entityId: parsed.data,
    summary: 'Eliminó una plantilla de cuota.',
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Cuota eliminada correctamente.' }
}

export async function assignAthleteFeeAction(
  _prev: AthleteFeeAssignmentState,
  formData: FormData,
): Promise<AthleteFeeAssignmentState> {
  const admin = await requireAdminAction()
  const parsed = athleteFeeAssignmentSchema.safeParse({
    athleteId: formData.get('athleteId'),
    feeTemplateId: formData.get('feeTemplateId'),
    chargeDay: formData.get('chargeDay'),
    startMonth: formData.get('startMonth'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cuota.' }
  }

  const supabase = createAdminClient()
  const values = parsed.data
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, guardian_id, first_name, last_name')
    .eq('id', values.athleteId)
    .maybeSingle()

  if (athleteError || !athlete) {
    return { ok: false, message: athleteError?.message ?? 'No se ha encontrado el deportista.' }
  }

  if (!athlete.guardian_id) {
    return { ok: false, message: 'Sólo se puede asignar una cuota si el deportista tiene tutor asignado.' }
  }

  const { data: fee, error: feeError } = await supabase
    .from('admin_fee_templates')
    .select('id, name, fee_type, total_amount_cents, currency, split_payment, charge_frequency, charge_count, stripe_product_id')
    .eq('id', values.feeTemplateId)
    .maybeSingle()

  if (feeError || !fee) {
    return { ok: false, message: feeError?.message ?? 'No se ha encontrado la cuota seleccionada.' }
  }

  const totalCharges = fee.split_payment ? Number(fee.charge_count ?? 0) : 1
  if (totalCharges < 1) {
    return { ok: false, message: 'La cuota no tiene una configuración de cargos válida.' }
  }

  let enrollmentCreditCents = 0
  try {
    enrollmentCreditCents = await getPaidEnrollmentCreditCents(athlete.id)
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido comprobar la matrícula pagada.',
    }
  }

  const amountToChargeCents = Math.max(0, fee.total_amount_cents - enrollmentCreditCents)
  if (amountToChargeCents <= 0) {
    return {
      ok: false,
      message: 'La matrícula pagada cubre el importe completo de esta cuota. No hay importe pendiente que programar.',
    }
  }

  const frequencyMonths = fee.split_payment ? getFrequencyMonths(fee.charge_frequency) : 1
  const baseAmount = Math.floor(amountToChargeCents / totalCharges)
  const remainder = amountToChargeCents % totalCharges
  const charges = Array.from({ length: totalCharges }, (_, index) => ({
    assignment_id: '',
    guardian_id: athlete.guardian_id,
    athlete_id: athlete.id,
    fee_template_id: values.feeTemplateId,
    charge_number: index + 1,
    due_date: toDueDate(values.startMonth, values.chargeDay, index * frequencyMonths),
    amount_cents: baseAmount + (index < remainder ? 1 : 0),
    currency: 'eur',
    status: 'scheduled',
  }))

  try {
    validateFirstDueDate(charges[0].due_date)
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Revisa la fecha del primer cobro.' }
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('tutor_fee_assignments')
    .insert({
      guardian_id: athlete.guardian_id,
      athlete_id: athlete.id,
      fee_template_id: values.feeTemplateId,
      charge_day: values.chargeDay,
      start_month: `${values.startMonth}-01`,
      status: 'active',
      created_by: admin.id,
    })
    .select('id')
    .single()

  if (assignmentError || !assignment) {
    return { ok: false, message: assignmentError?.message ?? 'No se ha podido asignar la cuota.' }
  }

  const chargePayload = charges.map((charge) => ({
    ...charge,
    assignment_id: assignment.id,
  }))

  const { data: createdCharges, error: chargesError } = await supabase
    .from('tutor_fee_charges')
    .insert(chargePayload)
    .select('id, amount_cents, due_date, charge_number')

  if (chargesError || !createdCharges) {
    await supabase.from('tutor_fee_assignments').delete().eq('id', assignment.id)
    return { ok: false, message: chargesError?.message ?? 'No se han podido crear los cargos.' }
  }

  try {
    const schedule = await createTutorFeeStripeSchedule({
      assignmentId: assignment.id,
      guardianId: athlete.guardian_id,
      athleteId: athlete.id,
      fee,
      charges: createdCharges as TutorFeeChargeDraft[],
      frequencyMonths,
    })

    const { error: scheduleError } = await supabase
      .from('tutor_fee_assignments')
      .update({ stripe_subscription_schedule_id: schedule.id })
      .eq('id', assignment.id)

    if (scheduleError) throw new Error(scheduleError.message)
  } catch (error) {
    await supabase.from('tutor_fee_assignments').delete().eq('id', assignment.id)
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido programar la cuota en Stripe.',
    }
  }

  const athleteName = `${athlete.first_name} ${athlete.last_name}`.trim()
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/tutores')
  revalidatePath('/admin/pagos')
  const creditMessage =
    enrollmentCreditCents > 0
      ? ` Se ha descontado la matrícula pagada (${(enrollmentCreditCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}).`
      : ''

  return { ok: true, message: `Cuota asignada a ${athleteName} y cobros programados en Stripe correctamente.${creditMessage}` }
}

export async function markPaymentPendingAction(id: string): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el pago.' }

  const { error } = await createAdminClient()
    .from('payments')
    .update({ status: 'pending' })
    .eq('id', parsed.data)
    .in('status', ['failed', 'canceled'])

  if (error) return { ok: false, message: error.message }
  await createAdminAuditLog({
    actor: admin,
    action: 'payment.pending',
    entityType: 'payment',
    entityId: parsed.data,
    summary: 'Marcó un pago como pendiente.',
  })
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Pago marcado como pendiente.' }
}

export async function cancelPaymentAction(id: string): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el pago.' }

  const { error } = await createAdminClient()
    .from('payments')
    .update({ status: 'canceled' })
    .eq('id', parsed.data)
    .in('status', ['pending', 'failed'])

  if (error) return { ok: false, message: error.message }
  await createAdminAuditLog({
    actor: admin,
    action: 'payment.cancel',
    entityType: 'payment',
    entityId: parsed.data,
    summary: 'Canceló un pago desde contabilidad.',
  })
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Pago cancelado correctamente.' }
}

export async function refundStripePaymentAction(id: string): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el pago.' }

  const supabase = createAdminClient()
  const { data: payment, error: lookupError } = await supabase
    .from('payments')
    .select('id, provider, status, metadata, stripe_payment_intent_id')
    .eq('id', parsed.data)
    .maybeSingle()

  if (lookupError) return { ok: false, message: lookupError.message }
  if (!payment) return { ok: false, message: 'No se ha encontrado el pago.' }
  if (payment.provider !== 'stripe' || payment.status !== 'paid' || !payment.stripe_payment_intent_id) {
    return { ok: false, message: 'Solo se pueden reembolsar pagos de Stripe ya cobrados.' }
  }

  try {
    const refund = await getStripeClient().refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      metadata: {
        paymentId: payment.id,
        source: 'admin-panel',
      },
    })

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        metadata: {
          ...(typeof payment.metadata === 'object' && payment.metadata ? payment.metadata : {}),
          refund_id: refund.id,
          refund_status: refund.status,
          refunded_from_admin: true,
        },
      })
      .eq('id', payment.id)

    if (error) return { ok: false, message: error.message }

    await createAdminAuditLog({
      actor: admin,
      action: 'payment.refund',
      entityType: 'payment',
      entityId: payment.id,
      summary: 'Creó un reembolso de Stripe desde el panel.',
      metadata: {
        refundId: refund.id,
        refundStatus: refund.status,
        stripePaymentIntentId: payment.stripe_payment_intent_id,
      },
    })

    revalidatePath('/admin/pagos')
    revalidatePath('/admin/matriculas')
    return { ok: true, message: 'Reembolso creado en Stripe correctamente.' }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido crear el reembolso en Stripe.',
    }
  }
}

export type VendorActionState = {
  ok: boolean
  message: string
}

export async function createVendorAction(
  _prevState: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const admin = await requireAdminAction()
  const parsed = vendorSchema.safeParse({
    id: formData.get('id') || undefined,
    nombre: formData.get('nombre'),
    cif: formData.get('cif'),
    contactoNombre: formData.get('contactoNombre'),
    contactoEmail: formData.get('contactoEmail'),
    contactoTelefono: formData.get('contactoTelefono'),
    notas: formData.get('notas'),
    activo: formData.get('activo') === 'on',
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos del proveedor.' }
  }

  const { id, nombre, cif, contactoNombre, contactoEmail, contactoTelefono, notas, activo } = parsed.data
  const payload = {
    name: nombre,
    tax_id: cif || null,
    contact_name: contactoNombre || null,
    contact_email: contactoEmail || null,
    contact_phone: contactoTelefono || null,
    notes: notas || null,
    is_active: activo,
  }

  const supabase = createAdminClient()
  const { error } = id
    ? await supabase.from('finance_vendors').update(payload).eq('id', id)
    : await supabase.from('finance_vendors').insert({ ...payload, created_by: admin.id })

  if (error) {
    return { ok: false, message: error.message }
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'vendor.upsert',
    entityType: 'finance_vendor',
    entityId: id ?? null,
    summary: id ? 'Actualizó un proveedor.' : 'Creó un proveedor.',
    metadata: { nombre, cif },
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: id ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.' }
}

export async function deleteVendorAction(id: string): Promise<VendorActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return { ok: false, message: 'No se ha podido identificar el proveedor.' }
  }

  const supabase = createAdminClient()
  const { count } = await supabase
    .from('admin_finance_movements')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', parsed.data)

  if (count && count > 0) {
    return {
      ok: false,
      message: `No se puede eliminar: hay ${count} gasto(s) asociados a este proveedor. Desactívalo en su lugar.`,
    }
  }

  const { error } = await supabase.from('finance_vendors').delete().eq('id', parsed.data)
  if (error) {
    return { ok: false, message: error.message }
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'vendor.delete',
    entityType: 'finance_vendor',
    entityId: parsed.data,
    summary: 'Eliminó un proveedor.',
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Proveedor eliminado correctamente.' }
}

// --- Conciliación bancaria ---

export type BankTransactionActionState = {
  ok: boolean
  message: string
}

function parseBankTransactionsCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows: Array<{ transaction_date: string; description: string; amount_cents: number }> = []

  for (const line of lines) {
    const [dateRaw, descriptionRaw, amountRaw] = line.split(',').map((cell) => cell.trim())
    if (!dateRaw || !descriptionRaw || !amountRaw) continue
    if (dateRaw.toLowerCase() === 'fecha') continue // skip header row if present

    const date = new Date(dateRaw)
    const amount = Number(amountRaw.replace(',', '.'))
    if (Number.isNaN(date.getTime()) || !Number.isFinite(amount) || amount === 0) continue

    rows.push({
      transaction_date: date.toISOString().slice(0, 10),
      description: descriptionRaw,
      amount_cents: Math.round(amount * 100),
    })
  }

  return rows
}

export async function importBankTransactionsAction(
  _prevState: BankTransactionActionState,
  formData: FormData,
): Promise<BankTransactionActionState> {
  const admin = await requireAdminAction()
  const csvText = String(formData.get('csvText') ?? '')
  const rows = parseBankTransactionsCsv(csvText)

  if (rows.length === 0) {
    return {
      ok: false,
      message: 'No se ha reconocido ningún movimiento. Usa el formato fecha,descripción,importe (uno por línea).',
    }
  }

  const supabase = createAdminClient()
  const batchId = new Date().toISOString()
  const { error } = await supabase.from('bank_transactions').insert(
    rows.map((row) => ({ ...row, created_by: admin.id, import_batch: batchId })),
  )

  if (error) {
    return { ok: false, message: error.message }
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'bank_transactions.import',
    entityType: 'bank_transaction',
    summary: `Importó ${rows.length} movimiento(s) bancario(s) para conciliar.`,
    metadata: { count: rows.length },
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: `${rows.length} movimiento(s) importado(s) correctamente.` }
}

export async function matchBankTransactionAction(
  bankTransactionId: string,
  target: { type: 'movement' | 'payment'; id: string },
): Promise<BankTransactionActionState> {
  const admin = await requireAdminAction()
  const parsedId = z.string().uuid().safeParse(bankTransactionId)
  const parsedTargetId = z.string().uuid().safeParse(target.id)
  if (!parsedId.success || !parsedTargetId.success) {
    return { ok: false, message: 'No se ha podido identificar el movimiento.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('bank_transactions')
    .update({
      status: 'matched',
      matched_movement_id: target.type === 'movement' ? parsedTargetId.data : null,
      matched_payment_id: target.type === 'payment' ? parsedTargetId.data : null,
    })
    .eq('id', parsedId.data)

  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'bank_transactions.match',
    entityType: 'bank_transaction',
    entityId: parsedId.data,
    summary: 'Conciliar movimiento bancario con un registro contable.',
    metadata: { targetType: target.type, targetId: target.id },
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Movimiento conciliado correctamente.' }
}

export async function unmatchBankTransactionAction(id: string): Promise<BankTransactionActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el movimiento.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'unmatched', matched_movement_id: null, matched_payment_id: null })
    .eq('id', parsed.data)

  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'bank_transactions.unmatch',
    entityType: 'bank_transaction',
    entityId: parsed.data,
    summary: 'Deshizo la conciliación de un movimiento bancario.',
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Conciliación deshecha.' }
}

export async function ignoreBankTransactionAction(id: string): Promise<BankTransactionActionState> {
  await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el movimiento.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('bank_transactions')
    .update({ status: 'ignored', matched_movement_id: null, matched_payment_id: null })
    .eq('id', parsed.data)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Movimiento marcado como ignorado.' }
}

export async function deleteBankTransactionAction(id: string): Promise<BankTransactionActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el movimiento.' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('bank_transactions').delete().eq('id', parsed.data)
  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'bank_transactions.delete',
    entityType: 'bank_transaction',
    entityId: parsed.data,
    summary: 'Eliminó un movimiento bancario importado.',
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Movimiento eliminado.' }
}

// --- Presupuesto vs. real ---

export type BudgetActionState = {
  ok: boolean
  message: string
}

const budgetSchema = z.object({
  id: z.string().uuid().optional(),
  seasonId: z.string().uuid('Selecciona una temporada.'),
  tipo: z.enum(['ingreso', 'gasto'], { message: 'Selecciona si es ingreso o gasto.' }),
  categoria: z.string().trim().min(2, 'Selecciona una categoría.').max(80),
  importe: z.coerce
    .number({ message: 'Introduce un importe válido.' })
    .positive('El presupuesto debe ser mayor que cero.')
    .max(999_999, 'El importe es demasiado alto.'),
})

export async function upsertBudgetAction(
  _prevState: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const admin = await requireAdminAction()
  const parsed = budgetSchema.safeParse({
    id: formData.get('id') || undefined,
    seasonId: formData.get('seasonId'),
    tipo: formData.get('tipo'),
    categoria: formData.get('categoria'),
    importe: formData.get('importe'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos del presupuesto.' }
  }

  const { id, seasonId, tipo, categoria, importe } = parsed.data
  const payload = {
    season_id: seasonId,
    movement_type: tipo === 'ingreso' ? 'income' : 'expense',
    category: categoria,
    budgeted_amount_cents: Math.round(importe * 100),
  }

  const supabase = createAdminClient()
  const { error } = id
    ? await supabase.from('finance_budgets').update(payload).eq('id', id)
    : await supabase
        .from('finance_budgets')
        .upsert({ ...payload, created_by: admin.id }, { onConflict: 'season_id,movement_type,category' })

  if (error) {
    return { ok: false, message: error.message }
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'budget.upsert',
    entityType: 'finance_budget',
    entityId: id ?? null,
    summary: id ? 'Actualizó un presupuesto.' : 'Creó un presupuesto.',
    metadata: { seasonId, tipo, categoria, importe },
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Presupuesto guardado correctamente.' }
}

export async function deleteBudgetAction(id: string): Promise<BudgetActionState> {
  const admin = await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el presupuesto.' }

  const supabase = createAdminClient()
  const { error } = await supabase.from('finance_budgets').delete().eq('id', parsed.data)
  if (error) return { ok: false, message: error.message }

  await createAdminAuditLog({
    actor: admin,
    action: 'budget.delete',
    entityType: 'finance_budget',
    entityId: parsed.data,
    summary: 'Eliminó un presupuesto.',
  })

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Presupuesto eliminado correctamente.' }
}
