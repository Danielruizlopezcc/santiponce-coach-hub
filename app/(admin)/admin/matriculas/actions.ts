'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { MATRICULA_IMPORTE } from '@/lib/club'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireAdmin()
  return createAdminClient()
}

export async function confirmPaymentAction(athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, guardian_id, season_id')
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

  await supabase.from('payments').insert({
    user_id: guardian.user_id,
    guardian_id: athlete.guardian_id,
    athlete_id: athlete.id,
    season_id: athlete.season_id,
    payment_type: 'enrollment',
    provider: 'manual',
    status: 'paid',
    amount_cents: MATRICULA_IMPORTE * 100,
    currency: 'eur',
    description: 'Confirmación manual de matrícula',
    metadata: { source: 'admin-manual-confirmation' },
    paid_at: new Date().toISOString(),
  })

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/pagos')
}

export async function rejectEnrollmentAction(athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
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

  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/pagos')
}
