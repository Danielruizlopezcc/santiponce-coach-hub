import 'server-only'

import { CLUB, MATRICULA_IMPORTE, MEMBERSHIP_IMPORTE } from '@/lib/club'
import { formatSpanishDate, formatSpanishDateTime } from '@/lib/format'
import { getPrivateViewer } from '@/lib/private-app'
import type { PlayerPosition, PrivateViewer } from '@/lib/private-app-shared'
import { getSponsorTierFromSortOrder, type SponsorTier } from '@/lib/sponsors'
import { createClient } from '@/lib/supabase/server'
import { getTeamCategorySortInfo, getTeamSuffixOrder } from '@/lib/team-order'

export type AdminViewer = PrivateViewer & {
  roleLabel: string
}

export type AdminSummary = {
  usuarios: number
  administradores: number
  tutores: number
  sociosActivos: number
  tutoresSocios: number
  tutoresOSocios: number
  deportistas: number
  deportistasMatriculados: number
  deportistasEnRevision: number
  deportistasPendientes: number
  deportistasSinEquipo: number
  equipos: number
  categorias: number
  patrocinadores: number
  noticias: number
  temporadas: number
}

export type AdminCategoryBreakdown = {
  label: string
  total: number
}

export type AdminTeamBreakdown = {
  equipo: string
  categoria: string
  total: number
}

export type AdminRecentPayment = {
  id: string
  familia: string
  deportista: string
  concepto: string
  importe: number
  estado: 'pagado' | 'pendiente'
  fecha: string
}

export type AdminAlert = {
  id: number
  tipo: 'aviso' | 'info' | 'ok'
  titulo: string
  descripcion: string
  fecha: string
}

export type AdminUserRow = {
  id: string
  nombre: string
  email: string
  rol: 'Tutor' | 'Administrador'
  estado: 'Activo'
  fechaAlta: string
}

export type AdminTutorRow = {
  id: string
  userId: string
  nombre: string
  email: string
  documento: string
  telefono: string
  ciudad: string
  isSocio: boolean
  isApproved: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  deportistasAsociados: number
  consentStatus: 'Completo' | 'Parcial' | 'Sin consentimientos'
  imageConsent: 'Aceptado' | 'No aceptado' | 'Sin registrar'
  cardStatus: 'Tarjeta activa' | 'Tarjeta caducada' | 'No válida' | 'Sin tarjeta'
}

export type AdminTutorOption = {
  id: string
  nombre: string
}

export type AdminMemberRow = {
  id: string
  nombre: string
  email: string
  estado: 'Socio pagado' | 'Pendiente'
  fechaAlta: string
}

export type AdminCoachRow = {
  id: string
  nombre: string
  email: string
  equipo: string
  rol: 'Entrenador'
  estado: 'Activo'
  fechaAlta: string
}

export type AdminCoachTeamOption = {
  id: string
  nombre: string
}

export type AdminAthleteRow = {
  id: string
  nombre: string
  guardianId: string | null
  tutor: string
  categoriaSolicitadaId: string
  categoriaSolicitada: string
  assignedTeamId: string | null
  equipoAsignado: string
  seasonId: string
  temporada: string
  rawStatus: 'pendiente' | 'matriculado' | 'en_revision'
  estadoMatricula: 'Pendiente' | 'Matriculado' | 'En revisión'
}

export type AdminCategoryRow = {
  id: string
  nombre: string
  orden: number
  estado: 'Activa' | 'Borrador'
}

export type AdminTeamRow = {
  id: string
  nombre: string
  categoria: string
  categoryId: string
  temporada: string
  seasonId: string
  deportistas: number
  isActive: boolean
  notes: string | null
  estado: 'Completo' | 'Abierto' | 'Pendiente'
}

export type AdminTeamMember = {
  id: string
  nombre: string
  tutor: string
  position: PlayerPosition | null
  estadoMatricula: AdminAthleteRow['estadoMatricula']
}

export type AdminAvailableAthlete = {
  id: string
  nombre: string
  tutor: string
}

export type AdminTeamDetail = AdminTeamRow & {
  members: AdminTeamMember[]
  available: AdminAvailableAthlete[]
}

export type AdminMatchStatus = 'scheduled' | 'played' | 'postponed' | 'cancelled'
export type AdminMatchType = 'league' | 'friendly'

export type AdminMatchPlayerStat = {
  athleteId: string
  athleteName: string
  position: PlayerPosition | null
  isCalledUp: boolean
  isStarter: boolean
  shirtNumber: number | null
  minutes: number
  goals: number
  goalMinutes: string
  assists: number
  foulsCommitted: number
  foulsReceived: number
  yellowCards: number
  yellowCardMinutes: string
  redCards: number
  redCardMinute: number | null
  shots: number
  saves: number
  notes: string
}

export type AdminMatchRow = {
  id: string
  teamId: string
  teamName: string
  categoryName: string
  seasonId: string
  seasonName: string
  opponentName: string
  matchDate: string
  matchTime: string
  dateLabel: string
  timeLabel: string
  weekLabel: string
  weekRangeLabel: string
  location: string
  isHome: boolean
  matchType: AdminMatchType
  roundLabel: string
  status: AdminMatchStatus
  homeScore: number | null
  awayScore: number | null
  homePossession: number | null
  awayPossession: number | null
  homeOffsides: number | null
  awayOffsides: number | null
  homeCorners: number | null
  awayCorners: number | null
  homeTotalShots: number | null
  awayTotalShots: number | null
  homeShots: number | null
  awayShots: number | null
  homeShotsOnTarget: number | null
  awayShotsOnTarget: number | null
  homeBlockedShots: number | null
  awayBlockedShots: number | null
  homeGoalkeeperSaves: number | null
  awayGoalkeeperSaves: number | null
  homeTackles: number | null
  awayTackles: number | null
  homePasses: number | null
  awayPasses: number | null
  homeCompletedPasses: number | null
  awayCompletedPasses: number | null
  homeFouls: number | null
  awayFouls: number | null
  homeYellowCards: number | null
  awayYellowCards: number | null
  homeRedCards: number | null
  awayRedCards: number | null
  notes: string
  playerStats: AdminMatchPlayerStat[]
}

export type AdminSeasonRow = {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  startsAt: string
  endsAt: string
  isActive: boolean
  estado: 'Activa' | 'Planificada' | 'Cerrada'
}

export type AdminEnrollmentRow = {
  id: string
  deportista: string
  tutor: string
  temporada: string
  estadoMatricula: 'Pendiente' | 'Matriculado' | 'En revisión'
  estadoPago: 'Pagado' | 'Pendiente'
  importe: number
}

export type AdminPaymentRow = {
  id: string
  operacion: string
  deportista: string
  tutor: string
  importe: number
  estado: 'pagado' | 'pendiente' | 'fallido' | 'reembolsado'
  proveedor: 'Stripe' | 'Manual'
  fecha: string
  stripePaymentIntentId: string
}

export type AdminFinanceMovementRow = {
  id: string
  tipo: 'ingreso' | 'gasto'
  concepto: string
  detalle: string
  categoria: string
  metodoPago: 'cash' | 'transfer' | 'bizum' | 'card' | 'stripe' | 'other'
  estado: 'confirmed' | 'pending' | 'void'
  seasonId: string | null
  temporada: string
  justificanteUrl: string
  importe: number
  fecha: string
}

