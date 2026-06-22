'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth'
import { getSponsorTierOption, SPONSOR_TIER_OPTIONS, type SponsorTier } from '@/lib/sponsors'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'sponsors'

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

function buildSponsorImagePath(file: File) {
  const safeName = normalizeFileName(file.name)
  return `patrocinadores/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`
}

async function uploadSponsorImage(supabase: ReturnType<typeof createAdminClient>, image: File) {
  if (!image || !(image instanceof File) || !image.type.startsWith('image/')) {
    throw new Error('Debes subir una imagen válida para el patrocinador.')
  }

  const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
  })

  if (bucketError && !bucketError.message.includes('already exists')) {
    throw new Error(bucketError.message)
  }

  const imagePath = buildSponsorImagePath(image)
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

function getSponsorSortOrder(value: FormDataEntryValue | null) {
  const tier = typeof value === 'string' ? value : 'partner'
  const isValidTier = SPONSOR_TIER_OPTIONS.some((option) => option.value === tier)
  return getSponsorTierOption(isValidTier ? (tier as SponsorTier) : 'partner').sortOrder
}

export async function createSponsor(formData: FormData) {
  const title = formData.get('title')
  const sortOrder = getSponsorSortOrder(formData.get('tier'))
  const isActive = formData.get('isActive') === 'true'
  const image = formData.get('image') as File | null

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('El título del patrocinador es obligatorio.')
  }

  if (!image) {
    throw new Error('Selecciona una imagen para el patrocinador.')
  }

  const supabase = await getAdminSupabase()
  const imageUrl = await uploadSponsorImage(supabase, image)

  const { error } = await supabase.from('sponsors').insert({
    title: title.trim(),
    image_url: imageUrl,
    is_active: isActive,
    sort_order: sortOrder,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/patrocinadores')
  revalidatePath('/patrocinadores')
  revalidatePath('/app/patrocinadores')
}

export async function updateSponsor(formData: FormData) {
  const id = formData.get('id')
  const title = formData.get('title')
  const sortOrder = getSponsorSortOrder(formData.get('tier'))
  const isActive = formData.get('isActive') === 'true'
  const image = formData.get('image') as File | null

  if (!id || typeof id !== 'string') {
    throw new Error('Falta el identificador del patrocinador.')
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('El título del patrocinador es obligatorio.')
  }

  const supabase = await getAdminSupabase()

  const updates: Record<string, unknown> = {
    title: title.trim(),
    is_active: isActive,
    sort_order: sortOrder,
  }

  if (image) {
    updates.image_url = await uploadSponsorImage(supabase, image)
  }

  const { error } = await supabase.from('sponsors').update(updates).eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/patrocinadores')
  revalidatePath('/patrocinadores')
  revalidatePath('/app/patrocinadores')
}

export async function deleteSponsor(id: string) {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/patrocinadores')
  revalidatePath('/patrocinadores')
  revalidatePath('/app/patrocinadores')
}
