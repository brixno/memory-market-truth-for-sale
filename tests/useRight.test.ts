import { describe, expect, it } from 'vitest';
import { createNewGame } from '../src/engine/gameSetup';
import { registerUseRight, sellRecord } from '../src/engine/market';
import { finalizeScoring } from '../src/engine/scoring';

describe('use right market', () => {
  it('charges registration fee, supports waiver, prevents duplicates, and preserves rights after sale', () => {
    let state = createNewGame({ mode: 'light', playerCount: 4, humanCount: 4, humanNames: ['A', 'B', 'C', 'D'], seed: 'right', caseEnvelopeId: 'L001-light' });
    const recordId = state.players[0].recordIds[0];
    state = registerUseRight(state, 'p1', 'p2', recordId, 2, false);
    expect(state.players.find((p) => p.id === 'p2')?.coins).toBe(5);
    expect(() => registerUseRight(state, 'p1', 'p2', recordId, 1, false)).toThrow();
    state = sellRecord(state, 'p1', 'p3', recordId, 1);
    const right = Object.values(state.useRights)[0];
    expect(right.issuerId).toBe('p1');
    expect(right.borrowerId).toBe('p2');
    expect(state.records[recordId].ownerId).toBe('p3');
  });

  it('awards royalty to issuer, not current owner', () => {
    let state = createNewGame({ mode: 'light', playerCount: 4, humanCount: 4, humanNames: ['A', 'B', 'C', 'D'], seed: 'royalty', caseEnvelopeId: 'L001-light' });
    const recordId = state.players[0].recordIds.find((id) => state.records[id].fields.includes('suspect')) ?? state.players[0].recordIds[0];
    state = registerUseRight(state, 'p1', 'p2', recordId, 1, false);
    const rightId = Object.values(state.useRights)[0].id;
    state.players[1].finalSubmission = {
      guesses: state.solution,
      evidenceByField: { suspect: [rightId], place: [], evidence: [], time: [] }
    };
    state = finalizeScoring(state);
    expect(state.scoreBreakdowns?.find((score) => score.playerId === 'p1')?.royaltyScore).toBe(1);
  });
});

