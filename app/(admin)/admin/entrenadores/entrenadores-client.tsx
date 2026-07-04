'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminCoachRow, AdminCoachTeamOption } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createCoachAction, deleteCoachAction, type CoachActionState, updateCoachAction } from './actions'

type Props = {
  coaches: AdminCoachRow[]
  teams: AdminCoachTeamOption[]
}

const initialState: CoachActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: CoachActionState }) {
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

export function CoachesClient({ coaches, teams = [] }: Props) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    teamId: '',
  })
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

  function getCoachTeamId(coach: AdminCoachRow) {
    return teams.find((team) => team.nombre.split(' · ')[0] === coach.equipo)?.id ?? ''
  }

  function openEdit(coach: AdminCoachRow) {
    const [nombre, ...apellidos] = coach.nombre.split(' ')
    setDeleteId(null)
    setActionError(null)
    setEditId(coach.id)
    setDraft({
      nombre: nombre ?? '',
      apellidos: apellidos.join(' '),
      email: coach.email,
      teamId: getCoachTeamId(coach),
    })
  }

  function handleSave() {
    if (!editId) return
    setActionError(null)
    startTransition(async () => {
      try {
        await updateCoachAction({
          coachId: editId,
          nombre: draft.nombre,
          apellidos: draft.apellidos,
          email: draft.email,
          teamId: draft.teamId || undefined,
        })
        setEditId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al actualizar el entrenador.')
      }
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteCoachAction(id)
        setDeleteId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al eliminar el entrenador.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
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

      <AdminFormDialog
        open={Boolean(editId)}
        onOpenChange={(open) => {
          if (!open) setEditId(null)
        }}
        title="Editar entrenador"
        description="Actualiza los datos de acceso y el equipo asignado."
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditId(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={draft.nombre}
              onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Nombre"
            />
            <Input
              value={draft.apellidos}
              onChange={(event) => setDraft((current) => ({ ...current, apellidos: event.target.value }))}
              placeholder="Apellidos"
            />
          </div>
          <Input
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            type="email"
            placeholder="Email"
          />
          <div>
            <label htmlFor="edit-coach-team" className="text-sm font-black text-foreground">
              Equipo asignado
            </label>
            <select
              id="edit-coach-team"
              value={draft.teamId}
              onChange={(event) => setDraft((current) => ({ ...current, teamId: event.target.value }))}
              className="mt-2 h-9 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Sin equipo asignado</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
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
              <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
                <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Nombre</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 md:table-cell">Email</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 lg:table-cell">Equipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Rol</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 sm:table-cell">Estado</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 xl:table-cell">Alta</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold text-blue-950">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleCoaches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <X className="size-8 opacity-30" aria-hidden="true" />
                      <p className="text-sm font-medium">Sin entrenadores</p>
                      <p className="text-xs">No hay entrenadores con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCoaches.map((coach) => {
                  const isDeleting = deleteId === coach.id

                  return (
                    <tr key={coach.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                      <td className="px-4 py-3 font-semibold text-foreground">{coach.nombre}</td>
                      <td className="hidden px-4 py-3 md:table-cell">{coach.email}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">{coach.equipo}</td>
                      <td className="px-4 py-3">{coach.rol}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">{coach.estado}</td>
                      <td className="hidden px-4 py-3 xl:table-cell">{coach.fechaAlta}</td>
                      <td className="px-4 py-3 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(coach.id)}>
                              Sí, eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" aria-label="Editar entrenador" onClick={() => openEdit(coach)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="destructive"
                              aria-label="Eliminar entrenador"
                              onClick={() => {
                                setEditId(null)
                                setDeleteId(coach.id)
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminErrorDialog
        message={state.message && !state.ok ? state.message : actionError}
        onClose={() => setActionError(null)}
      />
    </div>
  )
}
