import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  activePreset,
  applyFilters,
  isISODate,
  parseFilters,
  presetRange,
  previousPeriod,
  serializeFilters,
  type Filters,
} from './filters'
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

describe('presets', () => {
  it('count back from the last day of data, both ends included', () => {
    expect(presetRange('7d')).toEqual({ from: '2026-10-25', to: '2026-10-31' })
    expect(presetRange('30d')).toEqual({ from: '2026-10-02', to: '2026-10-31' })
    expect(presetRange('90d')).toEqual({ from: '2026-08-03', to: '2026-10-31' })
    expect(presetRange('12m')).toEqual({ from: '2025-11-01', to: '2026-10-31' })
  })

  it('recognise an active preset only on an exact match', () => {
    expect(activePreset({ from: '2026-08-03', to: '2026-10-31' })).toBe('90d')
    expect(activePreset({ from: '2026-08-04', to: '2026-10-31' })).toBeNull()
  })

  it('default to the last 90 days with nothing else narrowed', () => {
    expect(DEFAULT_FILTERS).toEqual({ from: '2026-08-03', to: '2026-10-31', regions: [], categories: [], granularity: null })
  })
})

describe('isISODate', () => {
  it('accepts real yyyy-MM-dd dates only', () => {
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-2-3')).toBe(false)
    expect(isISODate('yesterday')).toBe(false)
  })
})

describe('parseFilters', () => {
  it('reads a complete, valid query', () => {
    const f = parseFilters(new URLSearchParams('from=2026-01-01&to=2026-03-31&region=eu,na&category=home&g=week'))
    expect(f).toEqual({ from: '2026-01-01', to: '2026-03-31', regions: ['na', 'eu'], categories: ['home'], granularity: 'week' })
  })

  it('falls back to the default range when dates are missing, malformed or reversed', () => {
    const def = { from: DEFAULT_FILTERS.from, to: DEFAULT_FILTERS.to }
    expect(parseFilters(new URLSearchParams(''))).toMatchObject(def)
    expect(parseFilters(new URLSearchParams('from=2026-01-01'))).toMatchObject(def)
    expect(parseFilters(new URLSearchParams('from=soon&to=later'))).toMatchObject(def)
    expect(parseFilters(new URLSearchParams('from=2026-03-01&to=2026-01-01'))).toMatchObject(def)
  })

  it('clamps dates to the data range and drops unknown regions, categories and granularities', () => {
    const f = parseFilters(new URLSearchParams('from=2020-01-01&to=2030-01-01&region=mars,eu&category=toys&g=hourly'))
    expect(f).toEqual({ from: '2025-11-01', to: '2026-10-31', regions: ['eu'], categories: [], granularity: null })
  })
})

describe('serializeFilters', () => {
  it('writes an empty string for the defaults and round-trips everything else', () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe('')
    const filters: Filters = { from: '2026-01-01', to: '2026-03-31', regions: ['eu', 'na'], categories: ['home'], granularity: 'month' }
    const query = serializeFilters(filters)
    expect(query).toBe('from=2026-01-01&to=2026-03-31&region=na%2Ceu&category=home&g=month')
    expect(parseFilters(new URLSearchParams(query))).toEqual({ ...filters, regions: ['na', 'eu'] })
  })

  it('omits the dates when only a dimension is narrowed on the default range', () => {
    expect(serializeFilters({ ...DEFAULT_FILTERS, regions: ['apac'] })).toBe('region=apac')
  })
})

describe('applyFilters', () => {
  const orders = [
    order({ id: 'a', date: '2026-09-30', region: 'na', category: 'apparel' }),
    order({ id: 'b', date: '2026-10-01', region: 'eu', category: 'home' }),
    order({ id: 'c', date: '2026-10-15', region: 'eu', category: 'apparel' }),
    order({ id: 'd', date: '2026-10-31', region: 'apac', category: 'beauty' }),
    order({ id: 'e', date: '2026-11-01', region: 'apac', category: 'beauty' }),
  ]
  const ids = (list: Order[]) => list.map((o) => o.id)

  it('keeps orders inside the date range, both ends included', () => {
    expect(ids(applyFilters(orders, { ...DEFAULT_FILTERS, from: '2026-10-01', to: '2026-10-31' }))).toEqual(['b', 'c', 'd'])
  })

  it('narrows by region and category together, treating an empty list as "all"', () => {
    const base = { ...DEFAULT_FILTERS, from: '2026-09-01', to: '2026-10-31' }
    expect(ids(applyFilters(orders, { ...base, regions: ['eu'] }))).toEqual(['b', 'c'])
    expect(ids(applyFilters(orders, { ...base, regions: ['eu'], categories: ['apparel'] }))).toEqual(['c'])
    expect(ids(applyFilters(orders, { ...base, categories: ['beauty', 'home'] }))).toEqual(['b', 'd'])
  })
})

describe('previousPeriod', () => {
  it('is the same number of days ending the day before', () => {
    expect(previousPeriod({ from: '2026-10-01', to: '2026-10-31' })).toEqual({ from: '2026-08-31', to: '2026-09-30' })
    expect(previousPeriod({ from: '2026-10-25', to: '2026-10-31' })).toEqual({ from: '2026-10-18', to: '2026-10-24' })
  })

  it('is null when the data does not reach back a full period', () => {
    expect(previousPeriod({ from: '2025-11-01', to: '2026-10-31' })).toBeNull()
    expect(previousPeriod({ from: '2025-11-10', to: '2025-11-20' })).toBeNull()
    expect(previousPeriod({ from: '2025-11-11', to: '2025-11-20' })).toEqual({ from: '2025-11-01', to: '2025-11-10' })
  })
})
