'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  normalizeDocument,
  normalizeEmail,
  normalizeOptionalEmail,
  normalizeOptionalPhone,
  normalizePhone,
} from '@/lib/private-app-shared'
import {
  deportistaSchema,
  tutorProfileSchema,
  type DeportistaFormValues,
} from '@/lib/registro-schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
  success: boolean
  message?: string
}

const memberProfileSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre válido').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos').max(80),
  email: z.string().trim().email('Correo electrónico no válido').max(120),
})

function mapDeportistaToAthleteRow(
  values: DeportistaFormValues,
  seasonId: string,
  options: { includeEnrollmentState?: boolean } = {},
) {
  const row = {
    first_name: values.nombre,
    last_name: values.apellidos,
    birth_date: values.fechaNacimiento,
    identification_type: values.tipoIdentificacion,
    identification_value: normalizeDocument(values.documento),
    email: normalizeOptionalEmail(values.email),
    mobile_phone: normalizeOptionalPhone(values.telefono),
    health_notes: values.alergias || null,
    has_siblings_in_club: values.tieneHermanos === 'si',
    sibling_name: values.nombreHermano || null,
    season_id: seasonId,
  }

  if (options.includeEnrollmentState) {
    return {
      ...row,
      status: 'pendiente' as const,
    }
  }

  return row
}

export async function updateTutorProfileAction(rawValues: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = tutorProfileSchema.safeParse(rawValues)

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message }
  }

  const values = parsed.data
  const supabase = await createClient()
  const email = normalizeEmail(values.email)
  const phone = normalizePhone(values.telefono)
  const document = normalizeDocument(values.documento)

  const [{ data: ownGuardian }, { data: conflictingProfiles }, { data: conflictingGuardians }] =
    await Promise.all([
      supabase.from('guardians').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('id, email').eq('email', email),
      supabase
        .from('guardians')
        .select('id, phone, document_id')
        .or(`phone.eq.${phone},document_id.eq.${document}`),
    ])

  if (
    conflictingProfiles?.some((profile) => profile.id !== user.id) ||
    conflictingGuardians?.some((guardian) => guardian.id !== ownGuardian?.id)
  ) {
    return {
      success: false,
      message: 'Ya existe otro usuario con alguno de esos datos de contacto o documento.',
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, message: profileError.message }
  }

  const { error: guardianError } = await supabase
    .from('guardians')
    .update({
      first_name: values.nombre,
      last_name: values.apellidos,
      phone,
      document_id: document,
      address_line: values.direccion,
      postal_code: values.codigoPostal,
      province: values.provincia,
      city: values.ciudad,
      country: values.pais,
      payment_preference: values.preferenciaPago,
    })
    .eq('user_id', user.id)

  if (guardianError) {
    return { success: false, message: guardianError.message }
  }

  revalidatePath('/app')
  revalidatePath('/app/perfil')
  revalidatePath('/app/deportistas')

  return { success: true }
}

export async function updateMemberProfileAction(rawValues: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = memberProfileSchema.safeParse(rawValues)

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message }
  }

  const values = parsed.data
  const email = normalizeEmail(values.email)
  const supabase = await createClient()
  const { data: conflictingProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)

  if (conflictingProfiles?.some((profile) => profile.id !== user.id)) {
    return { success: false, message: 'Ya existe otro usuario con ese correo electrónico.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/app')
  revalidatePath('/app/perfil')

  return { success: true }
}

export async function saveAthleteAction(
  rawValues: unknown,
  athleteId?: string,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = deportistaSchema.safeParse(rawValues)

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const [{ data: guardian }, { data: activeSeason }] = await Promise.all([
    supabase.from('guardians').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('seasons').select('id').eq('is_active', true).maybeSingle(),
  ])

  if (!guardian || !activeSeason) {
    return { success: false, message: 'No se ha encontrado el tutor o la temporada activa.' }
  }

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('name', parsed.data.categoria)
    .maybeSingle()

  if (!category) {
    return { success: false, message: 'La categoría seleccionada no existe en Supabase.' }
  }

  const athletePayload = {
    guardian_id: guardian.id,
    requested_category_id: category.id,
    ...mapDeportistaToAthleteRow(parsed.data, activeSeason.id, {
      includeEnrollmentState: !athleteId,
    }),
  }

  if (athleteId) {
    const { data: existingAthlete, error: existingAthleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('guardian_id', guardian.id)
      .maybeSingle()

    if (existingAthleteError) {
      return { success: false, message: existingAthleteError.message }
    }

    if (!existingAthlete) {
      return { success: false, message: 'No tienes permiso para editar este deportista.' }
    }
  }

  const query = athleteId
    ? createAdminClient().from('athletes').update(athletePayload).eq('id', athleteId).eq('guardian_id', guardian.id)
    : supabase.from('athletes').insert(athletePayload)

  const { error } = await query

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/app')
  revalidatePath('/app/deportistas')
  if (athleteId) {
    revalidatePath(`/app/deportistas/${athleteId}`)
  }

  return { success: true }
}

export async function startEnrollmentAction(athleteId: string): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: guardian } = await supabase
    .from('guardians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!guardian) {
    return { success: false, message: 'No se ha encontrado el tutor asociado.' }
  }

  const { error } = await supabase
    .from('athletes')
    .update({ status: 'en_revision' })
    .eq('id', athleteId)
    .eq('guardian_id', guardian.id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/app')
  revalidatePath('/app/matriculacion')
  revalidatePath('/app/deportistas')

  return { success: true }
}

export async function requestTutorApprovalAgainAction(): Promise<void> {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('guardians')
    .update({ is_approved: false, approval_status: 'pending' })
    .eq('user_id', user.id)
    .eq('approval_status', 'rejected')

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/app')
  revalidatePath('/admin/tutores')
}
