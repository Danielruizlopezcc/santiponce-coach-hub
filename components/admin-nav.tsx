'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'
import { ADMIN_NAV } from '@/lib/admin'
import { cn } from '@/lib/utils'

type AdminNavProps = {
  onNavigate?: () => void
}

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación de administración"
      className="flex min-h-0 flex-1 flex-col p-2"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-0.5">
          {ADMIN_NAV.map((item) => {
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
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
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
