import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function ConfigurarPagoCanceladaPage() {
  return (
    <PrivatePageContainer
      title="Configuración cancelada"
      description="No se ha guardado ningún método de pago."
    >
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-0.5 size-7 text-amber-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-amber-900">No se ha completado el proceso</h2>
            <p className="mt-2 text-sm text-amber-800">
              Puedes volver a intentarlo cuando quieras desde esta sección o desde tu perfil.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/app/configurar-pago" />}>
            Intentar de nuevo
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/app" />}>
            Volver al panel
          </Button>
        </div>
      </section>
    </PrivatePageContainer>
  )
}
