import 'server-only'

import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

type AuditLogInput = {
  actor: Pick<User, 'id'> | { id: string }
  action: string
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown>
}

export async function createAdminAuditLog({
  actor,
  action,
  entityType,
  entityId = null,
  summary,
  metadata = {},
}: AuditLogInput) {
  const { error } = await createAdminClient().from('admin_audit_logs').insert({
    actor_user_id: actor.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    metadata,
  })

  if (error) {
    console.error('Unable to write admin audit log', error)
  }
}
