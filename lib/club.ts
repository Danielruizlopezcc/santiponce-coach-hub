import type { LucideIcon } from 'lucide-react'
import { Award, ClipboardList, House, User, Users } from 'lucide-react'

export const CLUB = {
  shortName: 'CD Santiponce',
  legalName: 'Club Deportivo Santiponce',
  season: '2026/2027',
  crest: '/images/escudo-santiponce.png',
} as const

export const MATRICULA_IMPORTE = 50

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
  { label: 'Inicio', href: '/app', icon: House },
  { label: 'Perfil', href: '/app/perfil', icon: User },
  { label: 'Mis deportistas', href: '/app/deportistas', icon: Users },
  { label: 'Patrocinadores', href: '/app/patrocinadores', icon: Award },
  { label: 'Matriculación', href: '/app/matriculacion', icon: ClipboardList },
]
