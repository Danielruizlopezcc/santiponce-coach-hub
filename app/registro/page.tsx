import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PublicShell } from '@/components/public-shell'
import { RegistroForm } from '@/components/registro-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Registrarse | CD Santiponce',
  description:
    'Crea tu cuenta en la plataforma oficial del Club Deportivo Santiponce.',
}

export default function RegistroPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-10 sm:py-14">
        <Image
          src={CLUB.crest || '/placeholder.svg'}
          alt={`Escudo del ${CLUB.legalName}`}
          width={72}
          height={72}
          priority
          className="mb-4 h-auto w-auto object-contain"
          style={{ width: 72, height: 72 }}
        />
        <Card className="w-full border-border/70 bg-card/90 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-balance">Crear cuenta</CardTitle>
            <CardDescription className="text-pretty">
              Elige entre crear una cuenta de tutor o de socio para acceder a tu
              área privada del {CLUB.legalName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistroForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/iniciar-sesion"
            className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </PublicShell>
  )
}
