import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { AdminNav } from '@/components/admin-nav'
import { CLUB } from '@/lib/club'
import { getDefaultAdminPath, type AdminRole } from '@/lib/admin-permissions'

export function AdminSidebar({ role }: { role: AdminRole }) {
  const homeHref = getDefaultAdminPath(role)

  return (
    <aside className="sticky top-0 hidden h-svh w-52 shrink-0 flex-col bg-blue-900 md:flex">
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
        <Link
          href={homeHref}
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="CD Santiponce — Panel de administración"
        >
          <Image
            src={CLUB.crest}
            alt={`Escudo del ${CLUB.legalName}`}
            width={28}
            height={28}
            priority
            className="h-7 w-7 rounded-md object-contain"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-white">{CLUB.shortName}</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-blue-300" aria-hidden="true" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-300">
                Panel Admin
              </span>
            </div>
          </div>
        </Link>
      </div>
      <AdminNav role={role} />
    </aside>
  )
}
