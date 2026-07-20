export type AdminRole = 'admin' | 'sports_coordinator'

export const ADMIN_PORTAL_ROLES: AdminRole[] = ['admin', 'sports_coordinator']

const SPORTS_COORDINATOR_ALLOWED_PATHS = [
  '/admin/entrenadores',
  '/admin/deportistas',
  '/admin/equipos',
  '/admin/calendario',
  '/admin/estadisticas',
  '/admin/temporadas',
  '/admin/categorias',
  '/admin/tutores',
] as const

export function getAdminRoleLabel(role: AdminRole) {
  return role === 'admin' ? 'Administrador General' : 'Coordinador deportivo'
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  if (role === 'admin') return true

  return SPORTS_COORDINATOR_ALLOWED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function getDefaultAdminPath(role: AdminRole) {
  return role === 'admin' ? '/admin' : '/admin/entrenadores'
}
