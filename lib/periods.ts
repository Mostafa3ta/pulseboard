import { addDays, format, parseISO, startOfISOWeek } from 'date-fns'

/** How the time axis is bucketed. */
export type Granularity = 'day' | 'week' | 'month'
export const GRANULARITIES: readonly Granularity[] = ['day', 'week', 'month']
export const isGranularity = (value: string): value is Granularity => (GRANULARITIES as readonly string[]).includes(value)

const toISO = (date: Date): string => format(date, 'yyyy-MM-dd')

/** The bucket a date falls in: the day itself, the Monday of its ISO week, or its month (`yyyy-MM`). */
export function periodKey(isoDate: string, granularity: Granularity): string {
  if (granularity === 'day') return isoDate
  const date = parseISO(isoDate)
  return granularity === 'week' ? toISO(startOfISOWeek(date)) : format(date, 'yyyy-MM')
}

/** Every bucket between `from` and `to` inclusive, in order, so a chart still has a point for a quiet week. */
export function periodKeys(from: string, to: string, granularity: Granularity): string[] {
  const keys: string[] = []
  const end = parseISO(to)
  for (let cursor = parseISO(from); cursor <= end; cursor = addDays(cursor, 1)) {
    const key = periodKey(toISO(cursor), granularity)
    if (keys[keys.length - 1] !== key) keys.push(key)
  }
  return keys
}

/** Days from `from` to `to`, both included. */
export function rangeDays(from: string, to: string): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000) + 1
}

/** A sensible default bucket for a range: daily up to about three months, weekly beyond that. */
export function pickGranularity(from: string, to: string): Granularity {
  return rangeDays(from, to) <= 92 ? 'day' : 'week'
}
