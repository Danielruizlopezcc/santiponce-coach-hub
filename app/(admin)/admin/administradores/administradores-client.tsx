'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
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
const ROLE_OPTIONS = [
  { label: 'Administrador General', value: 'admin' },
  { label: 'Coordinador deportivo', value: 'sports_coordinator' },
] as const

const ROLE_META: Record<AdminManagerRow['role'], {
  label: string
  description: string
  badge: string
  scope: string
}> = {
  admin: {
    label: 'Administrador General',
    description: 'Acceso completo a administración, familias, cuotas, contabilidad y configuración.',
    badge: 'bg-primary/10 text-primary',
    scope: 'Panel completo',
  },
  sports_coordinator: {
    label: 'Coordinador deportivo',
    description: 'Acceso centrado en gestión deportiva: equipos, entrenadores, deportistas y calendario.',
    badge: 'bg-emerald-100 text-emerald-700',
    scope: 'Gestión deportiva',
  },
}

function FormMessage({ state }: { state: AdminManagerActionState }) {
  if (!state.message || !state.ok) return null
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

function AdminFormSection({
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
          <ShieldCheck className="size-5" aria-hidden="true" />
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

function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-black text-foreground">{label}</span>
      {children}
    </label>
  )
}

function RoleChoice({
  role,
  name,
  checked,
  defaultChecked,
  onChange,
}: {
  role: (typeof ROLE_OPTIONS)[number]
  name: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: () => void
}) {
  const meta = ROLE_META[role.value]

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-blue-50/40">
      <input
        type="radio"
        name={name}
        value={role.value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-primary"
        required
      />
      <span>
        <span className="block font-black">{meta.label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">{meta.description}</span>
      </span>
    </label>
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
    role: 'admin' as AdminManagerRow['role'],
  })

  const visibleAdmins = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return admins
    return admins.filter((admin) =>
      [admin.nombre, admin.email, admin.rol, admin.estado, admin.fechaAlta].join(' ').toLowerCase().includes(query),
    )
  }, [admins, search])
  const adminCount = admins.filter((admin) => admin.role === 'admin').length
  const coordinatorCount = admins.filter((admin) => admin.role === 'sports_coordinator').length

  function openEdit(admin: AdminManagerRow) {
    const [nombre, ...apellidos] = admin.nombre.split(' ')
    setDeleteId(null)
    setActionError(null)
    setEditId(admin.id)
    setDraft({
      nombre: nombre ?? '',
      apellidos: apellidos.join(' '),
      email: admin.email,
      role: admin.role,
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
          role: draft.role,
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
      <div className="rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Sistema y permisos</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Administradores del panel</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Controla quién puede acceder al panel y qué alcance tiene cada rol dentro del club.
            </p>
          </div>
          <Button type="button" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear administrador
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Total usuarios</p>
            <p className="mt-2 text-3xl font-black text-primary">{admins.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Con acceso administrativo</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700/70">Administradores</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{adminCount}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Acceso completo</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Coordinadores</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{coordinatorCount}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Solo gestión deportiva</p>
          </div>
        </div>
      </div>

      <AdminFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Crear administrador"
        description="Crea una cuenta de administración y selecciona su nivel de permisos."
        maxWidth="md"
      >
        <form action={action} className="space-y-4">
          <AdminFormSection
            title="Identidad"
            description="Datos visibles para reconocer a la persona dentro del panel."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Nombre">
                <Input name="nombre" placeholder="Nombre" required />
              </AdminField>
              <AdminField label="Apellidos">
                <Input name="apellidos" placeholder="Apellidos" required />
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Acceso"
            description="Credenciales iniciales para entrar al panel de administración."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Email">
                <Input name="email" type="email" placeholder="admin@club.com" required />
              </AdminField>
              <AdminField label="Contraseña">
                <Input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Permisos"
            description="Selecciona el alcance real que tendrá esta cuenta."
          >
            <fieldset>
              <legend className="sr-only">Tipo de usuario</legend>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <RoleChoice key={role.value} role={role} name="role" defaultChecked={role.value === 'admin'} />
                ))}
              </div>
            </fieldset>
          </AdminFormSection>
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
          <AdminFormSection
            title="Identidad"
            description="Actualiza el nombre visible de la cuenta administrativa."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Nombre">
                <Input
                  value={draft.nombre}
                  onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
                  placeholder="Nombre"
                />
              </AdminField>
              <AdminField label="Apellidos">
                <Input
                  value={draft.apellidos}
                  onChange={(event) => setDraft((current) => ({ ...current, apellidos: event.target.value }))}
                  placeholder="Apellidos"
                />
              </AdminField>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Acceso"
            description="Email usado para iniciar sesión en el panel."
          >
            <AdminField label="Email">
              <Input
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                type="email"
                placeholder="Email"
              />
            </AdminField>
          </AdminFormSection>

          <AdminFormSection
            title="Permisos"
            description="Cambiar el rol modifica las secciones disponibles para este usuario."
          >
            <fieldset>
              <legend className="sr-only">Tipo de usuario</legend>
              <div className="grid gap-2">
              {ROLE_OPTIONS.map((role) => (
                <RoleChoice
                  key={role.value}
                  role={role}
                  name="edit-role"
                  checked={draft.role === role.value}
                  onChange={() => setDraft((current) => ({ ...current, role: role.value }))}
                />
              ))}
              </div>
            </fieldset>
          </AdminFormSection>
        </div>
      </AdminFormDialog>

      <section className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Usuarios con permisos</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{visibleAdmins.length} visibles según filtros</p>
          </div>
          <div className="relative min-w-72 flex-1 md:max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, email o estado"
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-3">
          {visibleAdmins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <X className="size-8 opacity-30" aria-hidden="true" />
                <p className="text-sm font-medium">Sin administradores</p>
                <p className="text-xs">No hay administradores con los filtros actuales.</p>
              </div>
            </div>
          ) : null}
          {visibleAdmins.map((admin) => {
            const isDeleting = deleteId === admin.id
            const roleMeta = ROLE_META[admin.role]

            return (
              <article key={admin.id} className={cn('rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-50/20', isDeleting && 'border-destructive/30 bg-destructive/5')}>
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black', roleMeta.badge)}>
                        <ShieldCheck className="size-3.5" />
                        {roleMeta.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {admin.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-black text-foreground">{admin.nombre}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">{admin.email}</p>

                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Alcance</p>
                        <p className="mt-1 font-semibold text-foreground">{roleMeta.scope}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Alta</p>
                        <p className="mt-1 font-semibold text-foreground">{admin.fechaAlta}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Permisos</p>
                        <p className="mt-1 line-clamp-2 font-semibold text-foreground">{roleMeta.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {isDeleting ? (
                      <div className="flex flex-wrap items-center justify-start gap-2 rounded-lg bg-rose-50 p-2 lg:justify-end">
                        <span className="text-xs font-semibold text-rose-700">¿Eliminar administrador?</span>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(admin.id)}>
                          Sí, eliminar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
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
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <AdminErrorDialog
        message={state.message && !state.ok ? state.message : actionError}
        onClose={() => setActionError(null)}
      />
    </div>
  )
}
