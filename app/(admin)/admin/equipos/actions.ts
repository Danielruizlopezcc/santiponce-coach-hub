'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireAdmin()
  return createAdminClient()
}

function teamPaths(id?: string) {
  revalidatePath('/admin/equipos')
  revalidatePath('/admin/deportistas')
  if (id) revalidatePath(`/admin/equipos/${id}`)
}

export async function createTeamAction(
  name: string,
  categoryId: string,
  seasonId: string,
  isActive: boolean,
  notes: string,
): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('teams')
    .insert({ name, category_id: categoryId, season_id: seasonId, is_active: isActive, notes: notes || null })
  if (error) throw new Error(error.message)
  teamPaths()
}

export async function updateTeamAction(
  id: string,
  name: string,
  categoryId: string,
  seasonId: string,
  isActive: boolean,
  notes: string,
): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('teams')
    .update({ name, category_id: categoryId, season_id: seasonId, is_active: isActive, notes: notes || null })
    .eq('id', id)
  if (error) throw new Error(error.message)
  teamPaths(id)
}

export async function deleteTeamAction(id: string): Promise<void> {
  const supabase = await getAdminSupabase()
  // Remove team from all athletes first
  await supabase.from('athletes').update({ assigned_team_id: null }).eq('assigned_team_id', id)
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw new Error(error.message)
  teamPaths()
}

export async function assignAthleteAction(teamId: string, athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ assigned_team_id: teamId })
    .eq('id', athleteId)
  if (error) throw new Error(error.message)
  teamPaths(teamId)
}

export async function removeAthleteAction(teamId: string, athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ assigned_team_id: null })
    .eq('id', athleteId)
    .eq('assigned_team_id', teamId)
  if (error) throw new Error(error.message)
  teamPaths(teamId)
}
