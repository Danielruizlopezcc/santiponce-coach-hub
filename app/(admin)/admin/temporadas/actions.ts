'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSportsAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const seasonBaseSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(40),
  startsAt: z.string().min(1, 'Introduce fecha de inicio.'),
  endsAt: z.string().min(1, 'Introduce fecha de fin.'),
  isActive: z.boolean(),
})

const seasonSchema = seasonBaseSchema.refine((values) => values.endsAt >= values.startsAt, {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
  path: ['endsAt'],
})

const createSeasonSchema = seasonBaseSchema.omit({ id: true }).refine((values) => values.endsAt >= values.startsAt, {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
  path: ['endsAt'],
})

export async function updateSeasonAction(input: z.infer<typeof seasonSchema>): Promise<void> {
  await requireSportsAdminAction()
  const parsed = seasonSchema.parse(input)
  const supabase = createAdminClient()

  if (parsed.isActive) {
    const { error: clearError } = await supabase
      .from('seasons')
      .update({ is_active: false })
      .neq('id', parsed.id)
    if (clearError) throw new Error(clearError.message)
  }

  const { error } = await supabase
    .from('seasons')
    .update({
      name: parsed.nombre,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      is_active: parsed.isActive,
    })
    .eq('id', parsed.id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/temporadas')
  revalidatePath('/admin')
}

export async function createSeasonAction(input: z.infer<typeof createSeasonSchema>): Promise<void> {
  await requireSportsAdminAction()
  const parsed = createSeasonSchema.parse(input)
  const supabase = createAdminClient()

  if (parsed.isActive) {
    const { error: clearError } = await supabase
      .from('seasons')
      .update({ is_active: false })
    if (clearError) throw new Error(clearError.message)
  }

  const { error } = await supabase
    .from('seasons')
    .insert({
      name: parsed.nombre,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      is_active: parsed.isActive,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/temporadas')
  revalidatePath('/admin')
}

export async function deleteSeasonAction(id: string): Promise<void> {
  await requireSportsAdminAction()
  const parsed = z.string().uuid().parse(id)
  const supabase = createAdminClient()
  const { error } = await supabase.from('seasons').delete().eq('id', parsed)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/temporadas')
  revalidatePath('/admin')
}
