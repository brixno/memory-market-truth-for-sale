import { ARCHIVES, CASE_FIELDS, FIELD_LABELS, MODE_CONFIGS, RELATION_CLAIM_TEXT } from '../model/constants';
import { fieldCandidates } from '../model/caseData';
import type { ArchiveChoice, CaseField, CaseSolution, FinalSubmission, GameState, Law, NotarizedRecord, Player, Predicate, RelationType, RngState } from '../model/types';
import { validateCaseSolution } from './caseValidation';
import { submitPublicClaim } from './claims';
import { effectiveEvidence } from './laws';
import { randomBool, randomChoice, randomInt } from './rng';
import { evaluatePredicate, getPredicateFields, isRelationPredicate, solutionCandidateId } from './predicates';

export function allPossibleSolutions(state: GameState): CaseSolution[] {
  const suspects = fieldCandidates(state.candidates, 'suspect');
  const places = fieldCandidates(state.candidates, 'place');
  const evidences = fieldCandidates(state.candidates, 'evidence');
  const times = fieldCandidates(state.candidates, 'time');
  const solutions: CaseSolution[] = [];
  for (const suspect of suspects) {
    for (const place of places) {
      for (const evidence of evidences) {
        for (const time of times) {
          const solution = { suspectId: suspect.id, placeId: place.id, evidenceId: evidence.id, timeId: time.id };
          if (validateCaseSolution(solution, state.relationScores)) solutions.push(solution);
        }
      }
    }
  }
  return solutions.length ? solutions : suspects.flatMap((suspect) => places.flatMap((place) => evidences.flatMap((evidence) => times.map((time) => ({ suspectId: suspect.id, placeId: place.id, evidenceId: evidence.id, timeId: time.id })))));
}

export function trustedPredicatesForPlayer(state: GameState, player: Player): Predicate[] {
  const ownRecords = player.recordIds.map((id) => state.records[id]?.predicate).filter(Boolean) as Predicate[];
  const rightRecords = player.useRightIds.map((id) => state.records[state.useRights[id]?.recordId]?.predicate).filter(Boolean) as Predicate[];
  const auditedTips = player.tipIds
    .map((id) => state.tips[id])
    .filter((tip) => tip?.auditedByPlayerIds.includes(player.id) && tip.truth)
    .map((tip) => tip.predicate);
  return [...ownRecords, ...rightRecords, ...auditedTips];
}

export function candidateSolutionsForPlayer(state: GameState, player: Player): CaseSolution[] {
  const predicates = trustedPredicatesForPlayer(state, player);
  return allPossibleSolutions(state).filter((solution) => predicates.every((predicate) => evaluatePredicate(predicate, solution, state.candidates, state.relationScores)));
}

function uncertainty(candidates: CaseSolution[], field: CaseField): number {
  return new Set(candidates.map((solution) => solutionCandidateId(solution, field))).size;
}

export function chooseAiArchive(state: GameState, player: Player): [ArchiveChoice, RngState] {
  let rng = state.rngState;
  const [bankChance, afterBank] = randomBool(rng, player.coins <= 3 ? 0.45 : 0.08);
  rng = afterBank;
  if (bankChance) return [state.mode === 'light' ? 'admin' : 'funding', rng];
  const [adminChance, afterAdmin] = randomBool(rng, player.recordIds.length >= 4 && player.coins >= 2 ? 0.22 : 0.06);
  rng = afterAdmin;
  if (adminChance) return [state.mode === 'light' ? 'admin' : 'notary', rng];
  const candidates = candidateSolutionsForPlayer(state, player);
  const field = [...CASE_FIELDS].sort((a, b) => uncertainty(candidates, b) - uncertainty(candidates, a))[0];
  const choice: Record<CaseField, ArchiveChoice> = { suspect: 'people', place: 'space', evidence: 'evidence', time: 'time' };
  return [choice[field], rng];
}

export function estimateRecordValue(state: GameState, player: Player, record: NotarizedRecord, asUseRight = false): number {
  const candidates = candidateSolutionsForPlayer(state, player);
  const current = Math.max(1, candidates.length);
  const filtered = candidates.filter((solution) => evaluatePredicate(record.predicate, solution, state.candidates, state.relationScores)).length;
  const reduction = (current - filtered) / current;
  const relationBonus = isRelationPredicate(record.predicate) && state.round >= Math.ceil(MODE_CONFIGS[state.mode].rounds / 2) ? 1.5 : 0;
  const value = reduction * 10 + effectiveEvidence(record, state) + relationBonus;
  return asUseRight ? value * 0.6 : value;
}

export function aiAcceptsOffer(state: GameState, aiPlayerId: string, recordId: string, price: number, asUseRight = false): boolean {
  const ai = state.players.find((player) => player.id === aiPlayerId);
  const record = state.records[recordId];
  if (!ai || ai.type !== 'ai' || !record) return false;
  return ai.coins >= price && price <= estimateRecordValue(state, ai, record, asUseRight);
}

