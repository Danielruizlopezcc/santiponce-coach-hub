'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Search, X } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { AdminAthleteRow, AdminCategoryRow } from '@/lib/admin-app'
import { updateAthleteRequestedCategoryAction } from './actions'

const ESTADO_STYLES: Record<AdminAthleteRow['estadoMatricula'], string> = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

const STATUS_FILTERS: AdminAthleteRow['estadoMatricula'][] = [
  'Pendiente',
  'En revisión',
  'Matriculado',
]

type Props = {
  athletes: AdminAthleteRow[]
  categories: AdminCategoryRow[]
}

export function DeportistasClient({ athletes, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminAthleteRow['estadoMatricula'] | ''>('')
  const [draftCategories, setDraftCategories] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const activeCategories = categories.filter((category) => category.estado === 'Activa')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return athletes.filter((athlete) => {
      if (statusFilter && athlete.estadoMatricula !== statusFilter) return false
      if (!q) return true

      return [
        athlete.nombre,
        athlete.tutor,
        athlete.categoriaSolicitada,
        athlete.equipoAsignado,
        athlete.temporada,
        athlete.estadoMatricula,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [athletes, search, statusFilter])

  const hasActiveFilters = search.trim() !== '' || statusFilter !== ''

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
  }

  function getSelectedCategory(athlete: AdminAthleteRow) {
    return draftCategories[athlete.id] ?? athlete.categoriaSolicitadaId
  }

  function handleSave(athlete: AdminAthleteRow) {
    const categoryId = getSelectedCategory(athlete)
    if (!categoryId || categoryId === athlete.categoriaSolicitadaId) return

    setSavingId(athlete.id)
    setActionError(null)

    startTransition(async () => {
      try {
        await updateAthleteRequestedCategoryAction(athlete.id, categoryId)
        setDraftCategories((current) => {
          const next = { ...current }
          delete next[athlete.id]
          return next
        })
        router.refresh()
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al actualizar la categoría.')
      } finally {
        setSavingId(null)
      }
    })
  }

  return (
    <PageContainer
      title="Deportistas"
      description="Listado visual de deportistas, categoría solicitada y estado de matrícula."
      className="max-w-7xl"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {athletes.length} deportista{athletes.length !== 1 ? 's' : ''}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {activeCategories.length} categoría{activeCategories.length !== 1 ? 's' : ''} activa{activeCategories.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar por deportista, tutor o categoría"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted-foreground">Estado:</span>
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter((current) => (current === status ? '' : status))}
              aria-pressed={statusFilter === status}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      )}

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length === athletes.length
          ? `${athletes.length} registro${athletes.length !== 1 ? 's' : ''}`
          : `${filtered.length} de ${athletes.length} registros`}
      </p>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nombre</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Tutor</th>
              <th className="min-w-48 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Categoría solicitada</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">Equipo asignado</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">Temporada</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay deportistas que coincidan con la búsqueda.
                </td>
              </tr>
            )}

            {filtered.map((athlete) => {
              const selectedCategory = getSelectedCategory(athlete)
              const hasChanged = selectedCategory !== athlete.categoriaSolicitadaId
              const isSaving = savingId === athlete.id && isPending

              return (
                <tr key={athlete.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{athlete.nombre}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{athlete.tutor}</td>
                  <td className="px-4 py-3">
                    <select
                      value={selectedCategory}
                      onChange={(event) =>
                        setDraftCategories((current) => ({
                          ...current,
                          [athlete.id]: event.target.value,
                        }))
                      }
                      className="h-9 w-full min-w-44 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Categoría solicitada de ${athlete.nombre}`}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nombre}
                          {category.estado !== 'Activa' ? ' (inactiva)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{athlete.equipoAsignado}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{athlete.temporada}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLES[athlete.estadoMatricula])}>
                      {athlete.estadoMatricula}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={hasChanged ? 'default' : 'outline'}
                      disabled={!hasChanged || isSaving}
                      onClick={() => handleSave(athlete)}
                    >
                      {isSaving ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="size-3.5" aria-hidden="true" />
                      )}
                      Guardar
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
}
