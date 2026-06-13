import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function PagoSocioExitoPage() {
  return (
    <PrivatePageContainer
      title="Pago enviado"
      description="Hemos recibido tu solicitud y estamos terminando la confirmación."
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 size-7 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">Estamos confirmando tu membresía</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Si el pago se ha completado correctamente, tu cuenta quedará marcada como socio en unos instantes.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/app" />}>
            Volver al panel
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/app/pago-socio" />}>
            Ver estado del pago
          </Button>
        </div>
      </section>
    </PrivatePageContainer>
  )
}
