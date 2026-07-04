'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, CreditCard, Download, FileText, Landmark, Loader2, Pencil, Plus, ReceiptText, Search, ShieldAlert, Tags, Trash2, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import {
  AdminTable,
  type AdminTableRow,
  type Column,
  type FilterConfig,
} from '@/components/admin/admin-table'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro } from '@/lib/format'
import type { AdminEnrollmentRow, AdminFeeTemplateRow, AdminFinanceMovementRow, AdminPaymentRow, AdminSeasonRow, AdminTutorFeeAssignmentRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { MatriculasClient } from '../matriculas/matriculas-client'
import {
  createFinanceMovementAction,
  createFeeTemplateAction,
  cancelPaymentAction,
  deleteFeeTemplateAction,
  deleteFinanceMovementAction,
  markPaymentPendingAction,
  refundStripePaymentAction,
  type FeeTemplateActionState,
  type FinanceMovementActionState,
} from './actions'

type AdminPaymentsClientProps = {
  payments: AdminPaymentRow[]
  financeMovements: AdminFinanceMovementRow[]
  enrollments: AdminEnrollmentRow[]
  feeTemplates: AdminFeeTemplateRow[]
  seasons: AdminSeasonRow[]
  feeAssignments: AdminTutorFeeAssignmentRow[]
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

const INCOME_CATEGORIES = ['Socios', 'Matrículas', 'Cuotas deportivas', 'Patrocinadores', 'Lotería / eventos', 'Subvenciones', 'Otros']
const EXPENSE_CATEGORIES = ['Material deportivo', 'Árbitros', 'Federación', 'Equipaciones', 'Instalaciones', 'Transporte', 'Administración', 'Otros']
const METHOD_LABELS: Record<AdminFinanceMovementRow['metodoPago'], string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  bizum: 'Bizum',
  card: 'Tarjeta',
  stripe: 'Stripe',
  other: 'Otro',
}
const MOVEMENT_STATUS_LABELS: Record<AdminFinanceMovementRow['estado'], string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  void: 'Anulado',
}
const MOVEMENT_STATUS_STYLES: Record<AdminFinanceMovementRow['estado'], string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  void: 'bg-slate-100 text-slate-600',
}

