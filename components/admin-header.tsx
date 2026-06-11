import { ShieldCheck } from 'lucide-react'
import { AdminMobileDrawer } from '@/components/admin-mobile-drawer'
import { type AdminViewer } from '@/lib/admin-app'

type AdminHeaderProps = {
  viewer: AdminViewer
}

export function AdminHeader({ viewer }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <AdminMobileDrawer />

      <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 sm:flex">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Panel de administración
      </span>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col text-right leading-tight sm:flex">
          <span className="text-sm font-semibold text-foreground">{viewer.fullName}</span>
          <span className="text-xs text-muted-foreground">{viewer.roleLabel}</span>
        </div>
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white"
        >
          {viewer.initials}
        </span>
      </div>
    </header>
  )
}
