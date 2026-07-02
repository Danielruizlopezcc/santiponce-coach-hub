'use client'

import { useActionState, useMemo, useRef, useState, useTransition } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertTriangle, CheckCircle2, CreditCard, KeyRound, Loader2, Pencil, Plus, Search, Trash2, UserCheck, Users, X, XCircle } from 'lucide-react'
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
  if (!state.message) return null
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
      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de tutores y socios">
        {[
          { id: 'tutores', label: 'Tutores' },
          { id: 'socios', label: 'Socios' },
          { id: 'pendientes', label: `Tutores pendientes${pendingTutors.length ? ` (${pendingTutors.length})` : ''}` },
          { id: 'rechazados', label: 'Tutores rechazados' },
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

      {activeTab === 'tutores' ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-muted-foreground">
                Alta, revisión y seguimiento administrativo de tutores.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEditingTutor(null)
                setShowTutorForm(true)
              }}
            >
              <Plus className="size-4" />
              Crear tutor
            </Button>
          </div>

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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input name="nombre" placeholder="Nombre" defaultValue={editingTutor?.nombre.split(' ')[0] ?? ''} required />
                      <Input name="apellidos" placeholder="Apellidos" defaultValue={editingTutor ? editingTutor.nombre.split(' ').slice(1).join(' ') : ''} required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input name="email" type="email" placeholder="Email" defaultValue={editingTutor?.email ?? ''} required />
                      {!editingTutor ? (
                        <Input name="password" type="password" placeholder="Contraseña" minLength={8} required />
                      ) : (
                        <Input value="La contraseña no se edita desde aquí" readOnly className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input name="telefono" placeholder="Teléfono" defaultValue={editingTutor?.telefono ?? ''} required />
                      <Input name="documento" placeholder="DNI/NIE" defaultValue={editingTutor?.documento ?? ''} required />
                      <Input name="ciudad" placeholder="Ciudad" defaultValue={editingTutor?.ciudad ?? ''} required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                        <input type="checkbox" name="isSocio" className="size-4" defaultChecked={editingTutor?.isSocio ?? false} />
                        También es socio
                      </label>
                      {!editingTutor ? (
                        <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                          <input type="checkbox" name="imageConsent" className="size-4" />
                          Acepta consentimiento de imagen
                        </label>
                      ) : null}
                    </div>
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
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {tutors.filter((tutor) => tutor.isApproved).length} tutores
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={tutorSearch} onChange={(event) => setTutorSearch(event.target.value)} placeholder="Buscar por tutor, email, teléfono o ciudad" className="pl-9" />
            </div>
            {toggleMessage?.message ? <FormMessage state={toggleMessage} /> : null}
            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-blue-50 text-center text-xs font-bold text-blue-950">
                    <th className="px-3 py-2.5 text-center">Nombre</th>
                    <th className="px-2 py-2.5 text-center">DNI/NIE</th>
                    <th className="px-2 py-2.5 text-center">Teléfono</th>
                    <th className="px-2 py-2.5 text-center">Ciudad</th>
                    <th className="px-2 py-2.5 text-center">Socio</th>
                    <th className="px-2 py-2.5 text-center">Deportistas</th>
                    <th className="px-2 py-2.5 text-center">Consentimientos</th>
                    <th className="px-2 py-2.5 text-center">Tarjeta</th>
                    <th className="px-2 py-2.5 text-center">Próximo cargo</th>
                    <th className="px-3 py-2.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {visibleTutors.map((tutor) => {
                    const nextCharge = getNextCharge(assignmentsByGuardian.get(tutor.id))
                    const consentStatus = getConsentStatus(tutor)
                    const cardStatus = getCardStatus(tutor)

                    return (
                    <tr key={tutor.id} className="transition-colors hover:bg-muted/30">
                      <td className="min-w-0 px-3 py-3 text-center">
                        <p className="truncate font-semibold text-foreground" title={tutor.nombre}>{tutor.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground" title={tutor.email}>{tutor.email}</p>
                      </td>
                      <td className="px-2 py-3 text-center">{maskDocument(tutor.documento)}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-center">{formatSpanishPhone(tutor.telefono)}</td>
                      <td className="truncate px-2 py-3 text-center" title={tutor.ciudad}>{tutor.ciudad}</td>
                      <td className="px-2 py-3 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={tutor.isSocio ? 'default' : 'outline'}
                          disabled={isPending && pendingToggleId === tutor.userId}
                          onClick={() => handleToggleTutor(tutor)}
                          className="h-8 px-2 text-xs"
                        >
                          {pendingToggleId === tutor.userId ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                          {tutor.isSocio ? 'Sí' : 'No'}
                        </Button>
                      </td>
                      <td className="px-2 py-3 text-center font-semibold">{tutor.deportistasAsociados}</td>
                      <td className="px-2 py-3 text-center">
                        <IconStatus {...consentStatus} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <IconStatus {...cardStatus} />
                      </td>
                      <td className="min-w-0 px-2 py-3 text-center">
                        {nextCharge ? (
                          <div title={`${nextCharge.label}. ${nextCharge.detail}.`} className="min-w-0">
                            <p className="truncate text-xs font-black text-primary">{nextCharge.label}</p>
                            <p className="truncate text-xs font-semibold text-muted-foreground">{nextCharge.detail}</p>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">Sin cargo</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {confirmDeleteTutorId === tutor.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteTutor(tutor)} disabled={isPending}>
                              Sí, eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteTutorId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
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

      {activeTab === 'pendientes' ? (
        <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingTutors.length} pendientes
            </span>
          </div>
          {toggleMessage?.message ? <FormMessage state={toggleMessage} /> : null}
          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">DNI/NIE</th>
                  <th className="px-4 py-2.5">Teléfono</th>
                  <th className="px-4 py-2.5">Ciudad</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {pendingTutors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No hay tutores pendientes de aprobación.
                    </td>
                  </tr>
                ) : (
                  pendingTutors.map((tutor) => (
                    <tr key={tutor.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{tutor.nombre}</p>
                        <p className="text-xs text-muted-foreground">{tutor.email}</p>
                      </td>
                      <td className="px-4 py-3">{maskDocument(tutor.documento)}</td>
                      <td className="px-4 py-3">{formatSpanishPhone(tutor.telefono)}</td>
                      <td className="px-4 py-3">{tutor.ciudad}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={approvePendingId === tutor.id}
                            onClick={() => handleApproveTutor(tutor)}
                          >
                            {approvePendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={rejectPendingId === tutor.id}
                            onClick={() => handleRejectTutor(tutor)}
                          >
                            {rejectPendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                            Rechazar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'rechazados' ? (
        <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              {rejectedTutors.length} rechazados
            </span>
          </div>
          {toggleMessage?.message ? <FormMessage state={toggleMessage} /> : null}
          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                  <th className="px-4 py-2.5">Nombre</th>
                  <th className="px-4 py-2.5">DNI/NIE</th>
                  <th className="px-4 py-2.5">Teléfono</th>
                  <th className="px-4 py-2.5">Ciudad</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rejectedTutors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No hay tutores rechazados.
                    </td>
                  </tr>
                ) : (
                  rejectedTutors.map((tutor) => (
                    <tr key={tutor.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{tutor.nombre}</p>
                        <p className="text-xs text-muted-foreground">{tutor.email}</p>
                      </td>
                      <td className="px-4 py-3">{maskDocument(tutor.documento)}</td>
                      <td className="px-4 py-3">{formatSpanishPhone(tutor.telefono)}</td>
                      <td className="px-4 py-3">{tutor.ciudad}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => handleApproveTutor(tutor)} disabled={approvePendingId === tutor.id}>
                          {approvePendingId === tutor.id ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                          Aprobar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'socios' ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {members.length} socios
            </span>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="nombre" placeholder="Nombre" defaultValue={editingMember?.nombre.split(' ')[0] ?? ''} required />
                <Input name="apellidos" placeholder="Apellidos" defaultValue={editingMember ? editingMember.nombre.split(' ').slice(1).join(' ') : ''} required />
              </div>
              <Input name="email" type="email" placeholder="Email" defaultValue={editingMember?.email ?? ''} required />
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
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-blue-50 text-left text-xs font-bold text-blue-950">
                    <th className="px-4 py-2.5">Nombre</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="hidden px-4 py-2.5 lg:table-cell">Alta</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{member.nombre}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {member.estado}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{member.fechaAlta}</td>
                      <td className="px-4 py-3 text-right">
                        {confirmDeleteMemberId === member.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMember(member)} disabled={isPending}>
                              Sí, eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteMemberId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
