'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminAuditLog } from '@/lib/audit'
import { requireSportsAdminAction } from '@/lib/auth'
import { normalizeEmail } from '@/lib/private-app-shared'
import { createAdminClient } from '@/lib/supabase/admin'

export type CoachActionState = {
  ok: boolean
  message: string
}

const coachSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  email: z.string().trim().email('Correo no válido.').max(120),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  teamId: z.string().uuid('Selecciona un equipo válido.').optional(),
})

const updateCoachSchema = z.object({
  coachId: z.string().uuid('No se ha podido identificar el entrenador.'),
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  email: z.string().trim().email('Correo no válido.').max(120),
  teamId: z.string().uuid('Selecciona un equipo válido.').optional(),
})

export async function createCoachAction(
  _prev: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  const admin = await requireSportsAdminAction()

  const parsed = coachSchema.safeParse({
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
    password: formData.get('password'),
    teamId: formData.get('teamId') || undefined,
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }
  }

  const values = parsed.data
  const email = normalizeEmail(values.email)
  const supabase = createAdminClient()
  let createdUserId: string | null = null

  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return { ok: false, message: 'Ya existe una cuenta con ese correo.' }
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: values.password,
      email_confirm: true,
      user_metadata: {
        first_name: values.nombre,
        last_name: values.apellidos,
      },
    })

    if (error || !data.user) {
      throw new Error(error?.message ?? 'No se ha podido crear el usuario.')
    }
    createdUserId = data.user.id

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: createdUserId,
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })

    if (profileError) throw new Error(profileError.message)

    const { error: roleError } = await supabase.from('user_roles').upsert(
      {
        user_id: createdUserId,
        role: 'coach',
      },
      { onConflict: 'user_id,role' },
    )

    if (roleError) throw new Error(roleError.message)

    if (values.teamId) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', values.teamId)
        .maybeSingle()

      if (teamError || !team) {
        throw new Error('El equipo seleccionado no está disponible.')
      }

      const { error: assignmentError } = await supabase.from('coach_team_assignments').upsert(
        {
          coach_user_id: createdUserId,
          team_id: values.teamId,
        },
        { onConflict: 'coach_user_id' },
      )

      if (assignmentError) throw new Error(assignmentError.message)
    }

    await createAdminAuditLog({
      actor: admin,
      action: 'coach.create',
      entityType: 'profile',
      entityId: createdUserId,
      summary: `Creó el entrenador ${values.nombre} ${values.apellidos}.`,
      metadata: { email, teamId: values.teamId ?? null },
    })

    revalidatePath('/admin/entrenadores')
    return { ok: true, message: 'Entrenador creado correctamente.' }
  } catch (error) {
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId)
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido crear el entrenador.',
    }
  }
}

export async function updateCoachAction(input: unknown): Promise<void> {
  const admin = await requireSportsAdminAction()

  const parsed = updateCoachSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Revisa los datos.')
  }

  const values = parsed.data
  const email = normalizeEmail(values.email)
  const supabase = createAdminClient()

  const { data: conflictingProfile, error: conflictError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .neq('id', values.coachId)
    .maybeSingle()

  if (conflictError) throw new Error(conflictError.message)
  if (conflictingProfile) throw new Error('Ya existe otra cuenta con ese correo.')

  const { data: coachRole, error: roleLookupError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', values.coachId)
    .eq('role', 'coach')
    .maybeSingle()

  if (roleLookupError) throw new Error(roleLookupError.message)
  if (!coachRole) throw new Error('No se ha encontrado el entrenador.')

  if (values.teamId) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', values.teamId)
      .maybeSingle()

    if (teamError || !team) {
      throw new Error('El equipo seleccionado no está disponible.')
    }
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(values.coachId, {
    email,
    user_metadata: {
      first_name: values.nombre,
      last_name: values.apellidos,
    },
  })

  if (authError) throw new Error(authError.message)

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: values.coachId,
    email,
    first_name: values.nombre,
    last_name: values.apellidos,
  })

  if (profileError) throw new Error(profileError.message)

  if (values.teamId) {
    const { error: assignmentError } = await supabase.from('coach_team_assignments').upsert(
      {
        coach_user_id: values.coachId,
        team_id: values.teamId,
      },
      { onConflict: 'coach_user_id' },
    )

    if (assignmentError) throw new Error(assignmentError.message)
  } else {
    const { error: assignmentError } = await supabase
      .from('coach_team_assignments')
      .delete()
      .eq('coach_user_id', values.coachId)

    if (assignmentError) throw new Error(assignmentError.message)
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'coach.update',
    entityType: 'profile',
    entityId: values.coachId,
    summary: `Actualizó el entrenador ${values.nombre} ${values.apellidos}.`,
    metadata: { email, teamId: values.teamId ?? null },
  })

  revalidatePath('/admin/entrenadores')
}

export async function deleteCoachAction(coachId: string): Promise<void> {
  const admin = await requireSportsAdminAction()

  const parsedCoachId = z.string().uuid('No se ha podido identificar el entrenador.').parse(coachId)
  const supabase = createAdminClient()

  const { data: coachRole, error: roleLookupError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', parsedCoachId)
    .eq('role', 'coach')
    .maybeSingle()

  if (roleLookupError) throw new Error(roleLookupError.message)
  if (!coachRole) throw new Error('No se ha encontrado el entrenador.')

  const { error } = await supabase.auth.admin.deleteUser(parsedCoachId)
  if (error) throw new Error(error.message)

  await createAdminAuditLog({
    actor: admin,
    action: 'coach.delete',
    entityType: 'profile',
    entityId: parsedCoachId,
    summary: 'Eliminó un entrenador.',
  })

  revalidatePath('/admin/entrenadores')
}
