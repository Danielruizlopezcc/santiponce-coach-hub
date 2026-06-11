import type { ReactNode } from 'react'
import { AnimatedBackground } from '@/components/animated-background'
import { PublicNav } from '@/components/public-nav'
import { SiteFooter } from '@/components/site-footer'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnimatedBackground />
      <PublicNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
