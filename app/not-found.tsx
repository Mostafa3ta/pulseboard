import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main id="content" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-muted-foreground" aria-hidden>
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">No such page</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pulseboard is a single dashboard. Everything lives on the front page, including the filters in its URL.</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to the dashboard</Link>
      </Button>
    </main>
  )
}
