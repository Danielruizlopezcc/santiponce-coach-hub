import { notFound } from 'next/navigation'
import { NewsDetail } from '@/components/news-detail'
import { PublicShell } from '@/components/public-shell'
import { getPrivateNewsData, getPrivateNewsDetail } from '@/lib/private-app'

type NewsDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params
  const [item, data] = await Promise.all([
    getPrivateNewsDetail(id),
    getPrivateNewsData(),
  ])

  if (!item) notFound()

  const relatedNews = data.news.filter(
    (newsItem) => newsItem.id !== item.id && newsItem.sectionId === item.sectionId,
  )

  return (
    <PublicShell>
      <NewsDetail item={item} backHref="/noticias" relatedNews={relatedNews} />
    </PublicShell>
  )
}
