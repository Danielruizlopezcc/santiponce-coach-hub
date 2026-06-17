'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PrivateNewsItem } from '@/lib/private-app-shared'
import { CLUB } from '@/lib/club'
import { cn } from '@/lib/utils'

type HomeNewsCarouselProps = {
  news: PrivateNewsItem[]
  linkHref?: string
}

const AUTOPLAY_MS = 4500

export function HomeNewsCarousel({ news, linkHref = '/noticias' }: HomeNewsCarouselProps) {
  const slides = useMemo(() => news.slice(0, 3), [news])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(interval)
  }, [slides.length])

  useEffect(() => {
    if (activeIndex > slides.length - 1) {
      setActiveIndex(0)
    }
  }, [activeIndex, slides.length])

  if (slides.length === 0) {
    return (
      <section className="relative flex min-h-[560px] items-center overflow-hidden bg-[#061a3b] text-white md:min-h-[620px]">
        <Image src="/images/Fondo1.png" alt="" fill priority className="object-cover opacity-35" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,#03142f_0%,rgba(7,40,91,0.86)_52%,rgba(14,75,150,0.72)_100%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <Image
            src={CLUB.crest}
            alt={`Escudo del ${CLUB.legalName}`}
            width={120}
            height={120}
            className="size-24 object-contain"
          />
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
            Club Deportivo Santiponce
          </h1>
          <p className="mt-5 text-xl font-bold text-white/78">Actualidad del club</p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Últimas noticias del club"
      className="relative min-h-[560px] overflow-hidden bg-[#03142f] text-white md:min-h-[620px]"
    >
      {slides.map((item, index) => (
        <Link
          key={item.id}
          href={linkHref}
          aria-hidden={index !== activeIndex}
          tabIndex={index === activeIndex ? 0 : -1}
          className={cn(
            'group absolute inset-0 block transition-opacity duration-700',
            index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            priority={index === 0}
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,20,47,0.78)_0%,rgba(3,20,47,0.42)_34%,rgba(3,20,47,0.12)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#03142f]/82 via-[#03142f]/8 to-[#03142f]/18" />
          <div
            className="absolute inset-0 opacity-10"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '88px 88px',
            }}
          />

          <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-4 py-12 sm:px-6 md:min-h-[620px] md:py-16">
            <div className="max-w-4xl pb-4 md:pb-2">
              <p className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-black uppercase text-white">
                Noticia {index + 1} de {slides.length}
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-5xl">
                {item.title}
              </h2>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase text-primary shadow-lg">
                Leer actualidad
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </p>
            </div>
          </div>
        </Link>
      ))}

      {slides.length > 1 ? (
        <div className="absolute bottom-6 left-1/2 z-10 flex w-full max-w-7xl -translate-x-1/2 items-center gap-2 px-4 sm:px-6">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ver noticia ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'h-2.5 rounded-full transition-all',
                index === activeIndex ? 'w-12 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
