'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export type FinanceMovementActionState = {
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
