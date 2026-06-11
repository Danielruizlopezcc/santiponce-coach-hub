'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeportistaForm } from '@/components/deportista-form'
import { type DeportistaTutor } from '@/lib/mock-deportistas'
import { type DeportistaFormValues } from '@/lib/registro-schema'

type DeportistaEditorPageProps = {
  title: string
  description: string
  submitLabel: string
  deportista?: DeportistaTutor
}

function toFormValues(deportista?: DeportistaTutor): DeportistaFormValues | undefined {
  if (!deportista) return undefined
  return {
    id: deportista.id,
    nombre: deportista.nombre,
    apellidos: deportista.apellidos,
    fechaNacimiento: deportista.fechaNacimiento,
    tipoIdentificacion: deportista.tipoIdentificacion,
    documento: deportista.documento,
    email: deportista.email,
    telefono: deportista.telefono,
    alergias: deportista.alergias,
    tieneHermanos: deportista.tieneHermanos,
    nombreHermano: deportista.nombreHermano,
    categoria: deportista.categoriaSolicitada as DeportistaFormValues['categoria'],
  }
}

export function DeportistaEditorPage({
  title,
  description,
  submitLabel,
  deportista,
}: DeportistaEditorPageProps) {
  const [saved, setSaved] = useState(false)

  return (
    <div className="grid gap-5">
      <Button variant="ghost" className="w-fit" render={<Link href="/app/deportistas" />}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a mis deportistas
      </Button>

      <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {saved && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Cambios guardados en este entorno visual. La integración real se conectará más adelante.
            </span>
          </div>
        )}

        <DeportistaForm
          defaultValues={toFormValues(deportista)}
          readOnlyTeam={deportista?.equipoAsignado ?? null}
          submitLabel={submitLabel}
          onSubmit={async (values) => {
            // TODO: Conectar este formulario con Server Actions y Supabase.
            await new Promise((resolve) => setTimeout(resolve, 700))
            console.info('[deportista] datos validados', values)
            setSaved(true)
          }}
        />
      </section>
    </div>
  )
}
