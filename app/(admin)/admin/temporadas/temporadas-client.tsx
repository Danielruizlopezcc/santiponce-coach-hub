'use client'

import { useState, useTransition } from 'react'
import { Pencil, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminSeasonRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { deleteSeasonAction, updateSeasonAction } from './actions'

export function TemporadasClient({ seasons }: { seasons: AdminSeasonRow[] }) {
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
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
    setDeleteId(null)
    setEditId(season.id)
    setForm({
      nombre: season.nombre,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      isActive: season.isActive,
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
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {seasons.length} temporadas
        </span>
      </div>

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

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Fecha inicio</th>
              <th className="px-4 py-2.5">Fecha fin</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.map((season) => {
              const isEditing = editId === season.id
              const isDeleting = deleteId === season.id

              return (
                <tr key={season.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input value={form.nombre} onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))} />
                    ) : (
                      season.nombre
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input type="date" value={form.startsAt} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))} />
                    ) : (
                      season.fechaInicio
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input type="date" value={form.endsAt} onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))} />
                    ) : (
                      season.fechaFin
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <label className="flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                        />
                        Activa
                      </label>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {season.estado}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={isPending} onClick={() => handleSave(season.id)}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : isDeleting ? (
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
    </div>
  )
}
