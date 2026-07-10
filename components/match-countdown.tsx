'use client'

import { useEffect, useState } from 'react'

type MatchCountdownProps = {
  matchDate: string
  matchTime: string
}

function getCountdownLabel(matchDate: string, matchTime: string) {
  if (!matchTime) return 'Hora por confirmar'

  const target = new Date(`${matchDate}T${matchTime}`)
  const diff = target.getTime() - Date.now()

  if (Number.isNaN(target.getTime())) return 'Hora por confirmar'
  if (diff <= 0) return 'Comenzado'

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function MatchCountdown({ matchDate, matchTime }: MatchCountdownProps) {
  const [label, setLabel] = useState(matchTime ? 'Calculando...' : 'Hora por confirmar')

  useEffect(() => {
    const update = () => setLabel(getCountdownLabel(matchDate, matchTime))
    update()

    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [matchDate, matchTime])

  return (
    <div className="relative -mx-4 -mb-10 mt-9 flex items-center justify-center gap-5 border-t border-white/10 bg-white/8 px-4 py-4 text-sm font-black text-white md:-mx-8 md:-mb-12 lg:-mx-20">
      <span>Comienza en:</span>
      <span className="text-lg">{label}</span>
    </div>
  )
}
