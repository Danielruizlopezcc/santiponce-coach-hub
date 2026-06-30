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
        updatedAt="30 de junio de 2026"
        current="/legal/condiciones-matricula"
      >
        <p>
          Las presentes condiciones regulan el proceso de matrícula en el{' '}
          {CLUB.legalName} para la temporada {CLUB.season}. La solicitud de
          matrícula implica la aceptación de estas condiciones por parte de la
          familia o persona responsable.
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
            {CLUB.season} se mostrarán en la plataforma o serán comunicadas por
            el Club. La matrícula quedará confirmada cuando el Club valide los
            datos y el pago asociado conste como realizado.
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
            Cualquier baja, modificación de datos o cambio de equipo/categoría
            deberá solicitarse al Club. Las devoluciones o ajustes económicos se
            tramitarán conforme a la política de pagos y devoluciones publicada
            en esta plataforma.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
