'use client'

import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTutorProfileAction } from '@/app/(privado)/app/actions'
import { type PrivateTutorProfile } from '@/lib/private-app-shared'
import {
  tutorProfileSchema,
  type TutorProfileFormValues,
} from '@/lib/registro-schema'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

type TutorProfileFormProps = {
  profile: PrivateTutorProfile
}

export function TutorProfileForm({ profile }: TutorProfileFormProps) {
  const errId = useId()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TutorProfileFormValues>({
    resolver: zodResolver(tutorProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: profile.nombre,
      apellidos: profile.apellidos,
      email: profile.email,
      telefono: profile.telefono,
      documento: profile.documento,
      direccion: profile.direccion,
      codigoPostal: profile.codigoPostal,
      provincia: profile.provincia,
      ciudad: profile.ciudad,
      pais: profile.pais,
      preferenciaPago: profile.preferenciaPago,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false)
    setServerError(null)
    const result = await updateTutorProfileAction(values)

    if (!result.success) {
      setServerError(result.message ?? 'No se han podido guardar los cambios.')
      return
    }

    setSaved(true)
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Datos del tutor</h2>
          <p className="text-sm text-muted-foreground">
            Revisa y actualiza la información de tu cuenta.
          </p>
        </div>

        <form noValidate onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-nombre`}>Nombre</Label>
              <Input id={`${errId}-nombre`} {...register('nombre')} />
              <FieldError id={`${errId}-nombre-error`} message={errors.nombre?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-apellidos`}>Apellidos</Label>
              <Input id={`${errId}-apellidos`} {...register('apellidos')} />
              <FieldError
                id={`${errId}-apellidos-error`}
                message={errors.apellidos?.message}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-email`}>Correo electrónico</Label>
              <Input id={`${errId}-email`} type="email" {...register('email')} />
              <FieldError id={`${errId}-email-error`} message={errors.email?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-telefono`}>Teléfono</Label>
              <Input id={`${errId}-telefono`} {...register('telefono')} />
              <FieldError
                id={`${errId}-telefono-error`}
                message={errors.telefono?.message}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${errId}-documento`}>DNI/NIE</Label>
            <Input id={`${errId}-documento`} {...register('documento')} />
            <FieldError id={`${errId}-documento-error`} message={errors.documento?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${errId}-direccion`}>Dirección</Label>
            <Input id={`${errId}-direccion`} {...register('direccion')} />
            <FieldError id={`${errId}-direccion-error`} message={errors.direccion?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-codigo-postal`}>Código postal</Label>
              <Input id={`${errId}-codigo-postal`} {...register('codigoPostal')} />
              <FieldError
                id={`${errId}-codigo-postal-error`}
                message={errors.codigoPostal?.message}
              />
            </div>
            <div className="grid gap-2 lg:col-span-1">
              <Label htmlFor={`${errId}-provincia`}>Provincia</Label>
              <Input id={`${errId}-provincia`} {...register('provincia')} />
              <FieldError
                id={`${errId}-provincia-error`}
                message={errors.provincia?.message}
              />
            </div>
            <div className="grid gap-2 lg:col-span-1">
              <Label htmlFor={`${errId}-ciudad`}>Ciudad</Label>
              <Input id={`${errId}-ciudad`} {...register('ciudad')} />
              <FieldError id={`${errId}-ciudad-error`} message={errors.ciudad?.message} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${errId}-pais`}>País</Label>
              <Input id={`${errId}-pais`} {...register('pais')} />
              <FieldError id={`${errId}-pais-error`} message={errors.pais?.message} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${errId}-preferencia-pago`}>Preferencia de pago</Label>
            <select
              id={`${errId}-preferencia-pago`}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register('preferenciaPago')}
            >
              <option value="cuotas">Cuotas</option>
              <option value="unico">Pago único</option>
            </select>
            <FieldError
              id={`${errId}-preferencia-pago-error`}
              message={errors.preferenciaPago?.message}
            />
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {saved && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              Los cambios se han guardado correctamente.
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Guardar cambios
          </Button>
        </form>
      </section>

      <aside className="grid gap-4">
        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Método de pago guardado</h2>
              <p className="text-sm text-muted-foreground">
                Información de ejemplo para la futura integración con Stripe.
              </p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <dt className="text-muted-foreground">Estado</dt>
              <dd className="mt-1 inline-flex items-center gap-2 font-medium text-foreground">
                {profile.metodoPago.estado}
              </dd>
            </div>
          </dl>

          <Button variant="outline" className="mt-4 w-full" type="button" disabled>
            Próximamente con Stripe
          </Button>
        </section>
      </aside>
    </div>
  )
}
