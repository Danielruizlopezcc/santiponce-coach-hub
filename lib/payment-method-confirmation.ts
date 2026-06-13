import 'server-only'

import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

export async function confirmStripeSetupSessionPaymentMethod(session: Stripe.Checkout.Session) {
  if (session.mode !== 'setup' || session.status !== 'complete') {
    return { confirmed: false, userId: null }
  }

  const userId = session.metadata?.userId ?? null
  if (!userId) {
    return { confirmed: false, userId: null }
  }

  const setupIntentId =
    typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent?.id ?? null

  if (!setupIntentId) {
    return { confirmed: false, userId }
  }

  const stripe = getStripeClient()
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  const paymentMethodId =
    typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id ?? null

  if (!paymentMethodId) {
    return { confirmed: false, userId }
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  const card = paymentMethod.card

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id:
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
      stripe_payment_method_id: paymentMethod.id,
      payment_method_brand: card?.brand ?? null,
      payment_method_last4: card?.last4 ?? null,
      payment_method_exp_month: card?.exp_month ?? null,
      payment_method_exp_year: card?.exp_year ?? null,
      payment_method_saved_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error && error.code !== '42703' && error.code !== 'PGRST204') {
    throw new Error(error.message)
  }

  return { confirmed: true, userId }
}
