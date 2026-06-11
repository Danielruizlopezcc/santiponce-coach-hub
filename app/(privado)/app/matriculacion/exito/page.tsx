import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'

export default function MatriculacionExitoPage() {
  return (
    <PrivatePageContainer
      title="Solicitud enviada"
      description="Esta pantalla representa la continuación visual tras iniciar el pago."
    >
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 size-7 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">Matriculación iniciada</h2>
            <p className="mt-2 text-sm text-emerald-800">
              La matrícula es individual por deportista. La confirmación definitiva del pago se
              realizará de forma segura cuando Stripe notifique el pago al sistema.
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Esta pantalla todavía no realiza pagos reales.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/app/matriculacion" />}>
            Volver a matriculación
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/app/deportistas" />}
          >
            Ir a mis deportistas
          </Button>
        </div>
      </section>
    </PrivatePageContainer>
  )
}
