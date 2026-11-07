import { describe, expect, it } from 'vitest'
import { heatmapCells, ordersByCategory, revenueByRegion, revenueSeries } from '@/lib/aggregate'
import type { Order } from '@/lib/types'
import { categoryOption, heatmapOption, regionOption, revenueOption } from './options'
import { SERIES } from './chart-theme'

const order = (overrides: Partial<Order>): Order => ({
  id: 'PB-1',
  date: '2026-10-05',
  hour: 12,
  region: 'na',
  category: 'apparel',
  amount: 50,
  refunded: false,
  ...overrides,
})
const orders = [order({}), order({ region: 'eu', category: 'home', amount: 80, date: '2026-10-06', hour: 20 }), order({ region: 'eu', amount: 20 })]
const ctx = { mode: 'light' as const, compact: false }

describe('chart options', () => {
  it('revenue: one point per bucket, a slider zoom, and a tooltip that names the period', () => {
    const series = revenueSeries(orders, '2026-10-05', '2026-10-07', 'day')
    const option = revenueOption(series, 'day', ctx)
    const line = (option.series as { data: number[] }[])[0]
    expect(line.data).toEqual([70, 80, 0])
    expect((option.xAxis as { data: string[] }).data).toHaveLength(3)
    expect(Array.isArray(option.dataZoom) && option.dataZoom[0].type).toBe('slider')
    const formatter = (option.tooltip as { formatter: (p: unknown) => string }).formatter
    expect(formatter([{ dataIndex: 1 }])).toContain('Tue 6 Oct 2026')
    expect(formatter([{ dataIndex: 1 }])).toContain('$80')
  })

  it('category: four stacked bar series in region order, with the outer segment rounded', () => {
    const option = categoryOption(ordersByCategory(orders), ctx)
    const bars = option.series as { name: string; stack: string; data: { value: number; itemStyle?: { borderRadius: number[] } }[] }[]
    expect(bars.map((b) => b.name)).toEqual(['North America', 'Europe', 'Middle East & Africa', 'Asia-Pacific'])
    expect(bars.every((b) => b.stack === 'orders')).toBe(true)
    // Apparel (row 0): 1 NA + 1 EU, so Europe is the outer segment; Home (row 1): only Europe.
    expect(bars[0].data[0].itemStyle).toBeUndefined()
    expect(bars[1].data[0].itemStyle?.borderRadius).toEqual([0, 4, 4, 0])
    expect(bars[1].data[1].itemStyle?.borderRadius).toEqual([0, 4, 4, 0])
  })

  it('region: a donut whose slices carry the fixed series colours and the region names', () => {
    const option = regionOption(revenueByRegion(orders), { mode: 'dark', compact: true })
    const pie = (option.series as { type: string; data: { name: string; value: number; itemStyle: { color: string } }[] }[])[0]
    expect(pie.type).toBe('pie')
    expect(pie.data.map((d) => d.name)).toEqual(['North America', 'Europe', 'Middle East & Africa', 'Asia-Pacific'])
    expect(pie.data.map((d) => d.value)).toEqual([50, 100, 0, 0])
    expect(pie.data.map((d) => d.itemStyle.color)).toEqual([...SERIES.dark])
  })

  it('heatmap: 168 cells, a one-hue scale topped at the busiest cell', () => {
    const option = heatmapOption(heatmapCells(orders), ctx)
    const heat = (option.series as { data: number[][] }[])[0]
    expect(heat.data).toHaveLength(168)
    expect(heat.data.find(([hour, weekday]) => hour === 12 && weekday === 0)?.[2]).toBe(2)
    const visualMap = option.visualMap as { max: number; inRange: { color: string[] } }
    expect(visualMap.max).toBe(2)
    expect(visualMap.inRange.color).toHaveLength(5)
  })
})
