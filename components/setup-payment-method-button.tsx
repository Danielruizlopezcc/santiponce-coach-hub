'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { createPaymentMethodSetupAction } from '@/app/(privado)/app/payment-actions'
import { Button } from '@/components/ui/button'

type SetupPaymentMethodButtonProps = {
  className?: string
  label?: string
}

export function SetupPaymentMethodButton({
  className,
  label = 'Guardar tarjeta',
}: SetupPaymentMethodButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await createPaymentMethodSetupAction()
      if (!result.success || !result.url) {
        setError(result.message ?? 'No se ha podido abrir la configuración del pago.')
        return
      }

      window.location.assign(result.url)
    })
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleClick} disabled={isPending} className={className}>
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {label}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
