import { NextResponse } from 'next/server'
import { getStripeClient, getSiteUrl } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { email, nombre, apellidos } = await request.json()

    if (!email || !nombre || !apellidos) {
      return NextResponse.json(
        { message: 'Faltan datos requeridos' },
        { status: 400 },
      )
    }

    const stripe = getStripeClient()
    const siteUrl = getSiteUrl()

    // Crear o buscar cliente de Stripe
    const customer = await stripe.customers.create({
      email,
      name: `${nombre} ${apellidos}`,
      metadata: {
        isNewUser: 'true',
        registroStep: 'payment-setup',
      },
    })

    // Crear sesión de Setup para configurar método de pago
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      success_url: `${siteUrl}/registro/completar?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/registro?cancelled=true`,
      metadata: {
        flowType: 'registration_payment_method_setup',
        email,
        nombre,
        apellidos,
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating setup session:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
