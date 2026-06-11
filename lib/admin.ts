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
  Users,
} from 'lucide-react'
import { CLUB, MATRICULA_IMPORTE } from '@/lib/club'

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Resumen', href: '/admin', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Tutores', href: '/admin/tutores', icon: UserCheck },
  { label: 'Deportistas', href: '/admin/deportistas', icon: Trophy },
  { label: 'Categorías', href: '/admin/categorias', icon: Tag },
  { label: 'Equipos', href: '/admin/equipos', icon: Shield },
  { label: 'Temporadas', href: '/admin/temporadas', icon: Calendar },
  { label: 'Matrículas', href: '/admin/matriculas', icon: ClipboardList },
  { label: 'Pagos', href: '/admin/pagos', icon: CreditCard },
  { label: 'Consentimientos', href: '/admin/consentimientos', icon: FileCheck },
  { label: 'Gestión de administradores', href: '/admin/administradores', icon: ShieldCheck },
  { label: 'Auditoría', href: '/admin/auditoria', icon: Activity },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

export const MOCK_ADMIN = {
  name: 'Admin Principal',
  email: 'admin@cdsantiponce.es',
  initials: 'AP',
  role: 'Administrador',
} as const

export type PagoEstado = 'pagado' | 'pendiente' | 'reembolsado' | 'fallido'
export type AlertaTipo = 'aviso' | 'info' | 'critico' | 'ok'

export const DASHBOARD_RESUMEN = {
  usuarios: 184,
  tutores: 96,
  deportistas: 143,
  deportistasPendientes: 19,
  matriculasPagadas: 87,
  matriculasPendientes: 21,
  ingresosEuros: 87 * MATRICULA_IMPORTE,
} as const

export const DEPORTISTAS_POR_CATEGORIA = [
  { label: 'Bebés', total: 9 },
  { label: 'Prebenjamín', total: 22 },
  { label: 'Benjamín', total: 28 },
  { label: 'Alevín', total: 25 },
  { label: 'Infantil', total: 23 },
  { label: 'Cadete', total: 19 },
  { label: 'Juvenil', total: 17 },
]

export const DEPORTISTAS_POR_EQUIPO = [
  { equipo: 'Prebenjamín A', categoria: 'Prebenjamín', total: 11 },
  { equipo: 'Benjamín A', categoria: 'Benjamín', total: 14 },
  { equipo: 'Benjamín B', categoria: 'Benjamín', total: 14 },
  { equipo: 'Alevín A', categoria: 'Alevín', total: 13 },
  { equipo: 'Alevín B', categoria: 'Alevín', total: 12 },
  { equipo: 'Infantil A', categoria: 'Infantil', total: 12 },
  { equipo: 'Infantil B', categoria: 'Infantil', total: 11 },
  { equipo: 'Cadete A', categoria: 'Cadete', total: 10 },
  { equipo: 'Cadete B', categoria: 'Cadete', total: 9 },
  { equipo: 'Juvenil A', categoria: 'Juvenil', total: 17 },
]

export type PagoReciente = {
  id: string
  familia: string
  deportista: string
  concepto: string
  importe: number
  estado: PagoEstado
  fecha: string
}

export const PAGOS_RECIENTES: PagoReciente[] = [
  {
    id: 'PAG-1201',
    familia: 'García López',
    deportista: 'Alba García López',
    concepto: `Matrícula ${CLUB.season}`,
    importe: MATRICULA_IMPORTE,
    estado: 'pagado',
    fecha: '11/06/2026',
  },
  {
    id: 'PAG-1200',
    familia: 'Romero Díaz',
    deportista: 'Iván Romero Díaz',
    concepto: `Matrícula ${CLUB.season}`,
    importe: MATRICULA_IMPORTE,
    estado: 'pendiente',
    fecha: '10/06/2026',
  },
  {
    id: 'PAG-1199',
    familia: 'Moreno Ruiz',
    deportista: 'Sara Moreno Ruiz',
    concepto: `Matrícula ${CLUB.season}`,
    importe: MATRICULA_IMPORTE,
    estado: 'fallido',
    fecha: '10/06/2026',
  },
  {
    id: 'PAG-1198',
    familia: 'Luna Pérez',
    deportista: 'Marco Luna Pérez',
    concepto: `Matrícula ${CLUB.season}`,
    importe: MATRICULA_IMPORTE,
    estado: 'reembolsado',
    fecha: '09/06/2026',
  },
]

