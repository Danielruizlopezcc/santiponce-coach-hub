import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
import { requireAdmin } from '@/lib/auth'
import { getAdminViewer } from '@/lib/admin-app'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin()
  const viewer = await getAdminViewer(user.id)

  return (
    <div className="flex min-h-svh bg-muted/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader viewer={viewer} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
