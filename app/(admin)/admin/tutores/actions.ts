'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeDocument, normalizeEmail, normalizePhone } from '@/lib/private-app-shared'
import {
  cancelTutorFeeStripeSchedule,
  createTutorFeeStripeSchedule,
  validateFirstDueDate,
  type TutorFeeChargeDraft,
} from '@/lib/tutor-fee-billing'

export type TutorSocioActionState = {
  ok: boolean
  message: string
}

export type TutorFeeAssignmentActionState = {
  ok: boolean
  message: string
}

const basePersonSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  email: z.string().trim().email('Correo no válido.').max(120),
})

const tutorSchema = basePersonSchema.extend({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').optional(),
  telefono: z.string().trim().min(6, 'Introduce un teléfono.').max(30),
  documento: z.string().trim().min(3, 'Introduce DNI/NIE.').max(40),
  ciudad: z.string().trim().min(2, 'Introduce ciudad.').max(60),
  isSocio: z.coerce.boolean().optional(),
  imageConsent: z.coerce.boolean().optional(),
})

const memberSchema = basePersonSchema.extend({
  id: z.string().uuid().optional(),
})

const tutorFeeAssignmentSchema = z.object({
  guardianId: z.string().uuid('No se ha podido identificar el tutor.'),
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

async function createAuthProfile(values: z.infer<typeof basePersonSchema>, password?: string) {
  const supabase = createAdminClient()
  const email = normalizeEmail(values.email)
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing) throw new Error('Ya existe una cuenta con ese correo.')

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: password ?? crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: values.nombre,
      last_name: values.apellidos,
    },
  })

  if (error || !data.user) throw new Error(error?.message ?? 'No se ha podido crear el usuario.')

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })

  if (profileError) throw new Error(profileError.message)
  return data.user.id
}

export async function createTutorAction(
  _prev: TutorSocioActionState,
  formData: FormData,
): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const parsed = tutorSchema.safeParse({
    id: formData.get('id') || undefined,
    userId: formData.get('userId') || undefined,
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    documento: formData.get('documento'),
    ciudad: formData.get('ciudad'),
    isSocio: formData.get('isSocio') === 'on',
    password: formData.get('password') || undefined,
    imageConsent: formData.get('imageConsent') === 'on',
  })

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }

  try {
    const supabase = createAdminClient()
    const values = parsed.data
    if (values.id && values.userId) {
      const email = normalizeEmail(values.email)
      const { error: authError } = await supabase.auth.admin.updateUserById(values.userId, {
        email,
        email_confirm: true,
        user_metadata: {
          first_name: values.nombre,
          last_name: values.apellidos,
        },
      })
      if (authError) throw new Error(authError.message)

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email,
          first_name: values.nombre,
          last_name: values.apellidos,
        })
        .eq('id', values.userId)
      if (profileError) throw new Error(profileError.message)

      const { error: guardianError } = await supabase
        .from('guardians')
        .update({
          first_name: values.nombre,
          last_name: values.apellidos,
          phone: normalizePhone(values.telefono),
          document_id: normalizeDocument(values.documento),
          city: values.ciudad,
        })
        .eq('id', values.id)
      if (guardianError) throw new Error(guardianError.message)

      await setUserMembership(values.userId, Boolean(values.isSocio))
      revalidatePath('/admin/tutores')
      return { ok: true, message: 'Tutor actualizado correctamente.' }
    }

    if (!values.password) {
      return { ok: false, message: 'Introduce una contraseña para la cuenta del tutor.' }
    }

    const userId = await createAuthProfile(values, values.password)
    const { data: guardian, error } = await supabase
      .from('guardians')
      .insert({
        user_id: userId,
        first_name: values.nombre,
        last_name: values.apellidos,
        phone: normalizePhone(values.telefono),
        document_id: normalizeDocument(values.documento),
        address_line: 'Pendiente',
        postal_code: '41970',
        province: 'Sevilla',
        city: values.ciudad,
        country: 'España',
        payment_preference: 'cuotas',
        is_approved: true,
        approval_status: 'approved',
      })
      .select('id')
      .single()
    if (error || !guardian) throw new Error(error?.message ?? 'No se ha podido crear el tutor.')

    const { data: consentDocuments, error: consentDocumentsError } = await supabase
      .from('consent_documents')
      .select('id, code, is_required')
      .or('is_required.eq.true,code.eq.image_rights')
    if (consentDocumentsError) throw new Error(consentDocumentsError.message)

    const signerName = `${values.nombre} ${values.apellidos}`.trim()
    const signerDocument = normalizeDocument(values.documento)
    const consentRows = (consentDocuments ?? []).map((document) => ({
      guardian_id: guardian.id,
      athlete_id: null,
      document_id: document.id,
      accepted: document.code === 'image_rights' ? Boolean(values.imageConsent) : true,
      signer_full_name: signerName,
      signer_document_id: signerDocument,
    }))

    if (consentRows.length > 0) {
      const { error: consentsError } = await supabase.from('consents').insert(consentRows)
      if (consentsError) throw new Error(consentsError.message)
    }

    if (values.isSocio) {
      await setUserMembership(userId, true)
    }

    revalidatePath('/admin/tutores')
    return { ok: true, message: 'Tutor creado correctamente.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido crear el tutor.' }
  }
}

