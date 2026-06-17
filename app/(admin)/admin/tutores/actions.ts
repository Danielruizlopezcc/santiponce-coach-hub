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
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  telefono: z.string().trim().min(6, 'Introduce un teléfono.').max(30),
  documento: z.string().trim().min(3, 'Introduce DNI/NIE.').max(40),
  ciudad: z.string().trim().min(2, 'Introduce ciudad.').max(60),
  isSocio: z.coerce.boolean().optional(),
})

const memberSchema = basePersonSchema.extend({
  id: z.string().uuid().optional(),
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
    id: formData.get('id') || undefined,
    userId: formData.get('userId') || undefined,
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
    if (values.id && values.userId) {
      const email = normalizeEmail(values.email)
      const { error: authError } = await supabase.auth.admin.updateUserById(values.userId, {
        email,
        email_confirm: true,
        user_metadata: {
          first_name: values.nombre,
          last_name: values.apellidos,
        },
      })
      if (authError) throw new Error(authError.message)

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email,
          first_name: values.nombre,
          last_name: values.apellidos,
        })
        .eq('id', values.userId)
      if (profileError) throw new Error(profileError.message)

      const { error: guardianError } = await supabase
        .from('guardians')
        .update({
          first_name: values.nombre,
          last_name: values.apellidos,
          phone: normalizePhone(values.telefono),
          document_id: normalizeDocument(values.documento),
          city: values.ciudad,
        })
        .eq('id', values.id)
      if (guardianError) throw new Error(guardianError.message)

      await setUserMembership(values.userId, Boolean(values.isSocio))
      revalidatePath('/admin/tutores')
      return { ok: true, message: 'Tutor actualizado correctamente.' }
    }

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
      is_approved: true,
      approval_status: 'approved',
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
  const parsed = memberSchema.safeParse({
    id: formData.get('id') || undefined,
    nombre: formData.get('nombre'),
    apellidos: formData.get('apellidos'),
    email: formData.get('email'),
  })

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los datos.' }

  try {
    if (parsed.data.id) {
      const supabase = createAdminClient()
      const email = normalizeEmail(parsed.data.email)
      const { error: authError } = await supabase.auth.admin.updateUserById(parsed.data.id, {
        email,
        email_confirm: true,
        user_metadata: {
          first_name: parsed.data.nombre,
          last_name: parsed.data.apellidos,
        },
      })
      if (authError) throw new Error(authError.message)

      const { error } = await supabase
        .from('profiles')
        .update({
          email,
          first_name: parsed.data.nombre,
          last_name: parsed.data.apellidos,
          is_paid_member: true,
          membership_paid_at: new Date().toISOString(),
        })
        .eq('id', parsed.data.id)
      if (error) throw new Error(error.message)
      await setUserMembership(parsed.data.id, true)
      revalidatePath('/admin/tutores')
      return { ok: true, message: 'Socio actualizado correctamente.' }
    }

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

export async function approveTutorAction(guardianId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('guardians')
    .update({ is_approved: true, approval_status: 'approved' })
    .eq('id', guardianId)

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor aprobado correctamente.' }
}

export async function rejectTutorAction(guardianId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('guardians')
    .update({ is_approved: false, approval_status: 'rejected' })
    .eq('id', guardianId)

  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor rechazado correctamente.' }
}

export async function deleteTutorAction(guardianId: string, userId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Tutor eliminado correctamente.' }
}

export async function deleteMemberAction(userId: string): Promise<TutorSocioActionState> {
  await requireAdminAction()
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/tutores')
  return { ok: true, message: 'Socio eliminado correctamente.' }
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
