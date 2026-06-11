import { getAdminConsents } from '@/lib/admin-app'
import { ConsentimientosClient } from './consentimientos-client'

export default async function AdminConsentimientosPage() {
  const consents = await getAdminConsents()
  return <ConsentimientosClient consents={consents} />
}
