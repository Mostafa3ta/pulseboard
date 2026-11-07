/**
 * mulberry32: a small, fast, seedable pseudo-random generator.
 * The same seed produces the same sequence on every machine, which is what makes
 * the demo dataset identical for every visitor and every test run.
 */
export function createRng(seed: number) {
  let state = seed >>> 0

  /** Uniform in [0, 1). */
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    /** Uniform in [min, max). */
    between: (min: number, max: number): number => min + next() * (max - min),
    /** Index drawn with probability proportional to its weight; zero-weight entries are never drawn. */
    weighted: (weights: readonly number[]): number => {
      const total = weights.reduce((sum, w) => sum + w, 0)
      let r = next() * total
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]
        if (r < 0) return i
      }
      return weights.length - 1
    },
    /** Roughly normal with mean 0 and standard deviation 1 (sum of four uniforms, rescaled). */
    gaussian: (): number => (next() + next() + next() + next() - 2) * Math.sqrt(3),
  }
}

export type Rng = ReturnType<typeof createRng>
