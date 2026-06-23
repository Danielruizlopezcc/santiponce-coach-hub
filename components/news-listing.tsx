import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Newspaper } from 'lucide-react'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { CLUB } from '@/lib/club'
import type { PrivateNewsItem, PrivateNewsSection } from '@/lib/private-app-shared'
import { cn } from '@/lib/utils'

type NewsListingProps = {
  news: PrivateNewsItem[]
  sections: PrivateNewsSection[]
  selectedSectionId?: string
  basePath: string
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
  return `hace ${diffDays} dias`
}

function getSectionHref(basePath: string, sectionId?: string) {
  return sectionId ? `${basePath}?section=${sectionId}` : basePath
}

function getNewsHref(basePath: string, itemId: string) {
  return `${basePath}/${itemId}`
}

function NewsMeta({ item, compact = false }: { item: PrivateNewsItem; compact?: boolean }) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-tight',
        compact ? 'mt-4' : 'mt-6',
      )}
    >
      <span className="text-primary">{item.sectionName}</span>
      <span className="h-px w-5 bg-border" aria-hidden="true" />
      <span className="font-semibold lowercase text-muted-foreground">
        {formatRelativeDate(item.createdAt)}
      </span>
    </p>
  )
}

function FeaturedNewsCard({ item, href }: { item: PrivateNewsItem; href: string }) {
  return (
    <Link href={href} className="group relative block min-h-[520px] overflow-hidden rounded-lg bg-foreground text-white shadow-xl ring-1 ring-black/10">
      <div className="absolute inset-0 bg-muted">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 70vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06172f] via-[#06172f]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06172f]/75 via-transparent to-transparent" />
      </div>

      <div className="relative flex min-h-[520px] max-w-3xl flex-col justify-end p-6 md:p-10 lg:p-12">
        <p className="flex w-fit items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white ring-1 ring-white/20">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          Ultima hora del club
        </p>
        <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-tight text-white md:text-6xl">
          {item.title}
        </h2>
        {item.body ? (
          <p className="mt-5 max-w-2xl line-clamp-3 text-base leading-7 text-white/82 md:text-lg">
            {item.body}
          </p>
        ) : null}
        <NewsMeta item={item} compact />
      </div>
    </Link>
  )
}

function HeadlineCard({ item, index, href }: { item: PrivateNewsItem; index: number; href: string }) {
  return (
    <Link href={href} className="group grid grid-cols-[92px_1fr] gap-4 border-b border-border/80 py-5 last:border-b-0">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="92px" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
          Destacado {index + 1}
        </p>
        <h3 className="mt-2 line-clamp-3 text-lg font-black leading-tight text-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        <NewsMeta item={item} compact />
      </div>
    </Link>
  )
}

function NewsCard({ item, href }: { item: PrivateNewsItem; href: string }) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] bg-muted">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-5">
        <h2 className="line-clamp-3 text-xl font-black leading-tight text-foreground transition-colors group-hover:text-primary">
          {item.title}
        </h2>
        <NewsMeta item={item} compact />
      </div>
    </Link>
  )
}

export function NewsListing({
  news,
  sections,
  selectedSectionId,
  basePath,
}: NewsListingProps) {
  const validSectionIds = new Set(sections.map((section) => section.id))
  const activeSectionId = selectedSectionId && validSectionIds.has(selectedSectionId)
    ? selectedSectionId
    : 'todas'
  const visibleNews = activeSectionId === 'todas'
    ? news
    : news.filter((item) => item.sectionId === activeSectionId)
  const [mainNews, ...restNews] = visibleNews
  const headlineNews = restNews.slice(0, 4)
  const regularNews = restNews.slice(4)
  const activeSectionName = activeSectionId === 'todas'
    ? 'Todas las secciones'
    : sections.find((section) => section.id === activeSectionId)?.name ?? 'Noticias'

  return (
    <section className="bg-[#f4f6f8]">
      <BrandedPageHero
        eyebrow="Actualidad oficial"
        title="Noticias"
      />

      <div className="border-b border-border bg-white/95 shadow-sm backdrop-blur">
        <nav
          aria-label="Secciones de noticias"
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:px-8"
        >
          <Link
            href={getSectionHref(basePath)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition-colors',
              activeSectionId === 'todas'
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            Todas
          </Link>
          {sections.map((section) => (
            <Link
              key={section.id}
              href={getSectionHref(basePath, section.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition-colors',
                activeSectionId === section.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {section.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {visibleNews.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-black text-foreground">No hay noticias todavia</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Cuando el club publique noticias en esta seccion, apareceran aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                  {activeSectionName}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  Ultima actualidad
                </h2>
              </div>
              <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                Temporada {CLUB.season}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              {mainNews ? <FeaturedNewsCard item={mainNews} href={getNewsHref(basePath, mainNews.id)} /> : null}

              {headlineNews.length > 0 ? (
                <aside className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="border-b border-border pb-4">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                      Mas leidas
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-foreground">
                      Titulares destacados
                    </h3>
                  </div>
                  <div>
                    {headlineNews.map((item, index) => (
                      <HeadlineCard key={item.id} item={item} index={index} href={getNewsHref(basePath, item.id)} />
                    ))}
                  </div>
                </aside>
              ) : null}
            </div>

            {regularNews.length > 0 ? (
              <div>
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    Mas noticias
                  </h2>
                  <span className="text-sm font-bold text-muted-foreground">
                    {regularNews.length} publicaciones
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {regularNews.map((item) => (
                    <NewsCard key={item.id} item={item} href={getNewsHref(basePath, item.id)} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
