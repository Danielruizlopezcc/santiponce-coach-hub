import 'server-only'

import { getStripeClient } from '@/lib/stripe'

export type SavedStripeCard = {
  customerId: string
  paymentMethodId: string
  brand: string | null
  last4: string | null
  expMonth: number | null
  expYear: number | null
}

export async function getSavedStripeCardByEmail(email: string | null | undefined) {
  if (!email) return null

  const stripe = getStripeClient()
  const customers = await stripe.customers.list({
    email,
    limit: 100,
  })

  for (const customer of customers.data) {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
      limit: 1,
    })
    const paymentMethod = paymentMethods.data[0]

    if (paymentMethod) {
      return {
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        brand: paymentMethod.card?.brand ?? null,
        last4: paymentMethod.card?.last4 ?? null,
        expMonth: paymentMethod.card?.exp_month ?? null,
        expYear: paymentMethod.card?.exp_year ?? null,
      } satisfies SavedStripeCard
    }
  }

  return null
}
