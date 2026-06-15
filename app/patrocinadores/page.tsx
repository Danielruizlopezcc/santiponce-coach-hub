import Image from 'next/image'
import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <PublicShell>
      <PageContainer
        title="Patrocinadores"
        className="max-w-7xl"
      >
        {sponsors.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-base font-medium text-foreground">Aún no hay patrocinadores disponibles.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando el club añada patrocinadores, aparecerán aquí.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm backdrop-blur">
                <div className="relative h-48 w-full bg-muted">
                  <Image src={sponsor.imageUrl} alt={sponsor.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-base font-semibold text-foreground">{sponsor.title}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </PublicShell>
  )
}
