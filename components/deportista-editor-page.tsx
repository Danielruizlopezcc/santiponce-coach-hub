'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { saveAthleteAction } from '@/app/(privado)/app/actions'
import { Button } from '@/components/ui/button'
import { DeportistaForm } from '@/components/deportista-form'
import {
  toAthleteFormValues,
  type PrivateAthleteDetail,
} from '@/lib/private-app-shared'

type DeportistaEditorPageProps = {
  title: string
  description: string
  submitLabel: string
  deportista?: PrivateAthleteDetail | null
}

export function DeportistaEditorPage({
  title,
  description,
  submitLabel,
  deportista,
}: DeportistaEditorPageProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  return (
    <div className="grid gap-5">
      <Button
        nativeButton={false}
        variant="ghost"
        className="w-fit"
        render={<Link href="/app/deportistas" />}
      >
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
              Cambios guardados correctamente.
            </span>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <DeportistaForm
          defaultValues={toAthleteFormValues(deportista)}
          readOnlyTeam={deportista?.equipoAsignado ?? null}
          submitLabel={submitLabel}
          onSubmit={async (values) => {
            setSaved(false)
            setServerError(null)
            const result = await saveAthleteAction(values, deportista?.id)
            if (!result.success) {
              setServerError(result.message ?? 'No se ha podido guardar el deportista.')
              return
            }
            setSaved(true)
            router.refresh()
          }}
        />
      </section>
    </div>
  )
}
