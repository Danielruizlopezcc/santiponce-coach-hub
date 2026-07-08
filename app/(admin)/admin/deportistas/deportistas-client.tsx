'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Trophy,
  UserCheck,
  X,
} from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type {
  AdminAthleteRow,
  AdminCategoryRow,
  AdminSeasonRow,
  AdminTeamRow,
  AdminTutorOption,
} from '@/lib/admin-app'
import {
  createAthleteAction,
  deleteAthleteAction,
  type CreateAthleteState,
  updateAthleteAdminAction,
} from './actions'

const ESTADO_STYLES: Record<AdminAthleteRow['estadoMatricula'], string> = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
}

const FORM_SELECT_CLASS =
  'h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function SportsSummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string
  detail: string
  icon: typeof Trophy
  tone?: 'blue' | 'green' | 'amber'
}) {
  return (
    <div className="rounded-lg border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function AthleteFormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Trophy
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function AthleteField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-black text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function AthleteProfileBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Trophy
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function AthleteProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

type Props = {
  athletes: AdminAthleteRow[]
  categories: AdminCategoryRow[]
  teams: AdminTeamRow[]
  seasons: AdminSeasonRow[]
  tutors: AdminTutorOption[]
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

export function DeportistasClient({ athletes, categories, teams, seasons, tutors }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [viewingAthlete, setViewingAthlete] = useState<AdminAthleteRow | null>(null)
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

  const hasActiveFilters = [search, categoryFilter, teamFilter, statusFilter, seasonFilter].some(Boolean)
  const assignedTeamCount = athletes.filter((athlete) => athlete.assignedTeamId).length
  const withoutTeamCount = athletes.filter((athlete) => !athlete.assignedTeamId).length
  const matriculatedCount = athletes.filter((athlete) => athlete.estadoMatricula === 'Matriculado').length

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
      description="Gestión deportiva de jugadores, categorías, equipos y situación de plantilla."
      className="max-w-7xl"
    >
      <section className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Gestión deportiva
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Jugadores, categorías y equipos
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
              Esta vista se centra en la organización deportiva. La asignación de cuotas se gestiona
              desde Administración para mantener separadas plantilla y contabilidad.
            </p>
          </div>
          <Button onClick={() => setShowCreate((current) => !current)}>
            <Plus className="size-4" aria-hidden="true" />
            Añadir jugador
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SportsSummaryCard
            title="Deportistas"
            value={String(athletes.length)}
            detail={`${filtered.length} visibles con los filtros actuales`}
            icon={Trophy}
          />
          <SportsSummaryCard
            title="Con equipo"
            value={String(assignedTeamCount)}
            detail={`${withoutTeamCount} pendientes de asignar`}
            icon={Shield}
            tone="green"
          />
          <SportsSummaryCard
            title="Matriculados"
            value={String(matriculatedCount)}
            detail="Disponibles administrativamente para competir"
            icon={UserCheck}
            tone="green"
          />
        </div>
      </section>

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
          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <AthleteFormSection
              title="Datos personales"
              description="Información básica para identificar al jugador."
              icon={UserCheck}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <AthleteField label="Nombre" htmlFor="create-athlete-name">
                  <Input id="create-athlete-name" name="nombre" placeholder="Nombre" required />
                </AthleteField>
                <AthleteField label="Apellidos" htmlFor="create-athlete-last-name">
                  <Input id="create-athlete-last-name" name="apellidos" placeholder="Apellidos" required />
                </AthleteField>
                <AthleteField label="Fecha de nacimiento" htmlFor="create-athlete-birth-date">
                  <Input id="create-athlete-birth-date" name="fechaNacimiento" type="date" required />
                </AthleteField>
                <AthleteField label="Documento" htmlFor="create-athlete-document">
                  <Input id="create-athlete-document" name="documento" placeholder="DNI, NIE o documento" required />
                </AthleteField>
              </div>
            </AthleteFormSection>

            <AthleteFormSection
              title="Familia"
              description="Tutor responsable vinculado al deportista."
              icon={Shield}
            >
              <AthleteField label="Tutor" htmlFor="create-athlete-guardian">
                <select id="create-athlete-guardian" name="guardianId" className={FORM_SELECT_CLASS}>
                  <option value="">Sin tutor asignado</option>
                  {tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>)}
                </select>
              </AthleteField>
              <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs font-semibold leading-5 text-muted-foreground">
                Las cuotas se asignan desde Administración cuando el jugador ya tenga tutor pagador.
              </p>
            </AthleteFormSection>
          </div>

          <AthleteFormSection
            title="Organización deportiva"
            description="Categoría solicitada, equipo, temporada y estado de matrícula."
            icon={Trophy}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <AthleteField label="Categoría" htmlFor="create-athlete-category">
                <select id="create-athlete-category" name="categoryId" required className={FORM_SELECT_CLASS}>
                  <option value="">Selecciona categoría</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                </select>
              </AthleteField>
              <AthleteField label="Equipo" htmlFor="create-athlete-team">
                <select id="create-athlete-team" name="assignedTeamId" className={FORM_SELECT_CLASS}>
                  <option value="">Sin equipo asignado</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                </select>
              </AthleteField>
              <AthleteField label="Temporada" htmlFor="create-athlete-season">
                <select id="create-athlete-season" name="seasonId" required className={FORM_SELECT_CLASS}>
                  <option value="">Selecciona temporada</option>
                  {seasons.map((season) => <option key={season.id} value={season.id}>{season.nombre}</option>)}
                </select>
              </AthleteField>
              <AthleteField label="Estado" htmlFor="create-athlete-status">
                <select id="create-athlete-status" name="status" defaultValue="pendiente" className={FORM_SELECT_CLASS}>
                  {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </AthleteField>
            </div>
          </AthleteFormSection>
          {createState.message && createState.ok ? (
            <p className={cn('rounded-lg px-3 py-2 text-sm font-semibold', createState.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
              {createState.message}
            </p>
          ) : null}
        </form>
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(viewingAthlete)}
        onOpenChange={(open) => {
          if (!open) setViewingAthlete(null)
        }}
        title="Ficha del deportista"
        description="Resumen separado de datos deportivos y administración familiar."
        maxWidth="xl"
        footer={
          viewingAthlete ? (
            <>
              <Button type="button" variant="outline" onClick={() => setViewingAthlete(null)}>
                Cerrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  openEdit(viewingAthlete)
                  setViewingAthlete(null)
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </Button>
            </>
          ) : null
        }
      >
        {viewingAthlete ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-50">
                    Deportista
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">{viewingAthlete.nombre}</h2>
                  <p className="mt-2 text-sm font-semibold text-blue-50">
                    {viewingAthlete.categoriaSolicitada} · {viewingAthlete.temporada}
                  </p>
                </div>
                <span className={cn('rounded-full bg-white px-3 py-1 text-xs font-black', ESTADO_STYLES[viewingAthlete.estadoMatricula])}>
                  {viewingAthlete.estadoMatricula}
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AthleteProfileBlock title="Deportivo" icon={Trophy}>
                <div className="grid gap-3">
                  <AthleteProfileItem label="Categoría" value={viewingAthlete.categoriaSolicitada} />
                  <AthleteProfileItem label="Equipo" value={viewingAthlete.equipoAsignado} />
                  <AthleteProfileItem label="Temporada" value={viewingAthlete.temporada} />
                </div>
              </AthleteProfileBlock>

              <AthleteProfileBlock title="Administración" icon={UserCheck}>
                <div className="grid gap-3">
                  <AthleteProfileItem label="Tutor pagador" value={viewingAthlete.tutor} />
                  <AthleteProfileItem label="Estado matrícula" value={viewingAthlete.estadoMatricula} />
                  <AthleteProfileItem
                    label="Tutor asignado"
                    value={viewingAthlete.guardianId ? 'Sí' : 'No'}
                  />
                </div>
              </AthleteProfileBlock>
            </div>
          </div>
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
          <div className="space-y-4">
            <AthleteFormSection
              title="Familia y matrícula"
              description="Tutor vinculado y situación administrativa del jugador."
              icon={UserCheck}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <AthleteField label="Tutor" htmlFor="edit-athlete-guardian">
                  <select
                    id="edit-athlete-guardian"
                    value={draft.guardianId}
                    onChange={(event) => setDraft((prev) => prev && { ...prev, guardianId: event.target.value })}
                    className={FORM_SELECT_CLASS}
                  >
                    <option value="">Sin tutor asignado</option>
                    {tutors.map((tutor) => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.nombre}
                      </option>
                    ))}
                  </select>
                </AthleteField>
                <AthleteField label="Estado" htmlFor="edit-athlete-status">
                  <select
                    id="edit-athlete-status"
                    value={draft.status}
                    onChange={(event) => setDraft((prev) => prev && { ...prev, status: event.target.value as Draft['status'] })}
                    className={FORM_SELECT_CLASS}
                  >
                    {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </AthleteField>
              </div>
            </AthleteFormSection>

            <AthleteFormSection
              title="Organización deportiva"
              description="Ajusta categoría, equipo y temporada sin mezclarlo con cuotas."
              icon={Trophy}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <AthleteField label="Categoría" htmlFor="edit-athlete-category">
                  <select
                    id="edit-athlete-category"
                    value={draft.categoryId}
                    onChange={(event) => setDraft((prev) => prev && { ...prev, categoryId: event.target.value })}
                    className={FORM_SELECT_CLASS}
                  >
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                  </select>
                </AthleteField>
                <AthleteField label="Equipo" htmlFor="edit-athlete-team">
                  <select
                    id="edit-athlete-team"
                    value={draft.assignedTeamId}
                    onChange={(event) => setDraft((prev) => prev && { ...prev, assignedTeamId: event.target.value })}
                    className={FORM_SELECT_CLASS}
                  >
                    <option value="">Sin equipo asignado</option>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                  </select>
                </AthleteField>
                <AthleteField label="Temporada" htmlFor="edit-athlete-season">
                  <select
                    id="edit-athlete-season"
                    value={draft.seasonId}
                    onChange={(event) => setDraft((prev) => prev && { ...prev, seasonId: event.target.value })}
                    className={FORM_SELECT_CLASS}
                  >
                    {seasons.map((season) => <option key={season.id} value={season.id}>{season.nombre}</option>)}
                  </select>
                </AthleteField>
              </div>
            </AthleteFormSection>
          </div>
        ) : null}
      </AdminFormDialog>

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black tracking-tight text-foreground">Plantilla deportiva</p>
            <p className="text-sm font-semibold text-muted-foreground">
              Filtra por categoría, equipo, estado o temporada.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {filtered.length} de {athletes.length}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Buscar por jugador, tutor, categoría, equipo o estado" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
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

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Jugador</th>
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

              return (
                <tr key={athlete.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                  <td className="px-4 py-3 font-medium">
                    <p>{athlete.nombre}</p>
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
                        <Button size="icon-sm" variant="ghost" aria-label="Ver ficha del deportista" onClick={() => setViewingAthlete(athlete)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Editar deportista" onClick={() => openEdit(athlete)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Eliminar deportista" onClick={() => { setViewingAthlete(null); setEditId(null); setDraft(null); setDeleteId(athlete.id) }}>
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

      <AdminErrorDialog
        message={
          actionError ??
          (createState.message && !createState.ok ? createState.message : null)
        }
        onClose={() => setActionError(null)}
      />
    </PageContainer>
  )
}
