import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { CLUB, MATRICULA_IMPORTE } from '@/lib/club'
import type {
  PrivateAthleteDetail,
  PrivateDashboardData,
  PrivateMemberProfile,
  PrivateNewsData,
  PrivateNewsDetail,
  PrivateSponsor,
  PrivateTeamDetail,
  PrivateTeamPlayer,
  PrivateTeamSummary,
  PrivateTutorProfile,
  PrivateUserStatus,
  PrivateViewer,
  PlayerPosition,
} from '@/lib/private-app-shared'
import { getSavedStripeCardByEmail } from '@/lib/stripe-payment-methods'
import { getSponsorTierFromSortOrder } from '@/lib/sponsors'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getTeamShirtNumbers } from '@/lib/team-shirt-numbers'
import { getTeamCategorySortInfo, getTeamSuffixOrder } from '@/lib/team-order'

type PrivateCollections = {
  guardianId: string | null
  isGuardianApproved: boolean
  guardianApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  activeSeasonLabel: string
  categoriesById: Map<string, string>
  categoryEnrollmentFeeCentsById: Map<string, number | null>
  teamsById: Map<string, string>
  seasonsById: Map<string, string>
}

type EnrollmentPaymentStatus = 'pending' | 'paid' | 'canceled' | 'failed'

function getInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || 'U'
}

async function getLatestEnrollmentPaymentByAthlete(
  guardianId: string,
): Promise<Map<string, EnrollmentPaymentStatus>> {
  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('athlete_id, status, created_at')
    .eq('guardian_id', guardianId)
    .eq('payment_type', 'enrollment')
    .not('athlete_id', 'is', null)
    .order('created_at', { ascending: false })

  const paymentByAthlete = new Map<string, EnrollmentPaymentStatus>()
  for (const payment of payments ?? []) {
    if (!payment.athlete_id || paymentByAthlete.has(payment.athlete_id)) continue
    paymentByAthlete.set(payment.athlete_id, payment.status as EnrollmentPaymentStatus)
  }

  return paymentByAthlete
}

function getAthleteDisplayStatus(
  status: 'pendiente' | 'matriculado' | 'en_revision',
  paymentStatus?: EnrollmentPaymentStatus,
) {
  if (status === 'matriculado') return 'matriculado' as const
  if (paymentStatus === 'pending') return 'en_revision' as const
  return status
}

function mapPrivateTeamPlayerStatus(
  status: 'pendiente' | 'matriculado' | 'en_revision',
): PrivateTeamPlayer['estadoMatricula'] {
  if (status === 'matriculado') return 'Matriculado'
  if (status === 'en_revision') return 'En revisión'
  return 'Pendiente'
}

export async function getPrivateViewer(userId: string): Promise<PrivateViewer> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('id', userId)
    .maybeSingle()

  const firstName = profile?.first_name?.trim() || 'Usuario'
  const lastName = profile?.last_name?.trim() || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return {
    id: userId,
    firstName,
    fullName,
    email: profile?.email ?? '',
    initials: getInitials(firstName, lastName),
  }
}

async function getPrivateCollections(userId: string): Promise<PrivateCollections> {
  const supabase = await createClient()
  const [{ data: activeSeason }, { data: guardian }, { data: categories }, { data: teams }, { data: seasons }] =
    await Promise.all([
      supabase.from('seasons').select('id, name').eq('is_active', true).maybeSingle(),
      supabase.from('guardians').select('id, is_approved, approval_status').eq('user_id', userId).maybeSingle(),
      supabase.from('categories').select('id, name, enrollment_fee_cents'),
      supabase.from('teams').select('id, name'),
      supabase.from('seasons').select('id, name'),
    ])

  return {
    guardianId: guardian?.id ?? null,
    isGuardianApproved: Boolean(guardian?.is_approved),
    guardianApprovalStatus: (guardian?.approval_status ?? null) as PrivateCollections['guardianApprovalStatus'],
    activeSeasonLabel: activeSeason?.name ?? CLUB.season,
    categoriesById: new Map((categories ?? []).map((category) => [category.id, category.name])),
    categoryEnrollmentFeeCentsById: new Map(
      (categories ?? []).map((category) => [category.id, category.enrollment_fee_cents ?? null]),
    ),
    teamsById: new Map((teams ?? []).map((team) => [team.id, team.name])),
    seasonsById: new Map((seasons ?? []).map((season) => [season.id, season.name])),
  }
}

