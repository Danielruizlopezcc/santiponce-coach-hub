'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function ConfigurarPagoExitoPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    const sessionId = new URLSearchParams(window.location.search).get('session_id')

    const checkPaymentMethodStatus = async () => {
      for (let attempt = 1; attempt <= 6 && isMounted; attempt += 1) {
        const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
        const response = await fetch(`/api/check-payment-method-status${query}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (response.ok) {
          const { hasPaymentMethod } = await response.json()

          if (hasPaymentMethod) {
            setIsReady(true)
            setTimeout(() => {
              window.location.assign('/app')
            }, 1500)
            return
          }
        }

        if (attempt < 6) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }
    }

    checkPaymentMethodStatus()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <PrivatePageContainer
      title="¡Tarjeta guardada!"
      description="Tu método de pago está listo para usar."
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 size-7 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">
              {isReady ? 'Tu tarjeta se ha guardado correctamente' : 'Estamos confirmando tu tarjeta'}
            </h2>
            <p className="mt-2 text-sm text-emerald-800">
              {isReady
                ? 'Tu método de pago está listo para futuros cargos autorizados. Te redirigiremos al panel en unos segundos.'
                : 'Estamos terminando de guardar el método de pago antes de abrir el panel.'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild disabled={!isReady}>
            <a
              href={isReady ? '/app' : undefined}
              aria-disabled={!isReady}
              className="flex items-center gap-2"
            >
              <Loader2 className="size-4 animate-spin" />
              {isReady ? 'Ir al panel' : 'Confirmando tarjeta'}
            </a>
          </Button>
        </div>
      </section>
    </PrivatePageContainer>
  )
}
