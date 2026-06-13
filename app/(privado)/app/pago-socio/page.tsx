import Link from 'next/link'
import { MembershipPaymentButton } from '@/components/membership-payment-button'
import { Button } from '@/components/ui/button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { MEMBERSHIP_IMPORTE } from '@/lib/club'
import { getPrivateUserStatus } from '@/lib/private-app'

export default async function PagoSocioPage() {
  const user = await requireUser()
  const status = await getPrivateUserStatus(user.id)

  return (
    <PrivatePageContainer
      title="Pago de membresía"
      description={`Activa tu cuenta de socio con el pago de ${MEMBERSHIP_IMPORTE}€.`}
    >
      <div className="space-y-6 rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground">
            {status.isPaidSocio ? 'Tu cuota ya está activa.' : 'Tu registro está listo.'}
          </p>
          <p className="text-sm text-muted-foreground">
            {status.isPaidSocio
              ? 'Tu membresía ya está confirmada. Si acabas de pagar, el panel puede tardar unos segundos en refrescarse.'
              : `Para hacerte socio y completar la cuota de ${MEMBERSHIP_IMPORTE}€, finaliza el pago de membresía.`}
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Paso siguiente</p>
          <p className="mt-2">
            {status.isPaidSocio
              ? 'Ya puedes volver al panel y seguir usando la zona privada del club.'
              : 'Pulsa el botón para abrir el pago y completar el proceso de forma segura.'}
          </p>
        </div>

        {status.isPaidSocio ? (
          <Button asChild className="w-full max-w-xs">
            <Link href="/app" className="w-full text-center">
              Volver al panel
            </Link>
          </Button>
        ) : (
          <MembershipPaymentButton className="w-full max-w-xs" />
        )}
      </div>
    </PrivatePageContainer>
  )
}
