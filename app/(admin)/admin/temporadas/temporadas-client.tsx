'use client'

import { useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { CalendarDays, CheckCircle2, Clock, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminSeasonRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createSeasonAction, deleteSeasonAction, updateSeasonAction } from './actions'

function SeasonFormSection({
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
          <CalendarDays className="size-5" aria-hidden="true" />
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

function SeasonField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-foreground">
      {label}
      {children}
    </label>
  )
}

export function TemporadasClient({ seasons }: { seasons: AdminSeasonRow[] }) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    startsAt: '',
    endsAt: '',
    isActive: false,
  })
  const [createForm, setCreateForm] = useState({
    nombre: '',
    startsAt: '',
    endsAt: '',
    isActive: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = search.trim()
    ? seasons.filter((season) => {
        const q = search.toLowerCase()
        return [season.nombre, season.fechaInicio, season.fechaFin, season.estado].join(' ').toLowerCase().includes(q)
      })
    : seasons
  const activeCount = seasons.filter((season) => season.isActive).length
  const futureCount = seasons.filter((season) => season.estado === 'Planificada').length
  const closedCount = seasons.filter((season) => season.estado === 'Cerrada').length

  function openEdit(season: AdminSeasonRow) {
    setShowCreate(false)
    setDeleteId(null)
    setEditId(season.id)
    setForm({
      nombre: season.nombre,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      isActive: season.isActive,
    })
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      try {
        await createSeasonAction(createForm)
        setCreateForm({
          nombre: '',
          startsAt: '',
          endsAt: '',
          isActive: false,
        })
        setShowCreate(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se ha podido crear la temporada.')
      }
    })
  }

  function handleSave(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateSeasonAction({ id, ...form })
        setEditId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se ha podido editar la temporada.')
      }
    })
  }

  function handleDelete(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteSeasonAction(id)
        setDeleteId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se ha podido eliminar la temporada.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Calendario de club</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Temporadas deportivas</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Controla el periodo activo que usan equipos, altas, calendario y paneles administrativos.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditId(null)
              setDeleteId(null)
              setShowCreate(true)
            }}
          >
            <Plus className="size-4" />
            Añadir temporada
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Total</p>
            <p className="mt-2 text-3xl font-black text-primary">{seasons.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Temporadas registradas</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Activa</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{activeCount}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Usada por defecto</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700/70">Próximas</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{futureCount}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Pendientes de inicio</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700/70">Finalizadas</p>
            <p className="mt-2 text-3xl font-black text-slate-700">{closedCount}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Histórico</p>
          </div>
        </div>
      </div>

      <AdminFormDialog
        open={showCreate || Boolean(editId)}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) setEditId(null)
        }}
        title={editId ? 'Editar temporada' : 'Crear temporada'}
        description={editId ? 'Actualiza las fechas y el estado de la temporada.' : 'Crea una nueva temporada para el club.'}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditId(null) }}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => editId ? handleSave(editId) : handleCreate()}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : editId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {editId ? 'Guardar cambios' : 'Crear temporada'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SeasonFormSection
            title="Datos básicos"
            description="Nombre con el que se identificará la temporada en paneles, equipos y altas."
          >
            <SeasonField label="Nombre">
              <Input
                id="season-name"
                value={editId ? form.nombre : createForm.nombre}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, nombre: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
                placeholder="Temporada 2027/2028"
              />
            </SeasonField>
          </SeasonFormSection>

          <SeasonFormSection
            title="Periodo deportivo"
            description="Fechas que delimitan la actividad de la temporada."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SeasonField label="Fecha inicio">
              <Input
                id="season-start"
                type="date"
                value={editId ? form.startsAt : createForm.startsAt}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              />
              </SeasonField>
              <SeasonField label="Fecha fin">
              <Input
                id="season-end"
                type="date"
                value={editId ? form.endsAt : createForm.endsAt}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              />
              </SeasonField>
            </div>
          </SeasonFormSection>

          <SeasonFormSection
            title="Activación"
            description="Solo una temporada activa se usa por defecto en el panel."
          >
          <label className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editId ? form.isActive : createForm.isActive}
              onChange={(event) => editId
                ? setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                : setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="mt-0.5 size-4"
            />
            <span>
              <span className="block font-black text-foreground">Marcar como temporada activa</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">
                Al activarla, esta temporada pasará a ser la referencia principal para altas y gestión deportiva.
              </span>
            </span>
          </label>
          </SeasonFormSection>
        </div>
      </AdminFormDialog>

      <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Listado de temporadas</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{filtered.length} visibles según filtros</p>
          </div>
          <div className="flex min-w-72 flex-1 gap-2 md:max-w-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar temporada" className="pl-9" />
            </div>
            {search ? (
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                <X className="size-3.5" />
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <X className="size-8 opacity-30" aria-hidden="true" />
                <p className="text-sm font-medium">Sin temporadas</p>
                <p className="text-xs">No hay temporadas con los filtros actuales.</p>
              </div>
            </div>
          ) : null}
          {filtered.map((season) => {
            const isDeleting = deleteId === season.id
            const statusTone = season.isActive
              ? 'bg-emerald-100 text-emerald-700'
              : season.estado === 'Planificada'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700'

            return (
              <article key={season.id} className={cn('rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-50/20', isDeleting && 'border-destructive/30 bg-destructive/5')}>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black', statusTone)}>
                        {season.isActive ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                        {season.estado}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {season.isActive ? 'Temporada por defecto' : 'Disponible'}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-black text-foreground">{season.nombre}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      Periodo deportivo usado para equipos, altas y actividad del club.
                    </p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Inicio</p>
                        <p className="mt-1 font-semibold text-foreground">{season.fechaInicio}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Fin</p>
                        <p className="mt-1 font-semibold text-foreground">{season.fechaFin}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Calendario</p>
                        <p className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground">
                          <CalendarDays className="size-3.5" />
                          {season.startsAt} / {season.endsAt}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {isDeleting ? (
                      <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg bg-rose-50 p-2 lg:justify-end">
                        <span className="text-xs font-semibold text-rose-700">¿Eliminar temporada?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(season.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="icon-sm" variant="ghost" aria-label="Editar temporada" onClick={() => openEdit(season)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Eliminar temporada" onClick={() => { setEditId(null); setDeleteId(season.id) }}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <AdminErrorDialog message={error} onClose={() => setError(null)} />
    </div>
  )
}
