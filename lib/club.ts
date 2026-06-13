import { Award, ClipboardList, House, User, Users } from 'lucide-react'

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
  | 'award'
  | 'clipboard-list'

export type PrivateNavItem = NavItem & {
  icon: PrivateNavIcon
  requiresPaidSocio?: boolean
}

export const PUBLIC_NAV: NavItem[] = [
  { label: 'Inicio', href: '/' },
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
  { label: 'Mis deportistas', href: '/app/deportistas', icon: 'users' },
  { label: 'Patrocinadores', href: '/app/patrocinadores', icon: 'award', requiresPaidSocio: true },
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
    item.href === '/app' || item.href === '/app/perfil' || item.href === '/app/patrocinadores',
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
