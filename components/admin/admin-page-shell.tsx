'use client'

import { useState } from 'react'
import { Download, Eye, Loader2, Pencil, ShieldAlert } from 'lucide-react'
import { AdminTable, type Column, type FilterConfig } from '@/components/admin/admin-table'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'

type AdminPageShellProps<T> = {
  title: string
  description: string
  data: T[]
  columns: Column<T>[]
  getKey: (row: T) => string | number
  searchPlaceholder: string
  filters?: FilterConfig[]
  emptyTitle: string
  emptyDescription: string
  counterLabel: string
}

export function AdminPageShell<T>({
  title,
  description,
  data,
  columns,
  getKey,
  searchPlaceholder,
  filters,
  emptyTitle,
  emptyDescription,
  counterLabel,
}: AdminPageShellProps<T>) {
  const [loading, setLoading] = useState(false)

  function simulateLoading() {
    setLoading(true)
    setTimeout(() => setLoading(false), 900)
  }

  return (
    <PageContainer title={title} description={description} className="max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {data.length} {counterLabel}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Visual
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={simulateLoading} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-4" aria-hidden="true" />
            )}
            Simular carga
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-4" aria-hidden="true" />
            Exportar
          </Button>
        </div>
      </div>

      <AdminTable
        data={data}
        columns={columns}
        getKey={getKey}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        isLoading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Ver ${String(getKey(row))}`}>
              <Eye className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Editar ${String(getKey(row))}`}>
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      />
    </PageContainer>
  )
}
