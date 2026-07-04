'use server'

import { ADMIN_PORTAL_ROLES } from '@/lib/admin-permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type LoginActionState =
  | { ok: false; message: string; targetPath?: never }
  | { ok: true; message: string; targetPath: string }

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, message: 'Introduce tu correo y contraseña.' }
  }

  let targetPath = '/app'

  try {
    const supabase = await createClient()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.user) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' }
    }

    const adminSupabase = createAdminClient()
    const { data: roles, error: rolesError } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id)

    if (rolesError) {
      return { ok: false, message: 'No se han podido comprobar tus permisos. Inténtalo de nuevo.' }
    }

    const roleNames = new Set((roles ?? []).map((role) => role.role))

    if (ADMIN_PORTAL_ROLES.some((role) => roleNames.has(role))) {
      targetPath = '/admin'
    } else if (roleNames.has('coach')) {
      targetPath = '/entrenador/calendario'
    }
  } catch {
    return {
      ok: false,
      message: 'No se ha podido conectar con Supabase. Revisa la conexión e inténtalo de nuevo.',
    }
  }

  return { ok: true, message: '', targetPath }
}
