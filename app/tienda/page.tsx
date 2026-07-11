import { PublicShell } from '@/components/public-shell'
import { TiendaAccessButton } from '@/components/tienda-access-button'

export default function StorePage() {
  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[54vh] w-full max-w-5xl flex-col items-center justify-center px-5 py-16 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Tienda</p>
        <h1 className="mt-4 text-4xl font-black uppercase text-foreground md:text-5xl">
          Tienda oficial
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-muted-foreground">
          Viste los colores del CD Santiponce. Accede a la tienda oficial de equipaciones y
          merchandising.
        </p>
        <TiendaAccessButton />
      </section>
    </PublicShell>
  )
}
