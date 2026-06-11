import { PrivateMobileNav } from '@/components/mobile-drawer'
import { MOCK_USER } from '@/lib/club'

export function PrivateHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
      <PrivateMobileNav />

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col text-right leading-tight sm:flex">
          <span className="text-sm font-semibold text-foreground">
            {MOCK_USER.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {MOCK_USER.email}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {MOCK_USER.initials}
        </span>
      </div>
    </header>
  )
}
