import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'

export default async function PagoSocioPage() {
  await requireUser()

  return (
    <PrivatePageContainer
      title="Pago de membresía"
      description="Activa tu cuenta de socio con el pago de 20€ vía Stripe."
    >
      <div className="space-y-6 rounded-3xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground">Tu registro está listo.</p>
          <p className="text-sm text-muted-foreground">
            Para hacerte socio y completar la cuota de 20€, finaliza el pago de membresía.
            Este flujo todavía está pendiente de integración completa con Stripe.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Paso siguiente</p>
          <p className="mt-2">
            Cuando Stripe esté integrado, aquí podrás completar el pago de tu membresía de forma segura.
          </p>
        </div>

        <Button asChild className="w-full max-w-xs">
          <Link href="/app" className="w-full text-center">
            Volver al panel
          </Link>
        </Button>
      </div>
    </PrivatePageContainer>
  )
}
