import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BrandedPageHeroProps = {
  eyebrow?: ReactNode
  title: string
  description?: ReactNode
  className?: string
  children?: ReactNode
}

export function BrandedPageHero({
  eyebrow,
  title,
  description,
  className,
  children,
}: BrandedPageHeroProps) {
  return (
    <section className={cn('relative overflow-hidden bg-[#06172f] text-white', className)}>
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: 'url(/images/Fondo_Santiponce.png)',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-[#06172f]/18" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        {children}
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.32em] text-white/68">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/76">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  )
}
