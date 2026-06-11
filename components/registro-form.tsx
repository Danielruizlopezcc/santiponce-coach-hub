'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  registroSchema,
  type RegistroFormValues,
} from '@/lib/registro-schema'

type FieldErrorProps = { id: string; message?: string }
function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

const selectClasses = cn(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
  'disabled:pointer-events-none disabled:opacity-50 md:text-sm',
)

export function RegistroForm() {
  const errId = useId()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      documento: '',
      direccion: '',
      codigoPostal: '',
      provincia: '',
      ciudad: '',
      pais: 'España',
      preferenciaPago: 'cuotas',
      password: '',
      confirmPassword: '',
      consentimiento: '',
    },
  })

  // Bloquea reenvío mientras esté procesando o ya enviado correctamente.
  const disabled = isSubmitting || submitted

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      // TODO: Conectar con la Server Action cuando esté disponible.
      // await registroAction(values)
      await new Promise((r) => setTimeout(r, 600))
      // Marca como enviado para evitar doble envío.
      setSubmitted(true)
      if (typeof console !== 'undefined') {
        console.info('[registro] datos validados', { email: values.email })
      }
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'No se ha podido completar el registro. Inténtalo de nuevo.',
      )
    }
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      aria-busy={isSubmitting || undefined}
    >
      {/* Datos personales */}
      <fieldset disabled={disabled} className="contents">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombre">
              Nombre <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              autoComplete="given-name"
              placeholder="Tu nombre"
              aria-invalid={!!errors.nombre || undefined}
              aria-describedby={errors.nombre ? `${errId}-nombre` : undefined}
              {...register('nombre')}
            />
            <FieldError id={`${errId}-nombre`} message={errors.nombre?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apellidos">
              Apellidos <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="apellidos"
              autoComplete="family-name"
              placeholder="Tus apellidos"
              aria-invalid={!!errors.apellidos || undefined}
              aria-describedby={errors.apellidos ? `${errId}-apellidos` : undefined}
              {...register('apellidos')}
            />
            <FieldError id={`${errId}-apellidos`} message={errors.apellidos?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">
              Correo electrónico <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              aria-invalid={!!errors.email || undefined}
              aria-describedby={errors.email ? `${errId}-email` : undefined}
              {...register('email')}
            />
            <FieldError id={`${errId}-email`} message={errors.email?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefono">
              Teléfono <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="600 123 456"
              aria-invalid={!!errors.telefono || undefined}
              aria-describedby={errors.telefono ? `${errId}-telefono` : undefined}
              {...register('telefono')}
            />
            <FieldError id={`${errId}-telefono`} message={errors.telefono?.message} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="documento">
            DNI / NIE <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="documento"
            autoComplete="off"
            placeholder="12345678A o X1234567A"
            aria-invalid={!!errors.documento || undefined}
            aria-describedby={errors.documento ? `${errId}-documento` : undefined}
            {...register('documento')}
          />
          <FieldError id={`${errId}-documento`} message={errors.documento?.message} />
        </div>

        {/* Dirección */}
        <div className="grid gap-2">
          <Label htmlFor="direccion">
            Dirección <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="direccion"
            autoComplete="street-address"
            placeholder="Calle, número, piso..."
            aria-invalid={!!errors.direccion || undefined}
            aria-describedby={errors.direccion ? `${errId}-direccion` : undefined}
            {...register('direccion')}
          />
          <FieldError id={`${errId}-direccion`} message={errors.direccion?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="codigoPostal">
              Código postal <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="codigoPostal"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="41907"
              maxLength={5}
              aria-invalid={!!errors.codigoPostal || undefined}
              aria-describedby={errors.codigoPostal ? `${errId}-cp` : undefined}
              {...register('codigoPostal')}
            />
            <FieldError id={`${errId}-cp`} message={errors.codigoPostal?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ciudad">
              Ciudad <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="ciudad"
              autoComplete="address-level2"
              placeholder="Santiponce"
              aria-invalid={!!errors.ciudad || undefined}
              aria-describedby={errors.ciudad ? `${errId}-ciudad` : undefined}
              {...register('ciudad')}
            />
            <FieldError id={`${errId}-ciudad`} message={errors.ciudad?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="provincia">
              Provincia <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="provincia"
              autoComplete="address-level1"
              placeholder="Sevilla"
              aria-invalid={!!errors.provincia || undefined}
              aria-describedby={errors.provincia ? `${errId}-provincia` : undefined}
              {...register('provincia')}
            />
            <FieldError id={`${errId}-provincia`} message={errors.provincia?.message} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="pais">
            País <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <select
            id="pais"
            autoComplete="country-name"
            className={selectClasses}
            aria-invalid={!!errors.pais || undefined}
            aria-describedby={errors.pais ? `${errId}-pais` : undefined}
            {...register('pais')}
          >
            <option value="España">España</option>
            <option value="Portugal">Portugal</option>
            <option value="Francia">Francia</option>
            <option value="Andorra">Andorra</option>
            <option value="Otro">Otro</option>
          </select>
          <FieldError id={`${errId}-pais`} message={errors.pais?.message} />
        </div>

        {/* Preferencia de pago */}
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            Preferencia de pago <span aria-hidden="true" className="text-destructive">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card/60 p-3 text-sm transition-colors hover:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
              <input
                type="radio"
                value="cuotas"
                className="mt-0.5 size-4 accent-[var(--primary)]"
                {...register('preferenciaPago')}
              />
              <span>
                <span className="block font-medium text-foreground">Cuotas</span>
                <span className="block text-xs text-muted-foreground">
                  Pago fraccionado durante la temporada.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card/60 p-3 text-sm transition-colors hover:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
              <input
                type="radio"
                value="unico"
                className="mt-0.5 size-4 accent-[var(--primary)]"
                {...register('preferenciaPago')}
              />
              <span>
                <span className="block font-medium text-foreground">Pago único</span>
                <span className="block text-xs text-muted-foreground">
                  Un solo pago al matricular.
                </span>
              </span>
            </label>
          </div>
          <FieldError
            id={`${errId}-pago`}
            message={errors.preferenciaPago?.message}
          />
        </fieldset>

        {/* Contraseñas */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="password">
              Contraseña <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mín. 8, mayús., minús. y número"
              aria-invalid={!!errors.password || undefined}
              aria-describedby={
                errors.password ? `${errId}-password` : `${errId}-password-hint`
              }
              {...register('password')}
            />
            {errors.password ? (
              <FieldError id={`${errId}-password`} message={errors.password.message} />
            ) : (
              <p id={`${errId}-password-hint`} className="text-xs text-muted-foreground">
                Mínimo 8 caracteres con mayúscula, minúscula y número.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">
              Confirmar contraseña <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              aria-invalid={!!errors.confirmPassword || undefined}
              aria-describedby={
                errors.confirmPassword ? `${errId}-confirm` : undefined
              }
              {...register('confirmPassword')}
            />
            <FieldError
              id={`${errId}-confirm`}
              message={errors.confirmPassword?.message}
            />
          </div>
        </div>

        {/* Consentimiento digital */}
        <div className="grid gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <Label htmlFor="consentimiento">
            Consentimiento digital <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground text-pretty">
            Escribe tu <strong>nombre completo</strong> tal y como aparece arriba
            para confirmar que aceptas la{' '}
            <Link
              href="/legal/privacidad"
              className="rounded text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              política de privacidad
            </Link>{' '}
            y las{' '}
            <Link
              href="/legal/condiciones-matricula"
              className="rounded text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              condiciones de matrícula
            </Link>
            .
          </p>
          <Input
            id="consentimiento"
            autoComplete="off"
            placeholder="Nombre y apellidos"
            aria-invalid={!!errors.consentimiento || undefined}
            aria-describedby={
              errors.consentimiento ? `${errId}-consent` : undefined
            }
            {...register('consentimiento')}
          />
          <FieldError
            id={`${errId}-consent`}
            message={errors.consentimiento?.message}
          />
        </div>
      </fieldset>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      {isSubmitSuccessful && submitted && (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          Hemos recibido tus datos correctamente. Nos pondremos en contacto pronto.
        </div>
      )}

      <Button type="submit" className="w-full" disabled={disabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creando cuenta...
          </>
        ) : submitted ? (
          'Cuenta creada'
        ) : (
          'Crear cuenta'
        )}
      </Button>
    </form>
  )
}