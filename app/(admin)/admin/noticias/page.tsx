import { getAdminNews, getAdminNewsSections } from '@/lib/admin-app'
import { NoticiasClient } from './noticias-client'

export default async function AdminNoticiasPage() {
  const [news, sections] = await Promise.all([getAdminNews(), getAdminNewsSections()])
  return <NoticiasClient news={news} sections={sections} />
}
