/**
 * Deterministic pseudo-random number generator (Mulberry32)
 */
export class PRNG {
  private s: number;

  constructor(seed = 133742) {
    this.s = seed | 0;
  }

  // Returns float in [0, 1)
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns integer in [min, max] inclusive
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Returns true with given probability [0..1]
  chance(prob: number): boolean {
    return this.next() < prob;
  }
}
