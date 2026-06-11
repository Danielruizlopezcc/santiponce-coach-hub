import type { LucideIcon } from 'lucide-react'
import { ClipboardList, House, User, Users } from 'lucide-react'

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
  { label: 'Matriculación', href: '/app/matriculacion', icon: ClipboardList },
]

// Usuario mock — sustituir por datos reales de Supabase cuando esté disponible.
export const MOCK_USER = {
  name: 'María García López',
  firstName: 'María',
  email: 'maria.garcia@ejemplo.com',
  initials: 'MG',
  role: 'Tutor',
} as const

export const MOCK_TUTOR_PROFILE = {
  nombre: 'María',
  apellidos: 'García López',
  email: 'maria.garcia@ejemplo.com',
  telefono: '600 123 456',
  documento: '12345678A',
  direccion: 'Avenida de Extremadura, 8',
  codigoPostal: '41970',
  provincia: 'Sevilla',
  ciudad: 'Santiponce',
  pais: 'España',
  preferenciaPago: 'cuotas' as const,
  metodoPago: {
    marca: 'Visa',
    ultimosDigitos: '4242',
    caducidad: '12/2028',
    estado: 'Método de pago guardado',
  },
} as const