function getEnrollmentEurosForCategory(
  collections: PrivateCollections,
  categoryId: string,
  fallbackEuros: number,
) {
  const overrideCents = collections.categoryEnrollmentFeeCentsById.get(categoryId)
  return typeof overrideCents === 'number' ? overrideCents / 100 : fallbackEuros
}

export async function getPrivateUserStatus(userId: string): Promise<PrivateUserStatus> {
  noStore()

  const supabase = createAdminClient()

  const [{ data: guardian }, { data: profile }] = await Promise.all([
    supabase.from('guardians').select('id, is_approved, approval_status').eq('user_id', userId).maybeSingle(),
    supabase
      .from('profiles')
      .select('is_paid_member, email')
      .eq('id', userId)
      .maybeSingle(),
  ])

  const hasGuardian = Boolean(guardian?.id)
  const isSocio = !hasGuardian
  const savedStripeCard = hasGuardian ? await getSavedStripeCardByEmail(profile?.email) : null

  return {
    hasGuardian,
    isGuardianApproved: Boolean(guardian?.is_approved),
    guardianApprovalStatus: (guardian?.approval_status ?? null) as PrivateUserStatus['guardianApprovalStatus'],
    isSocio,
    isPaidSocio: Boolean(profile?.is_paid_member),
    hasSavedPaymentMethod: Boolean(savedStripeCard),
  }
}

export async function getPrivateDashboardData(
  userId: string,
): Promise<PrivateDashboardData> {
  const supabase = await createClient()

  const [viewer, collections, status] = await Promise.all([
    getPrivateViewer(userId),
    getPrivateCollections(userId),
    getPrivateUserStatus(userId),
  ])

  if (!collections.guardianId) {
    return {
      viewer,
      seasonLabel: collections.activeSeasonLabel,
      matriculaImporte: MATRICULA_IMPORTE,
      deportistas: [],
      hasGuardian: false,
      isGuardianApproved: false,
      guardianApprovalStatus: null,
      isPaidSocio: status.isPaidSocio,
    }
  }

  const { data: athletes } = await supabase
    .from('athletes')
    .select(
      'id, first_name, last_name, status, requested_category_id, assigned_team_id',
    )
    .eq('guardian_id', collections.guardianId)
    .order('created_at', { ascending: true })

  const paymentByAthlete = await getLatestEnrollmentPaymentByAthlete(collections.guardianId)

  return {
    viewer,
    seasonLabel: collections.activeSeasonLabel,
    matriculaImporte: MATRICULA_IMPORTE,
    deportistas: (athletes ?? []).map((athlete) => ({
      id: athlete.id,
      nombre: athlete.first_name,
      apellidos: athlete.last_name,
      categoriaSolicitada:
        collections.categoriesById.get(athlete.requested_category_id) ?? 'Categoría pendiente',
      equipoAsignado: athlete.assigned_team_id
        ? collections.teamsById.get(athlete.assigned_team_id) ?? 'Equipo pendiente'
        : null,
      estado: getAthleteDisplayStatus(athlete.status, paymentByAthlete.get(athlete.id)),
      importeMatricula: getEnrollmentEurosForCategory(collections, athlete.requested_category_id, MATRICULA_IMPORTE),
    })),
    hasGuardian: true,
    isGuardianApproved: collections.isGuardianApproved,
    guardianApprovalStatus: collections.guardianApprovalStatus,
    isPaidSocio: status.isPaidSocio,
  }
}

export async function getPrivateTutorProfile(userId: string): Promise<PrivateTutorProfile | null> {
  const supabase = await createClient()
  const [{ data: profile }, { data: guardian }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'email, first_name, last_name',
      )
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('guardians')
      .select(
        'first_name, last_name, phone, document_id, address_line, postal_code, province, city, country, payment_preference',
      )
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (!profile || !guardian) {
    return null
  }

  const savedStripeCard = await getSavedStripeCardByEmail(profile.email)

  return {
    nombre: guardian.first_name,
    apellidos: guardian.last_name,
    email: profile.email,
    telefono: guardian.phone,
    documento: guardian.document_id,
    direccion: guardian.address_line,
    codigoPostal: guardian.postal_code,
    provincia: guardian.province,
    ciudad: guardian.city,
    pais: guardian.country,
    preferenciaPago: guardian.payment_preference,
    metodoPago: {
      estado: savedStripeCard ? 'Método de pago guardado' : 'Pendiente de configurar',
      marca: savedStripeCard?.brand ?? undefined,
      ultimos4Digitos: savedStripeCard?.last4 ?? undefined,
      detalle:
        savedStripeCard?.brand && savedStripeCard.last4
          ? `${savedStripeCard.brand.toUpperCase()} terminada en ${savedStripeCard.last4}${savedStripeCard.expMonth && savedStripeCard.expYear ? ` · ${String(savedStripeCard.expMonth).padStart(2, '0')}/${savedStripeCard.expYear}` : ''}`
          : 'Añade una tarjeta para futuros cargos autorizados.',
    },
  }
}

