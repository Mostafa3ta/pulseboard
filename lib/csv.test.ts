import { describe, expect, it } from 'vitest'
import { exportFilename, ordersToCsv, toCsv } from './csv'

describe('toCsv', () => {
  it('writes a header row and one line per record, CRLF terminated', () => {
    const csv = toCsv([{ month: '2026-01', orders: 361 }, { month: '2026-02', orders: 388 }])
    expect(csv).toBe('month,orders\r\n2026-01,361\r\n2026-02,388\r\n')
  })

  it('quotes fields containing commas, quotes or line breaks, doubling inner quotes', () => {
    const csv = toCsv([{ name: 'Nour, Lina', note: 'said "hi"', multi: 'a\nb' }])
    expect(csv).toBe('name,note,multi\r\n"Nour, Lina","said ""hi""","a\nb"\r\n')
  })

  it('writes empty cells for null and undefined', () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toBe('a,b,c\r\n,,0\r\n')
  })

  it('respects an explicit column order and subset', () => {
    expect(toCsv([{ a: 1, b: 2, c: 3 }], ['c', 'a'])).toBe('c,a\r\n3,1\r\n')
  })

  it('writes just the header, or an empty line, for no rows', () => {
    expect(toCsv([], ['a', 'b'])).toBe('a,b\r\n')
    expect(toCsv([])).toBe('\r\n')
  })
})

describe('ordersToCsv', () => {
  it('writes readable names, two-decimal amounts and yes/no refunds', () => {
    const csv = ordersToCsv([
      { id: 'PB-100001', date: '2026-10-01', hour: 9, region: 'mea', category: 'home', amount: 115.5, refunded: true },
    ])
    expect(csv).toBe('id,date,hour,region,category,amount,refunded\r\nPB-100001,2026-10-01,9,Middle East & Africa,Home & Living,115.50,yes\r\n')
  })

  it('names the file after the range', () => {
    expect(exportFilename('2026-08-03', '2026-10-31')).toBe('pulseboard_2026-08-03_2026-10-31.csv')
  })
})
