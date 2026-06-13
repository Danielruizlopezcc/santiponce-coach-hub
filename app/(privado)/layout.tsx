import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClubLogo } from '@/components/club-logo'
import { PrivateSidebar } from '@/components/sidebar'
import { PrivateHeader } from '@/components/private-header'
import { requireUser } from '@/lib/auth'
import { getPrivateUserStatus, getPrivateViewer } from '@/lib/private-app'
import { getPrivateNavItems } from '@/lib/club'

export const dynamic = 'force-dynamic'

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const pathname = (await headers()).get('x-pathname') ?? ''
  const viewer = await getPrivateViewer(user.id)
  const status = await getPrivateUserStatus(user.id)
  const isPaymentSetupRoute = pathname.startsWith('/app/configurar-pago')

  if (status.hasGuardian && !status.hasSavedPaymentMethod && !isPaymentSetupRoute) {
    redirect('/app/configurar-pago')
  }

  if (status.hasGuardian && !status.hasSavedPaymentMethod && isPaymentSetupRoute) {
    return (
      <div className="min-h-svh bg-muted/30">
        <header className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <ClubLogo size={40} href="/app/configurar-pago" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-foreground">Último paso del registro</p>
              <p className="text-xs text-muted-foreground">Configura tu tarjeta para acceder al panel</p>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    )
  }

  const navItems = getPrivateNavItems({
    hasGuardian: status.isSocio === false,
    isPaidSocio: status.isPaidSocio,
  })

  return (
    <div className="flex min-h-svh bg-muted/30">
      <PrivateSidebar
        items={navItems}
        isSocio={status.isSocio}
        isPaidSocio={status.isPaidSocio}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <PrivateHeader
          viewer={viewer}
          navItems={navItems}
          isSocio={status.isSocio}
          isPaidSocio={status.isPaidSocio}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
