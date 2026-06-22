'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Pencil, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import { formatEuro } from '@/lib/format'
import type { AdminEnrollmentRow } from '@/lib/admin-app'
import {
  confirmPaymentAction,
  deleteEnrollmentAction,
  rejectEnrollmentAction,
  updateEnrollmentStatusAction,
} from './actions'

const ESTADO_STYLES: Record<AdminEnrollmentRow['estadoMatricula'], string> = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

type MatriculasClientProps = {
  enrollments: AdminEnrollmentRow[]
  embedded?: boolean
}

export function MatriculasClient({ enrollments, embedded = false }: MatriculasClientProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch]                   = useState('')
  const [statusFilter, setStatusFilter]       = useState<'todos' | AdminEnrollmentRow['estadoMatricula']>('todos')
  const [paymentFilter, setPaymentFilter]     = useState<'todos' | AdminEnrollmentRow['estadoPago']>('todos')
  const [seasonFilter, setSeasonFilter]       = useState('todos')
  const [confirmId, setConfirmId]             = useState<string | null>(null)
  const [rejectId, setRejectId]               = useState<string | null>(null)
  const [editId, setEditId]                   = useState<string | null>(null)
  const [deleteId, setDeleteId]               = useState<string | null>(null)
  const [editStatus, setEditStatus]           = useState<'pendiente' | 'matriculado' | 'en_revision'>('pendiente')
  const [actionError, setActionError]         = useState<string | null>(null)

  const seasons = Array.from(new Set(enrollments.map((enrollment) => enrollment.temporada))).sort((a, b) => a.localeCompare(b, 'es'))
  const hasFilters = Boolean(search.trim()) || statusFilter !== 'todos' || paymentFilter !== 'todos' || seasonFilter !== 'todos'
  const filtered = enrollments.filter((e) => {
    if (statusFilter !== 'todos' && e.estadoMatricula !== statusFilter) return false
    if (paymentFilter !== 'todos' && e.estadoPago !== paymentFilter) return false
    if (seasonFilter !== 'todos' && e.temporada !== seasonFilter) return false

    const q = search.trim().toLowerCase()
    if (!q) return true

    return [e.deportista, e.tutor, e.temporada, e.estadoMatricula, e.estadoPago, formatEuro(e.importe)]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })

  const enRevision = enrollments.filter((e) => e.estadoMatricula === 'En revisión').length
  const matriculados = enrollments.filter((e) => e.estadoMatricula === 'Matriculado').length

  function handleConfirm(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await confirmPaymentAction(id)
        setConfirmId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al confirmar el pago.')
      }
    })
  }

  function handleReject(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await rejectEnrollmentAction(id)
        setRejectId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al rechazar la matrícula.')
      }
    })
  }

  function handleUpdateStatus(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await updateEnrollmentStatusAction(id, editStatus)
        setEditId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al editar la matrícula.')
      }
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteEnrollmentAction(id)
        setDeleteId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al eliminar la matrícula.')
      }
    })
  }

  function openEdit(row: AdminEnrollmentRow) {
    setConfirmId(null)
    setRejectId(null)
    setDeleteId(null)
    setEditId(row.id)
    setEditStatus(
      row.estadoMatricula === 'Matriculado'
        ? 'matriculado'
        : row.estadoMatricula === 'En revisión'
          ? 'en_revision'
          : 'pendiente',
    )
  }

  const content = (
    <>
      {/* ── Resumen rápido ───────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {enrollments.length} {enrollments.length === 1 ? 'deportista' : 'deportistas'}
        </span>
        {enRevision > 0 && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {enRevision} en revisión
          </span>
        )}
        {matriculados > 0 && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {matriculados} matriculado{matriculados !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Buscador y filtros ──────────────────────────────────── */}
      <div className="mb-4 space-y-3 rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar por deportista, tutor, temporada, estado o importe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('todos')
                setPaymentFilter('todos')
                setSeasonFilter('todos')
              }}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En revisión">En revisión</option>
            <option value="Matriculado">Matriculado</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="todos">Todos los pagos</option>
            <option value="Pendiente">Pago pendiente</option>
            <option value="Pagado">Pago pagado</option>
          </select>
          <select
            value={seasonFilter}
            onChange={(event) => setSeasonFilter(event.target.value)}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="todos">Todas las temporadas</option>
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      )}

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length === enrollments.length
          ? `${enrollments.length} registro${enrollments.length !== 1 ? 's' : ''}`
          : `${filtered.length} de ${enrollments.length} registros`}
      </p>

      {/* ── Tabla ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Deportista</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Tutor</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">Temporada</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Importe</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay matrículas que coincidan con la búsqueda.
                </td>
              </tr>
            )}

            {filtered.map((row) => {
              const isConfirming = confirmId === row.id
              const isRejecting  = rejectId  === row.id
              const isEditing    = editId    === row.id
              const isDeleting   = deleteId  === row.id
              const canAct       = row.estadoMatricula === 'En revisión'

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    isConfirming && 'bg-emerald-50',
                    isRejecting  && 'bg-destructive/5',
                  )}
                >
                  <td className="px-4 py-3 font-medium">{row.deportista}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{row.tutor}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{row.temporada}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLES[row.estadoMatricula])}>
                      {row.estadoMatricula}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{formatEuro(row.importe)}</td>
                  <td className="px-4 py-3 text-right">

                    {/* Confirmación de pago */}
                    {isConfirming && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Marcar como cobro validado?</span>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending} onClick={() => handleConfirm(row.id)}>
                          Sí, validar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {/* Confirmación de rechazo */}
                    {isRejecting && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Cancelar el intento y devolver a pendiente?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleReject(row.id)}>
                          Sí, devolver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {/* Acciones normales */}
                    {isEditing && (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={editStatus}
                          onChange={(event) => setEditStatus(event.target.value as typeof editStatus)}
                          className="h-7 rounded-lg border border-input bg-white px-2 text-xs"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_revision">En revisión</option>
                          <option value="matriculado">Matriculado</option>
                        </select>
                        <Button size="sm" disabled={isPending} onClick={() => handleUpdateStatus(row.id)}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {isDeleting && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(row.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}

                    {!isConfirming && !isRejecting && !isEditing && !isDeleting && (
                      <div className="flex items-center justify-end gap-1">
                        {row.estadoMatricula === 'Matriculado' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Pagado
                          </span>
                        )}
                        {canAct && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => { setRejectId(null); setConfirmId(row.id) }}
                            >
                              Validar manualmente
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => { setConfirmId(null); setRejectId(row.id) }}
                            >
                              Devolver a pendiente
                            </Button>
                          </>
                        )}
                        <Button size="icon-sm" variant="ghost" aria-label="Editar matrícula" onClick={() => openEdit(row)}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          aria-label="Eliminar matrícula"
                          onClick={() => { setConfirmId(null); setRejectId(null); setEditId(null); setDeleteId(row.id) }}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                        {row.estadoMatricula === 'Pendiente' && (
                          <span className="text-xs text-muted-foreground">Sin iniciar checkout</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <PageContainer
      title="Matrículas"
      description="Supervisa el estado de cada matrícula y usa acciones manuales solo en incidencias."
      className="max-w-7xl"
    >
      {content}
    </PageContainer>
  )
}
