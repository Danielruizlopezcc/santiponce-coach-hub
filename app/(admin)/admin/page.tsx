import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Info,
  Newspaper,
  ShieldCheck,
  Tags,
  Trophy,
  UserCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageContainer } from '@/components/page-container'
import { getAdminDashboardData } from '@/lib/admin-app'
import { cn } from '@/lib/utils'

const alertStyles = {
  aviso: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
  },
  ok: {
    icon: BadgeCheck,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
  },
} as const

const moneyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

function getPercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{label}</p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: number | string
  detail: string
  icon: typeof Users
  tone?: 'blue' | 'green' | 'amber' | 'red'
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{detail}</p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'red' && 'bg-red-100 text-red-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function ModuleMetric({
  label,
  value,
  detail,
}: {
  label: string
  value: number | string
  detail?: string
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
      <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      {detail && <p className="mt-1 text-xs font-semibold leading-4 text-muted-foreground">{detail}</p>}
    </div>
  )
}

function ModuleCard({
  label,
  title,
  description,
  icon: Icon,
  tone = 'blue',
  actions = [],
  children,
}: {
  label: string
  title: string
  description: string
  icon: typeof Users
  tone?: 'blue' | 'green' | 'amber' | 'red'
  actions?: Array<{
    label: string
    href: string
  }>
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            tone === 'blue' && 'bg-primary/10 text-primary',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'red' && 'bg-red-100 text-red-700',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
        {children}
      </div>
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-black text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {action.label}
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function Donut({
  value,
  total,
  label,
  detail,
}: {
  value: number
  total: number
  label: string
  detail: string
}) {
  const percent = getPercent(value, total)

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-primary/15 bg-primary/5 p-5 sm:flex-row sm:items-center">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) 0 ${percent}%, rgba(2,6,23,0.08) ${percent}% 100%)`,
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-black text-foreground">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-black text-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function StatusBar({
  label,
  value,
  total,
  className,
}: {
  label: string
  value: number
  total: number
  className: string
}) {
  const percent = getPercent(value, total)

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-foreground">{label}</span>
        <span className="font-semibold text-muted-foreground">
          {value} ({percent}%)
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()
  const totalDeportistas = Math.max(1, data.summary.deportistas)
  const maxCategoria = Math.max(1, ...data.athletesByCategory.map((item) => item.total))
  const maxEquipo = Math.max(1, ...data.athletesByTeam.map((item) => item.total))
  const ingresosRecientes = data.recentPayments.reduce((total, payment) => total + payment.importe, 0)

  return (
    <PageContainer
      title="Inicio"
      description="Vista general para seguir la actividad deportiva, familiar y económica del club."
      className="max-w-7xl"
    >
      <div className="space-y-8">
        <section className="overflow-hidden rounded-lg border border-primary/20 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="bg-primary px-6 py-7 text-primary-foreground md:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                Panel de mando
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Inicio administrativo del CD Santiponce
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/80">
                Control rápido de matrículas, equipos, comunidad y actividad reciente de la
                temporada.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-3xl font-black">{data.summary.deportistas}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                    Deportistas
                  </p>
                </div>
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-3xl font-black">{data.summary.equipos}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                    Equipos activos
                  </p>
                </div>
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-3xl font-black">{data.summary.tutoresOSocios}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                    Familias y socios
                  </p>
                </div>
              </div>
            </div>
            <div className="grid content-center gap-4 p-6 md:p-8">
              <Donut
                value={data.summary.deportistasMatriculados}
                total={totalDeportistas}
                label="Matrículas cerradas"
                detail={`${data.summary.deportistasMatriculados} de ${data.summary.deportistas} deportistas aparecen como matriculados.`}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            label="Áreas de trabajo"
            title="Panel organizado por módulos"
            description="Cada bloque resume una parte del club sin mezclar lo deportivo con cuotas, comunicación o sistema."
          />
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            <ModuleCard
              label="Gestión deportiva"
              title="Cantera y equipos"
              description="Seguimiento deportivo de jugadores, plantillas y estructura de temporada."
              icon={Trophy}
              actions={[
                { label: 'Deportistas', href: '/admin/deportistas' },
                { label: 'Equipos', href: '/admin/equipos' },
                { label: 'Calendario', href: '/admin/calendario' },
              ]}
            >
              <ModuleMetric label="Deportistas" value={data.summary.deportistas} />
              <ModuleMetric label="Equipos" value={data.summary.equipos} detail="Activos" />
              <ModuleMetric
                label="Sin equipo"
                value={data.summary.deportistasSinEquipo}
                detail="Pendientes de asignación"
              />
            </ModuleCard>

            <ModuleCard
              label="Administración"
              title="Matrículas y familias"
              description="Control administrativo de tutores legales, socios, matrículas y consentimientos."
              icon={UserCheck}
              tone="amber"
              actions={[
                { label: 'Matrículas', href: '/admin/matriculas' },
                { label: 'Tutores legales / Socios', href: '/admin/tutores' },
                { label: 'Consentimientos', href: '/admin/consentimientos' },
              ]}
            >
              <ModuleMetric
                label="Matriculados"
                value={`${getPercent(data.summary.deportistasMatriculados, totalDeportistas)}%`}
                detail={`${data.summary.deportistasMatriculados} de ${data.summary.deportistas}`}
              />
              <ModuleMetric label="Tutores legales" value={data.summary.tutores} />
              <ModuleMetric
                label="Alertas"
                value={data.alerts.length}
                detail="Puntos a revisar"
              />
            </ModuleCard>

            <ModuleCard
              label="Contabilidad"
              title="Cobros y cuotas"
              description="Resumen económico ligado a cuotas, matrículas y actividad reciente de pagos."
              icon={WalletCards}
              tone="green"
              actions={[
                { label: 'Contabilidad', href: '/admin/pagos' },
                { label: 'Matrículas', href: '/admin/matriculas' },
              ]}
            >
              <ModuleMetric label="Ingresos" value={moneyFormatter.format(ingresosRecientes)} />
              <ModuleMetric label="Socios activos" value={data.summary.sociosActivos} />
              <ModuleMetric
                label="Pagos recientes"
                value={data.recentPayments.length}
                detail="Confirmados en el resumen"
              />
            </ModuleCard>

            <ModuleCard
              label="Comunicación"
              title="Noticias y patrocinio"
              description="Contenido público que mantiene viva la presencia del club."
              icon={Newspaper}
              actions={[
                { label: 'Noticias', href: '/admin/noticias' },
                { label: 'Patrocinadores', href: '/admin/patrocinadores' },
              ]}
            >
              <ModuleMetric label="Noticias" value={data.summary.noticias} />
              <ModuleMetric label="Patrocinadores" value={data.summary.patrocinadores} />
              <ModuleMetric label="Socios" value={data.summary.sociosActivos} detail="Comunidad activa" />
            </ModuleCard>

            <ModuleCard
              label="Sistema"
              title="Configuración y control"
              description="Base operativa del panel: temporadas, categorías y usuarios con acceso."
              icon={ShieldCheck}
              actions={[
                { label: 'Configuración', href: '/admin/configuracion' },
                { label: 'Administradores', href: '/admin/administradores' },
                { label: 'Auditoría', href: '/admin/auditoria' },
              ]}
            >
              <ModuleMetric label="Temporadas" value={data.summary.temporadas} />
              <ModuleMetric label="Categorías" value={data.summary.categorias} />
              <ModuleMetric label="Admins" value={data.summary.administradores} />
            </ModuleCard>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Administración"
                title="Matrículas y asignaciones"
                description="Situación actual de estados administrativos y equipos asignados."
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <StatusBar
                label="Matriculados"
                value={data.summary.deportistasMatriculados}
                total={totalDeportistas}
                className="bg-emerald-500"
              />
              <StatusBar
                label="En revisión"
                value={data.summary.deportistasEnRevision}
                total={totalDeportistas}
                className="bg-amber-500"
              />
              <StatusBar
                label="Pendientes"
                value={data.summary.deportistasPendientes}
                total={totalDeportistas}
                className="bg-red-400"
              />
              <StatusBar
                label="Sin equipo asignado"
                value={data.summary.deportistasSinEquipo}
                total={totalDeportistas}
                className="bg-blue-500"
              />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Club"
                title="Estructura activa"
                description="Recursos visibles para la temporada."
              />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="Equipos" value={data.summary.equipos} detail="Activos" icon={ShieldCheck} />
              <KpiCard label="Categorías" value={data.summary.categorias} detail="Activas" icon={Tags} />
              <KpiCard label="Temporadas" value={data.summary.temporadas} detail="Configuradas" icon={CalendarDays} />
              <KpiCard label="Noticias" value={data.summary.noticias} detail="Publicadas" icon={Newspaper} />
              <KpiCard label="Patrocinadores" value={data.summary.patrocinadores} detail="Activos" icon={Trophy} />
              <KpiCard label="Administradores" value={data.summary.administradores} detail="Con acceso" icon={ShieldCheck} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Cantera"
                title="Deportistas por categoría"
                description="Lectura rápida del peso de cada etapa."
              />
            </CardHeader>
            <CardContent className="grid gap-4">
              {data.athletesByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay deportistas disponibles.</p>
              ) : (
                data.athletesByCategory.map((item) => (
                  <div key={item.label} className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-black text-foreground">{item.label}</span>
                      <span className="font-semibold text-muted-foreground">{item.total}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.total / maxCategoria) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Plantillas"
                title="Equipos con más deportistas"
                description="Distribución de jugadores por equipo."
              />
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.athletesByTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay equipos disponibles.</p>
              ) : (
                data.athletesByTeam.slice(0, 7).map((item, index) => (
                  <div
                    key={item.equipo}
                    className="grid gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-black text-foreground">{item.equipo}</p>
                          <p className="text-muted-foreground">{item.categoria}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.total / maxEquipo) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Economía"
                title="Últimos pagos confirmados"
                description="Actividad económica pagada más reciente."
              />
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pagos recientes.</p>
              ) : (
                data.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{payment.concepto}</p>
                      <p className="truncate text-xs font-semibold text-muted-foreground">
                        {payment.familia} · {payment.deportista} · {payment.fecha}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-emerald-700">
                      {moneyFormatter.format(payment.importe)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <SectionHeading
                label="Seguimiento"
                title="Alertas administrativas"
                description="Indicadores que merecen revisión."
              />
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
              ) : (
                data.alerts.map((alerta) => {
                  const Icon = alertStyles[alerta.tipo].icon
                  return (
                    <div
                      key={alerta.id}
                      className={`rounded-lg border p-4 ${alertStyles[alerta.tipo].className}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{alerta.titulo}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${alertStyles[alerta.tipo].badge}`}
                            >
                              {alerta.tipo}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{alerta.descripcion}</p>
                          <p className="mt-2 text-xs opacity-70">{alerta.fecha}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  )
}
