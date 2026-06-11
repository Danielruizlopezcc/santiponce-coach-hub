'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
    >
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
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-blue-100/70 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}

      <div className="mt-auto border-t border-white/10 pt-3">
        <Link
          href="/iniciar-sesion"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-blue-200/60 hover:bg-red-500/20 hover:text-red-300',
            'outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Cerrar sesión
        </Link>
      </div>
    </nav>
  )
}
