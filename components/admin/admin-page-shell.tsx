'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import {
  AdminTable,
  type AdminTableRow,
  type Column,
  type FilterConfig,
} from '@/components/admin/admin-table'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'

type AdminPageShellProps = {
  title: string
  description: string
  data: AdminTableRow[]
  columns: Column[]
  keyField?: string
  rowBasePath?: string
  searchPlaceholder: string
  filters?: FilterConfig[]
  emptyTitle: string
  emptyDescription: string
  counterLabel: string
}

export function AdminPageShell({
  title,
  description,
  data,
  columns,
  keyField,
  rowBasePath,
  searchPlaceholder,
  filters,
  emptyTitle,
  emptyDescription,
  counterLabel,
}: AdminPageShellProps) {
  const [loading, setLoading] = useState(false)

  function exportCsv() {
    setLoading(true)
    const headers = columns.map((column) => column.label)
    const rows = data.map((row) =>
      columns.map((column) => String(row[column.key] ?? '')),
    )
    const csv = [
      headers.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
      ...rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setLoading(false)
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
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || data.length === 0}>
            <Download className="size-4" aria-hidden="true" />
            Exportar
          </Button>
        </div>
      </div>

      <AdminTable
        data={data}
        columns={columns}
        keyField={keyField}
        rowBasePath={rowBasePath}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        isLoading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </PageContainer>
  )
}
