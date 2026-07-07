'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: 'none' | 'short' | 'medium' | 'long'
  variant?:
    | 'fade-up'
    | 'slide-left'
    | 'slide-right'
    | 'zoom'
    | 'soft-rise'
    | 'curtain'
    | 'tilt'
    | 'pop'
    | 'drift'
    | 'wipe'
}

const delayClass = {
  none: '',
  short: 'delay-100',
  medium: 'delay-200',
  long: 'delay-300',
}

const variantClass = {
  'fade-up': {
    hidden: 'translate-y-10 opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[950ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  'slide-left': {
    hidden: 'translate-x-12 opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[950ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  'slide-right': {
    hidden: '-translate-x-12 opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[950ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  zoom: {
    hidden: 'scale-95 opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[950ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  'soft-rise': {
    hidden: 'translate-y-8 scale-[0.98] opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[1100ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  curtain: {
    hidden: 'translate-y-14 scale-y-[0.96] opacity-0 blur-md',
    visible: 'translate-x-0 translate-y-0 scale-x-100 scale-y-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[1200ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  tilt: {
    hidden: 'translate-y-10 rotate-2 scale-[0.97] opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[1050ms] motion-safe:ease-[cubic-bezier(.2,.8,.2,1)]',
  },
  pop: {
    hidden: 'translate-y-4 scale-[0.9] opacity-0 blur-sm',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[850ms] motion-safe:ease-[cubic-bezier(.34,1.36,.64,1)]',
  },
  drift: {
    hidden: '-translate-x-8 translate-y-8 scale-[1.02] opacity-0 blur-md',
    visible: 'translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[1300ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
  wipe: {
    hidden: 'translate-x-10 scale-x-[0.97] opacity-0 blur-md',
    visible: 'translate-x-0 translate-y-0 scale-x-100 scale-y-100 rotate-0 opacity-100 blur-0',
    transition: 'motion-safe:duration-[1150ms] motion-safe:ease-[cubic-bezier(.16,1,.3,1)]',
  },
}

export function ScrollReveal({
  children,
  className,
  delay = 'none',
  variant = 'fade-up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const animation = variantClass[variant]

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
        'transform-gpu will-change-transform motion-safe:transition-all',
        animation.transition,
        delayClass[delay],
        isVisible ? animation.visible : animation.hidden,
        className,
      )}
    >
      {children}
    </div>
  )
}
