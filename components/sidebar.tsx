import { ClubLogo } from '@/components/club-logo'
import { PrivateNav } from '@/components/private-nav'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <ClubLogo size={36} />
      </div>
      <PrivateNav />
    </aside>
  )
}
