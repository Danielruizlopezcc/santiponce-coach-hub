export const CLUB = {
  shortName: 'CD Santiponce',
  legalName: 'Club Deportivo Santiponce',
  season: '2026/2027',
  crest: '/images/escudo-santiponce.png',
} as const

export const MEMBERSHIP_IMPORTE = 20
export const MATRICULA_IMPORTE = 50

export type NavItem = {
  label: string
  href: string
}

export type PrivateNavIcon =
  | 'house'
  | 'user'
  | 'users'
  | 'shield'
  | 'award'
  | 'newspaper'
  | 'clipboard-list'

export type PrivateNavItem = NavItem & {
  icon: PrivateNavIcon
  requiresPaidSocio?: boolean
}

export const PUBLIC_NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Calendario', href: '/calendario' },
  { label: 'Equipos', href: '/equipos' },
  { label: 'Club', href: '/club' },
  { label: 'Patrocinadores', href: '/patrocinadores' },
  { label: 'Registrarse', href: '/registro' },
  { label: 'Iniciar sesión', href: '/iniciar-sesion' },
]

export const LEGAL_NAV: NavItem[] = [
  { label: 'Política de privacidad', href: '/legal/privacidad' },
  { label: 'Aviso legal', href: '/legal/aviso-legal' },
  { label: 'Política de cookies', href: '/legal/cookies' },
  { label: 'Condiciones de matrícula', href: '/legal/condiciones-matricula' },
  { label: 'Pagos y devoluciones', href: '/legal/pagos-devoluciones' },
]

export const PRIVATE_NAV: PrivateNavItem[] = [
  { label: 'Inicio', href: '/app', icon: 'house' },
  { label: 'Perfil', href: '/app/perfil', icon: 'user' },
  { label: 'Noticias', href: '/app/noticias', icon: 'newspaper' },
  { label: 'Mis deportistas', href: '/app/deportistas', icon: 'users' },
  { label: 'Equipos', href: '/app/equipos', icon: 'shield' },
  { label: 'Patrocinadores', href: '/app/patrocinadores', icon: 'award' },
  { label: 'Matriculación', href: '/app/matriculacion', icon: 'clipboard-list' },
]

export function getPrivateNavItems({
  hasGuardian = false,
  isPaidSocio = false,
}: {
  hasGuardian?: boolean
  isPaidSocio?: boolean
} = {}): PrivateNavItem[] {
  const baseItems = PRIVATE_NAV.filter((item) =>
    item.href === '/app' ||
    item.href === '/app/perfil' ||
    item.href === '/app/noticias' ||
    item.href === '/app/equipos' ||
    item.href === '/app/patrocinadores',
  )

  if (hasGuardian) {
    return [
      ...baseItems,
      PRIVATE_NAV.find((item) => item.href === '/app/deportistas')!,
      PRIVATE_NAV.find((item) => item.href === '/app/matriculacion')!,
    ]
  }

  return baseItems
}
