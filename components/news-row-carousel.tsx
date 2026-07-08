'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SafeImage } from '@/components/safe-image'
import type { PrivateNewsItem } from '@/lib/private-app-shared'

type NewsRowCarouselProps = {
  items: PrivateNewsItem[]
  basePath: string
  title: string
  showMoreHref?: string
}

function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getNewsHref(basePath: string, itemId: string) {
  return `${basePath}/${itemId}`
}

export function NewsRowCarousel({ items, basePath, title, showMoreHref }: NewsRowCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function move(direction: -1 | 1) {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({ left: direction * Math.round(scroller.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-serif text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Ver noticias anteriores"
            onClick={() => move(-1)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-white text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Ver más noticias"
            onClick={() => move(1)}
            className="inline-flex size-9 items-center justify-center rounded-full bg-white text-foreground ring-1 ring-border transition-colors hover:bg-primary hover:text-white"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          {showMoreHref && (
            <Link href={showMoreHref} className="inline-flex items-center gap-2 text-sm font-black text-foreground ml-2">
              Ver más
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={getNewsHref(basePath, item.id)}
              className="group block w-[270px] shrink-0 sm:w-[326px]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <SafeImage
                  src={item.imageUrl}
                  alt={item.title}
                  fallbackSrc="/images/Fondo1.png"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="326px"
                />
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-black uppercase leading-snug text-foreground transition-colors group-hover:text-primary md:text-base">
                {item.title}
              </h3>
              <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                <span className="text-red-600">{item.sectionName}</span>
                <span className="mx-2 text-border">|</span>
                {formatNewsDate(item.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
