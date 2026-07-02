'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CreditCard, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type {
  AdminAthleteRow,
  AdminCategoryRow,
  AdminFeeTemplateRow,
  AdminSeasonRow,
  AdminTeamRow,
  AdminTutorFeeAssignmentRow,
  AdminTutorOption,
} from '@/lib/admin-app'
import {
  assignAthleteFeeAction,
  createAthleteAction,
  deleteAthleteAction,
  type AthleteFeeAssignmentState,
  type CreateAthleteState,
  updateAthleteAdminAction,
} from './actions'

const ESTADO_STYLES: Record<AdminAthleteRow['estadoMatricula'], string> = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

type Props = {
  athletes: AdminAthleteRow[]
  categories: AdminCategoryRow[]
  teams: AdminTeamRow[]
  seasons: AdminSeasonRow[]
  tutors: AdminTutorOption[]
  feeTemplates: AdminFeeTemplateRow[]
  feeAssignments: AdminTutorFeeAssignmentRow[]
}

type Draft = {
  guardianId: string
  categoryId: string
  assignedTeamId: string
  seasonId: string
  status: AdminAthleteRow['rawStatus']
}

const STATUS_OPTIONS = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En revisión', value: 'en_revision' },
  { label: 'Matriculado', value: 'matriculado' },
] as const

const initialCreateState: CreateAthleteState = { ok: false, message: '' }
const initialFeeAssignmentState: AthleteFeeAssignmentState = { ok: false, message: '' }

