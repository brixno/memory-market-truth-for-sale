import { describe, expect, it } from 'vitest';
import { LAWS } from '../src/model/constants';
import { createNewGame, updatePlayer } from '../src/engine/gameSetup';
import { registerUseRight } from '../src/engine/market';
import { answerScore, calculateScoreBreakdowns, finalizeScoring } from '../src/engine/scoring';

describe('final scoring', () => {
  it('scores answers, single evidence, relation evidence, duplicate originalFamilyId, claims, law, coins', () => {
    let state = createNewGame({ mode: 'light', playerCount: 4, humanCount: 4, humanNames: ['A', 'B', 'C', 'D'], seed: 'score', caseEnvelopeId: 'L001-light' });
    expect(answerScore(state.solution, state.solution)[0]).toBe(28);
    const suspectRecord = Object.values(state.records).find((record) => record.ownerId === undefined && record.fields.includes('suspect') && record.recordType === 'single')!;
    const relationRecord = Object.values(state.records).find((record) => record.ownerId === undefined && record.fields.includes('suspect') && record.fields.includes('place'))!;
    state.records[suspectRecord.id] = { ...suspectRecord, ownerId: 'p1' };
    state.records[relationRecord.id] = { ...relationRecord, ownerId: 'p1' };
    state = updatePlayer(state, 'p1', (p) => ({ ...p, recordIds: [...p.recordIds, suspectRecord.id, relationRecord.id], coins: 8, finalSubmission: {
      guesses: state.solution,
      evidenceByField: { suspect: [suspectRecord.id], place: [relationRecord.id], evidence: [], time: [] }
    }}));
    state.publicClaims = [
      { id: 'c1', playerId: 'p1', round: 1, predicate: { type: 'entityHasTag', field: 'suspect', tag: '약품', displayKo: '범인은 약품 태그를 가진다.' }, textKo: '범인은 약품 태그를 가진다.', stake: 1 },
      { id: 'c2', playerId: 'p1', round: 1, predicate: { type: 'entityHasTag', field: 'place', tag: '공개', displayKo: '장소는 공개 태그를 가진다.' }, textKo: '장소는 공개 태그를 가진다.', stake: 1 }
    ];
    let score = calculateScoreBreakdowns(state).breakdowns.find((item) => item.playerId === 'p1')!;
    expect(score.answerScore).toBe(28);
    expect(score.evidenceScore).toBeGreaterThan(0);
    expect(score.publicClaimScore).toBe(0);
    expect(score.coinScore).toBe(Math.floor(8 / 3));
    state.activeLaws = [LAWS.find((law) => law.id === 'claim_accountability')!];
    score = calculateScoreBreakdowns(state).breakdowns.find((item) => item.playerId === 'p1')!;
    expect(score.publicClaimScore).toBe(0);
  });

  it('invalidates duplicate originalFamilyId and caps light royalties at 2', () => {
    let state = createNewGame({ mode: 'light', playerCount: 4, humanCount: 4, humanNames: ['A', 'B', 'C', 'D'], seed: 'dup', caseEnvelopeId: 'L001-light' });
    const recordId = state.players[0].recordIds[0];
    state.adminAccessPlayerIds = ['p1'];
    state = registerUseRight(state, 'p1', 'p2', recordId, 1, true);
    state = registerUseRight(state, 'p1', 'p3', recordId, 1, true);
    state = registerUseRight(state, 'p1', 'p4', recordId, 1, true);
    const rightIds = Object.values(state.useRights).map((right) => right.id);
    state.players = state.players.map((player, index) => index > 0 ? { ...player, finalSubmission: { guesses: state.solution, evidenceByField: { suspect: [rightIds[index - 1]], place: [], evidence: [], time: [] } } } : player);
    state = finalizeScoring(state);
    expect(state.scoreBreakdowns?.find((score) => score.playerId === 'p1')?.royaltyScore).toBeLessThanOrEqual(2);
  });
});

