'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ClipboardList,
  Pencil,
  Shield,
  Shirt,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetClose, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { AdminCategoryRow, AdminSeasonRow, AdminTeamDetail } from '@/lib/admin-app'
import type { PlayerPosition } from '@/lib/private-app-shared'
import {
  assignAthleteAction,
  removeAthleteAction,
  updateAthletePositionAction,
  updateAthleteShirtNumberAction,
  updateTeamAction,
} from '../actions'

const MATRICULA_STYLES = {
  Matriculado:   'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente:     'bg-amber-100 text-amber-700',
} as const

const POSITION_OPTIONS: Array<{ value: PlayerPosition; label: string }> = [
  { value: 'goalkeeper', label: 'Portero' },
  { value: 'defender', label: 'Defensa' },
  { value: 'midfielder', label: 'Mediocampista' },
  { value: 'forward', label: 'Delantero' },
]

type Props = {
  team: AdminTeamDetail
  categories: AdminCategoryRow[]
  seasons: AdminSeasonRow[]
}

function TeamDetailSummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  helper: string
  icon: typeof Users
  tone: 'blue' | 'emerald' | 'amber' | 'slate'
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  }[tone]

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <span className={cn('rounded-2xl p-3 ring-1', toneClasses)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

export function EquipoDetailClient({ team, categories, seasons }: Props) {
  const [isPending, startTransition] = useTransition()

  // jugadores
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [selectedAdd, setSelectedAdd]         = useState('')
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | ''>('')
  const [updatingPositionId, setUpdatingPositionId] = useState<string | null>(null)
  const [updatingShirtNumberId, setUpdatingShirtNumberId] = useState<string | null>(null)
  const [actionError, setActionError]         = useState<string | null>(null)

  // edición
  const [editOpen, setEditOpen]     = useState(false)
  const [editName, setEditName]     = useState(team.nombre)
  const [editCat, setEditCat]       = useState(team.categoryId)
  const [editSeason, setEditSeason] = useState(team.seasonId)
  const [editActive, setEditActive] = useState(team.isActive)
  const [editNotes, setEditNotes]   = useState(team.notes ?? '')
  const [editError, setEditError]   = useState<string | null>(null)

  const matriculatedMembers = team.members.filter((m) => m.estadoMatricula === 'Matriculado').length
  const positionedMembers = team.members.filter((m) => m.position).length
  const numberedMembers = team.members.filter((m) => m.shirtNumber).length

  function openEdit() {
    setEditName(team.nombre)
    setEditCat(team.categoryId)
    setEditSeason(team.seasonId)
    setEditActive(team.isActive)
    setEditNotes(team.notes ?? '')
    setEditError(null)
    setEditOpen(true)
  }

  function handleSaveEdit() {
    const trimmed = editName.trim()
    if (!trimmed)  { setEditError('El nombre es obligatorio.'); return }
    if (!editCat)  { setEditError('Selecciona una categoría.'); return }
    if (!editSeason){ setEditError('Selecciona una temporada.'); return }
    setEditError(null)
    startTransition(async () => {
      try {
        await updateTeamAction(team.id, trimmed, editCat, editSeason, editActive, editNotes)
        setEditOpen(false)
      } catch (e) {
        setEditError(e instanceof Error ? e.message : 'Error al guardar.')
      }
    })
  }

  function handleRemove(athleteId: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await removeAthleteAction(team.id, athleteId)
        setConfirmRemoveId(null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al quitar al jugador.')
      }
    })
  }

  function handleAdd() {
    if (!selectedAdd) return
    if (!selectedPosition) {
      setActionError('Selecciona una posición para el jugador.')
      return
    }
    setActionError(null)
    startTransition(async () => {
      try {
        await assignAthleteAction(team.id, selectedAdd, selectedPosition)
        setSelectedAdd('')
        setSelectedPosition('')
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al añadir al jugador.')
      }
    })
  }

  function handlePositionChange(athleteId: string, position: PlayerPosition | '') {
    setActionError(null)
    setUpdatingPositionId(athleteId)
    startTransition(async () => {
      try {
        await updateAthletePositionAction(team.id, athleteId, position || null)
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al actualizar la posición.')
      } finally {
        setUpdatingPositionId(null)
      }
    })
  }

  function handleShirtNumberChange(athleteId: string, shirtNumber: string) {
    setActionError(null)
    setUpdatingShirtNumberId(athleteId)
    startTransition(async () => {
      try {
        await updateAthleteShirtNumberAction(
          team.id,
          athleteId,
          shirtNumber ? Number(shirtNumber) : null,
        )
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al actualizar el dorsal.')
      } finally {
        setUpdatingShirtNumberId(null)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">

      {/* ── Navegación ───────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/admin/equipos">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Equipos
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
          <Pencil className="size-3.5" aria-hidden="true" />
          Editar equipo
        </Button>
      </div>

      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-sm">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:p-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-50">
                <Shield className="size-3.5" aria-hidden="true" />
                Gestión deportiva
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-blue-700">
                {team.estado}
              </span>
              {!team.isActive && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-blue-50">
                  Inactivo
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-4xl">{team.nombre}</h1>
            <p className="mt-2 text-sm font-medium text-blue-50">
              {team.categoria} · {team.temporada}
            </p>
            {team.notes && (
              <p className="mt-3 max-w-2xl text-sm italic text-blue-50/90">{team.notes}</p>
            )}
          </div>
          <div className="grid min-w-52 grid-cols-2 gap-2 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 md:grid-cols-1">
            <div>
              <p className="text-xs font-medium text-blue-50/80">Plantilla</p>
              <p className="text-2xl font-bold">{team.members.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-50/80">Disponibles</p>
              <p className="text-2xl font-bold">{team.available.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamDetailSummaryCard
          label="Jugadores"
          value={team.deportistas}
          helper="Plantilla asignada"
          icon={Users}
          tone="blue"
        />
        <TeamDetailSummaryCard
          label="Matriculados"
          value={matriculatedMembers}
          helper="Con matrícula cerrada"
          icon={ClipboardList}
          tone="emerald"
        />
        <TeamDetailSummaryCard
          label="Dorsales"
          value={numberedMembers}
          helper="Jugadores numerados"
          icon={Shirt}
          tone="amber"
        />
        <TeamDetailSummaryCard
          label="Posiciones"
          value={positionedMembers}
          helper="Roles deportivos definidos"
          icon={Trophy}
          tone="slate"
        />
      </div>

      {/* ── Jugadores del equipo ─────────────────────────────────── */}
      <section className="mb-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-blue-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Plantilla del equipo</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                {team.members.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Dorsales, posiciones y estado de matrícula de cada jugador.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-blue-50/80 text-blue-950 font-bold">
                <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Deportista</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 sm:table-cell">Tutor</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Dorsal</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 md:table-cell">Posición</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Matrícula</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold text-blue-950">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {team.members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-8 opacity-25" aria-hidden="true" />
                      <p className="text-sm">El equipo aún no tiene jugadores</p>
                      <p className="text-xs">Añade uno desde la sección inferior</p>
                    </div>
                  </td>
                </tr>
              )}
              {team.members.map((member) => (
                <tr
                  key={member.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    confirmRemoveId === member.id && 'bg-destructive/5',
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{member.nombre}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{member.tutor}</p>
                    <p className="mt-1 text-xs text-muted-foreground md:hidden">
                      {POSITION_OPTIONS.find((position) => position.value === member.position)?.label ?? 'Sin posición'}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{member.tutor}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.shirtNumber ?? ''}
                      disabled={isPending && updatingShirtNumberId === member.id}
                      onChange={(event) => handleShirtNumberChange(member.id, event.target.value)}
                      aria-label={`Dorsal de ${member.nombre}`}
                      className="h-9 min-w-24 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="">Sin dorsal</option>
                      {Array.from({ length: 99 }, (_, index) => index + 1).map((number) => (
                        <option key={number} value={number}>
                          {number}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <select
                      value={member.position ?? ''}
                      disabled={isPending && updatingPositionId === member.id}
                      onChange={(event) =>
                        handlePositionChange(member.id, event.target.value as PlayerPosition | '')
                      }
                      aria-label={`Posición de ${member.nombre}`}
                      className="h-9 min-w-40 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="">Sin posición</option>
                      {POSITION_OPTIONS.map((position) => (
                        <option key={position.value} value={position.value}>
                          {position.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', MATRICULA_STYLES[member.estadoMatricula])}>
                      {member.estadoMatricula}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmRemoveId === member.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Quitar?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleRemove(member.id)}>
                          Sí
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRemoveId(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmRemoveId(member.id)}
                      >
                        <UserMinus className="size-3.5" aria-hidden="true" />
                        Quitar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Añadir jugador ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-muted/30 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-blue-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Incorporar jugador</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Solo aparecen deportistas de esta categoría y temporada que todavía no tienen equipo asignado.
            </p>
          </div>
          <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-muted-foreground ring-1 ring-border">
            {team.available.length} disponibles
          </span>
        </div>

        {team.available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay deportistas sin equipo disponibles para esta temporada.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {team.available.length} deportista{team.available.length !== 1 ? 's' : ''} de categoría {team.categoria} sin equipo asignado.
            </p>
            <div className="grid gap-2 md:grid-cols-[1fr_190px_auto]">
              <select
                value={selectedAdd}
                onChange={(e) => setSelectedAdd(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona un deportista…</option>
                {team.available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.tutor}
                  </option>
                ))}
              </select>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as PlayerPosition | '')}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Posición…</option>
                {POSITION_OPTIONS.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
              <Button disabled={!selectedAdd || !selectedPosition || isPending} onClick={handleAdd}>
                <UserPlus className="size-4" aria-hidden="true" />
                Añadir
              </Button>
            </div>
          </>
        )}
      </section>

      {/* ── Sheet edición ─────────────────────────────────────────── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar equipo</SheetTitle>
            <SheetDescription>Modifica los datos de {team.nombre}.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-cat">Categoría</Label>
              <select
                id="edit-cat"
                value={editCat}
                onChange={(e) => setEditCat(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-season">Temporada</Label>
              <select
                id="edit-season"
                value={editSeason}
                onChange={(e) => setEditSeason(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-notes">Notas (opcional)</Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Observaciones internas…"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              <Label htmlFor="edit-active">Equipo activo</Label>
            </div>

          </div>

          <SheetFooter>
            <Button onClick={handleSaveEdit} disabled={isPending} className="w-full">
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <SheetClose render={<Button variant="outline" className="w-full">Cancelar</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AdminErrorDialog
        message={actionError ?? editError}
        onClose={() => { setActionError(null); setEditError(null) }}
      />

    </div>
  )
}
