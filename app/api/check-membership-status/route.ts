import { NextResponse } from 'next/server'
import { confirmStripeCheckoutSessionPayment } from '@/lib/payment-confirmation'
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
      const result = await confirmStripeCheckoutSessionPayment(session)

      if (result.userId && result.userId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const adminSupabase = createAdminClient()
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('is_paid_member')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      isPaid: Boolean(profile?.is_paid_member),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
