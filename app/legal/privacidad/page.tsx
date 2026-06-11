import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { PublicShell } from '@/components/public-shell'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Política de privacidad | CD Santiponce',
  description:
    'Política de privacidad de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function PrivacidadPage() {
  return (
    <PublicShell>
      <LegalPage
        title="Política de privacidad"
        updatedAt="—"
        current="/legal/privacidad"
      >
        <p>
          En el {CLUB.legalName} (en adelante, «el Club») nos comprometemos a
          proteger la privacidad de las familias, deportistas y personas
          usuarias de esta plataforma. Este documento es una plantilla
          provisional y deberá completarse con los datos definitivos del Club.
        </p>

        <LegalSection title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales es el{' '}
            {CLUB.legalName}. Los datos de contacto, dirección y CIF se
            incluirán en la versión definitiva de este documento.
          </p>
        </LegalSection>

        <LegalSection title="2. Datos que recopilamos">
          <p>
            Recopilamos los datos necesarios para la gestión de las matrículas y
            la actividad del club, como nombre, apellidos, correo electrónico y
            datos de contacto de las familias y deportistas.
          </p>
        </LegalSection>

        <LegalSection title="3. Finalidad del tratamiento">
          <p>
            Los datos se utilizan para gestionar las inscripciones, comunicar
            información del club y atender las solicitudes de las personas
            usuarias.
          </p>
        </LegalSection>

        <LegalSection title="4. Derechos de las personas usuarias">
          <p>
            Las personas usuarias pueden ejercer sus derechos de acceso,
            rectificación, supresión, oposición, limitación y portabilidad
            poniéndose en contacto con el Club.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