export type AlertaAdmin = {
  id: number
  tipo: AlertaTipo
  titulo: string
  descripcion: string
  fecha: string
}

export const ALERTAS_ADMIN: AlertaAdmin[] = [
  {
    id: 1,
    tipo: 'aviso',
    titulo: 'Matrículas pendientes de pago',
    descripcion: '21 matrículas siguen pendientes de confirmación.',
    fecha: '11/06/2026',
  },
  {
    id: 2,
    tipo: 'info',
    titulo: 'Consentimientos por revisar',
    descripcion: '8 consentimientos de salud están marcados para revisión manual.',
    fecha: '11/06/2026',
  },
  {
    id: 3,
    tipo: 'critico',
    titulo: 'Deportistas sin equipo asignado',
    descripcion: '5 deportistas están pendientes de asignación antes del cierre de cupos.',
    fecha: '10/06/2026',
  },
  {
    id: 4,
    tipo: 'ok',
    titulo: 'Temporada activa configurada',
    descripcion: `La temporada ${CLUB.season} está marcada como activa.`,
    fecha: '09/06/2026',
  },
]

export type AdminUser = {
  id: string
  nombre: string
  email: string
  rol: 'Tutor' | 'Administrador'
  estado: 'Activo' | 'Pendiente' | 'Bloqueado'
  fechaAlta: string
}

export const ADMIN_USUARIOS: AdminUser[] = [
  {
    id: 'usr-001',
    nombre: 'María García López',
    email: 'maria.garcia@ejemplo.com',
    rol: 'Tutor',
    estado: 'Activo',
    fechaAlta: '02/06/2026',
  },
  {
    id: 'usr-002',
    nombre: 'Javier Romero Díaz',
    email: 'javier.romero@ejemplo.com',
    rol: 'Tutor',
    estado: 'Pendiente',
    fechaAlta: '04/06/2026',
  },
  {
    id: 'usr-003',
    nombre: 'Admin Principal',
    email: 'admin@cdsantiponce.es',
    rol: 'Administrador',
    estado: 'Activo',
    fechaAlta: '15/05/2026',
  },
  {
    id: 'usr-004',
    nombre: 'Lucía Moreno Ruiz',
    email: 'lucia.moreno@ejemplo.com',
    rol: 'Tutor',
    estado: 'Bloqueado',
    fechaAlta: '20/05/2026',
  },
]

export type AdminTutor = {
  id: string
  nombre: string
  documento: string
  telefono: string
  ciudad: string
  deportistasAsociados: number
}

export const ADMIN_TUTORES: AdminTutor[] = [
  {
    id: 'tut-001',
    nombre: 'María García López',
    documento: '12345678A',
    telefono: '600 123 456',
    ciudad: 'Santiponce',
    deportistasAsociados: 3,
  },
  {
    id: 'tut-002',
    nombre: 'Javier Romero Díaz',
    documento: '23456789B',
    telefono: '611 222 333',
    ciudad: 'Sevilla',
    deportistasAsociados: 1,
  },
  {
    id: 'tut-003',
    nombre: 'Elena Luna Pérez',
    documento: '34567890C',
    telefono: '622 333 444',
    ciudad: 'Camas',
    deportistasAsociados: 2,
  },
]

export type AdminAthlete = {
  id: string
  nombre: string
  tutor: string
  categoriaSolicitada: string
  equipoAsignado: string
  temporada: string
  estadoMatricula: 'Pendiente' | 'Matriculado' | 'En revisión'
}

export const ADMIN_DEPORTISTAS: AdminAthlete[] = [
  {
    id: 'dep-001',
    nombre: 'Alba García López',
    tutor: 'María García López',
    categoriaSolicitada: 'Infantil',
    equipoAsignado: 'Sin equipo asignado',
    temporada: CLUB.season,
    estadoMatricula: 'Pendiente',
  },
  {
    id: 'dep-002',
    nombre: 'Hugo García López',
    tutor: 'María García López',
    categoriaSolicitada: 'Benjamín',
    equipoAsignado: 'Benjamín A',
    temporada: CLUB.season,
    estadoMatricula: 'Matriculado',
  },
  {
    id: 'dep-003',
    nombre: 'Sara Moreno Ruiz',
    tutor: 'Lucía Moreno Ruiz',
    categoriaSolicitada: 'Cadete',
    equipoAsignado: 'Cadete A',
    temporada: CLUB.season,
    estadoMatricula: 'En revisión',
  },
]

export type AdminCategory = {
  id: string
  nombre: string
  orden: number
  estado: 'Activa' | 'Borrador'
}

