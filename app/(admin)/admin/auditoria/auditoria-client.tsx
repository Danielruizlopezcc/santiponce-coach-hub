'use client'

import { useMemo, useState } from 'react'
import { Banknote, History, Search, Settings, ShieldCheck, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  'coach.notice': 'Aviso enviado a entrenador',
  'tutor.create': 'Tutor legal creado',
  'tutor.update': 'Tutor legal actualizado',
  'tutor.approve': 'Tutor legal aprobado',
  'tutor.reject': 'Tutor legal rechazado',
  'tutor.delete': 'Tutor legal eliminado',
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

type AuditModule = 'sistema' | 'familias' | 'deportivo' | 'contabilidad'

const MODULE_META: Record<AuditModule, {
  label: string
  description: string
  icon: typeof History
  tone: string
  dot: string
}> = {
  sistema: {
    label: 'Sistema',
    description: 'Configuración, temporadas y administradores',
    icon: Settings,
    tone: 'bg-primary/10 text-primary',
    dot: 'bg-primary',
  },
  familias: {
    label: 'Familias',
    description: 'Tutores legales, socios y matrículas',
    icon: Users,
    tone: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  deportivo: {
    label: 'Gestión deportiva',
    description: 'Entrenadores y avisos deportivos',
    icon: ShieldCheck,
    tone: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  contabilidad: {
    label: 'Contabilidad',
    description: 'Pagos, cuotas y movimientos',
    icon: Banknote,
    tone: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
}

function getAuditModule(action: string): AuditModule {
  if (action.startsWith('coach.')) return 'deportivo'
  if (action.startsWith('tutor.') || action.startsWith('member.') || action.startsWith('enrollment.')) return 'familias'
  if (action.startsWith('payment.') || action.startsWith('finance_') || action.startsWith('fee_') || action.startsWith('tutor_fee.')) return 'contabilidad'
  return 'sistema'
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

  const moduleSummary = useMemo(() => {
    const counts: Record<AuditModule, number> = {
      sistema: 0,
      familias: 0,
      deportivo: 0,
      contabilidad: 0,
    }

    for (const log of visibleLogs) {
      counts[getAuditModule(log.action)] += 1
    }

    return counts
  }, [visibleLogs])

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(MODULE_META) as AuditModule[]).map((module) => {
          const meta = MODULE_META[module]
          const Icon = meta.icon

          return (
            <div key={module} className="rounded-xl border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{meta.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{moduleSummary[module]}</p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{meta.description}</p>
                </div>
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', meta.tone)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Actividad del panel</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Eventos recientes</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Últimos cambios registrados por administración, organizados por módulo y acción.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">
            <History className="size-4" aria-hidden="true" />
            {visibleLogs.length} eventos
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_260px]">
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

        <p className="mt-3 text-xs font-semibold text-muted-foreground">Últimos 300 registros disponibles.</p>
      </div>

      <div className="grid gap-3">
        {visibleLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-muted-foreground">
            No hay eventos que coincidan con los filtros.
          </div>
        ) : null}
        {visibleLogs.map((log) => {
          const auditModule = getAuditModule(log.action)
          const meta = MODULE_META[auditModule]
          const Icon = meta.icon

          return (
            <article key={log.id} className="rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-50/20">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black', meta.tone)}>
                      <Icon className="size-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {log.createdAt}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-black text-foreground">{ACTION_LABELS[log.action] ?? log.action}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">{log.summary}</p>

                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Administrador</p>
                      <p className="mt-1 truncate font-semibold text-foreground">{log.actorName}</p>
                      {log.actorEmail ? <p className="truncate text-xs text-muted-foreground">{log.actorEmail}</p> : null}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Entidad</p>
                      <p className="mt-1 truncate font-semibold text-foreground">{log.entityType || 'Sin entidad'}</p>
                      {log.entityId ? <p className="truncate text-xs text-muted-foreground">{log.entityId}</p> : null}
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Acción técnica</p>
                      <p className="mt-1 truncate font-semibold text-foreground">{log.action}</p>
                    </div>
                  </div>
                </div>
                <span className={cn('hidden size-3 rounded-full lg:block', meta.dot)} aria-hidden="true" />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
