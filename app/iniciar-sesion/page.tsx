import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { LoginForm } from '@/components/login-form'
import { PublicShell } from '@/components/public-shell'

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
        <div className="mb-4 text-right">
          <Link
            href="/recuperar-contrasena"
            className="rounded text-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <LoginForm />
      </AuthCard>
    </PublicShell>
  )
}
