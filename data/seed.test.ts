import { describe, expect, it } from 'vitest'
import { isCategory, isRegion } from '@/lib/types'
import { DATA_END, DATA_START } from './range'
import { generateOrders, getOrders } from './seed'

describe('seed dataset', () => {
  const orders = getOrders()

  it('is generated once and reused', () => {
    expect(getOrders()).toBe(orders)
  })

  it('is deterministic: generating again gives the same orders', () => {
    const again = generateOrders()
    expect(again.length).toBe(orders.length)
    expect(again.slice(0, 20)).toEqual(orders.slice(0, 20))
    expect(again[again.length - 1]).toEqual(orders[orders.length - 1])
  })

  it('has roughly a year of daily orders, in date order, within the fixed range', () => {
    expect(orders.length).toBeGreaterThan(20_000)
    expect(orders.length).toBeLessThan(45_000)
    expect(orders[0].date).toBe(DATA_START)
    expect(orders[orders.length - 1].date).toBe(DATA_END)
    expect(orders.every((o, i) => i === 0 || o.date >= orders[i - 1].date)).toBe(true)
    expect(new Set(orders.map((o) => o.date)).size).toBe(365)
  })

  it('only contains known regions, categories, hours, positive whole-cent amounts and unique ids', () => {
    expect(orders.every((o) => isRegion(o.region) && isCategory(o.category))).toBe(true)
    expect(orders.every((o) => o.hour >= 0 && o.hour <= 23 && Number.isInteger(o.hour))).toBe(true)
    expect(orders.every((o) => o.amount >= 5 && Math.abs(o.amount * 100 - Math.round(o.amount * 100)) < 1e-6)).toBe(true)
    expect(new Set(orders.map((o) => o.id)).size).toBe(orders.length)
  })

  it('has a refund rate and category mix that look like retail, not noise', () => {
    const refunded = orders.filter((o) => o.refunded).length / orders.length
    expect(refunded).toBeGreaterThan(0.03)
    expect(refunded).toBeLessThan(0.1)
    const apparel = orders.filter((o) => o.category === 'apparel').length / orders.length
    const beauty = orders.filter((o) => o.category === 'beauty').length / orders.length
    expect(apparel).toBeGreaterThan(beauty)
  })
})