export type AdminFeeTemplateRow = {
  id: string
  nombre: string
  tipo: string
  importe: number
  isPublic: boolean
  splitPayment: boolean
  chargeFrequency: string
  chargeCount: number | null
  createdAt: string
}

export type AdminTutorFeeAssignmentRow = {
  id: string
  guardianId: string
  athleteId: string | null
  athleteName: string
  feeTemplateId: string
  feeName: string
  feeType: string
  totalAmount: number
  chargeDay: number
  startMonth: string
  status: 'active' | 'canceled' | 'completed'
  scheduledCharges: number
  paidCharges: number
  nextChargeDate: string
  createdAt: string
}

export type AdminConsentRow = {
  id: string
  usuario: string
  tipoConsentimiento: string
  version: string
  estado: 'Firmado' | 'Revocado'
  fecha: string
  firmante: string
}

export type AdminManagerRow = {
  id: string
  nombre: string
  email: string
  rol: string
  estado: 'Activo'
  fechaAlta: string
}

export type AdminSponsorRow = {
  id: string
  title: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
  tier: SponsorTier
  createdAt: string
}

export type AdminNewsSectionRow = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  newsCount: number
  createdAt: string
}

export type AdminNewsRow = {
  id: string
  title: string
  body: string | null
  imageUrl: string
  sectionId: string | null
  sectionName: string
  createdAt: string
}

export type AdminAuditLogRow = {
  id: string
  actorName: string
  actorEmail: string
  action: string
  entityType: string
  entityId: string
  summary: string
  createdAt: string
}

export type AdminConfigRow = {
  id: string
  titulo: string
  valor: string
  descripcion: string
}

export type AdminSettings = {
  clubShortName: string
  clubLegalName: string
  seasonLabel: string
  membershipFeeEuros: number
  enrollmentFeeEuros: number
  registrationOpen: boolean
  contactEmail: string
  contactPhone: string
}

export type AdminConfigData = {
  summary: AdminConfigRow[]
  settings: AdminSettings
  seasons: AdminSeasonRow[]
  activeSeasonId: string
}

export type AdminDashboardData = {
  summary: AdminSummary
  athletesByCategory: AdminCategoryBreakdown[]
  athletesByTeam: AdminTeamBreakdown[]
  recentPayments: AdminRecentPayment[]
  alerts: AdminAlert[]
}

type GuardianLookup = {
  id: string
  name: string
}

type AdminPaymentRecord = {
  id: string
  user_id: string
  guardian_id: string | null
  athlete_id: string | null
  season_id: string | null
  payment_type: 'membership' | 'enrollment'
  provider: 'stripe' | 'manual'
  status: 'pending' | 'paid' | 'canceled' | 'failed' | 'refunded'
  amount_cents: number
  description: string
  stripe_payment_intent_id: string | null
  paid_at: string | null
  created_at: string
}

type AdminFinanceMovementRecord = {
  id: string
  movement_type: 'income' | 'expense'
  concept: string
  detail: string | null
  category: string | null
  payment_method: 'cash' | 'transfer' | 'bizum' | 'card' | 'stripe' | 'other'
  status: 'confirmed' | 'pending' | 'void'
  season_id: string | null
  receipt_url: string | null
  amount_cents: number
  recorded_at: string
}

type AdminFeeTemplateRecord = {
  id: string
  name: string
  fee_type: string
  total_amount_cents: number
  is_public: boolean
  split_payment: boolean
  charge_frequency: string | null
  charge_count: number | null
  created_at: string
}

type AdminTutorFeeAssignmentRecord = {
  id: string
  guardian_id: string
  athlete_id: string | null
  fee_template_id: string
  charge_day: number
  start_month: string
  status: 'active' | 'canceled' | 'completed'
  created_at: string
}

type AdminTutorFeeChargeRecord = {
  assignment_id: string
  due_date: string
  amount_cents: number
  status: 'scheduled' | 'paid' | 'failed' | 'canceled'
}

function mapStatusLabel(
  status: 'pendiente' | 'matriculado' | 'en_revision',
): AdminAthleteRow['estadoMatricula'] {
  if (status === 'matriculado') return 'Matriculado'
  if (status === 'en_revision') return 'En revisión'
  return 'Pendiente'
}

export async function getAdminViewer(userId: string): Promise<AdminViewer> {
  const viewer = await getPrivateViewer(userId)
  return { ...viewer, roleLabel: 'Administrador' }
}

async function getAdminCollections() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: roles },
    { data: athletes },
    { data: categories },
    { data: teams },
    { data: seasons },
    { data: consents },
    { data: consentDocuments },
    { data: payments },
    { data: sponsors },
    { data: news },
    { data: coachTeamAssignments },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, email, first_name, last_name, is_paid_member, membership_paid_at, stripe_payment_method_id, payment_method_exp_month, payment_method_exp_year, payment_method_saved_at, created_at',
      ),
    supabase.from('user_roles').select('user_id, role'),
    supabase
      .from('athletes')
      .select(
        'id, guardian_id, first_name, last_name, status, requested_category_id, assigned_team_id, position, season_id, created_at',
      ),
    supabase.from('categories').select('id, name, sort_order, is_active'),
    supabase.from('teams').select('id, name, category_id, season_id, is_active, notes'),
    supabase.from('seasons').select('id, name, starts_at, ends_at, is_active'),
    supabase
      .from('consents')
      .select('id, guardian_id, athlete_id, document_id, accepted, signer_full_name, accepted_at, revoked_at'),
    supabase.from('consent_documents').select('id, code, title, version, is_required'),
    supabase
      .from('payments')
      .select(
        'id, user_id, guardian_id, athlete_id, season_id, payment_type, provider, status, amount_cents, description, stripe_payment_intent_id, paid_at, created_at',
      )
      .order('created_at', { ascending: false }),
    supabase.from('sponsors').select('id, is_active'),
    supabase.from('news').select('id'),
    supabase.from('coach_team_assignments').select('coach_user_id, team_id'),
  ])

  const guardiansWithApproval = await supabase
    .from('guardians')
    .select('id, user_id, first_name, last_name, phone, document_id, city, is_approved, approval_status')

  const guardiansFallback = guardiansWithApproval.error
    ? await supabase
        .from('guardians')
        .select('id, user_id, first_name, last_name, phone, document_id, city')
    : null

  return {
    profiles: profiles ?? [],
    roles: roles ?? [],
    guardians: (guardiansWithApproval.data ?? guardiansFallback?.data ?? []).map((guardian) => ({
      ...guardian,
      is_approved: 'is_approved' in guardian ? guardian.is_approved : true,
      approval_status: 'approval_status' in guardian ? guardian.approval_status : 'approved',
    })),
    athletes: athletes ?? [],
    categories: categories ?? [],
    teams: teams ?? [],
    seasons: seasons ?? [],
    consents: consents ?? [],
    consentDocuments: consentDocuments ?? [],
    payments: (payments ?? []) as AdminPaymentRecord[],
    sponsors: sponsors ?? [],
    news: news ?? [],
    coachTeamAssignments: coachTeamAssignments ?? [],
  }
}

