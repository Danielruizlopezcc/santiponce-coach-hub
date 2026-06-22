import { PrivatePageContainer } from '@/components/private-page-container'
import { MemberProfileForm } from '@/components/member-profile-form'
import { TutorProfileForm } from '@/components/tutor-profile-form'
import { requireUser } from '@/lib/auth'
import { getPrivateMemberProfile, getPrivateTutorProfile, getPrivateUserStatus } from '@/lib/private-app'

export default async function PerfilPage() {
  const user = await requireUser()
  const status = await getPrivateUserStatus(user.id)

  if (!status.hasGuardian) {
    const profile = await getPrivateMemberProfile(user.id)

    if (!profile) {
      return (
        <PrivatePageContainer
          title="Perfil"
          description="Gestiona los datos de tu cuenta y tu membresía."
        >
          <div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
            No se ha encontrado el perfil del socio.
          </div>
        </PrivatePageContainer>
      )
    }

    return (
      <PrivatePageContainer
        title="Perfil"
        description="Gestiona los datos de tu cuenta y tu membresía."
      >
        <MemberProfileForm profile={profile} />
      </PrivatePageContainer>
    )
  }

  const profile = await getPrivateTutorProfile(user.id)

  if (!profile) {
    return (
      <PrivatePageContainer
        title="Perfil"
        description="Consulta y gestiona los datos del tutor responsable."
      >
        <div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
          No se ha encontrado el perfil del tutor.
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
