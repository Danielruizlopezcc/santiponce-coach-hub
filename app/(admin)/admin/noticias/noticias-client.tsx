'use client'

import { ChangeEvent, useState, useTransition } from 'react'
import Image from 'next/image'
import { Folder, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
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
import type { AdminNewsRow, AdminNewsSectionRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  createNews,
  createNewsSection,
  deleteNews,
  deleteNewsSection,
  updateNews,
  updateNewsSection,
} from './actions'

type SheetMode = 'create' | 'edit'

type Props = {
  news: AdminNewsRow[]
  sections: AdminNewsSectionRow[]
}

export function NoticiasClient({ news, sections }: Props) {
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('create')
  const [editing, setEditing] = useState<AdminNewsRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState('initial')
  const [sectionName, setSectionName] = useState('')
  const [sectionError, setSectionError] = useState<string | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')
  const [editingSectionActive, setEditingSectionActive] = useState(true)
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null)

  const firstAvailableSectionId = sections.find((section) => section.isActive)?.id ?? sections[0]?.id ?? ''
  const sectionOptions = sections.filter((section) => section.isActive || section.id === editing?.sectionId)

  function openCreate() {
    setMode('create')
    setEditing(null)
    setTitle('')
    setBody('')
    setSectionId(firstAvailableSectionId)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function openEdit(item: AdminNewsRow) {
    setMode('edit')
    setEditing(item)
    setTitle(item.title)
    setBody(item.body ?? '')
    setSectionId(item.sectionId ?? firstAvailableSectionId)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null)
  }

  function handleSubmit() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setFormError('El título es obligatorio.')
      return
    }

    if (!sectionId) {
      setFormError('Selecciona una sección.')
      return
    }

    if (mode === 'create' && !imageFile) {
      setFormError('Selecciona una imagen para la noticia.')
      return
    }

    setFormError(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('title', trimmedTitle)
        formData.set('body', body)
        formData.set('sectionId', sectionId)

        if (mode === 'create') {
          if (!imageFile) return
          formData.set('image', imageFile)
          await createNews(formData)
        } else if (editing) {
          formData.set('id', editing.id)
          if (imageFile) {
            formData.set('image', imageFile)
          }
          await updateNews(formData)
        }

        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Error al guardar la noticia.')
      }
    })
  }

  function handleCreateSection() {
    const trimmed = sectionName.trim()
    if (!trimmed) {
      setSectionError('El nombre de la sección es obligatorio.')
      return
    }

    setSectionError(null)
    startTransition(async () => {
      try {
        await createNewsSection(trimmed)
        setSectionName('')
      } catch (error) {
        setSectionError(error instanceof Error ? error.message : 'Error al crear la sección.')
      }
    })
  }

  function openEditSection(section: AdminNewsSectionRow) {
    setEditingSectionId(section.id)
    setEditingSectionName(section.name)
    setEditingSectionActive(section.isActive)
    setSectionError(null)
  }

  function handleUpdateSection() {
    if (!editingSectionId) return
    const trimmed = editingSectionName.trim()
    if (!trimmed) {
      setSectionError('El nombre de la sección es obligatorio.')
      return
    }

    setSectionError(null)
    startTransition(async () => {
      try {
        await updateNewsSection(editingSectionId, trimmed, editingSectionActive)
        setEditingSectionId(null)
        setEditingSectionName('')
      } catch (error) {
        setSectionError(error instanceof Error ? error.message : 'Error al guardar la sección.')
      }
    })
  }

  function handleDeleteSection(id: string) {
    startTransition(async () => {
      try {
        await deleteNewsSection(id)
        setConfirmDeleteSectionId(null)
      } catch (error) {
        setSectionError(error instanceof Error ? error.message : 'Error al eliminar la sección.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteNews(id)
        setConfirmDeleteId(null)
      } catch {
        // Silencioso por ahora
      }
    })
  }

  return (
    <PageContainer
      title="Noticias"
      description="Crea y gestiona noticias del club con imagen, título y cuerpo opcional."
      className="max-w-7xl"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {news.length} {news.length === 1 ? 'noticia' : 'noticias'}
        </span>
        <Button size="sm" onClick={openCreate} disabled={sections.length === 0}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva noticia
        </Button>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Folder className="size-4 text-primary" aria-hidden="true" />
              Secciones
            </h2>
            <p className="text-sm text-muted-foreground">Clasifica las noticias para poder filtrarlas más adelante.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Input
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
              placeholder="Ej. Cantera"
              className="min-w-0 sm:w-56"
            />
            <Button size="sm" onClick={handleCreateSection} disabled={isPending}>
              <Plus className="size-4" aria-hidden="true" />
              Crear
            </Button>
          </div>
        </div>

        {sectionError ? (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {sectionError}
          </p>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-border bg-background p-3">
              {editingSectionId === section.id ? (
                <div className="grid gap-3">
                  <Input
                    value={editingSectionName}
                    onChange={(event) => setEditingSectionName(event.target.value)}
                    autoFocus
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={editingSectionActive}
                      onChange={(event) => setEditingSectionActive(event.target.checked)}
                      className="size-4 rounded border-border"
                    />
                    Sección activa
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingSectionId(null)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleUpdateSection} disabled={isPending}>
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{section.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.newsCount} {section.newsCount === 1 ? 'noticia' : 'noticias'} ·{' '}
                      {section.isActive ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                  {confirmDeleteSectionId === section.id ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        Sí
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDeleteSectionId(null)}>
                        No
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditSection(section)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteSectionId(section.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Imagen</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Título</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Sección</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Cuerpo</th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">Fecha</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {news.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay noticias todavía. Crea la primera noticia del club.
                </td>
              </tr>
            ) : (
              news.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    confirmDeleteId === item.id && 'bg-destructive/5',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="relative h-16 w-28 overflow-hidden rounded-lg bg-muted">
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {item.sectionName}
                    </span>
                  </td>
                  <td className="hidden max-w-md px-4 py-3 text-muted-foreground md:table-cell">
                    {item.body ? item.body.slice(0, 120) : 'Sin cuerpo'}
                    {item.body && item.body.length > 120 ? '…' : ''}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{item.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(item.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setConfirmDeleteId(item.id)}
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
            <SheetTitle>{mode === 'create' ? 'Nueva noticia' : 'Editar noticia'}</SheetTitle>
            <SheetDescription>
              {mode === 'create'
                ? 'Añade una imagen obligatoria, un título y un cuerpo opcional.'
                : 'Actualiza los datos de la noticia. Deja la imagen vacía para conservarla.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-title">Título</Label>
              <Input
                id="news-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Nueva jornada del club"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-section">Sección</Label>
              <select
                id="news-section"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecciona una sección…</option>
                {sectionOptions.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                    {section.isActive ? '' : ' (inactiva)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-body">Cuerpo (opcional)</Label>
              <textarea
                id="news-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Contenido de la noticia…"
                rows={6}
                className="min-h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {mode === 'edit' && editing ? (
              <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium text-foreground">Imagen actual</span>
                <div className="relative h-28 overflow-hidden rounded-xl bg-muted">
                  <Image src={editing.imageUrl} alt={editing.title} fill className="object-cover" />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-image">Imagen</Label>
              <input
                key={inputKey}
                id="news-image"
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
                  ? 'Crear noticia'
                  : 'Guardar cambios'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}
