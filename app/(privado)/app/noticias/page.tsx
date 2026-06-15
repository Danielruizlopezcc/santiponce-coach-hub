import { NewsListing } from '@/components/news-listing'
import { requireUser } from '@/lib/auth'
import { getPrivateNewsData } from '@/lib/private-app'

type NoticiasPageProps = {
  searchParams?: Promise<{
    section?: string
  }>
}

export default async function PrivateNoticiasPage({ searchParams }: NoticiasPageProps) {
  await requireUser()

  const [{ section: selectedSectionId } = {}, data] = await Promise.all([
    searchParams,
    getPrivateNewsData(),
  ])

  return (
    <NewsListing
      news={data.news}
      sections={data.sections}
      selectedSectionId={selectedSectionId}
      basePath="/app/noticias"
    />
  )
}
