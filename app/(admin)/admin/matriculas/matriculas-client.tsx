'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import { formatEuro } from '@/lib/format'
import type { AdminEnrollmentRow } from '@/lib/admin-app'
import { confirmPaymentAction, rejectEnrollmentAction } from './actions'

const ESTADO_STYLES: Record<AdminEnrollmentRow['estadoMatricula'], string> = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

export function MatriculasClient({ enrollments }: { enrollments: AdminEnrollmentRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch]                   = useState('')
  const [confirmId, setConfirmId]             = useState<string | null>(null)
  const [rejectId, setRejectId]               = useState<string | null>(null)
  const [actionError, setActionError]         = useState<string | null>(null)

  const filtered = search.trim()
    ? enrollments.filter((e) => {
        const q = search.toLowerCase()
        return (
          e.deportista.toLowerCase().includes(q) ||
          e.tutor.toLowerCase().includes(q) ||
          e.temporada.toLowerCase().includes(q)
        )
      })
    : enrollments

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

  return (
    <PageContainer
      title="Matrículas"
      description="Supervisa el estado de cada matrícula y usa acciones manuales solo en incidencias."
      className="max-w-7xl"
    >
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

      {/* ── Buscador ────────────────────────────────────────────── */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar por deportista, tutor o temporada…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="outline" size="sm" onClick={() => setSearch('')} className="gap-1.5 text-muted-foreground">
            <X className="size-3.5" aria-hidden="true" />
            Limpiar
          </Button>
        )}
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
                    {!isConfirming && !isRejecting && (
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
    </PageContainer>
  )
}
