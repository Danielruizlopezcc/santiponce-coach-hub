import { notFound } from 'next/navigation'
import { NewsDetail } from '@/components/news-detail'
import { requireUser } from '@/lib/auth'
import { getPrivateNewsData, getPrivateNewsDetail } from '@/lib/private-app'

type PrivateNewsDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PrivateNewsDetailPage({ params }: PrivateNewsDetailPageProps) {
  await requireUser()

  const { id } = await params
  const [item, data] = await Promise.all([
    getPrivateNewsDetail(id),
    getPrivateNewsData(),
  ])

  if (!item) notFound()

  const relatedNews = data.news.filter(
    (newsItem) => newsItem.id !== item.id && newsItem.sectionId === item.sectionId,
  )

  return <NewsDetail item={item} backHref="/app/noticias" relatedNews={relatedNews} />
}
