'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type FinanceMovementActionState = {
  ok: boolean
  message: string
}

export type FeeTemplateActionState = {
  ok: boolean
  message: string
}

const financeMovementSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['ingreso', 'gasto'], {
    message: 'Selecciona si es un ingreso o un gasto.',
  }),
  concepto: z.string().trim().min(2, 'Escribe un concepto.').max(120, 'El concepto es demasiado largo.'),
  detalle: z.string().trim().max(500, 'El detalle es demasiado largo.').optional(),
  importe: z.coerce
    .number({ message: 'Introduce un importe válido.' })
    .positive('El importe debe ser mayor que cero.')
    .max(999_999, 'El importe es demasiado alto.'),
})

const feeTemplateSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre de la cuota.').max(120),
  tipo: z.string().trim().min(2, 'Escribe el tipo de cuota.').max(80),
  importe: z.coerce
    .number({ message: 'Introduce un precio total válido.' })
    .positive('El precio total debe ser mayor que cero.')
    .max(999_999, 'El precio total es demasiado alto.'),
  isPublic: z.coerce.boolean(),
  splitPayment: z.coerce.boolean(),
  chargeFrequency: z.string().trim().max(80).optional(),
  chargeCount: z.coerce.number().int().positive().optional(),
}).superRefine((values, ctx) => {
  if (!values.splitPayment) return
  if (!values.chargeFrequency) {
    ctx.addIssue({ code: 'custom', path: ['chargeFrequency'], message: 'Indica la frecuencia de cargos.' })
  }
  if (!values.chargeCount || values.chargeCount < 2) {
    ctx.addIssue({ code: 'custom', path: ['chargeCount'], message: 'El número total de cargos debe ser mayor que 1.' })
  }
})

export async function createFinanceMovementAction(
  _prevState: FinanceMovementActionState,
  formData: FormData,
): Promise<FinanceMovementActionState> {
  const admin = await requireAdminAction()
  const parsed = financeMovementSchema.safeParse({
    id: formData.get('id') || undefined,
    tipo: formData.get('tipo'),
    concepto: formData.get('concepto'),
    detalle: formData.get('detalle'),
    importe: formData.get('importe'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos del movimiento.',
    }
  }

  const supabase = createAdminClient()
  const { id, tipo, concepto, detalle, importe } = parsed.data
  const payload = {
    movement_type: tipo === 'ingreso' ? 'income' : 'expense',
    concept: concepto,
    detail: detalle || null,
    amount_cents: Math.round(importe * 100),
    currency: 'eur',
  }
  const { error } = id
    ? await supabase.from('admin_finance_movements').update(payload).eq('id', id)
    : await supabase.from('admin_finance_movements').insert({
        ...payload,
        created_by: admin.id,
      })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  revalidatePath('/admin/pagos')
  return {
    ok: true,
    message: id ? 'Movimiento actualizado correctamente.' : 'Movimiento guardado correctamente.',
  }
}

export async function deleteFinanceMovementAction(id: string): Promise<FinanceMovementActionState> {
  await requireAdminAction()

  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return {
      ok: false,
      message: 'No se ha podido identificar el movimiento.',
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('admin_finance_movements')
    .delete()
    .eq('id', parsed.data)

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  revalidatePath('/admin/pagos')
  return {
    ok: true,
    message: 'Movimiento eliminado correctamente.',
  }
}

export async function createFeeTemplateAction(
  _prevState: FeeTemplateActionState,
  formData: FormData,
): Promise<FeeTemplateActionState> {
  const admin = await requireAdminAction()
  const splitPayment = formData.get('splitPayment') === 'on'
  const parsed = feeTemplateSchema.safeParse({
    nombre: formData.get('nombre'),
    tipo: formData.get('tipo'),
    importe: formData.get('importe'),
    isPublic: formData.get('isPublic') === 'on',
    splitPayment,
    chargeFrequency: splitPayment ? formData.get('chargeFrequency') : undefined,
    chargeCount: splitPayment ? formData.get('chargeCount') : undefined,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cuota.',
    }
  }

  const values = parsed.data
  const supabase = createAdminClient()
  const { error } = await supabase.from('admin_fee_templates').insert({
    name: values.nombre,
    fee_type: values.tipo,
    total_amount_cents: Math.round(values.importe * 100),
    currency: 'eur',
    is_public: values.isPublic,
    split_payment: values.splitPayment,
    charge_frequency: values.splitPayment ? values.chargeFrequency : null,
    charge_count: values.splitPayment ? values.chargeCount : null,
    created_by: admin.id,
  })

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/pagos')
  return { ok: true, message: 'Cuota guardada correctamente.' }
}
