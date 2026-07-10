'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Mail, Pencil, Plus, Search, Send, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminCoachRow, AdminCoachTeamOption } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createCoachAction, deleteCoachAction, sendCoachNoticeAction, type CoachActionState, updateCoachAction } from './actions'

type Props = {
  coaches: AdminCoachRow[]
  teams: AdminCoachTeamOption[]
}

const initialState: CoachActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: CoachActionState }) {
  if (!state.message || !state.ok) return null
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-semibold',
        state.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      )}
    >
      {state.message}
    </p>
  )
}

function CoachFormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
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

function CoachField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-foreground">
      {label}
      {children}
    </label>
  )
}

export function CoachesClient({ coaches, teams = [] }: Props) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [noticeCoach, setNoticeCoach] = useState<AdminCoachRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    teamId: '',
  })
  const [noticeDraft, setNoticeDraft] = useState({
    subject: '',
    body: '',
  })
  const [state, action, pending] = useActionState(createCoachAction, initialState)

  const visibleCoaches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return coaches

    return coaches.filter((coach) =>
      [coach.nombre, coach.email, coach.equipo, coach.rol, coach.estado, coach.fechaAlta]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [coaches, search])
  const assignedCoaches = coaches.filter((coach) => coach.equipo && coach.equipo !== 'Sin equipo')
  const unassignedCoaches = coaches.length - assignedCoaches.length

  function getCoachTeamId(coach: AdminCoachRow) {
    return teams.find((team) => team.nombre.split(' · ')[0] === coach.equipo)?.id ?? ''
  }

  function openEdit(coach: AdminCoachRow) {
    const [nombre, ...apellidos] = coach.nombre.split(' ')
    setDeleteId(null)
    setNoticeCoach(null)
    setActionError(null)
    setActionSuccess(null)
    setEditId(coach.id)
    setDraft({
      nombre: nombre ?? '',
      apellidos: apellidos.join(' '),
      email: coach.email,
      teamId: getCoachTeamId(coach),
    })
  }

  function openNotice(coach: AdminCoachRow) {
    setEditId(null)
    setDeleteId(null)
    setActionError(null)
    setActionSuccess(null)
    setNoticeCoach(coach)
    setNoticeDraft({
      subject: '',
      body: '',
    })
  }

  function handleSave() {
    if (!editId) return
    setActionError(null)
    startTransition(async () => {
      try {
        await updateCoachAction({
          coachId: editId,
          nombre: draft.nombre,
          apellidos: draft.apellidos,
          email: draft.email,
          teamId: draft.teamId || undefined,
        })
        setEditId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al actualizar el entrenador.')
      }
    })
  }

  function handleSendNotice() {
    if (!noticeCoach) return
    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      try {
        await sendCoachNoticeAction({
          coachId: noticeCoach.id,
          subject: noticeDraft.subject,
          body: noticeDraft.body,
        })
        setNoticeCoach(null)
        setActionSuccess(`Aviso enviado correctamente a ${noticeCoach.email}.`)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'No se ha podido enviar el aviso.')
      }
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteCoachAction(id)
        setDeleteId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al eliminar el entrenador.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Gestión deportiva</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Cuerpo técnico</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Controla entrenadores, equipos asignados y avisos directos por email desde el panel.
            </p>
          </div>
          <Button type="button" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear entrenador
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Entrenadores</p>
            <p className="mt-2 text-3xl font-black text-primary">{coaches.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Usuarios con rol técnico</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Asignados</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{assignedCoaches.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Con equipo vinculado</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700/70">Sin equipo</p>
            <p className="mt-2 text-3xl font-black text-amber-700">{unassignedCoaches}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Pendientes de asignar</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700/70">Equipos</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{teams.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Disponibles para asignar</p>
          </div>
        </div>
      </div>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Crear entrenador"
        description="Crea una cuenta con rol de entrenador. Los privilegios se definirán más adelante."
        maxWidth="md"
      >
        <form action={action} className="space-y-4">
          <CoachFormSection
            title="Identidad"
            description="Datos visibles del entrenador dentro del panel deportivo."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <CoachField label="Nombre">
                <Input name="nombre" placeholder="Nombre" required />
              </CoachField>
              <CoachField label="Apellidos">
                <Input name="apellidos" placeholder="Apellidos" required />
              </CoachField>
            </div>
          </CoachFormSection>

          <CoachFormSection
            title="Acceso"
            description="Credenciales iniciales para acceder como entrenador."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <CoachField label="Email">
                <Input name="email" type="email" placeholder="entrenador@club.com" required />
              </CoachField>
              <CoachField label="Contraseña">
                <Input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
              </CoachField>
            </div>
          </CoachFormSection>

          <CoachFormSection
            title="Equipo asignado"
            description="Puedes dejarlo sin equipo y asignarlo más adelante."
          >
            <CoachField label="Equipo">
              <select
                id="coach-team"
                name="teamId"
                className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue=""
              >
                <option value="">Sin equipo asignado</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.nombre}
                  </option>
                ))}
              </select>
            </CoachField>
          </CoachFormSection>
          <FormMessage state={state} />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={pending} />}>
              Cancelar
            </Dialog.Close>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear entrenador
            </Button>
          </div>
        </form>
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(editId)}
        onOpenChange={(open) => {
          if (!open) setEditId(null)
        }}
        title="Editar entrenador"
        description="Actualiza los datos de acceso y el equipo asignado."
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditId(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <CoachFormSection
            title="Identidad"
            description="Actualiza el nombre visible del entrenador."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <CoachField label="Nombre">
                <Input
                  value={draft.nombre}
                  onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
                  placeholder="Nombre"
                />
              </CoachField>
              <CoachField label="Apellidos">
                <Input
                  value={draft.apellidos}
                  onChange={(event) => setDraft((current) => ({ ...current, apellidos: event.target.value }))}
                  placeholder="Apellidos"
                />
              </CoachField>
            </div>
          </CoachFormSection>

          <CoachFormSection
            title="Acceso"
            description="Email de inicio de sesión y comunicaciones del entrenador."
          >
            <CoachField label="Email">
              <Input
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                type="email"
                placeholder="Email"
              />
            </CoachField>
          </CoachFormSection>

          <CoachFormSection
            title="Equipo asignado"
            description="Modifica el equipo vinculado o deja al entrenador sin asignación."
          >
            <CoachField label="Equipo">
              <select
                id="edit-coach-team"
                value={draft.teamId}
                onChange={(event) => setDraft((current) => ({ ...current, teamId: event.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Sin equipo asignado</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.nombre}
                  </option>
                ))}
              </select>
            </CoachField>
          </CoachFormSection>
        </div>
      </AdminFormDialog>

      <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        {actionSuccess ? (
          <p className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
            {actionSuccess}
          </p>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Entrenadores</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{visibleCoaches.length} visibles según filtros</p>
          </div>
          <div className="relative min-w-72 flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar entrenadores"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por entrenador, email o estado"
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-3">
          {visibleCoaches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <X className="size-8 opacity-30" aria-hidden="true" />
                <p className="text-sm font-medium">Sin entrenadores</p>
                <p className="text-xs">No hay entrenadores con los filtros actuales.</p>
              </div>
            </div>
          ) : null}
          {visibleCoaches.map((coach) => {
            const isDeleting = deleteId === coach.id
            const hasTeam = coach.equipo && coach.equipo !== 'Sin equipo'

            return (
              <article key={coach.id} className={cn('rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-50/20', isDeleting && 'border-destructive/30 bg-destructive/5')}>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                        <ShieldCheck className="size-3.5" />
                        {coach.rol}
                      </span>
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black', hasTeam ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                        <UserCheck className="size-3.5" />
                        {hasTeam ? 'Con equipo' : 'Sin equipo'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {coach.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-black text-foreground">{coach.nombre}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">{coach.email}</p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Equipo asignado</p>
                        <p className="mt-1 truncate font-semibold text-foreground">{coach.equipo || 'Sin equipo'}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Alta</p>
                        <p className="mt-1 font-semibold text-foreground">{coach.fechaAlta}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Comunicación</p>
                        <p className="mt-1 font-semibold text-foreground">Avisos por email disponibles</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {isDeleting ? (
                      <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg bg-rose-50 p-2 lg:justify-end">
                        <span className="text-xs font-semibold text-rose-700">¿Eliminar entrenador?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(coach.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="icon-sm" variant="ghost" aria-label="Enviar aviso al entrenador" onClick={() => openNotice(coach)}>
                          <Mail className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Editar entrenador" onClick={() => openEdit(coach)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          aria-label="Eliminar entrenador"
                          onClick={() => {
                            setEditId(null)
                            setDeleteId(coach.id)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <AdminFormDialog
        open={Boolean(noticeCoach)}
        onOpenChange={(open) => {
          if (!open) setNoticeCoach(null)
        }}
        title="Enviar aviso"
        description={noticeCoach ? `Se enviará un email a ${noticeCoach.email}.` : undefined}
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setNoticeCoach(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSendNotice}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar aviso
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <CoachFormSection
            title="Comunicación"
            description="Mensaje que recibirá el entrenador en su correo electrónico."
          >
            <div className="space-y-4">
              <CoachField label="Asunto">
                <Input
                  value={noticeDraft.subject}
                  onChange={(event) => setNoticeDraft((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="Asunto del aviso"
                  maxLength={120}
                />
              </CoachField>
              <CoachField label="Cuerpo">
                <textarea
                  value={noticeDraft.body}
                  onChange={(event) => setNoticeDraft((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Escribe el aviso que recibirá el entrenador"
                  rows={8}
                  maxLength={3000}
                  className="min-h-48 rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </CoachField>
              <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                El aviso se enviará usando el email configurado para comunicaciones del club.
              </p>
            </div>
          </CoachFormSection>
        </div>
      </AdminFormDialog>

      <AdminErrorDialog
        message={state.message && !state.ok ? state.message : actionError}
        onClose={() => setActionError(null)}
      />
    </div>
  )
}
