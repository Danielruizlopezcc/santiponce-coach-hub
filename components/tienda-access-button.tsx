'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useShopAccessModal } from '@/components/shop-access-modal'

export function TiendaAccessButton() {
  const { openShopModal } = useShopAccessModal()

  return (
    <Button type="button" size="lg" onClick={openShopModal} className="mx-auto mt-8 gap-2">
      Acceder a la tienda oficial
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  )
}
