import type { ReactNode } from 'react'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CLUB } from '@/lib/club'

type AuthCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({
  title,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <Image
        src={CLUB.crest || '/placeholder.svg'}
        alt={`Escudo del ${CLUB.legalName}`}
        width={72}
        height={72}
        priority
        className="mb-4 h-auto w-auto object-contain"
        style={{ width: 72, height: 72 }}
      />
      <Card className="w-full border-border/70 bg-card/90 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black tracking-tight text-balance">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  )
}
