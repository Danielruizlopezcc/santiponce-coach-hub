'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { normalizeEmail } from '@/lib/private-app-shared'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminManagerActionState = {
  ok: boolean
  message: string
}

const createManagerSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  email: z.string().trim().email('Correo no válido.').max(120),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
})

const updateManagerSchema = createManagerSchema.omit({ password: true }).extend({
  adminId: z.string().uuid('No se ha podido identificar el administrador.'),
})

async function countAdmins() {
  const { count, error } = await createAdminClient()
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'admin')

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function createAdminManagerAction(
  _prev: AdminManagerActionState,
  formData: FormData,
): Promise<AdminManagerActionState> {
  await requireAdminAction()

  const parsed = createManagerSchema.safeParse({
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }
  }

  const values = parsed.data
  const email = normalizeEmail(values.email)
  const supabase = createAdminClient()
  let createdUserId: string | null = null

  try {
    const { data: existingProfile, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)
    if (existingProfile) return { ok: false, message: 'Ya existe una cuenta con ese correo.' }

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
      throw new Error(error?.message ?? 'No se ha podido crear el administrador.')
    }
    createdUserId = data.user.id

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: createdUserId,
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })
    if (profileError) throw new Error(profileError.message)

    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: createdUserId, role: 'admin' }, { onConflict: 'user_id,role' })
    if (roleError) throw new Error(roleError.message)

    revalidatePath('/admin/administradores')
    revalidatePath('/admin')
    return { ok: true, message: 'Administrador creado correctamente.' }
  } catch (error) {
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId)
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se ha podido crear el administrador.',
    }
  }
}

export async function updateAdminManagerAction(input: unknown): Promise<void> {
  await requireAdminAction()
  const parsed = updateManagerSchema.parse(input)
  const email = normalizeEmail(parsed.email)
  const supabase = createAdminClient()

  const { data: adminRole, error: roleLookupError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', parsed.adminId)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleLookupError) throw new Error(roleLookupError.message)
  if (!adminRole) throw new Error('No se ha encontrado el administrador.')

  const { data: conflictingProfile, error: conflictError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .neq('id', parsed.adminId)
    .maybeSingle()

  if (conflictError) throw new Error(conflictError.message)
  if (conflictingProfile) throw new Error('Ya existe otra cuenta con ese correo.')

  const { error: authError } = await supabase.auth.admin.updateUserById(parsed.adminId, {
    email,
    user_metadata: {
      first_name: parsed.nombre,
      last_name: parsed.apellidos,
    },
  })
  if (authError) throw new Error(authError.message)

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: parsed.adminId,
    email,
    first_name: parsed.nombre,
    last_name: parsed.apellidos,
  })
  if (profileError) throw new Error(profileError.message)

  revalidatePath('/admin/administradores')
  revalidatePath('/admin')
}

export async function deleteAdminManagerAction(adminId: string): Promise<void> {
  const currentUser = await requireAdminAction()
  const parsedAdminId = z.string().uuid('No se ha podido identificar el administrador.').parse(adminId)

  if (parsedAdminId === currentUser.id) {
    throw new Error('No puedes eliminar tu propio usuario administrador desde aquí.')
  }

  const totalAdmins = await countAdmins()
  if (totalAdmins <= 1) {
    throw new Error('Debe quedar al menos un administrador activo.')
  }

  const supabase = createAdminClient()
  const { data: adminRole, error: roleLookupError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', parsedAdminId)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleLookupError) throw new Error(roleLookupError.message)
  if (!adminRole) throw new Error('No se ha encontrado el administrador.')

  const { error } = await supabase.auth.admin.deleteUser(parsedAdminId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/administradores')
  revalidatePath('/admin')
}