function createGuardianNameLookup(
  guardians: Array<{ id: string; first_name: string; last_name: string }>,
) {
  return new Map<string, GuardianLookup>(
    guardians.map((guardian) => [
      guardian.id,
      {
        id: guardian.id,
        name: `${guardian.first_name} ${guardian.last_name}`.trim(),
      },
    ]),
  )
}

function createLatestEnrollmentPaymentByAthlete(payments: AdminPaymentRecord[]) {
  const latestByAthlete = new Map<string, AdminPaymentRecord>()

  for (const payment of payments) {
    if (payment.payment_type !== 'enrollment' || !payment.athlete_id) continue
    if (!latestByAthlete.has(payment.athlete_id)) {
      latestByAthlete.set(payment.athlete_id, payment)
    }
  }

  return latestByAthlete
}

function mapPaymentStatusLabel(
  status: AdminPaymentRecord['status'],
): AdminPaymentRow['estado'] {
  if (status === 'paid') return 'pagado'
  if (status === 'pending') return 'pendiente'
  if (status === 'refunded') return 'reembolsado'
  if (status === 'canceled') return 'fallido'
  return 'fallido'
}

function mapPaymentProviderLabel(
  provider: AdminPaymentRecord['provider'],
): AdminPaymentRow['proveedor'] {
  return provider === 'manual' ? 'Manual' : 'Stripe'
}

