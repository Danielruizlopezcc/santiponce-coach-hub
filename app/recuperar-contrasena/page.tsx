import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { PublicShell } from '@/components/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | CD Santiponce',
  description:
    'Restablece la contraseña de tu cuenta de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function RecuperarContrasenaPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Recuperar contraseña"
        description="Introduce tu correo y te enviaremos instrucciones para restablecer tu contraseña."
        footer={
          <>
            ¿Recordaste tu contraseña?{' '}
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

          <Button type="submit" className="w-full">
            Enviar instrucciones
          </Button>
        </form>
      </AuthCard>
    </PublicShell>
  )
}
