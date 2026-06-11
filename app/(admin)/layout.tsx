import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-muted/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
