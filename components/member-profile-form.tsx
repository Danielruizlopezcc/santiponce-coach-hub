'use client'

import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserRound } from 'lucide-react'
import { z } from 'zod'
import { updateMemberProfileAction } from '@/app/(privado)/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PrivateMemberProfile } from '@/lib/private-app-shared'

const memberProfileSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre válido').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos').max(80),
  email: z.string().trim().email('Correo electrónico no válido').max(120),
})

type MemberProfileFormValues = z.infer<typeof memberProfileSchema>

type MemberProfileFormProps = {
  profile: PrivateMemberProfile
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

export function MemberProfileForm({ profile }: MemberProfileFormProps) {
  const errId = useId()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberProfileFormValues>({
    resolver: zodResolver(memberProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: profile.nombre,
      apellidos: profile.apellidos,
      email: profile.email,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false)
    setServerError(null)
    const result = await updateMemberProfileAction(values)

    if (!result.success) {
      setServerError(result.message ?? 'No se han podido guardar los cambios.')
      return
    }

    setSaved(true)
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Datos del socio</h2>
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
              <FieldError id={`${errId}-apellidos-error`} message={errors.apellidos?.message} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${errId}-email`}>Correo electrónico</Label>
            <Input id={`${errId}-email`} type="email" {...register('email')} />
            <FieldError id={`${errId}-email-error`} message={errors.email?.message} />
          </div>

          {serverError ? (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          {saved ? (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Los cambios se han guardado correctamente.
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Guardar cambios
          </Button>
        </form>
      </section>

      <aside className="rounded-lg border border-primary/15 bg-white p-5 shadow-sm">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">Estado de socio</h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          {profile.estadoSocio}
        </p>
      </aside>
    </div>
  )
}
