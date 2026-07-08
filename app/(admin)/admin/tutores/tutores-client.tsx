'use client'

import { useActionState, useMemo, useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertTriangle, CheckCircle2, CreditCard, KeyRound, Loader2, Pencil, Plus, Search, Trash2, UserCheck, Users, X, XCircle } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatEuro, formatSpanishPhone, maskDocument } from '@/lib/format'
import type { AdminMemberRow, AdminTutorFeeAssignmentRow, AdminTutorRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  approveTutorAction,
  createMemberAction,
  createTutorAction,
  deleteMemberAction,
  deleteTutorAction,
  rejectTutorAction,
  sendPasswordRecoveryAction,
  toggleTutorMemberAction,
  type TutorSocioActionState,
} from './actions'

type Props = {
  tutors: AdminTutorRow[]
  members: AdminMemberRow[]
  feeAssignments: AdminTutorFeeAssignmentRow[]
}

const initialState: TutorSocioActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: TutorSocioActionState }) {
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

function IconStatus({
  title,
  tone,
  icon: Icon,
  badge,
}: {
  title: string
  tone: 'green' | 'amber' | 'red' | 'slate'
  icon: typeof CheckCircle2
  badge?: 'check' | 'x'
}) {
  return (
    <span
      title={title}
      className={cn(
        'relative inline-flex size-8 items-center justify-center rounded-full',
        tone === 'green' && 'bg-emerald-100 text-emerald-700',
        tone === 'amber' && 'bg-amber-100 text-amber-800',
        tone === 'red' && 'bg-rose-100 text-rose-700',
        tone === 'slate' && 'bg-slate-100 text-slate-600',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {badge === 'check' ? (
        <CheckCircle2 className="absolute -right-1 -top-1 size-3.5 rounded-full bg-white text-emerald-700" aria-hidden="true" />
      ) : null}
      {badge === 'x' ? (
        <XCircle className="absolute -right-1 -top-1 size-3.5 rounded-full bg-white text-rose-700" aria-hidden="true" />
      ) : null}
    </span>
  )
}

function TutorSummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  detail: string
  icon: typeof Users
  tone: 'blue' | 'green' | 'amber' | 'red'
}) {
  return (
    <div className="rounded-xl border border-border bg-white/88 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'red' && 'bg-rose-100 text-rose-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function TutorFormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Users
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

function TutorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-black text-foreground">{label}</span>
      {children}
    </label>
  )
}

function getNextCharge(assignments?: AdminTutorFeeAssignmentRow[]) {
  const assignment = assignments?.find((item) => item.status === 'active' && item.scheduledCharges > 0)
  if (!assignment) return null

  return {
    label: assignment.athleteId ? `${assignment.athleteName} · ${assignment.feeName}` : assignment.feeName,
    detail: `${formatEuro(assignment.totalAmount)} · ${assignment.nextChargeDate}`,
  }
}

function getConsentStatus(tutor: AdminTutorRow) {
  const title = `Obligatorios: ${tutor.consentStatus}. Imágenes: ${tutor.imageConsent}.`

  if (tutor.consentStatus === 'Completo' && tutor.imageConsent === 'Aceptado') {
    return { title, tone: 'green' as const, icon: CheckCircle2 }
  }

  if (tutor.consentStatus === 'Completo' && tutor.imageConsent !== 'Aceptado') {
    return { title, tone: 'amber' as const, icon: AlertTriangle }
  }

  return { title, tone: 'red' as const, icon: XCircle }
}

function getCardStatus(tutor: AdminTutorRow) {
  const title = tutor.cardStatus

  if (tutor.cardStatus === 'Tarjeta activa') {
    return { title, tone: 'green' as const, icon: CreditCard, badge: 'check' as const }
  }

  return { title, tone: 'red' as const, icon: CreditCard, badge: 'x' as const }
}

export function TutorsMembersClient({ tutors, members, feeAssignments }: Props) {
  const [activeTab, setActiveTab] = useState<'tutores' | 'socios' | 'pendientes' | 'rechazados'>('tutores')
  const [tutorSearch, setTutorSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [toggleMessage, setToggleMessage] = useState<TutorSocioActionState | null>(null)
  const [approvePendingId, setApprovePendingId] = useState<string | null>(null)
  const [rejectPendingId, setRejectPendingId] = useState<string | null>(null)
  const [recoveryPendingId, setRecoveryPendingId] = useState<string | null>(null)
  const [showTutorForm, setShowTutorForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingTutor, setEditingTutor] = useState<AdminTutorRow | null>(null)
  const [editingMember, setEditingMember] = useState<AdminMemberRow | null>(null)
  const [confirmDeleteTutorId, setConfirmDeleteTutorId] = useState<string | null>(null)
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const tutorFormRef = useRef<HTMLFormElement>(null)
  const memberFormRef = useRef<HTMLFormElement>(null)
  const [tutorState, tutorAction, tutorPending] = useActionState(createTutorAction, initialState)
  const [memberState, memberAction, memberPending] = useActionState(createMemberAction, initialState)

  const visibleTutors = useMemo(() => {
    const q = tutorSearch.trim().toLowerCase()
    const approvedTutors = tutors.filter((tutor) => tutor.approvalStatus === 'approved')
    if (!q) return approvedTutors
    return approvedTutors.filter((tutor) =>
      [tutor.nombre, tutor.email, tutor.documento, tutor.telefono, tutor.ciudad, tutor.isSocio ? 'socio' : 'no socio']
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [tutors, tutorSearch])

  const pendingTutors = tutors.filter((tutor) => tutor.approvalStatus === 'pending')
  const rejectedTutors = tutors.filter((tutor) => tutor.approvalStatus === 'rejected')
  const approvedTutors = tutors.filter((tutor) => tutor.approvalStatus === 'approved')
  const tutorMembers = approvedTutors.filter((tutor) => tutor.isSocio).length
  const tutorsWithAthletes = approvedTutors.filter((tutor) => tutor.deportistasAsociados > 0).length
  const activeFeeAssignments = feeAssignments.filter((assignment) => assignment.status === 'active').length
  const assignmentsByGuardian = useMemo(() => {
    const map = new Map<string, AdminTutorFeeAssignmentRow[]>()
    for (const assignment of feeAssignments) {
      const current = map.get(assignment.guardianId) ?? []
      current.push(assignment)
      map.set(assignment.guardianId, current)
    }
    return map
  }, [feeAssignments])

  const visibleMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) =>
      [member.nombre, member.email, member.estado, member.fechaAlta].join(' ').toLowerCase().includes(q),
    )
  }, [members, memberSearch])

  function handleToggleTutor(tutor: AdminTutorRow) {
    setPendingToggleId(tutor.userId)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await toggleTutorMemberAction(tutor.userId, !tutor.isSocio)
      setToggleMessage(result)
      setPendingToggleId(null)
    })
  }

  function handleApproveTutor(tutor: AdminTutorRow) {
    setApprovePendingId(tutor.id)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await approveTutorAction(tutor.id)
      setToggleMessage(result)
      setApprovePendingId(null)
    })
  }

  function handleRejectTutor(tutor: AdminTutorRow) {
    setRejectPendingId(tutor.id)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await rejectTutorAction(tutor.id)
      setToggleMessage(result)
      setRejectPendingId(null)
    })
  }

  function handleDeleteTutor(tutor: AdminTutorRow) {
    setConfirmDeleteTutorId(null)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await deleteTutorAction(tutor.id, tutor.userId)
      setToggleMessage(result)
    })
  }

  function handleDeleteMember(member: AdminMemberRow) {
    setConfirmDeleteMemberId(null)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await deleteMemberAction(member.id)
      setToggleMessage(result)
    })
  }

  function handleSendRecovery(target: { id: string; email: string }) {
    setRecoveryPendingId(target.id)
    setToggleMessage(null)
    startTransition(async () => {
      const result = await sendPasswordRecoveryAction(target.email)
      setToggleMessage(result)
      setRecoveryPendingId(null)
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Administración familiar
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Tutores, socios y estado económico
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
              Separa familias, socios del club, solicitudes pendientes y cuotas activas vinculadas a tutores.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditingTutor(null)
              setShowTutorForm(true)
              setActiveTab('tutores')
            }}
          >
            <Plus className="size-4" />
            Crear tutor
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TutorSummaryCard
            title="Tutores"
            value={approvedTutors.length}
            detail={`${tutorsWithAthletes} con deportistas asociados`}
            icon={Users}
            tone="blue"
          />
          <TutorSummaryCard
            title="Socios"
            value={members.length}
            detail={`${tutorMembers} tutores también son socios`}
            icon={UserCheck}
            tone="green"
          />
          <TutorSummaryCard
            title="Pendientes"
            value={pendingTutors.length}
            detail="Solicitudes esperando revisión"
            icon={AlertTriangle}
            tone="amber"
          />
          <TutorSummaryCard
            title="Cuotas activas"
            value={activeFeeAssignments}
            detail="Asignaciones vinculadas a familias"
            icon={CreditCard}
            tone="green"
          />
        </div>
      </section>

      <div className="grid gap-2 border-b border-border pb-3 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Secciones de tutores y socios">
        {[
          { id: 'tutores', label: 'Tutores', count: approvedTutors.length, helper: 'Familias activas' },
          { id: 'socios', label: 'Socios', count: members.length, helper: 'Socios del club' },
          { id: 'pendientes', label: 'Pendientes', count: pendingTutors.length, helper: 'Por aprobar' },
          { id: 'rechazados', label: 'Rechazados', count: rejectedTutors.length, helper: 'Solicitudes no aceptadas' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'rounded-xl px-4 py-3 text-left text-sm font-black transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white/75 text-muted-foreground ring-1 ring-foreground/10 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{tab.label}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs', activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary')}>
                {tab.count}
              </span>
            </span>
            <span className={cn('mt-1 block text-xs font-semibold', activeTab === tab.id ? 'text-white/75' : 'text-muted-foreground')}>
              {tab.helper}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'tutores' ? (
        <section className="space-y-5">
          <Dialog.Root
            open={showTutorForm || Boolean(editingTutor)}
            onOpenChange={(open) => {
              setShowTutorForm(open)
              if (!open) setEditingTutor(null)
            }}
          >
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#06172f]/55 backdrop-blur-sm" />
              <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-border bg-[#06172f] px-6 py-5 text-white">
                  <div>
                    <Dialog.Title className="text-2xl font-black tracking-tight">
                      {editingTutor ? 'Editar tutor' : 'Crear tutor'}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm font-medium text-white/70">
                      {editingTutor
                        ? 'Actualiza los datos administrativos del tutor.'
                        : 'Crea una cuenta de tutor con sus datos de acceso y consentimientos.'}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" />}>
                    <X className="size-5" aria-hidden="true" />
                    <span className="sr-only">Cerrar</span>
                  </Dialog.Close>
                </div>

                <div className="max-h-[calc(92vh-142px)] overflow-y-auto p-6">
                  <form key={editingTutor?.id ?? 'new-tutor'} ref={tutorFormRef} action={tutorAction} className="space-y-4">
                    <input type="hidden" name="id" value={editingTutor?.id ?? ''} />
                    <input type="hidden" name="userId" value={editingTutor?.userId ?? ''} />
                    <TutorFormSection
                      title="Identidad"
                      description="Nombre legal y documento del tutor."
                      icon={Users}
                    >
                      <div className="grid gap-3 sm:grid-cols-3">
                        <TutorField label="Nombre">
                          <Input name="nombre" placeholder="Nombre" defaultValue={editingTutor?.nombre.split(' ')[0] ?? ''} required />
                        </TutorField>
                        <TutorField label="Apellidos">
                          <Input name="apellidos" placeholder="Apellidos" defaultValue={editingTutor ? editingTutor.nombre.split(' ').slice(1).join(' ') : ''} required />
                        </TutorField>
                        <TutorField label="DNI/NIE">
                          <Input name="documento" placeholder="DNI/NIE" defaultValue={editingTutor?.documento ?? ''} required />
                        </TutorField>
                      </div>
                    </TutorFormSection>

                    <TutorFormSection
                      title="Acceso"
                      description="Cuenta con la que el tutor entra en la zona privada."
                      icon={KeyRound}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TutorField label="Email">
                          <Input name="email" type="email" placeholder="Email" defaultValue={editingTutor?.email ?? ''} required />
                        </TutorField>
                        <TutorField label="Contraseña">
                          {!editingTutor ? (
                            <Input name="password" type="password" placeholder="Contraseña" minLength={8} required />
                          ) : (
                            <Input value="La contraseña no se edita desde aquí" readOnly className="text-muted-foreground" />
                          )}
                        </TutorField>
                      </div>
                    </TutorFormSection>

                    <TutorFormSection
                      title="Contacto"
                      description="Datos básicos para comunicaciones administrativas."
                      icon={UserCheck}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TutorField label="Teléfono">
                          <Input name="telefono" placeholder="Teléfono" defaultValue={editingTutor?.telefono ?? ''} required />
                        </TutorField>
                        <TutorField label="Ciudad">
                          <Input name="ciudad" placeholder="Ciudad" defaultValue={editingTutor?.ciudad ?? ''} required />
                        </TutorField>
                      </div>
                    </TutorFormSection>

                    <TutorFormSection
                      title="Socio y consentimientos"
                      description="Configuración inicial de socio y autorización de imagen."
                      icon={CheckCircle2}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-semibold">
                          <input type="checkbox" name="isSocio" className="mt-0.5 size-4 accent-primary" defaultChecked={editingTutor?.isSocio ?? false} />
                          <span>
                            <span className="block font-black text-foreground">También es socio</span>
                            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                              Marca al tutor como socio del club desde el alta.
                            </span>
                          </span>
                        </label>
                        {!editingTutor ? (
                          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm font-semibold">
                            <input type="checkbox" name="imageConsent" className="mt-0.5 size-4 accent-primary" />
                            <span>
                              <span className="block font-black text-foreground">Acepta imagen</span>
                              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                                Registra el consentimiento de derechos de imagen al crear el tutor.
                              </span>
                            </span>
                          </label>
                        ) : (
                          <p className="rounded-lg bg-muted/50 px-3 py-3 text-sm font-semibold text-muted-foreground">
                            Los consentimientos ya firmados se revisan desde su apartado correspondiente.
                          </p>
                        )}
                      </div>
                    </TutorFormSection>
                    <FormMessage state={tutorState} />
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                      <Dialog.Close render={<Button type="button" variant="outline" disabled={tutorPending} />}>
                        Cancelar
                      </Dialog.Close>
                      <Button type="submit" disabled={tutorPending}>
                        {tutorPending ? <Loader2 className="size-4 animate-spin" /> : editingTutor ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                        {editingTutor ? 'Guardar cambios' : 'Crear tutor'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={tutorSearch} onChange={(event) => setTutorSearch(event.target.value)} placeholder="Buscar por tutor, email, teléfono o ciudad" className="pl-9" />
            </div>
            {toggleMessage?.message && toggleMessage.ok ? <FormMessage state={toggleMessage} /> : null}
            <div className="mt-4 grid gap-3">
              {visibleTutors.length === 0 ? (
                <p className="rounded-xl bg-muted px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay tutores que coincidan con la búsqueda.
                </p>
              ) : null}

              {visibleTutors.map((tutor) => {
                const nextCharge = getNextCharge(assignmentsByGuardian.get(tutor.id))
                const consentStatus = getConsentStatus(tutor)
                const cardStatus = getCardStatus(tutor)

                return (
                  <article key={tutor.id} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.85fr_0.95fr_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-black', tutor.isSocio ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                            {tutor.isSocio ? 'Socio' : 'Tutor'}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                            {tutor.deportistasAsociados} deportista{tutor.deportistasAsociados !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-black leading-tight text-foreground">{tutor.nombre}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-muted-foreground" title={tutor.email}>
                          {tutor.email}
                        </p>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                          <span>{maskDocument(tutor.documento)}</span>
                          <span>{formatSpanishPhone(tutor.telefono)}</span>
                          <span className="truncate" title={tutor.ciudad}>{tutor.ciudad}</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/40 px-3 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Estado familiar</p>
                        <div className="mt-3 flex items-center gap-3">
                          <IconStatus {...consentStatus} />
                          <div>
                            <p className="text-sm font-black text-foreground">Consentimientos</p>
                            <p className="text-xs font-semibold text-muted-foreground">{consentStatus.title}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <IconStatus {...cardStatus} />
                          <div>
                            <p className="text-sm font-black text-foreground">Tarjeta</p>
                            <p className="text-xs font-semibold text-muted-foreground">{cardStatus.title}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-primary/5 px-3 py-3">
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">Próximo cargo</p>
                        {nextCharge ? (
                          <div className="mt-2" title={`${nextCharge.label}. ${nextCharge.detail}.`}>
                            <p className="font-black text-foreground">{nextCharge.label}</p>
                            <p className="mt-1 text-sm font-semibold text-muted-foreground">{nextCharge.detail}</p>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm font-semibold text-muted-foreground">Sin cargo programado</p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={tutor.isSocio ? 'default' : 'outline'}
                          disabled={isPending && pendingToggleId === tutor.userId}
                          onClick={() => handleToggleTutor(tutor)}
                          className="mt-3"
                        >
                          {pendingToggleId === tutor.userId ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                          {tutor.isSocio ? 'Desmarcar socio' : 'Marcar socio'}
                        </Button>
                      </div>

                      <div className="flex items-start justify-end">
                        {confirmDeleteTutorId === tutor.id ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTutor(tutor)} disabled={isPending}>
                              Sí, eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteTutorId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Editar tutor"
                              onClick={() => {
                                setEditingTutor(tutor)
                                setShowTutorForm(true)
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Enviar recuperación de contraseña"
                              disabled={recoveryPendingId === tutor.id}
                              onClick={() => handleSendRecovery(tutor)}
                            >
                              {recoveryPendingId === tutor.id ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                            </Button>
                            <Button size="icon-sm" variant="destructive" aria-label="Eliminar tutor" onClick={() => setConfirmDeleteTutorId(tutor.id)}>
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
          </div>
        </section>
      ) : null}

      {activeTab === 'pendientes' ? (
        <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          {toggleMessage?.message && toggleMessage.ok ? <FormMessage state={toggleMessage} /> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Bandeja de revisión</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Solicitudes pendientes</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Revisa los datos del tutor antes de activar su acceso familiar.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">
              <AlertTriangle className="size-4" />
              {pendingTutors.length} por aprobar
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {pendingTutors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white/70 p-6 text-center text-sm text-muted-foreground">
                No hay tutores pendientes de aprobación.
              </div>
            ) : null}
            {pendingTutors.map((tutor) => (
              <article key={tutor.id} className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
                        <AlertTriangle className="size-3.5" />
                        Pendiente
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Alta por validar
                      </span>
                    </div>
                    <p className="mt-3 truncate text-lg font-black text-foreground">{tutor.nombre}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{tutor.email}</p>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Documento</p>
                        <p className="mt-1 font-semibold text-foreground">{maskDocument(tutor.documento)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Teléfono</p>
                        <p className="mt-1 font-semibold text-foreground">{formatSpanishPhone(tutor.telefono)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Ciudad</p>
                        <p className="mt-1 truncate font-semibold text-foreground" title={tutor.ciudad}>{tutor.ciudad}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button size="sm" disabled={approvePendingId === tutor.id} onClick={() => handleApproveTutor(tutor)}>
                      {approvePendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                      Aprobar
                    </Button>
                    <Button size="sm" variant="destructive" disabled={rejectPendingId === tutor.id} onClick={() => handleRejectTutor(tutor)}>
                      {rejectPendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                      Rechazar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'rechazados' ? (
        <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          {toggleMessage?.message && toggleMessage.ok ? <FormMessage state={toggleMessage} /> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-700">Historial de revisión</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Solicitudes rechazadas</h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Puedes reactivar una solicitud si la información ya está corregida.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-rose-700">
              <XCircle className="size-4" />
              {rejectedTutors.length} rechazados
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {rejectedTutors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white/70 p-6 text-center text-sm text-muted-foreground">
                No hay tutores rechazados.
              </div>
            ) : null}
            {rejectedTutors.map((tutor) => (
              <article key={tutor.id} className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">
                        <XCircle className="size-3.5" />
                        Rechazado
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        Revisión cerrada
                      </span>
                    </div>
                    <p className="mt-3 truncate text-lg font-black text-foreground">{tutor.nombre}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{tutor.email}</p>
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Documento</p>
                        <p className="mt-1 font-semibold text-foreground">{maskDocument(tutor.documento)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Teléfono</p>
                        <p className="mt-1 font-semibold text-foreground">{formatSpanishPhone(tutor.telefono)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Ciudad</p>
                        <p className="mt-1 truncate font-semibold text-foreground" title={tutor.ciudad}>{tutor.ciudad}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex lg:justify-end">
                    <Button size="sm" onClick={() => handleApproveTutor(tutor)} disabled={approvePendingId === tutor.id}>
                      {approvePendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                      Aprobar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'socios' ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-start gap-3">
            <Button
              type="button"
              onClick={() => {
                setEditingMember(null)
                setShowMemberForm(true)
              }}
            >
              <Plus className="size-4" />
              Crear socio
            </Button>
          </div>

          <AdminFormDialog
            open={showMemberForm || Boolean(editingMember)}
            onOpenChange={(open) => {
              setShowMemberForm(open)
              if (!open) setEditingMember(null)
            }}
            title={editingMember ? 'Editar socio' : 'Crear socio'}
            description={editingMember ? 'Actualiza los datos del socio.' : 'Crea una cuenta de socio del club.'}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null)
                    setShowMemberForm(false)
                  }}
                  disabled={memberPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" form="member-form" disabled={memberPending}>
                  {memberPending ? <Loader2 className="size-4 animate-spin" /> : editingMember ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {editingMember ? 'Guardar cambios' : 'Crear socio'}
                </Button>
              </>
            }
          >
            <form id="member-form" key={editingMember?.id ?? 'new-member'} ref={memberFormRef} action={memberAction} className="space-y-4">
              <input type="hidden" name="id" value={editingMember?.id ?? ''} />
              <TutorFormSection
                title="Identidad del socio"
                description="Nombre público con el que se identificará dentro del club."
                icon={UserCheck}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <TutorField label="Nombre">
                    <Input name="nombre" placeholder="Ej. Antonio" defaultValue={editingMember?.nombre.split(' ')[0] ?? ''} required />
                  </TutorField>
                  <TutorField label="Apellidos">
                    <Input name="apellidos" placeholder="Ej. García López" defaultValue={editingMember ? editingMember.nombre.split(' ').slice(1).join(' ') : ''} required />
                  </TutorField>
                </div>
              </TutorFormSection>
              <TutorFormSection
                title="Acceso y comunicaciones"
                description="Email usado para acceder y recibir recuperaciones de contraseña."
                icon={KeyRound}
              >
                <TutorField label="Email">
                  <Input name="email" type="email" placeholder="socio@correo.com" defaultValue={editingMember?.email ?? ''} required />
                </TutorField>
              </TutorFormSection>
              <FormMessage state={memberState} />
            </form>
          </AdminFormDialog>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Users className="size-3.5" />
                Gestión de socios
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Buscar por socio, email o estado" className="pl-9" />
            </div>
            <div className="grid gap-3">
              {visibleMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-white/70 p-6 text-center text-sm text-muted-foreground">
                  No hay socios que coincidan con la búsqueda actual.
                </div>
              ) : null}
              {visibleMembers.map((member) => (
                <article key={member.id} className="rounded-xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/25">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                          <UserCheck className="size-3.5" />
                          {member.estado}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Alta {member.fechaAlta}
                        </span>
                      </div>
                      <p className="mt-3 truncate text-lg font-black text-foreground">{member.nombre}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{member.email}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Acceso</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Cuenta de socio activa</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Recuperación</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Disponible por email</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      {confirmDeleteMemberId === member.id ? (
                        <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg bg-rose-50 p-2 lg:justify-end">
                          <span className="text-xs font-semibold text-rose-700">¿Eliminar socio?</span>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member)} disabled={isPending}>
                            Sí, eliminar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmDeleteMemberId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="Editar socio" onClick={() => { setEditingMember(member); setShowMemberForm(true) }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Enviar recuperación de contraseña"
                            disabled={recoveryPendingId === member.id}
                            onClick={() => handleSendRecovery(member)}
                          >
                            {recoveryPendingId === member.id ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                          </Button>
                          <Button size="icon-sm" variant="destructive" aria-label="Eliminar socio" onClick={() => setConfirmDeleteMemberId(member.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <AdminErrorDialog
        message={
          (toggleMessage?.message && !toggleMessage.ok ? toggleMessage.message : null) ??
          (tutorState.message && !tutorState.ok ? tutorState.message : null) ??
          (memberState.message && !memberState.ok ? memberState.message : null)
        }
        onClose={() => setToggleMessage(null)}
      />
    </div>
  )
}
