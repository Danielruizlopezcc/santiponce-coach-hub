'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Column = {
  key: string
  label: string
  searchable?: boolean                            // default: true
  className?: string                              // applied to <td>
  headerClassName?: string                        // applied to <th>
  responsive?: 'always' | 'sm' | 'md' | 'lg' | 'xl'
}

export type FilterOption = {
  label: string
  value: string
}

export type FilterConfig = {
  key: string
  label: string
  options: FilterOption[]
}

export type AdminTableRow = Record<string, string | number>

type AdminTableProps = {
  data: AdminTableRow[]
  columns: Column[]
  keyField?: string
  rowBasePath?: string
  searchPlaceholder?: string
  filters?: FilterConfig[]
  pageSize?: number
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESPONSIVE_CLS: Record<NonNullable<Column['responsive']>, string> = {
  always: '',
  sm:     'hidden sm:table-cell',
  md:     'hidden md:table-cell',
  lg:     'hidden lg:table-cell',
  xl:     'hidden xl:table-cell',
}

function getPageNumbers(total: number, current: number): (number | 'ellipsis')[] {
  return Array.from({ length: total }, (_, i) => i + 1).reduce<
    (number | 'ellipsis')[]
  >((acc, n) => {
    if (n === 1 || n === total || Math.abs(n - current) <= 1) {
      const prev = acc[acc.length - 1]
      if (typeof prev === 'number' && n - prev > 1) acc.push('ellipsis')
      acc.push(n)
    }
    return acc
  }, [])
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminTable({
  data,
  columns,
  keyField = 'id',
  rowBasePath,
  searchPlaceholder = 'Buscar…',
  filters,
  pageSize = 10,
  isLoading = false,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No se encontraron registros con los filtros aplicados.',
}: AdminTableProps) {
  const showActions = !!rowBasePath
  const [search, setSearch]               = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [page, setPage]                   = useState(1)

  const hasActiveFilters =
    search.trim() !== '' || Object.values(activeFilters).some(Boolean)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function toggleFilter(key: string, value: string) {
    setActiveFilters((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }))
    setPage(1)
  }

  function clearAll() {
    setSearch('')
    setActiveFilters({})
    setPage(1)
  }

  // Filter + search (recalculates only when inputs change)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return data.filter((row) => {
      const r = row as Record<string, unknown>

      if (q) {
        const haystack = columns
          .filter((c) => c.searchable !== false)
          .map((c) => {
            const v = r[c.key]
            return v != null ? String(v).toLowerCase() : ''
          })
          .join(' ')
        if (!haystack.includes(q)) return false
      }

      for (const [key, val] of Object.entries(activeFilters)) {
        if (!val) continue
        if (r[key] !== val) return false
      }

      return true
    })
  }, [data, search, activeFilters, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current    = Math.min(page, totalPages)
  const paged      = filtered.slice((current - 1) * pageSize, current * pageSize)
  const pageNums   = getPageNumbers(totalPages, current)

  const colCount = columns.length + (showActions ? 1 : 0)

  return (
    <div className="space-y-4">

      {/* ── Search + Filters ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              aria-label={searchPlaceholder}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="shrink-0 gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        {filters && filters.length > 0 && (
          <div
            className="flex flex-wrap items-start gap-x-4 gap-y-2"
            role="group"
            aria-label="Filtros"
          >
            {filters.map((filter) => (
              <div key={filter.key} className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {filter.label}:
                </span>
                {filter.options.map((opt) => {
                  const isActive = activeFilters[filter.key] === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFilter(filter.key, opt.value)}
                      aria-pressed={isActive}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-bold text-blue-950',
                    RESPONSIVE_CLS[col.responsive ?? 'always'],
                    col.headerClassName,
                  )}
                >
                  {col.label}
                </th>
              ))}
              {showActions && (
                <th
                  scope="col"
                  className="px-4 py-2.5 text-right text-xs font-bold text-blue-950"
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {/* Loading skeleton */}
            {isLoading &&
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} aria-hidden="true">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5', RESPONSIVE_CLS[col.responsive ?? 'always'])}
                    >
                      <div
                        className="h-4 animate-pulse rounded-md bg-muted"
                        style={{ width: `${55 + ((i * 13 + col.key.length * 7) % 35)}%` }}
                      />
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-4 py-3.5">
                      <div className="ml-auto h-6 w-20 animate-pulse rounded-md bg-muted" />
                    </td>
                  )}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && paged.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="size-8 opacity-30" aria-hidden="true" />
                    <p className="text-sm font-medium">{emptyTitle}</p>
                    {emptyDescription && (
                      <p className="text-xs">{emptyDescription}</p>
                    )}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
                      >
                        Ver todos los registros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              paged.map((row, index) => (
                <tr
                  key={String(row[keyField] ?? `${current}-${index}`)}
                  className="transition-colors hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3',
                        RESPONSIVE_CLS[col.responsive ?? 'always'],
                        col.className,
                      )}
                    >
                      {String(row[col.key] ?? '—')}
                    </td>
                  ))}
                  {showActions && rowBasePath && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`${rowBasePath}/${row[keyField]}`}
                            aria-label={`Ver ${String(row[keyField] ?? '')}`}
                          >
                            Ver
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`${rowBasePath}/${row[keyField]}/editar`}
                            aria-label={`Editar ${String(row[keyField] ?? '')}`}
                          >
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {!isLoading && filtered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <nav
            className="flex items-center gap-1"
            role="navigation"
            aria-label="Paginación"
          >
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </Button>

            {pageNums.map((n, idx) =>
              n === 'ellipsis' ? (
                <span
                  key={`el-${idx}`}
                  className="px-1 text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={n}
                  variant={n === current ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => setPage(n)}
                  aria-label={`Página ${n}`}
                  aria-current={n === current ? 'page' : undefined}
                >
                  {n}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}
