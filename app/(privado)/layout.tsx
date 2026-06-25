import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClubLogo } from '@/components/club-logo'
import { AnimatedBackground } from '@/components/animated-background'
import { PrivateHeader } from '@/components/private-header'
import { SiteFooter } from '@/components/site-footer'
import { requireUser } from '@/lib/auth'
import { getPrivateUserStatus, getPrivateViewer } from '@/lib/private-app'
import { getPrivateNavItems } from '@/lib/club'
import { getPublicNavData } from '@/lib/public-app'

export const dynamic = 'force-dynamic'

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const pathname = (await headers()).get('x-pathname') ?? ''
  const [viewer, status, navData] = await Promise.all([
    getPrivateViewer(user.id),
    getPrivateUserStatus(user.id),
    getPublicNavData(),
  ])
  const isPaymentSetupRoute = pathname.startsWith('/app/configurar-pago')
  const isProfileRoute = pathname.startsWith('/app/perfil')

  if (status.hasGuardian && !status.hasSavedPaymentMethod && !isPaymentSetupRoute && !isProfileRoute) {
    redirect('/app/configurar-pago')
  }

  if (status.hasGuardian && !status.hasSavedPaymentMethod && isPaymentSetupRoute) {
    return (
      <div className="flex min-h-svh flex-col bg-muted/30">
        <header className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <ClubLogo size={40} href="/app/configurar-pago" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-foreground">Último paso del registro</p>
              <p className="text-xs text-muted-foreground">Configura tu tarjeta para acceder al panel</p>
            </div>
          </div>
        </header>
        <main className="footer-gap flex-1">{children}</main>
        <SiteFooter />
      </div>
    )
  }

  const navItems = getPrivateNavItems({
    hasGuardian: status.hasGuardian,
    isPaidSocio: status.isPaidSocio,
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <AnimatedBackground />
      <PrivateHeader
        viewer={viewer}
        navItems={navItems}
        navData={navData}
        isSocio={status.isSocio}
        isPaidSocio={status.isPaidSocio}
      />
      <main className="footer-gap flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
