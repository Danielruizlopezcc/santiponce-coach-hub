import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal-page'
import { PublicShell } from '@/components/public-shell'
import { CLUB } from '@/lib/club'

export const metadata: Metadata = {
  title: 'Pagos y devoluciones | CD Santiponce',
  description:
    'Política de pagos y devoluciones de la plataforma oficial del Club Deportivo Santiponce.',
}

export default function PagosDevolucionesPage() {
  return (
    <PublicShell>
      <LegalPage
        title="Pagos y devoluciones"
        updatedAt="—"
        current="/legal/pagos-devoluciones"
      >
        <p>
          Esta política describe las condiciones de pago y devolución aplicables
          a las matrículas y servicios del {CLUB.legalName}. Este documento es
          una plantilla provisional y deberá completarse con las condiciones
          definitivas. No incluye ningún sistema de pago real.
        </p>

        <LegalSection title="1. Medios de pago">
          <p>
            Los medios de pago aceptados por el Club se detallarán en la versión
            definitiva. Actualmente la plataforma no procesa pagos reales.
          </p>
        </LegalSection>

        <LegalSection title="2. Plazos y cuotas">
          <p>
            Los plazos de pago de las cuotas de la temporada {CLUB.season} se
            comunicarán a las familias a través de la plataforma.
          </p>
        </LegalSection>

        <LegalSection title="3. Política de devoluciones">
          <p>
            Las condiciones y plazos para solicitar devoluciones se incluirán en
            la versión definitiva, conforme a la normativa aplicable.
          </p>
        </LegalSection>

        <LegalSection title="4. Reclamaciones">
          <p>
            Las personas usuarias podrán presentar reclamaciones relacionadas
            con los pagos a través de los canales de contacto que el Club ponga
            a su disposición.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
