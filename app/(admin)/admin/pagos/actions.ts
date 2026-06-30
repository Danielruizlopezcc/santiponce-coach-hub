'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

export type FinanceMovementActionState = {
  ok: boolean
  message: string
}

export type FeeTemplateActionState = {
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
  justificanteUrl: z.string().trim().url('El justificante debe ser una URL válida.').optional().or(z.literal('')),
  importe: z.coerce
    .number({ message: 'Introduce un importe válido.' })
    .positive('El importe debe ser mayor que cero.')
    .max(999_999, 'El importe es demasiado alto.'),
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
    justificanteUrl: formData.get('justificanteUrl'),
    importe: formData.get('importe'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos del movimiento.',
    }
  }

  const supabase = createAdminClient()
  const { id, tipo, concepto, detalle, categoria, metodoPago, estado, seasonId, justificanteUrl, importe } = parsed.data
  const payload = {
    movement_type: tipo === 'ingreso' ? 'income' : 'expense',
    concept: concepto,
    detail: detalle || null,
    category: categoria,
    payment_method: metodoPago,
    status: estado,
    season_id: seasonId ?? null,
    receipt_url: justificanteUrl || null,
    amount_cents: Math.round(importe * 100),
    currency: 'eur',
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

  revalidatePath('/admin/pagos')
  return {
    ok: true,
    message: id ? 'Movimiento actualizado correctamente.' : 'Movimiento guardado correctamente.',
  }
}

export async function deleteFinanceMovementAction(id: string): Promise<FinanceMovementActionState> {
  await requireAdminAction()

  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'No se ha podido identificar el movimiento.',
    }
  }

  const supabase = createAdminClient()
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

  revalidatePath('/admin/pagos')
  return { ok: true, message: values.id ? 'Cuota actualizada correctamente.' : 'Cuota guardada correctamente.' }
}

export async function deleteFeeTemplateAction(id: string): Promise<FeeTemplateActionState> {
  await requireAdminAction()

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

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Cuota eliminada correctamente.' }
}

export async function markPaymentPendingAction(id: string): Promise<FinanceMovementActionState> {
  await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el pago.' }

  const { error } = await createAdminClient()
    .from('payments')
    .update({ status: 'pending' })
    .eq('id', parsed.data)
    .in('status', ['failed', 'canceled'])

  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Pago marcado como pendiente.' }
}

export async function cancelPaymentAction(id: string): Promise<FinanceMovementActionState> {
  await requireAdminAction()
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: 'No se ha podido identificar el pago.' }

  const { error } = await createAdminClient()
    .from('payments')
    .update({ status: 'canceled' })
    .eq('id', parsed.data)
    .in('status', ['pending', 'failed'])

  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Pago cancelado correctamente.' }
}

export async function refundStripePaymentAction(id: string): Promise<FinanceMovementActionState> {
  await requireAdminAction()
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
