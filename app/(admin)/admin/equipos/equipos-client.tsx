'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Layers, Pencil, Plus, Shield, Trash2, Trophy, Users } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminTeamRow, AdminCategoryRow, AdminSeasonRow } from '@/lib/admin-app'
import { CategoriasClient } from '../categorias/categorias-client'
import { createTeamAction, deleteTeamAction, updateTeamAction } from './actions'

const ESTADO_STYLES: Record<AdminTeamRow['estado'], string> = {
  Abierto:  'bg-emerald-100 text-emerald-700',
  Completo: 'bg-blue-100 text-blue-700',
  Pendiente:'bg-amber-100 text-amber-700',
}

type Props = {
  teams: AdminTeamRow[]
  categories: AdminCategoryRow[]
  seasons: AdminSeasonRow[]
}

type SheetMode = 'create' | 'edit'

export function EquiposClient({ teams, categories, seasons }: Props) {
  const [activeTab, setActiveTab] = useState<'equipos' | 'categorias'>('equipos')
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [mode, setMode]             = useState<SheetMode>('create')
  const [editing, setEditing]       = useState<AdminTeamRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError]   = useState<string | null>(null)

  // form
  const [name, setName]             = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [seasonId, setSeasonId]     = useState('')
  const [isActive, setIsActive]     = useState(true)
  const [notes, setNotes]           = useState('')

  const activeSeason = seasons.find((s) => s.estado === 'Activa')
  const activeTeams = teams.filter((team) => team.isActive)
  const totalPlayers = teams.reduce((sum, team) => sum + team.deportistas, 0)
  const openTeams = teams.filter((team) => team.estado === 'Abierto').length
  const completeTeams = teams.filter((team) => team.estado === 'Completo').length

  function openCreate() {
    setMode('create')
    setEditing(null)
    setName('')
    setCategoryId(categories[0]?.id ?? '')
    setSeasonId(activeSeason?.id ?? seasons[0]?.id ?? '')
    setIsActive(true)
    setNotes('')
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(team: AdminTeamRow) {
    setMode('edit')
    setEditing(team)
    setName(team.nombre)
    setCategoryId(team.categoryId)
    setSeasonId(team.seasonId)
    setIsActive(team.isActive)
    setNotes(team.notes ?? '')
    setFormError(null)
    setSheetOpen(true)
  }

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed)    { setFormError('El nombre es obligatorio.'); return }
    if (!categoryId) { setFormError('Selecciona una categoría.'); return }
    if (!seasonId)   { setFormError('Selecciona una temporada.'); return }
    setFormError(null)

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createTeamAction(trimmed, categoryId, seasonId, isActive, notes)
        } else if (editing) {
          await updateTeamAction(editing.id, trimmed, categoryId, seasonId, isActive, notes)
        }
        setSheetOpen(false)
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Error al guardar.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteTeamAction(id)
        setConfirmDeleteId(null)
      } catch {
        // silent
      }
    })
  }

  return (
    <PageContainer
      title="Equipos"
      description="Gestión deportiva de plantillas, categorías y jugadores asignados."
      className="max-w-7xl"
    >
      <section className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
              Gestión deportiva
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Plantillas por equipo
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground">
              Revisa la estructura de cantera por categoría y temporada. Desde cada equipo puedes
              entrar al detalle para gestionar jugadores, posiciones y dorsales.
            </p>
          </div>
          {activeTab === 'equipos' ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo equipo
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TeamSummaryCard
            title="Equipos"
            value={String(teams.length)}
            detail={`${activeTeams.length} activos en la estructura`}
            icon={Shield}
          />
          <TeamSummaryCard
            title="Jugadores"
            value={String(totalPlayers)}
            detail="Asignados actualmente a equipos"
            icon={Users}
            tone="green"
          />
          <TeamSummaryCard
            title="Abiertos"
            value={String(openTeams)}
            detail="Plantillas con margen de incorporación"
            icon={Trophy}
            tone="green"
          />
          <TeamSummaryCard
            title="Categorías"
            value={String(categories.length)}
            detail={`${completeTeams} equipos completos`}
            icon={Layers}
            tone="amber"
          />
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones de equipos">
        {[
          { id: 'equipos', label: 'Equipos' },
          { id: 'categorias', label: 'Categorías' },
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

      {activeTab === 'categorias' ? (
        <CategoriasClient categories={categories} embedded />
      ) : (
        <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-black tracking-tight text-foreground">Equipos configurados</p>
          <p className="text-sm font-semibold text-muted-foreground">
            Accede a cada plantilla para revisar jugadores, posiciones y dorsales.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {teams.length} equipos
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-blue-950 font-bold">
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Equipo</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 sm:table-cell">Categoría</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-bold text-blue-950 md:table-cell">Temporada</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Plantilla</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold text-blue-950">Estado</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold text-blue-950">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {teams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay equipos. Crea el primero.
                </td>
              </tr>
            )}
            {teams.map((team) => (
              <tr
                key={team.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  confirmDeleteId === team.id && 'bg-destructive/5',
                )}
              >
                <td className="px-4 py-3 font-medium">
                  <p>{team.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                    {team.categoria} · {team.temporada}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{team.categoria}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{team.temporada}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" aria-hidden="true" />
                    {team.deportistas}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ESTADO_STYLES[team.estado])}>
                    {team.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {confirmDeleteId === team.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">¿Eliminar equipo?</span>
                      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(team.id)}>
                        Sí, eliminar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/equipos/${team.id}`}>
                          <Users className="size-3.5" aria-hidden="true" />
                          Ver plantilla
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(team)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteId(team.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nuevo equipo' : 'Editar equipo'}
        description={mode === 'create' ? 'Rellena los datos para crear un equipo.' : 'Modifica los datos del equipo.'}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'create' ? 'Crear equipo' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-name">Nombre</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Benjamín A"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-category">Categoría</Label>
              <select
                id="team-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona categoría…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-season">Temporada</Label>
              <select
                id="team-season"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona temporada…</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-notes">Notas (opcional)</Label>
              <Input
                id="team-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones internas…"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
              <input
                id="team-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              <Label htmlFor="team-active">Equipo activo</Label>
            </div>

      </AdminFormDialog>
      <AdminErrorDialog message={formError} onClose={() => setFormError(null)} />
        </>
      )}
    </PageContainer>
  )
}

function TeamSummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string
  detail: string
  icon: typeof Shield
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
