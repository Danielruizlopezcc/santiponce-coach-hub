import { redirect } from 'next/navigation'
import { SetupPaymentMethodButton } from '@/components/setup-payment-method-button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateTutorProfile, getPrivateUserStatus } from '@/lib/private-app'

export default async function ConfigurarPagoPage() {
  const user = await requireUser()
  const [status, profile] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateTutorProfile(user.id),
  ])

  if (!status.hasGuardian) {
    redirect('/app')
  }

  return (
    <PrivatePageContainer
      title="Configurar método de pago"
      description="Guarda tu tarjeta de forma segura para futuros cargos autorizados."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_360px]">
        <section className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Siguiente paso
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground">
            Vas a registrar tu tarjeta para futuros cargos
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            Tu tarjeta se guardará de forma segura para que el club pueda utilizarla en
            futuros cargos autorizados, como cuotas o renovaciones. Los datos sensibles
            no se almacenan en la plataforma y podrás actualizar este método más adelante.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-background/70 p-5">
            <p className="text-sm font-semibold text-foreground">Qué ocurrirá al continuar</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <li>Se abrirá una pasarela de pago segura.</li>
              <li>Tu tarjeta quedará preparada para futuros cargos autorizados.</li>
              <li>Podrás volver al panel cuando termine el proceso.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <SetupPaymentMethodButton className="w-full max-w-sm" label="Continuar y guardar tarjeta" />
          </div>
        </section>

        <aside className="rounded-3xl border border-border bg-primary/10 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Estado actual
          </p>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border bg-background/80 p-4">
              <p className="font-medium text-foreground">Método de pago</p>
              <p className="mt-1">{profile?.metodoPago.estado ?? 'Pendiente de configurar'}</p>
              {profile?.metodoPago.detalle && (
                <p className="mt-2 text-xs">{profile.metodoPago.detalle}</p>
              )}
            </div>
            <p>
              Si prefieres terminarlo más tarde, podrás volver a esta configuración desde tu perfil.
            </p>
          </div>
        </aside>
      </div>
    </PrivatePageContainer>
  )
}
