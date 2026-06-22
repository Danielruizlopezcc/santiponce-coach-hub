import 'server-only'

import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

type FeeTemplateForStripe = {
  id: string
  name: string
  fee_type: string
  total_amount_cents: number
  currency: string
  stripe_product_id: string | null
}

export type TutorFeeChargeDraft = {
  id: string
  amount_cents: number
  due_date: string
  charge_number: number
}

type GuardianBillingProfile = {
  guardianId: string
  userId: string
  email: string
  name: string
  stripeCustomerId: string
  stripePaymentMethodId: string
}

function getDueTimestamp(dueDate: string) {
  const [year, month, day] = dueDate.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day, 9, 0, 0) / 1000)
}

export function validateFirstDueDate(dueDate: string) {
  const firstDueTime = getDueTimestamp(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (firstDueTime < Math.floor(today.getTime() / 1000)) {
    throw new Error('La primera fecha de cobro no puede estar en el pasado.')
  }
}

export async function getGuardianBillingProfile(guardianId: string): Promise<GuardianBillingProfile> {
  const supabase = createAdminClient()
  const { data: guardian, error: guardianError } = await supabase
    .from('guardians')
    .select('id, user_id, first_name, last_name')
    .eq('id', guardianId)
    .maybeSingle()

  if (guardianError) throw new Error(guardianError.message)
  if (!guardian) throw new Error('No se ha encontrado el tutor.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id, stripe_payment_method_id')
    .eq('id', guardian.user_id)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile?.email) throw new Error('El tutor no tiene email configurado.')
  if (!profile.stripe_customer_id || !profile.stripe_payment_method_id) {
    throw new Error('El tutor todavía no tiene una tarjeta guardada en Stripe.')
  }

  return {
    guardianId: guardian.id,
    userId: guardian.user_id,
    email: profile.email,
    name: `${guardian.first_name ?? ''} ${guardian.last_name ?? ''}`.trim() || profile.email,
    stripeCustomerId: profile.stripe_customer_id,
    stripePaymentMethodId: profile.stripe_payment_method_id,
  }
}

async function ensureStripeProduct(fee: FeeTemplateForStripe) {
  const stripe = getStripeClient()
  if (fee.stripe_product_id) return fee.stripe_product_id

  const product = await stripe.products.create({
    name: fee.name,
    description: fee.fee_type,
    metadata: {
      feeTemplateId: fee.id,
      flowType: 'tutor_fee_template',
    },
  })

  const supabase = createAdminClient()
  await supabase
    .from('admin_fee_templates')
    .update({ stripe_product_id: product.id })
    .eq('id', fee.id)

  return product.id
}

async function createRecurringPrice({
  fee,
  productId,
  amountCents,
  frequencyMonths,
  chargeId,
}: {
  fee: FeeTemplateForStripe
  productId: string
  amountCents: number
  frequencyMonths: number
  chargeId: string
}) {
  const stripe = getStripeClient()
  return stripe.prices.create({
    currency: fee.currency || 'eur',
    unit_amount: amountCents,
    product: productId,
    recurring: {
      interval: 'month',
      interval_count: Math.max(1, frequencyMonths),
    },
    metadata: {
      feeTemplateId: fee.id,
      chargeId,
      flowType: 'tutor_fee_charge',
    },
  })
}

export async function createTutorFeeStripeSchedule({
  assignmentId,
  guardianId,
  fee,
  charges,
  frequencyMonths,
}: {
  assignmentId: string
  guardianId: string
  fee: FeeTemplateForStripe
  charges: TutorFeeChargeDraft[]
  frequencyMonths: number
}) {
  if (charges.length === 0) throw new Error('No hay cargos para programar.')
  validateFirstDueDate(charges[0].due_date)

  const billingProfile = await getGuardianBillingProfile(guardianId)
  const productId = await ensureStripeProduct(fee)

  const prices = await Promise.all(
    charges.map((charge) =>
      createRecurringPrice({
        fee,
        productId,
        amountCents: charge.amount_cents,
        frequencyMonths,
        chargeId: charge.id,
      }),
    ),
  )

  const supabase = createAdminClient()
  await Promise.all(
    prices.map((price, index) =>
      supabase
        .from('tutor_fee_charges')
        .update({ stripe_price_id: price.id })
        .eq('id', charges[index].id),
    ),
  )

  const stripe = getStripeClient()
  const schedule = await stripe.subscriptionSchedules.create({
    customer: billingProfile.stripeCustomerId,
    start_date: getDueTimestamp(charges[0].due_date),
    end_behavior: 'cancel',
    default_settings: {
      collection_method: 'charge_automatically',
      default_payment_method: billingProfile.stripePaymentMethodId,
    },
    phases: charges.map((charge, index) => ({
      items: [
        {
          price: prices[index].id,
          quantity: 1,
        },
      ],
      duration: {
        interval: 'month',
        interval_count: Math.max(1, frequencyMonths),
      },
      metadata: {
        assignmentId,
        chargeId: charge.id,
        chargeNumber: String(charge.charge_number),
      },
    })),
    metadata: {
      assignmentId,
      guardianId,
      feeTemplateId: fee.id,
      flowType: 'tutor_fee_assignment',
    },
  })

  return schedule
}

