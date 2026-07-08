import { ShieldCheck } from 'lucide-react'
import { AdminMobileDrawer } from '@/components/admin-mobile-drawer'
import { type AdminViewer } from '@/lib/admin-app'

type AdminHeaderProps = {
  viewer: AdminViewer
}

export function AdminHeader({ viewer }: AdminHeaderProps) {
  const displayName =
    viewer.fullName.trim().toLowerCase() === 'coordinadore deportivo'
      ? 'Coordinador Deportivo'
      : viewer.fullName

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/95 px-5 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-8">
      <AdminMobileDrawer role={viewer.role} />

      <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[0.72rem] font-semibold text-blue-700 sm:flex">
        <ShieldCheck className="size-3" aria-hidden="true" />
        Panel de administración
      </span>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col text-right leading-tight sm:flex">
          <span className="text-xs font-semibold text-foreground">{displayName}</span>
          <span className="text-[0.7rem] text-muted-foreground">{viewer.roleLabel}</span>
        </div>
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white"
        >
          {viewer.initials}
        </span>
      </div>
    </header>
  )
}
