import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const first = Array.from({ length: 5 }, () => a.next())
    const second = Array.from({ length: 5 }, () => b.next())
    expect(first).toEqual(second)
    expect(new Set(first).size).toBe(5)
  })

  it('produces a different sequence for a different seed', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it('keeps next() in [0, 1) and between() inside its bounds', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const n = rng.next()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
      const b = rng.between(10, 20)
      expect(b).toBeGreaterThanOrEqual(10)
      expect(b).toBeLessThan(20)
    }
  })

  it('never draws a zero-weight entry and favours heavier ones', () => {
    const rng = createRng(3)
    const counts = [0, 0, 0]
    for (let i = 0; i < 3000; i++) counts[rng.weighted([0, 1, 9])]++
    expect(counts[0]).toBe(0)
    expect(counts[2]).toBeGreaterThan(counts[1] * 5)
  })

  it('gaussian() centres on zero with a spread near one', () => {
    const rng = createRng(11)
    const samples = Array.from({ length: 5000 }, () => rng.gaussian())
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
    expect(Math.abs(mean)).toBeLessThan(0.05)
    expect(Math.sqrt(variance)).toBeGreaterThan(0.9)
    expect(Math.sqrt(variance)).toBeLessThan(1.1)
  })
})
