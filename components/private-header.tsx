'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { CLUB } from '@/lib/club'
import { type PrivateViewer } from '@/lib/private-app-shared'
import type { PrivateNavItem } from '@/lib/club'
import type { PublicNavData } from '@/lib/public-app'
import { cn } from '@/lib/utils'

type PrivateHeaderProps = {
  viewer: PrivateViewer
  navItems: PrivateNavItem[]
  navData: PublicNavData
  isSocio?: boolean
  isPaidSocio?: boolean
}

type DropdownItem = {
  href: string
  label: string
  description: string
}

function getDropdownItems(href: string, navData: PublicNavData): DropdownItem[] {
  if (href === '/app/equipos') {
    return navData.teams.map((team) => ({
      href: `/app/equipos/${team.id}`,
      label: team.name,
      description: team.category,
    }))
  }

  if (href === '/app/noticias') {
    return [
      { href: '/app/noticias', label: 'Todas las secciones', description: 'Ver todas las noticias' },
      ...navData.newsSections.map((section) => ({
        href: `/app/noticias?section=${section.id}`,
        label: section.name,
        description: 'Sección de noticias',
      })),
    ]
  }

  return []
}

export function PrivateHeader({ viewer, navItems, navData }: PrivateHeaderProps) {
  const pathname = usePathname()
  const [activeMegaHref, setActiveMegaHref] = useState<string | null>(null)
  const megaItems = activeMegaHref ? getDropdownItems(activeMegaHref, navData) : []
  const megaTitle = activeMegaHref === '/app/equipos' ? 'Equipos' : 'Noticias'
  const megaPrimaryHref = activeMegaHref === '/app/equipos' ? '/app/equipos' : '/app/noticias'
  const megaPrimaryLabel = activeMegaHref === '/app/equipos' ? 'Ver todos los equipos' : 'Ver todas las noticias'
  const megaVisibleItems = activeMegaHref === '/app/noticias' ? megaItems.slice(1) : megaItems
  const megaGroups =
    activeMegaHref === '/app/equipos'
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
          href="/app"
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

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden flex-col text-right leading-tight sm:flex">
            <span className="text-base font-bold text-white">{viewer.fullName}</span>
            <span className="text-sm text-white/70">{viewer.email}</span>
          </div>
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-white text-base font-black text-primary"
          >
            {viewer.initials}
          </span>
          <SignOutButton
            variant="ghost"
            label="Salir"
            className="h-10 gap-2 rounded-lg px-3 text-sm font-bold text-white hover:bg-white/12 hover:text-white"
          />
        </div>
      </div>

      <div className="relative border-t border-white/16 bg-[#0b3b7e]/38 backdrop-blur">
        <div className="w-full px-2 py-1.5 md:px-8 lg:px-10">
          <nav aria-label="Navegación principal">
            <ul className="flex flex-row items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const dropdownItems = getDropdownItems(item.href, navData)
                const active =
                  item.href === '/app'
                    ? pathname === '/app'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setActiveMegaHref(dropdownItems.length > 0 ? item.href : null)}
                      onFocus={() => setActiveMegaHref(dropdownItems.length > 0 ? item.href : null)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase transition-colors outline-none',
                        'focus-visible:ring-2 focus-visible:ring-white/80',
                        active
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-white/82 hover:bg-white/12 hover:text-white',
                      )}
                    >
                      {item.label}
                      {dropdownItems.length > 0 ? <ChevronDown className="size-4" aria-hidden="true" /> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
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
                            {activeMegaHref === '/app/noticias' ? (
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
