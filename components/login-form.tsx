'use client'

import { useActionState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { loginAction } from '@/app/iniciar-sesion/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState = {
  ok: false,
  message: '',
} as const

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  useEffect(() => {
    if (state.ok) {
      window.location.assign(state.targetPath)
    }
  }, [state])

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <div className="grid gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          required
        />
      </div>

      {state.message && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Iniciar sesión
      </Button>
    </form>
  )
}