function getMovementCategories(type: 'ingreso' | 'gasto') {
  return type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

function sumMovements(movements: AdminFinanceMovementRow[]) {
  return movements
    .filter((movement) => movement.estado === 'confirmed')
    .reduce((sum, movement) => sum + movement.importe, 0)
}

function csvEscape(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function AdminPaymentsClient({ payments, financeMovements, enrollments, feeTemplates, seasons, feeAssignments }: AdminPaymentsClientProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'cobros' | 'matriculas' | 'cuotas' | 'pendientes' | 'ingresos' | 'gastos' | 'informes'>('resumen')
  const [editingMovement, setEditingMovement] = useState<AdminFinanceMovementRow | null>(null)
  const [editingFee, setEditingFee] = useState<AdminFeeTemplateRow | null>(null)
  const [movementFormType, setMovementFormType] = useState<'ingreso' | 'gasto'>('ingreso')
  const [splitFee, setSplitFee] = useState(false)
  const [movementSearch, setMovementSearch] = useState('')
  const [movementCategoryFilter, setMovementCategoryFilter] = useState('todos')
  const [movementMethodFilter, setMovementMethodFilter] = useState<'todos' | AdminFinanceMovementRow['metodoPago']>('todos')
  const [movementStatusFilter, setMovementStatusFilter] = useState<'todos' | AdminFinanceMovementRow['estado']>('todos')
  const [movementSeasonFilter, setMovementSeasonFilter] = useState('todos')
  const [feeSearch, setFeeSearch] = useState('')
  const [feeTypeFilter, setFeeTypeFilter] = useState('todos')
  const [feeVisibilityFilter, setFeeVisibilityFilter] = useState<'todos' | 'publica' | 'privada'>('todos')
  const [feeSplitFilter, setFeeSplitFilter] = useState<'todos' | 'unico' | 'repartido'>('todos')
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingStatusFilter, setPendingStatusFilter] = useState<'todos' | 'pendiente' | 'fallido' | 'programada'>('todos')
  const [reportSearch, setReportSearch] = useState('')
  const [reportSeasonFilter, setReportSeasonFilter] = useState('todos')
  const [confirmDeleteMovementId, setConfirmDeleteMovementId] = useState<string | null>(null)
  const [confirmDeleteFeeId, setConfirmDeleteFeeId] = useState<string | null>(null)
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<FinanceMovementActionState | null>(null)
  const [paymentActionId, setPaymentActionId] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState<FinanceMovementActionState | null>(null)
  const [feeDeleteMessage, setFeeDeleteMessage] = useState<FeeTemplateActionState | null>(null)
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
    const manualIncomes = financeMovements.filter((movement) => movement.tipo === 'ingreso' && movement.estado === 'confirmed')
    const manualExpenses = financeMovements.filter((movement) => movement.tipo === 'gasto' && movement.estado === 'confirmed')
    const paidTotal = paid.reduce((sum, payment) => sum + payment.importe, 0)
    const pendingTotal = pending.reduce((sum, payment) => sum + payment.importe, 0)
    const manualIncomeTotal = sumMovements(manualIncomes)
    const manualExpenseTotal = sumMovements(manualExpenses)
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
    const cashTotal = sumMovements(financeMovements.filter((movement) => movement.metodoPago === 'cash'))
    const bankTotal = sumMovements(financeMovements.filter((movement) => ['transfer', 'bizum', 'card'].includes(movement.metodoPago)))
    const stripeTotal = paid.filter((payment) => payment.proveedor === 'Stripe').reduce((sum, payment) => sum + payment.importe, 0)

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
      cashTotal,
      bankTotal,
      stripeTotal,
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

  const visibleMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    const expectedType = activeTab === 'gastos' ? 'gasto' : 'ingreso'
    return financeMovements.filter((movement) => {
      if (movement.tipo !== expectedType) return false
      if (movementCategoryFilter !== 'todos' && movement.categoria !== movementCategoryFilter) return false
      if (movementMethodFilter !== 'todos' && movement.metodoPago !== movementMethodFilter) return false
      if (movementStatusFilter !== 'todos' && movement.estado !== movementStatusFilter) return false
      if (movementSeasonFilter !== 'todos' && (movement.seasonId ?? 'sin-temporada') !== movementSeasonFilter) return false
      if (!q) return true

      return [
        movement.tipo,
        movement.concepto,
        movement.detalle,
        movement.categoria,
        METHOD_LABELS[movement.metodoPago],
        MOVEMENT_STATUS_LABELS[movement.estado],
        movement.temporada,
        formatEuro(movement.importe),
        movement.fecha,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [activeTab, financeMovements, movementCategoryFilter, movementMethodFilter, movementSearch, movementSeasonFilter, movementStatusFilter])

  const feeTypes = useMemo(
    () => Array.from(new Set(feeTemplates.map((fee) => fee.tipo))).sort((a, b) => a.localeCompare(b, 'es')),
    [feeTemplates],
  )

  const visibleFeeTemplates = useMemo(() => {
    const q = feeSearch.trim().toLowerCase()
    return feeTemplates.filter((fee) => {
      if (feeTypeFilter !== 'todos' && fee.tipo !== feeTypeFilter) return false
      if (feeVisibilityFilter === 'publica' && !fee.isPublic) return false
      if (feeVisibilityFilter === 'privada' && fee.isPublic) return false
      if (feeSplitFilter === 'unico' && fee.splitPayment) return false
      if (feeSplitFilter === 'repartido' && !fee.splitPayment) return false
      if (!q) return true

      return [
        fee.nombre,
        fee.tipo,
        formatEuro(fee.importe),
        fee.splitPayment ? 'repartido varios cargos' : 'pago unico',
        fee.isPublic ? 'publica' : 'privada',
        fee.chargeFrequency,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [feeSearch, feeSplitFilter, feeTemplates, feeTypeFilter, feeVisibilityFilter])

  const pendingPayments = useMemo(() => [...summary.pending, ...summary.failed], [summary.failed, summary.pending])

  const visiblePendingPayments = useMemo(() => {
    const q = pendingSearch.trim().toLowerCase()
    return pendingPayments.filter((payment) => {
      if (pendingStatusFilter === 'programada') return false
      if (pendingStatusFilter !== 'todos' && payment.estado !== pendingStatusFilter) return false
      if (!q) return true

      return [payment.operacion, payment.deportista, payment.tutor, payment.estado, payment.proveedor, payment.fecha, formatEuro(payment.importe)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [pendingPayments, pendingSearch, pendingStatusFilter])

  const visibleFeeAssignments = useMemo(() => {
    const q = pendingSearch.trim().toLowerCase()
    if (pendingStatusFilter === 'pendiente' || pendingStatusFilter === 'fallido') return []
    return feeAssignments.filter((assignment) => {
      if (!q) return true
      return [assignment.feeName, assignment.feeType, assignment.athleteName, assignment.nextChargeDate, String(assignment.chargeDay), String(assignment.scheduledCharges)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [feeAssignments, pendingSearch, pendingStatusFilter])

  const reportMovements = useMemo(
    () =>
      financeMovements.filter((movement) => {
        if (reportSeasonFilter !== 'todos' && (movement.seasonId ?? 'sin-temporada') !== reportSeasonFilter) return false
        const q = reportSearch.trim().toLowerCase()
        if (!q) return true
        return [movement.concepto, movement.detalle, movement.categoria, movement.temporada, METHOD_LABELS[movement.metodoPago], MOVEMENT_STATUS_LABELS[movement.estado]]
          .join(' ')
          .toLowerCase()
          .includes(q)
      }),
    [financeMovements, reportSearch, reportSeasonFilter],
  )

  useEffect(() => {
    if (movementState.ok) {
      movementFormRef.current?.reset()
      setEditingMovement(null)
    }
  }, [movementState.ok, movementState.message])

  useEffect(() => {
    if (feeState.ok) {
      feeFormRef.current?.reset()
      setEditingFee(null)
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

  async function handleDeleteFee(fee: AdminFeeTemplateRow) {
    setDeletePendingId(fee.id)
    setFeeDeleteMessage(null)
    const result = await deleteFeeTemplateAction(fee.id)
    setDeletePendingId(null)
    setConfirmDeleteFeeId(null)
    setFeeDeleteMessage(result)
    if (editingFee?.id === fee.id) {
      setEditingFee(null)
      setSplitFee(false)
    }
  }

  async function handlePaymentAction(payment: AdminPaymentRow, action: 'pending' | 'cancel' | 'refund') {
    setPaymentActionId(`${payment.id}:${action}`)
    setPaymentMessage(null)
    const result =
      action === 'pending'
        ? await markPaymentPendingAction(payment.id)
        : action === 'cancel'
          ? await cancelPaymentAction(payment.id)
          : await refundStripePaymentAction(payment.id)
    setPaymentActionId(null)
    setPaymentMessage(result)
  }

  function exportPaymentsCsv() {
    downloadCsv(
      `cobros-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Operación', 'Deportista', 'Tutor', 'Importe', 'Estado', 'Proveedor', 'Fecha'],
      payments.map((payment) => [
        payment.operacion,
        payment.deportista,
        payment.tutor,
        payment.importe.toFixed(2),
        payment.estado,
        payment.proveedor,
        payment.fecha,
      ]),
    )
  }

  function exportReportCsv() {
    downloadCsv(
      `informe-contable-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Tipo', 'Concepto', 'Categoría', 'Método', 'Estado', 'Temporada', 'Importe', 'Fecha'],
      reportMovements.map((movement) => [
        movement.tipo,
        movement.concepto,
        movement.categoria,
        METHOD_LABELS[movement.metodoPago],
        MOVEMENT_STATUS_LABELS[movement.estado],
        movement.temporada,
        movement.importe.toFixed(2),
        movement.fecha,
      ]),
    )
  }

  const currentMovementType: 'ingreso' | 'gasto' = activeTab === 'gastos' ? 'gasto' : 'ingreso'
  const currentMovementCategories = getMovementCategories(editingMovement?.tipo ?? movementFormType)
  const tabMovements = financeMovements.filter((movement) => movement.tipo === currentMovementType)
  const tabMovementTotal = sumMovements(tabMovements)
  const pendingTabMovements = tabMovements.filter((movement) => movement.estado === 'pending')
  const reportIncomeTotal = sumMovements(reportMovements.filter((movement) => movement.tipo === 'ingreso'))
  const reportExpenseTotal = sumMovements(reportMovements.filter((movement) => movement.tipo === 'gasto'))
  const reportCashTotal = sumMovements(reportMovements.filter((movement) => movement.metodoPago === 'cash'))
  const reportBankTotal = sumMovements(reportMovements.filter((movement) => ['transfer', 'bizum', 'card'].includes(movement.metodoPago)))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de pagos">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'cobros', label: 'Cobros realizados' },
          { id: 'matriculas', label: 'Matrículas' },
          { id: 'cuotas', label: 'Cuotas' },
          { id: 'pendientes', label: 'Pendientes' },
          { id: 'ingresos', label: 'Ingresos' },
          { id: 'gastos', label: 'Gastos' },
          { id: 'informes', label: 'Informes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab)
              if (tab.id === 'ingresos' || tab.id === 'gastos') {
                setMovementFormType(tab.id === 'gastos' ? 'gasto' : 'ingreso')
                setEditingMovement(null)
                setConfirmDeleteMovementId(null)
              }
            }}
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
            detail="Salidas confirmadas del club"
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
            <Button variant="outline" size="sm" onClick={exportPaymentsCsv}>
              <Download className="size-4" aria-hidden="true" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-2">
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
            isLoading={false}
            emptyTitle="Sin pagos"
            emptyDescription="No hay pagos que coincidan con los filtros aplicados."
          />
          {paymentMessage?.message && paymentMessage.ok ? (
            <p
              className={cn(
                'mt-4 rounded-lg px-3 py-2 text-sm font-semibold',
                paymentMessage.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
              )}
            >
              {paymentMessage.message}
            </p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                  <th className="px-4 py-2.5">Operación</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Tutor</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5">Importe</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {payments.map((payment) => {
                  const canRefund = payment.estado === 'pagado' && payment.proveedor === 'Stripe' && Boolean(payment.stripePaymentIntentId)
                  const canRetry = payment.estado === 'fallido'
                  const canCancel = payment.estado === 'pendiente' || payment.estado === 'fallido'

                  return (
                    <tr key={payment.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{payment.operacion}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{payment.tutor}</td>
                      <td className="px-4 py-3">{payment.estado}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatEuro(payment.importe)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canRetry ? (
                            <Button type="button" size="sm" variant="outline" disabled={paymentActionId === `${payment.id}:pending`} onClick={() => handlePaymentAction(payment, 'pending')}>
                              {paymentActionId === `${payment.id}:pending` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                              Reintentar
                            </Button>
                          ) : null}
                          {canCancel ? (
                            <Button type="button" size="sm" variant="destructive" disabled={paymentActionId === `${payment.id}:cancel`} onClick={() => handlePaymentAction(payment, 'cancel')}>
                              {paymentActionId === `${payment.id}:cancel` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                              Cancelar
                            </Button>
                          ) : null}
                          {canRefund ? (
                            <Button type="button" size="sm" variant="outline" disabled={paymentActionId === `${payment.id}:refund`} onClick={() => handlePaymentAction(payment, 'refund')}>
                              {paymentActionId === `${payment.id}:refund` ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                              Reembolsar
                            </Button>
                          ) : null}
                          {!canRetry && !canCancel && !canRefund ? (
                            <span className="text-xs text-muted-foreground">Sin acciones</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
                <CardTitle className="text-lg font-black">{editingFee ? 'Editar cuota' : 'Nueva cuota'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form key={editingFee?.id ?? 'new-fee'} ref={feeFormRef} action={feeAction} className="space-y-4">
                  <input type="hidden" name="id" value={editingFee?.id ?? ''} />
                  <div>
                    <label htmlFor="fee-name" className="text-sm font-black text-foreground">
                      Nombre
                    </label>
                    <Input id="fee-name" name="nombre" className="mt-2" placeholder="Ej. Cuota mensual, campus, equipación..." defaultValue={editingFee?.nombre ?? ''} required />
                  </div>

                  <div>
                    <label htmlFor="fee-type" className="text-sm font-black text-foreground">
                      Tipo
                    </label>
                    <Input id="fee-type" name="tipo" className="mt-2" placeholder="Ej. Socio, deportista, campaña..." defaultValue={editingFee?.tipo ?? ''} required />
                  </div>

                  <div>
                    <label htmlFor="fee-amount" className="text-sm font-black text-foreground">
                      Precio total
                    </label>
                    <Input id="fee-amount" name="importe" type="number" min="0.01" step="0.01" className="mt-2" placeholder="0,00" defaultValue={editingFee ? String(editingFee.importe) : ''} required />
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                    <input type="checkbox" name="isPublic" className="size-4 accent-primary" defaultChecked={editingFee?.isPublic ?? true} />
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
                          defaultValue={editingFee?.chargeFrequency || 'cada_mes'}
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
                        <Input id="fee-count" name="chargeCount" type="number" min="2" step="1" className="mt-2" placeholder="12" defaultValue={editingFee?.chargeCount ?? ''} required />
                      </div>
                    </div>
                  ) : null}

                  {feeState.message && feeState.ok ? (
                    <p
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm font-semibold',
                        feeState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      {feeState.message}
                    </p>
                  ) : null}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {editingFee ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={feePending}
                        onClick={() => {
                          setEditingFee(null)
                          setSplitFee(false)
                        }}
                      >
                        <X className="size-4" aria-hidden="true" />
                        Cancelar
                      </Button>
                    ) : null}
                    <Button type="submit" className={editingFee ? '' : 'sm:col-span-2'} disabled={feePending}>
                      {feePending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : editingFee ? <Pencil className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                      {editingFee ? 'Guardar cambios' : 'Guardar cuota'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Tags className="size-3.5" aria-hidden="true" />
                  Configuradas
                </span>
              </div>

              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={feeSearch}
                    onChange={(event) => setFeeSearch(event.target.value)}
                    placeholder="Buscar por nombre, tipo, importe o frecuencia"
                    className="pl-9"
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <select value={feeTypeFilter} onChange={(event) => setFeeTypeFilter(event.target.value)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                    <option value="todos">Todos los tipos</option>
                    {feeTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select value={feeVisibilityFilter} onChange={(event) => setFeeVisibilityFilter(event.target.value as typeof feeVisibilityFilter)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                    <option value="todos">Públicas y privadas</option>
                    <option value="publica">Solo públicas</option>
                    <option value="privada">Solo privadas</option>
                  </select>
                  <select value={feeSplitFilter} onChange={(event) => setFeeSplitFilter(event.target.value as typeof feeSplitFilter)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                    <option value="todos">Todos los pagos</option>
                    <option value="unico">Pago único</option>
                    <option value="repartido">Pago repartido</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                {feeDeleteMessage?.message && feeDeleteMessage.ok ? (
                  <p
                    className={cn(
                      'mb-3 rounded-lg px-3 py-2 text-sm font-semibold',
                      feeDeleteMessage.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                    )}
                  >
                    {feeDeleteMessage.message}
                  </p>
                ) : null}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                      <th className="px-4 py-2.5">Nombre</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Importe</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Reparto</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {visibleFeeTemplates.length === 0 ? (
                      <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No hay cuotas que coincidan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      visibleFeeTemplates.map((fee) => (
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
                          <td className="px-4 py-3 text-right">
                            {confirmDeleteFeeId === fee.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletePendingId === fee.id}
                                  onClick={() => handleDeleteFee(fee)}
                                >
                                  {deletePendingId === fee.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
                                  Sí, eliminar
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteFeeId(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Editar ${fee.nombre}`}
                                  onClick={() => {
                                    setEditingFee(fee)
                                    setSplitFee(fee.splitPayment)
                                    setConfirmDeleteFeeId(null)
                                  }}
                                >
                                  <Pencil className="size-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  aria-label={`Eliminar ${fee.nombre}`}
                                  disabled={deletePendingId === fee.id}
                                  onClick={() => setConfirmDeleteFeeId(fee.id)}
                                >
                                  {deletePendingId === fee.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
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
        </section>
      ) : null}

      {activeTab === 'pendientes' ? (
        <section aria-labelledby="pagos-pendientes" className="space-y-5" role="tabpanel">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Seguimiento de cobros
            </p>
            <h2 id="pagos-pendientes" className="mt-2 text-2xl font-black tracking-tight text-foreground">
              Pendientes de cobro
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              title="Pagos pendientes"
              value={formatEuro(summary.pendingTotal)}
              detail={`${summary.pending.length} operación${summary.pending.length !== 1 ? 'es' : ''} pendiente${summary.pending.length !== 1 ? 's' : ''}`}
              icon={CreditCard}
              tone="amber"
            />
            <SummaryCard
              title="Cuotas programadas"
              value={String(feeAssignments.reduce((sum, assignment) => sum + assignment.scheduledCharges, 0))}
              detail={`${feeAssignments.length} asignación${feeAssignments.length !== 1 ? 'es' : ''} activa${feeAssignments.length !== 1 ? 's' : ''}`}
              icon={Tags}
              tone="blue"
            />
            <SummaryCard
              title="Fallidos"
              value={String(summary.failed.length)}
              detail="Operaciones que requieren revisión"
              icon={ShieldAlert}
              tone="amber"
            />
          </div>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  value={pendingSearch}
                  onChange={(event) => setPendingSearch(event.target.value)}
                  placeholder="Buscar por operación, tutor, cuota, fecha o importe"
                  className="pl-9"
                />
              </div>
              <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value as typeof pendingStatusFilter)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="todos">Todos los pendientes</option>
                <option value="pendiente">Pagos pendientes</option>
                <option value="fallido">Pagos fallidos</option>
                <option value="programada">Cuotas programadas</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="bg-white/88 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-black">Pagos pendientes o fallidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                        <th className="px-4 py-2.5">Operación</th>
                        <th className="px-4 py-2.5">Tutor</th>
                        <th className="px-4 py-2.5">Importe</th>
                        <th className="px-4 py-2.5">Estado</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                      {visiblePendingPayments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                            No hay pagos que coincidan con los filtros.
                          </td>
                        </tr>
                      ) : (
                        visiblePendingPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 font-semibold">{payment.operacion}</td>
                            <td className="px-4 py-3 text-muted-foreground">{payment.tutor}</td>
                            <td className="px-4 py-3 font-semibold">{formatEuro(payment.importe)}</td>
                            <td className="px-4 py-3">
                              <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', payment.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>
                                {payment.estado}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/88 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-black">Cuotas asignadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleFeeAssignments.length === 0 ? (
                  <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay cuotas programadas que coincidan con los filtros.
                  </p>
                ) : (
                  visibleFeeAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-lg border border-border bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-black text-foreground">{assignment.feeName}</p>
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                            {assignment.athleteName}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                          Próximo: {assignment.nextChargeDate}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {assignment.scheduledCharges} pendientes · {assignment.paidCharges} pagados · día {assignment.chargeDay}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {activeTab === 'informes' ? (
        <section aria-labelledby="pagos-informes" className="space-y-5" role="tabpanel">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                Revisión de directiva
              </p>
              <h2 id="pagos-informes" className="mt-2 text-2xl font-black tracking-tight text-foreground">
                Informes
              </h2>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={exportReportCsv}>
              <Download className="size-4" aria-hidden="true" />
              Exportar informe
            </Button>
          </div>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Buscar en informes por concepto, categoría, método o temporada"
                  className="pl-9"
                />
              </div>
              <select value={reportSeasonFilter} onChange={(event) => setReportSeasonFilter(event.target.value)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                <option value="todos">Todas las temporadas</option>
                <option value="sin-temporada">Sin temporada</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <SummaryCard title="Efectivo" value={formatEuro(reportCashTotal)} detail="Movimientos confirmados filtrados" icon={Wallet} tone="green" />
            <SummaryCard title="Banco / Bizum" value={formatEuro(reportBankTotal)} detail="Transferencia, Bizum y tarjeta" icon={Landmark} tone="blue" />
            <SummaryCard title="Stripe cobrado" value={formatEuro(summary.stripeTotal)} detail="Cobros confirmados por plataforma" icon={CreditCard} tone="blue" />
            <SummaryCard title="Balance filtrado" value={formatEuro(reportIncomeTotal - reportExpenseTotal)} detail="Ingresos menos gastos filtrados" icon={BarChart3} tone={reportIncomeTotal - reportExpenseTotal >= 0 ? 'green' : 'amber'} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {[
              {
                title: 'Ingresos por categoría',
                rows: INCOME_CATEGORIES.map((category) => ({
                  label: category,
                  value: sumMovements(reportMovements.filter((movement) => movement.tipo === 'ingreso' && movement.categoria === category)),
                })),
              },
              {
                title: 'Gastos por categoría',
                rows: EXPENSE_CATEGORIES.map((category) => ({
                  label: category,
                  value: sumMovements(reportMovements.filter((movement) => movement.tipo === 'gasto' && movement.categoria === category)),
                })),
              },
              {
                title: 'Movimientos por temporada',
                rows: seasons
                  .filter((season) => reportSeasonFilter === 'todos' || reportSeasonFilter === season.id)
                  .map((season) => ({
                  label: season.nombre,
                  value:
                    sumMovements(reportMovements.filter((movement) => movement.tipo === 'ingreso' && movement.seasonId === season.id)) -
                    sumMovements(reportMovements.filter((movement) => movement.tipo === 'gasto' && movement.seasonId === season.id)),
                })),
              },
            ].map((block) => (
              <Card key={block.title} className="bg-white/88 shadow-sm backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-black">{block.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {block.rows.filter((row) => row.value !== 0).length === 0 ? (
                    <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
                  ) : (
                    block.rows.filter((row) => row.value !== 0).map((row) => (
                      <div key={row.label}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-foreground">{row.label}</span>
                          <span className="font-black text-foreground">{formatEuro(row.value)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(8, Math.abs(row.value) / Math.max(1, Math.abs(summary.confirmedIncomeTotal), Math.abs(summary.manualExpenseTotal)) * 100))}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {(activeTab === 'ingresos' || activeTab === 'gastos') ? (
      <section aria-labelledby="pagos-movimientos" className="space-y-5" role="tabpanel">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
            {currentMovementType === 'ingreso' ? 'Entradas del club' : 'Salidas del club'}
          </p>
          <h2 id="pagos-movimientos" className="mt-2 text-2xl font-black tracking-tight text-foreground">
            {currentMovementType === 'ingreso' ? 'Ingresos' : 'Gastos'}
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            title={currentMovementType === 'ingreso' ? 'Ingresos confirmados' : 'Gastos confirmados'}
            value={formatEuro(tabMovementTotal)}
            detail="Movimientos confirmados"
            icon={currentMovementType === 'ingreso' ? TrendingUp : TrendingDown}
            tone={currentMovementType === 'ingreso' ? 'green' : 'amber'}
          />
          <SummaryCard
            title="Pendientes"
            value={formatEuro(pendingTabMovements.reduce((sum, movement) => sum + movement.importe, 0))}
            detail="Pendiente de revisión"
            icon={ShieldAlert}
            tone="amber"
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
                <input type="hidden" name="tipo" value={editingMovement?.tipo ?? movementFormType} />
                <div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                    {editingMovement?.tipo ?? movementFormType}
                  </span>
                </div>

                <div>
                  <label htmlFor="categoria" className="text-sm font-black text-foreground">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    defaultValue={editingMovement?.categoria ?? currentMovementCategories[0]}
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {currentMovementCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="metodoPago" className="text-sm font-black text-foreground">
                      Método de pago
                    </label>
                    <select
                      id="metodoPago"
                      name="metodoPago"
                      defaultValue={editingMovement?.metodoPago ?? 'cash'}
                      className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="estado" className="text-sm font-black text-foreground">
                      Estado
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      defaultValue={editingMovement?.estado ?? 'confirmed'}
                      className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {Object.entries(MOVEMENT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="seasonId" className="text-sm font-black text-foreground">
                    Temporada
                  </label>
                  <select
                    id="seasonId"
                    name="seasonId"
                    defaultValue={editingMovement?.seasonId ?? ''}
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Sin temporada</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="justificanteUrl" className="text-sm font-black text-foreground">
                    Justificante <span className="font-semibold text-muted-foreground">(opcional)</span>
                  </label>
                  <Input
                    id="justificanteUrl"
                    name="justificanteUrl"
                    type="url"
                    placeholder="https://..."
                    className="mt-2"
                    defaultValue={editingMovement?.justificanteUrl ?? ''}
                  />
                </div>

                {movementState.message && movementState.ok ? (
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ReceiptText className="size-3.5" aria-hidden="true" />
                Tesorería
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
                    placeholder="Buscar por concepto, detalle, categoría, método o fecha"
                    value={movementSearch}
                    onChange={(event) => setMovementSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <select value={movementCategoryFilter} onChange={(event) => setMovementCategoryFilter(event.target.value)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="todos">Todas las categorías</option>
                  {getMovementCategories(currentMovementType).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select value={movementMethodFilter} onChange={(event) => setMovementMethodFilter(event.target.value as typeof movementMethodFilter)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="todos">Todos los métodos</option>
                  {Object.entries(METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select value={movementStatusFilter} onChange={(event) => setMovementStatusFilter(event.target.value as typeof movementStatusFilter)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="todos">Todos los estados</option>
                  {Object.entries(MOVEMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <select value={movementSeasonFilter} onChange={(event) => setMovementSeasonFilter(event.target.value)} className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="todos">Todas las temporadas</option>
                  <option value="sin-temporada">Sin temporada</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>{season.nombre}</option>
                  ))}
                </select>
              </div>

              {(deleteMessage?.ok || deletePendingId) ? (
                <p
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold',
                    'bg-emerald-100 text-emerald-700',
                  )}
                >
                  {deletePendingId ? 'Eliminando movimiento...' : deleteMessage?.message}
                </p>
              ) : null}

              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                      <th className="px-4 py-2.5">Concepto</th>
                      <th className="px-4 py-2.5">Categoría</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Método</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="hidden px-4 py-2.5 md:table-cell">Detalle</th>
                      <th className="px-4 py-2.5">Importe</th>
                      <th className="hidden px-4 py-2.5 xl:table-cell">Temporada</th>
                      <th className="hidden px-4 py-2.5 lg:table-cell">Fecha</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {visibleMovements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          Aún no hay movimientos que coincidan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      visibleMovements.map((movement) => (
                        <tr key={movement.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold text-foreground">{movement.concepto}</td>
                          <td className="px-4 py-3 text-muted-foreground">{movement.categoria}</td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{METHOD_LABELS[movement.metodoPago]}</td>
                          <td className="px-4 py-3">
                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', MOVEMENT_STATUS_STYLES[movement.estado])}>
                              {MOVEMENT_STATUS_LABELS[movement.estado]}
                            </span>
                          </td>
                          <td className="hidden max-w-xs px-4 py-3 text-muted-foreground md:table-cell">
                            <span className="line-clamp-2">{movement.detalle || '—'}</span>
                            {movement.justificanteUrl ? (
                              <a href={movement.justificanteUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-primary">
                                <FileText className="size-3" />
                                Justificante
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {formatEuro(movement.importe)}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                            {movement.temporada}
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
                                onClick={() => {
                                  setEditingMovement(movement)
                                  setMovementFormType(movement.tipo)
                                }}
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
      <AdminErrorDialog
        message={
          (paymentMessage?.message && !paymentMessage.ok ? paymentMessage.message : null) ??
          (feeState.message && !feeState.ok ? feeState.message : null) ??
          (feeDeleteMessage?.message && !feeDeleteMessage.ok ? feeDeleteMessage.message : null) ??
          (movementState.message && !movementState.ok ? movementState.message : null) ??
          (deleteMessage?.message && !deleteMessage.ok ? deleteMessage.message : null)
        }
        onClose={() => {
          setPaymentMessage(null)
          setFeeDeleteMessage(null)
          setDeleteMessage(null)
        }}
      />
    </div>
  )
}
