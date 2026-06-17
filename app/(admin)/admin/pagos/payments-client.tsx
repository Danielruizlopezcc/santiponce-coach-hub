'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { CreditCard, Download, Loader2, Pencil, Plus, ReceiptText, Search, ShieldAlert, Tags, Trash2, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import {
  AdminTable,
  type AdminTableRow,
  type Column,
  type FilterConfig,
} from '@/components/admin/admin-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro } from '@/lib/format'
import type { AdminEnrollmentRow, AdminFeeTemplateRow, AdminFinanceMovementRow, AdminPaymentRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { MatriculasClient } from '../matriculas/matriculas-client'
import {
  createFinanceMovementAction,
  createFeeTemplateAction,
  deleteFinanceMovementAction,
  type FeeTemplateActionState,
  type FinanceMovementActionState,
} from './actions'

type AdminPaymentsClientProps = {
  payments: AdminPaymentRow[]
  financeMovements: AdminFinanceMovementRow[]
  enrollments: AdminEnrollmentRow[]
  feeTemplates: AdminFeeTemplateRow[]
}

const columns: Column[] = [
  { key: 'operacion', label: 'Operación' },
  { key: 'deportista', label: 'Deportista' },
  { key: 'tutor', label: 'Tutor', responsive: 'md' },
  { key: 'importe', label: 'Importe' },
  { key: 'estado', label: 'Estado' },
  { key: 'proveedor', label: 'Proveedor', responsive: 'lg' },
  { key: 'fecha', label: 'Fecha', responsive: 'lg' },
]

const filters: FilterConfig[] = [
  {
    key: 'estado',
    label: 'Estado',
    options: [
      { label: 'Pagado', value: 'pagado' },
      { label: 'Pendiente', value: 'pendiente' },
      { label: 'Fallido', value: 'fallido' },
      { label: 'Reembolsado', value: 'reembolsado' },
    ],
  },
  {
    key: 'proveedor',
    label: 'Proveedor',
    options: [
      { label: 'Stripe', value: 'Stripe' },
      { label: 'Manual', value: 'Manual' },
    ],
  },
  {
    key: 'operacion',
    label: 'Operación',
    options: [
      { label: 'Cuota socio', value: 'Cuota de socio' },
      { label: 'Matrícula', value: 'Matrícula inicial' },
    ],
  },
]

const STATUS_STYLES = {
  pagado: 'bg-emerald-500',
  pendiente: 'bg-amber-400',
  fallido: 'bg-rose-500',
  reembolsado: 'bg-sky-500',
} as const

function getPercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string
  detail: string
  icon: typeof Wallet
  tone?: 'blue' | 'green' | 'amber'
}) {
  return (
    <Card className="bg-white/88 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </CardTitle>
          <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'blue' && 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-semibold text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function DonutChart({
  paid,
  pending,
  failed,
  refunded,
}: {
  paid: number
  pending: number
  failed: number
  refunded: number
}) {
  const total = paid + pending + failed + refunded
  const paidPct = getPercent(paid, total)
  const pendingPct = getPercent(pending, total)
  const failedPct = getPercent(failed, total)
  const refundedPct = Math.max(0, 100 - paidPct - pendingPct - failedPct)
  const gradient =
    total === 0
      ? '#e5e7eb 0 100%'
      : `#10b981 0 ${paidPct}%, #f59e0b ${paidPct}% ${paidPct + pendingPct}%, #ef4444 ${paidPct + pendingPct}% ${paidPct + pendingPct + failedPct}%, #0ea5e9 ${paidPct + pendingPct + failedPct}% ${paidPct + pendingPct + failedPct + refundedPct}%`

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative size-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-hidden="true"
      >
        <div className="absolute inset-8 rounded-full bg-white" />
      </div>
      <div className="grid gap-2 text-sm">
        {[
          ['Pagado', paid, 'pagado'],
          ['Pendiente', pending, 'pendiente'],
          ['Fallido', failed, 'fallido'],
          ['Reembolsado', refunded, 'reembolsado'],
        ].map(([label, value, status]) => (
          <div key={String(status)} className="flex items-center gap-2">
            <span
              className={cn('size-2.5 rounded-full', STATUS_STYLES[status as keyof typeof STATUS_STYLES])}
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">{label}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const initialMovementState: FinanceMovementActionState = {
  ok: false,
  message: '',
}

const initialFeeState: FeeTemplateActionState = {
  ok: false,
  message: '',
}

export function AdminPaymentsClient({ payments, financeMovements, enrollments, feeTemplates }: AdminPaymentsClientProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'resumen' | 'cobros' | 'matriculas' | 'cuotas' | 'movimientos'>('resumen')
  const [editingMovement, setEditingMovement] = useState<AdminFinanceMovementRow | null>(null)
  const [splitFee, setSplitFee] = useState(false)
  const [movementSearch, setMovementSearch] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState<'todos' | 'ingreso' | 'gasto'>('todos')
  const [confirmDeleteMovementId, setConfirmDeleteMovementId] = useState<string | null>(null)
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<FinanceMovementActionState | null>(null)
  const [movementState, movementAction, movementPending] = useActionState(
    createFinanceMovementAction,
    initialMovementState,
  )
  const [feeState, feeAction, feePending] = useActionState(createFeeTemplateAction, initialFeeState)
  const movementFormRef = useRef<HTMLFormElement>(null)
  const feeFormRef = useRef<HTMLFormElement>(null)

  const summary = useMemo(() => {
    const paid = payments.filter((payment) => payment.estado === 'pagado')
    const pending = payments.filter((payment) => payment.estado === 'pendiente')
    const failed = payments.filter((payment) => payment.estado === 'fallido')
    const refunded = payments.filter((payment) => payment.estado === 'reembolsado')
    const manualIncomes = financeMovements.filter((movement) => movement.tipo === 'ingreso')
    const manualExpenses = financeMovements.filter((movement) => movement.tipo === 'gasto')
    const paidTotal = paid.reduce((sum, payment) => sum + payment.importe, 0)
    const pendingTotal = pending.reduce((sum, payment) => sum + payment.importe, 0)
    const manualIncomeTotal = manualIncomes.reduce((sum, movement) => sum + movement.importe, 0)
    const manualExpenseTotal = manualExpenses.reduce((sum, movement) => sum + movement.importe, 0)
    const confirmedIncomeTotal = paidTotal + manualIncomeTotal
    const balance = confirmedIncomeTotal - manualExpenseTotal
    const membershipTotal = paid
      .filter((payment) => payment.operacion === 'Cuota de socio')
      .reduce((sum, payment) => sum + payment.importe, 0)
    const enrollmentTotal = paid
      .filter((payment) => payment.operacion === 'Matrícula inicial')
      .reduce((sum, payment) => sum + payment.importe, 0)
    const stripeCount = payments.filter((payment) => payment.proveedor === 'Stripe').length
    const manualCount = payments.filter((payment) => payment.proveedor === 'Manual').length

    return {
      paid,
      pending,
      failed,
      refunded,
      paidTotal,
      pendingTotal,
      manualIncomes,
      manualExpenses,
      manualIncomeTotal,
      manualExpenseTotal,
      confirmedIncomeTotal,
      balance,
      membershipTotal,
      enrollmentTotal,
      stripeCount,
      manualCount,
      averagePaid: paid.length + manualIncomes.length > 0 ? confirmedIncomeTotal / (paid.length + manualIncomes.length) : 0,
    }
  }, [payments, financeMovements])

  const tableData = useMemo<AdminTableRow[]>(
    () =>
      payments.map((row) => ({
        ...row,
        importe: formatEuro(row.importe),
      })),
    [payments],
  )

  const movementSummary = useMemo(() => {
    const incomes = financeMovements.filter((movement) => movement.tipo === 'ingreso')
    const expenses = financeMovements.filter((movement) => movement.tipo === 'gasto')
    const incomeTotal = incomes.reduce((sum, movement) => sum + movement.importe, 0)
    const expenseTotal = expenses.reduce((sum, movement) => sum + movement.importe, 0)

    return {
      incomes,
      expenses,
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
    }
  }, [financeMovements])

  const visibleMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    return financeMovements.filter((movement) => {
      if (movementTypeFilter !== 'todos' && movement.tipo !== movementTypeFilter) return false
      if (!q) return true

      return [
        movement.tipo,
        movement.concepto,
        movement.detalle,
        formatEuro(movement.importe),
        movement.fecha,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [financeMovements, movementSearch, movementTypeFilter])

  useEffect(() => {
    if (movementState.ok) {
      movementFormRef.current?.reset()
      setEditingMovement(null)
    }
  }, [movementState.ok, movementState.message])

  useEffect(() => {
    if (feeState.ok) {
      feeFormRef.current?.reset()
      setSplitFee(false)
    }
  }, [feeState.ok, feeState.message])

  async function handleDeleteMovement(movement: AdminFinanceMovementRow) {
    setDeletePendingId(movement.id)
    setDeleteMessage(null)
    const result = await deleteFinanceMovementAction(movement.id)
    setDeletePendingId(null)
    setConfirmDeleteMovementId(null)
    setDeleteMessage(result)
    if (editingMovement?.id === movement.id) {
      setEditingMovement(null)
    }
  }

  function simulateLoading() {
    setLoading(true)
    setTimeout(() => setLoading(false), 900)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de pagos">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'cobros', label: 'Cobros realizados' },
          { id: 'matriculas', label: 'Matrículas' },
          { id: 'cuotas', label: 'Cuotas' },
          { id: 'movimientos', label: 'Ingresos y gastos' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-black uppercase transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/75 text-muted-foreground ring-1 ring-foreground/10 hover:bg-primary/10 hover:text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' ? (
      <section aria-labelledby="pagos-resumen" className="space-y-5" role="tabpanel">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Zona principal
          </p>
          <h2 id="pagos-resumen" className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Resumen de pagos
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryCard
            title="Ingresos totales"
            value={formatEuro(summary.confirmedIncomeTotal)}
            detail={`${formatEuro(summary.paidTotal)} en cobros y ${formatEuro(summary.manualIncomeTotal)} manuales`}
            icon={Wallet}
            tone="green"
          />
          <SummaryCard
            title="Gastos"
            value={formatEuro(summary.manualExpenseTotal)}
            detail={`${summary.manualExpenses.length} registro${summary.manualExpenses.length !== 1 ? 's' : ''} de salida`}
            icon={TrendingDown}
            tone="amber"
          />
          <SummaryCard
            title="Balance"
            value={formatEuro(summary.balance)}
            detail="Ingresos confirmados menos gastos"
            icon={TrendingUp}
            tone={summary.balance >= 0 ? 'blue' : 'amber'}
          />
          <SummaryCard
            title="Pendiente de cobro"
            value={formatEuro(summary.pendingTotal)}
            detail={`${summary.pending.length} operación${summary.pending.length !== 1 ? 'es' : ''} pendiente${summary.pending.length !== 1 ? 's' : ''}`}
            icon={CreditCard}
            tone="amber"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">Estado de operaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart
                paid={summary.paid.length}
                pending={summary.pending.length}
                failed={summary.failed.length}
                refunded={summary.refunded.length}
              />
            </CardContent>
          </Card>

          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">Desglose principal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Cuotas de socio</p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  {formatEuro(summary.membershipTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Matrículas</p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  {formatEuro(summary.enrollmentTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Ingresos manuales</p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  {formatEuro(summary.manualIncomeTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Gastos manuales</p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  {formatEuro(summary.manualExpenseTotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Stripe</p>
                <p className="mt-2 text-2xl font-black text-foreground">{summary.stripeCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-4">
                <p className="text-sm font-black text-muted-foreground">Manual</p>
                <p className="mt-2 text-2xl font-black text-foreground">{summary.manualCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      ) : null}

      {activeTab === 'cobros' ? (
      <section aria-labelledby="pagos-historico" className="space-y-5" role="tabpanel">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Zona de operaciones
            </p>
            <h2 id="pagos-historico" className="mt-2 text-2xl font-black tracking-tight text-foreground">
              Cobros realizados
            </h2>
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

        <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {payments.length} pagos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              <ReceiptText className="size-3.5" aria-hidden="true" />
              Histórico
            </span>
          </div>
          <AdminTable
            data={tableData}
            columns={columns}
            searchPlaceholder="Buscar por operación, tutor, deportista, proveedor o fecha"
            filters={filters}
            isLoading={loading}
            emptyTitle="Sin pagos"
            emptyDescription="No hay pagos que coincidan con los filtros aplicados."
          />
        </div>
      </section>
      ) : null}

      {activeTab === 'matriculas' ? (
        <section aria-label="Matrículas" role="tabpanel">
          <MatriculasClient enrollments={enrollments} embedded />
        </section>
      ) : null}

      {activeTab === 'cuotas' ? (
        <section aria-labelledby="pagos-cuotas" className="space-y-5" role="tabpanel">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Configuración de cobros
            </p>
            <h2 id="pagos-cuotas" className="mt-2 text-2xl font-black tracking-tight text-foreground">
              Cuotas
            </h2>
          </div>

          <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
            <Card className="bg-white/88 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-black">Nueva cuota</CardTitle>
              </CardHeader>
              <CardContent>
                <form ref={feeFormRef} action={feeAction} className="space-y-4">
                  <div>
                    <label htmlFor="fee-name" className="text-sm font-black text-foreground">
                      Nombre
                    </label>
                    <Input id="fee-name" name="nombre" className="mt-2" placeholder="Ej. Cuota mensual, campus, equipación..." required />
                  </div>

                  <div>
                    <label htmlFor="fee-type" className="text-sm font-black text-foreground">
                      Tipo
                    </label>
                    <Input id="fee-type" name="tipo" className="mt-2" placeholder="Ej. Socio, deportista, campaña..." required />
                  </div>

                  <div>
                    <label htmlFor="fee-amount" className="text-sm font-black text-foreground">
                      Precio total
                    </label>
                    <Input id="fee-amount" name="importe" type="number" min="0.01" step="0.01" className="mt-2" placeholder="0,00" required />
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                    <input type="checkbox" name="isPublic" className="size-4 accent-primary" defaultChecked />
                    Esta cuota es pública
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="splitPayment"
                      className="size-4 accent-primary"
                      checked={splitFee}
                      onChange={(event) => setSplitFee(event.target.checked)}
                    />
                    Repartir pago en varios cargos
                  </label>

                  {splitFee ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="fee-frequency" className="text-sm font-black text-foreground">
                          Frecuencia de cargos
                        </label>
                        <select
                          id="fee-frequency"
                          name="chargeFrequency"
                          className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          defaultValue="cada_mes"
                          required
                        >
                          <option value="cada_mes">Cada mes</option>
                          <option value="cada_2_meses">Cada 2 meses</option>
                          <option value="cada_3_meses">Cada 3 meses</option>
                          <option value="cada_6_meses">Cada 6 meses</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="fee-count" className="text-sm font-black text-foreground">
                          Número total de cargos
                        </label>
                        <Input id="fee-count" name="chargeCount" type="number" min="2" step="1" className="mt-2" placeholder="12" required />
                      </div>
                    </div>
                  ) : null}

                  {feeState.message ? (
                    <p
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-semibold',
                        feeState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {feeState.message}
                    </p>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={feePending}>
                    {feePending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                    Guardar cuota
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {feeTemplates.length} cuotas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Tags className="size-3.5" aria-hidden="true" />
                  Configuradas
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Importe</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Reparto</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {feeTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          Aún no hay cuotas configuradas.
                        </td>
                      </tr>
                    ) : (
                      feeTemplates.map((fee) => (
                        <tr key={fee.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">{fee.nombre}</td>
                          <td className="px-4 py-3 text-muted-foreground">{fee.tipo}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatEuro(fee.importe)}</td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {fee.splitPayment ? `${fee.chargeCount} cargos · ${fee.chargeFrequency}` : 'Pago único'}
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', fee.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                              {fee.isPublic ? 'Pública' : 'Privada'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'movimientos' ? (
      <section aria-labelledby="pagos-movimientos" className="space-y-5" role="tabpanel">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            Caja manual
          </p>
          <h2 id="pagos-movimientos" className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Ingresos y gastos
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            title="Ingresos manuales"
            value={formatEuro(movementSummary.incomeTotal)}
            detail={`${movementSummary.incomes.length} registro${movementSummary.incomes.length !== 1 ? 's' : ''} de entrada`}
            icon={TrendingUp}
            tone="green"
          />
          <SummaryCard
            title="Gastos"
            value={formatEuro(movementSummary.expenseTotal)}
            detail={`${movementSummary.expenses.length} registro${movementSummary.expenses.length !== 1 ? 's' : ''} de salida`}
            icon={TrendingDown}
            tone="amber"
          />
          <SummaryCard
            title="Balance"
            value={formatEuro(movementSummary.balance)}
            detail="Ingresos manuales menos gastos"
            icon={Wallet}
            tone={movementSummary.balance >= 0 ? 'blue' : 'amber'}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">
                {editingMovement ? 'Editar movimiento' : 'Añadir movimiento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                key={editingMovement?.id ?? 'new-movement'}
                ref={movementFormRef}
                action={movementAction}
                className="space-y-4"
              >
                <input type="hidden" name="id" value={editingMovement?.id ?? ''} />
                <div>
                  <label htmlFor="tipo" className="text-sm font-black text-foreground">
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    defaultValue={editingMovement?.tipo ?? 'ingreso'}
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="concepto" className="text-sm font-black text-foreground">
                    Concepto
                  </label>
                  <Input
                    id="concepto"
                    name="concepto"
                    placeholder="Ej. Lotería, material deportivo, efectivo..."
                    className="mt-2"
                    defaultValue={editingMovement?.concepto ?? ''}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="detalle" className="text-sm font-black text-foreground">
                    Detalle <span className="font-semibold text-muted-foreground">(opcional)</span>
                  </label>
                  <textarea
                    id="detalle"
                    name="detalle"
                    rows={4}
                    placeholder="Añade una nota si hace falta."
                    defaultValue={editingMovement?.detalle ?? ''}
                    className="mt-2 w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <div>
                  <label htmlFor="importe" className="text-sm font-black text-foreground">
                    Importe
                  </label>
                  <Input
                    id="importe"
                    name="importe"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    className="mt-2"
                    defaultValue={editingMovement ? String(editingMovement.importe) : ''}
                    required
                  />
                </div>

                {movementState.message ? (
                  <p
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-semibold',
                      movementState.ok
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700',
                    )}
                  >
                    {movementState.message}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  {editingMovement ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingMovement(null)}
                      disabled={movementPending}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Cancelar
                    </Button>
                  ) : null}
                  <Button type="submit" className={editingMovement ? '' : 'sm:col-span-2'} disabled={movementPending}>
                    {movementPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : editingMovement ? (
                      <Pencil className="size-4" aria-hidden="true" />
                    ) : (
                      <Plus className="size-4" aria-hidden="true" />
                    )}
                    {editingMovement ? 'Guardar cambios' : 'Guardar movimiento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {financeMovements.length} movimientos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ReceiptText className="size-3.5" aria-hidden="true" />
                Manual
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    placeholder="Buscar por concepto, detalle, tipo o fecha"
                    value={movementSearch}
                    onChange={(event) => setMovementSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Todos', value: 'todos' },
                    { label: 'Ingresos', value: 'ingreso' },
                    { label: 'Gastos', value: 'gasto' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setMovementTypeFilter(filter.value as typeof movementTypeFilter)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-black transition-colors',
                        movementTypeFilter === filter.value
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {(deleteMessage?.message || deletePendingId) ? (
                <p
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold',
                    deleteMessage?.ok
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700',
                  )}
                >
                  {deletePendingId ? 'Eliminando movimiento...' : deleteMessage?.message}
                </p>
              ) : null}

              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Concepto</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Detalle</th>
                      <th className="px-4 py-2.5">Importe</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Fecha</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {visibleMovements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          Aún no hay movimientos que coincidan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      visibleMovements.map((movement) => (
                        <tr key={movement.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-black',
                                movement.tipo === 'ingreso'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700',
                              )}
                            >
                              {movement.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{movement.concepto}</td>
                          <td className="hidden max-w-xs px-4 py-3 text-muted-foreground md:table-cell">
                            <span className="line-clamp-2">{movement.detalle || '—'}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {formatEuro(movement.importe)}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                            {movement.fecha}
                          </td>
                          <td className="px-4 py-3">
                            {confirmDeleteMovementId === movement.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletePendingId === movement.id}
                                  onClick={() => handleDeleteMovement(movement)}
                                >
                                  {deletePendingId === movement.id ? (
                                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                  ) : null}
                                  Sí, eliminar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmDeleteMovementId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Editar ${movement.concepto}`}
                                onClick={() => setEditingMovement(movement)}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-sm"
                                aria-label={`Eliminar ${movement.concepto}`}
                                disabled={deletePendingId === movement.id}
                                onClick={() => setConfirmDeleteMovementId(movement.id)}
                              >
                                {deletePendingId === movement.id ? (
                                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="size-4" aria-hidden="true" />
                                )}
                              </Button>
                            </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}
    </div>
  )
}
