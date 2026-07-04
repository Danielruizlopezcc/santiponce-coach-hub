import 'server-only'

import { redirect } from 'next/navigation'
import {
  ADMIN_PORTAL_ROLES,
  type AdminRole,
} from '@/lib/admin-permissions'
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
    .in('role', ADMIN_PORTAL_ROLES)

  if (error || !data?.length) {
    redirect('/app')
  }

  const role = data.some((row) => row.role === 'admin') ? 'admin' : 'sports_coordinator'
  return { user, role: role as AdminRole }
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

export async function requireSportsAdminAction() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.')
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ADMIN_PORTAL_ROLES)

  if (error || !data?.length) {
    throw new Error('No tienes permisos para realizar esta acción.')
  }

  return user
}

export async function requireCoach() {
  const user = await requireUser()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'coach')
    .maybeSingle()

  if (error || !data) {
    redirect('/app')
  }

  return user
}

export async function requireCoachAction() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión como entrenador.')
  }

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'coach')
    .maybeSingle()

  if (error || !data) {
    throw new Error('No tienes permisos de entrenador para realizar esta acción.')
  }

  return user
}
