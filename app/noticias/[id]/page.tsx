import { notFound } from 'next/navigation'
import { NewsDetail } from '@/components/news-detail'
import { PublicShell } from '@/components/public-shell'
import { getPrivateNewsDetail } from '@/lib/private-app'

type NewsDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params
  const item = await getPrivateNewsDetail(id)

  if (!item) notFound()

  return (
    <PublicShell>
      <NewsDetail item={item} backHref="/noticias" />
    </PublicShell>
  )
}
