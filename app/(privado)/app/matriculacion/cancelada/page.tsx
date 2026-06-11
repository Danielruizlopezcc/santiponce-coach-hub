import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function MatriculacionCanceladaPage() {
  return (
    <PrivatePageContainer
      title="Pago cancelado"
      description="Vista visual de cancelación del flujo de matrícula."
    >
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-0.5 size-7 text-amber-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-amber-900">La operación se ha cancelado</h2>
            <p className="mt-2 text-sm text-amber-800">
              No se ha confirmado ningún pago desde la interfaz. Puedes volver a intentarlo cuando
              quieras desde la pantalla de matriculación.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/app/matriculacion" />}>
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
