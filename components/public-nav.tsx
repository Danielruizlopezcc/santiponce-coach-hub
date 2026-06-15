'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, LogIn, Menu, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CLUB, PUBLIC_NAV } from '@/lib/club'
import type { PublicNavData } from '@/lib/public-app'
import { cn } from '@/lib/utils'

const ACTION_ICONS: Record<string, typeof UserPlus> = {
  '/registro': UserPlus,
  '/iniciar-sesion': LogIn,
}

const AUTH_HREFS = new Set(['/registro', '/iniciar-sesion'])

type DropdownItem = {
  href: string
  label: string
  description: string
}

function getDropdownItems(href: string, navData: PublicNavData): DropdownItem[] {
  if (href === '/equipos') {
    return navData.teams.map((team) => ({
      href: `/equipos/${team.id}`,
      label: team.name,
      description: team.category,
    }))
  }

  if (href === '/noticias') {
    return [
      { href: '/noticias', label: 'Todas las secciones', description: 'Ver todas las noticias' },
      ...navData.newsSections.map((section) => ({
        href: `/noticias?section=${section.id}`,
        label: section.name,
        description: 'Sección de noticias',
      })),
    ]
  }

  return []
}

function NavLinks({
  pathname,
  navData,
  onMegaOpen,
  onNavigate,
  orientation = 'horizontal',
}: {
  pathname: string
  navData: PublicNavData
  onMegaOpen?: (href: string | null) => void
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
        if (orientation === 'horizontal' && AUTH_HREFS.has(item.href)) return null

        const dropdownItems = getDropdownItems(item.href, navData)
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = ACTION_ICONS[item.href]
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              onMouseEnter={() => {
                if (orientation !== 'horizontal') return
                onMegaOpen?.(dropdownItems.length > 0 ? item.href : null)
              }}
              onFocus={() => {
                if (orientation !== 'horizontal') return
                onMegaOpen?.(dropdownItems.length > 0 ? item.href : null)
              }}
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
              {orientation === 'horizontal' && dropdownItems.length > 0 ? (
                <ChevronDown className="size-4" aria-hidden="true" />
              ) : null}
            </Link>
            {orientation === 'vertical' && dropdownItems.length > 0 ? (
              <div className="mt-1 grid gap-1 pl-4">
                {dropdownItems.map((dropdownItem) => (
                  <Link
                    key={dropdownItem.href}
                    href={dropdownItem.href}
                    onClick={onNavigate}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground outline-none hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {dropdownItem.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function PublicNav({ navData }: { navData: PublicNavData }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [activeMegaHref, setActiveMegaHref] = useState<string | null>(null)
  const megaItems = activeMegaHref ? getDropdownItems(activeMegaHref, navData) : []
  const megaTitle = activeMegaHref === '/equipos' ? 'Equipos' : 'Noticias'
  const megaDescription =
    activeMegaHref === '/equipos'
      ? 'Selecciona un equipo para ver su plantilla.'
      : 'Elige una sección para consultar sus noticias.'

  return (
    <header
      className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-lg"
      onMouseLeave={() => setActiveMegaHref(null)}
    >
      <div className="mx-auto flex min-h-24 max-w-7xl items-center justify-between gap-5 px-4 py-4 md:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={`${CLUB.shortName} — Inicio`}
        >
          <span className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25 md:size-[5.5rem]">
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={86}
              height={86}
              priority
              className="size-14 rounded-lg object-contain md:size-[4.5rem]"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-2xl font-black tracking-tight text-white md:text-3xl">
              {CLUB.shortName}
            </span>
            <span className="mt-1 text-base font-bold text-white/75 md:text-lg">
              Temporada {CLUB.season}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="mr-2 flex flex-col text-right leading-tight">
            <span className="text-base font-bold text-white">Plataforma oficial</span>
            <span className="text-sm text-white/70">{CLUB.legalName}</span>
          </div>
          <Link
            href="/registro"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black uppercase text-white outline-none ring-1 ring-white/20 transition-colors hover:bg-white hover:text-primary focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Registrarse
          </Link>
          <Link
            href="/iniciar-sesion"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black uppercase text-primary shadow-sm outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Iniciar sesión
          </Link>
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
                  navData={navData}
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
            <NavLinks pathname={pathname} navData={navData} onMegaOpen={setActiveMegaHref} />
          </nav>
        </div>
      </div>

      {activeMegaHref ? (
        <div
          className="absolute left-0 top-full hidden w-full border-t border-border bg-white text-foreground shadow-2xl md:block"
          onMouseEnter={() => setActiveMegaHref(activeMegaHref)}
        >
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[220px_1fr] gap-10 px-8 py-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                {megaTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {megaDescription}
              </p>
            </div>

            {megaItems.length === 0 ? (
              <p className="py-3 text-sm font-medium text-muted-foreground">
                No hay elementos disponibles.
              </p>
            ) : (
              <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {megaItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveMegaHref(null)}
                    className="group flex items-center justify-between gap-4 border-b border-border/70 px-1 py-4 outline-none transition-colors hover:text-primary focus-visible:text-primary"
                  >
                    <span>
                      <span className="block text-base font-black text-foreground group-hover:text-primary">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-sm font-medium text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="text-xl font-black text-primary opacity-60 transition-transform group-hover:translate-x-1">
                      ›
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