function getCardStatus(profile?: {
  stripe_payment_method_id?: string | null
  payment_method_exp_month?: number | null
  payment_method_exp_year?: number | null
}): AdminTutorRow['cardStatus'] {
  if (!profile?.stripe_payment_method_id) {
    return 'Sin tarjeta'
  }

  const expMonth = profile.payment_method_exp_month
  const expYear = profile.payment_method_exp_year

  if (!expMonth || !expYear) {
    return 'No válida'
  }

  const now = new Date()
  const expiresAt = new Date(Date.UTC(expYear, expMonth, 1))

  if (expiresAt <= now) {
    return 'Tarjeta caducada'
  }

  return 'Tarjeta activa'
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { profiles, roles, guardians, athletes, categories, teams, seasons, consents, payments, sponsors, news } =
    await getAdminCollections()

  const guardianById = createGuardianNameLookup(guardians)
  const profileById = new Map(
    profiles.map((profile) => [
      profile.id,
      `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email,
    ]),
  )
  const categoryById = new Map(categories.map((category) => [category.id, category.name]))
  const teamById = new Map(teams.map((team) => [team.id, team]))
  const seasonById = new Map(seasons.map((season) => [season.id, season.name]))
  const athleteById = new Map(
    athletes.map((athlete) => [athlete.id, `${athlete.first_name} ${athlete.last_name}`.trim()]),
  )
  const latestEnrollmentPaymentByAthlete = createLatestEnrollmentPaymentByAthlete(payments)

  const athletesByCategoryMap = new Map<string, number>()
  for (const athlete of athletes) {
    const label = categoryById.get(athlete.requested_category_id) ?? 'Sin categoría'
    athletesByCategoryMap.set(label, (athletesByCategoryMap.get(label) ?? 0) + 1)
  }

  const athletesByTeamMap = new Map<string, AdminTeamBreakdown>()
  for (const athlete of athletes) {
    if (!athlete.assigned_team_id) continue
    const team = teamById.get(athlete.assigned_team_id)
    if (!team) continue
    const key = team.id
    const current = athletesByTeamMap.get(key)
    if (current) {
      current.total += 1
    } else {
      athletesByTeamMap.set(key, {
        equipo: team.name,
        categoria: categoryById.get(team.category_id) ?? 'Sin categoría',
        total: 1,
      })
    }
  }

  const activeSeason = seasons.find((season) => season.is_active)
  const today = formatSpanishDate(new Date().toISOString())
  const tutorUserIds = new Set(guardians.map((guardian) => guardian.user_id))
  const activeMemberIds = new Set(
    payments
      .filter((payment) => payment.payment_type === 'membership' && payment.status === 'paid')
      .map((payment) => payment.user_id),
  )
  const tutoresSocios = Array.from(tutorUserIds).filter((userId) =>
    activeMemberIds.has(userId),
  ).length
  const tutoresOSocios = new Set([...tutorUserIds, ...activeMemberIds]).size

  const summary: AdminSummary = {
    usuarios: profiles.length,
    administradores: roles.filter((role) => role.role === 'admin').length,
    tutores: guardians.length,
    sociosActivos: activeMemberIds.size,
    tutoresSocios,
    tutoresOSocios,
    deportistas: athletes.length,
    deportistasMatriculados: athletes.filter((athlete) => athlete.status === 'matriculado').length,
    deportistasEnRevision: athletes.filter((athlete) => {
      if (athlete.status === 'matriculado') return false
      return latestEnrollmentPaymentByAthlete.get(athlete.id)?.status === 'pending'
    }).length,
    deportistasPendientes: athletes.filter((athlete) => {
      if (athlete.status === 'matriculado') return false
      return latestEnrollmentPaymentByAthlete.get(athlete.id)?.status !== 'pending'
    }).length,
    deportistasSinEquipo: athletes.filter((athlete) => !athlete.assigned_team_id).length,
    equipos: teams.filter((team) => team.is_active).length,
    categorias: categories.filter((category) => category.is_active).length,
    patrocinadores: sponsors.filter((sponsor) => sponsor.is_active).length,
    noticias: news.length,
    temporadas: seasons.length,
  }

  const alerts: AdminAlert[] = []
  if (summary.deportistasPendientes + summary.deportistasEnRevision > 0) {
    alerts.push({
      id: 1,
      tipo: 'aviso',
      titulo: 'Matrículas abiertas',
      descripcion: `${summary.deportistasPendientes + summary.deportistasEnRevision} deportistas siguen pendientes de cierre de matrícula.`,
      fecha: today,
    })
  }
  if (summary.deportistasSinEquipo > 0) {
    alerts.push({
      id: 4,
      tipo: 'info',
      titulo: 'Deportistas sin equipo',
      descripcion: `${summary.deportistasSinEquipo} deportistas siguen sin equipo asignado.`,
      fecha: today,
    })
  }
  if (consents.some((consent) => consent.revoked_at)) {
    alerts.push({
      id: 2,
      tipo: 'info',
      titulo: 'Consentimientos revocados',
      descripcion: 'Hay consentimientos revocados que conviene revisar desde administración.',
      fecha: today,
    })
  }
  if (activeSeason) {
    alerts.push({
      id: 3,
      tipo: 'ok',
      titulo: 'Temporada activa configurada',
      descripcion: `La temporada ${activeSeason.name} está marcada como activa.`,
      fecha: today,
    })
  }

  const recentPayments = payments
    .filter((payment) => payment.status === 'paid')
    .slice(0, 5)
    .map((payment) => ({
      id: payment.id,
      familia:
        (payment.guardian_id ? guardianById.get(payment.guardian_id)?.name : null) ??
        profileById.get(payment.user_id) ??
        'Usuario no disponible',
      deportista: payment.athlete_id ? athleteById.get(payment.athlete_id) ?? 'Deportista no disponible' : 'Cuota de socio',
      concepto:
        payment.payment_type === 'membership'
          ? 'Cuota de socio'
          : payment.description || `Matrícula ${seasonById.get(payment.season_id ?? '') ?? CLUB.season}`,
      importe: payment.amount_cents / 100,
      estado: 'pagado' as const,
      fecha: formatSpanishDate(payment.paid_at ?? payment.created_at),
    }))

  return {
    summary,
    athletesByCategory: Array.from(athletesByCategoryMap.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    athletesByTeam: Array.from(athletesByTeamMap.values()).sort((a, b) =>
      a.equipo.localeCompare(b.equipo, 'es'),
    ),
    recentPayments,
    alerts,
  }
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { profiles, roles } = await getAdminCollections()
  const adminIds = new Set(roles.filter((role) => role.role === 'admin').map((role) => role.user_id))

  return profiles
    .map((profile) => ({
      id: profile.id,
      nombre: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Usuario',
      email: profile.email,
      rol: (adminIds.has(profile.id) ? 'Administrador' : 'Tutor') as AdminUserRow['rol'],
      estado: 'Activo' as const,
      fechaAlta: formatSpanishDate(profile.created_at),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminTutors(): Promise<AdminTutorRow[]> {
  const { profiles, guardians, athletes, consents, consentDocuments } = await getAdminCollections()
  const athleteCountByGuardian = new Map<string, number>()
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const requiredDocumentIds = new Set(
    consentDocuments
      .filter((document) => document.is_required)
      .map((document) => document.id),
  )
  const imageRightsDocument = consentDocuments.find((document) => document.code === 'image_rights')
  const consentsByGuardian = new Map<string, typeof consents>()

  for (const athlete of athletes) {
    if (!athlete.guardian_id) continue
    athleteCountByGuardian.set(
      athlete.guardian_id,
      (athleteCountByGuardian.get(athlete.guardian_id) ?? 0) + 1,
    )
  }

  for (const consent of consents) {
    const current = consentsByGuardian.get(consent.guardian_id) ?? []
    current.push(consent)
    consentsByGuardian.set(consent.guardian_id, current)
  }

  return guardians
    .map((guardian) => {
      const profile = profileById.get(guardian.user_id)
      const guardianConsents = consentsByGuardian.get(guardian.id) ?? []
      const activeConsentIds = new Set(
        guardianConsents
          .filter((consent) => consent.accepted && !consent.revoked_at)
          .map((consent) => consent.document_id),
      )
      const hasAnyConsent = guardianConsents.length > 0
      const requiredAccepted = Array.from(requiredDocumentIds).filter((documentId) =>
        activeConsentIds.has(documentId),
      ).length
      const consentStatus =
        requiredDocumentIds.size > 0 && requiredAccepted === requiredDocumentIds.size
          ? 'Completo'
          : hasAnyConsent
            ? 'Parcial'
            : 'Sin consentimientos'
      const imageConsentRecord = imageRightsDocument
        ? guardianConsents.find((consent) => consent.document_id === imageRightsDocument.id)
        : null
      const imageConsent =
        imageConsentRecord?.accepted && !imageConsentRecord.revoked_at
          ? 'Aceptado'
          : imageConsentRecord
            ? 'No aceptado'
            : 'Sin registrar'
      const cardStatus = getCardStatus(profile)

      return {
        id: guardian.id,
        userId: guardian.user_id,
        nombre: `${guardian.first_name} ${guardian.last_name}`.trim(),
        email: profile?.email ?? '',
        documento: guardian.document_id,
        telefono: guardian.phone,
        ciudad: guardian.city,
        isSocio: Boolean(profile?.is_paid_member),
        isApproved: Boolean(guardian.is_approved),
        approvalStatus: (guardian.approval_status ?? (guardian.is_approved ? 'approved' : 'pending')) as AdminTutorRow['approvalStatus'],
        deportistasAsociados: athleteCountByGuardian.get(guardian.id) ?? 0,
        consentStatus: consentStatus as AdminTutorRow['consentStatus'],
        imageConsent: imageConsent as AdminTutorRow['imageConsent'],
        cardStatus,
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminMembers(): Promise<AdminMemberRow[]> {
  const { profiles, roles } = await getAdminCollections()
  const memberRoleIds = new Set(roles.filter((role) => role.role === 'member').map((role) => role.user_id))

  return profiles
    .filter((profile) => profile.is_paid_member || memberRoleIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      nombre: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Socio',
      email: profile.email,
      estado: (profile.is_paid_member ? 'Socio pagado' : 'Pendiente') as AdminMemberRow['estado'],
      fechaAlta: formatSpanishDate(profile.created_at),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminTutorOptions(): Promise<AdminTutorOption[]> {
  const { guardians } = await getAdminCollections()

  return guardians
    .filter((guardian) => (guardian.approval_status ?? (guardian.is_approved ? 'approved' : 'pending')) === 'approved')
    .map((guardian) => ({
      id: guardian.id,
      nombre: `${guardian.first_name} ${guardian.last_name}`.trim(),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminAthletes(): Promise<AdminAthleteRow[]> {
  const { guardians, athletes, categories, teams, seasons, payments } = await getAdminCollections()
  const guardianById = createGuardianNameLookup(guardians)
  const categoryById = new Map(categories.map((category) => [category.id, category.name]))
  const teamById = new Map(teams.map((team) => [team.id, team.name]))
  const seasonById = new Map(seasons.map((season) => [season.id, season.name]))
  const latestEnrollmentPaymentByAthlete = createLatestEnrollmentPaymentByAthlete(payments)

  return athletes
    .map((athlete) => ({
      id: athlete.id,
      nombre: `${athlete.first_name} ${athlete.last_name}`.trim(),
      guardianId: athlete.guardian_id ?? null,
      tutor: athlete.guardian_id ? guardianById.get(athlete.guardian_id)?.name ?? 'Tutor no disponible' : 'Sin tutor',
      categoriaSolicitadaId: athlete.requested_category_id,
      categoriaSolicitada:
        categoryById.get(athlete.requested_category_id) ?? 'Categoría pendiente',
      assignedTeamId: athlete.assigned_team_id ?? null,
      equipoAsignado: athlete.assigned_team_id
        ? teamById.get(athlete.assigned_team_id) ?? 'Equipo pendiente'
        : 'Sin equipo asignado',
      seasonId: athlete.season_id,
      temporada: seasonById.get(athlete.season_id) ?? CLUB.season,
      rawStatus: athlete.status,
      estadoMatricula:
        athlete.status === 'matriculado'
          ? 'Matriculado'
          : latestEnrollmentPaymentByAthlete.get(athlete.id)?.status === 'pending'
            ? 'En revisión'
            : mapStatusLabel(athlete.status),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const { categories } = await getAdminCollections()
  return categories
    .map((category) => ({
      id: category.id,
      nombre: category.name,
      orden: category.sort_order,
      estado: (category.is_active ? 'Activa' : 'Borrador') as AdminCategoryRow['estado'],
    }))
    .sort((a, b) => a.orden - b.orden)
}

export async function getAdminTeams(): Promise<AdminTeamRow[]> {
  const { athletes, categories, teams, seasons } = await getAdminCollections()
  const categoryById = new Map(categories.map((category) => [category.id, category.name]))
  const seasonById = new Map(seasons.map((season) => [season.id, season.name]))
  const athleteCountByTeam = new Map<string, number>()
  type AdminTeamSortRow = AdminTeamRow & {
    categoryOrder: number
    suffixOrder: number
  }

  for (const athlete of athletes) {
    if (!athlete.assigned_team_id) continue
    athleteCountByTeam.set(
      athlete.assigned_team_id,
      (athleteCountByTeam.get(athlete.assigned_team_id) ?? 0) + 1,
    )
  }

  return teams
    .map((team) => {
      const total = athleteCountByTeam.get(team.id) ?? 0
      const categoryName = categoryById.get(team.category_id) ?? 'Sin categoría'
      const sortInfo = getTeamCategorySortInfo(team.name, categoryName)

      return {
        id: team.id,
        nombre: team.name,
        categoria: sortInfo.label,
        categoryId: team.category_id,
        temporada: seasonById.get(team.season_id) ?? CLUB.season,
        seasonId: team.season_id,
        deportistas: total,
        isActive: team.is_active,
        notes: team.notes ?? null,
        estado: !team.is_active ? 'Pendiente' : total >= 15 ? 'Completo' : 'Abierto',
        categoryOrder: sortInfo.order,
        suffixOrder: getTeamSuffixOrder(team.name),
      } as AdminTeamSortRow
    })
    .sort((a, b) => {
      if (a.categoryOrder !== b.categoryOrder) {
        return a.categoryOrder - b.categoryOrder
      }
      if (a.suffixOrder !== b.suffixOrder) {
        return a.suffixOrder - b.suffixOrder
      }
      return a.nombre.localeCompare(b.nombre, 'es')
    })
    .map(({ categoryOrder, suffixOrder, ...team }) => team)
}

function formatMatchTime(value: string | null) {
  if (!value) return 'Hora por confirmar'
  return value.slice(0, 5)
}

function getDateFromDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMatchWeekInfo(value: string) {
  const date = getDateFromDateString(value)
  const day = date.getDay() || 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const firstDay = firstThursday.getDay() || 7
  firstThursday.setDate(firstThursday.getDate() - firstDay + 4)
  const weekNumber = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604_800_000)
  const rangeFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })

  return {
    weekLabel: `Semana ${weekNumber}`,
    weekRangeLabel: `${rangeFormatter.format(monday)} - ${rangeFormatter.format(sunday)}`,
  }
}

export async function getAdminMatches(): Promise<AdminMatchRow[]> {
  const supabase = await createClient()
  const matchSelect =
    'id, team_id, season_id, opponent_name, match_date, match_time, location, is_home, match_type, round_label, status, home_score, away_score, home_possession, away_possession, home_offsides, away_offsides, home_corners, away_corners, home_total_shots, away_total_shots, home_shots, away_shots, home_shots_on_target, away_shots_on_target, home_blocked_shots, away_blocked_shots, home_goalkeeper_saves, away_goalkeeper_saves, home_tackles, away_tackles, home_passes, away_passes, home_completed_passes, away_completed_passes, home_fouls, away_fouls, home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards, notes'
  const fallbackMatchSelect =
    'id, team_id, season_id, opponent_name, match_date, match_time, location, is_home, match_type, round_label, status, home_score, away_score, notes'
  const [{ data: matchesWithStats, error: matchesError }, { data: teams }, { data: categories }, { data: seasons }] =
    await Promise.all([
      supabase
        .from('matches')
        .select(matchSelect)
        .order('match_date', { ascending: false })
        .order('match_time', { ascending: false, nullsFirst: false }),
      supabase.from('teams').select('id, name, category_id, season_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('seasons').select('id, name'),
    ])

  const matches = matchesError
    ? (await supabase
        .from('matches')
        .select(fallbackMatchSelect)
        .order('match_date', { ascending: false })
        .order('match_time', { ascending: false, nullsFirst: false })).data
    : matchesWithStats

  const matchIds = (matches ?? []).map((match) => match.id)
  const teamIds = Array.from(new Set((matches ?? []).map((match) => match.team_id)))
  const [{ data: athletes }, { data: savedPlayerStats, error: playerStatsError }] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('athletes')
          .select('id, first_name, last_name, assigned_team_id, position, status')
          .in('assigned_team_id', teamIds)
          .order('first_name', { ascending: true })
          .order('last_name', { ascending: true })
      : Promise.resolve({ data: [] }),
    matchIds.length > 0
      ? supabase
          .from('match_player_stats')
          .select('match_id, athlete_id, position, is_called_up, is_starter, shirt_number, minutes, goals, goal_minutes, assists, fouls_committed, fouls_received, yellow_cards, yellow_card_minutes, red_cards, red_card_minute, shots, saves, notes')
          .in('match_id', matchIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  type MatchAthleteRow = {
    id: string
    first_name: string
    last_name: string
    assigned_team_id: string | null
    position: string | null
  }

  type SavedMatchPlayerStatRow = {
    match_id: string
    athlete_id: string
    position: string | null
    is_called_up: boolean
    is_starter: boolean
    shirt_number: number | null
    minutes: number
    goals: number
    goal_minutes: string | null
    assists: number
    fouls_committed: number
    fouls_received: number
    yellow_cards: number
    yellow_card_minutes: string | null
    red_cards: number
    red_card_minute: number | null
    shots: number
    saves: number
    notes: string | null
  }

  const athleteRows = (athletes ?? []) as MatchAthleteRow[]
  const savedPlayerStatRows = (savedPlayerStats ?? []) as SavedMatchPlayerStatRow[]
  const teamById = new Map((teams ?? []).map((team) => [team.id, team]))
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const athletesByTeamId = new Map<string, MatchAthleteRow[]>()
  const playerStatsByMatchAndAthlete = new Map<string, SavedMatchPlayerStatRow>()

  for (const athlete of athleteRows) {
    if (!athlete.assigned_team_id) continue
    const current = athletesByTeamId.get(athlete.assigned_team_id) ?? []
    current.push(athlete)
    athletesByTeamId.set(athlete.assigned_team_id, current)
  }

  if (!playerStatsError) {
    for (const stat of savedPlayerStatRows) {
      playerStatsByMatchAndAthlete.set(`${stat.match_id}:${stat.athlete_id}`, stat)
    }
  }

  return (matches ?? []).map((match) => {
    const stats = match as typeof match & Record<string, number | null | undefined>
    const team = teamById.get(match.team_id)
    const categoryName = team ? categoryById.get(team.category_id) ?? 'Sin categoría' : 'Sin categoría'
    const sortInfo = getTeamCategorySortInfo(team?.name ?? '', categoryName)
    const weekInfo = getMatchWeekInfo(match.match_date)
    const playerStats: AdminMatchPlayerStat[] = (athletesByTeamId.get(match.team_id) ?? []).map((athlete) => {
      const saved = playerStatsByMatchAndAthlete.get(`${match.id}:${athlete.id}`)

      return {
        athleteId: athlete.id,
        athleteName: `${athlete.first_name} ${athlete.last_name}`.trim(),
        position: (saved?.position ?? athlete.position ?? null) as PlayerPosition | null,
        isCalledUp: saved?.is_called_up ?? false,
        isStarter: saved?.is_starter ?? false,
        shirtNumber: saved?.shirt_number ?? null,
        minutes: saved?.minutes ?? 0,
        goals: saved?.goals ?? 0,
        goalMinutes: saved?.goal_minutes ?? '',
        assists: saved?.assists ?? 0,
        foulsCommitted: saved?.fouls_committed ?? 0,
        foulsReceived: saved?.fouls_received ?? 0,
        yellowCards: saved?.yellow_cards ?? 0,
        yellowCardMinutes: saved?.yellow_card_minutes ?? '',
        redCards: saved?.red_cards ?? 0,
        redCardMinute: saved?.red_card_minute ?? null,
        shots: saved?.shots ?? 0,
        saves: saved?.saves ?? 0,
        notes: saved?.notes ?? '',
      }
    })

    return {
      id: match.id,
      teamId: match.team_id,
      teamName: team?.name ?? 'Equipo no disponible',
      categoryName: sortInfo.label,
      seasonId: match.season_id,
      seasonName: seasonById.get(match.season_id) ?? 'Temporada no disponible',
      opponentName: match.opponent_name,
      matchDate: match.match_date,
      matchTime: match.match_time ?? '',
      dateLabel: formatSpanishDate(match.match_date),
      timeLabel: formatMatchTime(match.match_time),
      weekLabel: weekInfo.weekLabel,
      weekRangeLabel: weekInfo.weekRangeLabel,
      location: match.location ?? '',
      isHome: Boolean(match.is_home),
      matchType: (match.match_type ?? 'league') as AdminMatchType,
      roundLabel: match.round_label ?? '',
      status: match.status as AdminMatchStatus,
      homeScore: match.home_score,
      awayScore: match.away_score,
      homePossession: stats.home_possession ?? null,
      awayPossession: stats.away_possession ?? null,
      homeOffsides: stats.home_offsides ?? null,
      awayOffsides: stats.away_offsides ?? null,
      homeCorners: stats.home_corners ?? null,
      awayCorners: stats.away_corners ?? null,
      homeTotalShots: stats.home_total_shots ?? null,
      awayTotalShots: stats.away_total_shots ?? null,
      homeShots: stats.home_shots ?? null,
      awayShots: stats.away_shots ?? null,
      homeShotsOnTarget: stats.home_shots_on_target ?? null,
      awayShotsOnTarget: stats.away_shots_on_target ?? null,
      homeBlockedShots: stats.home_blocked_shots ?? null,
      awayBlockedShots: stats.away_blocked_shots ?? null,
      homeGoalkeeperSaves: stats.home_goalkeeper_saves ?? null,
      awayGoalkeeperSaves: stats.away_goalkeeper_saves ?? null,
      homeTackles: stats.home_tackles ?? null,
      awayTackles: stats.away_tackles ?? null,
      homePasses: stats.home_passes ?? null,
      awayPasses: stats.away_passes ?? null,
      homeCompletedPasses: stats.home_completed_passes ?? null,
      awayCompletedPasses: stats.away_completed_passes ?? null,
      homeFouls: stats.home_fouls ?? null,
      awayFouls: stats.away_fouls ?? null,
      homeYellowCards: stats.home_yellow_cards ?? null,
      awayYellowCards: stats.away_yellow_cards ?? null,
      homeRedCards: stats.home_red_cards ?? null,
      awayRedCards: stats.away_red_cards ?? null,
      notes: match.notes ?? '',
      playerStats,
    }
  })
}

export async function getAdminSponsors(): Promise<AdminSponsorRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sponsors')
    .select('id, title, image_url, is_active, sort_order, created_at')
    .order('sort_order', { ascending: true })

  return (data ?? []).map((sponsor) => ({
    id: sponsor.id,
    title: sponsor.title,
    imageUrl: sponsor.image_url,
    isActive: sponsor.is_active,
    sortOrder: sponsor.sort_order,
    tier: getSponsorTierFromSortOrder(sponsor.sort_order),
    createdAt: sponsor.created_at,
  }))
}

export async function getAdminNews(): Promise<AdminNewsRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('news')
    .select('id, title, body, image_url, section_id, created_at, news_sections(name)')
    .order('created_at', { ascending: false })

  return (data ?? []).map((item) => {
    const section = Array.isArray(item.news_sections) ? item.news_sections[0] : item.news_sections

    return {
      id: item.id,
      title: item.title,
      body: item.body ?? null,
      imageUrl: item.image_url,
      sectionId: item.section_id ?? null,
      sectionName: section?.name ?? 'Sin sección',
      createdAt: formatSpanishDateTime(item.created_at),
    }
  })
}

export async function getAdminNewsSections(): Promise<AdminNewsSectionRow[]> {
  const supabase = await createClient()
  const [{ data: sections }, { data: news }] = await Promise.all([
    supabase
      .from('news_sections')
      .select('id, name, sort_order, is_active, created_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('news').select('id, section_id'),
  ])

  const newsCountBySection = new Map<string, number>()
  for (const item of news ?? []) {
    if (!item.section_id) continue
    newsCountBySection.set(item.section_id, (newsCountBySection.get(item.section_id) ?? 0) + 1)
  }

  return (sections ?? []).map((section) => ({
    id: section.id,
    name: section.name,
    sortOrder: section.sort_order,
    isActive: section.is_active,
    newsCount: newsCountBySection.get(section.id) ?? 0,
    createdAt: formatSpanishDateTime(section.created_at),
  }))
}

export async function getAdminAuditLogs(): Promise<AdminAuditLogRow[]> {
  const supabase = await createClient()
  const [{ data: logs }, { data: profiles }] = await Promise.all([
    supabase
      .from('admin_audit_logs')
      .select('id, actor_user_id, action, entity_type, entity_id, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('profiles').select('id, email, first_name, last_name'),
  ])

  const profileById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        email: profile.email ?? '',
        name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email || 'Administrador',
      },
    ]),
  )

  return (logs ?? []).map((log) => {
    const actor = log.actor_user_id ? profileById.get(log.actor_user_id) : null

    return {
      id: log.id,
      actorName: actor?.name ?? 'Administrador no disponible',
      actorEmail: actor?.email ?? '',
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id ?? '',
      summary: log.summary,
      createdAt: formatSpanishDateTime(log.created_at),
    }
  })
}

export async function getAdminTeamDetail(teamId: string): Promise<AdminTeamDetail | null> {
  const { guardians, athletes, categories, teams, seasons } = await getAdminCollections()

  const team = teams.find((t) => t.id === teamId)
  if (!team) return null

  const guardianById = createGuardianNameLookup(guardians)
  const categoryById = new Map(categories.map((c) => [c.id, c.name]))
  const seasonById   = new Map(seasons.map((s) => [s.id, s.name]))

  const teamAthletes = athletes.filter((a) => a.assigned_team_id === teamId)
  const totalMembers = teamAthletes.length

  const members: AdminTeamMember[] = teamAthletes.map((a) => ({
    id: a.id,
    nombre: `${a.first_name} ${a.last_name}`.trim(),
    tutor: guardianById.get(a.guardian_id)?.name ?? 'Tutor no disponible',
    position: (a.position ?? null) as PlayerPosition | null,
    estadoMatricula: mapStatusLabel(a.status),
  }))

  const available: AdminAvailableAthlete[] = athletes
    .filter(
      (a) =>
        a.season_id === team.season_id &&
        !a.assigned_team_id &&
        a.requested_category_id === team.category_id,
    )
    .map((a) => ({
      id: a.id,
      nombre: `${a.first_name} ${a.last_name}`.trim(),
      tutor: guardianById.get(a.guardian_id)?.name ?? 'Tutor no disponible',
    }))

  return {
    id: team.id,
    nombre: team.name,
    categoria: categoryById.get(team.category_id) ?? 'Sin categoría',
    categoryId: team.category_id,
    temporada: seasonById.get(team.season_id) ?? CLUB.season,
    seasonId: team.season_id,
    deportistas: totalMembers,
    isActive: team.is_active,
    notes: team.notes ?? null,
    estado: !team.is_active ? 'Pendiente' : totalMembers >= 15 ? 'Completo' : 'Abierto',
    members,
    available,
  }
}

export async function getAdminSeasons(): Promise<AdminSeasonRow[]> {
  const { seasons } = await getAdminCollections()
  const today = new Date().toISOString().slice(0, 10)

  return seasons
    .map((season) => ({
      id: season.id,
      nombre: season.name,
      fechaInicio: formatSpanishDate(season.starts_at),
      fechaFin: formatSpanishDate(season.ends_at),
      startsAt: season.starts_at,
      endsAt: season.ends_at,
      isActive: season.is_active,
      estado: (
        season.is_active
          ? 'Activa'
          : season.starts_at > today
            ? 'Planificada'
            : 'Cerrada'
      ) as AdminSeasonRow['estado'],
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminEnrollments(): Promise<AdminEnrollmentRow[]> {
  const { payments } = await getAdminCollections()
  const settings = await getAdminSettings()
  const latestEnrollmentPaymentByAthlete = createLatestEnrollmentPaymentByAthlete(payments)

  const athleteRows = await getAdminAthletes()
  return athleteRows.map((athlete) => ({
    id: athlete.id,
    deportista: athlete.nombre,
    tutor: athlete.tutor,
    temporada: athlete.temporada,
    estadoMatricula: athlete.estadoMatricula,
    estadoPago:
      athlete.estadoMatricula === 'Matriculado' ||
      latestEnrollmentPaymentByAthlete.get(athlete.id)?.status === 'paid'
        ? 'Pagado'
        : 'Pendiente',
    importe: settings.enrollmentFeeEuros,
  }))
}

export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  const { guardians, athletes, payments, profiles } = await getAdminCollections()
  const guardianById = createGuardianNameLookup(guardians)
  const athleteById = new Map(
    athletes.map((athlete) => [athlete.id, `${athlete.first_name} ${athlete.last_name}`.trim()]),
  )
  const profileById = new Map(
    profiles.map((profile) => [
      profile.id,
      `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email,
    ]),
  )

  return payments.map((payment) => ({
    id: payment.id,
    operacion: payment.payment_type === 'membership' ? 'Cuota de socio' : 'Matrícula inicial',
    deportista: payment.athlete_id
      ? athleteById.get(payment.athlete_id) ?? 'Deportista no disponible'
      : 'Cuota de socio',
    tutor:
      (payment.guardian_id ? guardianById.get(payment.guardian_id)?.name : null) ??
      profileById.get(payment.user_id) ??
      'Usuario no disponible',
    importe: payment.amount_cents / 100,
    estado: mapPaymentStatusLabel(payment.status),
    proveedor: mapPaymentProviderLabel(payment.provider),
    fecha: formatSpanishDate(payment.paid_at ?? payment.created_at),
    stripePaymentIntentId: payment.stripe_payment_intent_id ?? '',
  }))
}

