import { ClubLogo } from '@/components/club-logo'
import { PrivateNav } from '@/components/private-nav'
import type { PrivateNavItem } from '@/lib/club'

type PrivateSidebarProps = {
  items: PrivateNavItem[]
  isSocio?: boolean
  isPaidSocio?: boolean
}

export function PrivateSidebar({ items, isSocio, isPaidSocio }: PrivateSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <ClubLogo size={36} href="/app" />
      </div>
      <PrivateNav
        items={items}
        isSocio={isSocio}
        isPaidSocio={isPaidSocio}
      />
    </aside>
  )
}
