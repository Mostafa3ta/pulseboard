'use client'

import { Download, Link2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { getOrders } from '@/data/seed'
import { Button } from '@/components/ui/button'
import { computeKpis, heatmapCells, ordersByCategory, revenueByRegion, revenueSeries } from '@/lib/aggregate'
import { exportFilename, ordersToCsv } from '@/lib/csv'
import { downloadText } from '@/lib/download'
import { DEFAULT_FILTERS, applyFilters, parseFilters, previousPeriod, serializeFilters, type Filters } from '@/lib/filters'
import { formatInteger, formatRange } from '@/lib/format'
import { pickGranularity } from '@/lib/periods'
import { CATEGORY_LABELS, REGION_LABELS } from '@/lib/types'
import { ChartsSkeleton } from './dashboard-skeleton'
import { EmptyState } from './empty-state'
import { FilterBar } from './filter-bar'
import { KpiRow } from './kpi-row'

// ECharts is the heaviest dependency, so the charts arrive after the first paint.
const ChartsGrid = dynamic(() => import('@/components/charts/charts-grid'), { ssr: false, loading: () => <ChartsSkeleton /> })

/**
 * Owns the dashboard state. The filters are the URL and nothing else: this component parses
 * them from the search params, derives every figure with memoised pure functions, and writes
 * changes back with history.replaceState so a view can be shared by copying the address.
 */
export function Dashboard() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams])

  const setFilters = useCallback(
    (next: Filters) => {
      const query = serializeFilters(next)
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [pathname],
  )

  const orders = useMemo(() => getOrders(), [])
  const filtered = useMemo(() => applyFilters(orders, filters), [orders, filters])
  const kpis = useMemo(() => computeKpis(filtered), [filtered])
  const previousRange = useMemo(() => previousPeriod(filters), [filters])
  const previous = useMemo(
    () => (previousRange ? computeKpis(applyFilters(orders, { ...filters, ...previousRange })) : null),
    [orders, filters, previousRange],
  )
  const granularity = filters.granularity ?? pickGranularity(filters.from, filters.to)
  const series = useMemo(() => revenueSeries(filtered, filters.from, filters.to, granularity), [filtered, filters.from, filters.to, granularity])
  const stacks = useMemo(() => ordersByCategory(filtered), [filtered])
  const shares = useMemo(() => revenueByRegion(filtered), [filtered])
  const cells = useMemo(() => heatmapCells(filtered), [filtered])

  const exportCsv = () => {
    const filename = exportFilename(filters.from, filters.to)
    downloadText(filename, ordersToCsv(filtered))
    toast.success(`Exported ${formatInteger(filtered.length)} orders`, { description: filename })
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied', { description: 'Anyone who opens it sees exactly this view.' })
    } catch {
      toast.error('Could not copy the link', { description: 'Copy the address from the browser bar instead.' })
    }
  }

  const regionsText = filters.regions.length ? filters.regions.map((r) => REGION_LABELS[r]).join(', ') : 'all regions'
  const categoriesText = filters.categories.length ? filters.categories.map((c) => CATEGORY_LABELS[c]).join(', ') : 'all categories'

  return (
    <div className="grid gap-5 sm:gap-6">
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground tabular-nums">{formatInteger(filtered.length)}</span> orders ·{' '}
          {formatRange(filters.from, filters.to)} · {regionsText} · {categoriesText}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Link2 className="size-3.5" aria-hidden />
            Copy link
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-3.5" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
      ) : (
        <>
          <KpiRow kpis={kpis} previous={previous} comparison={previousRange ? `vs ${formatRange(previousRange.from, previousRange.to)}` : null} />
          <ChartsGrid series={series} granularity={granularity} stacks={stacks} shares={shares} cells={cells} />
        </>
      )}
    </div>
  )
}
