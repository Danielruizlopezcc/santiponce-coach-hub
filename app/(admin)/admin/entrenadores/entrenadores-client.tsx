'use client'

import { useActionState, useMemo, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Plus, Search, X } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminCoachRow, AdminCoachTeamOption } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createCoachAction, type CoachActionState } from './actions'

type Props = {
  coaches: AdminCoachRow[]
  teams: AdminCoachTeamOption[]
}

const initialState: CoachActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: CoachActionState }) {
  if (!state.message) return null
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

export function CoachesClient({ coaches, teams = [] }: Props) {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [state, action, pending] = useActionState(createCoachAction, initialState)

  const visibleCoaches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return coaches

    return coaches.filter((coach) =>
      [coach.nombre, coach.email, coach.equipo, coach.rol, coach.estado, coach.fechaAlta]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [coaches, search])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {coaches.length} entrenadores
        </span>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Crear entrenador
        </Button>
      </div>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Crear entrenador"
        description="Crea una cuenta con rol de entrenador. Los privilegios se definirán más adelante."
        maxWidth="md"
      >
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="nombre" placeholder="Nombre" required />
            <Input name="apellidos" placeholder="Apellidos" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Contraseña" minLength={8} required />
          </div>
          <div>
            <label htmlFor="coach-team" className="text-sm font-black text-foreground">
              Equipo asignado
            </label>
            <select
              id="coach-team"
              name="teamId"
              className="mt-2 h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue=""
            >
              <option value="">Sin equipo asignado</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.nombre}
                </option>
              ))}
            </select>
          </div>
          <FormMessage state={state} />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={pending} />}>
              Cancelar
            </Dialog.Close>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear entrenador
            </Button>
          </div>
        </form>
      </AdminFormDialog>

      <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por entrenador, email o estado"
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Email</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">Equipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Rol</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Estado</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground xl:table-cell">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleCoaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <X className="size-8 opacity-30" aria-hidden="true" />
                      <p className="text-sm font-medium">Sin entrenadores</p>
                      <p className="text-xs">No hay entrenadores con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCoaches.map((coach) => (
                  <tr key={coach.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{coach.nombre}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{coach.email}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{coach.equipo}</td>
                    <td className="px-4 py-3">{coach.rol}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{coach.estado}</td>
                    <td className="hidden px-4 py-3 xl:table-cell">{coach.fechaAlta}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
