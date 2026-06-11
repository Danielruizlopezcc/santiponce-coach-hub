import type { ReactNode } from 'react'
import { PageContainer } from '@/components/page-container'

type PrivatePageContainerProps = {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/**
 * Fondo decorativo animado para páginas privadas.
 * Las animaciones sólo se aplican cuando prefers-reduced-motion: no-preference.
 */
function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-blob-slow" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary/6 blur-3xl motion-safe:animate-blob" />
      <div className="absolute bottom-[-10%] left-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl motion-safe:animate-blob-slow" />
    </div>
  )
}

/**
 * Contenedor de página privada del tutor.
 * Añade el fondo animado en azul suave sobre PageContainer.
 */
export function PrivatePageContainer({
  title,
  description,
  children,
  className,
}: PrivatePageContainerProps) {
  return (
    <div className="relative">
      <AnimatedBackground />
      <PageContainer title={title} description={description} className={className}>
        {children}
      </PageContainer>
    </div>
  )
}
