import { PrivatePageContainer } from '@/components/private-page-container'
import { TutorProfileForm } from '@/components/tutor-profile-form'
import { requireUser } from '@/lib/auth'
import { getPrivateTutorProfile } from '@/lib/private-app'

export default async function PerfilPage() {
  const user = await requireUser()
  const profile = await getPrivateTutorProfile(user.id)

  if (!profile) {
    return (
      <PrivatePageContainer
        title="Perfil"
        description="Consulta y gestiona los datos del tutor responsable."
      >
        <div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
          No se ha encontrado el perfil del tutor en Supabase.
        </div>
      </PrivatePageContainer>
    )
  }

  return (
    <PrivatePageContainer
      title="Perfil"
      description="Consulta y gestiona los datos del tutor responsable."
    >
      <TutorProfileForm profile={profile} />
    </PrivatePageContainer>
  )
}
