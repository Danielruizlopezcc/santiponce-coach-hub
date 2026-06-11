'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { PRIVATE_NAV } from '@/lib/club'
import { cn } from '@/lib/utils'

type PrivateNavProps = {
  onNavigate?: () => void
}

export function PrivateNav({ onNavigate }: PrivateNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="flex flex-1 flex-col gap-1 p-3"
    >
      {PRIVATE_NAV.map((item) => {
        const Icon = item.icon
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
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}

      <div className="mt-auto pt-3">
        <Link
          href="/iniciar-sesion"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          Cerrar sesión
        </Link>
      </div>
    </nav>
  )
}
