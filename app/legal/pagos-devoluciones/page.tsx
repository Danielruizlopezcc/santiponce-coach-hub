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
        updatedAt="30 de junio de 2026"
        current="/legal/pagos-devoluciones"
      >
        <p>
          Esta política describe las condiciones aplicables a los pagos de
          matrículas, cuotas de socio y otros servicios gestionados por el
          {CLUB.legalName} a través de su plataforma.
        </p>

        <LegalSection title="1. Medios de pago">
          <p>
            La plataforma puede procesar pagos mediante Stripe, tarjeta bancaria
            u otros métodos habilitados por el Club. En determinados casos, el
            Club podrá registrar pagos manuales realizados por transferencia,
            efectivo, Bizum u otro medio aceptado administrativamente.
          </p>
        </LegalSection>

        <LegalSection title="2. Plazos y cuotas">
          <p>
            Las matrículas y cuotas de la temporada {CLUB.season} deberán
            abonarse dentro de los plazos comunicados por el Club. Las cuotas
            recurrentes o fraccionadas solo se cargarán cuando hayan sido
            configuradas y autorizadas previamente.
          </p>
        </LegalSection>

        <LegalSection title="3. Política de devoluciones">
          <p>
            Las solicitudes de devolución se revisarán caso por caso. Podrán
            aceptarse devoluciones por cobros duplicados, errores administrativos
            o servicios no prestados por causa imputable al Club. Una vez
            aprobado el reembolso, se realizará preferentemente al mismo método
            de pago utilizado en la operación original.
          </p>
        </LegalSection>

        <LegalSection title="4. Reclamaciones">
          <p>
            Las reclamaciones relacionadas con pagos, cargos fallidos o
            devoluciones podrán dirigirse al Club indicando nombre completo,
            correo electrónico, concepto del pago y fecha aproximada de la
            operación. El Club revisará la solicitud y responderá por sus canales
            oficiales de contacto.
          </p>
        </LegalSection>
      </LegalPage>
    </PublicShell>
  )
}
