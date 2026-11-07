import { Activity } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Activity className="size-5 text-primary" aria-hidden />
          Pulseboard
        </Link>
        <Badge variant="outline" className="hidden sm:inline-flex">
          demo
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
