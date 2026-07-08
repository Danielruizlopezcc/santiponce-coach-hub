'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSportsAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireSportsAdminAction()
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

export async function createAthleteAction(
  _prev: CreateAthleteState,
  formData: FormData,
): Promise<CreateAthleteState> {
  await requireSportsAdminAction()
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
