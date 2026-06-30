'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminManagerRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  createAdminManagerAction,
  deleteAdminManagerAction,
  type AdminManagerActionState,
  updateAdminManagerAction,
} from './actions'

const initialState: AdminManagerActionState = { ok: false, message: '' }

function FormMessage({ state }: { state: AdminManagerActionState }) {
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

export function AdministradoresClient({ admins }: { admins: AdminManagerRow[] }) {
  const [state, action, pending] = useActionState(createAdminManagerAction, initialState)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState({
    nombre: '',
    apellidos: '',
    email: '',
  })

  const visibleAdmins = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return admins
    return admins.filter((admin) =>
      [admin.nombre, admin.email, admin.rol, admin.estado, admin.fechaAlta].join(' ').toLowerCase().includes(query),
    )
  }, [admins, search])

  function openEdit(admin: AdminManagerRow) {
    const [nombre, ...apellidos] = admin.nombre.split(' ')
    setDeleteId(null)
    setActionError(null)
    setEditId(admin.id)
    setDraft({
      nombre: nombre ?? '',
      apellidos: apellidos.join(' '),
      email: admin.email,
    })
  }

  function handleSave() {
    if (!editId) return
    setActionError(null)
    startTransition(async () => {
      try {
        await updateAdminManagerAction({
          adminId: editId,
          nombre: draft.nombre,
          apellidos: draft.apellidos,
          email: draft.email,
        })
        setEditId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al actualizar el administrador.')
      }
    })
  }

  function handleDelete(id: string) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteAdminManagerAction(id)
        setDeleteId(null)
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Error al eliminar el administrador.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {admins.length} administradores
        </span>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Crear administrador
        </Button>
      </div>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Crear administrador"
        description="Crea una cuenta con permisos completos de administración."
        maxWidth="md"
      >
        <form action={action} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="nombre" placeholder="Nombre" required />
            <Input name="apellidos" placeholder="Apellidos" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Contraseña" minLength={8} required />
          </div>
          <FormMessage state={state} />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={pending} />}>
              Cancelar
            </Dialog.Close>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Crear administrador
            </Button>
          </div>
        </form>
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(editId)}
        onOpenChange={(open) => {
          if (!open) setEditId(null)
        }}
        title="Editar administrador"
        description="Actualiza los datos de acceso y perfil."
        maxWidth="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditId(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={draft.nombre}
              onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Nombre"
            />
            <Input
              value={draft.apellidos}
              onChange={(event) => setDraft((current) => ({ ...current, apellidos: event.target.value }))}
              placeholder="Apellidos"
            />
          </div>
          <Input
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            type="email"
            placeholder="Email"
          />
        </div>
      </AdminFormDialog>

      <section className="rounded-lg bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, email o estado"
            className="pl-9"
          />
        </div>

        {actionError ? (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{actionError}</p>
        ) : null}

        <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Rol</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Alta</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <X className="size-8 opacity-30" aria-hidden="true" />
                      <p className="text-sm font-medium">Sin administradores</p>
                      <p className="text-xs">No hay administradores con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleAdmins.map((admin) => {
                  const isDeleting = deleteId === admin.id

                  return (
                    <tr key={admin.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                      <td className="px-4 py-3 font-semibold text-foreground">{admin.nombre}</td>
                      <td className="hidden px-4 py-3 md:table-cell">{admin.email}</td>
                      <td className="px-4 py-3">{admin.rol}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">{admin.fechaAlta}</td>
                      <td className="px-4 py-3 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(admin.id)}>
                              Sí, eliminar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" aria-label="Editar administrador" onClick={() => openEdit(admin)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="destructive"
                              aria-label="Eliminar administrador"
                              onClick={() => {
                                setEditId(null)
                                setDeleteId(admin.id)
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
