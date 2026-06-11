import type { ReactNode } from 'react'
import { PrivateSidebar } from '@/components/sidebar'
import { PrivateHeader } from '@/components/private-header'

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-muted/30">
      <PrivateSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PrivateHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
