import 'server-only'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/iniciar-sesion')
  }

  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (error || !data) {
    redirect('/app')
  }

  return user
}

export async function requireAdminAction() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión como administrador.')
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (error || !data) {
    throw new Error('No tienes permisos de administrador para realizar esta acción.')
  }

  return user
}
