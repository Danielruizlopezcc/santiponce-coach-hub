'use client'

import { Dialog } from '@base-ui/react/dialog'
import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type AdminErrorDialogProps = {
  message: string | null
  onClose: () => void
  title?: string
}

export function AdminErrorDialog({
  message,
  onClose,
  title = 'No se ha podido completar la acción',
}: AdminErrorDialogProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null)
  const messages = message?.split('\n').filter(Boolean) ?? []
  const open = Boolean(message && message !== dismissedMessage)

  useEffect(() => {
    if (!message) setDismissedMessage(null)
  }, [message])

  function handleClose() {
    if (message) setDismissedMessage(message)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) handleClose()
    }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-[#06172f]/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[70] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-red-100 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-red-100 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="text-base font-black text-red-950">{title}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm font-medium text-red-800">
                  Revisa el mensaje y vuelve a intentarlo.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-red-900 hover:bg-red-100 hover:text-red-950" />}>
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </div>
          <div className="px-5 py-4 text-sm font-medium text-foreground">
            {messages.length > 1 ? (
              <ul className="space-y-2">
                {messages.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{message}</p>
            )}
          </div>
          <div className="flex justify-end border-t border-border bg-muted/20 px-5 py-4">
            <Dialog.Close render={<Button type="button" />}>Aceptar</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
