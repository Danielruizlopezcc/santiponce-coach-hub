'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
