import { CASE_FIELDS, FIELD_LABELS, MISSIONS, MODE_CONFIGS } from '../model/constants';
import type { CaseField, CaseSolution, GameState, NotarizedRecord, ScoreBreakdown, UseRight } from '../model/types';
import { effectiveEvidence, claimFactor, royaltyCap, royaltyEnabled } from './laws';
import { resolveEvidenceRecord } from './market';
import { evaluateMission, type RoyaltyEvent, type ScoringContext } from './missions';
import { evaluatePredicate, getPredicateFields, isRelationPredicate, solutionCandidateId } from './predicates';

export function answerScore(guesses: CaseSolution, solution: CaseSolution): [number, number] {
  const correct = CASE_FIELDS.filter((field) => solutionCandidateId(guesses, field) === solutionCandidateId(solution, field)).length;
  return [correct * 5 + (correct === 4 ? 8 : 0), correct];
}

function evidenceCanScoreForField(state: GameState, record: NotarizedRecord, field: CaseField, guesses: CaseSolution): boolean {
  if (!getPredicateFields(record.predicate).includes(field)) return false;
  if (!evaluatePredicate(record.predicate, state.solution, state.candidates, state.relationScores)) return false;
  if (record.recordType === 'single') return solutionCandidateId(guesses, field) === solutionCandidateId(state.solution, field);
  return getPredicateFields(record.predicate).every((predicateField) => solutionCandidateId(guesses, predicateField) === solutionCandidateId(state.solution, predicateField));
}

function collectEvidenceForPlayer(
  state: GameState,
  playerId: string
): {
  evidenceScore: number;
  royaltyEvents: RoyaltyEvent[];
  details: string[];
  invalidEvidenceIds: string[];
  scoredOriginalFamilyIds: string[];
  usedUseRights: Array<{ id: string; field: CaseField; producedEvidenceScore: boolean }>;
} {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const submission = player?.finalSubmission;
  if (!player || !submission) {
    return { evidenceScore: 0, royaltyEvents: [], details: ['최종 제출 없음'], invalidEvidenceIds: [], scoredOriginalFamilyIds: [], usedUseRights: [] };
  }
  const config = MODE_CONFIGS[state.mode];
  const seenEvidenceIds = new Set<string>();
  const scoredFamilies = new Set<string>();
  const invalidEvidenceIds: string[] = [];
  const scoredOriginalFamilyIds: string[] = [];
  const royaltyEvents: RoyaltyEvent[] = [];
  const usedUseRights: Array<{ id: string; field: CaseField; producedEvidenceScore: boolean }> = [];
  const details: string[] = [];
  let evidenceScore = 0;
  let relationEvidenceTotal = 0;

  for (const field of CASE_FIELDS) {
    let relationEvidenceForField = 0;
    const evidenceIds = submission.evidenceByField[field] ?? [];
    for (const evidenceId of evidenceIds.slice(0, config.evidencePerField)) {
      if (seenEvidenceIds.has(evidenceId)) {
        invalidEvidenceIds.push(evidenceId);
        details.push(`${FIELD_LABELS[field]} 증거 ${evidenceId}: 이미 사용한 증거라 무효`);
        continue;
      }
      seenEvidenceIds.add(evidenceId);
      const { record, useRight } = resolveEvidenceRecord(state, playerId, evidenceId);
      if (!record) {
        invalidEvidenceIds.push(evidenceId);
        details.push(`${FIELD_LABELS[field]} 증거 ${evidenceId}: 공식 증거가 아니라 무효`);
        continue;
      }
      if (scoredFamilies.has(record.originalFamilyId)) {
        invalidEvidenceIds.push(evidenceId);
        details.push(`${FIELD_LABELS[field]} 증거 ${record.originalFamilyId}: 같은 원본 묶음 중복이라 무효`);
        if (state.mode === 'grand' || state.mode === 'extreme') {
          details.push(`${FIELD_LABELS[field]} 중복 제출 경고: 반복 고의 중복은 -2 벌점 대상입니다.`);
        }
        continue;
      }
      if (isRelationPredicate(record.predicate)) {
        if (config.relationEvidenceTotalLimit !== undefined && relationEvidenceTotal >= config.relationEvidenceTotalLimit) {
          invalidEvidenceIds.push(evidenceId);
          details.push(`${FIELD_LABELS[field]} 연결 증거: 라이트 전체 연결 증거 한도를 넘어 무효`);
          continue;
        }
        if (config.relationEvidencePerFieldLimit !== undefined && relationEvidenceForField >= config.relationEvidencePerFieldLimit) {
          invalidEvidenceIds.push(evidenceId);
          details.push(`${FIELD_LABELS[field]} 연결 증거: 항목당 연결 증거 한도를 넘어 무효`);
          continue;
        }
      }
      const produced = evidenceCanScoreForField(state, record, field, submission.guesses);
      const points = produced ? effectiveEvidence(record, state) : 0;
      if (produced) {
        evidenceScore += points;
        scoredFamilies.add(record.originalFamilyId);
        scoredOriginalFamilyIds.push(record.originalFamilyId);
        if (isRelationPredicate(record.predicate)) {
          relationEvidenceTotal += 1;
          relationEvidenceForField += 1;
        }
        details.push(`${FIELD_LABELS[field]} 증거 "${record.textKo}" +${points}`);
      } else {
        details.push(`${FIELD_LABELS[field]} 증거 "${record.textKo}" 조건 미충족: +0`);
      }
      if (useRight) {
        usedUseRights.push({ id: useRight.id, field, producedEvidenceScore: produced && points > 0 });
        if (produced && points > 0 && useRight.issuerId !== playerId) {
          royaltyEvents.push({ useRightId: useRight.id, issuerId: useRight.issuerId, borrowerId: playerId, field, points });
        }
      }
    }
  }
  return { evidenceScore, royaltyEvents, details, invalidEvidenceIds, scoredOriginalFamilyIds, usedUseRights };
}

