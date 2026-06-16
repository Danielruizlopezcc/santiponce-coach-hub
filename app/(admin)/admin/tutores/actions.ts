'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeDocument, normalizeEmail, normalizePhone } from '@/lib/private-app-shared'

export type TutorSocioActionState = {
  ok: boolean
  message: string
}

const basePersonSchema = z.object({
  nombre: z.string().trim().min(2, 'Introduce un nombre.').max(60),
  apellidos: z.string().trim().min(2, 'Introduce los apellidos.').max(80),
  email: z.string().trim().email('Correo no válido.').max(120),
})

const tutorSchema = basePersonSchema.extend({
  telefono: z.string().trim().min(6, 'Introduce un teléfono.').max(30),
  documento: z.string().trim().min(3, 'Introduce DNI/NIE.').max(40),
  ciudad: z.string().trim().min(2, 'Introduce ciudad.').max(60),
  isSocio: z.coerce.boolean().optional(),
})

async function createAuthProfile(values: z.infer<typeof basePersonSchema>) {
  const supabase = createAdminClient()
  const email = normalizeEmail(values.email)
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing) throw new Error('Ya existe una cuenta con ese correo.')

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: values.nombre,
      last_name: values.apellidos,
    },
  })

  if (error || !data.user) throw new Error(error?.message ?? 'No se ha podido crear el usuario.')

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      email,
      first_name: values.nombre,
      last_name: values.apellidos,
    })

  if (profileError) throw new Error(profileError.message)
  return data.user.id
}

export async function createTutorAction(
  _prev: TutorSocioActionState,
  formData: FormData,
): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const parsed = tutorSchema.safeParse({
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    documento: formData.get('documento'),
    ciudad: formData.get('ciudad'),
    isSocio: formData.get('isSocio') === 'on',
  })

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }

  try {
    const supabase = createAdminClient()
    const values = parsed.data
    const userId = await createAuthProfile(values)
    const { error } = await supabase.from('guardians').insert({
      user_id: userId,
      first_name: values.nombre,
      last_name: values.apellidos,
      phone: normalizePhone(values.telefono),
      document_id: normalizeDocument(values.documento),
      address_line: 'Pendiente',
      postal_code: '41970',
      province: 'Sevilla',
      city: values.ciudad,
      country: 'España',
      payment_preference: 'cuotas',
    })
    if (error) throw new Error(error.message)

    if (values.isSocio) {
      await setUserMembership(userId, true)
    }

    revalidatePath('/admin/tutores')
    return { ok: true, message: 'Tutor creado correctamente.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido crear el tutor.' }
  }
}

export async function createMemberAction(
  _prev: TutorSocioActionState,
  formData: FormData,
): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const parsed = basePersonSchema.safeParse({
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
  })

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }

  try {
    const userId = await createAuthProfile(parsed.data)
    await setUserMembership(userId, true)
    revalidatePath('/admin/tutores')
    return { ok: true, message: 'Socio creado correctamente.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido crear el socio.' }
  }
}

export async function toggleTutorMemberAction(userId: string, isSocio: boolean): Promise<TutorSocioActionState> {
  await requireAdminAction()

  try {
    await setUserMembership(userId, isSocio)
    revalidatePath('/admin/tutores')
    return { ok: true, message: isSocio ? 'Tutor marcado como socio.' : 'Tutor desmarcado como socio.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se ha podido actualizar el tutor.' }
  }
}

async function setUserMembership(userId: string, isSocio: boolean) {
  const supabase = createAdminClient()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_paid_member: isSocio,
      membership_paid_at: isSocio ? new Date().toISOString() : null,
    })
    .eq('id', userId)
  if (profileError) throw new Error(profileError.message)

  if (isSocio) {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'member' })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'member')
    if (error) throw new Error(error.message)
  }
}
