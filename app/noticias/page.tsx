import Image from 'next/image'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'
import { getPrivateNewsData } from '@/lib/private-app'
import type { PrivateNewsItem } from '@/lib/private-app-shared'
import { cn } from '@/lib/utils'

type NoticiasPageProps = {
  searchParams?: Promise<{
    section?: string
  }>
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)

  if (diffDays <= 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays === 2) return 'anteayer'
  return `hace ${diffDays} días`
}

function NewsMeta({ item }: { item: PrivateNewsItem }) {
  return (
    <p className="mt-5 text-xs font-black uppercase tracking-tight">
      <span className="text-primary">{item.sectionName}</span>
      <span className="mx-2 text-muted-foreground">-</span>
      <span className="font-medium lowercase text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
    </p>
  )
}

function FeaturedNewsCard({ item }: { item: PrivateNewsItem }) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative aspect-[16/9] bg-muted">
        <Image src={item.imageUrl} alt={item.title} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className="p-5 md:p-6">
        <h2 className="text-2xl font-black leading-tight text-foreground md:text-3xl">{item.title}</h2>
        {item.body ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80">{item.body}</p> : null}
        <NewsMeta item={item} />
      </div>
    </article>
  )
}

function NewsCard({ item }: { item: PrivateNewsItem }) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative aspect-[4/3] bg-muted">
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
      </div>
      <div className="p-4">
        <h2 className="line-clamp-2 text-lg font-black leading-snug text-foreground">{item.title}</h2>
        <NewsMeta item={item} />
      </div>
    </article>
  )
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const [{ section: selectedSectionId } = {}, data] = await Promise.all([
    searchParams,
    getPrivateNewsData(),
  ])
  const validSectionIds = new Set(data.sections.map((section) => section.id))
  const activeSectionId = selectedSectionId && validSectionIds.has(selectedSectionId) ? selectedSectionId : 'todas'
  const visibleNews = activeSectionId === 'todas' ? data.news : data.news.filter((item) => item.sectionId === activeSectionId)
  const featuredNews = visibleNews.slice(0, 2)
  const regularNews = visibleNews.slice(2)

  return (
    <PublicShell>
      <PageContainer title="Noticias" description="Actualidad del club organizada por secciones." className="max-w-7xl">
        <div className="bg-[#f3f5f7]/80 pb-10">
          <nav aria-label="Secciones de noticias" className="mb-5 overflow-x-auto border-b border-border bg-white">
            <div className="flex min-w-max items-center gap-2 px-5">
              <Link
                href="/noticias"
                className={cn(
                  'border-b-2 px-3 py-4 text-sm font-bold transition-colors',
                  activeSectionId === 'todas' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                Todas las secciones
              </Link>
              {data.sections.map((section) => (
                <Link
                  key={section.id}
                  href={`/noticias?section=${section.id}`}
                  className={cn(
                    'border-b-2 px-3 py-4 text-sm font-bold transition-colors',
                    activeSectionId === section.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {section.name}
                </Link>
              ))}
            </div>
          </nav>

          {visibleNews.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Newspaper className="size-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-black text-foreground">No hay noticias todavía</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Cuando el club publique noticias, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {featuredNews.map((item) => <FeaturedNewsCard key={item.id} item={item} />)}
              </div>
              {regularNews.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {regularNews.map((item) => <NewsCard key={item.id} item={item} />)}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </PageContainer>
    </PublicShell>
  )
}
