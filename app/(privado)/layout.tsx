import type { ReactNode } from 'react'
import { PrivateSidebar } from '@/components/sidebar'
import { PrivateHeader } from '@/components/private-header'
import { requireUser } from '@/lib/auth'
import { getPrivateViewer } from '@/lib/private-app'

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const viewer = await getPrivateViewer(user.id)

  return (
    <div className="flex min-h-svh bg-muted/30">
      <PrivateSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PrivateHeader viewer={viewer} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
