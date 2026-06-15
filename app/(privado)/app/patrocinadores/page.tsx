import Image from 'next/image'
import { PrivatePageContainer } from '@/components/private-page-container'
import { getPrivateSponsors } from '@/lib/private-app'

export default async function PrivatePatrocinadoresPage() {
  const sponsors = await getPrivateSponsors()

  return (
    <PrivatePageContainer
      title="Patrocinadores"
    >
      <div className="relative">
        {sponsors.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-base font-medium text-foreground">Aún no hay patrocinadores disponibles.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando el administrador añada patrocinadores, los verás aquí.</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm backdrop-blur">
                <div className="relative h-48 w-full bg-muted">
                  <Image
                    src={sponsor.imageUrl}
                    alt={sponsor.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-base font-semibold text-foreground">{sponsor.title}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

      </div>
    </PrivatePageContainer>
  )
}
