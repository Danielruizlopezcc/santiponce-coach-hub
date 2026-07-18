'use server'

import { revalidatePath } from 'next/cache'
import { createAdminAuditLog } from '@/lib/audit'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEnrollmentAmountCentsForCategory } from '@/lib/stripe'

async function getAdminSupabase() {
  const admin = await requireAdminAction()
  return { admin, supabase: createAdminClient() }
}

export async function confirmPaymentAction(athleteId: string): Promise<void> {
  const { admin, supabase } = await getAdminSupabase()
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, guardian_id, season_id, requested_category_id')
    .eq('id', athleteId)
    .maybeSingle()

  if (athleteError || !athlete) throw new Error(athleteError?.message ?? 'No se ha encontrado el deportista.')

  const { data: guardian, error: guardianError } = await supabase
    .from('guardians')
    .select('user_id')
    .eq('id', athlete.guardian_id)
    .maybeSingle()

  if (guardianError || !guardian) throw new Error(guardianError?.message ?? 'No se ha encontrado el tutor.')

  const { error } = await supabase
    .from('athletes')
    .update({ status: 'matriculado' })
    .eq('id', athleteId)
  if (error) throw new Error(error.message)

  const enrollmentAmountCents = await getEnrollmentAmountCentsForCategory(athlete.requested_category_id)

  await supabase.from('payments').insert({
    user_id: guardian.user_id,
    guardian_id: athlete.guardian_id,
    athlete_id: athlete.id,
    season_id: athlete.season_id,
    payment_type: 'enrollment',
    provider: 'manual',
    status: 'paid',
    amount_cents: enrollmentAmountCents,
    currency: 'eur',
    description: 'Confirmación manual de matrícula',
    metadata: { source: 'admin-manual-confirmation' },
    paid_at: new Date().toISOString(),
  })

  await createAdminAuditLog({
    actor: admin,
    action: 'enrollment.confirm',
    entityType: 'athlete',
    entityId: athlete.id,
    summary: 'Confirmó manualmente una matrícula y registró el pago.',
    metadata: { guardianId: athlete.guardian_id, seasonId: athlete.season_id },
  })

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/pagos')
}

export async function rejectEnrollmentAction(athleteId: string): Promise<void> {
  const { admin, supabase } = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ status: 'pendiente' })
    .eq('id', athleteId)
  if (error) throw new Error(error.message)

  await supabase
    .from('payments')
    .update({ status: 'canceled' })
    .eq('athlete_id', athleteId)
    .eq('status', 'pending')

  await createAdminAuditLog({
    actor: admin,
    action: 'enrollment.reject',
    entityType: 'athlete',
    entityId: athleteId,
    summary: 'Rechazó una matrícula y canceló pagos pendientes asociados.',
  })

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/pagos')
}

export async function updateEnrollmentStatusAction(
  athleteId: string,
  status: 'pendiente' | 'matriculado' | 'en_revision',
): Promise<void> {
  const { admin, supabase } = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ status })
    .eq('id', athleteId)

  if (error) throw new Error(error.message)

  await createAdminAuditLog({
    actor: admin,
    action: 'enrollment.status',
    entityType: 'athlete',
    entityId: athleteId,
    summary: `Cambió el estado de matrícula a ${status}.`,
    metadata: { status },
  })

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
}

export async function deleteEnrollmentAction(athleteId: string): Promise<void> {
  const { admin, supabase } = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', athleteId)

  if (error) throw new Error(error.message)

  await createAdminAuditLog({
    actor: admin,
    action: 'enrollment.delete',
    entityType: 'athlete',
    entityId: athleteId,
    summary: 'Eliminó una matrícula/deportista desde el panel.',
  })

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/pagos')
}
