import { describe, expect, it } from 'vitest'
import { computeKpis, delta, groupBy, heatmapCells, ordersByCategory, revenueByRegion, revenueSeries, sumBy } from './aggregate'
import type { Order } from './types'

const order = (overrides: Partial<Order>): Order => ({
  id: 'PB-1',
  date: '2026-10-01',
  hour: 12,
  region: 'na',
  category: 'apparel',
  amount: 50,
  refunded: false,
  ...overrides,
})

describe('sumBy and groupBy', () => {
  it('sum a projection and group by a key, keeping first-seen order', () => {
    const items = [{ k: 'b', v: 1 }, { k: 'a', v: 2 }, { k: 'b', v: 3 }]
    expect(sumBy(items, (i) => i.v)).toBe(6)
    expect(sumBy([], () => 1)).toBe(0)
    const groups = groupBy(items, (i) => i.k)
    expect([...groups.keys()]).toEqual(['b', 'a'])
    expect(groups.get('b')?.map((i) => i.v)).toEqual([1, 3])
  })
})

describe('delta', () => {
  it('is the relative change, and null when there is no previous value to compare with', () => {
    expect(delta(110, 100)).toBeCloseTo(0.1)
    expect(delta(80, 100)).toBeCloseTo(-0.2)
    expect(delta(5, 0)).toBeNull()
    expect(delta(5, null)).toBeNull()
  })
})

describe('computeKpis', () => {
  it('totals revenue, counts orders and rates refunds by count', () => {
    const kpis = computeKpis([
      order({ amount: 100 }),
      order({ amount: 50, refunded: true }),
      order({ amount: 30 }),
      order({ amount: 20, refunded: true }),
    ])
    expect(kpis).toEqual({ revenue: 200, orders: 4, averageOrder: 50, refundRate: 0.5 })
  })

  it('returns zeros, not NaN, for no orders', () => {
    expect(computeKpis([])).toEqual({ revenue: 0, orders: 0, averageOrder: 0, refundRate: 0 })
  })
})

describe('revenueSeries', () => {
  const orders = [
    order({ date: '2026-10-01', amount: 10 }),
    order({ date: '2026-10-01', amount: 15 }),
    order({ date: '2026-10-03', amount: 20 }),
    order({ date: '2026-10-09', amount: 40 }),
  ]

  it('fills every day in the range, including days with nothing sold', () => {
    const series = revenueSeries(orders, '2026-10-01', '2026-10-04', 'day')
    expect(series.map((p) => p.key)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(series.map((p) => p.revenue)).toEqual([25, 0, 20, 0])
    expect(series.map((p) => p.orders)).toEqual([2, 0, 1, 0])
  })

  it('buckets by ISO week and ignores orders outside the range', () => {
    const series = revenueSeries(orders, '2026-10-01', '2026-10-08', 'week')
    expect(series.map((p) => p.key)).toEqual(['2026-09-28', '2026-10-05'])
    expect(series.map((p) => p.revenue)).toEqual([45, 0])
  })
})

describe('ordersByCategory', () => {
  it('counts orders per category and region, largest category first, every category present', () => {
    const stacks = ordersByCategory([
      order({ category: 'home', region: 'eu' }),
      order({ category: 'home', region: 'na' }),
      order({ category: 'home', region: 'eu' }),
      order({ category: 'beauty', region: 'apac' }),
    ])
    expect(stacks.map((s) => s.category)).toEqual(['home', 'beauty', 'apparel', 'electronics'])
    expect(stacks[0]).toEqual({ category: 'home', byRegion: { na: 1, eu: 2, mea: 0, apac: 0 }, total: 3 })
    expect(stacks[3].total).toBe(0)
  })
})

describe('revenueByRegion', () => {
  it('keeps the fixed region order and shares that add up to one', () => {
    const shares = revenueByRegion([order({ region: 'eu', amount: 75 }), order({ region: 'na', amount: 25 })])
    expect(shares.map((s) => s.region)).toEqual(['na', 'eu', 'mea', 'apac'])
    expect(shares.map((s) => s.share)).toEqual([0.25, 0.75, 0, 0])
    expect(shares[1].revenue).toBe(75)
  })

  it('reports zero shares rather than NaN when there is no revenue', () => {
    expect(revenueByRegion([]).every((s) => s.share === 0 && s.revenue === 0)).toBe(true)
  })
})

describe('heatmapCells', () => {
  it('produces 7 × 24 zero-filled cells with Monday first', () => {
    const cells = heatmapCells([
      order({ date: '2026-10-05', hour: 9 }), // Monday
      order({ date: '2026-10-05', hour: 9 }),
      order({ date: '2026-10-11', hour: 23 }), // Sunday
    ])
    expect(cells).toHaveLength(168)
    expect(cells[0]).toEqual({ weekday: 0, hour: 0, orders: 0 })
    expect(cells.find((c) => c.weekday === 0 && c.hour === 9)?.orders).toBe(2)
    expect(cells.find((c) => c.weekday === 6 && c.hour === 23)?.orders).toBe(1)
    expect(sumBy(cells, (c) => c.orders)).toBe(3)
  })
})
