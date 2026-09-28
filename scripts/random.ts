/**
 * Small seeded pseudo-random generator (mulberry32), so generated fixtures
 * are identical on every run and CI can check they are up to date.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomDigits(random: () => number, count: number): string {
  let digits = ''
  for (let i = 0; i < count; i++) digits += Math.floor(random() * 10)
  return digits
}
