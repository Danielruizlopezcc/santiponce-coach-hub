'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: 'none' | 'short' | 'medium'
  variant?: 'fade-up' | 'slide-left' | 'slide-right' | 'zoom' | 'soft-rise'
}

const delayClass = {
  none: '',
  short: 'delay-100',
  medium: 'delay-200',
}

const hiddenVariantClass = {
  'fade-up': 'translate-y-10 opacity-0 blur-sm',
  'slide-left': 'translate-x-12 opacity-0 blur-sm',
  'slide-right': '-translate-x-12 opacity-0 blur-sm',
  zoom: 'scale-95 opacity-0 blur-sm',
  'soft-rise': 'translate-y-8 scale-[0.98] opacity-0 blur-sm',
}

export function ScrollReveal({
  children,
  className,
  delay = 'none',
  variant = 'fade-up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.16 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={clsx(
        'motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out',
        delayClass[delay],
        isVisible
          ? 'translate-x-0 translate-y-0 scale-100 opacity-100 blur-0'
          : hiddenVariantClass[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
