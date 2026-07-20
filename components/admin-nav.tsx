'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groupedNav.map((section) => [section.id, true])),
  )

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <nav
      aria-label="Navegación de administración"
      className="flex min-h-0 flex-1 flex-col p-3"
    >
      <div className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4">
          {groupedNav.map((section) => {
            const isCollapsible = section.items.length > 0
            const isOpen = !isCollapsible || openSections[section.id]

            return (
              <div key={section.id} className="grid gap-1">
                {isCollapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isOpen}
                    className="flex items-center justify-between rounded-md px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-200/45 outline-none transition-colors hover:text-blue-100 focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    {section.label}
                    <ChevronRight
                      className={cn('size-3.5 shrink-0 transition-transform', isOpen && 'rotate-90')}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <p className="px-3 text-xs font-black uppercase tracking-[0.18em] text-blue-200/45">
                    {section.label}
                  </p>
                )}
                {isOpen ? (
                  <div
                    className={cn(
                      'grid gap-0.5',
                      isCollapsible && 'rounded-lg bg-blue-800/50 p-1',
                    )}
                  >
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
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                            isActive
                              ? 'bg-white/15 text-white shadow-sm'
                              : 'text-blue-100/70 hover:bg-white/10 hover:text-white',
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
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
