'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CompletarRegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        const sessionId = searchParams.get('session_id')
        const formDataStr = sessionStorage.getItem('registroFormData')

        if (!sessionId || !formDataStr) {
          throw new Error('Faltan datos del registro')
        }

        const formData = JSON.parse(formDataStr)

        // Crear la cuenta con los datos del formulario
        const response = await fetch('/app/registro/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('No se pudo crear la cuenta')
        }

        // Limpiar sessionStorage
        sessionStorage.removeItem('registroFormData')

        // Hacer login automático
        const supabaseModule = await import('@/lib/supabase/client')
        const supabase = supabaseModule.createClient()
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          throw new Error('No se pudo iniciar sesión automáticamente')
        }

        setStatus('success')
        setMessage('Tu cuenta se ha creado y tu tarjeta está guardada.')

        // Redirigir al panel después de 2 segundos
        setTimeout(() => {
          router.replace('/app')
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:py-14">
      <Card className="w-full max-w-md border-border/70 bg-card/90 backdrop-blur">
        <CardContent className="pt-8">
          {status === 'loading' && (
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
                Te redirigiremos al panel en unos momentos...
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
    </div>
  )
}
