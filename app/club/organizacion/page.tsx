import Link from 'next/link'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { PublicShell } from '@/components/public-shell'

export default function OrganizationPage() {
  return (
    <PublicShell>
      <section className="bg-[#f4f6f8]">
        <BrandedPageHero eyebrow="Club" title="Organización" />
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <Link
            href="/"
            className="text-sm font-black uppercase tracking-[0.12em] text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Volver al inicio
          </Link>
          <div className="mt-8 bg-white p-8 shadow-sm ring-1 ring-border md:p-10">
            <p className="text-base font-semibold text-muted-foreground">
              Estamos preparando la información de organización del CD Santiponce.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
