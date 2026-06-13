import 'server-only'

import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type PaymentRecord = {
  id: string
  user_id: string
  guardian_id: string | null
  athlete_id: string | null
  payment_type: 'membership' | 'enrollment'
  status: 'pending' | 'paid' | 'canceled' | 'failed'
  stripe_checkout_session_id: string | null
  paid_at: string | null
}

async function getPaymentForCheckoutSession(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()
  const paymentId = session.metadata?.paymentId

  if (paymentId) {
    const { data, error } = await supabase
      .from('payments')
      .select('id, user_id, guardian_id, athlete_id, payment_type, status, stripe_checkout_session_id, paid_at')
      .eq('id', paymentId)
      .maybeSingle<PaymentRecord>()

    if (error) throw new Error(error.message)
    if (data) return { supabase, payment: data }
  }

  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, guardian_id, athlete_id, payment_type, status, stripe_checkout_session_id, paid_at')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle<PaymentRecord>()

  if (error) throw new Error(error.message)
  return { supabase, payment: data }
}

export async function confirmStripeCheckoutSessionPayment(session: Stripe.Checkout.Session) {
  if (session.mode !== 'payment' || session.payment_status !== 'paid') {
    return { confirmed: false, userId: null }
  }

  const { supabase, payment } = await getPaymentForCheckoutSession(session)
  if (!payment) {
    return { confirmed: false, userId: null }
  }

  const paidAt = payment.paid_at ?? new Date().toISOString()

  if (payment.status !== 'paid') {
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripe_customer_email: session.customer_details?.email ?? null,
        paid_at: paidAt,
      })
      .eq('id', payment.id)

    if (error) throw new Error(error.message)
  }

  if (payment.payment_type === 'membership') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_paid_member: true,
        membership_paid_at: paidAt,
      })
      .eq('id', payment.user_id)

    if (profileError) throw new Error(profileError.message)

    const { error: roleError } = await supabase.from('user_roles').upsert(
      {
        user_id: payment.user_id,
        role: 'member',
      },
      { onConflict: 'user_id,role' },
    )

    if (roleError) throw new Error(roleError.message)
  }

  if (payment.payment_type === 'enrollment' && payment.athlete_id) {
    const { error } = await supabase
      .from('athletes')
      .update({ status: 'matriculado' })
      .eq('id', payment.athlete_id)

    if (error) throw new Error(error.message)
  }

  return { confirmed: true, userId: payment.user_id }
}
