import { describe, expect, it } from 'vitest';
import { MODE_CONFIGS } from '../src/model/constants';

describe('mode configs', () => {
  it('matches v1.3.1 mode limits and slots', () => {
    expect(MODE_CONFIGS.light.playerMin).toBe(4);
    expect(MODE_CONFIGS.light.rounds).toBe(4);
    expect(MODE_CONFIGS.standard_basic.rounds).toBe(5);
    expect(MODE_CONFIGS.grand.rounds).toBe(5);
    expect(MODE_CONFIGS.extreme.rounds).toBe(6);
    expect(MODE_CONFIGS.light.evidencePerField).toBe(1);
    expect(MODE_CONFIGS.standard_basic.evidencePerField).toBe(2);
    expect(MODE_CONFIGS.light.allowedRelationTypes).toEqual(['suspect_place', 'suspect_evidence', 'place_evidence']);
    expect(MODE_CONFIGS.standard_basic.claimStakeMax).toBe(2);
    expect(MODE_CONFIGS.extreme.claimStakeMax).toBe(3);
  });
});

