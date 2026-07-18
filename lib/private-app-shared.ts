import type {
  DeportistaFormValues,
  TutorProfileFormValues,
} from '@/lib/registro-schema'
import type { SponsorTier } from '@/lib/sponsors'

export type PrivateViewer = {
  id: string
  firstName: string
  fullName: string
  email: string
  initials: string
}

export type PrivateAthleteSummary = {
  id: string
  nombre: string
  apellidos: string
  categoriaSolicitada: string
  equipoAsignado: string | null
  estado: 'pendiente' | 'matriculado' | 'en_revision'
}

export type PrivateAthleteDetail = PrivateAthleteSummary & {
  fechaNacimiento: string
  tipoIdentificacion: 'DNI' | 'NIE' | 'Pasaporte' | 'Otro'
  documento: string
  email: string
  telefono: string
  alergias: string
  tieneHermanos: 'si' | 'no'
  nombreHermano: string
  temporada: string
  pagoEstado: 'pagado' | 'pendiente'
}

export type PrivateTutorProfile = TutorProfileFormValues & {
  metodoPago: {
    estado: string
    detalle?: string
    marca?: string
    ultimos4Digitos?: string
  }
}

export type PrivateMemberProfile = {
  nombre: string
  apellidos: string
  email: string
  estadoSocio: 'Socio pagado' | 'Pendiente'
}

export type PrivateSponsor = {
  id: string
  title: string
  imageUrl: string
  url: string
  tier: SponsorTier
}

export type PrivateNewsSection = {
  id: string
  name: string
}

export type PrivateNewsItem = {
  id: string
  title: string
  body: string | null
  imageUrl: string
  sectionId: string | null
  sectionName: string
  createdAt: string
}

export type PrivateNewsDetail = PrivateNewsItem

export type PrivateNewsData = {
  sections: PrivateNewsSection[]
  news: PrivateNewsItem[]
}

export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward'

export type PrivateTeamPlayer = {
  id: string
  nombre: string
  categoriaSolicitada: string
  position: PlayerPosition | null
  shirtNumber: number | null
  estadoMatricula: 'Pendiente' | 'Matriculado' | 'En revisión'
}

export type PrivateTeamSummary = {
  id: string
  nombre: string
  categoria: string
  temporada: string
  jugadores: number
  estado: 'Abierto' | 'Completo' | 'Pendiente'
}

export type PrivateTeamDetail = PrivateTeamSummary & {
  isActive: boolean
  notes: string | null
  players: PrivateTeamPlayer[]
}

export type PrivateDashboardData = {
  viewer: PrivateViewer
  seasonLabel: string
  matriculaImporte: number
  deportistas: PrivateAthleteSummary[]
  hasGuardian: boolean
  isGuardianApproved: boolean
  guardianApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  isPaidSocio: boolean
}

export type PrivateUserStatus = {
  hasGuardian: boolean
  isGuardianApproved: boolean
  guardianApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  isSocio: boolean
  isPaidSocio: boolean
  hasSavedPaymentMethod: boolean
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

export function normalizeDocument(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeOptionalEmail(value?: string) {
  return value?.trim() ? normalizeEmail(value) : null
}

export function normalizeOptionalPhone(value?: string) {
  return value?.trim() ? normalizePhone(value) : null
}

export function toAthleteFormValues(
  athlete?: PrivateAthleteDetail | null,
): DeportistaFormValues | undefined {
  if (!athlete) return undefined

  return {
    id: athlete.id,
    nombre: athlete.nombre,
    apellidos: athlete.apellidos,
    fechaNacimiento: athlete.fechaNacimiento,
    tipoIdentificacion: athlete.tipoIdentificacion,
    documento: athlete.documento,
    email: athlete.email,
    telefono: athlete.telefono,
    alergias: athlete.alergias,
    tieneHermanos: athlete.tieneHermanos,
    nombreHermano: athlete.nombreHermano,
    categoria: athlete.categoriaSolicitada as DeportistaFormValues['categoria'],
  }
}