export async function getAdminFinanceMovements(): Promise<AdminFinanceMovementRow[]> {
  const supabase = await createClient()
  const [{ data }, { data: seasons }] = await Promise.all([
    supabase
    .from('admin_finance_movements')
      .select('id, movement_type, concept, detail, category, payment_method, status, season_id, receipt_url, amount_cents, recorded_at')
    .order('recorded_at', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('seasons').select('id, name'),
  ])

  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))

  return ((data ?? []) as AdminFinanceMovementRecord[]).map((movement) => ({
    id: movement.id,
    tipo: movement.movement_type === 'income' ? 'ingreso' : 'gasto',
    concepto: movement.concept,
    detalle: movement.detail ?? '',
    categoria: movement.category ?? 'Sin categoría',
    metodoPago: movement.payment_method ?? 'cash',
    estado: movement.status ?? 'confirmed',
    seasonId: movement.season_id,
    temporada: movement.season_id ? seasonById.get(movement.season_id) ?? 'Temporada no disponible' : 'Sin temporada',
    justificanteUrl: movement.receipt_url ?? '',
    importe: movement.amount_cents / 100,
    fecha: formatSpanishDateTime(movement.recorded_at),
  }))
}

export async function getAdminFeeTemplates(): Promise<AdminFeeTemplateRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_fee_templates')
    .select('id, name, fee_type, total_amount_cents, is_public, split_payment, charge_frequency, charge_count, created_at')
    .order('created_at', { ascending: false })

  return ((data ?? []) as AdminFeeTemplateRecord[]).map((fee) => ({
    id: fee.id,
    nombre: fee.name,
    tipo: fee.fee_type,
    importe: fee.total_amount_cents / 100,
    isPublic: fee.is_public,
    splitPayment: fee.split_payment,
    chargeFrequency: fee.charge_frequency ?? '',
    chargeCount: fee.charge_count,
    createdAt: formatSpanishDateTime(fee.created_at),
  }))
}

