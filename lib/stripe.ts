import 'server-only'

import Stripe from 'stripe'
import { MATRICULA_IMPORTE, MEMBERSHIP_IMPORTE } from '@/lib/club'

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

export function getMembershipAmountCents() {
  return MEMBERSHIP_IMPORTE * 100
}

export function getEnrollmentAmountCents() {
  return MATRICULA_IMPORTE * 100
}
