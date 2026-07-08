'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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
import type { AdminAthleteRow, AdminEnrollmentRow, AdminFeeTemplateRow, AdminFinanceMovementRow, AdminPaymentRow, AdminSeasonRow, AdminTutorFeeAssignmentRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { MatriculasClient } from '../matriculas/matriculas-client'
import {
  assignAthleteFeeAction,
  createFinanceMovementAction,
  createFeeTemplateAction,
  cancelPaymentAction,
  deleteFeeTemplateAction,
  deleteFinanceMovementAction,
  markPaymentPendingAction,
  refundStripePaymentAction,
  type AthleteFeeAssignmentState,
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
  athletes: AdminAthleteRow[]
}

type PaymentsTab = 'resumen' | 'cobros' | 'matriculas' | 'cuotas' | 'programadas' | 'pendientes' | 'ingresos' | 'gastos' | 'informes'

const TAB_GROUPS: Array<{
  title: string
  description: string
  tone: 'blue' | 'green' | 'amber'
  tabs: Array<{ id: PaymentsTab; label: string }>
}> = [
  {
    title: 'Vista general',
    description: 'Foto rápida del dinero cobrado, pendiente y balance.',
    tone: 'blue',
    tabs: [{ id: 'resumen', label: 'Resumen' }],
  },
  {
    title: 'Cobros a familias',
    description: 'Pagos reales de matrículas y socios vinculados a tutores/deportistas.',
    tone: 'green',
    tabs: [
      { id: 'cobros', label: 'Cobros realizados' },
      { id: 'matriculas', label: 'Matrículas' },
      { id: 'pendientes', label: 'Pendientes' },
    ],
  },
  {
    title: 'Cuotas de deportistas',
    description: 'Plantillas de cuota y cargos programados para asignar a jugadores.',
    tone: 'amber',
    tabs: [
      { id: 'cuotas', label: 'Cuotas configuradas' },
      { id: 'programadas', label: 'Cuotas programadas' },
    ],
  },
  {
    title: 'Contabilidad del club',
    description: 'Ingresos y gastos manuales que completan el balance contable.',
    tone: 'blue',
    tabs: [
      { id: 'ingresos', label: 'Ingresos manuales' },
      { id: 'gastos', label: 'Gastos manuales' },
      { id: 'informes', label: 'Informes' },
    ],
  },
]

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
const initialFeeAssignmentState: AthleteFeeAssignmentState = { ok: false, message: '' }

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

const ASSIGNMENT_SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function AssignmentStep({
  step,
  title,
  description,
  children,
}: {
  step: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">
          {step}
        </span>
        <div>
          <p className="text-sm font-black text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function AssignmentMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'amber' | 'green' | 'blue'
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2',
        tone === 'amber' && 'bg-amber-50',
        tone === 'green' && 'bg-emerald-50',
        tone === 'blue' && 'bg-primary/5',
      )}
    >
      <p
        className={cn(
          'text-xl font-black',
          tone === 'amber' && 'text-amber-700',
          tone === 'green' && 'text-emerald-700',
          tone === 'blue' && 'text-primary',
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'text-[0.68rem] font-black uppercase',
          tone === 'amber' && 'text-amber-700/70',
          tone === 'green' && 'text-emerald-700/70',
          tone === 'blue' && 'text-primary/70',
        )}
      >
        {label}
      </p>
    </div>
  )
}

function FeeFormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Tags
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MovementField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-black text-foreground">{label}</span>
      {children}
    </label>
  )
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

