import { getAdminCategories } from '@/lib/admin-app'
import { CategoriasClient } from './categorias-client'

export default async function AdminCategoriasPage() {
  const categories = await getAdminCategories()
  return <CategoriasClient categories={categories} />
}
