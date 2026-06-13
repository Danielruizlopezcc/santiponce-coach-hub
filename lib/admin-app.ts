import 'server-only'

import { CLUB, MATRICULA_IMPORTE } from '@/lib/club'
import { formatSpanishDate } from '@/lib/format'
import { getPrivateViewer } from '@/lib/private-app'
import type { PrivateViewer } from '@/lib/private-app-shared'
import { createClient } from '@/lib/supabase/server'

export type AdminViewer = PrivateViewer & {
  roleLabel: string
}

export type AdminSummary = {
  usuarios: number
  tutores: number
  sociosActivos: number
  tutoresSocios: number
  tutoresOSocios: number
  deportistasMatriculados: number
  deportistasEnRevision: number
  deportistasPendientes: number
  deportistasSinEquipo: number
  ingresosSociosEuros: number
  ingresosEuros: number
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
  nombre: string
  documento: string
  telefono: string
  ciudad: string
  deportistasAsociados: number
}

export type AdminAthleteRow = {
  id: string
  nombre: string
  tutor: string
  categoriaSolicitada: string
  equipoAsignado: string
  temporada: string
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

export type AdminSeasonRow = {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
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

export type AdminAuditRow = {
  id: string
  fecha: string
  usuarioAdmin: string
  accion: string
  entidad: string
  resultado: 'Pendiente'
}

export type AdminManagerRow = {
  id: string
  nombre: string
  email: string
  rol: string
  estado: 'Activo'
}

export type AdminSponsorRow = {
  id: string
  title: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export type AdminConfigRow = {
  id: string
  titulo: string
  valor: string
  descripcion: string
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
  status: 'pending' | 'paid' | 'canceled' | 'failed'
  amount_cents: number
  description: string
  paid_at: string | null
  created_at: string
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
    { data: guardians },
    { data: athletes },
    { data: categories },
    { data: teams },
    { data: seasons },
    { data: consents },
    { data: consentDocuments },
    { data: payments },
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, first_name, last_name, created_at'),
    supabase.from('user_roles').select('user_id, role'),
    supabase.from('guardians').select('id, user_id, first_name, last_name, phone, document_id, city'),
    supabase
      .from('athletes')
      .select(
        'id, guardian_id, first_name, last_name, status, requested_category_id, assigned_team_id, season_id, created_at',
      ),
    supabase.from('categories').select('id, name, sort_order, is_active'),
    supabase.from('teams').select('id, name, category_id, season_id, is_active, notes'),
    supabase.from('seasons').select('id, name, starts_at, ends_at, is_active'),
    supabase
      .from('consents')
      .select('id, guardian_id, athlete_id, document_id, accepted, signer_full_name, accepted_at, revoked_at'),
    supabase.from('consent_documents').select('id, title, version'),
    supabase
      .from('payments')
      .select(
        'id, user_id, guardian_id, athlete_id, season_id, payment_type, provider, status, amount_cents, description, paid_at, created_at',
      )
      .order('created_at', { ascending: false }),
  ])

  return {
    profiles: profiles ?? [],
    roles: roles ?? [],
    guardians: guardians ?? [],
    athletes: athletes ?? [],
    categories: categories ?? [],
    teams: teams ?? [],
    seasons: seasons ?? [],
    consents: consents ?? [],
    consentDocuments: consentDocuments ?? [],
    payments: (payments ?? []) as AdminPaymentRecord[],
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
  if (status === 'canceled') return 'fallido'
  return 'fallido'
}

function mapPaymentProviderLabel(
  provider: AdminPaymentRecord['provider'],
): AdminPaymentRow['proveedor'] {
  return provider === 'manual' ? 'Manual' : 'Stripe'
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { profiles, guardians, athletes, categories, teams, seasons, consents, payments } =
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
    tutores: guardians.length,
    sociosActivos: activeMemberIds.size,
    tutoresSocios,
    tutoresOSocios,
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
    ingresosSociosEuros: payments
      .filter((payment) => payment.payment_type === 'membership' && payment.status === 'paid')
      .reduce((total, payment) => total + payment.amount_cents, 0) / 100,
    ingresosEuros: payments
      .filter((payment) => payment.payment_type === 'enrollment' && payment.status === 'paid')
      .reduce((total, payment) => total + payment.amount_cents, 0) / 100,
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
  const { guardians, athletes } = await getAdminCollections()
  const athleteCountByGuardian = new Map<string, number>()

  for (const athlete of athletes) {
    athleteCountByGuardian.set(
      athlete.guardian_id,
      (athleteCountByGuardian.get(athlete.guardian_id) ?? 0) + 1,
    )
  }

  return guardians
    .map((guardian) => ({
      id: guardian.id,
      nombre: `${guardian.first_name} ${guardian.last_name}`.trim(),
      documento: guardian.document_id,
      telefono: guardian.phone,
      ciudad: guardian.city,
      deportistasAsociados: athleteCountByGuardian.get(guardian.id) ?? 0,
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
      tutor: guardianById.get(athlete.guardian_id)?.name ?? 'Tutor no disponible',
      categoriaSolicitada:
        categoryById.get(athlete.requested_category_id) ?? 'Categoría pendiente',
      equipoAsignado: athlete.assigned_team_id
        ? teamById.get(athlete.assigned_team_id) ?? 'Equipo pendiente'
        : 'Sin equipo asignado',
      temporada: seasonById.get(athlete.season_id) ?? CLUB.season,
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
      return {
        id: team.id,
        nombre: team.name,
        categoria: categoryById.get(team.category_id) ?? 'Sin categoría',
        categoryId: team.category_id,
        temporada: seasonById.get(team.season_id) ?? CLUB.season,
        seasonId: team.season_id,
        deportistas: total,
        isActive: team.is_active,
        notes: team.notes ?? null,
        estado: !team.is_active ? 'Pendiente' : total >= 15 ? 'Completo' : 'Abierto',
      } as AdminTeamRow
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
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
    createdAt: sponsor.created_at,
  }))
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
    importe: MATRICULA_IMPORTE,
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
  }))
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

export async function getAdminAudit(): Promise<AdminAuditRow[]> {
  const payments = await getAdminPayments()
  return payments.map((payment) => ({
    id: payment.id,
    fecha: payment.fecha,
    usuarioAdmin: 'Sistema',
    accion: `Pago ${payment.estado}`,
    entidad: payment.deportista,
    resultado: 'Pendiente',
  }))
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
    }))
}

export async function getAdminConfig(): Promise<AdminConfigRow[]> {
  const { seasons, teams, categories } = await getAdminCollections()
  const activeSeason = seasons.find((season) => season.is_active)

  return [
    {
      id: 'cfg-season',
      titulo: 'Temporada activa',
      valor: activeSeason?.name ?? CLUB.season,
      descripcion: 'Temporada marcada actualmente como activa en la plataforma.',
    },
    {
      id: 'cfg-fee',
      titulo: 'Importe matrícula',
      valor: `${MATRICULA_IMPORTE.toFixed(2).replace('.', ',')} €`,
      descripcion: 'Importe aplicado actualmente por la app al resumen de matrículas.',
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
    {
      id: 'cfg-audit',
      titulo: 'Auditoría',
      valor: 'Sin tabla dedicada',
      descripcion: 'La pantalla de auditoría usa únicamente eventos derivados mientras no exista una tabla propia.',
    },
  ]
}
