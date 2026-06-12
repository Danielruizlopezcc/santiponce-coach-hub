import { getAdminSponsors } from '@/lib/admin-app'
import { PatrocinadoresClient } from './patrocinadores-client'

export default async function AdminPatrocinadoresPage() {
  const sponsors = await getAdminSponsors()
  return <PatrocinadoresClient sponsors={sponsors} />
}
