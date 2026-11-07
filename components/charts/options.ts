import type { DefaultLabelFormatterCallbackParams as CallbackParams, TooltipComponentFormatterCallbackParams as TooltipParams } from 'echarts'
import { WEEKDAY_LABELS, type CategoryStack, type HeatCell, type RegionShare, type SeriesPoint } from '@/lib/aggregate'
import { formatCompact, formatHour, formatInteger, formatMoney, formatMoneyCompact, formatPercent, formatPeriodLong, formatPeriodShort } from '@/lib/format'
import type { Granularity } from '@/lib/periods'
import { CATEGORY_LABELS, REGIONS, REGION_LABELS } from '@/lib/types'
import type { ChartOption } from './chart-option'
import { CHROME, SEQUENTIAL, SERIES, tooltipHtml, type ChartMode } from './chart-theme'

// Pure functions from aggregated data to ECharts options. No React, no DOM, so they can be
// unit-tested and the <Chart> wrapper stays small.

export interface BuildContext {
  mode: ChartMode
  /** Narrow screens: fewer axis labels, legend below the chart, thinner gaps. */
  compact: boolean
}

const first = (params: TooltipParams): CallbackParams | undefined => (Array.isArray(params) ? params[0] : params)

/** Revenue per bucket as a single ink line with a soft area and a range slider underneath. */
export function revenueOption(points: readonly SeriesPoint[], granularity: Granularity, { mode, compact }: BuildContext): ChartOption {
  const c = CHROME[mode]
  return {
    grid: { left: 8, right: 16, top: 16, bottom: 60, containLabel: true },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'line', lineStyle: { color: c.axis, width: 1 } },
      formatter: (params: TooltipParams) => {
        const point = points[first(params)?.dataIndex ?? -1]
        if (!point) return ''
        return tooltipHtml(formatPeriodLong(point.key, granularity), [
          { label: 'Revenue', value: formatMoney(point.revenue), swatch: c.ink },
          { label: 'Orders', value: formatInteger(point.orders) },
        ])
      },
    },
    xAxis: {
      type: 'category',
      data: points.map((p) => p.key),
      boundaryGap: false,
      axisLabel: { formatter: (value: string | number) => formatPeriodShort(String(value), granularity), hideOverlap: true, margin: 12 },
    },
    yAxis: {
      type: 'value',
      splitNumber: compact ? 3 : 4,
      axisLine: { show: false },
      axisLabel: { formatter: (value: string | number) => formatMoneyCompact(Number(value)) },
    },
    dataZoom: [{ type: 'slider', height: 20, bottom: 8, left: 48, right: 16, brushSelect: false, showDetail: false, handleSize: '90%' }],
    series: [
      {
        type: 'line',
        name: 'Revenue',
        data: points.map((p) => Math.round(p.revenue)),
        color: c.ink,
        lineStyle: { width: 2, cap: 'round', join: 'round' },
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: c.ink, borderColor: c.surface, borderWidth: 2 },
        areaStyle: { color: c.ink, opacity: 0.06 },
        emphasis: { focus: 'none', scale: true },
      },
    ],
  }
}

/** Orders per category as horizontal bars, each stacked by region in the fixed region order. */
export function categoryOption(stacks: readonly CategoryStack[], { mode, compact }: BuildContext): ChartOption {
  const c = CHROME[mode]
  // Only the outermost non-empty segment of each bar gets the rounded data-end.
  const lastVisible = stacks.map((s) => REGIONS.reduce((last, r, i) => (s.byRegion[r] > 0 ? i : last), -1))
  return {
    grid: { left: 8, right: 24, top: 8, bottom: compact ? 64 : 44, containLabel: true },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: compact ? 10 : 16,
      data: REGIONS.map((r) => REGION_LABELS[r]),
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: c.ink, opacity: 0.05 } },
      formatter: (params: TooltipParams) => {
        const stack = stacks[first(params)?.dataIndex ?? -1]
        if (!stack) return ''
        return tooltipHtml(
          `${CATEGORY_LABELS[stack.category]} · ${formatInteger(stack.total)} orders`,
          REGIONS.map((r, i) => ({ swatch: SERIES[mode][i], label: REGION_LABELS[r], value: formatInteger(stack.byRegion[r]) })),
        )
      },
    },
    xAxis: {
      type: 'value',
      splitNumber: compact ? 3 : 4,
      axisLine: { show: false },
      axisLabel: { formatter: (value: string | number) => formatCompact(Number(value)) },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: stacks.map((s) => CATEGORY_LABELS[s.category]),
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: c.ink, fontSize: 12 },
    },
    series: REGIONS.map((region, i) => ({
      type: 'bar' as const,
      name: REGION_LABELS[region],
      stack: 'orders',
      barMaxWidth: 24,
      barCategoryGap: '45%',
      itemStyle: { borderColor: c.surface, borderWidth: 1 },
      emphasis: { focus: 'series' as const },
      data: stacks.map((s, row) => ({
        value: s.byRegion[region],
        itemStyle: lastVisible[row] === i ? { borderRadius: [0, 4, 4, 0] } : undefined,
      })),
    })),
  }
}

