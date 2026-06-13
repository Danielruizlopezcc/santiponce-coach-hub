'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, CreditCard, Loader2, X } from 'lucide-react'
import { createEnrollmentCheckoutAction } from '@/app/(privado)/app/payment-actions'
import { Button } from '@/components/ui/button'
import { formatEuro } from '@/lib/format'
import { type PrivateAthleteDetail } from '@/lib/private-app-shared'
import { cn } from '@/lib/utils'

const ESTADO_STYLES = {
  pendiente: 'bg-amber-100 text-amber-700',
  matriculado: 'bg-emerald-100 text-emerald-700',
  en_revision: 'bg-blue-100 text-blue-700',
} as const

type MatriculacionPanelProps = {
  temporada: string
  importe: number
  deportistas: PrivateAthleteDetail[]
}

function canMatricularDeportista(deportista: PrivateAthleteDetail) {
  return deportista.estado !== 'matriculado'
}

export function MatriculacionPanel({
  temporada,
  importe,
  deportistas,
}: MatriculacionPanelProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const disponibles = deportistas.filter(canMatricularDeportista)

  async function handleContinue() {
    if (!selectedId) return
    setLoading(true)
    setServerError(null)
    const result = await createEnrollmentCheckoutAction(selectedId)
    setLoading(false)
    if (!result.success || !result.url) {
      setServerError(result.message ?? 'No se ha podido iniciar la matriculación.')
      return
    }
    window.location.assign(result.url)
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-foreground">Matriculación</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              La matrícula cuesta {formatEuro(importe)} por deportista para la
              temporada {temporada}.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <li>La matrícula es individual por deportista.</li>
              <li>Al continuar, se abrirá la pasarela de pago segura.</li>
              <li>La matrícula quedará confirmada cuando el pago termine correctamente.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-foreground">Precio visible</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {formatEuro(importe)}
            </p>
            <p className="mt-2 text-muted-foreground">
              El estado de la matrícula se actualizará automáticamente al completar el pago.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setOpen(true)}>Matricular deportista</Button>
          <Button variant="outline" onClick={() => router.push('/app/matriculacion/cancelada')}>
            Ver cancelación
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertCircle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Aviso importante</h3>
            <p className="text-sm text-muted-foreground">
              Si inicias el proceso de pago, la matrícula quedará en revisión hasta recibir la confirmación final.
            </p>
          </div>
        </div>
      </section>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  Seleccionar deportista
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Elige un único deportista para continuar con la matrícula.
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar" />}
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {deportistas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="font-medium text-foreground">No hay deportistas disponibles.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cuando registres deportistas, aparecerán aquí para matricularlos.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {deportistas.map((deportista) => {
                    const disabled = !canMatricularDeportista(deportista)
                    return (
                      <label
                        key={deportista.id}
                        className={cn(
                          'grid gap-3 rounded-2xl border p-4 transition-colors',
                          disabled
                            ? 'cursor-not-allowed border-border bg-muted/20 opacity-70'
                            : 'cursor-pointer border-border bg-card hover:border-primary/40 hover:bg-primary/5',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="deportista"
                                value={deportista.id}
                                checked={selectedId === deportista.id}
                                onChange={() => setSelectedId(deportista.id)}
                                disabled={disabled}
                                className="size-4 accent-[var(--primary)]"
                              />
                              <span className="font-semibold text-foreground">
                                {deportista.nombre} {deportista.apellidos}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Categoría solicitada: {deportista.categoriaSolicitada}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Equipo asignado: {deportista.equipoAsignado ?? 'Sin equipo asignado'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              ESTADO_STYLES[deportista.estado],
                            )}
                          >
                            {deportista.estado === 'en_revision'
                              ? 'En revisión'
                              : deportista.estado === 'matriculado'
                                ? 'Matriculado'
                                : 'Pendiente'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                          <span className="inline-flex items-center gap-2 text-foreground">
                            <CreditCard className="size-4 text-primary" aria-hidden="true" />
                            Precio: {formatEuro(importe)}
                          </span>
                          {disabled ? (
                            <span className="inline-flex items-center gap-2 text-emerald-700">
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                              Matrícula ya registrada
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Disponible para matricular</span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
              <p className="text-sm text-muted-foreground">
                El estado del pago se guardará automáticamente al continuar.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedId || loading || disponibles.length === 0}
                >
                  {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Continuar al pago
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
