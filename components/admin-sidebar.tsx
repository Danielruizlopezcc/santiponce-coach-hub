import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { AdminNav } from '@/components/admin-nav'
import { CLUB } from '@/lib/club'

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-blue-900 md:flex">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="CD Santiponce — Panel de administración"
        >
          <Image
            src={CLUB.crest}
            alt={`Escudo del ${CLUB.legalName}`}
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-md object-contain"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-white">{CLUB.shortName}</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-blue-300" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                Panel Admin
              </span>
            </div>
          </div>
        </Link>
      </div>
      <AdminNav />
    </aside>
  )
}
