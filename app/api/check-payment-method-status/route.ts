import { NextResponse } from 'next/server'
import { confirmStripeSetupSessionPaymentMethod } from '@/lib/payment-method-confirmation'
import { getSavedStripeCardByEmail } from '@/lib/stripe-payment-methods'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const sessionId = new URL(request.url).searchParams.get('session_id')

    if (sessionId) {
      const stripe = getStripeClient()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const result = await confirmStripeSetupSessionPaymentMethod(session)

      if (result.userId && result.userId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const adminSupabase = createAdminClient()
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const savedStripeCard = await getSavedStripeCardByEmail(profile?.email)

    return NextResponse.json({
      hasPaymentMethod: Boolean(savedStripeCard),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
