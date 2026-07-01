'use client'

import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { AdminAuditLogRow } from '@/lib/admin-app'

type AuditoriaClientProps = {
  logs: AdminAuditLogRow[]
}

const ACTION_LABELS: Record<string, string> = {
  'settings.update': 'Configuración actualizada',
  'season.activate': 'Temporada activada',
  'admin.create': 'Administrador creado',
  'admin.update': 'Administrador actualizado',
  'admin.delete': 'Administrador eliminado',
  'coach.create': 'Entrenador creado',
  'coach.update': 'Entrenador actualizado',
  'coach.delete': 'Entrenador eliminado',
  'tutor.create': 'Tutor creado',
  'tutor.update': 'Tutor actualizado',
  'tutor.approve': 'Tutor aprobado',
  'tutor.reject': 'Tutor rechazado',
  'tutor.delete': 'Tutor eliminado',
  'member.create': 'Socio creado',
  'member.update': 'Socio actualizado',
  'member.delete': 'Socio eliminado',
  'member.toggle': 'Cambio de socio',
  'enrollment.confirm': 'Matrícula confirmada',
  'enrollment.reject': 'Matrícula rechazada',
  'enrollment.status': 'Estado de matrícula cambiado',
  'enrollment.delete': 'Matrícula eliminada',
  'payment.pending': 'Pago marcado pendiente',
  'payment.cancel': 'Pago cancelado',
  'payment.refund': 'Pago reembolsado',
  'finance_movement.upsert': 'Movimiento guardado',
  'finance_movement.delete': 'Movimiento eliminado',
  'fee_template.upsert': 'Cuota guardada',
  'fee_template.delete': 'Cuota eliminada',
  'tutor_fee.assign': 'Cuota asignada',
  'tutor_fee.cancel': 'Cuota cancelada',
}

export function AuditoriaClient({ logs }: AuditoriaClientProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('todos')

  const actions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort((a, b) => a.localeCompare(b, 'es')),
    [logs],
  )

  const visibleLogs = useMemo(() => {
    const q = search.trim().toLowerCase()

    return logs.filter((log) => {
      if (actionFilter !== 'todos' && log.action !== actionFilter) return false
      if (!q) return true

      return [
        ACTION_LABELS[log.action] ?? log.action,
        log.summary,
        log.actorName,
        log.actorEmail,
        log.entityType,
        log.entityId,
        log.createdAt,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [actionFilter, logs, search])

  return (
    <section className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-white/88 p-4 shadow-sm ring-1 ring-foreground/10 md:grid-cols-[1fr_260px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por administrador, acción, entidad o fecha"
            className="pl-9"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="todos">Todas las acciones</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action] ?? action}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white/88 shadow-sm ring-1 ring-foreground/10">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-black text-foreground">
            <History className="size-4 text-primary" aria-hidden="true" />
            {visibleLogs.length} eventos
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Últimos 300 registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-2.5">Fecha</th>
                <th className="px-4 py-2.5">Acción</th>
                <th className="px-4 py-2.5">Administrador</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Entidad</th>
                <th className="px-4 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No hay eventos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{log.createdAt}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-foreground">{log.actorName}</span>
                      {log.actorEmail ? (
                        <span className="block text-xs text-muted-foreground">{log.actorEmail}</span>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {log.entityType}
                      {log.entityId ? <span className="block text-xs">{log.entityId}</span> : null}
                    </td>
                    <td className="max-w-xl px-4 py-3 text-muted-foreground">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
