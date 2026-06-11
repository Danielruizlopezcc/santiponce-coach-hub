import { PageContainer } from '@/components/page-container'

const DEPORTISTAS = [
  { id: 1, nombre: 'Lucía García', categoria: 'Alevín', equipo: 'Alevín A' },
  { id: 2, nombre: 'Marcos García', categoria: 'Cadete', equipo: 'Cadete B' },
]

export default function MisDeportistasPage() {
  return (
    <PageContainer
      title="Mis deportistas"
      description="Deportistas vinculados a tu cuenta."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {DEPORTISTAS.map((d) => (
          <li
            key={d.id}
            className="rounded-xl border border-border bg-card p-5 text-card-foreground"
          >
            <p className="text-base font-semibold">{d.nombre}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {d.categoria} · {d.equipo}
            </p>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
