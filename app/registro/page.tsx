import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { PublicShell } from '@/components/public-shell'
import { RegistroForm } from '@/components/registro-form'

export const metadata: Metadata = {
  title: 'Registrarse | CD Santiponce',
  description:
    'Crea tu cuenta en la plataforma oficial del Club Deportivo Santiponce.',
}

export default function RegistroPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Crear cuenta de tutor"
        description="Regístrate como tutor para gestionar la matriculación de tus deportistas."
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
        <RegistroForm />
      </AuthCard>
    </PublicShell>
  )
}
