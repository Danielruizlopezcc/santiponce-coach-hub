'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ComponentType, type Dispatch, type SetStateAction } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Handshake,
  Home,
  Menu,
  Newspaper,
  ShoppingBag,
  Shield,
  User,
  UsersRound,
} from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CLUB, PUBLIC_NAV, type NavItem, type PrivateNavItem } from '@/lib/club'
import { type PrivateViewer } from '@/lib/private-app-shared'
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

type DrawerItem = NavItem & {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const PUBLIC_ICONS: Partial<Record<string, DrawerItem['icon']>> = {
  '/': Home,
  '/noticias': Newspaper,
  '/calendario': CalendarDays,
  '/equipos': UsersRound,
  '/club': Shield,
  '/patrocinadores': Handshake,
  '/cluber': User,
  '/tienda': ShoppingBag,
}

const PRIVATE_ICONS: Partial<Record<PrivateNavItem['icon'], DrawerItem['icon']>> = {
  user: User,
  users: UsersRound,
  'credit-card': CreditCard,
  'clipboard-list': ClipboardList,
}

const AUTH_HREFS = new Set(['/registro', '/iniciar-sesion'])
const NON_NAVIGABLE_HREFS = new Set(['/club', '/cluber', '/tienda'])
const PRIVATE_MENU_HREFS = new Set(['/app/perfil', '/app/portal-socio', '/app/deportistas', '/app/matriculacion'])

function getDropdownItems(href: string, navData: PublicNavData): DropdownItem[] {
  if (href === '/club') {
    return [
      { href: '/club/organizacion', label: 'Organización', description: 'Estructura del club' },
      {
        href: '/club/la-historia-continua',
        label: 'La historia continúa',
        description: 'Historia del CD Santiponce',
      },
    ]
  }

  if (href === '/equipos') {
    return navData.teams.map((team) => ({
      href: `/equipos/${team.id}`,
      label: team.name,
      description: team.category,
    }))
  }

  if (href === '/noticias') {
    return [
      { href: '/noticias', label: 'Todas las noticias', description: 'Actualidad del club' },
      ...navData.newsSections.map((section) => ({
        href: `/noticias?section=${section.id}`,
        label: section.name,
        description: 'Sección de noticias',
      })),
    ]
  }

  return []
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '/app'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function getPrimaryHref(itemHref: string, dropdownItems: DropdownItem[]) {
  return itemHref === '/equipos' && dropdownItems[0] ? dropdownItems[0].href : itemHref
}

function buildDrawerItems(privateItems: PrivateNavItem[]): DrawerItem[] {
  const publicItems = PUBLIC_NAV
    .filter((item) => !AUTH_HREFS.has(item.href))
    .map((item) => ({
      ...item,
      icon: PUBLIC_ICONS[item.href] ?? Shield,
    }))

  const userItems = privateItems
    .filter((item) => PRIVATE_MENU_HREFS.has(item.href))
    .map((item) => ({
      label: item.label,
      href: item.href,
      icon: PRIVATE_ICONS[item.icon] ?? User,
    }))

  return [...publicItems, ...userItems]
}

function NavLinks({
  pathname,
  navData,
  onMegaOpen,
  onNavigate,
  orientation = 'horizontal',
  items,
  openVerticalHref,
  setOpenVerticalHref,
}: {
  pathname: string
  navData: PublicNavData
  onMegaOpen?: (href: string | null) => void
  onNavigate?: () => void
  orientation?: 'horizontal' | 'vertical'
  items: DrawerItem[]
  openVerticalHref?: string | null
  setOpenVerticalHref?: Dispatch<SetStateAction<string | null>>
}) {
  return (
    <ul className={cn('flex gap-1', orientation === 'vertical' ? 'flex-col' : 'flex-row items-center')}>
      {items.map((item) => {
        const dropdownItems = getDropdownItems(item.href, navData)
        const href = getPrimaryHref(item.href, dropdownItems)
        const active = isActivePath(pathname, item.href)
        const expanded = openVerticalHref === item.href
        const Icon = item.icon
        const isNonNavigable = NON_NAVIGABLE_HREFS.has(item.href)
        const itemContent = (
          <span className="flex min-w-0 items-center gap-3">
            {orientation === 'vertical' ? <Icon className="size-4 shrink-0" aria-hidden={true} /> : null}
            <span className="truncate">{item.label}</span>
          </span>
        )
        const itemClassName = cn(
          'flex min-h-9 items-center gap-2 rounded-md px-3 py-1.5 text-[0.84rem] font-semibold uppercase tracking-[0.14em] outline-none transition-all duration-150',
          'focus-visible:ring-2 focus-visible:ring-white/80',
          orientation === 'horizontal' &&
            (active
              ? 'text-white drop-shadow-[0_1px_6px_rgba(255,255,255,0.34)]'
              : 'text-white/88 drop-shadow-[0_1px_2px_rgba(0,0,0,0.24)] hover:bg-white/8 hover:text-white hover:drop-shadow-[0_1px_5px_rgba(255,255,255,0.2)]'),
          orientation === 'vertical' &&
            'flex-1 px-0 py-4 text-foreground hover:text-primary focus-visible:ring-ring',
          orientation === 'vertical' && active && 'text-primary',
          isNonNavigable && dropdownItems.length === 0 && 'cursor-default hover:bg-transparent',
        )

        return (
          <li key={item.href}>
            <div className={cn('flex items-center', orientation === 'vertical' && 'border-b border-border')}>
              {isNonNavigable ? (
                dropdownItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (orientation === 'vertical') {
                        setOpenVerticalHref?.((current) => (current === item.href ? null : item.href))
                        return
                      }
                      onMegaOpen?.(item.href)
                    }}
                    onMouseEnter={() => {
                      if (orientation !== 'horizontal') return
                      onMegaOpen?.(item.href)
                    }}
                    onFocus={() => {
                      if (orientation !== 'horizontal') return
                      onMegaOpen?.(item.href)
                    }}
                    aria-current={active ? 'page' : undefined}
                    aria-expanded={dropdownItems.length > 0 ? expanded : undefined}
                    className={cn(itemClassName, orientation === 'vertical' && 'text-left')}
                  >
                    {itemContent}
                  </button>
                ) : (
                  <span
                    aria-current={active ? 'page' : undefined}
                    className={cn(itemClassName, 'select-none')}
                  >
                    {itemContent}
                  </span>
                )
              ) : (
                <Link
                  href={href}
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
                  className={itemClassName}
                >
                  {itemContent}
                </Link>
              )}
              {dropdownItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOpenVerticalHref?.((current) => (current === item.href ? null : item.href))}
                  aria-label={`${expanded ? 'Cerrar' : 'Abrir'} secciones de ${item.label}`}
                  aria-expanded={expanded}
                  className={cn(
                    'grid size-11 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring',
                    orientation === 'horizontal' && 'hidden',
                  )}
                >
                  <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
                </button>
              ) : null}
              {orientation === 'horizontal' && dropdownItems.length > 0 ? (
                <ChevronDown className="mr-2 size-4 shrink-0 text-white/88" aria-hidden="true" />
              ) : null}
            </div>
            {orientation === 'vertical' && dropdownItems.length > 0 && expanded ? (
              <div className="grid gap-1 border-b border-border pb-3 pl-7">
                {dropdownItems.map((dropdownItem) => (
                  <Link
                    key={dropdownItem.href}
                    href={dropdownItem.href}
                    onClick={onNavigate}
                    className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground outline-none hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
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

function MenuDrawer({
  open,
  setOpen,
  pathname,
  navData,
  items,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  pathname: string
  navData: PublicNavData
  items: DrawerItem[]
}) {
  const [openVerticalHref, setOpenVerticalHref] = useState<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            aria-label="Abrir menú"
            className="grid size-12 place-items-center rounded-none bg-transparent p-0 text-white hover:bg-white/10 hover:text-white"
          >
            <Menu className="size-6" aria-hidden="true" />
          </Button>
        }
      />
      <SheetContent
        side="left"
        className="w-[86vw] max-w-[420px] gap-0 p-0 [&_[data-slot=sheet-close]]:text-white [&_[data-slot=sheet-close]]:hover:bg-white/10 [&_[data-slot=sheet-close]]:hover:text-white"
      >
        <SheetHeader className="border-b border-white/15 bg-[#0f3f86] p-5 text-white">
          <SheetTitle className="text-left text-white">
            <span className="flex items-center gap-3">
              <Image
                src={CLUB.crest}
                alt={`Escudo del ${CLUB.legalName}`}
                width={50}
                height={50}
                className="size-12 rounded-md bg-white/10 object-contain ring-1 ring-white/20"
              />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-base font-black">{CLUB.shortName}</span>
                <span className="text-xs font-bold text-white/72">Temporada {CLUB.season}</span>
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-5 py-4">
          <NavLinks
            pathname={pathname}
            navData={navData}
            orientation="vertical"
            items={items}
            onNavigate={() => setOpen(false)}
            openVerticalHref={openVerticalHref}
            setOpenVerticalHref={setOpenVerticalHref}
          />
        </nav>
        <div className="grid gap-2 border-t border-border p-5">
          <SignOutButton
            label="Cerrar sesión"
            variant="outline"
            className="h-11 justify-center gap-2 rounded-md border-border bg-background px-4 text-sm font-black uppercase text-primary hover:bg-muted"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function PrivateHeader({ navItems, navData }: PrivateHeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [activeMegaHref, setActiveMegaHref] = useState<string | null>(null)
  const primaryNav = PUBLIC_NAV.filter((item) => !AUTH_HREFS.has(item.href)).map((item) => ({
    ...item,
    icon: PUBLIC_ICONS[item.href] ?? Shield,
  }))
  const leftNav = primaryNav.slice(0, 4)
  const rightNav = primaryNav.slice(4)
  const drawerItems = buildDrawerItems(navItems)
  const megaItems = activeMegaHref ? getDropdownItems(activeMegaHref, navData) : []
  const megaTitle = activeMegaHref === '/equipos' ? 'Equipos' : activeMegaHref === '/club' ? 'Club' : 'Noticias'
  const megaPrimaryHref = activeMegaHref === '/equipos' ? '/equipos' : '/noticias'
  const megaPrimaryLabel = activeMegaHref === '/equipos' ? 'Ver todos los equipos' : 'Ver todas las noticias'
  const showMegaPrimary = activeMegaHref === '/noticias'
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
      : activeMegaHref === '/club'
        ? [{ title: null, items: megaVisibleItems }]
        : [{ title: 'Secciones de noticias', items: megaVisibleItems }]

  return (
    <header
      className="sticky top-0 z-40 w-full overflow-visible bg-[#071b3f] text-primary-foreground shadow-[0_14px_34px_rgba(4,20,46,0.24)]"
      onMouseLeave={() => setActiveMegaHref(null)}
    >
      <div className="border-b border-white/12 bg-[#061a3d]">
        <div className="flex h-10 w-full items-center justify-between gap-4 px-4 text-[0.86rem] font-extrabold uppercase tracking-[0.025em] text-white md:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="truncate outline-none hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/80">
              CDSANTIPONCE.COM
            </Link>
            <span className="hidden text-white/75 sm:inline">Temporada {CLUB.season}</span>
          </div>
          <SignOutButton
            variant="ghost"
            label="Salir"
            className="h-8 gap-2 rounded-md px-2 text-sm font-black uppercase tracking-[0.025em] text-white hover:bg-white/12 hover:text-white"
          />
        </div>
      </div>

      <div className="relative bg-[#0f3f86]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/14" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 hidden h-full w-30 -translate-x-1/2 bg-[#2367bd] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)] md:block" />
        <Link
          href="/"
          aria-label={`${CLUB.shortName} - Inicio`}
          className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:block"
        >
          <Image
            src={CLUB.crest}
            alt={`Escudo del ${CLUB.legalName}`}
            width={74}
            height={74}
            priority
            className="size-16 rounded-md object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)]"
          />
        </Link>

        <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 md:left-5">
          <MenuDrawer open={open} setOpen={setOpen} pathname={pathname} navData={navData} items={drawerItems} />
        </div>

        <div className="mx-auto grid min-h-16 max-w-[1500px] grid-cols-1 items-center gap-4 px-4 py-1.5 lg:grid-cols-[1fr_148px_1fr] lg:px-8 xl:px-10">
          <nav aria-label="Navegación principal izquierda" className="hidden justify-self-end lg:block">
            <NavLinks pathname={pathname} navData={navData} onMegaOpen={setActiveMegaHref} items={leftNav} />
          </nav>

          <Link
            href="/"
            aria-label={`${CLUB.shortName} - Inicio`}
            className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/80 lg:pointer-events-none lg:invisible"
          >
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={58}
              height={58}
              priority
              className="size-14 rounded-md object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate text-lg font-black text-white">{CLUB.shortName}</span>
              <span className="block text-xs font-black uppercase text-white/72">Temporada {CLUB.season}</span>
            </span>
          </Link>

          <nav aria-label="Navegación principal derecha" className="hidden justify-self-start lg:block">
            <NavLinks pathname={pathname} navData={navData} onMegaOpen={setActiveMegaHref} items={rightNav} />
          </nav>
        </div>
      </div>

      {activeMegaHref ? (
        <div
          className="absolute left-0 top-full hidden w-full border-t border-border bg-white text-foreground shadow-[0_24px_55px_rgba(3,18,43,0.18)] lg:block"
          onMouseEnter={() => setActiveMegaHref(activeMegaHref)}
        >
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[220px_1fr] gap-10 px-8 py-8">
            <div>
              <p className="text-3xl font-black uppercase text-primary">{megaTitle}</p>
              {showMegaPrimary ? (
                <Link
                  href={megaPrimaryHref}
                  onClick={() => setActiveMegaHref(null)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {megaPrimaryLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            {megaVisibleItems.length === 0 ? (
              <p className="py-5 text-sm font-bold text-muted-foreground">No hay elementos disponibles.</p>
            ) : (
              <div className="grid content-start gap-x-12 gap-y-7 lg:grid-cols-3">
                {megaGroups.map((group, groupIndex) => (
                  <section key={group.title ?? `club-${groupIndex}`}>
                    {group.title ? (
                      <h3 className="border-b border-border pb-3 text-xs font-black uppercase text-muted-foreground">{group.title}</h3>
                    ) : null}
                    <div className={cn(group.title ? 'mt-2' : 'mt-0')}>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveMegaHref(null)}
                          className="group flex items-center justify-between gap-5 border-b border-border/70 py-4 text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
                        >
                          <span className="block text-base font-black leading-tight">{item.label}</span>
                          <ArrowRight
                            className="size-4 shrink-0 text-primary/70 transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                          />
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
