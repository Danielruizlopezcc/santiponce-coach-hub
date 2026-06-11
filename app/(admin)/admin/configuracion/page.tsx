import { Settings2 } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { getAdminConfig } from '@/lib/admin-app'

export default async function AdminConfiguracionPage() {
  const data = await getAdminConfig()

  return (
    <PageContainer
      title="Configuración"
      description="Resumen de configuración basado en el estado real disponible en Supabase."
      className="max-w-7xl"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => (
          <section
            key={item.id}
            className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">{item.titulo}</h2>
                <p className="mt-1 text-2xl font-bold text-foreground">{item.valor}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.descripcion}</p>
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
