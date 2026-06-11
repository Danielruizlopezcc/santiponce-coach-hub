'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function getAdminSupabase() {
  await requireAdmin()
  return createAdminClient()
}

export async function createCategory(name: string, sortOrder: number, isActive: boolean) {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('categories')
    .insert({ name, sort_order: sortOrder, is_active: isActive })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}

export async function updateCategory(
  id: string,
  name: string,
  sortOrder: number,
  isActive: boolean,
) {
  const supabase = await getAdminSupabase()
  const { error } = await supabase
    .from('categories')
    .update({ name, sort_order: sortOrder, is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}

export async function deleteCategory(id: string) {
  const supabase = await getAdminSupabase()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}
