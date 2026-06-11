import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { PublicShell } from '@/components/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Iniciar sesión | CD Santiponce',
  description:
    'Accede a tu cuenta de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function IniciarSesionPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Iniciar sesión"
        description="Accede con tu correo y contraseña."
        footer={
          <>
            ¿Todavía no tienes cuenta?{' '}
            <Link
              href="/registro"
              className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Registrarse
            </Link>
          </>
        }
      >
        {/* TODO: conectar con backend real (Supabase) más adelante */}
        <form className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/recuperar-contrasena"
                className="rounded text-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="recordarme"
              className="h-4 w-4 rounded border-input accent-[var(--primary)]"
            />
            Recordarme en este dispositivo
          </label>

          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>
        </form>
      </AuthCard>
    </PublicShell>
  )
}