export async function getAdminTutorFeeAssignments(): Promise<AdminTutorFeeAssignmentRow[]> {
  const supabase = await createClient()
  const [{ data: assignments }, { data: feeTemplates }, { data: charges }, { data: athletes }] = await Promise.all([
    supabase
      .from('tutor_fee_assignments')
      .select('id, guardian_id, athlete_id, fee_template_id, charge_day, start_month, status, created_at')
      .neq('status', 'canceled')
      .order('created_at', { ascending: false }),
    supabase
      .from('admin_fee_templates')
      .select('id, name, fee_type, total_amount_cents, is_public, split_payment, charge_frequency, charge_count, created_at'),
    supabase
      .from('tutor_fee_charges')
      .select('assignment_id, due_date, amount_cents, status')
      .order('due_date', { ascending: true }),
    supabase
      .from('athletes')
      .select('id, first_name, last_name'),
  ])

  const feeById = new Map(
    ((feeTemplates ?? []) as AdminFeeTemplateRecord[]).map((fee) => [fee.id, fee]),
  )
  const athleteById = new Map(
    (athletes ?? []).map((athlete) => [
      athlete.id,
      `${athlete.first_name} ${athlete.last_name}`.trim(),
    ]),
  )
  const chargesByAssignment = new Map<string, AdminTutorFeeChargeRecord[]>()

  for (const charge of ((charges ?? []) as AdminTutorFeeChargeRecord[])) {
    const current = chargesByAssignment.get(charge.assignment_id) ?? []
    current.push(charge)
    chargesByAssignment.set(charge.assignment_id, current)
  }

  return ((assignments ?? []) as AdminTutorFeeAssignmentRecord[]).map((assignment) => {
    const fee = feeById.get(assignment.fee_template_id)
    const assignmentCharges = chargesByAssignment.get(assignment.id) ?? []
    const nextCharge = assignmentCharges.find((charge) => charge.status === 'scheduled')
    const totalAmountCents =
      assignmentCharges.length > 0
        ? assignmentCharges.reduce((sum, charge) => sum + Number(charge.amount_cents ?? 0), 0)
        : fee?.total_amount_cents ?? 0

    return {
      id: assignment.id,
      guardianId: assignment.guardian_id,
      athleteId: assignment.athlete_id,
      athleteName: assignment.athlete_id
        ? athleteById.get(assignment.athlete_id) ?? 'Deportista no disponible'
        : 'Cuota familiar',
      feeTemplateId: assignment.fee_template_id,
      feeName: fee?.name ?? 'Cuota no disponible',
      feeType: fee?.fee_type ?? 'Sin tipo',
      totalAmount: totalAmountCents / 100,
      chargeDay: assignment.charge_day,
      startMonth: formatSpanishDate(assignment.start_month),
      status: assignment.status,
      scheduledCharges: assignmentCharges.filter((charge) => charge.status === 'scheduled').length,
      paidCharges: assignmentCharges.filter((charge) => charge.status === 'paid').length,
      nextChargeDate: nextCharge ? formatSpanishDate(nextCharge.due_date) : 'Sin cargos pendientes',
      createdAt: formatSpanishDateTime(assignment.created_at),
    }
  })
}

