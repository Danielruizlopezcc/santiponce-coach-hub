import { getAdminCategories, getAdminSettings } from '@/lib/admin-app'
import { CategoriasClient } from './categorias-client'

export default async function AdminCategoriasPage() {
  const [categories, settings] = await Promise.all([getAdminCategories(), getAdminSettings()])
  return <CategoriasClient categories={categories} globalEnrollmentFeeEuros={settings.enrollmentFeeEuros} />
}
