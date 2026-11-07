import { CATEGORY_LABELS, REGION_LABELS, type Order } from './types'

// RFC 4180 CSV: comma separated, CRLF line ends, fields quoted only when they need it.
type Cell = string | number | boolean | null | undefined

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Serialises rows to CSV. Columns default to the keys of the first row, in order. */
export function toCsv<T extends { [K in keyof T]: Cell }>(rows: readonly T[], columns?: readonly (keyof T & string)[]): string {
  const cols = columns ?? (rows[0] ? (Object.keys(rows[0]) as (keyof T & string)[]) : [])
  const lines = [cols.map(escapeCell).join(',')]
  for (const row of rows) lines.push(cols.map((c) => escapeCell(row[c])).join(','))
  return lines.join('\r\n') + '\r\n'
}

const EXPORT_COLUMNS = ['id', 'date', 'hour', 'region', 'category', 'amount', 'refunded'] as const

/** The filtered orders as a spreadsheet-friendly CSV, with readable region and category names. */
export function ordersToCsv(orders: readonly Order[]): string {
  const rows = orders.map((o) => ({
    id: o.id,
    date: o.date,
    hour: o.hour,
    region: REGION_LABELS[o.region],
    category: CATEGORY_LABELS[o.category],
    amount: o.amount.toFixed(2),
    refunded: o.refunded ? 'yes' : 'no',
  }))
  return toCsv(rows, EXPORT_COLUMNS)
}

/** `pulseboard_2026-08-03_2026-10-31.csv` */
export const exportFilename = (from: string, to: string): string => `pulseboard_${from}_${to}.csv`
