'use client'

import * as React from 'react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '@base-ui/react/dialog'
import { Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  CATEGORIAS,
  TIPOS_IDENTIFICACION,
  deportistaSchema,
  type DeportistaFormValues,
} from '@/lib/registro-schema'

const selectClasses = cn(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
  'disabled:pointer-events-none disabled:opacity-50 md:text-sm',
)

function newDeportistaId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

export type DeportistasSectionProps = {
  deportistas: DeportistaFormValues[]
  error?: string
  disabled?: boolean
  onAdd: (d: DeportistaFormValues) => void
  onUpdate: (index: number, d: DeportistaFormValues) => void
  onRemove: (index: number) => void
}

export function DeportistasSection({
  deportistas,
  error,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: DeportistasSectionProps) {
  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openCreate = () => {
    setEditingIndex(null)
    setOpen(true)
  }
  const openEdit = (index: number) => {
    setEditingIndex(index)
    setOpen(true)
  }

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        'grid gap-3 rounded-lg border border-border bg-card/60 p-4',
        error && 'border-destructive/40',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <legend className="text-sm font-medium">Deportistas relacionados</legend>
          <p className="text-xs text-muted-foreground">
            Añade al menos un deportista para continuar. Podrás editar o eliminar
            cada ficha antes de finalizar el registro.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <UserPlus aria-hidden="true" />
          Crear un deportista nuevo
        </Button>
      </div>

      {deportistas.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-6 text-center',
            error && 'border-destructive/50 bg-destructive/5',
          )}
        >
          <p className="text-sm font-medium text-foreground">
            Aún no has añadido ningún deportista
          </p>
          <p className="text-xs text-muted-foreground">
            Pulsa “Crear un deportista nuevo” para añadir el primero.
          </p>
          <Button type="button" variant="default" size="sm" onClick={openCreate}>
            <Plus aria-hidden="true" />
            Añadir deportista
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2">
          {deportistas.map((d, index) => (
            <li
              key={d.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-background/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {d.nombre} {d.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">
                  Categoría solicitada:{' '}
                  <span className="font-medium text-foreground">{d.categoria}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.tipoIdentificacion} {d.documento} · Nac. {d.fechaNacimiento}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(index)}
                  aria-label={`Editar deportista ${d.nombre} ${d.apellidos}`}
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(index)}
                  aria-label={`Eliminar deportista ${d.nombre} ${d.apellidos}`}
                >
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FieldError id="deportistas-error" message={error} />

      <DeportistaDialog
        open={open}
        onOpenChange={setOpen}
        initialValue={editingIndex !== null ? deportistas[editingIndex] : null}
        onSubmit={(values) => {
          if (editingIndex !== null) {
            onUpdate(editingIndex, values)
          } else {
            onAdd(values)
          }
          setOpen(false)
        }}
      />
    </fieldset>
  )
}

type DeportistaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue: DeportistaFormValues | null
  onSubmit: (values: DeportistaFormValues) => void
}

function DeportistaDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
}: DeportistaDialogProps) {
  const errId = useId()
  const isEdit = !!initialValue

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DeportistaFormValues>({
    resolver: zodResolver(deportistaSchema),
    mode: 'onBlur',
    defaultValues: {
      id: '',
      nombre: '',
      apellidos: '',
      fechaNacimiento: '',
      tipoIdentificacion: 'DNI',
      documento: '',
      email: '',
      telefono: '',
      alergias: '',
      tieneHermanos: 'no',
      nombreHermano: '',
      categoria: 'Bebés',
    },
  })

  // Reset al abrir según modo
  React.useEffect(() => {
    if (!open) return
    if (initialValue) {
      reset(initialValue)
    } else {
      reset({
        id: newDeportistaId(),
        nombre: '',
        apellidos: '',
        fechaNacimiento: '',
        tipoIdentificacion: 'DNI',
        documento: '',
        email: '',
        telefono: '',
        alergias: '',
        tieneHermanos: 'no',
        nombreHermano: '',
        categoria: 'Bebés',
      })
    }
  }, [open, initialValue, reset])

  const tieneHermanos = watch('tieneHermanos')

  const submit = handleSubmit((values) => {
    onSubmit({
      ...values,
      id: values.id || newDeportistaId(),
    })
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl',
            'transition duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0',
            'data-ending-style:scale-95 data-starting-style:scale-95',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-4">
            <div>
              <Dialog.Title className="font-heading text-base font-medium text-foreground">
                {isEdit ? 'Editar deportista' : 'Nuevo deportista'}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Cumplimenta los datos del deportista. El equipo se asignará más
                tarde desde administración.
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cerrar"
                />
              }
            >
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>

          <form
            noValidate
            onSubmit={submit}
            className="grid max-h-[70vh] gap-4 overflow-y-auto p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-nombre`}>
                  Nombre <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={`${errId}-nombre`}
                  autoComplete="given-name"
                  aria-invalid={!!errors.nombre || undefined}
                  aria-describedby={errors.nombre ? `${errId}-nombre-err` : undefined}
                  {...register('nombre')}
                />
                <FieldError id={`${errId}-nombre-err`} message={errors.nombre?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-apellidos`}>
                  Apellidos <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={`${errId}-apellidos`}
                  autoComplete="family-name"
                  aria-invalid={!!errors.apellidos || undefined}
                  aria-describedby={errors.apellidos ? `${errId}-apellidos-err` : undefined}
                  {...register('apellidos')}
                />
                <FieldError id={`${errId}-apellidos-err`} message={errors.apellidos?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-fnac`}>
                  Fecha de nacimiento <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={`${errId}-fnac`}
                  type="date"
                  aria-invalid={!!errors.fechaNacimiento || undefined}
                  aria-describedby={errors.fechaNacimiento ? `${errId}-fnac-err` : undefined}
                  {...register('fechaNacimiento')}
                />
                <FieldError id={`${errId}-fnac-err`} message={errors.fechaNacimiento?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-categoria`}>
                  Categoría solicitada para esta temporada{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <select
                  id={`${errId}-categoria`}
                  className={selectClasses}
                  aria-invalid={!!errors.categoria || undefined}
                  aria-describedby={errors.categoria ? `${errId}-categoria-err` : undefined}
                  {...register('categoria')}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <FieldError id={`${errId}-categoria-err`} message={errors.categoria?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-tipoId`}>
                  Tipo de identificación{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <select
                  id={`${errId}-tipoId`}
                  className={selectClasses}
                  aria-invalid={!!errors.tipoIdentificacion || undefined}
                  {...register('tipoIdentificacion')}
                >
                  {TIPOS_IDENTIFICACION.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <FieldError
                  id={`${errId}-tipoId-err`}
                  message={errors.tipoIdentificacion?.message}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-documento`}>
                  NIF / NIE o documento identificativo{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={`${errId}-documento`}
                  autoComplete="off"
                  aria-invalid={!!errors.documento || undefined}
                  aria-describedby={errors.documento ? `${errId}-documento-err` : undefined}
                  {...register('documento')}
                />
                <FieldError id={`${errId}-documento-err`} message={errors.documento?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-email`}>
                  Correo electrónico{' '}
                  <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`${errId}-email`}
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={errors.email ? `${errId}-email-err` : undefined}
                  {...register('email')}
                />
                <FieldError id={`${errId}-email-err`} message={errors.email?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-tel`}>
                  Teléfono móvil{' '}
                  <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`${errId}-tel`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.telefono || undefined}
                  aria-describedby={errors.telefono ? `${errId}-tel-err` : undefined}
                  {...register('telefono')}
                />
                <FieldError id={`${errId}-tel-err`} message={errors.telefono?.message} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${errId}-alergias`}>
                Enfermedades o alergias a tener en cuenta
              </Label>
              <textarea
                id={`${errId}-alergias`}
                rows={3}
                className={cn(
                  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none transition-colors',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
                  'md:text-sm',
                )}
                placeholder="Indica condiciones médicas relevantes, alergias o medicación."
                aria-invalid={!!errors.alergias || undefined}
                {...register('alergias')}
              />
              <FieldError id={`${errId}-alergias-err`} message={errors.alergias?.message} />
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                ¿Tiene hermanos inscritos en el club?{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/40">
                  <input
                    type="radio"
                    value="no"
                    className="size-4 accent-[var(--primary)]"
                    {...register('tieneHermanos')}
                  />
                  No
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/40">
                  <input
                    type="radio"
                    value="si"
                    className="size-4 accent-[var(--primary)]"
                    {...register('tieneHermanos')}
                  />
                  Sí
                </label>
              </div>
              <FieldError
                id={`${errId}-hermanos-err`}
                message={errors.tieneHermanos?.message}
              />
            </fieldset>

            {tieneHermanos === 'si' && (
              <div className="grid gap-2">
                <Label htmlFor={`${errId}-nhermano`}>
                  Nombre del hermano inscrito{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id={`${errId}-nhermano`}
                  autoComplete="off"
                  aria-invalid={!!errors.nombreHermano || undefined}
                  aria-describedby={
                    errors.nombreHermano ? `${errId}-nhermano-err` : undefined
                  }
                  {...register('nombreHermano')}
                />
                <FieldError
                  id={`${errId}-nhermano-err`}
                  message={errors.nombreHermano?.message}
                />
              </div>
            )}

            <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Dialog.Close
                render={<Button type="button" variant="ghost" />}
              >
                Cancelar
              </Dialog.Close>
              <Button type="submit">
                {isEdit ? 'Guardar cambios' : 'Añadir deportista'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}