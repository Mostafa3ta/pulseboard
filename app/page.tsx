import { Suspense } from 'react'
import { DATA_END, DATA_START } from '@/data/range'
import { Dashboard } from '@/components/dashboard/dashboard'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { SiteFooter } from '@/components/shell/site-footer'
import { SiteHeader } from '@/components/shell/site-header'
import { formatRange } from '@/lib/format'

// The page is static. The dashboard reads its filters from the URL on the client, which is
// why it sits inside a Suspense boundary: the server renders the skeleton, the browser fills it in.
export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:outline-2 focus:outline-ring"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-5 max-w-2xl sm:mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sales &amp; operations</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            A year of seeded orders, {formatRange(DATA_START, DATA_END)}. Filter, compare with the period before, export what you see.
          </p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
