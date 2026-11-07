import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder for the four chart cards while ECharts loads. */
export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" role="status" aria-label="Loading charts">
      <Skeleton className="h-96 rounded-xl lg:col-span-2" />
      <Skeleton className="h-88 rounded-xl" />
      <Skeleton className="h-88 rounded-xl" />
      <Skeleton className="h-80 rounded-xl lg:col-span-2" />
    </div>
  )
}

/** Placeholder for the whole dashboard, rendered on the server and swapped out after hydration. */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <ChartsSkeleton />
    </div>
  )
}