export async function getPrivateAthletes(userId: string): Promise<PrivateAthleteDetail[]> {
  const supabase = await createClient()
  const collections = await getPrivateCollections(userId)

  if (!collections.guardianId) {
    return []
  }

  const { data: athletes } = await supabase
    .from('athletes')
    .select(
      'id, first_name, last_name, birth_date, identification_type, identification_value, email, mobile_phone, health_notes, has_siblings_in_club, sibling_name, requested_category_id, assigned_team_id, status, season_id',
    )
    .eq('guardian_id', collections.guardianId)
    .order('created_at', { ascending: true })

  const paymentByAthlete = await getLatestEnrollmentPaymentByAthlete(collections.guardianId)

  return (athletes ?? []).map((athlete) => ({
    id: athlete.id,
    nombre: athlete.first_name,
    apellidos: athlete.last_name,
    fechaNacimiento: athlete.birth_date,
    tipoIdentificacion: athlete.identification_type,
    documento: athlete.identification_value,
    email: athlete.email ?? '',
    telefono: athlete.mobile_phone ?? '',
    alergias: athlete.health_notes ?? '',
    tieneHermanos: athlete.has_siblings_in_club ? 'si' : 'no',
    nombreHermano: athlete.sibling_name ?? '',
    categoriaSolicitada:
      collections.categoriesById.get(athlete.requested_category_id) ?? 'Categoría pendiente',
    equipoAsignado: athlete.assigned_team_id
      ? collections.teamsById.get(athlete.assigned_team_id) ?? 'Equipo pendiente'
      : null,
    temporada: collections.seasonsById.get(athlete.season_id) ?? collections.activeSeasonLabel,
    estado: getAthleteDisplayStatus(athlete.status, paymentByAthlete.get(athlete.id)),
    pagoEstado:
      athlete.status === 'matriculado' || paymentByAthlete.get(athlete.id) === 'paid'
        ? 'pagado'
        : 'pendiente',
    importeMatricula: getEnrollmentEurosForCategory(collections, athlete.requested_category_id, MATRICULA_IMPORTE),
  }))
}

export async function getPrivateSponsors(): Promise<PrivateSponsor[]> {
  noStore()

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sponsors')
    .select('id, title, image_url, url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (data ?? []).map((sponsor) => ({
    id: sponsor.id,
    title: sponsor.title,
    imageUrl: sponsor.image_url,
    url: sponsor.url,
    tier: getSponsorTierFromSortOrder(sponsor.sort_order),
  }))
}

export async function getPrivateMemberProfile(userId: string): Promise<PrivateMemberProfile | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name, is_paid_member')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return null

  return {
    nombre: profile.first_name ?? '',
    apellidos: profile.last_name ?? '',
    email: profile.email,
    estadoSocio: profile.is_paid_member ? 'Socio pagado' : 'Pendiente',
  }
}

export async function getPrivateNewsData(): Promise<PrivateNewsData> {
  noStore()

  const supabase = createAdminClient()
  const [{ data: sections }, { data: news }] = await Promise.all([
    supabase
      .from('news_sections')
      .select('id, name, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('news')
      .select('id, title, body, image_url, section_id, created_at, news_sections(name, is_active)')
      .order('created_at', { ascending: false }),
  ])

  const activeSectionIds = new Set((sections ?? []).map((section) => section.id))

  return {
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      name: section.name,
    })),
    news: (news ?? [])
      .filter((item) => !item.section_id || activeSectionIds.has(item.section_id))
      .map((item) => {
        const section = Array.isArray(item.news_sections) ? item.news_sections[0] : item.news_sections

        return {
          id: item.id,
          title: item.title,
          body: item.body ?? null,
          imageUrl: item.image_url,
          sectionId: item.section_id ?? null,
          sectionName: section?.name ?? 'General',
          createdAt: item.created_at,
        }
      }),
  }
}

