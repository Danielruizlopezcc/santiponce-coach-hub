'use client'

import { useActionState, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, Pencil, Plus, Search, Trash2, UserCheck, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatEuro, formatSpanishPhone, maskDocument } from '@/lib/format'
import type { AdminFeeTemplateRow, AdminMemberRow, AdminTutorFeeAssignmentRow, AdminTutorRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  approveTutorAction,
  assignTutorFeeAction,
  cancelTutorFeeAssignmentAction,
  createMemberAction,
  createTutorAction,
  deleteMemberAction,
  deleteTutorAction,
  rejectTutorAction,
  toggleTutorMemberAction,
  type TutorSocioActionState,
  type TutorFeeAssignmentActionState,
} from './actions'

type Props = {
  tutors: AdminTutorRow[]
  members: AdminMemberRow[]
  feeTemplates: AdminFeeTemplateRow[]
  feeAssignments: AdminTutorFeeAssignmentRow[]
}

const initialState: TutorSocioActionState = { ok: false, message: '' }
const initialFeeAssignmentState: TutorFeeAssignmentActionState = { ok: false, message: '' }

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

export function TutorsMembersClient({ tutors, members, feeTemplates, feeAssignments }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tutores' | 'socios' | 'pendientes' | 'rechazados'>('tutores')
  const [tutorSearch, setTutorSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [toggleMessage, setToggleMessage] = useState<TutorSocioActionState | null>(null)
  const [approvePendingId, setApprovePendingId] = useState<string | null>(null)
  const [rejectPendingId, setRejectPendingId] = useState<string | null>(null)
  const [editingTutor, setEditingTutor] = useState<AdminTutorRow | null>(null)
  const [assigningTutor, setAssigningTutor] = useState<AdminTutorRow | null>(null)
  const [editingMember, setEditingMember] = useState<AdminMemberRow | null>(null)
  const [confirmDeleteTutorId, setConfirmDeleteTutorId] = useState<string | null>(null)
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const tutorFormRef = useRef<HTMLFormElement>(null)
  const memberFormRef = useRef<HTMLFormElement>(null)
  const [tutorState, tutorAction, tutorPending] = useActionState(createTutorAction, initialState)
  const [memberState, memberAction, memberPending] = useActionState(createMemberAction, initialState)
  const [feeAssignmentState, feeAssignmentAction, feeAssignmentPending] = useActionState(assignTutorFeeAction, initialFeeAssignmentState)

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

  function handleCancelFeeAssignment(assignmentId: string) {
    setToggleMessage(null)
    startTransition(async () => {
      const result = await cancelTutorFeeAssignmentAction(assignmentId)
      setToggleMessage(result)
      if (result.ok) router.refresh()
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
        <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">
                {editingTutor ? 'Editar tutor' : 'Añadir tutor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form key={editingTutor?.id ?? 'new-tutor'} ref={tutorFormRef} action={tutorAction} className="space-y-3">
                <input type="hidden" name="id" value={editingTutor?.id ?? ''} />
                <input type="hidden" name="userId" value={editingTutor?.userId ?? ''} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Input name="nombre" placeholder="Nombre" defaultValue={editingTutor?.nombre.split(' ')[0] ?? ''} required />
                  <Input name="apellidos" placeholder="Apellidos" defaultValue={editingTutor ? editingTutor.nombre.split(' ').slice(1).join(' ') : ''} required />
                </div>
                <Input name="email" type="email" placeholder="Email" defaultValue={editingTutor?.email ?? ''} required />
                <Input name="telefono" placeholder="Teléfono" defaultValue={editingTutor?.telefono ?? ''} required />
                <Input name="documento" placeholder="DNI/NIE" defaultValue={editingTutor?.documento ?? ''} required />
                <Input name="ciudad" placeholder="Ciudad" defaultValue={editingTutor?.ciudad ?? ''} required />
                <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" name="isSocio" className="size-4" defaultChecked={editingTutor?.isSocio ?? false} />
                  También es socio
                </label>
                <FormMessage state={tutorState} />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {editingTutor ? (
                    <Button type="button" variant="outline" onClick={() => setEditingTutor(null)} disabled={tutorPending}>
                      <X className="size-4" />
                      Cancelar
                    </Button>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={tutorPending}>
                    {tutorPending ? <Loader2 className="size-4 animate-spin" /> : editingTutor ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                    {editingTutor ? 'Guardar cambios' : 'Crear tutor'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {tutors.filter((tutor) => tutor.isApproved).length} tutores
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {tutors.filter((tutor) => tutor.isSocio).length} socios
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={tutorSearch} onChange={(event) => setTutorSearch(event.target.value)} placeholder="Buscar por tutor, email, teléfono o ciudad" className="pl-9" />
            </div>
            {toggleMessage?.message ? <FormMessage state={toggleMessage} /> : null}
            {assigningTutor ? (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                      Asignar cuota
                    </p>
                    <h3 className="mt-1 text-lg font-black text-foreground">{assigningTutor.nombre}</h3>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAssigningTutor(null)}>
                    <X className="size-4" />
                    Cerrar
                  </Button>
                </div>

                {feeTemplates.length === 0 ? (
                  <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                    Primero crea una cuota en Contabilidad &gt; Cuotas.
                  </p>
                ) : (
                  <form action={feeAssignmentAction} className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto] lg:items-end">
                    <input type="hidden" name="guardianId" value={assigningTutor.id} />
                    <div>
                      <label htmlFor="fee-template" className="text-sm font-black text-foreground">
                        Tipo de cuota
                      </label>
                      <select
                        id="fee-template"
                        name="feeTemplateId"
                        className="mt-2 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        required
                      >
                        <option value="">Selecciona cuota</option>
                        {feeTemplates.map((fee) => (
                          <option key={fee.id} value={fee.id}>
                            {fee.nombre} · {formatEuro(fee.importe)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="start-month" className="text-sm font-black text-foreground">
                        Mes de inicio
                      </label>
                      <Input id="start-month" name="startMonth" type="month" className="mt-2 bg-white" required />
                    </div>
                    <div>
                      <label htmlFor="charge-day" className="text-sm font-black text-foreground">
                        Día de cobro
                      </label>
                      <select
                        id="charge-day"
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
                    <Button type="submit" disabled={feeAssignmentPending}>
                      {feeAssignmentPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                      Programar
                    </Button>
                  </form>
                )}

                {feeAssignmentState.message ? (
                  <div className="mt-3">
                    <FormMessage state={feeAssignmentState} />
                  </div>
                ) : null}

                {(assignmentsByGuardian.get(assigningTutor.id)?.length ?? 0) > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {assignmentsByGuardian.get(assigningTutor.id)?.map((assignment) => (
                      <div key={assignment.id} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black text-foreground">{assignment.feeName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Próximo cargo: {assignment.nextChargeDate}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelFeeAssignment(assignment.id)}
                              disabled={isPending}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {assignment.scheduledCharges} pendientes · {assignment.paidCharges} pagados · día {assignment.chargeDay}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-2.5">Nombre</th>
                    <th className="px-4 py-2.5">DNI/NIE</th>
                    <th className="px-4 py-2.5">Teléfono</th>
                    <th className="hidden px-4 py-2.5 lg:table-cell">Ciudad</th>
                    <th className="px-4 py-2.5">Socio</th>
                    <th className="px-4 py-2.5">Deportistas</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {visibleTutors.map((tutor) => (
                    <tr key={tutor.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{tutor.nombre}</p>
                        <p className="text-xs text-muted-foreground">{tutor.email}</p>
                      </td>
                      <td className="px-4 py-3">{maskDocument(tutor.documento)}</td>
                      <td className="px-4 py-3">{formatSpanishPhone(tutor.telefono)}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">{tutor.ciudad}</td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={tutor.isSocio ? 'default' : 'outline'}
                          disabled={isPending && pendingToggleId === tutor.userId}
                          onClick={() => handleToggleTutor(tutor)}
                        >
                          {pendingToggleId === tutor.userId ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                          {tutor.isSocio ? 'Sí' : 'No'}
                        </Button>
                      </td>
                      <td className="px-4 py-3 font-semibold">{tutor.deportistasAsociados}</td>
                      <td className="px-4 py-3 text-right">
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
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" aria-label="Editar tutor" onClick={() => setEditingTutor(tutor)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" aria-label="Asignar cuota" onClick={() => setAssigningTutor(tutor)}>
                              <CreditCard className="size-4" />
                            </Button>
                            <Button size="icon-sm" variant="destructive" aria-label="Eliminar tutor" onClick={() => setConfirmDeleteTutorId(tutor.id)}>
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
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
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
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
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
        <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">{editingMember ? 'Editar socio' : 'Añadir socio'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form key={editingMember?.id ?? 'new-member'} ref={memberFormRef} action={memberAction} className="space-y-3">
                <input type="hidden" name="id" value={editingMember?.id ?? ''} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Input name="nombre" placeholder="Nombre" defaultValue={editingMember?.nombre.split(' ')[0] ?? ''} required />
                  <Input name="apellidos" placeholder="Apellidos" defaultValue={editingMember ? editingMember.nombre.split(' ').slice(1).join(' ') : ''} required />
                </div>
                <Input name="email" type="email" placeholder="Email" defaultValue={editingMember?.email ?? ''} required />
                <FormMessage state={memberState} />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {editingMember ? (
                    <Button type="button" variant="outline" onClick={() => setEditingMember(null)} disabled={memberPending}>
                      <X className="size-4" />
                      Cancelar
                    </Button>
                  ) : null}
                  <Button type="submit" className="w-full" disabled={memberPending}>
                    {memberPending ? <Loader2 className="size-4 animate-spin" /> : editingMember ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                    {editingMember ? 'Guardar cambios' : 'Crear socio'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {members.length} socios
              </span>
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
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
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
                            <Button size="icon-sm" variant="ghost" aria-label="Editar socio" onClick={() => setEditingMember(member)}>
                              <Pencil className="size-4" />
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
