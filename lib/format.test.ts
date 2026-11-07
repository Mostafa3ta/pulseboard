import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatDelta,
  formatHour,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatPeriodLong,
  formatPeriodShort,
  formatRange,
} from './format'

describe('number formats', () => {
  it('rounds money to whole dollars and compacts large values', () => {
    expect(formatMoney(12345.67)).toBe('$12,346')
    expect(formatMoneyCompact(1_234_567)).toBe('$1.2M')
    expect(formatMoneyCompact(845_300)).toBe('$845.3K')
    expect(formatMoneyCompact(92)).toBe('$92')
    expect(formatCompact(12_340)).toBe('12.3K')
  })

  it('formats ratios as percentages and deltas with an explicit sign', () => {
    expect(formatPercent(0.0612)).toBe('6.1%')
    expect(formatDelta(0.042)).toBe('+4.2%')
    expect(formatDelta(-0.018)).toBe('−1.8%')
    expect(formatDelta(0)).toBe('0%')
    expect(formatDelta(null)).toBe('n/a')
  })
})

describe('date formats', () => {
  it('labels buckets by granularity', () => {
    expect(formatPeriodShort('2026-11-06', 'day')).toBe('6 Nov')
    expect(formatPeriodShort('2026-08-03', 'week')).toBe('3 Aug')
    expect(formatPeriodShort('2025-11', 'month')).toBe('Nov 25')
    expect(formatPeriodLong('2026-11-06', 'day')).toBe('Fri 6 Nov 2026')
    expect(formatPeriodLong('2026-08-03', 'week')).toBe('Week of 3 Aug 2026')
    expect(formatPeriodLong('2025-11', 'month')).toBe('November 2025')
  })

  it('writes a range with the year once when both ends share it', () => {
    expect(formatRange('2026-08-03', '2026-10-31')).toBe('3 Aug – 31 Oct 2026')
    expect(formatRange('2025-11-01', '2026-10-31')).toBe('1 Nov 2025 – 31 Oct 2026')
  })

  it('writes hours as 12-hour labels', () => {
    expect([0, 9, 12, 13, 23].map(formatHour)).toEqual(['12am', '9am', '12pm', '1pm', '11pm'])
  })
})
