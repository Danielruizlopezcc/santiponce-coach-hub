import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/auth-card'
import { PublicShell } from '@/components/public-shell'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Restablecer contraseña | CD Santiponce',
  description: 'Crea una nueva contraseña para tu cuenta de CD Santiponce.',
}

export default function RestablecerContrasenaPage() {
  return (
    <PublicShell>
      <AuthCard
        title="Restablecer contraseña"
        description="Introduce tu nueva contraseña para recuperar el acceso a tu cuenta."
        footer={
          <>
            ¿Ya la has cambiado?{' '}
            <Link
              href="/iniciar-sesion"
              className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Iniciar sesión
            </Link>
          </>
        }
      >
        <ResetPasswordForm />
      </AuthCard>
    </PublicShell>
  )
}
