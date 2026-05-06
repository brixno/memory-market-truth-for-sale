import type { GameState } from '../model/types';

const STORAGE_KEY = 'memory-market-notarized-lies-v131-save';
const LEGACY_KEY = 'memory-market-notarized-lies-save';

export function saveGame(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (parsed.version !== '1.3.1') return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export function hasLegacySavedGame(): boolean {
  return Boolean(localStorage.getItem(LEGACY_KEY));
}

export function clearSavedGame(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
