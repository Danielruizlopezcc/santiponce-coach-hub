'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, ChevronDown, LogIn, Menu, UserPlus } from 'lucide-react'
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
  const megaPrimaryHref = activeMegaHref === '/equipos' ? '/equipos' : '/noticias'
  const megaPrimaryLabel = activeMegaHref === '/equipos' ? 'Ver todos los equipos' : 'Ver todas las noticias'
  const megaVisibleItems = activeMegaHref === '/noticias' ? megaItems.slice(1) : megaItems
  const megaGroups =
    activeMegaHref === '/equipos'
      ? Array.from(
          megaVisibleItems.reduce((groups, item) => {
            const group = groups.get(item.description) ?? []
            group.push(item)
            groups.set(item.description, group)
            return groups
          }, new Map<string, DropdownItem[]>()),
        ).map(([title, items]) => ({ title, items }))
      : [{ title: 'Secciones de noticias', items: megaVisibleItems }]

  return (
    <header
      className="sticky top-0 z-40 w-full overflow-visible bg-[linear-gradient(135deg,#061a3d_0%,#0b3f86_48%,#1f72c8_100%)] text-primary-foreground shadow-[0_18px_45px_rgba(4,20,46,0.28)]"
      onMouseLeave={() => setActiveMegaHref(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'linear-gradient(90deg, transparent, black 16%, black 84%, transparent)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/45" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/20" aria-hidden="true" />

      <div className="relative flex min-h-20 w-full items-center justify-between gap-5 px-4 py-3 md:px-8 lg:px-10">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={`${CLUB.shortName} — Inicio`}
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/25 md:size-20">
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={86}
              height={86}
              priority
              className="size-12 rounded-lg object-contain md:size-16"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-2xl font-black tracking-tight text-white md:text-[1.7rem]">
              {CLUB.shortName}
            </span>
            <span className="mt-1 text-sm font-bold text-white/75 md:text-base">
              Temporada {CLUB.season}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/registro"
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2.5 text-xs font-black uppercase text-white outline-none ring-1 ring-white/20 transition-colors hover:bg-white hover:text-primary focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <UserPlus className="size-3.5" aria-hidden="true" />
            Registrarse
          </Link>
          <Link
            href="/iniciar-sesion"
            className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-black uppercase text-primary shadow-sm outline-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <LogIn className="size-3.5" aria-hidden="true" />
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

      <div className="relative border-t border-white/16 bg-[#0b3b7e]/38 backdrop-blur">
        <div className="hidden w-full px-2 py-1.5 md:block md:px-8 lg:px-10">
          <nav aria-label="Navegación principal">
            <NavLinks pathname={pathname} navData={navData} onMegaOpen={setActiveMegaHref} />
          </nav>
        </div>
      </div>

      {activeMegaHref ? (
        <div
          className="absolute left-0 top-full hidden w-full border-t border-border bg-white text-foreground shadow-[0_24px_55px_rgba(3,18,43,0.18)] md:block"
          onMouseEnter={() => setActiveMegaHref(activeMegaHref)}
        >
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[240px_1fr] gap-12 px-8 py-10">
            <div>
              <p className="text-4xl font-black uppercase tracking-tight text-primary">
                {megaTitle}
              </p>
              <Link
                href={megaPrimaryHref}
                onClick={() => setActiveMegaHref(null)}
                className="mt-7 inline-flex items-center gap-2 text-sm font-black uppercase text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {megaPrimaryLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            {megaVisibleItems.length === 0 ? (
              <p className="py-5 text-sm font-bold text-muted-foreground">
                No hay elementos disponibles.
              </p>
            ) : (
              <div className="grid content-start gap-x-14 gap-y-8 lg:grid-cols-3">
                {megaGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="border-b border-border pb-3 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                      {group.title}
                    </h3>
                    <div className="mt-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveMegaHref(null)}
                          className="group flex items-center justify-between gap-5 border-b border-border/70 py-4 text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
                        >
                          <span>
                            <span className="block text-base font-black leading-tight">
                              {item.label}
                            </span>
                            {activeMegaHref === '/noticias' ? (
                              <span className="mt-1 block text-sm font-semibold text-muted-foreground">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-primary/70 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
