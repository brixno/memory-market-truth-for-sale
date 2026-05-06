import { describe, expect, it } from 'vitest';
import { runAutoSimulation } from '../src/engine/simulation';

describe('v1.3.1 automatic simulation', () => {
  it('finishes light AI games 20 times', () => {
    for (let index = 0; index < 20; index += 1) {
      const result = runAutoSimulation({ mode: 'light', playerCount: 5, seed: `light-${index}`, caseEnvelopeId: 'L001-light' });
      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.winnerId).toBeTruthy();
    }
  });

  it('finishes standard basic AI games and avoids NaN/negative coins/false records', () => {
    const result = runAutoSimulation({ mode: 'standard_basic', playerCount: 6, seed: 'standard-basic', caseEnvelopeId: 'L001-standard_basic' });
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.scoreBreakdowns?.some((score) => Number.isNaN(score.total))).toBe(false);
  });
});
