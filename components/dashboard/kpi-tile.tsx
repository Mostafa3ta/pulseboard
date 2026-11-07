import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { formatDelta } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface KpiTileProps {
  label: string
  /** The headline figure, already formatted (compact for big numbers). */
  value: string
  /** The exact figure, shown on hover when `value` is rounded. */
  exact?: string
  /** Relative change against the comparison period; null when there is nothing to compare with. */
  delta: number | null
  /** "vs 5 May – 2 Aug 2026" */
  comparison: string | null
  /** Whether a rise is good news. False for refund rate. */
  upIsGood?: boolean
}

export function KpiTile({ label, value, exact, delta, comparison, upIsGood = true }: KpiTileProps) {
  const direction = delta === null ? 'none' : delta > 0.0005 ? 'up' : delta < -0.0005 ? 'down' : 'flat'
  const sentiment = direction === 'up' || direction === 'down' ? ((direction === 'up') === upIsGood ? 'good' : 'bad') : 'neutral'
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  return (
    <article aria-label={label} className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl" title={exact}>
        {value}
      </p>
      <p
        className={cn(
          'mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm',
          sentiment === 'good' && 'text-up',
          sentiment === 'bad' && 'text-down',
          sentiment === 'neutral' && 'text-muted-foreground',
        )}
      >
        {delta === null ? (
          <span>No earlier period to compare</span>
        ) : (
          <>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="font-medium tabular-nums">{formatDelta(delta)}</span>
            {comparison && <span className="text-muted-foreground">{comparison}</span>}
          </>
        )}
      </p>
    </article>
  )
}
