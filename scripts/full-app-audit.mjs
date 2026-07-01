import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

loadEnvFile(path.join(process.cwd(), '.env.local'))

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const baseUrl = getBaseUrl()
const prefix = `codex_audit_${Date.now()}`
const warnings = []
const cleanup = {
  authUserIds: [],
  guardianIds: [],
  athleteIds: [],
  consentIds: [],
  consentDocumentIds: [],
  paymentIds: [],
  matchStatIds: [],
  matchIds: [],
  coachAssignmentIds: [],
  teamIds: [],
  categoryIds: [],
  seasonIds: [],
  financeMovementIds: [],
  feeTemplateIds: [],
  tutorFeeAssignmentIds: [],
  tutorFeeChargeIds: [],
  newsIds: [],
  newsSectionIds: [],
  sponsorIds: [],
}

let passed = 0
let failed = 0

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (!process.env[key]) process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

function getBaseUrl() {
  if (process.env.TEST_BASE_URL) return process.env.TEST_BASE_URL.replace(/\/$/, '')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl && !siteUrl.includes('localhost')) return siteUrl.replace(/\/$/, '')
  return 'https://santiponce-coach-hub.vercel.app'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function warn(message) {
  warnings.push(message)
  console.warn(`[WARN] ${message}`)
}

function noError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`)
}

async function check(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`[PASS] ${name}`)
  } catch (error) {
    failed += 1
    console.error(`[FAIL] ${name}`)
    console.error(`       ${error instanceof Error ? error.message : String(error)}`)
  }
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function bearerClient(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  )
}

async function createAuthSession(email, password) {
  const cookies = []
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookies
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            const index = cookies.findIndex((item) => item.name === cookie.name)
            const value = { name: cookie.name, value: cookie.value, options: cookie.options }
            if (index >= 0) cookies[index] = value
            else cookies.push(value)
          }
        },
      },
    },
  )

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  noError(error, `sign in ${email}`)
  assert(data.session?.access_token, `missing session for ${email}`)

  return {
    accessToken: data.session.access_token,
    cookieHeader: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '),
  }
}

async function fetchRoute(route, session) {
  return fetch(`${baseUrl}${route}`, {
    redirect: 'manual',
    headers: session?.cookieHeader ? { cookie: session.cookieHeader } : {},
  })
}

async function expectAllowed(route, session) {
  const response = await fetchRoute(route, session)
  assert(
    response.status >= 200 && response.status < 300,
    `${route} returned ${response.status} -> ${response.headers.get('location') ?? '<no location>'}`,
  )
  const html = await response.text()
  assert(!html.includes('Application error'), `${route} contains Application error`)
  assert(!html.includes('digest'), `${route} contains a Next error digest`)
}

async function expectAllowedOrRedirect(route, session, expectedLocationPart) {
  const response = await fetchRoute(route, session)
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location') ?? ''
    assert(
      location.includes(expectedLocationPart),
      `${route} redirected to ${location || '<empty>'}, expected ${expectedLocationPart}`,
    )
    return
  }

  assert(response.status >= 200 && response.status < 300, `${route} returned ${response.status}`)
  const html = await response.text()
  assert(!html.includes('Application error'), `${route} contains Application error`)
  assert(!html.includes('digest'), `${route} contains a Next error digest`)
}

async function expectRedirect(route, session, expectedLocationPart) {
  const response = await fetchRoute(route, session)
  assert(response.status >= 300 && response.status < 400, `${route} should redirect, got ${response.status}`)
  const location = response.headers.get('location') ?? ''
  assert(
    location.includes(expectedLocationPart),
    `${route} redirected to ${location || '<empty>'}, expected ${expectedLocationPart}`,
  )
}

async function createUser(admin, roleLabel, roles = []) {
  const email = `${prefix}_${roleLabel}@example.invalid`
  const password = `Codex-${roleLabel}-${Date.now()}!`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: 'Codex',
      last_name: roleLabel,
    },
  })
  noError(error, `create ${roleLabel} user`)
  const userId = data.user?.id
  assert(userId, `missing ${roleLabel} user id`)
  cleanup.authUserIds.push(userId)

  for (const role of roles) {
    const { error: roleError } = await admin
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' })
    noError(roleError, `assign ${roleLabel} role ${role}`)
  }

  return { id: userId, email, password }
}

async function getReferenceData(admin) {
  const [season, category] = await Promise.all([
    admin.from('seasons').select('id,name').eq('is_active', true).single(),
    admin.from('categories').select('id,name').eq('is_active', true).order('sort_order').limit(1).single(),
  ])
  noError(season.error, 'active season lookup')
  noError(category.error, 'active category lookup')
  return { activeSeason: season.data, activeCategory: category.data }
}

async function cleanupAll(admin) {
  const deleteIn = async (table, column, values) => {
    if (!values.length) return
    const { error } = await admin.from(table).delete().in(column, values)
    if (error) warn(`cleanup ${table}: ${error.message}`)
  }

  await deleteIn('match_player_stats', 'id', cleanup.matchStatIds)
  await deleteIn('matches', 'id', cleanup.matchIds)
  await deleteIn('coach_team_assignments', 'id', cleanup.coachAssignmentIds)
  await deleteIn('tutor_fee_charges', 'id', cleanup.tutorFeeChargeIds)
  await deleteIn('tutor_fee_assignments', 'id', cleanup.tutorFeeAssignmentIds)
  await deleteIn('payments', 'id', cleanup.paymentIds)
  await deleteIn('consents', 'id', cleanup.consentIds)
  await deleteIn('athletes', 'id', cleanup.athleteIds)
  await deleteIn('guardians', 'id', cleanup.guardianIds)
  await deleteIn('admin_finance_movements', 'id', cleanup.financeMovementIds)
  await deleteIn('admin_fee_templates', 'id', cleanup.feeTemplateIds)
  await deleteIn('news', 'id', cleanup.newsIds)
  await deleteIn('news_sections', 'id', cleanup.newsSectionIds)
  await deleteIn('sponsors', 'id', cleanup.sponsorIds)
  await deleteIn('teams', 'id', cleanup.teamIds)
  await deleteIn('categories', 'id', cleanup.categoryIds)
  await deleteIn('seasons', 'id', cleanup.seasonIds)
  await deleteIn('consent_documents', 'id', cleanup.consentDocumentIds)

  for (const userId of cleanup.authUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) warn(`cleanup auth user ${userId}: ${error.message}`)
  }
}

async function insertOne(admin, table, payload, select = 'id') {
  const { data, error } = await admin.from(table).insert(payload).select(select).single()
  noError(error, `insert ${table}`)
  assert(data?.id, `insert ${table} returned no id`)
  return data
}

async function updateOne(admin, table, id, payload, select = 'id') {
  const { data, error } = await admin.from(table).update(payload).eq('id', id).select(select).single()
  noError(error, `update ${table}`)
  return data
}

async function deleteOne(admin, table, id) {
  const { error } = await admin.from(table).delete().eq('id', id)
  noError(error, `delete ${table}`)
}

async function main() {
  for (const envName of requiredEnv) {
    assert(process.env[envName], `${envName} is missing`)
  }

  const admin = adminClient()
  const { activeSeason, activeCategory } = await getReferenceData(admin)

  const familyUser = await createUser(admin, 'family', ['member'])
  const memberUser = await createUser(admin, 'member', ['member'])
  const adminUser = await createUser(admin, 'admin', ['admin'])
  const coachUser = await createUser(admin, 'coach', ['coach'])

  const familySession = await createAuthSession(familyUser.email, familyUser.password)
  const memberSession = await createAuthSession(memberUser.email, memberUser.password)
  const adminSession = await createAuthSession(adminUser.email, adminUser.password)
  const coachSession = await createAuthSession(coachUser.email, coachUser.password)

  const familyClient = bearerClient(familySession.accessToken)
  const coachClient = bearerClient(coachSession.accessToken)

  let testCategoryId
  let testSeasonId
  let testTeamId
  let testGuardianId
  let testAthleteId
  let testMatchId

  await check('Login and role rows exist for user/admin/member/coach', async () => {
    const { data, error } = await admin
      .from('user_roles')
      .select('user_id,role')
      .in('user_id', [familyUser.id, memberUser.id, adminUser.id, coachUser.id])
    noError(error, 'role lookup')
    const roleKey = new Set((data ?? []).map((role) => `${role.user_id}:${role.role}`))
    assert(roleKey.has(`${familyUser.id}:user`), 'family user role missing')
    assert(roleKey.has(`${familyUser.id}:member`), 'family member role missing')
    assert(roleKey.has(`${memberUser.id}:user`), 'member user role missing')
    assert(roleKey.has(`${memberUser.id}:member`), 'member role missing')
    assert(roleKey.has(`${adminUser.id}:admin`), 'admin role missing')
    assert(roleKey.has(`${coachUser.id}:coach`), 'coach role missing')
  })

  await check('Unauthenticated protected pages redirect to login', async () => {
    await expectRedirect('/app', null, '/iniciar-sesion')
    await expectRedirect('/admin', null, '/iniciar-sesion')
    await expectRedirect('/entrenador', null, '/iniciar-sesion')
  })

  await check('Wrong roles cannot enter admin or coach portals', async () => {
    await expectRedirect('/admin', familySession, '/app')
    await expectRedirect('/entrenador', familySession, '/app')
    await expectRedirect('/admin', coachSession, '/app')
  })

  await check('Admin pages render with admin session', async () => {
    for (const route of [
      '/admin',
      '/admin/tutores',
      '/admin/deportistas',
      '/admin/equipos',
      '/admin/calendario',
      '/admin/matriculas',
      '/admin/noticias',
      '/admin/patrocinadores',
      '/admin/pagos',
      '/admin/temporadas',
      '/admin/entrenadores',
      '/admin/estadisticas',
      '/admin/consentimientos',
      '/admin/configuracion',
      '/admin/administradores',
    ]) {
      await expectAllowed(route, adminSession)
    }
  })

  await check('Public and auth pages render without session', async () => {
    for (const route of [
      '/',
      '/club',
      '/calendario',
      '/noticias',
      '/patrocinadores',
      '/registro',
      '/iniciar-sesion',
      '/recuperar-contrasena',
      '/legal/privacidad',
      '/legal/aviso-legal',
      '/legal/cookies',
      '/legal/pagos-devoluciones',
      '/legal/condiciones-matricula',
    ]) {
      await expectAllowed(route, null)
    }

    await expectAllowedOrRedirect('/equipos', null, '/equipos/')
  })

  await check('Admin CRUD: category, season, team, coach assignment and match', async () => {
    const category = await insertOne(admin, 'categories', {
      name: `${prefix} Category`,
      sort_order: 9999,
      is_active: true,
    })
    testCategoryId = category.id
    cleanup.categoryIds.push(category.id)

    const updatedCategory = await updateOne(admin, 'categories', category.id, {
      name: `${prefix} Category Updated`,
      sort_order: 9998,
    }, 'id,name,sort_order')
    assert(updatedCategory.name.endsWith('Updated'), 'category update did not persist')

    const season = await insertOne(admin, 'seasons', {
      name: `${prefix} Season`,
      starts_at: '2030-08-01',
      ends_at: '2031-06-30',
      is_active: false,
    })
    testSeasonId = season.id
    cleanup.seasonIds.push(season.id)

    const team = await insertOne(admin, 'teams', {
      name: `${prefix} Team`,
      category_id: category.id,
      season_id: season.id,
      is_active: true,
      notes: 'Created by full app audit',
    })
    testTeamId = team.id
    cleanup.teamIds.push(team.id)

    const coachAssignment = await insertOne(admin, 'coach_team_assignments', {
      coach_user_id: coachUser.id,
      team_id: team.id,
    })
    cleanup.coachAssignmentIds.push(coachAssignment.id)

    const match = await insertOne(admin, 'matches', {
      team_id: team.id,
      season_id: season.id,
      opponent_name: `${prefix} Rival`,
      match_date: '2031-01-15',
      match_time: '18:30',
      is_home: true,
      status: 'scheduled',
      match_type: 'league',
      round_label: 'Jornada audit',
    })
    testMatchId = match.id
    cleanup.matchIds.push(match.id)

    const updatedMatch = await updateOne(admin, 'matches', match.id, {
      status: 'played',
      home_score: 2,
      away_score: 1,
      home_shots: 5,
      away_shots: 3,
    }, 'id,status,home_score,away_score')
    assert(updatedMatch.status === 'played' && updatedMatch.home_score === 2, 'match update did not persist')
  })

  await check('Family/user flow: guardian, payment method, member and athlete CRUD', async () => {
    await admin.from('profiles').update({
      is_paid_member: true,
      membership_paid_at: new Date().toISOString(),
      stripe_customer_id: `cus_${prefix}`,
      stripe_payment_method_id: `pm_${prefix}`,
      payment_method_brand: 'visa',
      payment_method_last4: '4242',
      payment_method_exp_month: 12,
      payment_method_exp_year: 2030,
      payment_method_saved_at: new Date().toISOString(),
    }).eq('id', familyUser.id)

    const guardian = await familyClient
      .from('guardians')
      .insert({
        user_id: familyUser.id,
        first_name: 'Audit',
        last_name: 'Family',
        phone: `+34 600 ${String(Date.now()).slice(-6)}`,
        document_id: `TUT${String(Date.now()).slice(-7)}`,
        address_line: 'Audit street',
        postal_code: '41970',
        province: 'Sevilla',
        city: 'Santiponce',
        payment_preference: 'cuotas',
      })
      .select('id,is_approved')
      .single()
    noError(guardian.error, 'family guardian insert')
    testGuardianId = guardian.data.id
    cleanup.guardianIds.push(guardian.data.id)

    const blockedAthlete = await familyClient.from('athletes').insert({
      guardian_id: guardian.data.id,
      first_name: 'Blocked',
      last_name: 'Audit',
      birth_date: '2016-02-01',
      identification_type: 'DNI',
      identification_value: `BLK${String(Date.now()).slice(-7)}`,
      requested_category_id: activeCategory.id,
      season_id: activeSeason.id,
    })
    assert(blockedAthlete.error, 'unapproved guardian should not create athletes')

    await admin
      .from('guardians')
      .update({ is_approved: true, approval_status: 'approved' })
      .eq('id', guardian.data.id)

    const athlete = await familyClient
      .from('athletes')
      .insert({
        guardian_id: guardian.data.id,
        first_name: 'Audit',
        last_name: 'Athlete',
        birth_date: '2016-02-01',
        identification_type: 'DNI',
        identification_value: `ATH${String(Date.now()).slice(-7)}`,
        requested_category_id: testCategoryId,
        season_id: testSeasonId,
        assigned_team_id: null,
      })
      .select('id,status')
      .single()
    noError(athlete.error, 'family athlete insert')
    testAthleteId = athlete.data.id
    cleanup.athleteIds.push(athlete.data.id)
    assert(athlete.data.status === 'pendiente', 'new athlete should be pending')

    const updatedAthlete = await familyClient
      .from('athletes')
      .update({ health_notes: 'Updated by audit' })
      .eq('id', athlete.data.id)
      .eq('guardian_id', guardian.data.id)
      .select('id,health_notes')
      .single()
    noError(updatedAthlete.error, 'family athlete update')
    assert(updatedAthlete.data.health_notes === 'Updated by audit', 'family athlete update did not persist')
  })

  await check('Private/member pages render with member session', async () => {
    await admin.from('profiles').update({
      is_paid_member: true,
      membership_paid_at: new Date().toISOString(),
    }).eq('id', memberUser.id)

    for (const { route, redirectTo } of [
      { route: '/app/perfil' },
      { route: '/app/mis-deportistas', redirectTo: '/app/deportistas' },
      { route: '/app/deportistas' },
      { route: '/app/deportistas/nuevo' },
      { route: '/app/equipos', redirectTo: '/app/equipos/' },
      { route: `/app/equipos/${testTeamId}` },
      { route: '/app/noticias' },
      { route: '/app/patrocinadores' },
      { route: '/app/portal-socio' },
      { route: '/app/pago-socio' },
      { route: '/app/matriculacion' },
    ]) {
      if (redirectTo) await expectAllowedOrRedirect(route, memberSession, redirectTo)
      else await expectAllowed(route, memberSession)
    }

    await expectAllowedOrRedirect('/app', memberSession, '/app/')
  })

  await check('Guardian without real Stripe card is limited to setup/profile routes', async () => {
    await expectRedirect('/app/deportistas', familySession, '/app/configurar-pago')
    await expectRedirect('/app/matriculacion', familySession, '/app/configurar-pago')
    await expectAllowed('/app/configurar-pago', familySession)
    await expectAllowed('/app/perfil', familySession)
  })

  await check('Admin CRUD: athlete assignment, match stats and aggregate views', async () => {
    const assigned = await admin
      .from('athletes')
      .update({ assigned_team_id: testTeamId, status: 'matriculado', position: 'forward' })
      .eq('id', testAthleteId)
      .select('id,assigned_team_id,status')
      .single()
    noError(assigned.error, 'assign athlete to team')
    assert(assigned.data.assigned_team_id === testTeamId, 'athlete team assignment did not persist')

    const stat = await insertOne(admin, 'match_player_stats', {
      match_id: testMatchId,
      team_id: testTeamId,
      season_id: testSeasonId,
      athlete_id: testAthleteId,
      is_called_up: true,
      is_starter: true,
      position: 'forward',
      shirt_number: 9,
      minutes: 75,
      goals: 1,
      assists: 1,
      yellow_cards: 1,
      shots: 3,
      saves: 0,
    })
    cleanup.matchStatIds.push(stat.id)

    const lineup = await admin
      .from('match_lineup_summary')
      .select('match_id,called_up,starters,goals,assists')
      .eq('match_id', testMatchId)
      .single()
    noError(lineup.error, 'match_lineup_summary lookup')
    assert(lineup.data.called_up === 1 && lineup.data.goals === 1, 'match_lineup_summary is incorrect')

    const seasonStats = await admin
      .from('player_season_stats')
      .select('athlete_id,callups,starts,minutes,goals,assists')
      .eq('athlete_id', testAthleteId)
      .single()
    noError(seasonStats.error, 'player_season_stats lookup')
    assert(seasonStats.data.minutes === 75 && seasonStats.data.goals === 1, 'player_season_stats is incorrect')
  })

  await check('Coach can read and write only assigned team match stats through RLS', async () => {
    const updateOwn = await coachClient
      .from('match_player_stats')
      .update({ notes: 'Coach audit note' })
      .eq('team_id', testTeamId)
      .eq('athlete_id', testAthleteId)
      .select('id,notes')
      .single()
    noError(updateOwn.error, 'coach update assigned team stats')
    assert(updateOwn.data.notes === 'Coach audit note', 'coach stat update did not persist')

    await expectAllowedOrRedirect('/entrenador', coachSession, '/entrenador/calendario')
    await expectAllowed('/entrenador/calendario', coachSession)
    await expectAllowed('/entrenador/estadisticas', coachSession)
  })

  await check('Admin CRUD: consents, payments, finance and tutor fees', async () => {
    const document = await insertOne(admin, 'consent_documents', {
      code: `${prefix}_consent`,
      title: 'Audit Consent',
      version: '1',
      is_required: true,
    })
    cleanup.consentDocumentIds.push(document.id)

    const consent = await insertOne(admin, 'consents', {
      guardian_id: testGuardianId,
      athlete_id: testAthleteId,
      document_id: document.id,
      accepted: true,
      signer_full_name: 'Audit Family',
      signer_document_id: `${prefix}_doc`,
    })
    cleanup.consentIds.push(consent.id)

    const payment = await insertOne(admin, 'payments', {
      user_id: familyUser.id,
      guardian_id: testGuardianId,
      athlete_id: testAthleteId,
      season_id: testSeasonId,
      payment_type: 'enrollment',
      provider: 'manual',
      status: 'pending',
      amount_cents: 100,
      description: 'Audit enrollment',
    })
    cleanup.paymentIds.push(payment.id)
    const updatedPayment = await updateOne(admin, 'payments', payment.id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    }, 'id,status')
    assert(updatedPayment.status === 'paid', 'payment update did not persist')

    const movement = await insertOne(admin, 'admin_finance_movements', {
      movement_type: 'income',
      concept: 'Audit income',
      amount_cents: 100,
      payment_method: 'cash',
      status: 'confirmed',
      season_id: testSeasonId,
    })
    cleanup.financeMovementIds.push(movement.id)

    const template = await insertOne(admin, 'admin_fee_templates', {
      name: 'Audit Fee',
      fee_type: 'audit',
      total_amount_cents: 1200,
      split_payment: true,
      charge_frequency: 'monthly',
      charge_count: 3,
    })
    cleanup.feeTemplateIds.push(template.id)

    const assignment = await insertOne(admin, 'tutor_fee_assignments', {
      guardian_id: testGuardianId,
      fee_template_id: template.id,
      charge_day: 5,
      start_month: '2031-01-01',
      status: 'active',
    })
    cleanup.tutorFeeAssignmentIds.push(assignment.id)

    const charge = await insertOne(admin, 'tutor_fee_charges', {
      assignment_id: assignment.id,
      guardian_id: testGuardianId,
      fee_template_id: template.id,
      charge_number: 1,
      due_date: '2031-01-05',
      amount_cents: 400,
      status: 'scheduled',
    })
    cleanup.tutorFeeChargeIds.push(charge.id)
  })

  await check('Admin CRUD: news and sponsors', async () => {
    const section = await insertOne(admin, 'news_sections', {
      name: `${prefix} Section`,
      sort_order: 9999,
      is_active: true,
    })
    cleanup.newsSectionIds.push(section.id)

    const news = await insertOne(admin, 'news', {
      title: `${prefix} News`,
      body: '<p>Audit body</p>',
      image_url: 'https://example.com/audit.jpg',
      section_id: section.id,
    })
    cleanup.newsIds.push(news.id)

    const sponsor = await insertOne(admin, 'sponsors', {
      title: `${prefix} Sponsor`,
      image_url: 'https://example.com/sponsor.jpg',
      is_active: true,
      sort_order: 9999,
    })
    cleanup.sponsorIds.push(sponsor.id)

    const updatedSponsor = await updateOne(admin, 'sponsors', sponsor.id, {
      title: `${prefix} Sponsor Updated`,
    }, 'id,title')
    assert(updatedSponsor.title.endsWith('Updated'), 'sponsor update did not persist')
  })

  await check('Regular user cannot write admin-only tables through RLS', async () => {
    const blockedTables = [
      ['categories', { name: `${prefix} blocked`, sort_order: 1 }],
      ['teams', { name: `${prefix} blocked`, category_id: activeCategory.id, season_id: activeSeason.id }],
      ['matches', {
        team_id: testTeamId,
        season_id: testSeasonId,
        opponent_name: 'Blocked',
        match_date: '2031-01-01',
        match_type: 'league',
        round_label: 'Blocked',
      }],
      ['admin_finance_movements', {
        movement_type: 'income',
        concept: 'Blocked',
        amount_cents: 100,
        payment_method: 'cash',
      }],
    ]

    for (const [table, payload] of blockedTables) {
      const { error } = await familyClient.from(table).insert(payload)
      assert(error, `regular user inserted into ${table}`)
    }
  })

  await check('Delete flow works for created CRUD rows', async () => {
    await deleteOne(admin, 'sponsors', cleanup.sponsorIds.pop())
    await deleteOne(admin, 'news', cleanup.newsIds.pop())
    await deleteOne(admin, 'news_sections', cleanup.newsSectionIds.pop())
    await deleteOne(admin, 'tutor_fee_charges', cleanup.tutorFeeChargeIds.pop())
    await deleteOne(admin, 'tutor_fee_assignments', cleanup.tutorFeeAssignmentIds.pop())
    await deleteOne(admin, 'admin_fee_templates', cleanup.feeTemplateIds.pop())
    await deleteOne(admin, 'admin_finance_movements', cleanup.financeMovementIds.pop())
    await deleteOne(admin, 'payments', cleanup.paymentIds.pop())
    await deleteOne(admin, 'consents', cleanup.consentIds.pop())
    await deleteOne(admin, 'consent_documents', cleanup.consentDocumentIds.pop())
    await deleteOne(admin, 'match_player_stats', cleanup.matchStatIds.pop())
    await deleteOne(admin, 'matches', cleanup.matchIds.pop())
    await deleteOne(admin, 'coach_team_assignments', cleanup.coachAssignmentIds.pop())
    await admin.from('athletes').update({ assigned_team_id: null }).eq('id', testAthleteId)
    await deleteOne(admin, 'teams', cleanup.teamIds.pop())
    await deleteOne(admin, 'athletes', cleanup.athleteIds.pop())
    await deleteOne(admin, 'guardians', cleanup.guardianIds.pop())
    await deleteOne(admin, 'seasons', cleanup.seasonIds.pop())
    await deleteOne(admin, 'categories', cleanup.categoryIds.pop())
  })

  await cleanupAll(admin)
}

try {
  console.log(`Full app audit target: ${baseUrl}`)
  await main()
} catch (error) {
  failed += 1
  console.error('[FAIL] Full app audit crashed')
  console.error(`       ${error instanceof Error ? error.message : String(error)}`)
  try {
    await cleanupAll(adminClient())
  } catch (cleanupError) {
    warn(`final cleanup crashed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`)
  }
}

console.log('')
console.log(`Full app audit finished: ${passed} passed, ${warnings.length} warnings, ${failed} failed`)
if (warnings.length > 0) {
  for (const warning of warnings) console.log(`- warning: ${warning}`)
}
if (failed > 0) process.exit(1)
process.exit(0)
