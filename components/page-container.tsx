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
    <div className={cn('mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8', className)}>
      <header className="mb-8">
        <div className="mb-3 h-1 w-14 rounded-full bg-primary" aria-hidden="true" />
        <h1 className="text-4xl font-black tracking-tight text-foreground text-balance md:text-5xl">
          {title}
        </h1>
      </header>
      {children}
    </div>
  )
}
