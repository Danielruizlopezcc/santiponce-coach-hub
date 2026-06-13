'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function PagoSocioExitoPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    let isMounted = true
    const sessionId = new URLSearchParams(window.location.search).get('session_id')

    const checkPaymentStatus = async () => {
      for (let attempt = 1; attempt <= 6 && isMounted; attempt += 1) {
        try {
          const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
          const response = await fetch(`/api/check-membership-status${query}`, {
            method: 'GET',
            cache: 'no-store',
          })

          if (response.ok) {
            const { isPaid: isPaidMember } = await response.json()
            if (!isMounted) return

            setIsPaid(isPaidMember)

            if (isPaidMember) {
              setTimeout(() => {
                router.replace('/app')
              }, 2000)
              setIsChecking(false)
              return
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error)
        }

        if (attempt < 6) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }

      if (isMounted) {
        setIsChecking(false)
      }
    }

    checkPaymentStatus()

    return () => {
      isMounted = false
    }
  }, [router])

  return (
    <PrivatePageContainer
      title="Pago enviado"
      description="Hemos recibido tu solicitud y estamos terminando la confirmación."
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {isChecking ? (
            <Loader2 className="mt-0.5 size-7 text-emerald-600 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-7 text-emerald-600" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">
              {isPaid ? '¡Tu membresía está activa!' : 'Estamos confirmando tu membresía'}
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              {isPaid
                ? 'Tu pago se ha completado correctamente. Te redirigiremos al panel en unos segundos.'
                : 'Si el pago se ha completado correctamente, tu cuenta quedará marcada como socio en unos instantes.'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!isChecking && !isPaid && (
            <>
              <Button nativeButton={false} render={<Link href="/app" />}>
                Volver al panel
              </Button>
              <Button nativeButton={false} variant="outline" render={<Link href="/app/pago-socio" />}>
                Ver estado del pago
              </Button>
            </>
          )}
        </div>
      </section>
    </PrivatePageContainer>
  )
}
