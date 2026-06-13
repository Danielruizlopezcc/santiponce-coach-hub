import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'

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
    const paymentId = session.metadata?.paymentId
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

    if (paymentId) {
      const { data: payment } = await supabase
        .from('payments')
        .select(
          'id, user_id, guardian_id, athlete_id, payment_type, status, stripe_checkout_session_id',
        )
        .eq('id', paymentId)
        .maybeSingle()

      if (payment && payment.status !== 'paid') {
        const paidAt = new Date().toISOString()

        await supabase
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

        if (payment.payment_type === 'membership') {
          await supabase
            .from('profiles')
            .update({
              is_paid_member: true,
              membership_paid_at: paidAt,
            })
            .eq('id', payment.user_id)

          await supabase
            .from('user_roles')
            .upsert(
              {
                user_id: payment.user_id,
                role: 'member',
              },
              { onConflict: 'user_id,role' },
            )
        }

        if (payment.payment_type === 'enrollment' && payment.athlete_id) {
          await supabase
            .from('athletes')
            .update({ status: 'matriculado' })
            .eq('id', payment.athlete_id)
        }
      }
    }

    revalidatePath('/app')
    revalidatePath('/app/configurar-pago')
    revalidatePath('/app/pago-socio')
    revalidatePath('/app/matriculacion')
    revalidatePath('/app/perfil')
    revalidatePath('/admin')
    revalidatePath('/admin/matriculas')
    revalidatePath('/admin/pagos')
  }

  return NextResponse.json({ received: true })
}
