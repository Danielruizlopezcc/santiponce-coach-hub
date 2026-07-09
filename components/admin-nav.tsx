'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'
import { ADMIN_NAV_SECTIONS, getAdminNavForRole } from '@/lib/admin'
import type { AdminRole } from '@/lib/admin-permissions'
import { cn } from '@/lib/utils'

type AdminNavProps = {
  onNavigate?: () => void
  role: AdminRole
}

export function AdminNav({ onNavigate, role }: AdminNavProps) {
  const pathname = usePathname()
  const navItems = getAdminNavForRole(role)
  const groupedNav = ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: navItems.filter((item) => item.section === section.id),
  })).filter((section) => section.items.length > 0)

  return (
    <nav
      aria-label="Navegación de administración"
      className="flex min-h-0 flex-1 flex-col p-2.5"
    >
      <div className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4">
          {groupedNav.map((section) => (
            <div key={section.id} className="grid gap-1">
              <p className="px-2.5 text-[0.63rem] font-black uppercase tracking-[0.18em] text-blue-200/45">
                {section.label}
              </p>
              <div className="grid gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                        'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                        isActive
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-blue-100/70 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 pt-3">
        <SignOutButton
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-blue-200/60 hover:bg-red-500/20 hover:text-red-300',
            'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          )}
        />
      </div>
    </nav>
  )
}
