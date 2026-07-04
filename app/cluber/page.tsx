import { PublicShell } from '@/components/public-shell'

export default function CluberPage() {
  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[54vh] w-full max-w-5xl flex-col justify-center px-5 py-16 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Cluber</p>
        <h1 className="mt-4 text-4xl font-black uppercase text-foreground md:text-5xl">
          Área Cluber
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-muted-foreground">
          Próximamente estará disponible el acceso a Cluber del CD Santiponce.
        </p>
      </section>
    </PublicShell>
  )
}
