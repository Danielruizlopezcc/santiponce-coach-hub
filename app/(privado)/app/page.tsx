import Link from 'next/link'
import { ArrowRight, ClipboardList, UserCheck, UserPlus, Users } from 'lucide-react'
import { ClubLogo } from '@/components/club-logo'
import { PrivatePageContainer } from '@/components/private-page-container'
import { Button } from '@/components/ui/button'
import { CLUB, MEMBERSHIP_IMPORTE } from '@/lib/club'
import { requireUser } from '@/lib/auth'
import { formatEuro } from '@/lib/format'
import { getPrivateDashboardData } from '@/lib/private-app'
import { type PrivateAthleteSummary } from '@/lib/private-app-shared'
import { cn } from '@/lib/utils'

// ── Badges de estado ──────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<
  'pendiente' | 'matriculado' | 'en_revision',
  { cls: string; label: string }
> = {
  pendiente:    { cls: 'bg-amber-100 text-amber-700',   label: 'Pendiente' },
  matriculado:  { cls: 'bg-emerald-100 text-emerald-700', label: 'Matriculado' },
  en_revision:  { cls: 'bg-blue-100 text-blue-700',     label: 'En revisión' },
}

// ── Tarjeta de resumen ────────────────────────────────────────────────────────

type ResumenCardProps = {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  accent?: string
}

function ResumenCard({ label, value, icon: Icon, accent = 'bg-primary/10 text-primary' }: ResumenCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', accent)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">{value}</p>
      </div>
    </article>
  )
}

// ── Tarjeta de deportista ─────────────────────────────────────────────────────

function DeportistaCard({ deportista }: { deportista: PrivateAthleteSummary }) {
  const { cls, label } = ESTADO_BADGE[deportista.estado]
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {deportista.nombre} {deportista.apellidos}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {deportista.categoriaSolicitada}
          {' · '}
          {deportista.equipoAsignado ?? 'Sin equipo asignado'}
        </p>
      </div>
      <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>
        {label}
      </span>
    </li>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AppDashboardPage() {
  const user = await requireUser()
  const { viewer, seasonLabel, matriculaImporte, deportistas, hasGuardian, isPaidSocio } =
    await getPrivateDashboardData(user.id)
  const isSocio = !hasGuardian
  const total = deportistas.length
  const matriculados = deportistas.filter((d) => d.estado === 'matriculado').length
  const pendientes = deportistas.filter((d) => d.estado !== 'matriculado').length

  return (
    <PrivatePageContainer
      title={`Hola, ${viewer.firstName}`}
      description={`Bienvenida al panel del ${CLUB.legalName}. Temporada activa ${seasonLabel}.`}
    >

      {/* ── Identidad del club ─────────────────────────────────────────── */}
      <section
        aria-label="Club"
        className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur"
      >
        <ClubLogo size={52} href="/app" />
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Temporada activa {seasonLabel}
        </span>
      </section>

      {/* ── Tarjetas de resumen ────────────────────────────────────────── */}
      <section className={cn('grid gap-4', isSocio ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3')} aria-label="Resumen">
        {isSocio && (
          <ResumenCard
            label="Tipo de cuenta"
            value="Socio"
            icon={UserCheck}
          />
        )}
        <ResumenCard
          label={isSocio ? (isPaidSocio ? 'Membresía activa' : 'Membresía pendiente') : 'Pendientes de matrícula'}
          value={isSocio ? (isPaidSocio ? 'Pagada' : `${MEMBERSHIP_IMPORTE}€`) : String(pendientes)}
          icon={isSocio ? ClipboardList : UserPlus}
          accent={isSocio ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}
        />
        {!isSocio && (
          <ResumenCard
            label="Deportistas"
            value={String(total)}
            icon={Users}
            accent="bg-primary/10 text-primary"
          />
        )}
        <ResumenCard
          label={isSocio ? 'Temporada' : 'Precio de matrícula'}
          value={isSocio ? seasonLabel : formatEuro(matriculaImporte)}
          icon={ClipboardList}
          accent="bg-violet-100 text-violet-600"
        />
      </section>

      {isSocio ? (
        <section
          aria-label="Pago de membresía"
          className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-6 shadow-sm backdrop-blur sm:p-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Zona de socios
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                {isPaidSocio ? 'Tu membresía está activa' : 'Completa tu membresía'}
              </h2>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">
                {isPaidSocio
                  ? 'Ya tienes acceso como socio. Navega a la sección de patrocinadores para ver las novedades del club.'
                  : `Tu cuenta está activa como socio, pero debes realizar el pago de ${MEMBERSHIP_IMPORTE}€ para completar la membresía.`}
              </p>
            </div>
            {!isPaidSocio && (
              <Button
                nativeButton={false}
                render={<Link href="/app/pago-socio" />}
                size="lg"
              >
                Pagar {MEMBERSHIP_IMPORTE}€
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* ── Acceso a matriculación ─────────────────────────────────────── */}
          <section
            aria-label="Matriculación"
            className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-6 shadow-sm backdrop-blur sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Acceso destacado
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                  Matriculación temporada {seasonLabel}
                </h2>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  {pendientes > 0
                    ? `Tienes ${pendientes} ${pendientes === 1 ? 'deportista pendiente' : 'deportistas pendientes'} de matricular. Importe por deportista: ${formatEuro(matriculaImporte)}.`
                    : `Todos tus deportistas están matriculados. Importe por deportista: ${formatEuro(matriculaImporte)}.`}
                </p>
              </div>
              <Button
                nativeButton={false}
                render={<Link href="/app/matriculacion" />}
                size="lg"
              >
                Ir a matriculación
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </section>

          <section
            aria-label="Hazte socio"
            className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-6 shadow-sm backdrop-blur sm:p-7"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Conviértete en socio
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                  {isPaidSocio ? 'Tu cuota de socio está al día' : 'Hazte socio del club'}
                </h2>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  {isPaidSocio
                    ? 'Ya puedes acceder a las novedades y beneficios de socio desde tu zona privada.'
                    : `Abona la cuota de ${MEMBERSHIP_IMPORTE}€ y obtén acceso a las novedades y beneficios de socio.`}
                </p>
              </div>
              {!isPaidSocio && (
                <Button
                  nativeButton={false}
                  render={<Link href="/app/pago-socio" />}
                  size="lg"
                >
                  Pagar {MEMBERSHIP_IMPORTE}€
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </section>

          {/* ── Listado de deportistas ─────────────────────────────────────── */}
          <section aria-label="Tus deportistas" className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Tus deportistas</h2>
                <p className="text-sm text-muted-foreground">
                  Resumen de los deportistas vinculados a tu cuenta.
                </p>
              </div>
              <Link
                href="/app/deportistas"
                className="text-sm font-medium text-primary outline-none hover:underline focus-visible:underline"
              >
                Ver todos
              </Link>
            </div>

            {total === 0 ? (
              // Estado vacío
              <div className="rounded-xl border border-dashed border-border bg-card/70 p-8 text-center backdrop-blur">
                <p className="text-base font-medium text-foreground">
                  Aún no tienes deportistas registrados.
                </p>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  Cuando añadas deportistas a tu cuenta, aparecerán aquí.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2" role="list">
                {deportistas.slice(0, 4).map((d) => (
                  <DeportistaCard key={d.id} deportista={d} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

    </PrivatePageContainer>
  )
}
