'use client'

import { useActionState, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
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

function ConfigSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ConfigField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('grid gap-2 text-sm font-semibold text-foreground', className)}>
      {label}
      {children}
    </label>
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
          <ConfigSection
            title="Identidad del club"
            description="Nombre visible, denominación legal y temporada que se muestra en el panel."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ConfigField label="Nombre corto">
                <Input name="clubShortName" defaultValue={data.settings.clubShortName} required />
              </ConfigField>
              <ConfigField label="Nombre legal">
                <Input name="clubLegalName" defaultValue={data.settings.clubLegalName} required />
              </ConfigField>
              <ConfigField label="Temporada visible">
                <Input name="seasonLabel" defaultValue={data.settings.seasonLabel} required />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Contacto"
            description="Datos que usa el club para comunicaciones y referencias públicas."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ConfigField label="Email de contacto">
                <Input name="contactEmail" type="email" defaultValue={data.settings.contactEmail} />
              </ConfigField>
              <ConfigField label="Teléfono de contacto">
                <Input name="contactPhone" defaultValue={data.settings.contactPhone} />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Datos fiscales"
            description="Identificación legal del club para recibos, facturas y trámites administrativos."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ConfigField label="CIF / NIF">
                <Input name="clubTaxId" placeholder="Ej. G12345678" defaultValue={data.settings.clubTaxId} />
              </ConfigField>
              <ConfigField label="Nº de registro de entidad deportiva">
                <Input name="clubRegistryNumber" placeholder="Ej. RAD/12345" defaultValue={data.settings.clubRegistryNumber} />
              </ConfigField>
              <ConfigField label="Dirección fiscal" className="md:col-span-2">
                <Input
                  name="clubFiscalAddress"
                  placeholder="Calle, número, código postal, ciudad, provincia"
                  defaultValue={data.settings.clubFiscalAddress}
                />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Cuotas base"
            description="Importes generales que sirven como referencia administrativa."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ConfigField label="Cuota socio">
                <Input
                  name="membershipFeeEuros"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={data.settings.membershipFeeEuros}
                  required
                />
              </ConfigField>
              <ConfigField label="Importe matrícula">
                <Input
                  name="enrollmentFeeEuros"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={data.settings.enrollmentFeeEuros}
                  required
                />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection
            title="Registro público"
            description="Controla si las familias pueden iniciar nuevas solicitudes desde la web."
          >
            <label className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm font-semibold">
              <input
                name="registrationOpen"
                type="checkbox"
                defaultChecked={data.settings.registrationOpen}
                className="mt-0.5 size-4"
              />
              <span>
                <span className="block font-black text-foreground">Registro público abierto</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">
                  Si está activo, las familias pueden iniciar altas desde el formulario público.
                </span>
              </span>
            </label>
          </ConfigSection>

          <FormMessage state={state} />

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar configuración
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Temporadas</p>
            <h2 className="mt-1 text-lg font-black text-foreground">Temporada activa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define qué temporada se usa por defecto en altas, equipos y paneles.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            {data.seasons.length} disponibles
          </span>
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
