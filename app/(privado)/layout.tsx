import type { ReactNode } from 'react'
import { PrivateSidebar } from '@/components/sidebar'
import { PrivateHeader } from '@/components/private-header'
import { requireUser } from '@/lib/auth'
import { getPrivateUserStatus, getPrivateViewer } from '@/lib/private-app'
import { getPrivateNavItems } from '@/lib/club'

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const viewer = await getPrivateViewer(user.id)
  const status = await getPrivateUserStatus(user.id)
  const navItems = getPrivateNavItems({
    hasGuardian: status.isSocio === false,
    isPaidSocio: status.isPaidSocio,
  })

  return (
    <div className="flex min-h-svh bg-muted/30">
      <PrivateSidebar
        items={navItems}
        isSocio={status.isSocio}
        isPaidSocio={status.isPaidSocio}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <PrivateHeader
          viewer={viewer}
          navItems={navItems}
          isSocio={status.isSocio}
          isPaidSocio={status.isPaidSocio}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
