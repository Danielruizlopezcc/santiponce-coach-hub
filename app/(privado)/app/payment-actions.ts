'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { MATRICULA_IMPORTE, MEMBERSHIP_IMPORTE } from '@/lib/club'
import { createClient } from '@/lib/supabase/server'
import {
  getEnrollmentAmountCents,
  getMembershipAmountCents,
  getSiteUrl,
  getStripeClient,
} from '@/lib/stripe'

type CheckoutResult = {
  success: boolean
  message?: string
  url?: string
}

async function findOrCreatePendingPayment({
  userId,
  guardianId,
  athleteId,
  seasonId,
  paymentType,
  description,
  amountCents,
}: {
  userId: string
  guardianId: string | null
  athleteId: string | null
  seasonId: string | null
  paymentType: 'membership' | 'enrollment'
  description: string
  amountCents: number
}) {
  const supabase = await createClient()

  let pendingQuery = supabase
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .eq('payment_type', paymentType)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)

  pendingQuery =
    athleteId === null
      ? pendingQuery.is('athlete_id', null)
      : pendingQuery.eq('athlete_id', athleteId)

  const { data: pendingPayment } = await pendingQuery.maybeSingle()

  if (pendingPayment) {
    const { error } = await supabase
      .from('payments')
      .update({
        guardian_id: guardianId,
        season_id: seasonId,
        amount_cents: amountCents,
        description,
        provider: 'stripe',
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        stripe_customer_email: null,
        metadata: {},
        paid_at: null,
      })
      .eq('id', pendingPayment.id)

    if (error) throw new Error(error.message)
    return pendingPayment.id
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      guardian_id: guardianId,
      athlete_id: athleteId,
      season_id: seasonId,
      payment_type: paymentType,
      provider: 'stripe',
      status: 'pending',
      amount_cents: amountCents,
      currency: 'eur',
      description,
      metadata: {},
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se ha podido preparar el pago.')
  }

  return data.id
}

async function attachStripeSession(paymentId: string, sessionId: string, metadata: Record<string, string>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payments')
    .update({
      stripe_checkout_session_id: sessionId,
      metadata,
    })
    .eq('id', paymentId)

  if (error) throw new Error(error.message)
}

export async function createMembershipCheckoutAction(): Promise<CheckoutResult> {
  try {
    const user = await requireUser()
    const supabase = await createClient()
    const [{ data: profile }, { data: guardian }] = await Promise.all([
      supabase
        .from('profiles')
        .select('email, first_name, last_name, is_paid_member')
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('guardians').select('id').eq('user_id', user.id).maybeSingle(),
    ])

    if (!profile) {
      return { success: false, message: 'No se ha encontrado el perfil del usuario.' }
    }

    if (profile.is_paid_member) {
      return { success: false, message: 'La cuota de socio ya está pagada.' }
    }

    const paymentId = await findOrCreatePendingPayment({
      userId: user.id,
      guardianId: guardian?.id ?? null,
      athleteId: null,
      seasonId: null,
      paymentType: 'membership',
      description: `Cuota de socio ${MEMBERSHIP_IMPORTE}€`,
      amountCents: getMembershipAmountCents(),
    })

    const stripe = getStripeClient()
    const siteUrl = getSiteUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile.email,
      success_url: `${siteUrl}/app/pago-socio/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app/pago-socio/cancelada`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Cuota de socio',
              description: 'Acceso como socio del Club Deportivo Santiponce',
            },
            unit_amount: getMembershipAmountCents(),
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId,
        flowType: 'membership',
        userId: user.id,
      },
    })

    await attachStripeSession(paymentId, session.id, {
      flowType: 'membership',
      userId: user.id,
      paymentId,
    })

    return { success: true, url: session.url ?? undefined }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se ha podido iniciar el pago.',
    }
  }
}

export async function createEnrollmentCheckoutAction(athleteId: string): Promise<CheckoutResult> {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data: guardian } = await supabase
      .from('guardians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!guardian) {
      return { success: false, message: 'No se ha encontrado el tutor asociado.' }
    }

    const { data: athlete } = await supabase
      .from('athletes')
      .select('id, first_name, last_name, status, season_id')
      .eq('id', athleteId)
      .eq('guardian_id', guardian.id)
      .maybeSingle()

    if (!athlete) {
      return { success: false, message: 'No se ha encontrado el deportista seleccionado.' }
    }

    if (athlete.status === 'matriculado') {
      return { success: false, message: 'Ese deportista ya está matriculado.' }
    }

    const [{ data: season }, { data: profile }] = await Promise.all([
      supabase.from('seasons').select('id, name').eq('id', athlete.season_id).maybeSingle(),
      supabase.from('profiles').select('email').eq('id', user.id).maybeSingle(),
    ])

    const athleteName = `${athlete.first_name} ${athlete.last_name}`.trim()
    const paymentId = await findOrCreatePendingPayment({
      userId: user.id,
      guardianId: guardian.id,
      athleteId: athlete.id,
      seasonId: athlete.season_id,
      paymentType: 'enrollment',
      description: `Matrícula ${season?.name ?? athlete.season_id} - ${athleteName}`,
      amountCents: getEnrollmentAmountCents(),
    })

    const stripe = getStripeClient()
    const siteUrl = getSiteUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile?.email ?? undefined,
      success_url: `${siteUrl}/app/matriculacion/exito?athlete=${athlete.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app/matriculacion/cancelada?athlete=${athlete.id}`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Matrícula de deportista',
              description: athleteName,
            },
            unit_amount: getEnrollmentAmountCents(),
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId,
        flowType: 'enrollment',
        userId: user.id,
        guardianId: guardian.id,
        athleteId: athlete.id,
        seasonId: athlete.season_id,
      },
    })

    await attachStripeSession(paymentId, session.id, {
      flowType: 'enrollment',
      userId: user.id,
      guardianId: guardian.id,
      athleteId: athlete.id,
      seasonId: athlete.season_id,
      paymentId,
    })

    revalidatePath('/app')
    revalidatePath('/app/matriculacion')

    return { success: true, url: session.url ?? undefined }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se ha podido iniciar el pago.',
    }
  }
}
