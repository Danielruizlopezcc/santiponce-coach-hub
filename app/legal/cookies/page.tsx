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
        updatedAt="30 de junio de 2026"
        current="/legal/cookies"
      >
        <p>
          Esta política explica cómo el {CLUB.legalName} utiliza cookies y
          tecnologías similares en su plataforma para garantizar el acceso,
          mantener la sesión y mejorar la seguridad del servicio.
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
            Utilizamos cookies técnicas necesarias para iniciar sesión, recordar
            preferencias básicas y proteger formularios o zonas privadas. Si en
            el futuro se incorporan cookies analíticas o de terceros no
            imprescindibles, se solicitará el consentimiento correspondiente.
          </p>
        </LegalSection>

        <LegalSection title="3. Gestión de cookies">
          <p>
            Las personas usuarias pueden configurar o deshabilitar las cookies
            desde la configuración de su navegador. La desactivación de algunas
            cookies técnicas puede impedir el acceso a la zona privada, pagos,
            recuperación de contraseña o gestión de matrículas.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
