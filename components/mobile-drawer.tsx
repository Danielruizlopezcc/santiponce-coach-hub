'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ClubLogo } from '@/components/club-logo'
import { PrivateNav } from '@/components/private-nav'

export function PrivateMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
        aria-label="Abrir menú"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="h-16 flex-row items-center border-b border-sidebar-border px-4">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <ClubLogo size={36} href="/app" />
        </SheetHeader>
        <PrivateNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
