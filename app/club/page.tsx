import { BrandedPageHero } from '@/components/branded-page-hero'
import { PublicShell } from '@/components/public-shell'

export default function ClubPage() {
  return (
    <PublicShell>
      <section className="bg-[#f4f6f8]">
        <BrandedPageHero
          eyebrow="Identidad del club"
          title="Club"
        />
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <div className="rounded-lg border border-border bg-white p-8 text-center shadow-sm">
            <p className="text-base font-medium text-foreground">
              Estamos preparando la información del club.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              En esta sección se podrá consultar la historia, identidad y datos del CD Santiponce.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