export function DeportistasClient({ athletes, categories, teams, seasons, tutors, feeTemplates, feeAssignments }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [assigningAthlete, setAssigningAthlete] = useState<AdminAthleteRow | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const createFormRef = useRef<HTMLFormElement>(null)
  const [createState, createAction, createPending] = useActionState(createAthleteAction, initialCreateState)
  const [feeAssignmentState, feeAssignmentAction, feeAssignmentPending] = useActionState(assignAthleteFeeAction, initialFeeAssignmentState)

  const activeCategories = categories.filter((category) => category.estado === 'Activa')
  const hasActiveFilters = [search, categoryFilter, teamFilter, statusFilter, seasonFilter].some(Boolean)
  const assignmentsByAthlete = useMemo(() => {
    const map = new Map<string, AdminTutorFeeAssignmentRow[]>()
    for (const assignment of feeAssignments) {
      if (!assignment.athleteId) continue
      const current = map.get(assignment.athleteId) ?? []
      current.push(assignment)
      map.set(assignment.athleteId, current)
    }
    return map
  }, [feeAssignments])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return athletes.filter((athlete) => {
      if (categoryFilter && athlete.categoriaSolicitadaId !== categoryFilter) return false
      if (teamFilter && (athlete.assignedTeamId ?? 'sin-equipo') !== teamFilter) return false
      if (statusFilter && athlete.rawStatus !== statusFilter) return false
      if (seasonFilter && athlete.seasonId !== seasonFilter) return false
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
  }, [athletes, search, categoryFilter, teamFilter, statusFilter, seasonFilter])

  function clearFilters() {
    setSearch('')
    setCategoryFilter('')
    setTeamFilter('')
    setStatusFilter('')
    setSeasonFilter('')
  }

  function openEdit(athlete: AdminAthleteRow) {
    setDeleteId(null)
    setEditId(athlete.id)
    setDraft({
      guardianId: athlete.guardianId ?? '',
      categoryId: athlete.categoriaSolicitadaId,
      assignedTeamId: athlete.assignedTeamId ?? '',
      seasonId: athlete.seasonId,
      status: athlete.rawStatus,
    })
  }

  function handleSave(athlete: AdminAthleteRow) {
    if (!draft) return
    setActionError(null)
    startTransition(async () => {
      try {
        await updateAthleteAdminAction({
          athleteId: athlete.id,
          guardianId: draft.guardianId || null,
          categoryId: draft.categoryId,
          assignedTeamId: draft.assignedTeamId || null,
          seasonId: draft.seasonId,
          status: draft.status,
        })
        setEditId(null)
        setDraft(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al actualizar el deportista.')
      }
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteAthleteAction(id)
        setDeleteId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al eliminar el deportista.')
      }
    })
  }

  useEffect(() => {
    if (createState.ok) {
      createFormRef.current?.reset()
      setShowCreate(false)
    }
  }, [createState.ok, createState.message])

  return (
    <PageContainer
      title="Deportistas"
      description="Listado visual de deportistas, categoría solicitada y estado de matrícula."
      className="max-w-7xl"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {athletes.length} deportista{athletes.length !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {activeCategories.length} categoría{activeCategories.length !== 1 ? 's' : ''} activa{activeCategories.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button onClick={() => setShowCreate((current) => !current)}>
          <Plus className="size-4" aria-hidden="true" />
          Añadir jugador
        </Button>
      </div>

      <AdminFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Añadir jugador"
        description="Crea un deportista y asígnalo a tutor, categoría, temporada y equipo si corresponde."
        maxWidth="xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="create-athlete-form" disabled={createPending}>
              {createPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear jugador
            </Button>
          </>
        }
      >
        <form id="create-athlete-form" ref={createFormRef} action={createAction} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input name="nombre" placeholder="Nombre" required />
            <Input name="apellidos" placeholder="Apellidos" required />
            <Input name="fechaNacimiento" type="date" required />
            <Input name="documento" placeholder="Documento" required />
            <select name="guardianId" className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">Sin tutor</option>
              {tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>)}
            </select>
            <select name="categoryId" required className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">Categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
            </select>
            <select name="assignedTeamId" className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">Sin equipo</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
            </select>
            <select name="seasonId" required className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              <option value="">Temporada</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.nombre}</option>)}
            </select>
            <select name="status" defaultValue="pendiente" className="h-9 rounded-lg border border-input bg-white px-3 text-sm">
              {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
          {createState.message ? (
            <p className={cn('rounded-lg px-3 py-2 text-sm font-semibold', createState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
              {createState.message}
            </p>
          ) : null}
        </form>
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(assigningAthlete)}
        onOpenChange={(open) => {
          if (!open) setAssigningAthlete(null)
        }}
        title="Asignar cuota"
        description="Programa una cuota para el deportista. El cobro se hará al tutor asignado."
        maxWidth="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAssigningAthlete(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="assign-athlete-fee-form"
              disabled={feeAssignmentPending || !assigningAthlete?.guardianId || feeTemplates.length === 0}
            >
              {feeAssignmentPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              Programar cuota
            </Button>
          </>
        }
      >
        {assigningAthlete ? (
          <form id="assign-athlete-fee-form" action={feeAssignmentAction} className="space-y-4">
            <input type="hidden" name="athleteId" value={assigningAthlete.id} />
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-black text-foreground">{assigningAthlete.nombre}</p>
              <p className="text-muted-foreground">Tutor pagador: {assigningAthlete.tutor}</p>
            </div>

            {!assigningAthlete.guardianId ? (
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                Este deportista no tiene tutor asignado. Asigna primero un tutor para poder programar una cuota.
              </p>
            ) : feeTemplates.length === 0 ? (
              <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                Primero crea una cuota en Contabilidad &gt; Cuotas.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="athlete-fee-template" className="text-sm font-black text-foreground">
                    Tipo de cuota
                  </label>
                  <select
                    id="athlete-fee-template"
                    name="feeTemplateId"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    required
                  >
                    <option value="">Selecciona cuota</option>
                    {feeTemplates.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.nombre} · {fee.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="athlete-start-month" className="text-sm font-black text-foreground">
                    Mes de inicio
                  </label>
                  <Input id="athlete-start-month" name="startMonth" type="month" className="mt-2 bg-white" required />
                </div>
                <div>
                  <label htmlFor="athlete-charge-day" className="text-sm font-black text-foreground">
                    Día de cobro
                  </label>
                  <select
                    id="athlete-charge-day"
                    name="chargeDay"
                    className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue="1"
                    required
                  >
                    {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>
                        Día {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {feeAssignmentState.message ? (
              <p className={cn('rounded-lg px-3 py-2 text-sm font-semibold', feeAssignmentState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                {feeAssignmentState.message}
              </p>
            ) : null}

            {(assignmentsByAthlete.get(assigningAthlete.id)?.length ?? 0) > 0 ? (
              <div className="grid gap-2">
                {assignmentsByAthlete.get(assigningAthlete.id)?.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                    <p className="font-black text-foreground">{assignment.feeName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Próximo cargo: {assignment.nextChargeDate} · {assignment.scheduledCharges} pendientes · {assignment.paidCharges} pagados
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </form>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(editId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditId(null)
            setDraft(null)
          }
        }}
        title="Editar deportista"
        description="Actualiza tutor, categoría, equipo, temporada y estado administrativo."
        maxWidth="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setDraft(null) }}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending || !draft}
              onClick={() => {
                const athlete = athletes.find((item) => item.id === editId)
                if (athlete) handleSave(athlete)
              }}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Guardar cambios
            </Button>
          </>
        }
      >
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-foreground">Tutor</label>
              <select
                value={draft.guardianId}
                onChange={(event) => setDraft((prev) => prev && { ...prev, guardianId: event.target.value })}
                className="h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground"
              >
                <option value="">Sin tutor</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-foreground">Categoría</label>
              <select value={draft.categoryId} onChange={(event) => setDraft((prev) => prev && { ...prev, categoryId: event.target.value })} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-foreground">Equipo</label>
              <select value={draft.assignedTeamId} onChange={(event) => setDraft((prev) => prev && { ...prev, assignedTeamId: event.target.value })} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Sin equipo asignado</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-black text-foreground">Temporada</label>
              <select value={draft.seasonId} onChange={(event) => setDraft((prev) => prev && { ...prev, seasonId: event.target.value })} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                {seasons.map((season) => <option key={season.id} value={season.id}>{season.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-black text-foreground">Estado</label>
              <select value={draft.status} onChange={(event) => setDraft((prev) => prev && { ...prev, status: event.target.value as Draft['status'] })} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
          </div>
        ) : null}
      </AdminFormDialog>

      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Búsqueda general" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-foreground/10 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="athlete-filter-category" className="text-sm font-medium text-foreground">
              Categoría
            </label>
            <select
              id="athlete-filter-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Todas</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="athlete-filter-team" className="text-sm font-medium text-foreground">
              Equipo
            </label>
            <select
              id="athlete-filter-team"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              <option value="sin-equipo">Sin equipo asignado</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="athlete-filter-status" className="text-sm font-medium text-foreground">
              Estado
            </label>
            <select
              id="athlete-filter-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="athlete-filter-season" className="text-sm font-medium text-foreground">
              Temporada
            </label>
            <select
              id="athlete-filter-season"
              value={seasonFilter}
              onChange={(event) => setSeasonFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Todas</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {actionError ? <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{actionError}</p> : null}

      <p className="mb-2 text-xs text-muted-foreground">
        {filtered.length === athletes.length ? `${athletes.length} registro${athletes.length !== 1 ? 's' : ''}` : `${filtered.length} de ${athletes.length} registros`}
      </p>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Nombre</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 md:table-cell">Tutor</th>
              <th className="min-w-48 px-4 py-2.5 text-left text-xs font-bold text-blue-950">Categoría</th>
              <th className="min-w-48 px-4 py-2.5 text-left text-xs font-bold text-blue-950">Equipo</th>
              <th className="min-w-40 px-4 py-2.5 text-left text-xs font-bold text-blue-950">Temporada</th>
              <th className="min-w-36 px-4 py-2.5 text-left text-xs font-bold text-blue-950">Estado</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold text-blue-950">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay deportistas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : null}

            {filtered.map((athlete) => {
              const isDeleting = deleteId === athlete.id
              const athleteAssignments = assignmentsByAthlete.get(athlete.id) ?? []

              return (
                <tr key={athlete.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                  <td className="px-4 py-3 font-medium">
                    <p>{athlete.nombre}</p>
                    {athleteAssignments.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-primary">
                        {athleteAssignments.length} cuota{athleteAssignments.length !== 1 ? 's' : ''} asignada{athleteAssignments.length !== 1 ? 's' : ''}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {athlete.tutor}
                  </td>
                  <td className="px-4 py-3">
                    {athlete.categoriaSolicitada}
                  </td>
                  <td className="px-4 py-3">
                    {athlete.equipoAsignado}
                  </td>
                  <td className="px-4 py-3">
                    {athlete.temporada}
                  </td>
                  <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLES[athlete.estadoMatricula])}>
                        {athlete.estadoMatricula}
                      </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isDeleting ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(athlete.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" aria-label="Editar deportista" onClick={() => openEdit(athlete)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Asignar cuota"
                          title={athlete.guardianId ? 'Asignar cuota' : 'Asigna primero un tutor'}
                          disabled={!athlete.guardianId}
                          onClick={() => setAssigningAthlete(athlete)}
                        >
                          <CreditCard className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Eliminar deportista" onClick={() => { setEditId(null); setDraft(null); setDeleteId(athlete.id) }}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
}
