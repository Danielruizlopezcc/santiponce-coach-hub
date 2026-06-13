'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Award, ClipboardList, House, User, Users } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { cn } from '@/lib/utils'
import type { PrivateNavItem } from '@/lib/club'

type PrivateNavProps = {
  items?: PrivateNavItem[]
  isSocio?: boolean
  isPaidSocio?: boolean
  onNavigate?: () => void
}

const ICONS: Record<PrivateNavItem['icon'], ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  house: House,
  user: User,
  users: Users,
  award: Award,
  'clipboard-list': ClipboardList,
}

export function PrivateNav({ items, isSocio, isPaidSocio, onNavigate }: PrivateNavProps) {
  const pathname = usePathname()
  const navItems = items ?? []

  return (
    <nav
      aria-label="Navegación principal"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid gap-1">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon] ?? House
            const isUnavailable = item.requiresPaidSocio && isSocio && !isPaidSocio
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isUnavailable && 'opacity-70',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden={true} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <SignOutButton
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />
      </div>
    </nav>
  )
}
