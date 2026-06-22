'use client'

import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AdminFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl'
}

const MAX_WIDTH = {
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
}

export function AdminFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
}: AdminFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#06172f]/55 backdrop-blur-sm" />
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-2xl',
            MAX_WIDTH[maxWidth],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border bg-[#06172f] px-6 py-5 text-white">
            <div>
              <Dialog.Title className="text-2xl font-black tracking-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm font-medium text-white/70">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close render={<Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" />}>
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-white px-6 py-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