export function AdminPaymentsClient({ payments, financeMovements, enrollments, feeTemplates, seasons, feeAssignments, athletes }: AdminPaymentsClientProps) {
  const [activeTab, setActiveTab] = useState<PaymentsTab>('resumen')
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
  const [assignmentAthleteFilter, setAssignmentAthleteFilter] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const [pendingStatusFilter, setPendingStatusFilter] = useState<'todos' | 'pendiente' | 'fallido'>('todos')
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
  const [feeAssignmentState, feeAssignmentAction, feeAssignmentPending] = useActionState(
    assignAthleteFeeAction,
    initialFeeAssignmentState,
  )
  const movementFormRef = useRef<HTMLFormElement>(null)
  const feeFormRef = useRef<HTMLFormElement>(null)
  const assignmentFormRef = useRef<HTMLFormElement>(null)

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

  const assignableAthletes = useMemo(() => {
    const q = assignmentAthleteFilter.trim().toLowerCase()
    return athletes
      .filter((athlete) => athlete.guardianId)
      .filter((athlete) => {
        if (!q) return true
        return [
          athlete.nombre,
          athlete.tutor,
          athlete.categoriaSolicitada,
          athlete.equipoAsignado,
          athlete.temporada,
          athlete.estadoMatricula,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
  }, [athletes, assignmentAthleteFilter])

  const pendingPayments = useMemo(() => [...summary.pending, ...summary.failed], [summary.failed, summary.pending])

  const visiblePendingPayments = useMemo(() => {
    const q = pendingSearch.trim().toLowerCase()
    return pendingPayments.filter((payment) => {
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
    return feeAssignments.filter((assignment) => {
      if (!q) return true
      return [assignment.feeName, assignment.feeType, assignment.athleteName, assignment.nextChargeDate, String(assignment.chargeDay), String(assignment.scheduledCharges)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [feeAssignments, pendingSearch])

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

  useEffect(() => {
    if (feeAssignmentState.ok) {
      assignmentFormRef.current?.reset()
      setAssignmentAthleteFilter('')
    }
  }, [feeAssignmentState.ok, feeAssignmentState.message])

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
  const visibleMovementTotal = sumMovements(visibleMovements)
  const visibleMovementPendingTotal = visibleMovements
    .filter((movement) => movement.estado === 'pending')
    .reduce((sum, movement) => sum + movement.importe, 0)
  const reportIncomeTotal = sumMovements(reportMovements.filter((movement) => movement.tipo === 'ingreso'))
  const reportExpenseTotal = sumMovements(reportMovements.filter((movement) => movement.tipo === 'gasto'))
  const reportBalance = reportIncomeTotal - reportExpenseTotal
  const reportCashTotal = sumMovements(reportMovements.filter((movement) => movement.metodoPago === 'cash'))
  const reportBankTotal = sumMovements(reportMovements.filter((movement) => ['transfer', 'bizum', 'card'].includes(movement.metodoPago)))
  const reportConfirmedCount = reportMovements.filter((movement) => movement.estado === 'confirmed').length
  const reportPendingTotal = reportMovements
    .filter((movement) => movement.estado === 'pending')
    .reduce((sum, movement) => sum + movement.importe, 0)
  const activeGroup = TAB_GROUPS.find((group) => group.tabs.some((tab) => tab.id === activeTab))
  const publicFeeTemplates = feeTemplates.filter((fee) => fee.isPublic)
  const splitFeeTemplates = feeTemplates.filter((fee) => fee.splitPayment)
  const activeFeeAssignments = feeAssignments.filter((assignment) => assignment.status === 'active')

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Mapa del módulo
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Cobros, cuotas y contabilidad separados
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
              Los cobros son operaciones reales a familias; las cuotas son plantillas y cargos
              programados para deportistas; la contabilidad recoge movimientos manuales del club.
            </p>
          </div>
          {activeGroup ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
              {activeGroup.title}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-4" role="tablist" aria-label="Secciones de cuotas y contabilidad">
          {TAB_GROUPS.map((group) => (
            <div
              key={group.title}
              className={cn(
                'rounded-lg border p-3',
                group.tabs.some((tab) => tab.id === activeTab)
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-white',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 size-2.5 shrink-0 rounded-full',
                    group.tone === 'green' && 'bg-emerald-500',
                    group.tone === 'amber' && 'bg-amber-500',
                    group.tone === 'blue' && 'bg-primary',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-black text-foreground">{group.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
                    {group.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      if (tab.id === 'ingresos' || tab.id === 'gastos') {
                        setMovementFormType(tab.id === 'gastos' ? 'gasto' : 'ingreso')
                        setEditingMovement(null)
                        setConfirmDeleteMovementId(null)
                      }
                    }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-black uppercase transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white text-muted-foreground ring-1 ring-foreground/10 hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeTab === 'resumen' ? (
      <section aria-labelledby="pagos-resumen" className="space-y-5" role="tabpanel">
        <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Vista general
            </p>
            <h2 id="pagos-resumen" className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Resumen financiero del módulo
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
              Cobros a familias
            </p>
            <h2 id="pagos-historico" className="mt-2 text-2xl font-black tracking-tight text-foreground">
              Cobros realizados y pasarela de pago
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                Cuotas de deportistas
              </p>
              <h2 id="pagos-cuotas" className="mt-2 text-2xl font-black tracking-tight text-foreground">
                Plantillas de cuotas
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
                Define importes reutilizables para después asignarlos a deportistas o familias. Las
                cuotas no son cobros por sí mismas hasta que se programan/asignan.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('programadas')}>
              <Tags className="size-4" aria-hidden="true" />
              Ver asignaciones
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <SummaryCard
              title="Plantillas"
              value={String(feeTemplates.length)}
              detail={`${visibleFeeTemplates.length} visibles con los filtros actuales`}
              icon={Tags}
              tone="blue"
            />
            <SummaryCard
              title="Públicas"
              value={String(publicFeeTemplates.length)}
              detail="Disponibles para flujos visibles o reutilizables"
              icon={ShieldAlert}
              tone="green"
            />
            <SummaryCard
              title="Fraccionadas"
              value={String(splitFeeTemplates.length)}
              detail="Repartidas en varios cargos"
              icon={CreditCard}
              tone="amber"
            />
            <SummaryCard
              title="Asignaciones"
              value={String(activeFeeAssignments.length)}
              detail="Cuotas activas vinculadas a deportistas/familias"
              icon={ReceiptText}
              tone="green"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
            <Card className="bg-white/88 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-black">{editingFee ? 'Editar plantilla' : 'Nueva plantilla'}</CardTitle>
                <p className="text-sm font-semibold leading-6 text-muted-foreground">
                  Crea el modelo de cuota: nombre, tipo, importe y forma de pago. La asignación al
                  deportista se gestiona aparte.
                </p>
              </CardHeader>
              <CardContent>
                <form key={editingFee?.id ?? 'new-fee'} ref={feeFormRef} action={feeAction} className="space-y-4">
                  <input type="hidden" name="id" value={editingFee?.id ?? ''} />
                  <FeeFormSection
                    title="Datos de la cuota"
                    description="Nombre interno, clasificación y precio total antes de posibles descuentos."
                    icon={Tags}
                  >
                    <div className="grid gap-3">
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
                    </div>
                  </FeeFormSection>

                  <FeeFormSection
                    title="Visibilidad"
                    description="Controla si esta plantilla queda disponible como opción reutilizable."
                    icon={ShieldAlert}
                  >
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-semibold">
                      <input type="checkbox" name="isPublic" className="mt-0.5 size-4 accent-primary" defaultChecked={editingFee?.isPublic ?? true} />
                      <span>
                        <span className="block font-black text-foreground">Plantilla pública</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                          Visible en los flujos administrativos donde se seleccionan cuotas.
                        </span>
                      </span>
                    </label>
                  </FeeFormSection>

                  <FeeFormSection
                    title="Fraccionamiento"
                    description="Decide si se cobra de una vez o se reparte en varios cargos programados."
                    icon={CreditCard}
                  >
                    <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name="splitPayment"
                        className="mt-0.5 size-4 accent-primary"
                        checked={splitFee}
                        onChange={(event) => setSplitFee(event.target.checked)}
                      />
                      <span>
                        <span className="block font-black text-foreground">Repartir pago en varios cargos</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                          Si lo desactivas, se generará un único cargo al asignar esta cuota.
                        </span>
                      </span>
                    </label>

                    {splitFee ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    ) : (
                      <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                        Pago único: al asignarla se programará un solo cargo.
                      </p>
                    )}
                  </FeeFormSection>

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
                      {editingFee ? 'Guardar cambios' : 'Guardar plantilla'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black tracking-tight text-foreground">
                    Plantillas registradas
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                    Catálogo de cuotas que luego pueden convertirse en cargos programados.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Tags className="size-3.5" aria-hidden="true" />
                  {visibleFeeTemplates.length} de {feeTemplates.length}
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

              <div className="space-y-3">
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
                {visibleFeeTemplates.length === 0 ? (
                  <p className="rounded-xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">
                    No hay cuotas que coincidan con los filtros.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {visibleFeeTemplates.map((fee) => (
                      <div key={fee.id} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', fee.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                                {fee.isPublic ? 'Pública' : 'Privada'}
                              </span>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                                {fee.tipo}
                              </span>
                            </div>
                            <p className="mt-3 text-lg font-black leading-tight text-foreground">{fee.nombre}</p>
                            <p className="mt-1 text-sm font-semibold text-muted-foreground">
                              {fee.splitPayment ? `${fee.chargeCount} cargos · ${fee.chargeFrequency}` : 'Pago único'}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Importe
                            </p>
                            <p className="mt-1 text-2xl font-black text-foreground">{formatEuro(fee.importe)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {fee.splitPayment
                              ? 'Al asignarla se crearán cargos programados según esta frecuencia.'
                              : 'Al asignarla se creará un único cargo programado.'}
                          </p>
                          {confirmDeleteFeeId === fee.id ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
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
                                variant="outline"
                                size="sm"
                                aria-label={`Editar ${fee.nombre}`}
                                onClick={() => {
                                  setEditingFee(fee)
                                  setSplitFee(fee.splitPayment)
                                  setConfirmDeleteFeeId(null)
                                }}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                                Editar
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              Pagos pendientes y fallidos
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
              Revisa operaciones reales que aún no se han cobrado o han fallado. Las cuotas ya
              asignadas viven ahora en su propia pestaña de cuotas programadas.
            </p>
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-foreground">Filtro común</p>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Solo pagos reales pendientes/fallidos
              </span>
            </div>
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
                <option value="todos">Todos los pagos</option>
                <option value="pendiente">Pagos pendientes</option>
                <option value="fallido">Pagos fallidos</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="bg-white/88 shadow-sm backdrop-blur">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-black">Pagos pendientes o fallidos</CardTitle>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                      Operaciones de pago ya generadas que necesitan confirmación, reintento o revisión.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
                    {visiblePendingPayments.length} visibles
                  </span>
                </div>
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
          </div>
        </section>
      ) : null}

      {activeTab === 'programadas' ? (
        <section aria-labelledby="pagos-programadas" className="space-y-5" role="tabpanel">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                Cuotas de deportistas
              </p>
              <h2 id="pagos-programadas" className="mt-2 text-2xl font-black tracking-tight text-foreground">
                Cuotas programadas
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
                Asignaciones activas vinculadas a deportistas o familias. Aquí se revisan los
                próximos cargos, los pagos ya completados y el día programado de cobro.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('cuotas')}>
              <Tags className="size-4" aria-hidden="true" />
              Ver plantillas
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              title="Asignaciones activas"
              value={String(feeAssignments.length)}
              detail="Cuotas vinculadas a deportistas/familias"
              icon={Tags}
              tone="blue"
            />
            <SummaryCard
              title="Cargos pendientes"
              value={String(feeAssignments.reduce((sum, assignment) => sum + assignment.scheduledCharges, 0))}
              detail="Cargos programados todavía no pagados"
              icon={CreditCard}
              tone="amber"
            />
            <SummaryCard
              title="Cargos pagados"
              value={String(feeAssignments.reduce((sum, assignment) => sum + assignment.paidCharges, 0))}
              detail="Cargos completados dentro de estas asignaciones"
              icon={ReceiptText}
              tone="green"
            />
          </div>

          <Card className="border-amber-100 bg-amber-50/60 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Administración
                  </p>
                  <CardTitle className="mt-1 text-lg font-black">Asignar cuota a deportista</CardTitle>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                    La cuota se vincula al jugador, pero el cobro se programa al tutor pagador asignado.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                  {assignableAthletes.length} deportistas con tutor
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <form ref={assignmentFormRef} action={feeAssignmentAction} className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-3">
                  <AssignmentStep
                    step="1"
                    title="Deportista y tutor"
                    description="Solo aparecen jugadores con tutor, porque el cobro se hace a la familia."
                  >
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="assignment-athlete-filter" className="text-sm font-black text-foreground">
                          Buscar deportista
                        </label>
                        <div className="relative mt-2">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="assignment-athlete-filter"
                            type="search"
                            value={assignmentAthleteFilter}
                            onChange={(event) => setAssignmentAthleteFilter(event.target.value)}
                            placeholder="Jugador, tutor, equipo o categoría"
                            className="bg-white pl-9"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="assignment-athlete" className="text-sm font-black text-foreground">
                          Deportista
                        </label>
                        <select id="assignment-athlete" name="athleteId" className={cn('mt-2', ASSIGNMENT_SELECT_CLASS)} required>
                          <option value="">Selecciona deportista</option>
                          {assignableAthletes.map((athlete) => (
                            <option key={athlete.id} value={athlete.id}>
                              {athlete.nombre} · {athlete.tutor} · {athlete.equipoAsignado}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AssignmentStep>

                  <AssignmentStep
                    step="2"
                    title="Cuota"
                    description="Elige una plantilla ya configurada. Aquí no se crea la cuota, se programa."
                  >
                    <label htmlFor="assignment-fee-template" className="text-sm font-black text-foreground">
                      Plantilla de cuota
                    </label>
                    <select id="assignment-fee-template" name="feeTemplateId" className={cn('mt-2', ASSIGNMENT_SELECT_CLASS)} required>
                      <option value="">Selecciona cuota</option>
                      {feeTemplates.map((fee) => (
                        <option key={fee.id} value={fee.id}>
                          {fee.nombre} · {formatEuro(fee.importe)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                      Si la matrícula ya está pagada, se descuenta automáticamente del importe programado.
                    </p>
                  </AssignmentStep>

                  <AssignmentStep
                    step="3"
                    title="Calendario de cobro"
                    description="Define cuándo empieza y qué día del mes se intentará cobrar."
                  >
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label htmlFor="assignment-start-month" className="text-sm font-black text-foreground">
                          Mes de inicio
                        </label>
                        <Input id="assignment-start-month" name="startMonth" type="month" className="mt-2 bg-white" required />
                      </div>
                      <div>
                        <label htmlFor="assignment-charge-day" className="text-sm font-black text-foreground">
                          Día de cargo
                        </label>
                        <select id="assignment-charge-day" name="chargeDay" className={cn('mt-2', ASSIGNMENT_SELECT_CLASS)} defaultValue="1" required>
                          {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                            <option key={day} value={day}>
                              Día {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AssignmentStep>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Revisa la selección antes de programar: se crearán los cargos y se intentará sincronizar con Stripe.
                  </p>
                  <Button type="submit" disabled={feeAssignmentPending || feeTemplates.length === 0 || assignableAthletes.length === 0} className="w-full bg-amber-600 text-white hover:bg-amber-700 sm:w-auto">
                    {feeAssignmentPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    Programar cuota
                  </Button>
                </div>

                {feeAssignmentState.message && feeAssignmentState.ok ? (
                  <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                    {feeAssignmentState.message}
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-foreground">Buscar asignaciones</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {visibleFeeAssignments.length} visibles
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={pendingSearch}
                onChange={(event) => setPendingSearch(event.target.value)}
                placeholder="Buscar por cuota, tipo, deportista, fecha o día de cargo"
                className="pl-9"
              />
            </div>
          </div>

          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black">Asignaciones con cargos futuros</CardTitle>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                    Cada tarjeta representa una cuota ya asignada. Las plantillas se gestionan en
                    `Cuotas configuradas`.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                  {visibleFeeAssignments.length} visibles
                </span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {visibleFeeAssignments.length === 0 ? (
                <p className="rounded-lg bg-muted px-3 py-8 text-center text-sm text-muted-foreground">
                  No hay cuotas programadas que coincidan con la búsqueda.
                </p>
              ) : (
                visibleFeeAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black uppercase text-primary">
                            {assignment.status === 'active' ? 'Activa' : assignment.status}
                          </span>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
                            Próximo: {assignment.nextChargeDate}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-black leading-tight text-foreground">{assignment.athleteName}</p>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                          Deportista con cuota programada
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/40 px-3 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Cuota
                        </p>
                        <p className="mt-1 font-black text-foreground">{assignment.feeName}</p>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">{assignment.feeType}</p>
                        <p className="mt-2 text-sm font-black text-foreground">{formatEuro(assignment.totalAmount)}</p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3 xl:min-w-96">
                        <AssignmentMetric label="Pendientes" value={assignment.scheduledCharges} tone="amber" />
                        <AssignmentMetric label="Pagados" value={assignment.paidCharges} tone="green" />
                        <AssignmentMetric label="Día cargo" value={assignment.chargeDay} tone="blue" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === 'informes' ? (
        <section aria-labelledby="pagos-informes" className="space-y-5" role="tabpanel">
          <div className="rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Revisión de directiva
                </p>
                <h2 id="pagos-informes" className="mt-2 text-2xl font-black tracking-tight text-foreground">
                  Informes contables
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                  Lectura rápida de ingresos, gastos y balance filtrado por temporada, método, categoría o concepto.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={exportReportCsv}>
                <Download className="size-4" aria-hidden="true" />
                Exportar informe
              </Button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_340px]">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Ingresos filtrados</p>
                  <p className="mt-2 text-2xl font-black text-emerald-700">{formatEuro(reportIncomeTotal)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700/70">Gastos filtrados</p>
                  <p className="mt-2 text-2xl font-black text-amber-700">{formatEuro(reportExpenseTotal)}</p>
                </div>
                <div className={cn('rounded-xl p-4', reportBalance >= 0 ? 'bg-primary/5' : 'bg-rose-50')}>
                  <p className={cn('text-xs font-black uppercase tracking-[0.16em]', reportBalance >= 0 ? 'text-primary/70' : 'text-rose-700/70')}>Balance</p>
                  <p className={cn('mt-2 text-2xl font-black', reportBalance >= 0 ? 'text-primary' : 'text-rose-700')}>{formatEuro(reportBalance)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Alcance del informe</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {reportConfirmedCount} movimientos confirmados y {formatEuro(reportPendingTotal)} pendiente de confirmar.
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {reportMovements.length} movimientos coinciden con los filtros actuales.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_240px]">
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
            <SummaryCard title="Balance filtrado" value={formatEuro(reportBalance)} detail="Ingresos menos gastos filtrados" icon={BarChart3} tone={reportBalance >= 0 ? 'green' : 'amber'} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {[
              {
                title: 'Ingresos por categoría',
                tone: 'green' as const,
                rows: INCOME_CATEGORIES.map((category) => ({
                  label: category,
                  value: sumMovements(reportMovements.filter((movement) => movement.tipo === 'ingreso' && movement.categoria === category)),
                })),
              },
              {
                title: 'Gastos por categoría',
                tone: 'amber' as const,
                rows: EXPENSE_CATEGORIES.map((category) => ({
                  label: category,
                  value: sumMovements(reportMovements.filter((movement) => movement.tipo === 'gasto' && movement.categoria === category)),
                })),
              },
              {
                title: 'Movimientos por temporada',
                tone: 'blue' as const,
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
                  <CardTitle className="flex items-center gap-2 text-lg font-black">
                    <span
                      className={cn(
                        'size-2.5 rounded-full',
                        block.tone === 'green' && 'bg-emerald-500',
                        block.tone === 'amber' && 'bg-amber-500',
                        block.tone === 'blue' && 'bg-primary',
                      )}
                      aria-hidden="true"
                    />
                    {block.title}
                  </CardTitle>
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
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              block.tone === 'green' && 'bg-emerald-500',
                              block.tone === 'amber' && 'bg-amber-500',
                              block.tone === 'blue' && 'bg-primary',
                            )}
                            style={{ width: `${Math.min(100, Math.max(8, Math.abs(row.value) / Math.max(1, Math.abs(summary.confirmedIncomeTotal), Math.abs(summary.manualExpenseTotal)) * 100))}%` }}
                          />
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
            {currentMovementType === 'ingreso' ? 'Ingresos manuales' : 'Gastos manuales'}
          </h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">
            Movimientos contables creados desde administración para completar el balance del club fuera de los cobros automáticos a familias.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
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
          <SummaryCard
            title="Filtrado"
            value={formatEuro(visibleMovementTotal)}
            detail={`${visibleMovements.length} movimientos visibles`}
            icon={ReceiptText}
            tone={currentMovementType === 'ingreso' ? 'green' : 'blue'}
          />
          <SummaryCard
            title="Pendiente filtrado"
            value={formatEuro(visibleMovementPendingTotal)}
            detail="Según búsqueda actual"
            icon={Wallet}
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
                <FeeFormSection
                  title="Clasificación"
                  description="Define si este movimiento es una entrada o salida y cómo aparecerá agrupado."
                  icon={Tags}
                >
                  <div className="mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                      {editingMovement?.tipo ?? movementFormType}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <MovementField label="Categoría">
                      <select
                        id="categoria"
                        name="categoria"
                        defaultValue={editingMovement?.categoria ?? currentMovementCategories[0]}
                        className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {currentMovementCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </MovementField>

                    <MovementField label="Concepto">
                      <Input
                        id="concepto"
                        name="concepto"
                        placeholder="Ej. Lotería, material deportivo, efectivo..."
                        defaultValue={editingMovement?.concepto ?? ''}
                        required
                      />
                    </MovementField>

                    <MovementField label="Detalle opcional">
                      <textarea
                        id="detalle"
                        name="detalle"
                        rows={4}
                        placeholder="Añade una nota si hace falta."
                        defaultValue={editingMovement?.detalle ?? ''}
                        className="w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </MovementField>
                  </div>
                </FeeFormSection>

                <FeeFormSection
                  title="Importe y estado"
                  description="Registra la cantidad, el método de pago y si ya está confirmado."
                  icon={Wallet}
                >
                  <div className="space-y-4">
                    <MovementField label="Importe">
                      <Input
                        id="importe"
                        name="importe"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0,00"
                        defaultValue={editingMovement ? String(editingMovement.importe) : ''}
                        required
                      />
                    </MovementField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <MovementField label="Método de pago">
                        <select
                          id="metodoPago"
                          name="metodoPago"
                          defaultValue={editingMovement?.metodoPago ?? 'cash'}
                          className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {Object.entries(METHOD_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </MovementField>
                      <MovementField label="Estado">
                        <select
                          id="estado"
                          name="estado"
                          defaultValue={editingMovement?.estado ?? 'confirmed'}
                          className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {Object.entries(MOVEMENT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </MovementField>
                    </div>
                  </div>
                </FeeFormSection>

                <FeeFormSection
                  title="Archivo y temporada"
                  description="Relaciona el movimiento con una temporada y añade un justificante si existe."
                  icon={FileText}
                >
                  <div className="space-y-4">
                    <MovementField label="Temporada">
                      <select
                        id="seasonId"
                        name="seasonId"
                        defaultValue={editingMovement?.seasonId ?? ''}
                        className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Sin temporada</option>
                        {seasons.map((season) => (
                          <option key={season.id} value={season.id}>
                            {season.nombre}
                          </option>
                        ))}
                      </select>
                    </MovementField>

                    <MovementField label="Justificante opcional">
                      <Input
                        id="justificanteUrl"
                        name="justificanteUrl"
                        type="url"
                        placeholder="https://..."
                        defaultValue={editingMovement?.justificanteUrl ?? ''}
                      />
                    </MovementField>
                  </div>
                </FeeFormSection>

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

              <div className="grid gap-3">
                {visibleMovements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-white/70 p-6 text-center text-sm text-muted-foreground">
                    Aún no hay movimientos que coincidan con los filtros.
                  </div>
                ) : null}
                {visibleMovements.map((movement) => (
                  <article key={movement.id} className="rounded-xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-50/20">
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', MOVEMENT_STATUS_STYLES[movement.estado])}>
                            {MOVEMENT_STATUS_LABELS[movement.estado]}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                            {movement.categoria}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {METHOD_LABELS[movement.metodoPago]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black text-foreground">{movement.concepto}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-semibold text-muted-foreground">
                              {movement.detalle || 'Sin detalle añadido.'}
                            </p>
                          </div>
                          <p className={cn(
                            'text-2xl font-black tracking-tight',
                            movement.tipo === 'ingreso' ? 'text-emerald-700' : 'text-amber-700',
                          )}>
                            {formatEuro(movement.importe)}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Temporada</p>
                            <p className="mt-1 truncate font-semibold text-foreground">{movement.temporada}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Fecha</p>
                            <p className="mt-1 font-semibold text-foreground">{movement.fecha}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Justificante</p>
                            {movement.justificanteUrl ? (
                              <a href={movement.justificanteUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-black text-primary">
                                <FileText className="size-3.5" />
                                Ver justificante
                              </a>
                            ) : (
                              <p className="mt-1 font-semibold text-foreground">No adjunto</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-start xl:justify-end">
                        {confirmDeleteMovementId === movement.id ? (
                          <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg bg-rose-50 p-2 xl:justify-end">
                            <span className="text-xs font-semibold text-rose-700">¿Eliminar movimiento?</span>
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
                          <div className="flex gap-1">
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
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}
      <AdminErrorDialog
        message={
          (paymentMessage?.message && !paymentMessage.ok ? paymentMessage.message : null) ??
          (feeAssignmentState.message && !feeAssignmentState.ok ? feeAssignmentState.message : null) ??
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
