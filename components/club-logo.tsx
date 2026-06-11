import Image from 'next/image'
import Link from 'next/link'
import { CLUB } from '@/lib/club'
import { cn } from '@/lib/utils'

type ClubLogoProps = {
  size?: number
  withText?: boolean
  className?: string
  href?: string
}

export function ClubLogo({
  size = 44,
  withText = true,
  className,
  href = '/',
}: ClubLogoProps) {
  const content = (
    <span className={cn('flex items-center gap-3', className)}>
      <Image
        src={CLUB.crest || '/placeholder.svg'}
        alt={`Escudo del ${CLUB.legalName}`}
        width={size}
        height={size}
        priority
        className="h-auto w-auto rounded-md object-contain"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-foreground">
            {CLUB.shortName}
          </span>
          <span className="text-xs text-muted-foreground">
            Temporada {CLUB.season}
          </span>
        </span>
      )}
    </span>
  )

  if (!href) return content

  return (
    <Link
      href={href}
      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${CLUB.shortName} — Inicio`}
    >
      {content}
    </Link>
  )
}
