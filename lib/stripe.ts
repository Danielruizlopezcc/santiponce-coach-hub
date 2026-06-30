import 'server-only'

import Stripe from 'stripe'
import { getAdminSettings } from '@/lib/admin-app'

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
