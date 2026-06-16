'use client'

import { useActionState, useMemo, useRef, useState, useTransition } from 'react'
import { Loader2, Plus, Search, UserCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatSpanishPhone, maskDocument } from '@/lib/format'
import type { AdminMemberRow, AdminTutorRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  createMemberAction,
  createTutorAction,
  toggleTutorMemberAction,
  type TutorSocioActionState,
} from './actions'

type Props = {
  tutors: AdminTutorRow[]
  members: AdminMemberRow[]
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

export function TutorsMembersClient({ tutors, members }: Props) {
  const [activeTab, setActiveTab] = useState<'tutores' | 'socios'>('tutores')
  const [tutorSearch, setTutorSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [toggleMessage, setToggleMessage] = useState<TutorSocioActionState | null>(null)
  const [isPending, startTransition] = useTransition()
  const tutorFormRef = useRef<HTMLFormElement>(null)
  const memberFormRef = useRef<HTMLFormElement>(null)
  const [tutorState, tutorAction, tutorPending] = useActionState(createTutorAction, initialState)
  const [memberState, memberAction, memberPending] = useActionState(createMemberAction, initialState)

  const visibleTutors = useMemo(() => {
    const q = tutorSearch.trim().toLowerCase()
    if (!q) return tutors
    return tutors.filter((tutor) =>
      [tutor.nombre, tutor.email, tutor.documento, tutor.telefono, tutor.ciudad, tutor.isSocio ? 'socio' : 'no socio']
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [tutors, tutorSearch])

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de tutores y socios">
        {[
          { id: 'tutores', label: 'Tutores' },
          { id: 'socios', label: 'Socios' },
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
              <CardTitle className="text-lg font-black">Añadir tutor</CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={tutorFormRef} action={tutorAction} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Input name="nombre" placeholder="Nombre" required />
                  <Input name="apellidos" placeholder="Apellidos" required />
                </div>
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="telefono" placeholder="Teléfono" required />
                <Input name="documento" placeholder="DNI/NIE" required />
                <Input name="ciudad" placeholder="Ciudad" required />
                <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" name="isSocio" className="size-4" />
                  También es socio
                </label>
                <FormMessage state={tutorState} />
                <Button type="submit" className="w-full" disabled={tutorPending}>
                  {tutorPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Crear tutor
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {tutors.length} tutores
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'socios' ? (
        <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-black">Añadir socio</CardTitle>
            </CardHeader>
            <CardContent>
              <form ref={memberFormRef} action={memberAction} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Input name="nombre" placeholder="Nombre" required />
                  <Input name="apellidos" placeholder="Apellidos" required />
                </div>
                <Input name="email" type="email" placeholder="Email" required />
                <FormMessage state={memberState} />
                <Button type="submit" className="w-full" disabled={memberPending}>
                  {memberPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Crear socio
                </Button>
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
