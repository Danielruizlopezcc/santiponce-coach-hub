'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react'
import { registerGuardianAccount } from '@/app/registro/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  registroSchema,
  type RegistroFormValues,
} from '@/lib/registro-schema'
import { DeportistasSection } from '@/components/deportistas-section'

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
  const router = useRouter()
  const errId = useId()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState<'datos' | 'pago'>('datos')
  const [setupIsLoading, setSetupIsLoading] = useState(false)
  const [formDataCache, setFormDataCache] = useState<RegistroFormValues | null>(null)

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors: rawErrors, isSubmitting, isSubmitSuccessful },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    mode: 'onBlur',
    defaultValues: {
      accountType: 'tutor',
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
      aceptaPrivacidad: false,
      aceptaCondiciones: false,
      consienteDatosMenor: false,
      consienteDatosSalud: false,
      autorizaImagenes: false,
      consienteMetodoPago: false,
      deportistas: [],
    },
  })

  const accountType = watch('accountType')
  const errors = rawErrors as Record<string, any>

  const {
    fields: deportistaFields,
    append: appendDeportista,
    update: updateDeportista,
    remove: removeDeportista,
  } = useFieldArray({ control, name: 'deportistas', keyName: '_rhfId' })

  const disabled = isSubmitting || submitted

  const onSubmitDatos = handleSubmit(async (values) => {
    setServerError(null)

    // Si es socio, proceder directamente al registro
    if (values.accountType === 'socio') {
      try {
        const result = await registerGuardianAccount(values)

        if (!result.success) {
          setServerError(result.message)
          return
        }

        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

        if (signInError) {
          setServerError(
            'La cuenta se ha creado, pero no se ha podido iniciar sesión automáticamente.',
          )
          return
        }

        setSubmitted(true)
        router.push('/app')
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : 'No se ha podido completar el registro real. Inténtalo de nuevo.',
        )
      }
      return
    }

    setFormDataCache(values)
    setStep('pago')
  })

  const onConfirmPayment = async () => {
    if (!formDataCache) return

    setSetupIsLoading(true)
    setServerError(null)

    try {
      // Crear la sesión de configuración de tarjeta
      const response = await fetch('/api/create-setup-session-for-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formDataCache.email,
          nombre: formDataCache.nombre,
          apellidos: formDataCache.apellidos,
          registroFormData: formDataCache,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'No se pudo crear la sesión de pago')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Error al configurar el pago')
      setSetupIsLoading(false)
    }
  }

  // ========== PASO 1: DATOS ==========
  if (step === 'datos') {
    return (
      <form
        noValidate
        onSubmit={onSubmitDatos}
        className="flex flex-col gap-5"
        aria-busy={isSubmitting || submitted || undefined}
      >
        {/* Tipo de cuenta */}
        <fieldset disabled={disabled} className="contents">
          <div className="grid gap-2">
            <legend className="text-sm font-medium">Tipo de cuenta</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card/60 p-3 text-sm transition-colors hover:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                <input
                  type="radio"
                  value="tutor"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  {...register('accountType')}
                />
                <span>
                  <span className="block font-medium text-foreground">Tutor</span>
                  <span className="block text-xs text-muted-foreground">
                    Gestiona la matriculación de tus deportistas.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card/60 p-3 text-sm transition-colors hover:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                <input
                  type="radio"
                  value="socio"
                  className="mt-0.5 size-4 accent-[var(--primary)]"
                  {...register('accountType')}
                />
                <span>
                  <span className="block font-medium text-foreground">Socio</span>
                  <span className="block text-xs text-muted-foreground">
                    Accede al panel básico y abona tu cuota de socio.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </fieldset>

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
            {accountType === 'socio' ? (
              <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Cuenta de socio</p>
                <p className="mt-2">
                  Solo necesitas nombre, correo electrónico y contraseña. Después de iniciar sesión,
                  podrás abonar la cuota de socio de 20€ para desbloquear el resto de funcionalidades.
                </p>
              </div>
            ) : (
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
            )}
          </div>

          {accountType === 'tutor' && (
            <>
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

              <DeportistasSection
                deportistas={deportistaFields}
                error={
                  typeof errors.deportistas?.message === 'string'
                    ? errors.deportistas?.message
                    : undefined
                }
                disabled={disabled}
                onAdd={(d) => appendDeportista(d)}
                onUpdate={(index, d) => updateDeportista(index, d)}
                onRemove={(index) => removeDeportista(index)}
              />
            </>
          )}
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
            {errors.confirmPassword ? (
              <FieldError
                id={`${errId}-confirm`}
                message={errors.confirmPassword?.message}
              />
            ) : (
              <p className="text-xs text-transparent" aria-hidden="true">
                Mínimo 8 caracteres con mayúscula, minúscula y número.
              </p>
            )}
          </div>
        </div>

        {/* Consentimientos */}
        <fieldset className="grid gap-3 rounded-lg border border-border bg-card/60 p-4">
          <legend className="px-1 text-sm font-medium">Consentimientos</legend>

          <ConsentItem
            id={`${errId}-c-priv`}
            required
            error={errors.aceptaPrivacidad?.message}
            register={register('aceptaPrivacidad')}
          >
            He leído y acepto la{' '}
            <Link
              href="/legal/privacidad"
              className="rounded text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              política de privacidad
            </Link>
            .
          </ConsentItem>

          {accountType === 'tutor' && (
            <>
              <ConsentItem
                id={`${errId}-c-cond`}
                required
                error={errors.aceptaCondiciones?.message}
                register={register('aceptaCondiciones')}
              >
                He leído y acepto las{' '}
                <Link
                  href="/legal/condiciones-matricula"
                  className="rounded text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  condiciones de matrícula
                </Link>
                .
              </ConsentItem>

              <ConsentItem
                id={`${errId}-c-menor`}
                required={deportistaFields.length > 0}
                error={errors.consienteDatosMenor?.message}
                register={register('consienteDatosMenor')}
              >
                Como tutor legal, autorizo el tratamiento de los datos personales del
                menor para la gestión deportiva y administrativa del club.
              </ConsentItem>

              <ConsentItem
                id={`${errId}-c-salud`}
                required={deportistaFields.length > 0}
                error={errors.consienteDatosSalud?.message}
                register={register('consienteDatosSalud')}
              >
                Autorizo de forma expresa el tratamiento de los datos de salud y
                alergias del menor con el único fin de garantizar su seguridad
                durante la actividad deportiva.
              </ConsentItem>

              <ConsentItem
                id={`${errId}-c-img`}
                error={errors.autorizaImagenes?.message}
                register={register('autorizaImagenes')}
              >
                <span className="font-medium text-foreground">Opcional.</span>{' '}
                Autorizo el uso de fotografías y vídeos del menor en los canales
                oficiales del club con fines informativos y promocionales.
              </ConsentItem>

              <ConsentItem
                id={`${errId}-c-pago`}
                required
                error={errors.consienteMetodoPago?.message}
                register={register('consienteMetodoPago')}
              >
                Autorizo guardar mi método de pago de forma segura para
                usarlo en futuras cuotas autorizadas por el club.
              </ConsentItem>
            </>
          )}
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
            {accountType === 'tutor'
              ? 'Tu cuenta se ha creado correctamente. Preparando el siguiente paso...'
              : 'Tu cuenta se ha creado correctamente. Entrando en tu zona privada...'}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={disabled}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {accountType === 'tutor' ? 'Continuando...' : 'Creando cuenta...'}
            </>
          ) : submitted ? (
            accountType === 'tutor' ? 'Continuando' : 'Cuenta creada'
          ) : (
            accountType === 'tutor' ? 'Continuar' : 'Crear cuenta'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/iniciar-sesion"
            className="rounded font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    )
  }

  // ========== PASO 2: MÉTODO DE PAGO ==========
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Paso 2 de 2
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              Último paso: Configura tu método de pago
            </h2>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="size-6 text-primary" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Tu método de pago se guardará de forma segura para que el club pueda utilizarlo
          en futuros cargos autorizados, como cuotas o renovaciones. Los datos sensibles
          no se almacenan en la plataforma.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/10 p-5">
          <p className="text-sm font-semibold text-foreground">¿Qué ocurrirá al continuar?</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-primary">1.</span>
              <span>Se abrirá una pasarela de pago segura.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-primary">2.</span>
              <span>Tu tarjeta quedará guardada para futuros cargos.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-primary">3.</span>
              <span>Se creará tu cuenta y entrarás al panel privado.</span>
            </li>
          </ul>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep('datos')
              setServerError(null)
            }}
            disabled={setupIsLoading}
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button
            onClick={onConfirmPayment}
            disabled={setupIsLoading}
            className="flex-1"
          >
            {setupIsLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Abriendo pago...
              </>
            ) : (
              <>
                Continuar y guardar tarjeta
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p>
          💳 El pago es seguro y está procesado por <strong>Stripe</strong>. Tus datos de tarjeta
          nunca se almacenan en nuestra plataforma.
        </p>
      </div>
    </div>
  )
}

type ConsentItemProps = {
  id: string
  required?: boolean
  error?: string
  register: UseFormRegisterReturn
  children: React.ReactNode
}

function ConsentItem({ id, required, error, register, children }: ConsentItemProps) {
  return (
    <div className="grid gap-1">
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 text-sm transition-colors hover:bg-muted/40 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/40',
          error && 'border-destructive/40 bg-destructive/5',
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          {...register}
        />
        <span className="text-pretty">
          {children}
          {required && (
            <span aria-hidden="true" className="ml-1 text-destructive">
              *
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="pl-9 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
