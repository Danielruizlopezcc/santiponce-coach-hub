'use server'

import { revalidatePath } from 'next/cache'
import { requireSportsAdminAction } from '@/lib/auth'
import type { PlayerPosition } from '@/lib/private-app-shared'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireSportsAdminAction()
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
  await supabase.from('athletes').update({ assigned_team_id: null, position: null }).eq('assigned_team_id', id)
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw new Error(error.message)
  teamPaths()
}

const VALID_POSITIONS: PlayerPosition[] = ['goalkeeper', 'defender', 'midfielder', 'forward']

export async function assignAthleteAction(
  teamId: string,
  athleteId: string,
  position: PlayerPosition,
): Promise<void> {
  if (!VALID_POSITIONS.includes(position)) {
    throw new Error('Selecciona una posición válida para el jugador.')
  }

  const supabase = await getAdminSupabase()
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, category_id, season_id')
    .eq('id', teamId)
    .maybeSingle()

  if (teamError || !team) {
    throw new Error(teamError?.message ?? 'No se ha encontrado el equipo.')
  }

  const { data: assignedAthlete, error } = await supabase
    .from('athletes')
    .update({ assigned_team_id: teamId, position })
    .select('id')
    .eq('id', athleteId)
    .eq('season_id', team.season_id)
    .eq('requested_category_id', team.category_id)
    .is('assigned_team_id', null)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!assignedAthlete) {
    throw new Error('El deportista ya no está disponible para este equipo.')
  }
  teamPaths(teamId)
}

export async function removeAthleteAction(teamId: string, athleteId: string): Promise<void> {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ assigned_team_id: null, position: null })
    .eq('id', athleteId)
    .eq('assigned_team_id', teamId)
  if (error) throw new Error(error.message)
  teamPaths(teamId)
}
