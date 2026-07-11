'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Check, Copy, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const SHOP_URL = 'https://www.futbolemotion.com/es/categoria/colectivos/equipaciones-cd-santiponce'
const SHOP_PASSWORD = 'santiponce10'

type ShopAccessModalContextValue = {
  openShopModal: () => void
}

const ShopAccessModalContext = createContext<ShopAccessModalContextValue | null>(null)

export function useShopAccessModal() {
  const context = useContext(ShopAccessModalContext)
  if (!context) {
    throw new Error('useShopAccessModal must be used within a ShopAccessModalProvider')
  }
  return context
}

export function ShopAccessModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const openShopModal = useCallback(() => {
    setCopied(false)
    setOpen(true)
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SHOP_PASSWORD)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }, [])

  const handleContinue = useCallback(() => {
    setOpen(false)
    window.location.href = SHOP_URL
  }, [])

  return (
    <ShopAccessModalContext.Provider value={{ openShopModal }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <span className="mb-1 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag className="size-5" aria-hidden="true" />
            </span>
            <DialogTitle>Acceso a la tienda oficial</DialogTitle>
            <DialogDescription>
              Necesitarás esta contraseña para entrar en la tienda. Cópiala antes de continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
            <span className="flex-1 select-none font-mono text-lg font-black tracking-[0.35em] text-foreground">
              {'•'.repeat(SHOP_PASSWORD.length)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied ? 'Copiada' : 'Copiar'}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleContinue}>
              Continuar a la tienda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShopAccessModalContext.Provider>
  )
}
