import { getAdminEnrollments } from '@/lib/admin-app'
import { MatriculasClient } from './matriculas-client'

export default async function AdminMatriculasPage() {
  const enrollments = await getAdminEnrollments()
  return <MatriculasClient enrollments={enrollments} />
}
