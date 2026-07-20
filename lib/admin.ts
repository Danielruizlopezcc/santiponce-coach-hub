import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  CreditCard,
  History,
  FileCheck,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Settings,
  Shield,
  ShieldCheck,
  Trophy,
  ClipboardList,
  UserCheck,
} from 'lucide-react'

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
  section: 'dashboard' | 'sports' | 'administration' | 'communication' | 'system'
}

export const ADMIN_NAV_SECTIONS: Array<{
  id: AdminNavItem['section']
  label: string
}> = [
  { id: 'dashboard', label: 'Panel' },
  { id: 'sports', label: 'Gestión deportiva' },
  { id: 'administration', label: 'Administración' },
  { id: 'communication', label: 'Comunicación' },
  { id: 'system', label: 'Sistema' },
]

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard, section: 'dashboard' },
  { label: 'Entrenadores', href: '/admin/entrenadores', icon: ClipboardList, section: 'sports' },
  { label: 'Deportistas', href: '/admin/deportistas', icon: Trophy, section: 'sports' },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield, section: 'sports' },
  { label: 'Calendario', href: '/admin/calendario', icon: Calendar, section: 'sports' },
  { label: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3, section: 'sports' },
  { label: 'Temporadas', href: '/admin/temporadas', icon: Calendar, section: 'sports' },
  { label: 'Categorías', href: '/admin/categorias', icon: ListChecks, section: 'sports' },
  { label: 'Tutores legales / Socios', href: '/admin/tutores', icon: UserCheck, section: 'administration' },
  { label: 'Matrículas', href: '/admin/matriculas', icon: ListChecks, section: 'administration' },
  { label: 'Contabilidad', href: '/admin/pagos', icon: CreditCard, section: 'administration' },
  { label: 'Consentimientos', href: '/admin/consentimientos', icon: FileCheck, section: 'administration' },
  { label: 'Noticias', href: '/admin/noticias', icon: Newspaper, section: 'communication' },
  { label: 'Patrocinadores', href: '/admin/patrocinadores', icon: Trophy, section: 'communication' },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings, section: 'system' },
  { label: 'Gestión de administradores', href: '/admin/administradores', icon: ShieldCheck, section: 'system' },
  { label: 'Auditoría', href: '/admin/auditoria', icon: History, section: 'system' },
]

const SPORTS_COORDINATOR_NAV_PATHS = new Set([
  '/admin/entrenadores',
  '/admin/deportistas',
  '/admin/equipos',
  '/admin/calendario',
  '/admin/estadisticas',
  '/admin/temporadas',
  '/admin/categorias',
  '/admin/tutores',
])

export function getAdminNavForRole(role: 'admin' | 'sports_coordinator') {
  if (role === 'admin') return ADMIN_NAV
  return ADMIN_NAV.filter((item) => SPORTS_COORDINATOR_NAV_PATHS.has(item.href))
}
