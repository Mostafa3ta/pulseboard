import { format, parseISO } from 'date-fns'
import type { Granularity } from './periods'

// One place for every number and date the UI shows, so tiles, tooltips, tables and the CSV agree.

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const moneyExact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const moneyCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en-US')
const integerCompact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const signedPercent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })

/** $12,345 */
export const formatMoney = (value: number): string => money.format(value)
/** $12,345.67 */
export const formatMoneyExact = (value: number): string => moneyExact.format(value)
/** $1.2M, $845K, $92 */
export const formatMoneyCompact = (value: number): string => moneyCompact.format(value)
/** 12,345 */
export const formatInteger = (value: number): string => integer.format(value)
/** 12.3K */
export const formatCompact = (value: number): string => integerCompact.format(value)
/** 0.0612 → 6.1% */
export const formatPercent = (ratio: number): string => percent.format(ratio)

/** +4.2%, −1.8%, 0% or "n/a" when there is nothing to compare against. Uses a real minus sign. */
export const formatDelta = (ratio: number | null): string => (ratio === null ? 'n/a' : signedPercent.format(ratio).replace('-', '−'))

/** 2026-11-06 → 6 Nov 2026 */
export const formatDate = (isoDate: string): string => format(parseISO(isoDate), 'd MMM yyyy')
/** 2026-11-06 → 6 Nov */
export const formatDateShort = (isoDate: string): string => format(parseISO(isoDate), 'd MMM')
/** 2026-08-03 → 2026-10-31 as "3 Aug – 31 Oct 2026" (year once when it is the same). */
export function formatRange(from: string, to: string): string {
  const a = parseISO(from)
  const b = parseISO(to)
  return a.getFullYear() === b.getFullYear() ? `${format(a, 'd MMM')} – ${format(b, 'd MMM yyyy')}` : `${formatDate(from)} – ${formatDate(to)}`
}

/** Short axis label for a bucket key: 6 Nov · 3 Aug · Nov 25. */
export function formatPeriodShort(key: string, granularity: Granularity): string {
  if (granularity === 'month') return format(parseISO(`${key}-01`), 'MMM yy')
  return format(parseISO(key), 'd MMM')
}

/** Tooltip label for a bucket key: Fri 6 Nov 2026 · Week of 3 Aug 2026 · November 2025. */
export function formatPeriodLong(key: string, granularity: Granularity): string {
  if (granularity === 'month') return format(parseISO(`${key}-01`), 'MMMM yyyy')
  if (granularity === 'week') return `Week of ${format(parseISO(key), 'd MMM yyyy')}`
  return format(parseISO(key), 'EEE d MMM yyyy')
}

/** 0 → 12am, 13 → 1pm */
export const formatHour = (hour: number): string => (hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`)
