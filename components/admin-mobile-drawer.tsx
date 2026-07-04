'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AdminNav } from '@/components/admin-nav'
import { CLUB } from '@/lib/club'
import { getDefaultAdminPath, type AdminRole } from '@/lib/admin-permissions'

export function AdminMobileDrawer({ role }: { role: AdminRole }) {
  const [open, setOpen] = useState(false)
  const homeHref = getDefaultAdminPath(role)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
        aria-label="Abrir menú de administración"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-60 bg-blue-900 p-0">
        <SheetHeader className="flex h-12 flex-row items-center border-b border-white/10 px-4 py-0 gap-0">
          <SheetTitle className="sr-only">Menú de administración</SheetTitle>
          <Link
            href={homeHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={28}
              height={28}
              priority
              className="h-7 w-7 rounded-md object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold text-white">{CLUB.shortName}</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-blue-300" aria-hidden="true" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                  Panel Admin
                </span>
              </div>
            </div>
          </Link>
        </SheetHeader>
        <AdminNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
