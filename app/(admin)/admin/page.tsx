import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Clock3,
  CreditCard,
  Info,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/page-container'
import { formatEuro } from '@/lib/format'
import {
  ALERTAS_ADMIN,
  DASHBOARD_RESUMEN,
  DEPORTISTAS_POR_CATEGORIA,
  DEPORTISTAS_POR_EQUIPO,
  PAGOS_RECIENTES,
} from '@/lib/admin'

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
  critico: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
  ok: {
    icon: BadgeCheck,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
  },
} as const

const paymentStyles = {
  pagado: 'bg-emerald-100 text-emerald-700',
  pendiente: 'bg-amber-100 text-amber-700',
  fallido: 'bg-red-100 text-red-700',
  reembolsado: 'bg-blue-100 text-blue-700',
} as const

export default function AdminDashboardPage() {
  const maxCategoria = Math.max(...DEPORTISTAS_POR_CATEGORIA.map((item) => item.total))

  return (
    <PageContainer
      title="Resumen"
      description="Panel de administración visual del Club Deportivo Santiponce."
      className="max-w-7xl"
    >
      {/* TODO: Proteger este layout en servidor con un rol admin real. */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Número de usuarios
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-foreground">{DASHBOARD_RESUMEN.usuarios}</p>
            </div>
            <Users className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Número de tutores
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-foreground">{DASHBOARD_RESUMEN.tutores}</p>
            </div>
            <UserCheck className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Número de deportistas
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-foreground">{DASHBOARD_RESUMEN.deportistas}</p>
            </div>
            <Trophy className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deportistas pendientes
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                {DASHBOARD_RESUMEN.deportistasPendientes}
              </p>
            </div>
            <Clock3 className="size-5 text-amber-600" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Matrículas pagadas
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {DASHBOARD_RESUMEN.matriculasPagadas}
              </p>
            </div>
            <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Matrículas pendientes
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                {DASHBOARD_RESUMEN.matriculasPendientes}
              </p>
            </div>
            <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />
          </CardHeader>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos por matrículas
              </CardTitle>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatEuro(DASHBOARD_RESUMEN.ingresosEuros)}
              </p>
            </div>
            <CreditCard className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deportistas por categoría</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {DEPORTISTAS_POR_CATEGORIA.map((item) => (
              <div key={item.label} className="grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(item.total / maxCategoria) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deportistas por equipo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {DEPORTISTAS_POR_EQUIPO.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay equipos disponibles.</p>
            ) : (
              DEPORTISTAS_POR_EQUIPO.map((item) => (
                <div
                  key={item.equipo}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.equipo}</p>
                    <p className="text-muted-foreground">{item.categoria}</p>
                  </div>
                  <span className="font-semibold text-foreground">{item.total}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pagos recientes</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {PAGOS_RECIENTES.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No hay pagos recientes.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                    <th className="px-4 py-3">Operación</th>
                    <th className="px-4 py-3">Deportista</th>
                    <th className="px-4 py-3">Importe</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {PAGOS_RECIENTES.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.concepto}</p>
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.deportista}</p>
                        <p className="text-xs text-muted-foreground">{item.familia}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatEuro(item.importe)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentStyles[item.estado]}`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas administrativas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {ALERTAS_ADMIN.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
            ) : (
              ALERTAS_ADMIN.map((alerta) => {
                const Icon = alertStyles[alerta.tipo].icon
                return (
                  <div
                    key={alerta.id}
                    className={`rounded-2xl border p-4 ${alertStyles[alerta.tipo].className}`}
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
    </PageContainer>
  )
}
