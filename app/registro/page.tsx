import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { PublicShell } from '@/components/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Registrarse | CD Santiponce',
  description:
    'Crea tu cuenta en la plataforma oficial del Club Deportivo Santiponce.',
}

export default function RegistroPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Crear cuenta"
        description="Regístrate para acceder a la plataforma oficial del club."
        footer={
          <>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/iniciar-sesion"
              className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Iniciar sesión
            </Link>
          </>
        }
      >
        {/* TODO: conectar con backend real (Supabase) más adelante */}
        <form className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                autoComplete="given-name"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                name="apellidos"
                autoComplete="family-name"
                placeholder="Tus apellidos"
                required
              />
            </div>
          </div>

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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Repetir contraseña</Label>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="acepto"
              required
              className="mt-1 h-4 w-4 rounded border-input accent-[var(--primary)]"
            />
            <span className="text-pretty">
              He leído y acepto la{' '}
              <Link
                href="/legal/privacidad"
                className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                política de privacidad
              </Link>{' '}
              y las{' '}
              <Link
                href="/legal/condiciones-matricula"
                className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                condiciones de matrícula
              </Link>
              .
            </span>
          </label>

          <Button type="submit" className="w-full">
            Crear cuenta
          </Button>
        </form>
      </AuthCard>
    </PublicShell>
  )
}
