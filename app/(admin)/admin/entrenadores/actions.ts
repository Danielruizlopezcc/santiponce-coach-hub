'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
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

export async function createCoachAction(
  _prev: CoachActionState,
  formData: FormData,
): Promise<CoachActionState> {
  await requireAdminAction()

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
