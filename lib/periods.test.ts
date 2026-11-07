import { describe, expect, it } from 'vitest'
import { periodKey, periodKeys, pickGranularity, rangeDays } from './periods'

describe('periodKey', () => {
  it('keys a day by itself, a week by its Monday and a month by yyyy-MM', () => {
    expect(periodKey('2026-08-05', 'day')).toBe('2026-08-05')
    expect(periodKey('2026-08-05', 'week')).toBe('2026-08-03') // Wednesday → Monday
    expect(periodKey('2026-08-02', 'week')).toBe('2026-07-27') // Sunday belongs to the week before
    expect(periodKey('2026-08-05', 'month')).toBe('2026-08')
  })
})

describe('periodKeys', () => {
  it('lists every day in a daily range', () => {
    expect(periodKeys('2026-02-26', '2026-03-02', 'day')).toEqual(['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'])
  })

  it('lists partial edge weeks and months once each', () => {
    expect(periodKeys('2026-08-05', '2026-08-18', 'week')).toEqual(['2026-08-03', '2026-08-10', '2026-08-17'])
    expect(periodKeys('2025-11-15', '2026-01-02', 'month')).toEqual(['2025-11', '2025-12', '2026-01'])
  })

  it('returns a single bucket when from equals to', () => {
    expect(periodKeys('2026-05-01', '2026-05-01', 'week')).toEqual(['2026-04-27'])
  })
})

describe('rangeDays and pickGranularity', () => {
  it('counts both ends and crosses the daylight-saving change without drift', () => {
    expect(rangeDays('2026-03-01', '2026-03-01')).toBe(1)
    expect(rangeDays('2026-03-25', '2026-04-05')).toBe(12)
    expect(rangeDays('2025-11-01', '2026-10-31')).toBe(365)
  })

  it('goes daily up to about a quarter and weekly beyond', () => {
    expect(pickGranularity('2026-10-25', '2026-10-31')).toBe('day')
    expect(pickGranularity('2026-08-02', '2026-10-31')).toBe('day') // 91 days
    expect(pickGranularity('2026-07-01', '2026-10-31')).toBe('week')
    expect(pickGranularity('2025-11-01', '2026-10-31')).toBe('week')
  })
})
