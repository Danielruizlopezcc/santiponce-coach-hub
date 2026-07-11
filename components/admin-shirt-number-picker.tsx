'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ShirtNumberOccupant = {
  athleteId: string
  name: string
}

type ShirtNumberPickerProps = {
  athleteId: string
  value: number | null
  disabled?: boolean
  occupantByNumber: Map<number, ShirtNumberOccupant>
  onAssign: (shirtNumber: number | null) => void
  onSwap: (otherAthleteId: string) => void
  ariaLabel: string
}

const SHIRT_NUMBERS = Array.from({ length: 99 }, (_, index) => index + 1)

export function ShirtNumberPicker({
  athleteId,
  value,
  disabled = false,
  occupantByNumber,
  onAssign,
  onSwap,
  ariaLabel,
}: ShirtNumberPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
      >
        <span>{value ?? 'Sin dorsal'}</span>
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-64 max-w-[80vw] overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onAssign(null)
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm font-semibold transition-colors hover:bg-muted',
              value === null && 'bg-primary/10 text-primary',
            )}
          >
            Sin dorsal
          </button>

          {SHIRT_NUMBERS.map((number) => {
            const occupant = occupantByNumber.get(number)
            const isOwnNumber = occupant?.athleteId === athleteId
            const isCurrent = value === number
            const takenByOther = occupant && !isOwnNumber

            return (
              <button
                key={number}
                type="button"
                onClick={() => {
                  if (isCurrent) {
                    setOpen(false)
                    return
                  }
                  if (takenByOther && occupant) onSwap(occupant.athleteId)
                  else onAssign(number)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                  isCurrent && 'bg-primary/10 font-black text-primary',
                )}
              >
                <span className="font-semibold">{number}</span>
                {takenByOther ? (
                  <span className="truncate text-xs font-semibold text-amber-700">
                    {occupant.name} · intercambiar
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
