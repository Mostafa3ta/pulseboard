'use client'

import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { WEEKDAY_LABELS, type CategoryStack, type HeatCell, type RegionShare, type SeriesPoint } from '@/lib/aggregate'
import { formatHour, formatInteger, formatMoney, formatPercent, formatPeriodLong } from '@/lib/format'
import type { Granularity } from '@/lib/periods'
import { CATEGORY_LABELS, REGIONS, REGION_LABELS } from '@/lib/types'
import { Chart } from './chart'
import { ChartCard } from './chart-card'
import type { ChartMode } from './chart-theme'
import { categoryOption, heatmapOption, regionOption, revenueOption } from './options'

export interface ChartsGridProps {
  series: SeriesPoint[]
  granularity: Granularity
  stacks: CategoryStack[]
  shares: RegionShare[]
  cells: HeatCell[]
}

/**
 * The four charts. Loaded lazily by the dashboard so ECharts is not in the first paint.
 * Each chart gets a pure option built from already-aggregated data plus a table twin.
 */
export default function ChartsGrid({ series, granularity, stacks, shares, cells }: ChartsGridProps) {
  const { resolvedTheme } = useTheme()
  const mode: ChartMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  const compact = !useMediaQuery('(min-width: 640px)', true)
  const ctx = useMemo(() => ({ mode, compact }), [mode, compact])

  const revenue = useMemo(() => revenueOption(series, granularity, ctx), [series, granularity, ctx])
  const category = useMemo(() => categoryOption(stacks, ctx), [stacks, ctx])
  const region = useMemo(() => regionOption(shares, ctx), [shares, ctx])
  const heatmap = useMemo(() => heatmapOption(cells, ctx), [cells, ctx])

  const firstKey = series[0]?.key
  const lastKey = series[series.length - 1]?.key
  const busiest = cells.reduce((best, cell) => (cell.orders > best.orders ? cell : best), cells[0])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        className="lg:col-span-2"
        title="Revenue over time"
        subtitle={`Gross revenue per ${granularity}. Drag the slider to zoom.`}
        table={{
          caption: `Revenue and orders per ${granularity}.`,
          columns: ['Period', 'Revenue', 'Orders'],
          rows: series.map((p) => [formatPeriodLong(p.key, granularity), formatMoney(p.revenue), formatInteger(p.orders)]),
        }}
      >
        <Chart
          option={revenue}
          mode={mode}
          description={
            firstKey && lastKey
              ? `Line chart of revenue per ${granularity} from ${formatPeriodLong(firstKey, granularity)} to ${formatPeriodLong(lastKey, granularity)}.`
              : 'Line chart of revenue over time.'
          }
          className="h-72 sm:h-80"
        />
      </ChartCard>

      <ChartCard
        title="Orders by category"
        subtitle="Stacked by region"
        table={{
          caption: 'Orders per category, split by region.',
          columns: ['Category', ...REGIONS.map((r) => REGION_LABELS[r]), 'Total'],
          rows: stacks.map((s) => [CATEGORY_LABELS[s.category], ...REGIONS.map((r) => formatInteger(s.byRegion[r])), formatInteger(s.total)]),
        }}
      >
        <Chart
          option={category}
          mode={mode}
          description={`Horizontal bar chart of orders by category, each bar stacked by region. Largest: ${stacks[0] ? CATEGORY_LABELS[stacks[0].category] : 'none'} with ${formatInteger(stacks[0]?.total ?? 0)} orders.`}
          className="h-72"
        />
      </ChartCard>

      <ChartCard
        title="Revenue share by region"
        subtitle="Share of gross revenue"
        table={{
          caption: 'Revenue and share per region.',
          columns: ['Region', 'Revenue', 'Share'],
          rows: shares.map((s) => [REGION_LABELS[s.region], formatMoney(s.revenue), formatPercent(s.share)]),
        }}
      >
        <Chart
          option={region}
          mode={mode}
          description={`Donut chart of revenue share by region: ${shares.map((s) => `${REGION_LABELS[s.region]} ${formatPercent(s.share)}`).join(', ')}.`}
          className="h-72"
        />
      </ChartCard>

      <ChartCard
        className="lg:col-span-2"
        title="When orders arrive"
        subtitle="Orders by weekday and hour of day, in the customer's local time"
        table={{
          caption: 'Orders per weekday and hour.',
          columns: ['Weekday', ...Array.from({ length: 24 }, (_, hour) => formatHour(hour))],
          rows: WEEKDAY_LABELS.map((label, weekday) => [label, ...cells.filter((c) => c.weekday === weekday).map((c) => formatInteger(c.orders))]),
        }}
      >
        <Chart
          option={heatmap}
          mode={mode}
          description={
            busiest && busiest.orders > 0
              ? `Heatmap of orders by weekday and hour. Busiest: ${WEEKDAY_LABELS[busiest.weekday]} at ${formatHour(busiest.hour)} with ${formatInteger(busiest.orders)} orders.`
              : 'Heatmap of orders by weekday and hour.'
          }
          className="h-64 sm:h-72"
        />
      </ChartCard>
    </div>
  )
}
