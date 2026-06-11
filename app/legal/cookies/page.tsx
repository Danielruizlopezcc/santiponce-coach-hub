import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { PublicShell } from '@/components/public-shell'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Política de cookies | CD Santiponce',
  description:
    'Política de cookies de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function CookiesPage() {
  return (
    <PublicShell>
      <LegalPage
        title="Política de cookies"
        updatedAt="—"
        current="/legal/cookies"
      >
        <p>
          Esta política explica cómo el {CLUB.legalName} utiliza cookies y
          tecnologías similares en su plataforma. Este documento es una
          plantilla provisional y deberá completarse con el detalle definitivo
          de las cookies utilizadas.
        </p>

        <LegalSection title="1. ¿Qué son las cookies?">
          <p>
            Las cookies son pequeños archivos que se almacenan en el dispositivo
            de la persona usuaria al navegar por la plataforma y permiten
            recordar información sobre su visita.
          </p>
        </LegalSection>

        <LegalSection title="2. Tipos de cookies">
          <p>
            Utilizamos cookies técnicas necesarias para el funcionamiento de la
            plataforma y, en su caso, cookies analíticas para mejorar la
            experiencia de uso.
          </p>
        </LegalSection>

        <LegalSection title="3. Gestión de cookies">
          <p>
            Las personas usuarias pueden configurar o deshabilitar las cookies
            desde la configuración de su navegador. La desactivación de algunas
            cookies puede afectar al funcionamiento de la plataforma.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
