import { PrivateHomeLanding } from '@/components/private-home-landing'
import { requireUser } from '@/lib/auth'
import { getPrivateNewsData, getPrivateSponsors, getPrivateTeams, getPrivateUserStatus } from '@/lib/private-app'

export default async function AppDashboardPage() {
  const user = await requireUser()
  const [newsData, teams, sponsors, status] = await Promise.all([
    getPrivateNewsData(),
    getPrivateTeams(),
    getPrivateSponsors(),
    getPrivateUserStatus(user.id),
  ])

  return (
    <PrivateHomeLanding
      news={newsData.news}
      teams={teams}
      sponsors={sponsors}
      hasGuardian={status.hasGuardian}
    />
  )
}
