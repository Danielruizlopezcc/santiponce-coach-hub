import { cn } from '@/lib/utils'

type PageContainerProps = {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageContainer({
  title,
  description,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8', className)}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </header>
      {children}
    </div>
  )
}
