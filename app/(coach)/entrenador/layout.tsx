import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { CoachNav } from '@/components/coach-nav'
import { SignOutButton } from '@/components/sign-out-button'
import { CLUB } from '@/lib/club'
import { requireCoach } from '@/lib/auth'
import { getPrivateViewer } from '@/lib/private-app'

export default async function CoachLayout({ children }: { children: ReactNode }) {
  const user = await requireCoach()
  const viewer = await getPrivateViewer(user.id)

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-5 md:px-8">
          <Link
            href="/entrenador/calendario"
            className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${CLUB.shortName} - Portal entrenador`}
          >
            <Image
              src={CLUB.crest}
              alt={`Escudo del ${CLUB.legalName}`}
              width={34}
              height={34}
              priority
              className="size-8 rounded-md object-contain"
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-black text-foreground">{CLUB.shortName}</span>
              <span className="flex items-center gap-1 text-[0.7rem] font-bold uppercase text-primary">
                <ShieldCheck className="size-3" aria-hidden="true" />
                Portal entrenador
              </span>
            </span>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <CoachNav />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-xs font-semibold text-foreground">{viewer.fullName}</p>
              <p className="text-[0.7rem] text-muted-foreground">Entrenador</p>
            </div>
            <SignOutButton variant="outline" label="Salir" className="h-8 text-xs" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
