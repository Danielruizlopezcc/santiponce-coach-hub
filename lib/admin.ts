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
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Tutores / Socios', href: '/admin/tutores', icon: UserCheck },
  { label: 'Entrenadores', href: '/admin/entrenadores', icon: ClipboardList },
  { label: 'Deportistas', href: '/admin/deportistas', icon: Trophy },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Calendario', href: '/admin/calendario', icon: Calendar },
  { label: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { label: 'Noticias', href: '/admin/noticias', icon: Newspaper },
  { label: 'Patrocinadores', href: '/admin/patrocinadores', icon: Trophy },
  { label: 'Temporadas', href: '/admin/temporadas', icon: Calendar },
  { label: 'Contabilidad', href: '/admin/pagos', icon: CreditCard },
  { label: 'Consentimientos', href: '/admin/consentimientos', icon: FileCheck },
  { label: 'Gestión de administradores', href: '/admin/administradores', icon: ShieldCheck },
  { label: 'Auditoría', href: '/admin/auditoria', icon: History },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]
