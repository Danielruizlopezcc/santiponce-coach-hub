import Link from 'next/link'
import { ArrowRight, CheckCircle2, CreditCard } from 'lucide-react'
import { MembershipPaymentButton } from '@/components/membership-payment-button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { MEMBERSHIP_IMPORTE } from '@/lib/club'
import { getPrivateUserStatus } from '@/lib/private-app'

export default async function PortalSocioPage() {
  const user = await requireUser()
  const status = await getPrivateUserStatus(user.id)

  return (
    <PrivatePageContainer
      title="Portal Socio"
      description="Gestiona tu cuota de socio del Club Deportivo Santiponce."
    >
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/85 to-card p-6 shadow-sm backdrop-blur sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {status.isPaidSocio ? (
                <CheckCircle2 className="size-6" aria-hidden="true" />
              ) : (
                <CreditCard className="size-6" aria-hidden="true" />
              )}
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">
              Zona de socios
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">
              {status.isPaidSocio ? 'Tu cuota de socio está activa' : 'Completa tu cuota de socio'}
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              {status.isPaidSocio
                ? 'Tu membresía ya está confirmada para esta temporada.'
                : `Realiza el pago de ${MEMBERSHIP_IMPORTE}€ para activar tu membresía de socio.`}
            </p>
          </div>

          {status.isPaidSocio ? (
            <Button nativeButton={false} render={<Link href="/app" />}>
              Volver al inicio
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <MembershipPaymentButton />
          )}
        </div>
      </section>
    </PrivatePageContainer>
  )
}
