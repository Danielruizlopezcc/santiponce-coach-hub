import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminHeader } from '@/components/admin-header'
import { canAccessAdminPath, getDefaultAdminPath } from '@/lib/admin-permissions'
import { requireAdmin } from '@/lib/auth'
import { getAdminViewer } from '@/lib/admin-app'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role } = await requireAdmin()
  const pathname = (await headers()).get('x-pathname') ?? '/admin'

  if (!canAccessAdminPath(role, pathname)) {
    redirect(getDefaultAdminPath(role))
  }

  const viewer = await getAdminViewer(user.id, role)

  return (
    <div className="flex min-h-svh bg-muted/30">
      <AdminSidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <AdminHeader viewer={viewer} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
