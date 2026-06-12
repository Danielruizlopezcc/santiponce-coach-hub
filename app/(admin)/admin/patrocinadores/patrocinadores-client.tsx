'use client'

import { ChangeEvent, useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminSponsorRow } from '@/lib/admin-app'
import { createSponsor, deleteSponsor, updateSponsor } from './actions'

type SheetMode = 'create' | 'edit'

export function PatrocinadoresClient({ sponsors }: { sponsors: AdminSponsorRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('create')
  const [editing, setEditing] = useState<AdminSponsorRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [sortOrder, setSortOrder] = useState('1')
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(String(Date.now()))

  function openCreate() {
    setMode('create')
    setEditing(null)
    setTitle('')
    setSortOrder(String(sponsors.length + 1))
    setIsActive(true)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function openEdit(sponsor: AdminSponsorRow) {
    setMode('edit')
    setEditing(sponsor)
    setTitle(sponsor.title)
    setSortOrder(String(sponsor.sortOrder))
    setIsActive(sponsor.isActive)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)
  }

  function handleSubmit() {
    const trimmedTitle = title.trim()
    const order = parseInt(sortOrder, 10)

    if (!trimmedTitle) {
      setFormError('El título es obligatorio.')
      return
    }

    if (isNaN(order) || order < 1) {
      setFormError('El orden debe ser un número mayor que 0.')
      return
    }

    if (mode === 'create' && !imageFile) {
      setFormError('Selecciona una imagen para el patrocinador.')
      return
    }

    setFormError(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('title', trimmedTitle)
        formData.set('sortOrder', String(order))
        formData.set('isActive', String(isActive))

        if (mode === 'create') {
          if (!imageFile) return
          formData.set('image', imageFile)
          await createSponsor(formData)
        } else if (editing) {
          formData.set('id', editing.id)
          if (imageFile) {
            formData.set('image', imageFile)
          }
          await updateSponsor(formData)
        }

        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Error al guardar el patrocinador.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteSponsor(id)
        setConfirmDeleteId(null)
      } catch {
        // Silencioso por ahora
      }
    })
  }

  return (
    <PageContainer
      title="Patrocinadores"
      description="Gestiona los patrocinadores visibles para las familias del club."
      className="max-w-7xl"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {sponsors.length} {sponsors.length === 1 ? 'patrocinador' : 'patrocinadores'}
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo patrocinador
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Imagen
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Título
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Orden
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {sponsors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay patrocinadores todavía. Crea uno para que aparezca en el menú.
                </td>
              </tr>
            ) : (
              sponsors.map((sponsor) => (
                <tr
                  key={sponsor.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    confirmDeleteId === sponsor.id && 'bg-destructive/5',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={sponsor.imageUrl}
                          alt={sponsor.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{sponsor.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sponsor.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        sponsor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {sponsor.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmDeleteId === sponsor.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(sponsor.id)}
                        >
                          Sí, eliminar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(sponsor)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setConfirmDeleteId(sponsor.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {mode === 'create' ? 'Nuevo patrocinador' : 'Editar patrocinador'}
            </SheetTitle>
            <SheetDescription>
              {mode === 'create'
                ? 'Añade un título y una imagen para que se muestre a los usuarios.'
                : 'Actualiza los datos del patrocinador. Deja la imagen vacía para conservarla.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sponsor-title">Título</Label>
              <Input
                id="sponsor-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Clínica Santiponce"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sponsor-order">Orden</Label>
              <Input
                id="sponsor-order"
                type="number"
                min={1}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="sponsor-active"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              <Label htmlFor="sponsor-active">Visible para usuarios</Label>
            </div>

            {mode === 'edit' && editing ? (
              <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium text-foreground">Imagen actual</span>
                <div className="relative h-28 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={editing.imageUrl}
                    alt={editing.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sponsor-image">Imagen</Label>
              <input
                key={inputKey}
                id="sponsor-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
              />
            </div>

            {formError ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            ) : null}
          </div>

          <SheetFooter>
            <Button onClick={handleSubmit} disabled={isPending} className="w-full">
              {isPending
                ? 'Guardando…'
                : mode === 'create'
                ? 'Crear patrocinador'
                : 'Guardar cambios'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}
