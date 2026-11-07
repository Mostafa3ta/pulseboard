import { getISODay, parseISO } from 'date-fns'
import { periodKey, periodKeys, type Granularity } from './periods'
import { CATEGORIES, REGIONS, type Category, type Order, type Region } from './types'

// Every number on the dashboard comes from one of these pure functions. They take the
// already-filtered orders and return plain arrays, so the charts only have to draw.

export interface Kpis {
  /** Gross sales: the value of every order, refunded or not. */
  revenue: number
  orders: number
  averageOrder: number
  /** Share of orders that were refunded, 0–1. */
  refundRate: number
}

export interface SeriesPoint {
  /** Bucket key from `periodKey`. */
  key: string
  revenue: number
  orders: number
}

export interface CategoryStack {
  category: Category
  byRegion: Record<Region, number>
  total: number
}

export interface RegionShare {
  region: Region
  revenue: number
  /** Share of the total revenue, 0–1; 0 when there is no revenue at all. */
  share: number
}

export interface HeatCell {
  /** 0 = Monday … 6 = Sunday. */
  weekday: number
  hour: number
  orders: number
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function sumBy<T>(items: readonly T[], value: (item: T) => number): number {
  let total = 0
  for (const item of items) total += value(item)
  return total
}

export function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const group = groups.get(k)
    if (group) group.push(item)
    else groups.set(k, [item])
  }
  return groups
}

/** Relative change from `previous` to `current`, or null when there is nothing to compare against. */
export function delta(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null
  return (current - previous) / previous
}

export function computeKpis(orders: readonly Order[]): Kpis {
  let revenue = 0
  let refunded = 0
  for (const o of orders) {
    revenue += o.amount
    if (o.refunded) refunded++
  }
  const count = orders.length
  return {
    revenue,
    orders: count,
    averageOrder: count ? revenue / count : 0,
    refundRate: count ? refunded / count : 0,
  }
}

/** Revenue and order count per bucket across the whole range, with zeros where nothing was sold. */
export function revenueSeries(orders: readonly Order[], from: string, to: string, granularity: Granularity): SeriesPoint[] {
  const points = new Map<string, SeriesPoint>()
  for (const key of periodKeys(from, to, granularity)) points.set(key, { key, revenue: 0, orders: 0 })
  const keyOf = new Map<string, string>()
  for (const o of orders) {
    if (o.date < from || o.date > to) continue
    let key = keyOf.get(o.date)
    if (key === undefined) {
      key = periodKey(o.date, granularity)
      keyOf.set(o.date, key)
    }
    const point = points.get(key)
    if (!point) continue
    point.revenue += o.amount
    point.orders++
  }
  return [...points.values()]
}

/** Orders per category, split by region, largest category first. Every category is present even at zero. */
export function ordersByCategory(orders: readonly Order[]): CategoryStack[] {
  const stacks = new Map<Category, CategoryStack>()
  for (const category of CATEGORIES) {
    const byRegion = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>
    stacks.set(category, { category, byRegion, total: 0 })
  }
  for (const o of orders) {
    const stack = stacks.get(o.category)!
    stack.byRegion[o.region]++
    stack.total++
  }
  return [...stacks.values()].sort((a, b) => b.total - a.total || CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category))
}

/** Revenue per region in the fixed region order, so each region keeps its colour and its place. */
export function revenueByRegion(orders: readonly Order[]): RegionShare[] {
  const revenue = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>
  for (const o of orders) revenue[o.region] += o.amount
  const total = sumBy(REGIONS, (r) => revenue[r])
  return REGIONS.map((region) => ({ region, revenue: revenue[region], share: total ? revenue[region] / total : 0 }))
}

/** Order counts for every weekday × hour cell (7 × 24, zero-filled), Monday first. */
export function heatmapCells(orders: readonly Order[]): HeatCell[] {
  const counts = Array.from({ length: 7 }, () => new Array<number>(24).fill(0))
  const weekdayOf = new Map<string, number>()
  for (const o of orders) {
    let weekday = weekdayOf.get(o.date)
    if (weekday === undefined) {
      weekday = getISODay(parseISO(o.date)) - 1
      weekdayOf.set(o.date, weekday)
    }
    counts[weekday][o.hour]++
  }
  const cells: HeatCell[] = []
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) cells.push({ weekday, hour, orders: counts[weekday][hour] })
  }
  return cells
}
