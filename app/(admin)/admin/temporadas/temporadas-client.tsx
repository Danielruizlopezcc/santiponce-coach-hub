'use client'

import { useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminSeasonRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createSeasonAction, deleteSeasonAction, updateSeasonAction } from './actions'

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-start gap-3">
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
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm font-black text-foreground" htmlFor="season-name">
                Nombre
              </label>
              <Input
                id="season-name"
                value={editId ? form.nombre : createForm.nombre}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, nombre: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, nombre: event.target.value }))}
                placeholder="Temporada 2027/2028"
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-black text-foreground" htmlFor="season-start">
                Fecha inicio
              </label>
              <Input
                id="season-start"
                type="date"
                value={editId ? form.startsAt : createForm.startsAt}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, startsAt: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-black text-foreground" htmlFor="season-end">
                Fecha fin
              </label>
              <Input
                id="season-end"
                type="date"
                value={editId ? form.endsAt : createForm.endsAt}
                onChange={(event) => editId
                  ? setForm((prev) => ({ ...prev, endsAt: event.target.value }))
                  : setCreateForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={editId ? form.isActive : createForm.isActive}
              onChange={(event) => editId
                ? setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                : setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="size-4"
            />
            Marcar como temporada activa
          </label>
      </AdminFormDialog>

      <div className="flex gap-2">
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

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Fecha inicio</th>
              <th className="px-4 py-2.5">Fecha fin</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.map((season) => {
              const isDeleting = deleteId === season.id

              return (
                <tr key={season.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                  <td className="px-4 py-3">
                    {season.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {season.fechaInicio}
                  </td>
                  <td className="px-4 py-3">
                    {season.fechaFin}
                  </td>
                  <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {season.estado}
                      </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isDeleting ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(season.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" aria-label="Editar temporada" onClick={() => openEdit(season)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Eliminar temporada" onClick={() => { setEditId(null); setDeleteId(season.id) }}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AdminErrorDialog message={error} onClose={() => setError(null)} />
    </div>
  )
}