export async function getAdminConsents(): Promise<AdminConsentRow[]> {
  const { guardians, athletes, consents, consentDocuments } = await getAdminCollections()
  const guardianById = createGuardianNameLookup(guardians)
  const athleteById = new Map(
    athletes.map((athlete) => [athlete.id, `${athlete.first_name} ${athlete.last_name}`.trim()]),
  )
  const documentById = new Map(
    consentDocuments.map((document) => [document.id, document]),
  )

  return consents
    .map((consent) => ({
      id: consent.id,
      usuario: consent.athlete_id
        ? athleteById.get(consent.athlete_id) ?? 'Deportista no disponible'
        : guardianById.get(consent.guardian_id)?.name ?? 'Tutor no disponible',
      tipoConsentimiento:
        documentById.get(consent.document_id)?.title ?? 'Consentimiento no disponible',
      version: documentById.get(consent.document_id)?.version ?? 'Sin versión',
      estado: (consent.revoked_at ? 'Revocado' : 'Firmado') as AdminConsentRow['estado'],
      fecha: formatSpanishDate(consent.accepted_at),
      firmante: consent.signer_full_name,
    }))
    .sort((a, b) => a.usuario.localeCompare(b.usuario, 'es'))
}

export async function getAdminManagers(): Promise<AdminManagerRow[]> {
  const users = await getAdminUsers()
  return users
    .filter((user) => user.rol === 'Administrador')
    .map((user) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: 'Administrador',
      estado: 'Activo',
      fechaAlta: user.fechaAlta,
    }))
}

