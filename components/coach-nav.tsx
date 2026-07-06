'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { label: 'Calendario', href: '/entrenador/calendario', icon: CalendarDays },
  { label: 'Partidos', href: '/entrenador/partidos', icon: CalendarDays },
  { label: 'Estadísticas', href: '/entrenador/estadisticas', icon: BarChart3 },
]

export function CoachNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Navegación entrenador">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
