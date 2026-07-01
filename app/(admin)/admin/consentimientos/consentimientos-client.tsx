'use client'

import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminConsentRow } from '@/lib/admin-app'

const ESTADO_STYLES: Record<AdminConsentRow['estado'], string> = {
  Firmado:  'bg-emerald-100 text-emerald-700',
  Revocado: 'bg-destructive/10 text-destructive',
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
      {/* ── Cabecera ──────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {groups.length} {groups.length === 1 ? 'persona' : 'personas'}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {consents.length} consentimientos
          </span>
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

      {/* ── Buscador ──────────────────────────────────────────────── */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar por persona o tipo de consentimiento…"
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

      <p className="mb-2 text-xs text-muted-foreground">
        {groups.length} {groups.length === 1 ? 'persona' : 'personas'}
        {search && ` · búsqueda activa`}
      </p>

      {/* ── Tabla agrupada ────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-8 px-2 py-2.5" />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Persona</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Firmados</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Revocados</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Consentimientos</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay consentimientos que coincidan con la búsqueda.
                </td>
              </tr>
            )}

            {groups.map((group) => {
              const isOpen = expandedWithSearch.has(group.usuario)

              return (
                <Fragment key={group.usuario}>
                  {/* ── Fila de grupo ──────────────────────────── */}
                  <tr
                    key={group.usuario}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => toggleUser(group.usuario)}
                  >
                    <td className="px-2 py-3 text-center text-muted-foreground">
                      {isOpen
                        ? <ChevronDown className="size-4" aria-hidden="true" />
                        : <ChevronRight className="size-4" aria-hidden="true" />}
                    </td>
                    <td className="px-4 py-3 font-medium">{group.usuario}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {group.firmados > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {group.firmados} firmado{group.firmados !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {group.revocados > 0 ? (
                        <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                          {group.revocados} revocado{group.revocados !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {isOpen
                        ? 'Haz clic para colapsar'
                        : `${group.rows.length} consentimiento${group.rows.length !== 1 ? 's' : ''} · haz clic para ver`}
                    </td>
                  </tr>

                  {/* ── Filas expandidas ───────────────────────── */}
                  {isOpen &&
                    group.rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t-0 bg-muted/20"
                      >
                        <td className="border-l-2 border-primary/20" />
                        <td
                          colSpan={4}
                          className="px-4 py-2.5"
                        >
                          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 gap-y-1 text-xs sm:grid-cols-[2fr_auto_auto_auto_auto]">
                            <span className="font-medium text-foreground">{row.tipoConsentimiento}</span>
                            <span className="hidden text-muted-foreground sm:inline">{row.version}</span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                ESTADO_STYLES[row.estado],
                              )}
                            >
                              {row.estado}
                            </span>
                            <span className="hidden text-muted-foreground sm:inline">{row.fecha}</span>
                            <span className="hidden text-muted-foreground lg:inline">{row.firmante}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
}
