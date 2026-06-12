import { PrivateMobileNav } from '@/components/mobile-drawer'
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <PrivateMobileNav
        items={navItems}
        isSocio={isSocio}
        isPaidSocio={isPaidSocio}
      />

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col text-right leading-tight sm:flex">
          <span className="text-sm font-semibold text-foreground">
            {viewer.fullName}
          </span>
          <span className="text-xs text-muted-foreground">
            {viewer.email}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {viewer.initials}
        </span>
      </div>
    </header>
  )
}
