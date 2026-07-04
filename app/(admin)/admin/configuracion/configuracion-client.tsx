'use client'

import { useActionState, useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Save, Settings2 } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminConfigData } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  updateActiveSeasonAction,
  updateAdminSettingsAction,
  type AdminSettingsActionState,
} from './actions'

const initialState: AdminSettingsActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: AdminSettingsActionState }) {
  if (!state.message || !state.ok) return null
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-semibold',
        state.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      )}
    >
      {state.message}
    </p>
  )
}

export function ConfiguracionClient({ data }: { data: AdminConfigData }) {
  const [state, action, pending] = useActionState(updateAdminSettingsAction, initialState)
  const [activeSeasonId, setActiveSeasonId] = useState(data.activeSeasonId)
  const [seasonMessage, setSeasonMessage] = useState<string | null>(null)
  const [seasonError, setSeasonError] = useState<string | null>(null)
  const [isSeasonPending, startSeasonTransition] = useTransition()

  function handleActiveSeasonSave() {
    setSeasonMessage(null)
    setSeasonError(null)
    startSeasonTransition(async () => {
      try {
        await updateActiveSeasonAction({ seasonId: activeSeasonId })
        setSeasonMessage('Temporada activa actualizada.')
      } catch (error) {
        setSeasonError(error instanceof Error ? error.message : 'No se ha podido actualizar la temporada.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.summary.map((item) => (
          <section key={item.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">{item.titulo}</h2>
                <p className="mt-1 text-2xl font-bold text-foreground">{item.valor}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.descripcion}</p>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Ajustes generales</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Datos visibles del club, cuotas base y estado del registro.
            </p>
          </div>
          <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
        </div>

        <form action={action} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Nombre corto
              <Input name="clubShortName" defaultValue={data.settings.clubShortName} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Nombre legal
              <Input name="clubLegalName" defaultValue={data.settings.clubLegalName} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Temporada visible
              <Input name="seasonLabel" defaultValue={data.settings.seasonLabel} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Email de contacto
              <Input name="contactEmail" type="email" defaultValue={data.settings.contactEmail} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Cuota socio
              <Input
                name="membershipFeeEuros"
                type="number"
                min="0"
                step="0.01"
                defaultValue={data.settings.membershipFeeEuros}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Importe matrícula
              <Input
                name="enrollmentFeeEuros"
                type="number"
                min="0"
                step="0.01"
                defaultValue={data.settings.enrollmentFeeEuros}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Teléfono de contacto
              <Input name="contactPhone" defaultValue={data.settings.contactPhone} />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
              <input
                name="registrationOpen"
                type="checkbox"
                defaultChecked={data.settings.registrationOpen}
                className="size-4"
              />
              Registro público abierto
            </label>
          </div>

          <FormMessage state={state} />

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar configuración
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-black text-foreground">Temporada activa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define qué temporada se usa por defecto en altas, equipos y paneles.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-72 flex-1 gap-2 text-sm font-semibold text-foreground">
            Temporada
            <select
              value={activeSeasonId}
              onChange={(event) => setActiveSeasonId(event.target.value)}
              className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {data.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.nombre}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled={isSeasonPending || !activeSeasonId} onClick={handleActiveSeasonSave}>
            {isSeasonPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar temporada
          </Button>
        </div>
        {seasonMessage ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground">{seasonMessage}</p>
        ) : null}
      </section>

      <AdminErrorDialog
        message={(state.message && !state.ok ? state.message : null) ?? seasonError}
        onClose={() => setSeasonError(null)}
      />
    </div>
  )
}