export async function getPrivateNewsDetail(id: string): Promise<PrivateNewsDetail | null> {
  noStore()

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('news')
    .select('id, title, body, image_url, section_id, created_at, news_sections(name)')
    .eq('id', id)
    .maybeSingle()

  if (!data) return null

  const section = Array.isArray(data.news_sections) ? data.news_sections[0] : data.news_sections

  return {
    id: data.id,
    title: data.title,
    body: data.body ?? null,
    imageUrl: data.image_url,
    sectionId: data.section_id ?? null,
    sectionName: section?.name ?? 'Sin seccion',
    createdAt: data.created_at,
  }
}

export async function getPrivateTeams(): Promise<PrivateTeamSummary[]> {
  noStore()

  const supabase = createAdminClient()
  const [{ data: teams }, { data: athletes }, { data: categories }, { data: seasons }] =
    await Promise.all([
      supabase.from('teams').select('id, name, category_id, season_id, is_active'),
      supabase.from('athletes').select('assigned_team_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('seasons').select('id, name'),
    ])

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const athleteCountByTeam = new Map<string, number>()
  type PrivateTeamSortRow = PrivateTeamSummary & {
    categoryOrder: number
    suffixOrder: number
  }

  for (const athlete of athletes ?? []) {
    if (!athlete.assigned_team_id) continue
    athleteCountByTeam.set(
      athlete.assigned_team_id,
      (athleteCountByTeam.get(athlete.assigned_team_id) ?? 0) + 1,
    )
  }

  return (teams ?? [])
    .map((team) => {
      const total = athleteCountByTeam.get(team.id) ?? 0
      const categoryName = categoryById.get(team.category_id) ?? 'Sin categoría'
      const sortInfo = getTeamCategorySortInfo(team.name, categoryName)

      return {
        id: team.id,
        nombre: team.name,
        categoria: sortInfo.label,
        temporada: seasonById.get(team.season_id) ?? CLUB.season,
        jugadores: total,
        estado: !team.is_active ? 'Pendiente' : total >= 15 ? 'Completo' : 'Abierto',
        categoryOrder: sortInfo.order,
        suffixOrder: getTeamSuffixOrder(team.name),
      } as PrivateTeamSortRow
    })
    .sort((a, b) => {
      if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder
      if (a.suffixOrder !== b.suffixOrder) return a.suffixOrder - b.suffixOrder
      return a.nombre.localeCompare(b.nombre, 'es')
    })
    .map(({ categoryOrder, suffixOrder, ...team }) => team)
}

export async function getPrivateTeamDetail(teamId: string): Promise<PrivateTeamDetail | null> {
  noStore()

  const supabase = createAdminClient()
  const [{ data: team }, { data: categories }, { data: seasons }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, category_id, season_id, is_active, notes')
      .eq('id', teamId)
      .maybeSingle(),
    supabase.from('categories').select('id, name'),
    supabase.from('seasons').select('id, name'),
  ])

  if (!team) return null

  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, requested_category_id, position, status')
    .eq('assigned_team_id', teamId)
    .order('position', { ascending: true, nullsFirst: false })
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const categoryName = categoryById.get(team.category_id) ?? 'Sin categoría'
  const sortInfo = getTeamCategorySortInfo(team.name, categoryName)
  const shirtNumbers = await getTeamShirtNumbers()
  const players: PrivateTeamPlayer[] = (athletes ?? []).map((athlete) => ({
    id: athlete.id,
    nombre: `${athlete.first_name} ${athlete.last_name}`.trim(),
    categoriaSolicitada:
      categoryById.get(athlete.requested_category_id) ?? 'Categoría pendiente',
    position: (athlete.position ?? null) as PlayerPosition | null,
    shirtNumber: shirtNumbers[athlete.id] ?? null,
    estadoMatricula: mapPrivateTeamPlayerStatus(athlete.status),
  }))

  return {
    id: team.id,
    nombre: team.name,
    categoria: sortInfo.label,
    temporada: seasonById.get(team.season_id) ?? CLUB.season,
    jugadores: players.length,
    estado: !team.is_active ? 'Pendiente' : players.length >= 15 ? 'Completo' : 'Abierto',
    isActive: team.is_active,
    notes: team.notes ?? null,
    players,
  }
}

export async function getPrivateAthleteById(
  userId: string,
  athleteId: string,
): Promise<PrivateAthleteDetail | null> {
  const athletes = await getPrivateAthletes(userId)
  return athletes.find((athlete) => athlete.id === athleteId) ?? null
}
