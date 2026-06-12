import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateSponsors, getPrivateUserStatus } from '@/lib/private-app'

export default async function PrivatePatrocinadoresPage() {
  const user = await requireUser()
  const [status, sponsors] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateSponsors(),
  ])
  const isLocked = status.isSocio && !status.isPaidSocio

  return (
    <PrivatePageContainer
      title="Patrocinadores"
      description="Descubre las empresas y entidades que apoyan al club."
    >
      <div className="relative">
        {sponsors.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-base font-medium text-foreground">Aún no hay patrocinadores disponibles.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando el administrador añada patrocinadores, los verás aquí.</p>
          </div>
        ) : (
          <ul
            className={
              `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                isLocked ? 'pointer-events-none blur-sm grayscale' : ''
              }`
            }
          >
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

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px] bg-background/80 p-8 text-center shadow-lg">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Acceso restringido
            </span>
            <h2 className="max-w-xl text-2xl font-semibold text-foreground">
              Necesitas pagar la cuota de socio para ver a los patrocinadores.
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              La sección de patrocinadores está disponible para socios con cuota pagada. Pulsa el botón para completar tu membresía de 20€.
            </p>
            <Button nativeButton={false} render={<Link href="/app/pago-socio" />} size="lg">
              Ir a pago de socio
            </Button>
          </div>
        )}
      </div>
    </PrivatePageContainer>
  )
}
