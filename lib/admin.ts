import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Calendar,
  ClipboardList,
  CreditCard,
  FileCheck,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Trophy,
  UserCheck,
} from 'lucide-react'

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
  { label: 'Tutores', href: '/admin/tutores', icon: UserCheck },
  { label: 'Deportistas', href: '/admin/deportistas', icon: Trophy },
  { label: 'Categorías', href: '/admin/categorias', icon: Tag },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Patrocinadores', href: '/admin/patrocinadores', icon: Trophy },
  { label: 'Temporadas', href: '/admin/temporadas', icon: Calendar },
  { label: 'Matrículas', href: '/admin/matriculas', icon: ClipboardList },
  { label: 'Pagos', href: '/admin/pagos', icon: CreditCard },
  { label: 'Consentimientos', href: '/admin/consentimientos', icon: FileCheck },
  { label: 'Gestión de administradores', href: '/admin/administradores', icon: ShieldCheck },
  { label: 'Auditoría', href: '/admin/auditoria', icon: Activity },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]
