'use client'

import { ChangeEvent, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { CalendarDays, FileText, Folder, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { PageContainer } from '@/components/page-container'
import { RichTextEditor } from '@/components/rich-text-editor'
import { SafeImage } from '@/components/safe-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AdminNewsRow, AdminNewsSectionRow } from '@/lib/admin-app'
import { getPlainNewsText } from '@/lib/news-content'
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

function NewsFormSection({
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
          <FileText className="size-5" aria-hidden="true" />
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
  const activeSections = sections.filter((section) => section.isActive)
  const inactiveSections = sections.filter((section) => !section.isActive)

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

    if (!body.trim()) {
      setFormError('El contenido de la noticia es obligatorio.')
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
      <div className="mb-6 rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Comunicación del club</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Noticias y publicaciones</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Organiza las noticias que se muestran a familias y visitantes por secciones, imagen y contenido.
            </p>
          </div>
          <Button size="sm" onClick={openCreate} disabled={sections.length === 0}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva noticia
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Noticias</p>
            <p className="mt-2 text-3xl font-black text-primary">{news.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Publicaciones guardadas</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Secciones activas</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{activeSections.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Disponibles para publicar</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700/70">Inactivas</p>
            <p className="mt-2 text-3xl font-black text-slate-700">{inactiveSections.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Ocultas en selección</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700/70">Con contenido</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{news.filter((item) => getPlainNewsText(item.body ?? '').trim()).length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Noticias redactadas</p>
          </div>
        </div>
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

      <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Publicaciones</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{news.length} noticias configuradas</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {news.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              No hay noticias todavía. Crea la primera noticia del club.
            </div>
          ) : null}
          {news.map((item) => {
            const isDeleting = confirmDeleteId === item.id
            const plainBody = getPlainNewsText(item.body ?? '').trim()

            return (
              <article
                key={item.id}
                className={cn(
                  'overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-colors hover:border-primary/25',
                  isDeleting && 'border-destructive/30 bg-destructive/5',
                )}
              >
                <div className="relative h-44 bg-muted">
                  <SafeImage src={item.imageUrl} alt={item.title} fallbackSrc="/images/Fondo1.png" fill className="object-cover" />
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                        <Folder className="size-3.5" aria-hidden="true" />
                        {item.sectionName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {item.createdAt}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-lg font-black leading-tight text-foreground">{item.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-muted-foreground">
                      {plainBody ? plainBody : 'Sin cuerpo'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Contenido</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                      <FileText className="size-3.5" aria-hidden="true" />
                      {plainBody.length} caracteres
                    </p>
                  </div>

                  {isDeleting ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 p-2">
                      <span className="text-xs font-semibold text-rose-700">¿Eliminar noticia?</span>
                      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(item.id)}>
                        Sí, eliminar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1 border-t border-border pt-3">
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
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#06172f]/55 backdrop-blur-sm" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border bg-[#06172f] px-6 py-5 text-white">
              <div>
                <Dialog.Title className="text-2xl font-black tracking-tight">
                  {mode === 'create' ? 'Nueva noticia' : 'Editar noticia'}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm font-medium text-white/70">
                  {mode === 'create'
                    ? 'Añade imagen, título, sección y contenido completo para la página de la noticia.'
                    : 'Actualiza los datos de la noticia. Deja la imagen vacía para conservarla.'}
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" />
                }
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Cerrar</span>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <NewsFormSection
                    title="Contenido"
                    description="Título y cuerpo principal de la noticia que leerán familias y visitantes."
                  >
                    <div className="space-y-4">
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
                        <Label htmlFor="news-body">Contenido de la noticia</Label>
                        <RichTextEditor id="news-body" value={body} onChange={setBody} />
                      </div>
                    </div>
                  </NewsFormSection>
                </div>

                <aside className="space-y-4">
                  <NewsFormSection
                    title="Clasificación"
                    description="Sección donde aparecerá agrupada esta publicación."
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="news-section">Sección</Label>
                      <select
                        id="news-section"
                        value={sectionId}
                        onChange={(event) => setSectionId(event.target.value)}
                        className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Selecciona una sección...</option>
                        {sectionOptions.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                            {section.isActive ? '' : ' (inactiva)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </NewsFormSection>

                  <NewsFormSection
                    title="Imagen"
                    description={mode === 'create' ? 'La imagen es obligatoria al crear la noticia.' : 'Deja el campo vacío para conservar la imagen actual.'}
                  >
                    <div className="space-y-4">
                      {mode === 'edit' && editing ? (
                        <div className="grid gap-2 rounded-lg border border-border bg-white p-3">
                          <span className="text-sm font-black text-foreground">Imagen actual</span>
                          <div className="relative h-44 overflow-hidden rounded-lg bg-muted">
                            <SafeImage src={editing.imageUrl} alt={editing.title} fallbackSrc="/images/Fondo1.png" fill className="object-cover" />
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
                          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
                        />
                      </div>
                    </div>
                  </NewsFormSection>
                </aside>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-white px-6 py-4">
              <Dialog.Close render={<Button type="button" variant="outline" />}>
                Cancelar
              </Dialog.Close>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? 'Guardando...'
                  : mode === 'create'
                    ? 'Crear noticia'
                    : 'Guardar cambios'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <AdminErrorDialog message={formError ?? sectionError} onClose={() => { setFormError(null); setSectionError(null) }} />
    </PageContainer>
  )
}
