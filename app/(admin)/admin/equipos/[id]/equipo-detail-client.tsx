'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, UserMinus, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetClose, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { AdminCategoryRow, AdminSeasonRow, AdminTeamDetail } from '@/lib/admin-app'
import { assignAthleteAction, removeAthleteAction, updateTeamAction } from '../actions'

const MATRICULA_STYLES = {
  Matriculado:   'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente:     'bg-amber-100 text-amber-700',
} as const

const TEAM_ESTADO_STYLES = {
  Abierto:  'bg-emerald-100 text-emerald-700',
  Completo: 'bg-blue-100 text-blue-700',
  Pendiente:'bg-amber-100 text-amber-700',
}

type Props = {
  team: AdminTeamDetail
  categories: AdminCategoryRow[]
  seasons: AdminSeasonRow[]
}

export function EquipoDetailClient({ team, categories, seasons }: Props) {
  const [isPending, startTransition] = useTransition()

  // jugadores
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [selectedAdd, setSelectedAdd]         = useState('')
  const [actionError, setActionError]         = useState<string | null>(null)

  // edición
  const [editOpen, setEditOpen]     = useState(false)
  const [editName, setEditName]     = useState(team.nombre)
  const [editCat, setEditCat]       = useState(team.categoryId)
  const [editSeason, setEditSeason] = useState(team.seasonId)
  const [editActive, setEditActive] = useState(team.isActive)
  const [editNotes, setEditNotes]   = useState(team.notes ?? '')
  const [editError, setEditError]   = useState<string | null>(null)

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
    setActionError(null)
    startTransition(async () => {
      try {
        await assignAthleteAction(team.id, selectedAdd)
        setSelectedAdd('')
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Error al añadir al jugador.')
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">

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
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {team.nombre}
          </h1>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', TEAM_ESTADO_STYLES[team.estado])}>
            {team.estado}
          </span>
          {!team.isActive && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Inactivo
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.categoria} · {team.temporada}
        </p>
        {team.notes && (
          <p className="mt-2 text-sm italic text-muted-foreground">{team.notes}</p>
        )}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Jugadores</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{team.deportistas}</p>
        </div>
        <div className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Disponibles para añadir</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{team.available.length}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Matriculados</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {team.members.filter((m) => m.estadoMatricula === 'Matriculado').length}
          </p>
        </div>
      </div>

      {actionError && (
        <p className="mb-6 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      )}

      {/* ── Jugadores del equipo ─────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Jugadores del equipo</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {team.members.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Deportista</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Tutor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Matrícula</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {team.members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
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
                  <td className="px-4 py-3 font-medium">{member.nombre}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{member.tutor}</td>
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
      <section className="rounded-xl bg-muted/30 p-5 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Añadir jugador al equipo</h2>
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
            <div className="flex gap-2">
              <select
                value={selectedAdd}
                onChange={(e) => setSelectedAdd(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona un deportista…</option>
                {team.available.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.tutor}
                  </option>
                ))}
              </select>
              <Button disabled={!selectedAdd || isPending} onClick={handleAdd}>
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

            {editError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {editError}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button onClick={handleSaveEdit} disabled={isPending} className="w-full">
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <SheetClose render={<Button variant="outline" className="w-full">Cancelar</Button>} />
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  )
}
