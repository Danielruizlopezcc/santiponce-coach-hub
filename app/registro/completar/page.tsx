'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function CompletingRegistrationCard() {
  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Completando tu registro...
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos finalizando la creación de tu cuenta y guardando tu tarjeta.
        </p>
      </div>
    </div>
  )
}

function CompletarRegistroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        const sessionId = searchParams.get('session_id')
        if (!sessionId) {
          throw new Error('Falta la sesión de Stripe.')
        }

        const response = await fetch('/api/complete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.message ?? 'No se pudo completar la cuenta.')
        }

        setStatus('success')
        setMessage('Tu cuenta se ha creado y tu tarjeta está guardada.')

        setTimeout(() => {
          router.replace('/iniciar-sesion')
        }, 2000)
      } catch (error) {
        setStatus('error')
        setMessage(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al completar el registro',
        )
      }
    }

    completeRegistration()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
      <Card className="w-full max-w-md border-border/70 bg-card/90 backdrop-blur">
        <CardContent className="pt-8">
          {status === 'loading' && (
            <CompletingRegistrationCard />
          )}

          {status === 'success' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="size-12 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  ¡Bienvenido!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {message}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Te redirigiremos al inicio de sesión en unos momentos...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="size-12 text-destructive" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold text-foreground">
                  Algo salió mal
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {message}
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full">
                  <Link href="/registro">Volver al registro</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

export default function CompletarRegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
            <Card className="w-full max-w-md border-border/70 bg-card/90 backdrop-blur">
              <CardContent className="pt-8">
                <CompletingRegistrationCard />
              </CardContent>
            </Card>
          </main>
          <SiteFooter />
        </div>
      }
    >
      <CompletarRegistroContent />
    </Suspense>
  )
}
