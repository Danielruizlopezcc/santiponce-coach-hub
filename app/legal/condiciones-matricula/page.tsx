import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { PublicShell } from '@/components/public-shell'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Condiciones de matrícula | CD Santiponce',
  description:
    'Condiciones de matrícula de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function CondicionesMatriculaPage() {
  return (
    <PublicShell>
      <LegalPage
        title="Condiciones de matrícula"
        updatedAt="—"
        current="/legal/condiciones-matricula"
      >
        <p>
          Las presentes condiciones regulan el proceso de matrícula en el{' '}
          {CLUB.legalName} para la temporada {CLUB.season}. Este documento es
          una plantilla provisional y deberá completarse con las condiciones
          definitivas del Club.
        </p>

        <LegalSection title="1. Proceso de inscripción">
          <p>
            La inscripción se realiza a través de esta plataforma cumplimentando
            los datos del deportista y de la familia responsable, así como la
            documentación que el Club requiera.
          </p>
        </LegalSection>

        <LegalSection title="2. Cuotas y temporada">
          <p>
            Las cuotas, plazos y categorías correspondientes a la temporada{' '}
            {CLUB.season} se publicarán en la versión definitiva de este
            documento.
          </p>
        </LegalSection>

        <LegalSection title="3. Compromiso de las familias">
          <p>
            Las familias se comprometen a facilitar información veraz y a
            respetar las normas de convivencia y funcionamiento del Club.
          </p>
        </LegalSection>

        <LegalSection title="4. Baja y modificaciones">
          <p>
            Las condiciones para solicitar la baja o modificar una matrícula se
            detallarán en la versión definitiva, junto con la política de pagos
            y devoluciones.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
