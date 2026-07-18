'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminAuditLog } from '@/lib/audit'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminSettingsActionState = {
  ok: boolean
  message: string
}

const decimalSchema = z.coerce
  .number({ error: 'Introduce un importe válido.' })
  .min(0, 'El importe no puede ser negativo.')
  .max(10000, 'El importe es demasiado alto.')

const settingsSchema = z.object({
  clubShortName: z.string().trim().min(2, 'Introduce el nombre corto.').max(80),
  clubLegalName: z.string().trim().min(2, 'Introduce el nombre legal.').max(140),
  seasonLabel: z.string().trim().min(4, 'Introduce la temporada visible.').max(40),
  membershipFeeEuros: decimalSchema,
  enrollmentFeeEuros: decimalSchema,
  registrationOpen: z.boolean(),
  contactEmail: z
    .string()
    .trim()
    .transform((value) => value || '')
    .pipe(z.string().email('Correo no válido.').or(z.literal(''))),
  contactPhone: z.string().trim().max(40, 'El teléfono es demasiado largo.'),
  clubTaxId: z.string().trim().max(20, 'El CIF/NIF es demasiado largo.'),
  clubFiscalAddress: z.string().trim().max(200, 'La dirección fiscal es demasiado larga.'),
  clubRegistryNumber: z.string().trim().max(60, 'El número de registro es demasiado largo.'),
})

const activeSeasonSchema = z.object({
  seasonId: z.string().uuid('Selecciona una temporada válida.'),
})

function formatMoney(value: number) {
  return value.toFixed(2).replace(/\.00$/, '')
}

export async function updateAdminSettingsAction(
  _prev: AdminSettingsActionState,
  formData: FormData,
): Promise<AdminSettingsActionState> {
  const admin = await requireAdminAction()

  const parsed = settingsSchema.safeParse({
    clubShortName: formData.get('clubShortName'),
    clubLegalName: formData.get('clubLegalName'),
    seasonLabel: formData.get('seasonLabel'),
    membershipFeeEuros: formData.get('membershipFeeEuros'),
    enrollmentFeeEuros: formData.get('enrollmentFeeEuros'),
    registrationOpen: formData.get('registrationOpen') === 'on',
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    clubTaxId: formData.get('clubTaxId'),
    clubFiscalAddress: formData.get('clubFiscalAddress'),
    clubRegistryNumber: formData.get('clubRegistryNumber'),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revisa los ajustes.' }
  }

  const values = parsed.data
  const rows = [
    { key: 'club_short_name', value: values.clubShortName },
    { key: 'club_legal_name', value: values.clubLegalName },
    { key: 'season_label', value: values.seasonLabel },
    { key: 'membership_fee_euros', value: formatMoney(values.membershipFeeEuros) },
    { key: 'enrollment_fee_euros', value: formatMoney(values.enrollmentFeeEuros) },
    { key: 'registration_open', value: String(values.registrationOpen) },
    { key: 'contact_email', value: values.contactEmail },
    { key: 'contact_phone', value: values.contactPhone },
    { key: 'club_tax_id', value: values.clubTaxId },
    { key: 'club_fiscal_address', value: values.clubFiscalAddress },
    { key: 'club_registry_number', value: values.clubRegistryNumber },
  ]

  const { error } = await createAdminClient()
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) {
    return { ok: false, message: `No se han podido guardar los ajustes: ${error.message}` }
  }

  await createAdminAuditLog({
    actor: admin,
    action: 'settings.update',
    entityType: 'app_settings',
    summary: 'Actualizó la configuración general del club.',
    metadata: {
      clubShortName: values.clubShortName,
      clubLegalName: values.clubLegalName,
      seasonLabel: values.seasonLabel,
      membershipFeeEuros: values.membershipFeeEuros,
      enrollmentFeeEuros: values.enrollmentFeeEuros,
      registrationOpen: values.registrationOpen,
    },
  })

  revalidatePath('/admin/configuracion')
  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true, message: 'Configuración guardada correctamente.' }
}

export async function updateActiveSeasonAction(input: unknown): Promise<void> {
  const admin = await requireAdminAction()
  const { seasonId } = activeSeasonSchema.parse(input)
  const supabase = createAdminClient()

  const { data: season, error: lookupError } = await supabase
    .from('seasons')
    .select('id')
    .eq('id', seasonId)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)
  if (!season) throw new Error('La temporada seleccionada no existe.')

  const { error: clearError } = await supabase.from('seasons').update({ is_active: false }).neq('id', seasonId)
  if (clearError) throw new Error(clearError.message)

  const { error } = await supabase.from('seasons').update({ is_active: true }).eq('id', seasonId)
  if (error) throw new Error(error.message)

  await createAdminAuditLog({
    actor: admin,
    action: 'season.activate',
    entityType: 'season',
    entityId: seasonId,
    summary: 'Cambió la temporada activa.',
  })

  revalidatePath('/admin/configuracion')
  revalidatePath('/admin/temporadas')
  revalidatePath('/admin')
}
