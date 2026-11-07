import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold tracking-tight">No orders match these filters</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Try a wider date range, or clear the region and category filters. The dataset covers every day of the year, but not every
        combination on every day.
      </p>
      <Button className="mt-6" onClick={onReset}>
        Clear filters
      </Button>
    </div>
  )
}
