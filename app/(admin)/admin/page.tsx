import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Info,
  Medal,
  Newspaper,
  ShieldCheck,
  Tags,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function getPercent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function MiniMetric({
  label,
  value,
  icon: Icon,
  tone = 'blue',
}: {
  label: string
  value: number
  icon: typeof Users
  tone?: 'blue' | 'amber' | 'green'
}) {
  return (
    <div className="rounded-lg border border-border bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p
            className={cn(
              'mt-2 text-3xl font-black tracking-tight',
              tone === 'amber' ? 'text-amber-700' : 'text-foreground',
            )}
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl',
            tone === 'green' && 'bg-emerald-100 text-emerald-700',
            tone === 'amber' && 'bg-amber-100 text-amber-700',
            tone === 'blue' && 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
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
    <div className="flex items-center gap-5">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--primary) 0 ${percent}%, rgba(2,6,23,0.09) ${percent}% 100%)`,
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white">
          <span className="text-xl font-black text-foreground">{percent}%</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-black text-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{label}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{title}</h2>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()
  const maxCategoria = Math.max(1, ...data.athletesByCategory.map((item) => item.total))
  const totalDeportistas = Math.max(1, data.summary.deportistas)

  return (
    <PageContainer
      title="Resumen"
      description="Panel de administración visual del Club Deportivo Santiponce."
      className="max-w-7xl"
    >
      <div className="space-y-8">
        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <SectionHeading label="Comunidad" title="Familias, socios y administradores" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <MiniMetric label="Tutores" value={data.summary.tutores} icon={UserCheck} />
              <MiniMetric label="Socios activos" value={data.summary.sociosActivos} icon={Medal} />
              <MiniMetric
                label="Tutores que también son socios"
                value={data.summary.tutoresSocios}
                icon={Users}
              />
              <MiniMetric
                label="Administradores"
                value={data.summary.administradores}
                icon={ShieldCheck}
              />
            </CardContent>
          </Card>

          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <SectionHeading label="Estado" title="Matriculación deportiva" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Donut
                value={data.summary.deportistasMatriculados}
                total={totalDeportistas}
                label="Deportistas matriculados"
                detail={`${data.summary.deportistasMatriculados} de ${data.summary.deportistas} deportistas aparecen como matriculados.`}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric
                  label="En revisión"
                  value={data.summary.deportistasEnRevision}
                  icon={Clock3}
                  tone="amber"
                />
                <MiniMetric
                  label="Pendientes"
                  value={data.summary.deportistasPendientes}
                  icon={Clock3}
                  tone="amber"
                />
                <MiniMetric
                  label="Sin equipo"
                  value={data.summary.deportistasSinEquipo}
                  icon={ShieldCheck}
                  tone="amber"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <MiniMetric label="Deportistas totales" value={data.summary.deportistas} icon={Users} />
          <MiniMetric label="Equipos activos" value={data.summary.equipos} icon={ShieldCheck} />
          <MiniMetric label="Patrocinadores" value={data.summary.patrocinadores} icon={Trophy} />
          <MiniMetric label="Noticias" value={data.summary.noticias} icon={Newspaper} />
          <MiniMetric label="Categorías activas" value={data.summary.categorias} icon={Tags} />
          <MiniMetric label="Temporadas" value={data.summary.temporadas} icon={CalendarDays} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <SectionHeading label="Cantera" title="Deportistas por categoría" />
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

          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <SectionHeading label="Equipos" title="Distribución por equipo" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.athletesByTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay equipos disponibles.</p>
              ) : (
                data.athletesByTeam.map((item) => (
                  <div
                    key={item.equipo}
                    className="grid gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-foreground">{item.equipo}</p>
                        <p className="text-muted-foreground">{item.categoria}</p>
                      </div>
                      <span className="text-lg font-black text-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.total / totalDeportistas) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white/88 shadow-sm backdrop-blur">
            <CardHeader>
              <SectionHeading label="Seguimiento" title="Alertas administrativas" />
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
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
                          <div className="flex items-center justify-between gap-2">
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
