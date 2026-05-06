import type { RngState } from '../model/types';

function xmur3(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function createRng(seed: string): RngState {
  return { seed, state: xmur3(seed) || 0x6d2b79f5 };
}

export function nextRandom(rng: RngState): [number, RngState] {
  let t = (rng.state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, { ...rng, state: t >>> 0 }];
}

export function randomInt(rng: RngState, min: number, max: number): [number, RngState] {
  const [value, next] = nextRandom(rng);
  return [Math.floor(value * (max - min + 1)) + min, next];
}

export function randomChoice<T>(rng: RngState, items: T[]): [T, RngState] {
  if (items.length === 0) {
    throw new Error('Cannot choose from an empty array.');
  }
  const [index, next] = randomInt(rng, 0, items.length - 1);
  return [items[index], next];
}

export function randomBool(rng: RngState, probability = 0.5): [boolean, RngState] {
  const [value, next] = nextRandom(rng);
  return [value < probability, next];
}

export function shuffle<T>(rng: RngState, items: T[]): [T[], RngState] {
  const copy = [...items];
  let next = rng;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const [j, newer] = randomInt(next, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
    next = newer;
  }
  return [copy, next];
}

export function takeRandom<T>(rng: RngState, items: T[], count: number): [T[], RngState] {
  const [shuffled, next] = shuffle(rng, items);
  return [shuffled.slice(0, count), next];
}

