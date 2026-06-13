import { PrivatePageContainer } from '@/components/private-page-container'
import { TutorProfileForm } from '@/components/tutor-profile-form'
import { requireUser } from '@/lib/auth'
import { getPrivateTutorProfile, getPrivateUserStatus, getPrivateViewer } from '@/lib/private-app'

export default async function PerfilPage() {
  const user = await requireUser()
  const [viewer, status] = await Promise.all([
    getPrivateViewer(user.id),
    getPrivateUserStatus(user.id),
  ])

  if (!status.hasGuardian) {
    return (
      <PrivatePageContainer
        title="Perfil"
        description="Gestiona los datos de tu cuenta y tu membresía."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[32px] border border-border bg-card/80 p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Socio
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-foreground">
                  {viewer.fullName}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Bienvenido al club. Aquí puedes ver tus datos de contacto y el estado de tu cuota.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                Membresía activa
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Nombre completo
                </p>
                <p className="mt-2 text-base font-medium text-foreground">{viewer.fullName}</p>
              </div>
              <div className="rounded-3xl border border-border bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Correo electrónico
                </p>
                <p className="mt-2 text-base font-medium text-foreground">{viewer.email}</p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-border bg-background/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Estado de cuota
              </p>
              <p className="mt-2 text-base font-medium text-foreground">
                Cuota de socio marcada manualmente como pagada.
              </p>
            </div>
          </section>

          <aside className="rounded-[32px] border border-border bg-primary/10 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Información del club
            </p>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                Gracias por ser parte de <span className="font-semibold text-foreground">CD Santiponce</span>.
              </p>
              <p>
                Tu cuenta de socio ya está configurada y el acceso a las secciones del club está habilitado.
              </p>
              <p>
                Si necesitas actualizar tu correo o tus datos personales, contacta con el equipo administrativo.
              </p>
            </div>
          </aside>
        </div>
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
