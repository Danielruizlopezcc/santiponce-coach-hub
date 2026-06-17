import type { ReactNode } from 'react'
import { PageContainer } from '@/components/page-container'

type PrivatePageContainerProps = {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function PrivatePageContainer({
  title,
  description,
  children,
  className,
}: PrivatePageContainerProps) {
  return (
    <PageContainer title={title} description={description} className={className}>
      {children}
    </PageContainer>
  )
}