export const ADMIN_CATEGORIAS: AdminCategory[] = [
  { id: 'cat-01', nombre: 'Bebés', orden: 1, estado: 'Activa' },
  { id: 'cat-02', nombre: 'Prebenjamín', orden: 2, estado: 'Activa' },
  { id: 'cat-03', nombre: 'Benjamín', orden: 3, estado: 'Activa' },
  { id: 'cat-04', nombre: 'Alevín', orden: 4, estado: 'Activa' },
  { id: 'cat-05', nombre: 'Infantil', orden: 5, estado: 'Activa' },
  { id: 'cat-06', nombre: 'Cadete', orden: 6, estado: 'Activa' },
  { id: 'cat-07', nombre: 'Juvenil', orden: 7, estado: 'Borrador' },
]

export type AdminTeam = {
  id: string
  nombre: string
  categoria: string
  temporada: string
  deportistas: number
  estado: 'Completo' | 'Abierto' | 'Pendiente'
}

export const ADMIN_EQUIPOS: AdminTeam[] = [
  {
    id: 'eq-001',
    nombre: 'Benjamín A',
    categoria: 'Benjamín',
    temporada: CLUB.season,
    deportistas: 14,
    estado: 'Completo',
  },
  {
    id: 'eq-002',
    nombre: 'Alevín B',
    categoria: 'Alevín',
    temporada: CLUB.season,
    deportistas: 12,
    estado: 'Abierto',
  },
  {
    id: 'eq-003',
    nombre: 'Infantil A',
    categoria: 'Infantil',
    temporada: CLUB.season,
    deportistas: 11,
    estado: 'Pendiente',
  },
]

export type AdminSeason = {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: 'Activa' | 'Planificada' | 'Cerrada'
}

export const ADMIN_TEMPORADAS: AdminSeason[] = [
  {
    id: 'temp-001',
    nombre: '2026/2027',
    fechaInicio: '01/09/2026',
    fechaFin: '30/06/2027',
    estado: 'Activa',
  },
  {
    id: 'temp-000',
    nombre: '2025/2026',
    fechaInicio: '01/09/2025',
    fechaFin: '30/06/2026',
    estado: 'Cerrada',
  },
  {
    id: 'temp-002',
    nombre: '2027/2028',
    fechaInicio: '01/09/2027',
    fechaFin: '30/06/2028',
    estado: 'Planificada',
  },
]

export type AdminEnrollment = {
  id: string
  deportista: string
  tutor: string
  temporada: string
  estadoMatricula: 'Pendiente' | 'Matriculado' | 'En revisión'
  estadoPago: 'Pagado' | 'Pendiente'
  importe: number
}

export const ADMIN_MATRICULAS: AdminEnrollment[] = [
  {
    id: 'mat-001',
    deportista: 'Alba García López',
    tutor: 'María García López',
    temporada: CLUB.season,
    estadoMatricula: 'Pendiente',
    estadoPago: 'Pendiente',
    importe: MATRICULA_IMPORTE,
  },
  {
    id: 'mat-002',
    deportista: 'Hugo García López',
    tutor: 'María García López',
    temporada: CLUB.season,
    estadoMatricula: 'Matriculado',
    estadoPago: 'Pagado',
    importe: MATRICULA_IMPORTE,
  },
  {
    id: 'mat-003',
    deportista: 'Sara Moreno Ruiz',
    tutor: 'Lucía Moreno Ruiz',
    temporada: CLUB.season,
    estadoMatricula: 'En revisión',
    estadoPago: 'Pendiente',
    importe: MATRICULA_IMPORTE,
  },
]

export type AdminPayment = {
  id: string
  operacion: string
  deportista: string
  tutor: string
  importe: number
  estado: PagoEstado
  proveedor: 'Stripe'
  fecha: string
}

export const ADMIN_PAGOS: AdminPayment[] = [
  {
    id: 'pay-001',
    operacion: 'Matrícula inicial',
    deportista: 'Hugo García López',
    tutor: 'María García López',
    importe: MATRICULA_IMPORTE,
    estado: 'pagado',
    proveedor: 'Stripe',
    fecha: '11/06/2026',
  },
  {
    id: 'pay-002',
    operacion: 'Matrícula inicial',
    deportista: 'Alba García López',
    tutor: 'María García López',
    importe: MATRICULA_IMPORTE,
    estado: 'pendiente',
    proveedor: 'Stripe',
    fecha: '11/06/2026',
  },
  {
    id: 'pay-003',
    operacion: 'Matrícula inicial',
    deportista: 'Sara Moreno Ruiz',
    tutor: 'Lucía Moreno Ruiz',
    importe: MATRICULA_IMPORTE,
    estado: 'fallido',
    proveedor: 'Stripe',
    fecha: '10/06/2026',
  },
]