export async function getAdminCoaches(): Promise<AdminCoachRow[]> {
  const { profiles, roles, teams, coachTeamAssignments } = await getAdminCollections()
  const coachIds = new Set(roles.filter((role) => role.role === 'coach').map((role) => role.user_id))
  const teamById = new Map(teams.map((team) => [team.id, team.name]))
  const assignmentByCoachId = new Map(
    coachTeamAssignments.map((assignment) => [assignment.coach_user_id, assignment.team_id]),
  )

  return profiles
    .filter((profile) => coachIds.has(profile.id))
    .map((profile) => {
      const teamId = assignmentByCoachId.get(profile.id)

      return {
        id: profile.id,
        nombre: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Entrenador',
        email: profile.email,
        equipo: teamId ? teamById.get(teamId) ?? 'Equipo no disponible' : 'Sin equipo',
        rol: 'Entrenador' as const,
        estado: 'Activo' as const,
        fechaAlta: formatSpanishDate(profile.created_at),
      }
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function getAdminCoachTeamOptions(): Promise<AdminCoachTeamOption[]> {
  const teams = await getAdminTeams()

  return teams
    .filter((team) => team.isActive)
    .map((team) => ({
      id: team.id,
      nombre: `${team.nombre} · ${team.categoria} · ${team.temporada}`,
    }))
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const fallback: AdminSettings = {
    clubShortName: CLUB.shortName,
    clubLegalName: CLUB.legalName,
    seasonLabel: CLUB.season,
    membershipFeeEuros: MEMBERSHIP_IMPORTE,
    enrollmentFeeEuros: MATRICULA_IMPORTE,
    registrationOpen: true,
    contactEmail: '',
    contactPhone: '',
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('app_settings').select('key, value')

  if (error) return fallback

  const settings = new Map((data ?? []).map((item) => [item.key, item.value]))
  const readNumber = (key: string, defaultValue: number) => {
    const value = Number(settings.get(key))
    return Number.isFinite(value) ? value : defaultValue
  }

  return {
    clubShortName: settings.get('club_short_name') || fallback.clubShortName,
    clubLegalName: settings.get('club_legal_name') || fallback.clubLegalName,
    seasonLabel: settings.get('season_label') || fallback.seasonLabel,
    membershipFeeEuros: readNumber('membership_fee_euros', fallback.membershipFeeEuros),
    enrollmentFeeEuros: readNumber('enrollment_fee_euros', fallback.enrollmentFeeEuros),
    registrationOpen: (settings.get('registration_open') ?? String(fallback.registrationOpen)) === 'true',
    contactEmail: settings.get('contact_email') || '',
    contactPhone: settings.get('contact_phone') || '',
  }
}

export async function getAdminConfig(): Promise<AdminConfigData> {
  const { seasons, teams, categories } = await getAdminCollections()
  const activeSeason = seasons.find((season) => season.is_active)
  const settings = await getAdminSettings()

  const summary = [
    {
      id: 'cfg-season',
      titulo: 'Temporada activa',
      valor: activeSeason?.name ?? CLUB.season,
      descripcion: 'Temporada marcada actualmente como activa en la plataforma.',
    },
    {
      id: 'cfg-fee',
      titulo: 'Importe matrícula',
      valor: `${settings.enrollmentFeeEuros.toFixed(2).replace('.', ',')} €`,
      descripcion: 'Importe aplicado actualmente por la app al resumen de matrículas.',
    },
    {
      id: 'cfg-member-fee',
      titulo: 'Cuota de socio',
      valor: `${settings.membershipFeeEuros.toFixed(2).replace('.', ',')} €`,
      descripcion: 'Importe base configurado para el alta como socio.',
    },
    {
      id: 'cfg-categories',
      titulo: 'Categorías activas',
      valor: String(categories.filter((category) => category.is_active).length),
      descripcion: 'Número de categorías activas disponibles actualmente.',
    },
    {
      id: 'cfg-teams',
      titulo: 'Equipos activos',
      valor: String(teams.filter((team) => team.is_active).length),
      descripcion: 'Número de equipos activos configurados actualmente.',
    },
    {
      id: 'cfg-stripe',
      titulo: 'Estado de pagos',
      valor: 'Activo',
      descripcion: 'Los pagos están disponibles y su estado se actualiza automáticamente.',
    },
  ]

  return {
    summary,
    settings,
    seasons: await getAdminSeasons(),
    activeSeasonId: activeSeason?.id ?? '',
  }
}
