'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createTutorFeeStripeSchedule,
  validateFirstDueDate,
  type TutorFeeChargeDraft,
} from '@/lib/tutor-fee-billing'

async function getAdminSupabase() {
  await requireAdminAction()
  return createAdminClient()
}

export async function updateAthleteRequestedCategoryAction(
  athleteId: string,
  categoryId: string,
): Promise<void> {
  const supabase = await getAdminSupabase()

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle()

  if (categoryError || !category) {
    throw new Error(categoryError?.message ?? 'No se ha encontrado la categoría.')
  }

  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, assigned_team_id')
    .eq('id', athleteId)
    .maybeSingle()

  if (athleteError || !athlete) {
    throw new Error(athleteError?.message ?? 'No se ha encontrado el deportista.')
  }

  let assignedTeamId: string | null = athlete.assigned_team_id

  if (assignedTeamId) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('category_id')
      .eq('id', assignedTeamId)
      .maybeSingle()

    if (teamError) throw new Error(teamError.message)
    if (!team || team.category_id !== categoryId) {
      assignedTeamId = null
    }
  }

  const updates: {
    requested_category_id: string
    assigned_team_id: string | null
    position?: null
  } = {
    requested_category_id: categoryId,
    assigned_team_id: assignedTeamId,
  }

  if (!assignedTeamId) {
    updates.position = null
  }

  const { error } = await supabase
    .from('athletes')
    .update(updates)
    .eq('id', athleteId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/equipos')
  if (athlete.assigned_team_id) {
    revalidatePath(`/admin/equipos/${athlete.assigned_team_id}`)
  }
}

export async function updateAthleteAdminAction(input: {
  athleteId: string
  guardianId: string | null
  categoryId: string
  assignedTeamId: string | null
  seasonId: string
  status: 'pendiente' | 'matriculado' | 'en_revision'
}): Promise<void> {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .from('athletes')
    .update({
      guardian_id: input.guardianId,
      requested_category_id: input.categoryId,
      assigned_team_id: input.assignedTeamId,
      season_id: input.seasonId,
      status: input.status,
      position: input.assignedTeamId ? undefined : null,
    })
    .eq('id', input.athleteId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/equipos')
}

export async function deleteAthleteAction(athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('athletes').delete().eq('id', athleteId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/equipos')
  revalidatePath('/admin/pagos')
}

const createAthleteSchema = z.object({
  guardianId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
  nombre: z.string().trim().min(2, 'Introduce el nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  fechaNacimiento: z.string().min(1, 'Introduce la fecha de nacimiento.'),
  documento: z.string().trim().min(3, 'Introduce documento.').max(40),
  categoryId: z.string().uuid('Selecciona categoría.'),
  assignedTeamId: z.string().optional(),
  seasonId: z.string().uuid('Selecciona temporada.'),
  status: z.enum(['pendiente', 'matriculado', 'en_revision']),
})

export type CreateAthleteState = {
  ok: boolean
  message: string
}

export type AthleteFeeAssignmentState = {
  ok: boolean
  message: string
}

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

export async function createAthleteAction(
  _prev: CreateAthleteState,
  formData: FormData,
): Promise<CreateAthleteState> {
  await requireAdminAction()
  const parsed = createAthleteSchema.safeParse({
    guardianId: formData.get('guardianId'),
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    fechaNacimiento: formData.get('fechaNacimiento'),
    documento: formData.get('documento'),
    categoryId: formData.get('categoryId'),
    assignedTeamId: formData.get('assignedTeamId') || undefined,
    seasonId: formData.get('seasonId'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }
  }

  const values = parsed.data
  const supabase = createAdminClient()
  const { error } = await supabase.from('athletes').insert({
    guardian_id: values.guardianId || null,
    first_name: values.nombre,
    last_name: values.apellidos,
    birth_date: values.fechaNacimiento,
    identification_type: 'Otro',
    identification_value: values.documento.trim().toUpperCase(),
    requested_category_id: values.categoryId,
    assigned_team_id: values.assignedTeamId || null,
    season_id: values.seasonId,
    status: values.status,
    has_siblings_in_club: false,
  })

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/equipos')
  return { ok: true, message: 'Deportista creado correctamente.' }
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
