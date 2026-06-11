import type { LucideIcon } from 'lucide-react'
import { ClipboardList, House, User, Users } from 'lucide-react'

export const CLUB = {
  shortName: 'CD Santiponce',
  legalName: 'Club Deportivo Santiponce',
  season: '2026/2027',
  crest: '/images/escudo-santiponce.jpg',
} as const

export type NavItem = {
  label: string
  href: string
}

export type PrivateNavItem = NavItem & {
  icon: LucideIcon
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
  { label: 'Inicio', href: '/inicio', icon: House },
  { label: 'Perfil', href: '/perfil', icon: User },
  { label: 'Mis deportistas', href: '/mis-deportistas', icon: Users },
  { label: 'Matriculación', href: '/matriculacion', icon: ClipboardList },
]

// Usuario mock mínimo para mostrar en el header privado.
export const MOCK_USER = {
  name: 'Familia García',
  email: 'familia.garcia@ejemplo.com',
  initials: 'FG',
} as const
