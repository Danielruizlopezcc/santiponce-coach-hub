import { NextResponse } from 'next/server'
import { registroSchema } from '@/lib/registro-schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient, getSiteUrl } from '@/lib/stripe'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function sanitizeRegistrationData(values: Record<string, unknown>) {
  const { password: _password, confirmPassword: _confirmPassword, ...safeValues } = values
  return safeValues
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  let createdUserId: string | null = null

  try {
    const body = await request.json()
    const rawValues = body.registroFormData ?? body
    const parsed = registroSchema.safeParse(rawValues)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Revisa los datos del registro.' },
        { status: 400 },
      )
    }

    if (parsed.data.accountType !== 'tutor') {
      return NextResponse.json(
        { message: 'La configuración de tarjeta inicial solo se usa para tutores.' },
        { status: 400 },
      )
    }

    const values = parsed.data
    const email = normalizeEmail(values.email)

    const { data: existingPending, error: pendingLookupError } = await supabase
      .from('pending_registrations')
      .select('id, user_id, stripe_customer_id, status')
      .eq('email', email)
      .maybeSingle()

    if (pendingLookupError) throw new Error(pendingLookupError.message)

    if (existingPending?.status === 'completed') {
      return NextResponse.json(
        { message: 'Ya existe un registro completado con ese correo.' },
        { status: 409 },
      )
    }

    let userId = existingPending?.user_id ?? null

    if (userId) {
      const { error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
        email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          first_name: values.nombre,
          last_name: values.apellidos,
        },
      })

      if (updateUserError) throw new Error(updateUserError.message)
    } else {
      const { data: existingProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (profileLookupError) throw new Error(profileLookupError.message)
      if (existingProfile) {
        return NextResponse.json(
          { message: 'Ya existe una cuenta con ese correo electrónico.' },
          { status: 409 },
        )
      }

      const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          first_name: values.nombre,
          last_name: values.apellidos,
        },
      })

      if (authError || !authResult.user) {
        throw new Error(authError?.message ?? 'No se ha podido crear el usuario.')
      }

      userId = authResult.user.id
      createdUserId = authResult.user.id
    }

    const stripe = getStripeClient()
    const siteUrl = getSiteUrl()
    const customerId = existingPending?.stripe_customer_id ?? (
      await stripe.customers.create({
        email,
        name: `${values.nombre} ${values.apellidos}`,
        metadata: {
          userId,
          isNewUser: 'true',
          registroStep: 'payment-setup',
        },
      })
    ).id

    const { data: pending, error: upsertError } = await supabase
      .from('pending_registrations')
      .upsert(
        {
          id: existingPending?.id,
          user_id: userId,
          email,
          form_data: sanitizeRegistrationData(values),
          stripe_customer_id: customerId,
          status: 'pending',
          error_message: null,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (upsertError || !pending) {
      throw new Error(upsertError?.message ?? 'No se ha podido guardar el registro pendiente.')
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      success_url: `${siteUrl}/registro/completar?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/registro?cancelled=true`,
      metadata: {
        flowType: 'registration_payment_method_setup',
        pendingRegistrationId: pending.id,
        userId,
        email,
      },
    })

    const { error: sessionUpdateError } = await supabase
      .from('pending_registrations')
      .update({ stripe_setup_session_id: session.id })
      .eq('id', pending.id)

    if (sessionUpdateError) throw new Error(sessionUpdateError.message)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId)
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
