import { NewsListing } from '@/components/news-listing'
import { PublicShell } from '@/components/public-shell'
import { getPrivateNewsData } from '@/lib/private-app'

type NoticiasPageProps = {
  searchParams?: Promise<{
    section?: string
  }>
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const [{ section: selectedSectionId } = {}, data] = await Promise.all([
    searchParams,
    getPrivateNewsData(),
  ])

  return (
    <PublicShell>
      <NewsListing
        news={data.news}
        sections={data.sections}
        selectedSectionId={selectedSectionId}
        basePath="/noticias"
      />
    </PublicShell>
  )
}
