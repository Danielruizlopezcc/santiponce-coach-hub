import 'server-only'

import { CLUB, MATRICULA_IMPORTE } from '@/lib/club'
import type {
  PrivateAthleteDetail,
  PrivateDashboardData,
  PrivateSponsor,
  PrivateTutorProfile,
  PrivateViewer,
} from '@/lib/private-app-shared'
import { normalizeDocument, normalizeEmail, normalizeOptionalEmail, normalizeOptionalPhone, normalizePhone } from '@/lib/private-app-shared'
import { createClient } from '@/lib/supabase/server'

type PrivateCollections = {
  guardianId: string | null
  activeSeasonLabel: string
  categoriesById: Map<string, string>
  teamsById: Map<string, string>
  seasonsById: Map<string, string>
}

function getInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || 'U'
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
      supabase.from('guardians').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('categories').select('id, name'),
      supabase.from('teams').select('id, name'),
      supabase.from('seasons').select('id, name'),
    ])

  return {
    guardianId: guardian?.id ?? null,
    activeSeasonLabel: activeSeason?.name ?? CLUB.season,
    categoriesById: new Map((categories ?? []).map((category) => [category.id, category.name])),
    teamsById: new Map((teams ?? []).map((team) => [team.id, team.name])),
    seasonsById: new Map((seasons ?? []).map((season) => [season.id, season.name])),
  }
}

export async function getPrivateDashboardData(
  userId: string,
): Promise<PrivateDashboardData> {
  const supabase = await createClient()

  const [viewer, collections] = await Promise.all([
    getPrivateViewer(userId),
    getPrivateCollections(userId),
  ])

  if (!collections.guardianId) {
    return {
      viewer,
      seasonLabel: collections.activeSeasonLabel,
      matriculaImporte: MATRICULA_IMPORTE,
      deportistas: [],
    }
  }

  const { data: athletes } = await supabase
    .from('athletes')
    .select(
      'id, first_name, last_name, status, requested_category_id, assigned_team_id',
    )
    .eq('guardian_id', collections.guardianId)
    .order('created_at', { ascending: true })

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
      estado: athlete.status,
    })),
  }
}

export async function getPrivateTutorProfile(userId: string): Promise<PrivateTutorProfile | null> {
  const supabase = await createClient()
  const [{ data: profile }, { data: guardian }] = await Promise.all([
    supabase.from('profiles').select('email, first_name, last_name').eq('id', userId).maybeSingle(),
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
      estado: 'Pendiente de integrar con Stripe',
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
    estado: athlete.status,
    pagoEstado: athlete.status === 'matriculado' ? 'pagado' : 'pendiente',
  }))
}

export async function getPrivateSponsors(): Promise<PrivateSponsor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sponsors')
    .select('id, title, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (data ?? []).map((sponsor) => ({
    id: sponsor.id,
    title: sponsor.title,
    imageUrl: sponsor.image_url,
  }))
}

export async function getPrivateAthleteById(
  userId: string,
  athleteId: string,
): Promise<PrivateAthleteDetail | null> {
  const athletes = await getPrivateAthletes(userId)
  return athletes.find((athlete) => athlete.id === athleteId) ?? null
}
