'use client'

import Image, { type ImageProps } from 'next/image'
import { useEffect, useState } from 'react'

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined
  fallbackSrc: string
}

const STORAGE_IMAGE_VERSION = '20260707-restored'

function getTitleText(alt: ImageProps['alt']) {
  return typeof alt === 'string' && alt.trim() ? alt.trim() : 'CD Santiponce'
}

function getInitials(text: string) {
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  return (words.map((word) => word[0]).join('') || 'CD').toUpperCase()
}

function getAccentColor(text: string) {
  const colors = ['#1d4ed8', '#0f766e', '#b91c1c', '#7c3aed', '#0369a1', '#15803d']
  const hash = Array.from(text).reduce((total, char) => total + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function getVersionedSrc(src: string | null | undefined, fallbackSrc: string) {
  const value = src || fallbackSrc

  if (!value.includes('.supabase.co/storage/v1/object/public/')) {
    return value
  }

  const separator = value.includes('?') ? '&' : '?'
  return `${value}${separator}v=${STORAGE_IMAGE_VERSION}`
}

export function SafeImage({
  src,
  fallbackSrc: _fallbackSrc,
  alt,
  onError,
  fill,
  width,
  height,
  className,
  style,
  ...props
}: SafeImageProps) {
  const imageSrc = getVersionedSrc(src, _fallbackSrc)
  const [hasError, setHasError] = useState(!src)
  const title = getTitleText(alt)
  const accent = getAccentColor(title)

  useEffect(() => {
    setHasError(!src)
  }, [src, imageSrc])

  if (hasError) {
    return (
      <div
        aria-label={title}
        role="img"
        className={className}
        style={{
          ...(fill ? { position: 'absolute', inset: 0, height: '100%', width: '100%' } : { width, height }),
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background:
            `linear-gradient(135deg, ${accent} 0%, #08224f 54%, #06172f 100%)`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.24) 0 1px, transparent 2px), linear-gradient(135deg, rgba(255,255,255,0.13) 0 12%, transparent 12% 28%, rgba(0,0,0,0.16) 28% 42%, transparent 42%)',
            backgroundSize: '28px 28px, 150px 150px',
            opacity: 0.75,
          }}
        />
        <span
          style={{
            position: 'relative',
            display: 'grid',
            gap: '0.5rem',
            padding: '1rem',
            textAlign: 'center',
            color: 'white',
            textTransform: 'uppercase',
          }}
        >
          <strong style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)', lineHeight: 0.9 }}>{getInitials(title)}</strong>
          <span style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.08em' }}>{title}</span>
        </span>
      </div>
    )
  }

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={(event) => {
        setHasError(true)
        onError?.(event)
      }}
    />
  )
}
