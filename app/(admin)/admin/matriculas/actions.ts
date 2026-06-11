'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireAdmin()
  return createAdminClient()
}

export async function confirmPaymentAction(athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ status: 'matriculado' })
    .eq('id', athleteId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
}

export async function rejectEnrollmentAction(athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ status: 'pendiente' })
    .eq('id', athleteId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/deportistas')
}
