import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function ConfigurarPagoExitoPage() {
  return (
    <PrivatePageContainer
      title="Tarjeta enviada"
      description="Estamos terminando de guardar tu método de pago."
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 size-7 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">Tu tarjeta se está configurando</h2>
            <p className="mt-2 text-sm text-emerald-800">
              En unos instantes quedará disponible para futuros cargos autorizados en tu cuenta.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/app/perfil" />}>
            Ir a mi perfil
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/app" />}>
            Volver al panel
          </Button>
        </div>
      </section>
    </PrivatePageContainer>
  )
}
