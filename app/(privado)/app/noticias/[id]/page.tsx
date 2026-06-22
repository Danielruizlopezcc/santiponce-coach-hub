import { notFound } from 'next/navigation'
import { NewsDetail } from '@/components/news-detail'
import { requireUser } from '@/lib/auth'
import { getPrivateNewsDetail } from '@/lib/private-app'

type PrivateNewsDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function PrivateNewsDetailPage({ params }: PrivateNewsDetailPageProps) {
  await requireUser()

  const { id } = await params
  const item = await getPrivateNewsDetail(id)

  if (!item) notFound()

  return <NewsDetail item={item} backHref="/app/noticias" />
}
