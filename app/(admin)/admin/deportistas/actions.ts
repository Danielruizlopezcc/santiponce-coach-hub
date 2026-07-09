'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSportsAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const ATHLETE_BUCKET_NAME = 'athletes'

async function getAdminSupabase() {
  await requireSportsAdminAction()
  return createAdminClient()
}

function normalizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildAthletePhotoPath(athleteId: string, file: File) {
  const safeName = normalizeFileName(file.name)
  return `deportistas/${athleteId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`
}

function getStoragePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${ATHLETE_BUCKET_NAME}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '')
}

async function removeAthletePhoto(supabase: ReturnType<typeof createAdminClient>, photoUrl: string | null | undefined) {
  const path = getStoragePathFromPublicUrl(photoUrl)
  if (!path) return
  await supabase.storage.from(ATHLETE_BUCKET_NAME).remove([path])
}

async function guardianAllowsAthletePhoto(supabase: ReturnType<typeof createAdminClient>, guardianId: string | null | undefined) {
  if (!guardianId) return false

  const { data: imageDocument, error: documentError } = await supabase
    .from('consent_documents')
    .select('id')
    .eq('code', 'image_rights')
    .maybeSingle()

  if (documentError || !imageDocument) return false

  const { data: consent, error: consentError } = await supabase
    .from('consents')
    .select('accepted, revoked_at')
    .eq('guardian_id', guardianId)
    .eq('document_id', imageDocument.id)
    .maybeSingle()

  if (consentError || !consent) return false
  return Boolean(consent.accepted && !consent.revoked_at)
}

async function uploadAthletePhoto(supabase: ReturnType<typeof createAdminClient>, athleteId: string, image: File) {
  if (!image || !(image instanceof File) || image.size === 0) return null
  if (!image.type.startsWith('image/')) {
    throw new Error('Debes subir una imagen válida para el deportista.')
  }

  const { error: bucketError } = await supabase.storage.createBucket(ATHLETE_BUCKET_NAME, {
    public: true,
  })

  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(bucketError.message)
  }

  const imagePath = buildAthletePhotoPath(athleteId, image)
  const { error: uploadError } = await supabase.storage
    .from(ATHLETE_BUCKET_NAME)
    .upload(imagePath, image, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrlData } = supabase.storage
    .from(ATHLETE_BUCKET_NAME)
    .getPublicUrl(imagePath)

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la foto.')
  }

  return publicUrlData.publicUrl
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
  const photo = formData.get('photo') as File | null
  const photoProvided = photo instanceof File && photo.size > 0

  if (photoProvided && !(await guardianAllowsAthletePhoto(supabase, values.guardianId))) {
    return { ok: false, message: 'No puedes subir foto si el tutor no tiene aceptado el consentimiento de imagen.' }
  }

  const { data: createdAthlete, error } = await supabase.from('athletes').insert({
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
  }).select('id').single()

  if (error) return { ok: false, message: error.message }

  if (photoProvided && createdAthlete?.id) {
    try {
      const photoUrl = await uploadAthletePhoto(supabase, createdAthlete.id, photo)
      if (photoUrl) {
        const { error: photoError } = await supabase
          .from('athletes')
          .update({ photo_url: photoUrl })
          .eq('id', createdAthlete.id)
        if (photoError) throw new Error(photoError.message)
      }
    } catch (error) {
      await supabase.from('athletes').delete().eq('id', createdAthlete.id)
      return { ok: false, message: error instanceof Error ? error.message : 'No se pudo subir la foto del deportista.' }
    }
  }

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/matriculas')
  revalidatePath('/admin/equipos')
  return { ok: true, message: 'Deportista creado correctamente.' }
}

export async function updateAthletePhotoAction(formData: FormData): Promise<CreateAthleteState> {
  await requireSportsAdminAction()
  const athleteId = formData.get('athleteId')
  const photo = formData.get('photo') as File | null

  if (!athleteId || typeof athleteId !== 'string') {
    return { ok: false, message: 'No se ha podido identificar el deportista.' }
  }

  if (!photo || !(photo instanceof File) || photo.size === 0) {
    return { ok: false, message: 'Selecciona una foto para subir.' }
  }

  const supabase = createAdminClient()
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id, guardian_id, photo_url')
    .eq('id', athleteId)
    .maybeSingle()

  if (athleteError || !athlete) {
    return { ok: false, message: athleteError?.message ?? 'No se ha encontrado el deportista.' }
  }

  if (!(await guardianAllowsAthletePhoto(supabase, athlete.guardian_id))) {
    return { ok: false, message: 'No puedes subir foto si el tutor no tiene aceptado el consentimiento de imagen.' }
  }

  try {
    const photoUrl = await uploadAthletePhoto(supabase, athlete.id, photo)
    if (!photoUrl) return { ok: false, message: 'Selecciona una foto para subir.' }

    const { error } = await supabase
      .from('athletes')
      .update({ photo_url: photoUrl })
      .eq('id', athlete.id)

    if (error) throw new Error(error.message)
    await removeAthletePhoto(supabase, athlete.photo_url)
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar la foto.' }
  }

  revalidatePath('/admin/deportistas')
  revalidatePath('/admin/equipos')
  return { ok: true, message: 'Foto del deportista actualizada correctamente.' }
}
