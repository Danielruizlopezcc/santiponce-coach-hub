import type { Metadata } from 'next'
import { CalendarPublicView } from '@/components/calendar-public-view'
import { PublicShell } from '@/components/public-shell'
import { getPublicCalendarData } from '@/lib/calendar'

export const metadata: Metadata = {
  title: 'Calendario | CD Santiponce',
  description: 'Partidos y resultados del CD Santiponce.',
}

type CalendarioPageProps = {
  searchParams?: Promise<{
    season?: string
    team?: string
    competition?: string
    status?: string
  }>
}

export default async function CalendarioPage({ searchParams }: CalendarioPageProps) {
  const [filters = {}, data] = await Promise.all([
    searchParams,
    getPublicCalendarData(),
  ])

  return (
    <PublicShell>
      <CalendarPublicView data={data} filters={filters} />
    </PublicShell>
  )
}
