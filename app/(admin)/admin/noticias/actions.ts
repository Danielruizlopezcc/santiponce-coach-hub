'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'news'

async function getAdminSupabase() {
  await requireAdminAction()
  return createAdminClient()
}

function normalizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildNewsImagePath(file: File) {
  const safeName = normalizeFileName(file.name)
  return `noticias/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`
}

function getStoragePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '')
}

async function removeNewsImage(supabase: ReturnType<typeof createAdminClient>, imageUrl: string | null | undefined) {
  const path = getStoragePathFromPublicUrl(imageUrl)
  if (!path) return
  await supabase.storage.from(BUCKET_NAME).remove([path])
}

async function uploadNewsImage(supabase: ReturnType<typeof createAdminClient>, image: File) {
  if (!image || !(image instanceof File) || !image.type.startsWith('image/')) {
    throw new Error('Debes subir una imagen válida para la noticia.')
  }

  const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
  })

  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(bucketError.message)
  }

  const imagePath = buildNewsImagePath(image)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(imagePath, image, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath)

  if (!publicUrlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la imagen.')
  }

  return publicUrlData.publicUrl
}

export async function createNews(formData: FormData) {
  const title = formData.get('title')
  const body = formData.get('body')
  const sectionId = formData.get('sectionId')
  const image = formData.get('image') as File | null

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('El título de la noticia es obligatorio.')
  }

  if (!sectionId || typeof sectionId !== 'string') {
    throw new Error('Selecciona una sección para la noticia.')
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    throw new Error('El contenido de la noticia es obligatorio.')
  }

  if (!image) {
    throw new Error('Selecciona una imagen para la noticia.')
  }

  const supabase = await getAdminSupabase()
  const imageUrl = await uploadNewsImage(supabase, image)

  const { error } = await supabase.from('news').insert({
    title: title.trim(),
    body: body.trim(),
    section_id: sectionId,
    image_url: imageUrl,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath('/app/noticias')
}

export async function updateNews(formData: FormData) {
  const id = formData.get('id')
  const title = formData.get('title')
  const body = formData.get('body')
  const sectionId = formData.get('sectionId')
  const image = formData.get('image') as File | null

  if (!id || typeof id !== 'string') {
    throw new Error('Falta el identificador de la noticia.')
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('El título de la noticia es obligatorio.')
  }

  if (!sectionId || typeof sectionId !== 'string') {
    throw new Error('Selecciona una sección para la noticia.')
  }

  if (!body || typeof body !== 'string' || !body.trim()) {
    throw new Error('El contenido de la noticia es obligatorio.')
  }

  const supabase = await getAdminSupabase()
  const updates: Record<string, unknown> = {
    title: title.trim(),
    body: body.trim(),
    section_id: sectionId,
  }
  let previousImageUrl: string | null | undefined

  if (image) {
    const { data: current } = await supabase.from('news').select('image_url').eq('id', id).maybeSingle()
    previousImageUrl = current?.image_url
    updates.image_url = await uploadNewsImage(supabase, image)
  }

  const { error } = await supabase.from('news').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  await removeNewsImage(supabase, previousImageUrl)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath(`/noticias/${id}`)
  revalidatePath('/app/noticias')
  revalidatePath(`/app/noticias/${id}`)
}

export async function createNewsSection(name: string) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('El nombre de la sección es obligatorio.')
  }

  const supabase = await getAdminSupabase()
  const { count } = await supabase
    .from('news_sections')
    .select('id', { count: 'exact', head: true })

  const { error } = await supabase.from('news_sections').insert({
    name: trimmed,
    sort_order: count ?? 0,
    is_active: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath('/app/noticias')
}

export async function updateNewsSection(id: string, name: string, isActive: boolean) {
  const trimmed = name.trim()
  if (!id) {
    throw new Error('Falta el identificador de la sección.')
  }
  if (!trimmed) {
    throw new Error('El nombre de la sección es obligatorio.')
  }

  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('news_sections')
    .update({ name: trimmed, is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath('/app/noticias')
}

export async function deleteNewsSection(id: string) {
  if (!id) {
    throw new Error('Falta el identificador de la sección.')
  }

  const supabase = await getAdminSupabase()
  const { count } = await supabase
    .from('news')
    .select('id', { count: 'exact', head: true })
    .eq('section_id', id)

  if ((count ?? 0) > 0) {
    throw new Error('No puedes eliminar una sección que tiene noticias asignadas.')
  }

  const { error } = await supabase.from('news_sections').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath(`/noticias/${id}`)
  revalidatePath('/app/noticias')
  revalidatePath(`/app/noticias/${id}`)
}

export async function deleteNews(id: string) {
  const supabase = await getAdminSupabase()
  const { data: current } = await supabase.from('news').select('image_url').eq('id', id).maybeSingle()
  const { error } = await supabase.from('news').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await removeNewsImage(supabase, current?.image_url)

  revalidatePath('/admin/noticias')
  revalidatePath('/noticias')
  revalidatePath('/app/noticias')
}
