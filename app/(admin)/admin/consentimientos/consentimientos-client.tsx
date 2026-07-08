'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, FileText, Search, Users, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminConsentRow } from '@/lib/admin-app'

const ESTADO_STYLES: Record<AdminConsentRow['estado'], string> = {
  Firmado:  'bg-emerald-100 text-emerald-700',
  Revocado: 'bg-destructive/10 text-destructive',
}

const ESTADO_CARD_STYLES: Record<AdminConsentRow['estado'], string> = {
  Firmado:  'border-emerald-100 bg-emerald-50/60',
  Revocado: 'border-rose-100 bg-rose-50/60',
}

type ConsentGroup = {
  usuario: string
  rows: AdminConsentRow[]
  firmados: number
  revocados: number
}

function groupByUser(consents: AdminConsentRow[]): ConsentGroup[] {
  const map = new Map<string, AdminConsentRow[]>()
  for (const c of consents) {
    const list = map.get(c.usuario) ?? []
    list.push(c)
    map.set(c.usuario, list)
  }
  return Array.from(map.entries())
    .map(([usuario, rows]) => ({
      usuario,
      rows,
      firmados:  rows.filter((r) => r.estado === 'Firmado').length,
      revocados: rows.filter((r) => r.estado === 'Revocado').length,
    }))
    .sort((a, b) => a.usuario.localeCompare(b.usuario, 'es'))
}

export function ConsentimientosClient({ consents }: { consents: AdminConsentRow[] }) {
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  const summary = useMemo(() => {
    const allGroups = groupByUser(consents)
    const firmados = consents.filter((consent) => consent.estado === 'Firmado').length
    const revocados = consents.filter((consent) => consent.estado === 'Revocado').length

    return {
      personas: allGroups.length,
      total: consents.length,
      firmados,
      revocados,
    }
  }, [consents])

  const groups = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return groupByUser(consents)

    const filtered = consents.filter(
      (c) =>
        c.usuario.toLowerCase().includes(q) ||
        c.tipoConsentimiento.toLowerCase().includes(q),
    )
    // Auto-expand groups that match on consent type (not just user name)
    return groupByUser(filtered)
  }, [consents, search])

  // Auto-expand when searching by consent type
  const expandedWithSearch = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return expanded
    const autoExpand = new Set(expanded)
    for (const g of groups) {
      if (g.rows.some((r) => r.tipoConsentimiento.toLowerCase().includes(q))) {
        autoExpand.add(g.usuario)
      }
    }
    return autoExpand
  }, [groups, search, expanded])

  function toggleUser(usuario: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(usuario)) {
        next.delete(usuario)
      } else {
        next.add(usuario)
      }
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(groups.map((g) => g.usuario)))
  }

  function collapseAll() {
    setExpanded(new Set())
  }

  const allExpanded = groups.length > 0 && groups.every((g) => expandedWithSearch.has(g.usuario))

  return (
    <PageContainer
      title="Consentimientos"
      description="Registros de aceptación y firma digital agrupados por persona."
      className="max-w-7xl"
    >
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <ConsentSummaryCard
          title="Personas"
          value={summary.personas}
          detail="Con consentimientos"
          icon={Users}
          tone="blue"
        />
        <ConsentSummaryCard
          title="Documentos"
          value={summary.total}
          detail="Registros guardados"
          icon={FileText}
          tone="slate"
        />
        <ConsentSummaryCard
          title="Firmados"
          value={summary.firmados}
          detail="Aceptaciones activas"
          icon={CheckCircle2}
          tone="green"
        />
        <ConsentSummaryCard
          title="Revocados"
          value={summary.revocados}
          detail="A revisar"
          icon={XCircle}
          tone="red"
        />
      </div>

      <div className="mb-4 rounded-xl border border-border bg-white/82 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Administración familiar</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Control de consentimientos</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Consulta las firmas por persona, tipo de documento, versión y estado actual.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-muted-foreground"
          >
            {allExpanded ? 'Colapsar todo' : 'Expandir todo'}
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar por persona o tipo de consentimiento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {search && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          {groups.length} {groups.length === 1 ? 'persona' : 'personas'}
          {search ? ' · búsqueda activa' : ''}
        </p>
      </div>

      <div className="grid gap-3">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-muted-foreground">
            No hay consentimientos que coincidan con la búsqueda.
          </div>
        ) : null}

        {groups.map((group) => {
          const isOpen = expandedWithSearch.has(group.usuario)

          return (
            <article key={group.usuario} className="rounded-xl border border-border bg-white/88 shadow-sm backdrop-blur">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-blue-50/40"
                onClick={() => toggleUser(group.usuario)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {isOpen ? <ChevronDown className="size-5" aria-hidden="true" /> : <ChevronRight className="size-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-foreground">{group.usuario}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {group.rows.length} consentimiento{group.rows.length !== 1 ? 's' : ''}
                      {isOpen ? ' · desplegado' : ' · haz clic para ver'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                    {group.firmados} firmado{group.firmados !== 1 ? 's' : ''}
                  </span>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">
                    {group.revocados} revocado{group.revocados !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {isOpen ? (
                <div className="grid gap-2 border-t border-border bg-slate-50/60 p-3">
                  {group.rows.map((row) => (
                    <div key={row.id} className={cn('rounded-lg border p-3', ESTADO_CARD_STYLES[row.estado])}>
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">{row.tipoConsentimiento}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                            <span>Versión: {row.version}</span>
                            <span>Fecha: {row.fecha}</span>
                            <span>Firmante: {row.firmante}</span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-black',
                            ESTADO_STYLES[row.estado],
                          )}
                        >
                          {row.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </PageContainer>
  )
}

function ConsentSummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  detail: string
  icon: typeof Users
  tone: 'blue' | 'green' | 'red' | 'slate'
}) {
  return (
    <div className="rounded-xl border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'red' && 'bg-rose-100 text-rose-700',
            tone === 'slate' && 'bg-slate-100 text-slate-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}