/** Revenue share per region as a donut with percentage labels; regions keep their colour and order. */
export function regionOption(shares: readonly RegionShare[], { mode, compact }: BuildContext): ChartOption {
  const c = CHROME[mode]
  return {
    legend: compact
      ? { orient: 'horizontal', bottom: 0, left: 'center', icon: 'circle', itemWidth: 10, itemHeight: 10, itemGap: 10 }
      : { orient: 'vertical', right: 0, top: 'middle', icon: 'circle', itemWidth: 10, itemHeight: 10, itemGap: 12 },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params: TooltipParams) => {
        const p = first(params)
        if (!p) return ''
        return tooltipHtml(String(p.name), [
          { label: 'Revenue', value: formatMoney(Number(p.value)), swatch: String(p.color) },
          { label: 'Share', value: formatPercent((p.percent ?? 0) / 100) },
        ])
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Revenue share',
        radius: compact ? ['40%', '60%'] : ['54%', '78%'],
        center: compact ? ['50%', '38%'] : ['36%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 1.5,
        percentPrecision: 1,
        minShowLabelAngle: 6,
        itemStyle: { borderRadius: 4, borderColor: c.surface, borderWidth: 2 },
        label: { show: true, color: c.ink, fontSize: 12, formatter: '{d}%' },
        labelLine: { lineStyle: { color: c.axis }, length: 10, length2: 8 },
        emphasis: { scaleSize: 4, label: { fontWeight: 'bold' } },
        data: shares.map((s, i) => ({ name: REGION_LABELS[s.region], value: Math.round(s.revenue), itemStyle: { color: SERIES[mode][i] } })),
      },
    ],
  }
}

/** Orders per weekday and hour as a one-hue heatmap with a continuous colour scale underneath. */
export function heatmapOption(cells: readonly HeatCell[], { mode, compact }: BuildContext): ChartOption {
  const c = CHROME[mode]
  const max = Math.max(1, ...cells.map((cell) => cell.orders))
  return {
    grid: { left: 8, right: 8, top: 8, bottom: 56, containLabel: true },
    tooltip: {
      position: 'top',
      confine: true,
      formatter: (params: TooltipParams) => {
        const value = first(params)?.value
        if (!Array.isArray(value)) return ''
        const [hour, weekday, orders] = value as [number, number, number]
        return tooltipHtml(`${WEEKDAY_LABELS[weekday]} · ${formatHour(hour)}`, [{ label: 'Orders', value: formatInteger(orders) }])
      },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, hour) => formatHour(hour)),
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { interval: compact ? 5 : 2, margin: 10 },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: [...WEEKDAY_LABELS],
      axisLine: { show: false },
      splitLine: { show: false },
      axisLabel: { color: c.ink, fontSize: 12 },
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 10,
      itemHeight: compact ? 100 : 140,
      text: ['More orders', 'Fewer'],
      textGap: 8,
      inRange: { color: [...SEQUENTIAL[mode]] },
    },
    series: [
      {
        type: 'heatmap',
        name: 'Orders',
        data: cells.map((cell) => [cell.hour, cell.weekday, cell.orders]),
        itemStyle: { borderColor: c.surface, borderWidth: compact ? 1 : 2, borderRadius: 2 },
        emphasis: { itemStyle: { borderColor: c.ink, borderWidth: 2 } },
        progressive: 0,
      },
    ],
  }
}
