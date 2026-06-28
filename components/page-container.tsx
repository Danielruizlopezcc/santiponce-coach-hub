import { cn } from '@/lib/utils'

type PageContainerProps = {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageContainer({
  title,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl px-5 py-4 md:px-8 md:py-5', className)}>
      <header className="mb-4">
        <div className="mb-2 h-0.5 w-10 rounded-full bg-primary" aria-hidden="true" />
        <h1 className="text-2xl font-black tracking-tight text-foreground text-balance md:text-3xl">
          {title}
        </h1>
      </header>
      {children}
    </div>
  )
}
