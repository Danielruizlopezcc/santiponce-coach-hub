import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  CreditCard,
  History,
  FileCheck,
  LayoutDashboard,
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
  section: 'dashboard' | 'sports' | 'content' | 'finance' | 'admin'
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard, section: 'dashboard' },
  { label: 'Tutores / Socios', href: '/admin/tutores', icon: UserCheck, section: 'admin' },
  { label: 'Entrenadores', href: '/admin/entrenadores', icon: ClipboardList, section: 'sports' },
  { label: 'Deportistas', href: '/admin/deportistas', icon: Trophy, section: 'sports' },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield, section: 'sports' },
  { label: 'Calendario', href: '/admin/calendario', icon: Calendar, section: 'sports' },
  { label: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3, section: 'sports' },
  { label: 'Noticias', href: '/admin/noticias', icon: Newspaper, section: 'content' },
  { label: 'Patrocinadores', href: '/admin/patrocinadores', icon: Trophy, section: 'content' },
  { label: 'Temporadas', href: '/admin/temporadas', icon: Calendar, section: 'admin' },
  { label: 'Contabilidad', href: '/admin/pagos', icon: CreditCard, section: 'finance' },
  { label: 'Consentimientos', href: '/admin/consentimientos', icon: FileCheck, section: 'admin' },
  { label: 'Gestión de administradores', href: '/admin/administradores', icon: ShieldCheck, section: 'admin' },
  { label: 'Auditoría', href: '/admin/auditoria', icon: History, section: 'admin' },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings, section: 'admin' },
]

export function getAdminNavForRole(role: 'admin' | 'sports_coordinator') {
  if (role === 'admin') return ADMIN_NAV
  return ADMIN_NAV.filter((item) => item.section === 'sports')
}
