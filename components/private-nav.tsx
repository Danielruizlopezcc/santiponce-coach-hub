'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Award, ClipboardList, House, Newspaper, Shield, User, Users } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import { cn } from '@/lib/utils'
import type { PrivateNavItem } from '@/lib/club'

type PrivateNavProps = {
  items?: PrivateNavItem[]
  isSocio?: boolean
  isPaidSocio?: boolean
  onNavigate?: () => void
  variant?: 'sidebar' | 'top'
  showSignOut?: boolean
}

const ICONS: Record<PrivateNavItem['icon'], ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  house: House,
  user: User,
  users: Users,
  shield: Shield,
  award: Award,
  newspaper: Newspaper,
  'clipboard-list': ClipboardList,
}

export function PrivateNav({
  items,
  isSocio,
  isPaidSocio,
  onNavigate,
  variant = 'sidebar',
  showSignOut = true,
}: PrivateNavProps) {
  const pathname = usePathname()
  const navItems = items ?? []
  const isTop = variant === 'top'

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        isTop
          ? 'min-w-0'
          : 'flex min-h-0 flex-1 flex-col',
      )}
    >
      <div
        className={cn(
          isTop
            ? 'overflow-x-auto'
            : 'min-h-0 flex-1 overflow-y-auto p-3',
        )}
      >
        <div
          className={cn(
            isTop
              ? 'flex min-w-max items-center gap-2'
              : 'grid gap-1',
          )}
        >
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
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isTop
                    ? cn(
                        'flex items-center gap-2 rounded-lg px-4 py-3 text-base font-bold uppercase tracking-wide transition-colors',
                        isActive
                          ? 'bg-white text-primary shadow-sm'
                          : isUnavailable
                            ? 'text-white/55 hover:bg-white/10'
                            : 'text-white hover:bg-white/12',
                      )
                    : cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : isUnavailable
                            ? 'text-muted-foreground opacity-70 hover:bg-sidebar-accent'
                            : 'text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      ),
                )}
              >
                <Icon className={cn('shrink-0', isTop ? 'size-5' : 'size-5')} aria-hidden={true} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {showSignOut && (
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
      )}
    </nav>
  )
}
