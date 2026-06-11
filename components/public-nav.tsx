'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { ClubLogo } from '@/components/club-logo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PUBLIC_NAV } from '@/lib/club'
import { cn } from '@/lib/utils'

function NavLinks({
  pathname,
  onNavigate,
  orientation = 'horizontal',
}: {
  pathname: string
  onNavigate?: () => void
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <ul
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
      )}
    >
      {PUBLIC_NAV.map((item) => {
        const active = pathname === item.href
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <ClubLogo />

        {/* Desktop navigation */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-2 md:flex"
        >
          <NavLinks pathname={pathname} />
          <div className="ml-3 flex items-center gap-2">
            <Button
              render={<Link href="/iniciar-sesion" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              Iniciar sesión
            </Button>
            <Button
              render={<Link href="/registro" />}
              nativeButton={false}
              size="sm"
            >
              Registrarse
            </Button>
          </div>
        </nav>

        {/* Mobile drawer */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Abrir menú">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <ClubLogo href="" />
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Navegación principal"
                className="mt-6 flex flex-col gap-4 px-4"
              >
                <NavLinks
                  pathname={pathname}
                  orientation="vertical"
                  onNavigate={() => setOpen(false)}
                />
                <div className="mt-2 flex flex-col gap-2">
                  <SheetClose
                    render={
                      <Button
                        render={<Link href="/iniciar-sesion" />}
                        nativeButton={false}
                        variant="outline"
                      >
                        Iniciar sesión
                      </Button>
                    }
                  />
                  <SheetClose
                    render={
                      <Button
                        render={<Link href="/registro" />}
                        nativeButton={false}
                      >
                        Registrarse
                      </Button>
                    }
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