export type AdminConsent = {
  id: string
  usuario: string
  tipoConsentimiento: string
  version: string
  estado: 'Firmado' | 'Pendiente' | 'Revocado'
  fecha: string
  firmante: string
}

export const ADMIN_CONSENTIMIENTOS: AdminConsent[] = [
  {
    id: 'con-001',
    usuario: 'María García López',
    tipoConsentimiento: 'Política de privacidad',
    version: 'v2026.1',
    estado: 'Firmado',
    fecha: '02/06/2026',
    firmante: 'María García López',
  },
  {
    id: 'con-002',
    usuario: 'María García López',
    tipoConsentimiento: 'Datos de salud',
    version: 'v2026.1',
    estado: 'Firmado',
    fecha: '02/06/2026',
    firmante: 'María García López',
  },
  {
    id: 'con-003',
    usuario: 'Javier Romero Díaz',
    tipoConsentimiento: 'Método de pago',
    version: 'v2026.1',
    estado: 'Pendiente',
    fecha: '04/06/2026',
    firmante: 'Javier Romero Díaz',
  },
]

export type AdminAudit = {
  id: string
  fecha: string
  usuarioAdmin: string
  accion: string
  entidad: string
  resultado: 'Correcto' | 'Pendiente' | 'Error'
}

export const ADMIN_AUDITORIA: AdminAudit[] = [
  {
    id: 'aud-001',
    fecha: '11/06/2026 09:32',
    usuarioAdmin: 'Admin Principal',
    accion: 'Revisión de matrícula',
    entidad: 'Alba García López',
    resultado: 'Pendiente',
  },
  {
    id: 'aud-002',
    fecha: '10/06/2026 18:10',
    usuarioAdmin: 'Admin Principal',
    accion: 'Asignación de equipo',
    entidad: 'Benjamín A',
    resultado: 'Correcto',
  },
  {
    id: 'aud-003',
    fecha: '10/06/2026 17:01',
    usuarioAdmin: 'Coordinación deportiva',
    accion: 'Exportación de pagos',
    entidad: 'Informe mensual',
    resultado: 'Correcto',
  },
]

export type AdminManager = {
  id: string
  nombre: string
  email: string
  rol: string
  estado: 'Activo' | 'Invitación pendiente'
}

export const ADMIN_ADMINISTRADORES: AdminManager[] = [
  {
    id: 'adm-001',
    nombre: 'Admin Principal',
    email: 'admin@cdsantiponce.es',
    rol: 'Administrador general',
    estado: 'Activo',
  },
  {
    id: 'adm-002',
    nombre: 'Coordinación deportiva',
    email: 'coordinacion@cdsantiponce.es',
    rol: 'Gestión deportiva',
    estado: 'Activo',
  },
  {
    id: 'adm-003',
    nombre: 'Tesorería',
    email: 'tesoreria@cdsantiponce.es',
    rol: 'Gestión económica',
    estado: 'Invitación pendiente',
  },
]

export const ADMIN_CONFIGURACION = [
  {
    id: 'cfg-01',
    titulo: 'Temporada activa',
    valor: CLUB.season,
    descripcion: 'Configuración visual de la temporada mostrada en la plataforma.',
  },
  {
    id: 'cfg-02',
    titulo: 'Importe matrícula',
    valor: '50,00 €',
    descripcion: 'Precio mock aplicado a cada matrícula individual.',
  },
  {
    id: 'cfg-03',
    titulo: 'Moneda',
    valor: 'EUR',
    descripcion: 'Moneda de referencia para la zona privada y administración.',
  },
  {
    id: 'cfg-04',
    titulo: 'Modo de pagos',
    valor: 'Stripe en modo visual',
    descripcion: 'Pendiente de integrar el flujo real con webhook y confirmación segura.',
  },
  {
    id: 'cfg-05',
    titulo: 'Estado de Stripe',
    valor: 'No conectado',
    descripcion: 'Este entorno no realiza cobros reales ni guarda tarjetas reales.',
  },
  {
    id: 'cfg-06',
    titulo: 'Estado de Supabase',
    valor: 'No conectado',
    descripcion: 'Las futuras Server Actions y permisos admin se conectarán en servidor.',
  },
] as const
