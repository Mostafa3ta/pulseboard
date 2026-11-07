import { addDays, format, isValid, parseISO } from 'date-fns'
import { DATA_END, DATA_START } from '@/data/range'
import { isGranularity, rangeDays, type Granularity } from './periods'
import { CATEGORIES, REGIONS, isCategory, isRegion, type Category, type Order, type Region } from './types'

// The filter state is the URL. These functions are the only place that knows how it is
// spelled (`?from=…&to=…&region=na,eu&category=home&g=week`), so a shared link reproduces
// a view exactly and anything malformed falls back to a sensible default instead of breaking.

export interface Filters {
  /** First day included, ISO `yyyy-MM-dd`. */
  from: string
  /** Last day included, ISO `yyyy-MM-dd`. */
  to: string
  /** Empty means every region. */
  regions: Region[]
  /** Empty means every category. */
  categories: Category[]
  /** Chart bucket chosen by the user; null means "pick from the range length". */
  granularity: Granularity | null
}

export interface DateRange {
  from: string
  to: string
}

/** Presets count back from the dataset's last day, so "Last 30 days" means the last 30 days of data. */
export const PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: '12m', label: 'Last 12 months', days: 365 },
] as const
export type PresetId = (typeof PRESETS)[number]['id']
export const DEFAULT_PRESET: PresetId = '90d'

const toISO = (date: Date): string => format(date, 'yyyy-MM-dd')

export function presetRange(id: PresetId): DateRange {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0]
  const from = toISO(addDays(parseISO(DATA_END), -(preset.days - 1)))
  return { from: from < DATA_START ? DATA_START : from, to: DATA_END }
}

/** The preset whose range matches the filters exactly, if any. */
export function activePreset(range: DateRange): PresetId | null {
  return PRESETS.find((p) => {
    const r = presetRange(p.id)
    return r.from === range.from && r.to === range.to
  })?.id ?? null
}

export const DEFAULT_FILTERS: Filters = { ...presetRange(DEFAULT_PRESET), regions: [], categories: [], granularity: null }

/** A real calendar date written as `yyyy-MM-dd` (so `2026-02-30` and `2026-2-3` are both rejected). */
export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseISO(value)
  return isValid(date) && toISO(date) === value
}

const clampToData = (iso: string): string => (iso < DATA_START ? DATA_START : iso > DATA_END ? DATA_END : iso)

/** Reads filters from the URL. Anything invalid is ignored rather than failing the page. */
export function parseFilters(params: URLSearchParams): Filters {
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const range: DateRange =
    isISODate(from) && isISODate(to) && from <= to
      ? { from: clampToData(from), to: clampToData(to) }
      : { from: DEFAULT_FILTERS.from, to: DEFAULT_FILTERS.to }

  const listed = (key: string) => (params.get(key) ?? '').split(',').map((v) => v.trim()).filter(Boolean)
  const regions = REGIONS.filter((r) => listed('region').includes(r))
  const categories = CATEGORIES.filter((c) => listed('category').includes(c))
  const g = params.get('g') ?? ''

  return { ...range, regions, categories, granularity: isGranularity(g) ? g : null }
}

/** Writes filters to a query string (no leading `?`). Defaults are left out, so the default view is a bare URL. */
export function serializeFilters(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.from !== DEFAULT_FILTERS.from || filters.to !== DEFAULT_FILTERS.to) {
    params.set('from', filters.from)
    params.set('to', filters.to)
  }
  if (filters.regions.length) params.set('region', REGIONS.filter((r) => filters.regions.includes(r)).join(','))
  if (filters.categories.length) params.set('category', CATEGORIES.filter((c) => filters.categories.includes(c)).join(','))
  if (filters.granularity) params.set('g', filters.granularity)
  return params.toString()
}

/** Keeps the orders inside the date range and, when a dimension is narrowed, inside that choice. */
export function applyFilters(orders: readonly Order[], filters: Filters): Order[] {
  const regions = filters.regions.length ? new Set<Region>(filters.regions) : null
  const categories = filters.categories.length ? new Set<Category>(filters.categories) : null
  return orders.filter(
    (o) => o.date >= filters.from && o.date <= filters.to && (!regions || regions.has(o.region)) && (!categories || categories.has(o.category)),
  )
}

/** The range of equal length ending the day before `from`, or null when the data does not reach back that far. */
export function previousPeriod(range: DateRange): DateRange | null {
  const days = rangeDays(range.from, range.to)
  const to = addDays(parseISO(range.from), -1)
  const from = addDays(to, -(days - 1))
  if (toISO(from) < DATA_START) return null
  return { from: toISO(from), to: toISO(to) }
}

export const isDefaultFilters = (filters: Filters): boolean => serializeFilters(filters) === ''

export const isValidRegion = isRegion
export const isValidCategory = isCategory
