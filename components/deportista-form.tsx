'use client'

import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

function createDefaultValues(): DeportistaFormValues {
  return {
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
  }
}

type DeportistaFormProps = {
  defaultValues?: DeportistaFormValues
  submitLabel: string
  isSubmitting?: boolean
  readOnlyTeam?: string | null
  onSubmit: (values: DeportistaFormValues) => void | Promise<void>
}

export function DeportistaForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  readOnlyTeam,
  onSubmit,
}: DeportistaFormProps) {
  const errId = useId()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<DeportistaFormValues>({
    resolver: zodResolver(deportistaSchema),
    mode: 'onBlur',
    defaultValues: defaultValues ?? createDefaultValues(),
  })

  const tieneHermanos = watch('tieneHermanos')
  const disabled = isSubmitting || formSubmitting
  const submitForm = handleSubmit(onSubmit)

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.stopPropagation()
        void submitForm(event)
      }}
      className="grid gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-nombre`}>
            Nombre <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id={`${errId}-nombre`}
            aria-invalid={!!errors.nombre || undefined}
            aria-describedby={errors.nombre ? `${errId}-nombre-error` : undefined}
            {...register('nombre')}
          />
          <FieldError id={`${errId}-nombre-error`} message={errors.nombre?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-apellidos`}>
            Apellidos <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id={`${errId}-apellidos`}
            aria-invalid={!!errors.apellidos || undefined}
            aria-describedby={errors.apellidos ? `${errId}-apellidos-error` : undefined}
            {...register('apellidos')}
          />
          <FieldError
            id={`${errId}-apellidos-error`}
            message={errors.apellidos?.message}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-fecha-nacimiento`}>
            Fecha de nacimiento <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id={`${errId}-fecha-nacimiento`}
            type="date"
            aria-invalid={!!errors.fechaNacimiento || undefined}
            aria-describedby={
              errors.fechaNacimiento ? `${errId}-fecha-nacimiento-error` : undefined
            }
            {...register('fechaNacimiento')}
          />
          <FieldError
            id={`${errId}-fecha-nacimiento-error`}
            message={errors.fechaNacimiento?.message}
          />
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
            aria-describedby={errors.categoria ? `${errId}-categoria-error` : undefined}
            {...register('categoria')}
          >
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
          <FieldError id={`${errId}-categoria-error`} message={errors.categoria?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-tipo-identificacion`}>
            Tipo de identificación{' '}
            <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <select
            id={`${errId}-tipo-identificacion`}
            className={selectClasses}
            aria-invalid={!!errors.tipoIdentificacion || undefined}
            {...register('tipoIdentificacion')}
          >
            {TIPOS_IDENTIFICACION.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          <FieldError
            id={`${errId}-tipo-identificacion-error`}
            message={errors.tipoIdentificacion?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-documento`}>
            NIF/NIE o documento identificativo{' '}
            <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id={`${errId}-documento`}
            aria-invalid={!!errors.documento || undefined}
            aria-describedby={errors.documento ? `${errId}-documento-error` : undefined}
            {...register('documento')}
          />
          <FieldError id={`${errId}-documento-error`} message={errors.documento?.message} />
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
            aria-invalid={!!errors.email || undefined}
            aria-describedby={errors.email ? `${errId}-email-error` : undefined}
            {...register('email')}
          />
          <FieldError id={`${errId}-email-error`} message={errors.email?.message} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${errId}-telefono`}>
            Teléfono móvil{' '}
            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id={`${errId}-telefono`}
            type="tel"
            inputMode="tel"
            aria-invalid={!!errors.telefono || undefined}
            aria-describedby={errors.telefono ? `${errId}-telefono-error` : undefined}
            {...register('telefono')}
          />
          <FieldError id={`${errId}-telefono-error`} message={errors.telefono?.message} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${errId}-alergias`}>Enfermedades o alergias a tener en cuenta</Label>
        <textarea
          id={`${errId}-alergias`}
          rows={4}
          className={cn(
            'w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          )}
          aria-invalid={!!errors.alergias || undefined}
          {...register('alergias')}
        />
        <FieldError id={`${errId}-alergias-error`} message={errors.alergias?.message} />
      </div>

      <fieldset className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4">
        <legend className="px-1 text-sm font-medium">
          ¿Tiene hermanos inscritos en el club?{' '}
          <span aria-hidden="true" className="text-destructive">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
            <input
              type="radio"
              value="no"
              className="size-4 accent-[var(--primary)]"
              {...register('tieneHermanos')}
            />
            No
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
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
          id={`${errId}-tiene-hermanos-error`}
          message={errors.tieneHermanos?.message}
        />

        {tieneHermanos === 'si' && (
          <div className="grid gap-2">
            <Label htmlFor={`${errId}-nombre-hermano`}>
              Nombre del hermano <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id={`${errId}-nombre-hermano`}
              aria-invalid={!!errors.nombreHermano || undefined}
              aria-describedby={
                errors.nombreHermano ? `${errId}-nombre-hermano-error` : undefined
              }
              {...register('nombreHermano')}
            />
            <FieldError
              id={`${errId}-nombre-hermano-error`}
              message={errors.nombreHermano?.message}
            />
          </div>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor={`${errId}-equipo-lectura`}>Equipo asignado</Label>
        <Input
          id={`${errId}-equipo-lectura`}
          value={readOnlyTeam ?? 'Sin equipo asignado'}
          readOnly
          disabled
        />
        <p className="text-xs text-muted-foreground">
          El equipo será asignado más adelante desde administración.
        </p>
      </div>

      <input type="hidden" {...register('id')} />

      <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
        {disabled && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </Button>
    </form>
  )
}
