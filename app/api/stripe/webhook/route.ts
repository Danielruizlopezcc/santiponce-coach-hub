import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { confirmStripeSetupSessionPaymentMethod } from '@/lib/payment-method-confirmation'
import { confirmStripeCheckoutSessionPayment } from '@/lib/payment-confirmation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'
import {
  confirmTutorFeeInvoiceFailed,
  confirmTutorFeeInvoicePaid,
  syncTutorFeeSubscription,
} from '@/lib/tutor-fee-billing'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Falta Stripe-Signature.' }, { status: 400 })
  }

  const payload = await request.text()
  const stripe = getStripeClient()

  let event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret())
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Firma inválida.' },
      { status: 400 },
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const supabase = createAdminClient()
    const flowType = session.metadata?.flowType

    if (flowType === 'payment_method_setup' && session.metadata?.userId) {
      const setupIntentId =
        typeof session.setup_intent === 'string' ? session.setup_intent : null

      if (setupIntentId) {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
        const paymentMethodId =
          typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : null

        if (paymentMethodId) {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
          const card = paymentMethod.card

          await supabase
            .from('profiles')
            .update({
              stripe_customer_id:
                typeof session.customer === 'string' ? session.customer : null,
              stripe_payment_method_id: paymentMethod.id,
              payment_method_brand: card?.brand ?? null,
              payment_method_last4: card?.last4 ?? null,
              payment_method_exp_month: card?.exp_month ?? null,
              payment_method_exp_year: card?.exp_year ?? null,
              payment_method_saved_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.userId)
        }
      }
    }

    await confirmStripeSetupSessionPaymentMethod(session)
    await confirmStripeCheckoutSessionPayment(session)

    revalidatePath('/app')
    revalidatePath('/app/configurar-pago')
    revalidatePath('/app/pago-socio')
    revalidatePath('/app/matriculacion')
    revalidatePath('/app/perfil')
    revalidatePath('/admin')
    revalidatePath('/admin/matriculas')
    revalidatePath('/admin/pagos')
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    await syncTutorFeeSubscription(event.data.object)
    revalidatePath('/admin/tutores')
    revalidatePath('/admin/pagos')
  }

  if (event.type === 'invoice.paid') {
    await confirmTutorFeeInvoicePaid(event.data.object)
    revalidatePath('/admin/tutores')
    revalidatePath('/admin/pagos')
  }

  if (event.type === 'invoice.payment_failed') {
    await confirmTutorFeeInvoiceFailed(event.data.object)
    revalidatePath('/admin/tutores')
    revalidatePath('/admin/pagos')
  }

  return NextResponse.json({ received: true })
}
