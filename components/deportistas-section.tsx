'use client'

import * as React from 'react'
import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeportistaForm } from '@/components/deportista-form'
import { cn } from '@/lib/utils'
import { type DeportistaFormValues } from '@/lib/registro-schema'

function newDeportistaId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
                <p className="text-xs text-muted-foreground">
                  Estado inicial:{' '}
                  <span className="font-medium text-foreground">Pendiente</span>
                  {' · '}
                  Equipo:{' '}
                  <span className="font-medium text-foreground">Sin equipo asignado</span>
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
  const isEdit = !!initialValue
  const [formKey, setFormKey] = React.useState(0)

  React.useEffect(() => {
    if (open) {
      setFormKey((current) => current + 1)
    }
  }, [open, initialValue])

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

          <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-4">
            <DeportistaForm
              key={formKey}
              defaultValues={
                initialValue
                  ? initialValue
                  : {
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
                    }
              }
              submitLabel={isEdit ? 'Guardar cambios' : 'Añadir deportista'}
              readOnlyTeam={null}
              onSubmit={(values) => {
                onSubmit({
                  ...values,
                  id: values.id || newDeportistaId(),
                })
              }}
            />
            <div className="flex justify-end border-t border-border pt-4">
              <Dialog.Close render={<Button type="button" variant="ghost" />}>
                Cancelar
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
