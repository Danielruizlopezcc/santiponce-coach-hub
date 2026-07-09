'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, CreditCard, Pencil, Search, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
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

const PAGO_STYLES: Record<AdminEnrollmentRow['estadoPago'], string> = {
  Pagado: 'bg-emerald-100 text-emerald-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

type MatriculasClientProps = {
  enrollments: AdminEnrollmentRow[]
  embedded?: boolean
}

function EnrollmentSummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string
  detail: string
  icon: typeof ClipboardList
  tone?: 'blue' | 'green' | 'amber'
}) {
  return (
    <div className="rounded-lg border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
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
  const matriculatedCount = enrollments.filter((enrollment) => enrollment.estadoMatricula === 'Matriculado').length
  const reviewCount = enrollments.filter((enrollment) => enrollment.estadoMatricula === 'En revisión').length
  const pendingCount = enrollments.filter((enrollment) => enrollment.estadoMatricula === 'Pendiente').length
  const paidCount = enrollments.filter((enrollment) => enrollment.estadoPago === 'Pagado').length
  const pendingPaymentCount = enrollments.filter((enrollment) => enrollment.estadoPago === 'Pendiente').length
  const expectedTotal = enrollments.reduce((sum, enrollment) => sum + enrollment.importe, 0)
  const paidTotal = enrollments
    .filter((enrollment) => enrollment.estadoPago === 'Pagado')
    .reduce((sum, enrollment) => sum + enrollment.importe, 0)
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
      <section className="mb-5 space-y-4">
        <div className="rounded-xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            Puente administrativo
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Deportista, tutor y pago en una sola revisión
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
            Esta vista sirve para validar el estado administrativo de cada matrícula. Las cuotas
            periódicas se gestionan en Contabilidad; aquí se revisa la matrícula inicial y
            su estado de pago.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <EnrollmentSummaryCard
            title="Matrículas"
            value={String(enrollments.length)}
            detail={`${matriculatedCount} matriculadas · ${reviewCount} en revisión`}
            icon={ClipboardList}
          />
          <EnrollmentSummaryCard
            title="Pendientes"
            value={String(pendingCount)}
            detail="Deportistas sin checkout iniciado o sin validar"
            icon={AlertTriangle}
            tone="amber"
          />
          <EnrollmentSummaryCard
            title="Pagos"
            value={`${paidCount}/${enrollments.length}`}
            detail={`${pendingPaymentCount} pagos pendientes`}
            icon={CreditCard}
            tone="green"
          />
          <EnrollmentSummaryCard
            title="Importe validado"
            value={formatEuro(paidTotal)}
            detail={`${formatEuro(expectedTotal)} previstos en matrículas`}
            icon={CheckCircle2}
            tone="green"
          />
        </div>
      </section>

      {/* ── Buscador y filtros ──────────────────────────────────── */}
      <div className="mb-4 space-y-3 rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-foreground">Buscar matrículas</p>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {filtered.length} de {enrollments.length}
          </span>
        </div>
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

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white px-4 py-14 text-center text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10">
          No hay matrículas que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((row) => {
            const isConfirming = confirmId === row.id
            const isRejecting  = rejectId  === row.id
            const isEditing    = editId    === row.id
            const isDeleting   = deleteId  === row.id
            const canAct       = row.estadoMatricula === 'En revisión'

            return (
              <article
                key={row.id}
                className={cn(
                  'overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-foreground/10 transition-colors',
                  isConfirming && 'ring-emerald-200',
                  isRejecting && 'bg-destructive/5 ring-destructive/25',
                  isDeleting && 'bg-destructive/5 ring-destructive/25',
                )}
              >
                <div className="bg-primary p-4 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                        Matrícula · {row.temporada}
                      </p>
                      <h3 className="mt-2 truncate text-xl font-black leading-tight">{row.deportista}</h3>
                      <p className="mt-1 truncate text-sm font-semibold text-white/75">{row.tutor}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', ESTADO_STYLES[row.estadoMatricula])}>
                        {row.estadoMatricula}
                      </span>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', PAGO_STYLES[row.estadoPago])}>
                        {row.estadoPago}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-blue-50/70 p-3 ring-1 ring-blue-100">
                      <p className="text-xs font-black uppercase text-muted-foreground">Temporada</p>
                      <p className="mt-2 text-sm font-black text-foreground">{row.temporada}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
                      <p className="text-xs font-black uppercase text-muted-foreground">Importe</p>
                      <p className="mt-2 text-sm font-black text-foreground">{formatEuro(row.importe)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/35 p-3 ring-1 ring-foreground/10">
                      <p className="text-xs font-black uppercase text-muted-foreground">Situación</p>
                      <p className="mt-2 text-sm font-black text-foreground">
                        {row.estadoMatricula === 'Pendiente'
                          ? 'Sin iniciar checkout'
                          : row.estadoMatricula === 'En revisión'
                            ? 'Requiere revisión'
                            : 'Validada'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border pt-3">
                    {isConfirming ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-xs font-semibold text-muted-foreground">¿Marcar como cobro validado?</span>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={isPending} onClick={() => handleConfirm(row.id)}>
                          Sí, validar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : null}

                    {isRejecting ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-xs font-semibold text-muted-foreground">¿Cancelar el intento y devolver a pendiente?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleReject(row.id)}>
                          Sí, devolver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : null}

                    {isEditing ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <select
                          value={editStatus}
                          onChange={(event) => setEditStatus(event.target.value as typeof editStatus)}
                          className="mr-auto h-9 rounded-lg border border-input bg-white px-3 text-xs font-semibold text-foreground"
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
                    ) : null}

                    {isDeleting ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-xs font-semibold text-muted-foreground">¿Eliminar matrícula?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(row.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : null}

                    {!isConfirming && !isRejecting && !isEditing && !isDeleting ? (
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {row.estadoMatricula === 'Matriculado' ? (
                          <span className="mr-auto flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Matrícula cerrada
                          </span>
                        ) : null}
                        {canAct ? (
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
                        ) : null}
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
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AdminErrorDialog message={actionError} onClose={() => setActionError(null)} />
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
