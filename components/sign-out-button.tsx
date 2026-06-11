'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type SignOutButtonProps = {
  className?: string
  variant?: 'ghost' | 'outline'
}

export function SignOutButton({
  className,
  variant = 'ghost',
}: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/iniciar-sesion')
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
      Cerrar sesión
    </Button>
  )
}