export function publicClaimScoreForPlayer(state: GameState, playerId: string): { score: number; falseCount: number; details: string[] } {
  const factor = claimFactor(state);
  let score = 0;
  let falseCount = 0;
  const details: string[] = [];
  for (const claim of state.publicClaims.filter((candidate) => candidate.playerId === playerId)) {
    const truth = evaluatePredicate(claim.predicate, state.solution, state.candidates, state.relationScores);
    const points = claim.stake * factor * (truth ? 1 : -1);
    score += points;
    if (!truth) falseCount += 1;
    details.push(`공개 주장 "${claim.textKo}" ${truth ? '참' : '거짓'}: ${points >= 0 ? '+' : ''}${points}`);
  }
  return { score, falseCount, details };
}

export function calculateScoreBreakdowns(state: GameState): {
  breakdowns: ScoreBreakdown[];
  usedUseRights: Array<{ id: string; field: CaseField; producedEvidenceScore: boolean }>;
  falseCounts: Record<string, number>;
} {
  const correctFieldsByPlayer: Record<string, number> = {};
  const evidenceByPlayer: Record<string, ReturnType<typeof collectEvidenceForPlayer>> = {};
  const allRoyaltyEvents: RoyaltyEvent[] = [];
  const usedUseRights: Array<{ id: string; field: CaseField; producedEvidenceScore: boolean }> = [];

  for (const player of state.players) {
    const [, correct] = player.finalSubmission ? answerScore(player.finalSubmission.guesses, state.solution) : [0, 0];
    correctFieldsByPlayer[player.id] = correct;
    const evidence = collectEvidenceForPlayer(state, player.id);
    evidenceByPlayer[player.id] = evidence;
    allRoyaltyEvents.push(...evidence.royaltyEvents);
    usedUseRights.push(...evidence.usedUseRights);
  }

  const context: ScoringContext = { correctFieldsByPlayer, royaltyEvents: allRoyaltyEvents };
  const falseCounts: Record<string, number> = {};

  const breakdowns = state.players.map<ScoreBreakdown>((player) => {
    const [answers, correct] = player.finalSubmission ? answerScore(player.finalSubmission.guesses, state.solution) : [0, 0];
    const evidence = evidenceByPlayer[player.id];
    const publicClaims = publicClaimScoreForPlayer(state, player.id);
    falseCounts[player.id] = publicClaims.falseCount;
    const mission = MISSIONS.find((candidate) => candidate.id === player.missionId);
    const missionAchieved = evaluateMission(player, state, context);
    const missionScore = missionAchieved ? MODE_CONFIGS[state.mode].missionReward : 0;
    const coinScore = Math.floor(player.coins / 3);
    let royaltyScore = 0;
    if (royaltyEnabled(state)) {
      royaltyScore = allRoyaltyEvents.filter((event) => event.issuerId === player.id).length;
      const cap = royaltyCap(state);
      if (cap !== undefined) royaltyScore = Math.min(cap, royaltyScore);
    }
    const falsePenalty = Math.max(player.falseClaimCount, publicClaims.falseCount) >= 3 ? 5 : 0;
    const penalties = falsePenalty + player.taxDebt;
    const details = [
      `정답 ${correct}/4: +${answers}`,
      ...evidence.details,
      ...publicClaims.details,
      mission ? `개인 목표 ${mission.nameKo}: ${missionAchieved ? `+${missionScore} 달성` : '미달성'}` : '개인 목표 없음',
      `코인 점수 floor(${player.coins}/3): +${coinScore}`,
      `이용 보너스 점수: +${royaltyScore}`,
      falsePenalty ? `거짓 공개 주장 벌점: -${falsePenalty}` : '거짓 공개 주장 벌점 없음',
      player.taxDebt ? `기록 보관 비용 부족 벌점: -${player.taxDebt}` : '기록 보관 비용 부족 없음'
    ];
    const total = answers + evidence.evidenceScore + publicClaims.score + missionScore + coinScore + royaltyScore - penalties;
    return {
      playerId: player.id,
      answerScore: answers,
      evidenceScore: evidence.evidenceScore,
      publicClaimScore: publicClaims.score,
      missionScore,
      coinScore,
      royaltyScore,
      penalties,
      correctCount: correct,
      total,
      invalidEvidenceIds: evidence.invalidEvidenceIds,
      scoredOriginalFamilyIds: evidence.scoredOriginalFamilyIds,
      details
    };
  });
  return { breakdowns, usedUseRights, falseCounts };
}

export function finalizeScoring(state: GameState): GameState {
  const { breakdowns, usedUseRights, falseCounts } = calculateScoreBreakdowns(state);
  const useRights: Record<string, UseRight> = { ...state.useRights };
  for (const used of usedUseRights) {
    const right = useRights[used.id];
    if (right) useRights[used.id] = { ...right, used: true, usedForField: used.field, producedEvidenceScore: used.producedEvidenceScore };
  }
  return {
    ...state,
    phase: 'gameOver',
    useRights,
    players: state.players.map((player) => ({ ...player, falseClaimCount: Math.max(player.falseClaimCount, falseCounts[player.id] ?? 0) })),
    scoreBreakdowns: breakdowns
  };
}

export function rankedBreakdowns(breakdowns: ScoreBreakdown[]): ScoreBreakdown[] {
  return [...breakdowns].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    if (b.evidenceScore !== a.evidenceScore) return b.evidenceScore - a.evidenceScore;
    if (b.publicClaimScore !== a.publicClaimScore) return b.publicClaimScore - a.publicClaimScore;
    return b.coinScore - a.coinScore;
  });
}