export async function createMemberAction(
  _prev: TutorSocioActionState,
  formData: FormData,
): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const parsed = memberSchema.safeParse({
    id: formData.get('id') || undefined,
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
  })

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }

  try {
    if (parsed.data.id) {
      const supabase = createAdminClient()
      const email = normalizeEmail(parsed.data.email)
      const { error: authError } = await supabase.auth.admin.updateUserById(parsed.data.id, {
        email,
        email_confirm: true,
        user_metadata: {
          first_name: parsed.data.nombre,
          last_name: parsed.data.apellidos,
        },
      })
      if (authError) throw new Error(authError.message)

      const { error } = await supabase
        .from('profiles')
        .update({
          email,
          first_name: parsed.data.nombre,
          last_name: parsed.data.apellidos,
          is_paid_member: true,
          membership_paid_at: new Date().toISOString(),
        })
        .eq('id', parsed.data.id)
      if (error) throw new Error(error.message)
      await setUserMembership(parsed.data.id, true)
      revalidatePath('/admin/tutores')
      return { ok: true, message: 'Socio actualizado correctamente.' }
    }

    const userId = await createAuthProfile(parsed.data)
    await setUserMembership(userId, true)
    revalidatePath('/admin/tutores')
    return { ok: true, message: 'Socio creado correctamente.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido crear el socio.' }
  }
}

export async function toggleTutorMemberAction(userId: string, isSocio: boolean): Promise<TutorSocioActionState> {
  await requireAdminAction()

  try {
    await setUserMembership(userId, isSocio)
    revalidatePath('/admin/tutores')
    return { ok: true, message: isSocio ? 'Tutor marcado como socio.' : 'Tutor desmarcado como socio.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido actualizar el tutor.' }
  }
}

export async function approveTutorAction(guardianId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('guardians')
    .update({ is_approved: true, approval_status: 'approved' })
    .eq('id', guardianId)

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor aprobado correctamente.' }
}

export async function rejectTutorAction(guardianId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('guardians')
    .update({ is_approved: false, approval_status: 'rejected' })
    .eq('id', guardianId)

  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor rechazado correctamente.' }
}

export async function deleteTutorAction(guardianId: string, userId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor eliminado correctamente.' }
}

export async function deleteMemberAction(userId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Socio eliminado correctamente.' }
}

export async function assignTutorFeeAction(
  _prev: TutorFeeAssignmentActionState,
  formData: FormData,
): Promise<TutorFeeAssignmentActionState> {
  const admin = await requireAdminAction()
  const parsed = tutorFeeAssignmentSchema.safeParse({
    guardianId: formData.get('guardianId'),
    feeTemplateId: formData.get('feeTemplateId'),
    chargeDay: formData.get('chargeDay'),
    startMonth: formData.get('startMonth'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cuota.' }
  }

  const supabase = createAdminClient()
  const values = parsed.data
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

  const frequencyMonths = fee.split_payment ? getFrequencyMonths(fee.charge_frequency) : 1
  const baseAmount = Math.floor(fee.total_amount_cents / totalCharges)
  const remainder = fee.total_amount_cents % totalCharges
  const charges = Array.from({ length: totalCharges }, (_, index) => ({
    assignment_id: '',
    guardian_id: values.guardianId,
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
      guardian_id: values.guardianId,
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
      guardianId: values.guardianId,
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

  revalidatePath('/admin/tutores')
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Cuota asignada y cobros programados en Stripe correctamente.' }
}

export async function cancelTutorFeeAssignmentAction(assignmentId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const parsed = z.string().uuid().safeParse(assignmentId)
  if (!parsed.success) {
    return { ok: false, message: 'No se ha podido identificar la cuota asignada.' }
  }

  const supabase = createAdminClient()
  const { data: assignment, error: findError } = await supabase
    .from('tutor_fee_assignments')
    .select('stripe_subscription_schedule_id, stripe_subscription_id')
    .eq('id', parsed.data)
    .maybeSingle()

  if (findError) return { ok: false, message: findError.message }

  try {
    await cancelTutorFeeStripeSchedule({
      scheduleId: assignment?.stripe_subscription_schedule_id ?? null,
      subscriptionId: assignment?.stripe_subscription_id ?? null,
    })
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido cancelar la programación en Stripe.',
    }
  }

  const { error } = await supabase
    .from('tutor_fee_assignments')
    .delete()
    .eq('id', parsed.data)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/tutores')
  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Cuota asignada eliminada correctamente.' }
}

async function setUserMembership(userId: string, isSocio: boolean) {
  const supabase = createAdminClient()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_paid_member: isSocio,
      membership_paid_at: isSocio ? new Date().toISOString() : null,
    })
    .eq('id', userId)
  if (profileError) throw new Error(profileError.message)

  if (isSocio) {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'member' })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'member')
    if (error) throw new Error(error.message)
  }
}