export async function cancelTutorFeeStripeSchedule({
  scheduleId,
  subscriptionId,
}: {
  scheduleId: string | null
  subscriptionId: string | null
}) {
  if (!scheduleId && !subscriptionId) return

  const stripe = getStripeClient()
  if (scheduleId) {
    try {
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
      if (!['canceled', 'completed', 'released'].includes(schedule.status)) {
        await stripe.subscriptionSchedules.cancel(scheduleId)
      }
      return
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('No such subscription_schedule')) {
        throw error
      }
    }
  }

  if (subscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscriptionId)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('No such subscription')) {
        throw error
      }
    }
  }
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }
  const subscription = invoiceWithSubscription.subscription
  return typeof subscription === 'string' ? subscription : subscription?.id ?? null
}

function getPaymentIntentIdFromInvoice(invoice: Stripe.Invoice) {
  const invoiceWithPaymentIntent = invoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null
  }
  const paymentIntent = invoiceWithPaymentIntent.payment_intent
  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id ?? null
}

async function getAssignmentForInvoice(invoice: Stripe.Invoice) {
  const supabase = createAdminClient()
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)

  if (subscriptionId) {
    const { data, error } = await supabase
      .from('tutor_fee_assignments')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle<{ id: string }>()

    if (error) throw new Error(error.message)
    if (data) return { supabase, assignmentId: data.id }
  }

  const scheduleId = invoice.parent?.subscription_details?.metadata?.assignmentId ?? invoice.metadata?.assignmentId
  if (scheduleId) return { supabase, assignmentId: scheduleId }

  return { supabase, assignmentId: null }
}

async function getChargeForInvoice(assignmentId: string, invoiceId: string) {
  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('tutor_fee_charges')
    .select('id')
    .eq('stripe_invoice_id', invoiceId)
    .maybeSingle<{ id: string }>()

  if (existingError) throw new Error(existingError.message)
  if (existing) return existing.id

  const { data: nextCharge, error: nextChargeError } = await supabase
    .from('tutor_fee_charges')
    .select('id')
    .eq('assignment_id', assignmentId)
    .in('status', ['scheduled', 'failed'])
    .order('due_date', { ascending: true })
    .order('charge_number', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (nextChargeError) throw new Error(nextChargeError.message)
  return nextCharge?.id ?? null
}

export async function syncTutorFeeSubscription(subscription: Stripe.Subscription) {
  const scheduleId = typeof subscription.schedule === 'string' ? subscription.schedule : subscription.schedule?.id ?? null
  if (!scheduleId) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tutor_fee_assignments')
    .update({ stripe_subscription_id: subscription.id })
    .eq('stripe_subscription_schedule_id', scheduleId)

  if (error) throw new Error(error.message)
}

export async function confirmTutorFeeInvoicePaid(invoice: Stripe.Invoice) {
  const { supabase, assignmentId } = await getAssignmentForInvoice(invoice)
  if (!assignmentId) return

  const chargeId = await getChargeForInvoice(assignmentId, invoice.id)
  if (!chargeId) return

  const paidAt = new Date((invoice.status_transitions?.paid_at ?? Math.floor(Date.now() / 1000)) * 1000).toISOString()
  const { error } = await supabase
    .from('tutor_fee_charges')
    .update({
      status: 'paid',
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: getPaymentIntentIdFromInvoice(invoice),
      paid_at: paidAt,
      failed_at: null,
    })
    .eq('id', chargeId)

  if (error) throw new Error(error.message)

  const { count, error: countError } = await supabase
    .from('tutor_fee_charges')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .neq('status', 'paid')

  if (countError) throw new Error(countError.message)
  if (count === 0) {
    const { error: assignmentError } = await supabase
      .from('tutor_fee_assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentId)

    if (assignmentError) throw new Error(assignmentError.message)
  }
}

export async function confirmTutorFeeInvoiceFailed(invoice: Stripe.Invoice) {
  const { supabase, assignmentId } = await getAssignmentForInvoice(invoice)
  if (!assignmentId) return

  const chargeId = await getChargeForInvoice(assignmentId, invoice.id)
  if (!chargeId) return

  const { error } = await supabase
    .from('tutor_fee_charges')
    .update({
      status: 'failed',
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: getPaymentIntentIdFromInvoice(invoice),
      failed_at: new Date().toISOString(),
    })
    .eq('id', chargeId)

  if (error) throw new Error(error.message)
}
