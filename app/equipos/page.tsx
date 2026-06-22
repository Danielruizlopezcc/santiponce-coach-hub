import { redirect } from 'next/navigation'
import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'
import { getPrivateTeams } from '@/lib/private-app'

export default async function EquiposPage() {
  const teams = await getPrivateTeams()
  const firstTeam = teams[0]

  if (firstTeam) {
    redirect(`/equipos/${firstTeam.id}`)
  }

  return (
    <PublicShell>
      <PageContainer title="Equipos" className="max-w-5xl">
        <div className="rounded-lg border border-border bg-white/88 p-8 text-center shadow-sm backdrop-blur">
          <p className="text-base font-bold text-foreground">Aún no hay equipos disponibles.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando el club configure equipos, aparecerán en el desplegable de navegación.
          </p>
        </div>
      </PageContainer>
    </PublicShell>
  )
}
