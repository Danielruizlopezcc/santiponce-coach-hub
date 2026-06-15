import type { ReactNode } from 'react'
import { AnimatedBackground } from '@/components/animated-background'
import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'
import { getPublicNavData } from '@/lib/public-app'

export async function PublicShell({ children }: { children: ReactNode }) {
  const navData = await getPublicNavData()

  return (
    <div className="flex min-h-dvh flex-col">
      <AnimatedBackground />
      <PublicNav navData={navData} />
      <main className="flex-1 pb-32 md:pb-44">{children}</main>
      <SiteFooter />
    </div>
  )
}
