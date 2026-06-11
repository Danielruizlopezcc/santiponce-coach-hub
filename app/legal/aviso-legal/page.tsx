import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { PublicShell } from '@/components/public-shell'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Aviso legal | CD Santiponce',
  description:
    'Aviso legal de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function AvisoLegalPage() {
  return (
    <PublicShell>
      <LegalPage
        title="Aviso legal"
        updatedAt="—"
        current="/legal/aviso-legal"
      >
        <p>
          El presente aviso legal regula el uso de la plataforma oficial del{' '}
          {CLUB.legalName}. Este documento es una plantilla provisional y deberá
          completarse con los datos identificativos definitivos del Club.
        </p>

        <LegalSection title="1. Titularidad">
          <p>
            La titularidad de esta plataforma corresponde al {CLUB.legalName}.
            Los datos de identificación, domicilio social y de contacto se
            incluirán en la versión definitiva.
          </p>
        </LegalSection>

        <LegalSection title="2. Condiciones de uso">
          <p>
            El acceso y uso de la plataforma implica la aceptación de las
            presentes condiciones. Las personas usuarias se comprometen a hacer
            un uso adecuado de los contenidos y servicios.
          </p>
        </LegalSection>

        <LegalSection title="3. Propiedad intelectual">
          <p>
            Los contenidos, el escudo y los signos distintivos del Club están
            protegidos por los derechos de propiedad intelectual e industrial
            correspondientes.
          </p>
        </LegalSection>

        <LegalSection title="4. Responsabilidad">
          <p>
            El Club no se hace responsable del uso indebido de la plataforma por
            parte de terceros ni de las interrupciones que puedan producirse por
            causas ajenas a su control.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
