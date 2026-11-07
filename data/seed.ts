import { addDays, differenceInCalendarDays, format, getDay, parseISO } from 'date-fns'
import { createRng } from '@/lib/rng'
import { CATEGORIES, REGIONS, type Category, type Order, type Region } from '@/lib/types'
import { DATA_END, DATA_START } from './range'

// A year of online retail orders, generated from a fixed seed so the numbers are the same
// for every visitor. The shape is deliberate: regions and categories of different sizes,
// a holiday peak with steady growth, quiet Sundays, lunchtime and evening buying, and
// refund rates that differ by category. Nothing here is real data.

const SEED = 20261107
const BASE_ORDERS_PER_DAY = 78

/** Relative demand per region and per category (weights, not percentages). */
const REGION_WEIGHTS: Record<Region, number> = { na: 38, eu: 32, mea: 11, apac: 19 }
const CATEGORY_WEIGHTS: Record<Category, number> = { apparel: 34, electronics: 21, home: 27, beauty: 18 }

/** Typical order value per category in USD, and how widely it varies (log-normal spread). */
const AMOUNT: Record<Category, { typical: number; spread: number }> = {
  apparel: { typical: 68, spread: 0.45 },
  electronics: { typical: 210, spread: 0.6 },
  home: { typical: 115, spread: 0.5 },
  beauty: { typical: 42, spread: 0.4 },
}

const REFUND_RATE: Record<Category, number> = { apparel: 0.085, electronics: 0.06, home: 0.04, beauty: 0.025 }

/** Demand per weekday, Sunday first as in `getDay`: quiet Sundays, busy Fridays and Saturdays. */
const WEEKDAY_FACTOR = [0.72, 0.95, 1.0, 1.02, 1.05, 1.18, 1.08]

/** Relative volume per hour of the day: a lunchtime peak, a bigger evening one, little overnight. */
const HOUR_WEIGHTS = [1, 0.6, 0.4, 0.3, 0.3, 0.5, 1.2, 2.5, 4, 5, 5.5, 6, 7, 6.5, 5.5, 5, 5.2, 5.8, 6.5, 7.5, 7, 5.5, 3.5, 2]

/** Seasonality and growth: a peak around December, a trough around June, and +22% over the year. */
function demandFactor(dayIndex: number, totalDays: number, date: Date): number {
  const growth = 1 + 0.22 * (dayIndex / totalDays)
  const season = 1 + 0.28 * Math.cos(((date.getMonth() - 11) / 12) * 2 * Math.PI)
  return growth * season * WEEKDAY_FACTOR[getDay(date)]
}

/** Builds the whole dataset from the seed. Exported for tests; the app uses `getOrders`. */
export function generateOrders(): Order[] {
  const rng = createRng(SEED)
  const regionWeights = REGIONS.map((r) => REGION_WEIGHTS[r])
  const categoryWeights = CATEGORIES.map((c) => CATEGORY_WEIGHTS[c])
  const start = parseISO(DATA_START)
  const totalDays = differenceInCalendarDays(parseISO(DATA_END), start) + 1
  const orders: Order[] = []
  let serial = 100000

  for (let day = 0; day < totalDays; day++) {
    const date = addDays(start, day)
    const iso = format(date, 'yyyy-MM-dd')
    const count = Math.round(BASE_ORDERS_PER_DAY * demandFactor(day, totalDays, date) * rng.between(0.85, 1.15))

    for (let n = 0; n < count; n++) {
      const region = REGIONS[rng.weighted(regionWeights)]
      const category = CATEGORIES[rng.weighted(categoryWeights)]
      const { typical, spread } = AMOUNT[category]
      const raw = typical * Math.exp(spread * rng.gaussian() - (spread * spread) / 2)
      orders.push({
        id: `PB-${++serial}`,
        date: iso,
        hour: rng.weighted(HOUR_WEIGHTS),
        region,
        category,
        amount: Math.round(Math.max(5, raw) * 100) / 100,
        refunded: rng.next() < REFUND_RATE[category],
      })
    }
  }
  return orders
}

let cache: Order[] | null = null

/** The seeded dataset, generated once per page load: about 30k orders over twelve months. */
export function getOrders(): Order[] {
  cache ??= generateOrders()
  return cache
}
