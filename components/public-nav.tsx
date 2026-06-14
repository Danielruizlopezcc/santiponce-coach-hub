'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { LogIn, Menu, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CLUB, PUBLIC_NAV } from '@/lib/club'
import { cn } from '@/lib/utils'

const ACTION_ICONS: Record<string, typeof UserPlus> = {
  '/registro': UserPlus,
  '/iniciar-sesion': LogIn,
}

function NavLinks({
  pathname,
  onNavigate,
  orientation = 'horizontal',
}: {
  pathname: string
  onNavigate?: () => void
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <ul
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
      )}
    >
      {PUBLIC_NAV.map((item) => {
        const active = pathname === item.href
        const Icon = ACTION_ICONS[item.href]
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-white/80',
                active
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/82 hover:bg-white/12 hover:text-white',
                orientation === 'vertical' && 'text-primary hover:bg-primary/10 hover:text-primary',
                orientation === 'vertical' && active && 'bg-primary text-primary-foreground',
              )}
            >
              {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-lg">
      <div className="mx-auto flex min-h-28 max-w-7xl items-center justify-between gap-5 px-4 py-5 md:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={`${CLUB.shortName} — Inicio`}
        >
          <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25 md:size-24">
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={86}
              height={86}
              priority
              className="size-16 rounded-lg object-contain md:size-20"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-2xl font-black tracking-tight text-white md:text-4xl">
              {CLUB.shortName}
            </span>
            <span className="mt-1 text-base font-bold text-white/75 md:text-xl">
              Temporada {CLUB.season}
            </span>
          </span>
        </Link>

        <div className="hidden flex-col text-right leading-tight md:flex">
          <span className="text-base font-bold text-white">Plataforma oficial</span>
          <span className="text-sm text-white/70">Familias y deportistas</span>
        </div>

        {/* Mobile drawer */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Abrir menú"
                  className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span className="flex items-center gap-3">
                    <Image
                      src={CLUB.crest}
                      alt={`Escudo del ${CLUB.legalName}`}
                      width={44}
                      height={44}
                      className="size-11 rounded-md object-contain"
                    />
                    <span className="flex flex-col leading-tight">
                      <span className="text-base font-bold">{CLUB.shortName}</span>
                      <span className="text-xs text-muted-foreground">Temporada {CLUB.season}</span>
                    </span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Navegación principal"
                className="mt-6 flex flex-col gap-4 px-4"
              >
                <NavLinks
                  pathname={pathname}
                  orientation="vertical"
                  onNavigate={() => setOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto hidden max-w-7xl px-2 py-2 md:block md:px-8">
          <nav aria-label="Navegación principal">
            <NavLinks pathname={pathname} />
          </nav>
        </div>
      </div>
    </header>
  )
}
