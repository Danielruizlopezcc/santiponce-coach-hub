'use server'

import { registroSchema } from '@/lib/registro-schema'
import { getStripeClient } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type RegistroActionResult =
  | { success: true }
  | { success: false; message: string }

type RegistroActionOptions = {
  stripeSetupSessionId?: string
}

function findFirstDuplicate(values: string[]) {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      return value
    }

    seen.add(value)
  }

  return null
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeDocument(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

function normalizeOptionalEmail(value?: string) {
  return value?.trim() ? normalizeEmail(value) : null
}

function normalizeOptionalPhone(value?: string) {
  return value?.trim() ? normalizePhone(value) : null
}

async function saveStripePaymentMethodFromSetupSession({
  supabase,
  userId,
  sessionId,
  expectedEmail,
}: {
  supabase: ReturnType<typeof createAdminClient>
  userId: string
  sessionId: string
  expectedEmail: string
}) {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.mode !== 'setup' || session.status !== 'complete') {
    throw new Error('La configuración del método de pago no se ha completado.')
  }

  if (normalizeEmail(session.metadata?.email ?? '') !== expectedEmail) {
    throw new Error('La sesión de pago no coincide con el registro actual.')
  }

  const setupIntentId =
    typeof session.setup_intent === 'string'
      ? session.setup_intent
      : session.setup_intent?.id ?? null

  if (!setupIntentId) {
    throw new Error('No se ha encontrado la configuración de pago en Stripe.')
  }

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  const paymentMethodId =
    typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id ?? null

  if (!paymentMethodId) {
    throw new Error('No se ha encontrado el método de pago en Stripe.')
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  const card = paymentMethod.card

  if (!card) {
    throw new Error('El método de pago guardado no es una tarjeta válida.')
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethod.id,
      payment_method_brand: card.brand,
      payment_method_last4: card.last4,
      payment_method_exp_month: card.exp_month,
      payment_method_exp_year: card.exp_year,
      payment_method_saved_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function registerGuardianAccount(
  rawValues: unknown,
  options: RegistroActionOptions = {},
): Promise<RegistroActionResult> {
  const parsed = registroSchema.safeParse(rawValues)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      message: firstIssue?.message ?? 'Revisa los datos del formulario.',
    }
  }

  const values = parsed.data
  const supabase = createAdminClient()
  let createdUserId: string | null = null

  try {
    if (values.accountType === 'socio') {
      const email = normalizeEmail(values.email)

      const [{ data: consentDocuments, error: consentError }, { data: existingProfile, error: profilesError }] =
        await Promise.all([
          supabase
            .from('consent_documents')
            .select('id, code')
            .eq('code', 'privacy_policy'),
          supabase.from('profiles').select('id').eq('email', email).maybeSingle(),
        ])

      if (consentError || !consentDocuments?.length) {
        return {
          success: false,
          message: 'No se ha encontrado el documento de política de privacidad.',
        }
      }

      if (profilesError) {
        return {
          success: false,
          message: 'No se han podido validar los datos duplicados en Supabase.',
        }
      }

      if (existingProfile) {
        return {
          success: false,
          message: 'Ya existe una cuenta con ese correo electrónico.',
        }
      }

      const { data: authResult, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password: values.password,
          email_confirm: true,
          user_metadata: {
            first_name: values.nombre,
            last_name: values.apellidos,
          },
        })

      if (authError || !authResult.user) {
        return {
          success: false,
          message:
            authError?.message ??
            'No se ha podido crear el usuario en Supabase Auth.',
        }
      }

      createdUserId = authResult.user.id

      return { success: true }
    }

    const guardianEmail = normalizeEmail(values.email)
    const guardianPhone = normalizePhone(values.telefono)
    const guardianDocument = normalizeDocument(values.documento)
    const athleteRecords = values.deportistas.map((deportista) => ({
      document: normalizeDocument(deportista.documento),
      email: normalizeOptionalEmail(deportista.email),
      phone: normalizeOptionalPhone(deportista.telefono),
    }))
    const athletePhones = Array.from(
      new Set(
        athleteRecords.map((deportista) => deportista.phone).filter(Boolean),
      ),
    )
    const athleteEmails = Array.from(
      new Set(
        athleteRecords.map((deportista) => deportista.email).filter(Boolean),
      ),
    )
    const athleteDocuments = Array.from(
      new Set(athleteRecords.map((deportista) => deportista.document)),
    )
    const duplicateAthleteDocument = findFirstDuplicate(
      athleteRecords.map((deportista) => deportista.document),
    )

    if (duplicateAthleteDocument) {
      return {
        success: false,
        message: 'Hay dos deportistas con el mismo documento en este registro.',
      }
    }

    if (athleteDocuments.includes(guardianDocument)) {
      return {
        success: false,
        message: 'El DNI/NIE del tutor no puede coincidir con el de un deportista.',
      }
    }

    const guardianAndAthleteEmails = Array.from(
      new Set([guardianEmail, ...athleteEmails]),
    )
    const guardianAndAthletePhones = Array.from(
      new Set([guardianPhone, ...athletePhones]),
    )
    const guardianAndAthleteDocuments = Array.from(
      new Set([guardianDocument, ...athleteDocuments]),
    )
    const guardianConflictFilters = [
      ...guardianAndAthleteDocuments.map((document) => `document_id.eq.${document}`),
      ...guardianAndAthletePhones.map((phone) => `phone.eq.${phone}`),
    ]
    const athleteConflictFilters = [
      ...guardianAndAthleteDocuments.map(
        (document) => `identification_value.eq.${document}`,
      ),
      ...athletePhones.map((phone) => `mobile_phone.eq.${phone}`),
      ...athleteEmails.map((email) => `email.eq.${email}`),
    ]

    const requestedCategoryNames = Array.from(
      new Set(values.deportistas.map((deportista) => deportista.categoria)),
    )

    const [
      { data: season, error: seasonError },
      { data: categories, error: categoriesError },
      { data: consentDocuments, error: consentError },
      { data: existingGuardianEmail, error: guardianEmailConflictError },
      { data: existingGuardians, error: guardiansConflictError },
      { data: existingProfiles, error: profilesConflictError },
      { data: existingAthletes, error: athletesConflictError },
    ] =
      await Promise.all([
        supabase
          .from('seasons')
          .select('id, name')
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('categories')
          .select('id, name')
          .in('name', requestedCategoryNames.length ? requestedCategoryNames : ['__none__']),
        supabase
          .from('consent_documents')
          .select('id, code')
          .in('code', [
            'privacy_policy',
            'enrollment_terms',
            'minor_data',
            'health_data',
            'image_rights',
            'stripe_payment_method',
          ]),
        supabase
          .from('profiles')
          .select('id')
          .eq('email', guardianEmail)
          .maybeSingle(),
        supabase
          .from('guardians')
          .select('document_id, phone')
          .or(guardianConflictFilters.join(',')),
        supabase
          .from('profiles')
          .select('email')
          .in('email', guardianAndAthleteEmails),
        supabase
          .from('athletes')
          .select('identification_value, mobile_phone, email')
          .or(athleteConflictFilters.join(',')),
      ])

    if (seasonError || !season) {
      return {
        success: false,
        message: 'No se ha encontrado una temporada activa en Supabase.',
      }
    }

    if (categoriesError || (requestedCategoryNames.length > 0 && !categories?.length)) {
      return {
        success: false,
        message: 'No se han encontrado las categorías necesarias en Supabase.',
      }
    }

    if (consentError || !consentDocuments?.length) {
      return {
        success: false,
        message: 'No se han encontrado los documentos de consentimiento necesarios.',
      }
    }

    if (
      guardianEmailConflictError ||
      guardiansConflictError ||
      profilesConflictError ||
      athletesConflictError
    ) {
      return {
        success: false,
        message: 'No se han podido validar los datos duplicados en Supabase.',
      }
    }

    if (existingGuardianEmail) {
      return {
        success: false,
        message: 'Ya existe una cuenta con ese correo electrónico.',
      }
    }

    if (
      existingProfiles?.some((profile) => normalizeEmail(profile.email) === guardianEmail)
    ) {
      return {
        success: false,
        message: 'Ya existe una cuenta con ese correo electrónico.',
      }
    }

    if (
      existingGuardians?.some(
        (guardian) => normalizeDocument(guardian.document_id) === guardianDocument,
      )
    ) {
      return {
        success: false,
        message: 'Ya existe un usuario con ese DNI/NIE.',
      }
    }

    if (
      existingGuardians?.some(
        (guardian) => normalizePhone(guardian.phone) === guardianPhone,
      )
    ) {
      return {
        success: false,
        message: 'Ya existe un usuario con ese teléfono.',
      }
    }

    if (
      existingGuardians?.some((guardian) =>
        athleteDocuments.includes(normalizeDocument(guardian.document_id)),
      )
    ) {
      return {
        success: false,
        message: 'Uno de los documentos de deportista ya pertenece a otro tutor.',
      }
    }

    if (
      existingGuardians?.some((guardian) =>
        athletePhones.includes(normalizePhone(guardian.phone)),
      )
    ) {
      return {
        success: false,
        message: 'Uno de los teléfonos de deportista ya está registrado por otra familia.',
      }
    }

    if (
      athleteEmails.length &&
      existingProfiles?.some((profile) => athleteEmails.includes(normalizeEmail(profile.email)))
    ) {
      return {
        success: false,
        message: 'Uno de los correos de deportista ya pertenece a otro usuario.',
      }
    }

    if (
      existingAthletes?.some(
        (athlete) => normalizeDocument(athlete.identification_value) === guardianDocument,
      )
    ) {
      return {
        success: false,
        message: 'El DNI/NIE del tutor ya está usado en un deportista registrado.',
      }
    }

    if (
      existingAthletes?.some((athlete) =>
        athleteDocuments.includes(normalizeDocument(athlete.identification_value)),
      )
    ) {
      return {
        success: false,
        message: 'Uno de los documentos de deportista ya está registrado.',
      }
    }

    if (
      existingAthletes?.some(
        (athlete) =>
          athlete.mobile_phone &&
          athletePhones.includes(normalizePhone(athlete.mobile_phone)),
      )
    ) {
      return {
        success: false,
        message: 'Uno de los teléfonos de deportista ya está registrado por otra familia.',
      }
    }

    if (
      existingAthletes?.some(
        (athlete) =>
          athlete.email && athleteEmails.includes(normalizeEmail(athlete.email)),
      )
    ) {
      return {
        success: false,
        message: 'Uno de los correos de deportista ya está registrado por otra familia.',
      }
    }

    const categoryByName = new Map(categories.map((category) => [category.name, category.id]))
    const consentByCode = new Map(
      consentDocuments.map((document) => [document.code, document.id]),
    )

    const missingCategory = values.deportistas.find(
      (deportista) => !categoryByName.has(deportista.categoria),
    )

    if (missingCategory) {
      return {
        success: false,
        message: `La categoría ${missingCategory.categoria} no está disponible en Supabase.`,
      }
    }

    const requiredConsentCodes = [
      'privacy_policy',
      'enrollment_terms',
      'minor_data',
      'health_data',
      'stripe_payment_method',
    ] as const

    for (const code of requiredConsentCodes) {
      if (!consentByCode.has(code)) {
        return {
          success: false,
          message: `Falta el consentimiento ${code} en Supabase.`,
        }
      }
    }

    const { data: authResult, error: authError } =
      await supabase.auth.admin.createUser({
        email: guardianEmail,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          first_name: values.nombre,
          last_name: values.apellidos,
        },
      })

    if (authError || !authResult.user) {
      return {
        success: false,
        message:
          authError?.message ??
          'No se ha podido crear el usuario en Supabase Auth.',
      }
    }

    createdUserId = authResult.user.id

    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .insert({
        user_id: authResult.user.id,
        first_name: values.nombre,
        last_name: values.apellidos,
        phone: guardianPhone,
        document_id: guardianDocument,
        address_line: values.direccion,
        postal_code: values.codigoPostal,
        province: values.provincia,
        city: values.ciudad,
        country: values.pais,
        payment_preference: values.preferenciaPago,
      })
      .select('id')
      .single()

    if (guardianError || !guardian) {
      throw new Error(
        guardianError?.message ?? 'No se ha podido crear la ficha del tutor.',
      )
    }

    const athleteRows = values.deportistas.map((deportista) => ({
      guardian_id: guardian.id,
      first_name: deportista.nombre,
      last_name: deportista.apellidos,
      birth_date: deportista.fechaNacimiento,
      identification_type: deportista.tipoIdentificacion,
      identification_value: normalizeDocument(deportista.documento),
      email: normalizeOptionalEmail(deportista.email),
      mobile_phone: normalizeOptionalPhone(deportista.telefono),
      health_notes: deportista.alergias || null,
      has_siblings_in_club: deportista.tieneHermanos === 'si',
      sibling_name: deportista.nombreHermano || null,
      requested_category_id: categoryByName.get(deportista.categoria),
      assigned_team_id: null,
      status: 'pendiente',
      season_id: season.id,
    }))

    const athletes =
      athleteRows.length > 0
        ? (
            await supabase
              .from('athletes')
              .insert(athleteRows)
              .select('id')
          )
        : { data: [], error: null }

    if (athletes.error || athleteRows.length !== athletes.data?.length) {
      throw new Error(
        athletes.error?.message ?? 'No se han podido guardar los deportistas.',
      )
    }

    const consentRows = [
      {
        guardian_id: guardian.id,
        athlete_id: null,
        document_id: consentByCode.get('privacy_policy'),
        accepted: values.aceptaPrivacidad,
        signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
        signer_document_id: values.documento.trim().toUpperCase(),
      },
      {
        guardian_id: guardian.id,
        athlete_id: null,
        document_id: consentByCode.get('enrollment_terms'),
        accepted: values.aceptaCondiciones,
        signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
        signer_document_id: values.documento.trim().toUpperCase(),
      },
      {
        guardian_id: guardian.id,
        athlete_id: null,
        document_id: consentByCode.get('stripe_payment_method'),
        accepted: values.consienteMetodoPago,
        signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
        signer_document_id: values.documento.trim().toUpperCase(),
      },
      ...(athletes.data ?? []).flatMap((athlete) => [
        {
          guardian_id: guardian.id,
          athlete_id: athlete.id,
          document_id: consentByCode.get('minor_data'),
          accepted: values.consienteDatosMenor,
          signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
          signer_document_id: values.documento.trim().toUpperCase(),
        },
        {
          guardian_id: guardian.id,
          athlete_id: athlete.id,
          document_id: consentByCode.get('health_data'),
          accepted: values.consienteDatosSalud,
          signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
          signer_document_id: values.documento.trim().toUpperCase(),
        },
        {
          guardian_id: guardian.id,
          athlete_id: athlete.id,
          document_id: consentByCode.get('image_rights'),
          accepted: values.autorizaImagenes,
          signer_full_name: `${values.nombre} ${values.apellidos}`.trim(),
          signer_document_id: values.documento.trim().toUpperCase(),
        },
      ]),
    ]

    const { error: consentsError } = await supabase.from('consents').insert(consentRows)

    if (consentsError) {
      throw new Error(
        consentsError.message ?? 'No se han podido guardar los consentimientos.',
      )
    }

    if (options.stripeSetupSessionId) {
      await saveStripePaymentMethodFromSetupSession({
        supabase,
        userId: authResult.user.id,
        sessionId: options.stripeSetupSessionId,
        expectedEmail: guardianEmail,
      })
    }

    return { success: true }
  } catch (error) {
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId)
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'No se ha podido completar el registro real en Supabase.',
    }
  }
}
