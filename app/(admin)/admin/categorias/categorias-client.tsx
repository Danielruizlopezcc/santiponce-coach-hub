'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminCategoryRow } from '@/lib/admin-app'
import { createCategory, deleteCategory, updateCategory } from './actions'

type SheetMode = 'create' | 'edit'

type CategoriasClientProps = {
  categories: AdminCategoryRow[]
  embedded?: boolean
}

export function CategoriasClient({ categories, embedded = false }: CategoriasClientProps) {
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [mode, setMode]                 = useState<SheetMode>('create')
  const [editing, setEditing]           = useState<AdminCategoryRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError]       = useState<string | null>(null)

  // form fields
  const [name, setName]           = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [isActive, setIsActive]   = useState(true)

  function openCreate() {
    setMode('create')
    setEditing(null)
    setName('')
    setSortOrder(String(categories.length + 1))
    setIsActive(true)
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(cat: AdminCategoryRow) {
    setMode('edit')
    setEditing(cat)
    setName(cat.nombre)
    setSortOrder(String(cat.orden))
    setIsActive(cat.estado === 'Activa')
    setFormError(null)
    setSheetOpen(true)
  }

  function handleSubmit() {
    const trimmed = name.trim()
    const order = parseInt(sortOrder, 10)
    if (!trimmed) { setFormError('El nombre es obligatorio.'); return }
    if (isNaN(order) || order < 1) { setFormError('El orden debe ser un número mayor que 0.'); return }
    setFormError(null)

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createCategory(trimmed, order, isActive)
        } else if (editing) {
          await updateCategory(editing.id, trimmed, order, isActive)
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
        await deleteCategory(id)
        setConfirmDeleteId(null)
      } catch {
        // silent — unlikely to fail in practice
      }
    })
  }

  const content = (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Estructura deportiva</p>
          <h2 className="mt-1 text-xl font-black text-foreground">Categorías del club</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Ordena las edades deportivas que se usarán para equipos, altas y asignaciones.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl bg-white px-4 py-14 text-center text-sm font-semibold text-muted-foreground ring-1 ring-foreground/10">
          No hay categorías. Crea la primera.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => {
            const isDeleting = confirmDeleteId === cat.id

            return (
              <article
                key={cat.id}
                className={cn(
                  'overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-foreground/10 transition-colors',
                  isDeleting && 'bg-destructive/5 ring-destructive/25',
                )}
              >
                <div className="flex items-start justify-between gap-3 bg-primary p-4 text-white">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Categoría</p>
                    <h3 className="mt-2 text-2xl font-black leading-tight">{cat.nombre}</h3>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-black',
                      cat.estado === 'Activa'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white/15 text-white',
                    )}
                  >
                    {cat.estado}
                  </span>
                </div>

                <div className="p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-blue-50/70 p-3 ring-1 ring-blue-100">
                      <p className="text-xs font-black uppercase text-muted-foreground">Orden</p>
                      <p className="mt-2 text-3xl font-black text-foreground">{cat.orden}</p>
                    </div>
                    <div className="rounded-lg bg-muted/35 p-3 ring-1 ring-foreground/10">
                      <p className="text-xs font-black uppercase text-muted-foreground">Visibilidad</p>
                      <p className="mt-2 text-lg font-black text-foreground">
                        {cat.estado === 'Activa' ? 'Disponible' : 'Borrador'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-border pt-3">
                    {isDeleting ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-xs font-semibold text-muted-foreground">¿Eliminar categoría?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(cat.id)}
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
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setConfirmDeleteId(cat.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
        description={mode === 'create'
          ? 'Rellena los datos para crear una nueva categoría deportiva.'
          : 'Modifica los datos de la categoría.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear categoría'
                  : 'Guardar cambios'}
            </Button>
          </>
        }
      >
          <div className="space-y-4">
            <section className="rounded-xl bg-blue-50/70 p-4 ring-1 ring-blue-100">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Identidad</p>
              <div className="mt-3 flex flex-col gap-1.5">
                <Label htmlFor="cat-name">Nombre</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Benjamín"
                  autoFocus
                />
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 ring-1 ring-foreground/10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Orden y estado</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cat-order">Orden</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/35 px-3 py-3">
                  <div>
                    <Label htmlFor="cat-active" className="font-black">Activa</Label>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      Disponible para altas y equipos.
                    </p>
                  </div>
                  <input
                    id="cat-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded border-border accent-primary"
                  />
                </div>
              </div>
            </section>
          </div>

      </AdminFormDialog>
      <AdminErrorDialog message={formError} onClose={() => setFormError(null)} />
    </>
  )

  if (embedded) {
    return content
  }

  return (
    <PageContainer
      title="Categorías"
      description="Gestión de categorías deportivas para la temporada."
      className="max-w-7xl"
    >
      {content}
    </PageContainer>
  )
}
