import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { AnimatedBackground } from '@/components/animated-background'
import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'
import { getPublicNavData } from '@/lib/public-app'

export async function PublicShell({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '/'
  const navData = await getPublicNavData()
  const showFooterSpacer = pathname !== '/'

  return (
    <div className="flex min-h-dvh flex-col">
      <AnimatedBackground />
      <PublicNav navData={navData} />
      <main className={showFooterSpacer ? 'footer-gap flex-1' : 'flex-1'}>{children}</main>
      <SiteFooter />
    </div>
  )
}