export function performAiPublicClaim(state: GameState, player: Player): [GameState, RngState] {
  let rng = state.rngState;
  const [willClaim, afterWill] = randomBool(rng, 0.55);
  rng = afterWill;
  if (!willClaim || player.coins <= 0 || player.recordIds.length === 0) return [state, rng];
  const records = player.recordIds.map((id) => state.records[id]).filter(Boolean);
  const allowed = records.filter((record) => {
    if (record.predicate.type !== 'relationAtLeast') return true;
    const config = MODE_CONFIGS[state.mode];
    return config.allowedRelationTypes.includes(record.predicate.relationType) && (record.predicate.threshold === 2 || config.allowStrongRelationClaims);
  });
  if (!allowed.length) return [state, rng];
  const [record, afterRecord] = randomChoice(rng, allowed);
  rng = afterRecord;
  const maxStake = Math.min(MODE_CONFIGS[state.mode].claimStakeMax, player.coins);
  const [stake, afterStake] = randomInt(rng, MODE_CONFIGS[state.mode].claimStakeMin, maxStake);
  rng = afterStake;
  return [submitPublicClaim({ ...state, rngState: rng }, player.id, record.predicate, stake), rng];
}

export function aiLawBid(state: GameState, player: Player, candidates: Law[]): [number, RngState] {
  let preference = 1;
  const originalCount = player.recordIds.filter((id) => state.records[id]?.origin === 'original').length;
  const copyCount = player.recordIds.filter((id) => state.records[id]?.origin === 'certified_copy').length;
  const issued = player.issuedUseRightIds.length;
  for (const law of candidates) {
    if (law.id === 'original_certification_priority') preference = Math.max(preference, originalCount);
    if (law.id === 'certified_copy_equality') preference = Math.max(preference, copyCount * 2);
    if (law.id === 'use_right_royalty') preference = Math.max(preference, issued * 2);
    if (law.id === 'claim_accountability') preference = Math.max(preference, state.publicClaims.filter((claim) => claim.playerId === player.id).length);
  }
  return randomInt(state.rngState, 0, Math.min(player.coins, Math.floor(player.coins * Math.min(0.4, 0.08 + preference * 0.03))));
}

export function chooseAiLaw(candidates: Law[], state: GameState, player: Player): Law {
  const score = (law: Law) => {
    if (law.id === 'original_certification_priority') return player.recordIds.filter((id) => state.records[id]?.origin === 'original').length;
    if (law.id === 'certified_copy_equality') return player.recordIds.filter((id) => state.records[id]?.origin === 'certified_copy').length * 2;
    if (law.id === 'use_right_royalty') return player.issuedUseRightIds.length * 2;
    if (law.id === 'claim_accountability') return state.publicClaims.filter((claim) => claim.playerId === player.id).length;
    return 1;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}

function mostLikely(candidates: CaseSolution[], field: CaseField, fallback: string): string {
  if (!candidates.length) return fallback;
  const counts = new Map<string, number>();
  for (const solution of candidates) {
    const id = solutionCandidateId(solution, field);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function chooseAiFinalSubmission(state: GameState, player: Player): [FinalSubmission, RngState] {
  let rng = state.rngState;
  const candidates = candidateSolutionsForPlayer(state, player);
  const guesses = {} as CaseSolution;
  for (const field of CASE_FIELDS) {
    const [fallback, next] = randomChoice(rng, fieldCandidates(state.candidates, field));
    rng = next;
    const id = mostLikely(candidates, field, fallback.id);
    if (field === 'suspect') guesses.suspectId = id;
    if (field === 'place') guesses.placeId = id;
    if (field === 'evidence') guesses.evidenceId = id;
    if (field === 'time') guesses.timeId = id;
  }
  const config = MODE_CONFIGS[state.mode];
  const evidenceByField: FinalSubmission['evidenceByField'] = { suspect: [], place: [], evidence: [], time: [] };
  const usedFamilies = new Set<string>();
  const usedEvidenceIds = new Set<string>();
  const evidenceIds = [...player.recordIds, ...player.useRightIds];
  for (const field of CASE_FIELDS) {
    const ranked = evidenceIds
      .map((id) => {
        const record = state.records[id] ?? state.records[state.useRights[id]?.recordId];
        return record ? { id, record } : undefined;
      })
      .filter((item): item is { id: string; record: NotarizedRecord } => Boolean(item))
      .filter(({ id, record }) => !usedEvidenceIds.has(id) && !usedFamilies.has(record.originalFamilyId) && getPredicateFields(record.predicate).includes(field))
      .sort((a, b) => {
        const relationDelta = Number(isRelationPredicate(b.record.predicate)) - Number(isRelationPredicate(a.record.predicate));
        return effectiveEvidence(b.record, state) - effectiveEvidence(a.record, state) + relationDelta;
      });
    let relationCount = 0;
    for (const item of ranked) {
      if (evidenceByField[field].length >= config.evidencePerField) break;
      if (usedFamilies.has(item.record.originalFamilyId) || usedEvidenceIds.has(item.id)) continue;
      if (isRelationPredicate(item.record.predicate)) {
        if (config.relationEvidencePerFieldLimit !== undefined && relationCount >= config.relationEvidencePerFieldLimit) continue;
        relationCount += 1;
      }
      evidenceByField[field].push(item.id);
      usedEvidenceIds.add(item.id);
      usedFamilies.add(item.record.originalFamilyId);
    }
  }
  return [{ guesses, evidenceByField }, rng];
}

export function fieldUncertaintyLabel(state: GameState, player: Player): string {
  const candidates = candidateSolutionsForPlayer(state, player);
  return CASE_FIELDS.map((field) => `${FIELD_LABELS[field]} ${uncertainty(candidates, field)}`).join(' · ');
}

export function relationClaimPredicate(relationType: RelationType, threshold: 2 | 3 = 2): Predicate {
  return { type: 'relationAtLeast', relationType, threshold, displayKo: RELATION_CLAIM_TEXT[relationType] };
}
