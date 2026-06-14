import Image from 'next/image'
import Link from 'next/link'
import { PrivateNav } from '@/components/private-nav'
import { SignOutButton } from '@/components/sign-out-button'
import { CLUB } from '@/lib/club'
import { type PrivateViewer } from '@/lib/private-app-shared'
import type { PrivateNavItem } from '@/lib/club'

type PrivateHeaderProps = {
  viewer: PrivateViewer
  navItems: PrivateNavItem[]
  isSocio?: boolean
  isPaidSocio?: boolean
}

export function PrivateHeader({ viewer, navItems, isSocio, isPaidSocio }: PrivateHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg">
      <div className="mx-auto flex min-h-28 w-full max-w-7xl items-center justify-between gap-5 px-4 py-5 md:px-8">
        <Link
          href="/app"
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

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden flex-col text-right leading-tight sm:flex">
            <span className="text-base font-bold text-white">
              {viewer.fullName}
            </span>
            <span className="text-sm text-white/70">
              {viewer.email}
            </span>
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

      <div className="border-t border-white/20">
        <div className="mx-auto w-full max-w-7xl px-2 py-2 md:px-8">
          <PrivateNav
            items={navItems}
            isSocio={isSocio}
            isPaidSocio={isPaidSocio}
            variant="top"
            showSignOut={false}
          />
        </div>
      </div>
    </header>
  )
}
