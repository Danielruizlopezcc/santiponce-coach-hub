import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Newspaper, Share2 } from 'lucide-react'
import { CLUB } from '@/lib/club'
import { getPlainNewsText, sanitizeNewsHtml } from '@/lib/news-content'
import type { PrivateNewsDetail } from '@/lib/private-app-shared'

type NewsDetailProps = {
  item: PrivateNewsDetail
  backHref: string
}

function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function NewsDetail({ item, backHref }: NewsDetailProps) {
  const contentHtml = sanitizeNewsHtml(item.body)
  const leadParagraph = getPlainNewsText(item.body).split(/\n+/).find(Boolean)

  return (
    <article className="bg-[#f4f6f8]">
      <header className="bg-[#06172f] text-white">
        <div className="grid min-h-[460px] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative flex flex-col justify-center px-4 py-10 md:px-10 lg:px-[max(2rem,calc((100vw-80rem)/2))]">
            <div
              className="absolute inset-0 opacity-16"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 48px)',
                backgroundSize: '48px 48px',
              }}
            />
            <div className="relative max-w-3xl">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-black text-white/80 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver a noticias
              </Link>
              <p className="mt-10 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-white/76">
                <span>{item.sectionName}</span>
                <span className="h-px w-8 bg-white/25" aria-hidden="true" />
                <span>{formatNewsDate(item.createdAt)}</span>
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[0.98] tracking-tight md:text-6xl">
                {item.title}
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ring-1 ring-white/15">
                  <Newspaper className="size-4 text-primary" aria-hidden="true" />
                  Actualidad oficial
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ring-1 ring-white/15">
                  <Share2 className="size-4 text-primary" aria-hidden="true" />
                  {CLUB.shortName}
                </span>
              </div>
            </div>
          </div>

          <div className="relative min-h-[320px] bg-muted lg:min-h-[460px]">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06172f]/38 via-transparent to-transparent" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-primary">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatNewsDate(item.createdAt)}
          </p>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#06172f] shadow-sm ring-1 ring-black/5">
            {item.sectionName}
          </p>
        </div>

        {leadParagraph && contentHtml ? (
          <p className="mb-8 text-2xl font-black leading-snug tracking-tight text-primary md:text-3xl">
            {leadParagraph}
          </p>
        ) : (
          <p className="text-xl font-bold leading-8 text-foreground">
            Esta noticia todavia no tiene contenido desarrollado.
          </p>
        )}

        {contentHtml ? (
          <div
            className="news-rich-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : null}
      </div>
    </article>
  )
}
