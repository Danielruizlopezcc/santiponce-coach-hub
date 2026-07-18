import 'server-only'

import Stripe from 'stripe'
import { getAdminSettings } from '@/lib/admin-app'
import { createAdminClient } from '@/lib/supabase/admin'

function readEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta configurar ${name}.`)
  }
  return value
}

export function getStripeClient() {
  return new Stripe(readEnv('STRIPE_SECRET_KEY'))
}

export function getStripeWebhookSecret() {
  return readEnv('STRIPE_WEBHOOK_SECRET')
}

export function getSiteUrl() {
  return readEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '')
}

export async function getMembershipAmountCents() {
  const settings = await getAdminSettings()
  return Math.round(settings.membershipFeeEuros * 100)
}

export async function getEnrollmentAmountCents() {
  const settings = await getAdminSettings()
  return Math.round(settings.enrollmentFeeEuros * 100)
}

// Falls back to the global fee when the category has no override configured.
export async function getEnrollmentAmountCentsForCategory(categoryId?: string | null) {
  const globalCents = await getEnrollmentAmountCents()
  if (!categoryId) return globalCents

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('categories')
    .select('enrollment_fee_cents')
    .eq('id', categoryId)
    .maybeSingle()

  return data?.enrollment_fee_cents ?? globalCents
}
