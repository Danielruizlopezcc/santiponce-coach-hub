import { NextResponse } from 'next/server'
import { completePendingRegistration } from '@/app/registro/actions'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ message: 'Falta la sesión de Stripe.' }, { status: 400 })
    }

    const result = await completePendingRegistration(sessionId)

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'No se ha podido completar el registro.' },
      { status: 500 },
    )
  }
}
