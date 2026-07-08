'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from '@/app/iniciar-sesion/actions'

type SignOutButtonProps = {
  className?: string
  variant?: 'ghost' | 'outline'
  label?: string
}

export function SignOutButton({
  className,
  variant = 'ghost',
  label = 'Cerrar sesión',
}: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await Promise.allSettled([
      supabase.auth.signOut(),
      signOutAction(),
    ])
    router.replace('/iniciar-sesion')
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleSignOut}
    >
      <LogOut className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Button>
  )
}
