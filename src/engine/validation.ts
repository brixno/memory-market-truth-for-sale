import { CASE_FIELDS } from '../model/constants';
import type { GameState } from '../model/types';
import { validateCaseSolution } from './caseValidation';
import { resolveEvidenceRecord } from './market';
import { evaluatePredicate, getPredicateFields } from './predicates';

export function validateGameState(state: GameState): string[] {
  const errors: string[] = [];
  if (state.version !== '1.3.1') errors.push('구버전 저장 데이터는 v1.3.1과 호환되지 않습니다. 새 게임을 시작하세요.');
  if (!validateCaseSolution(state.solution, state.relationScores)) errors.push('사건 성립 가능성 필터를 통과하지 못한 정답입니다.');
  for (const record of Object.values(state.records)) {
    if (!record.originalFamilyId) errors.push(`공식 기록 ${record.id}에 원본 묶음 번호가 없습니다.`);
    if (!evaluatePredicate(record.predicate, state.solution, state.candidates, state.relationScores)) errors.push(`공식 기록 ${record.id}가 실제 정답과 맞지 않습니다.`);
  }
  for (const player of state.players) {
    if (player.coins < 0) errors.push(`${player.name}의 코인이 음수입니다.`);
    for (const recordId of player.recordIds) {
      const record = state.records[recordId];
      if (!record) errors.push(`${player.name}이 존재하지 않는 공식 기록 ${recordId}를 참조합니다.`);
      else if (record.ownerId !== player.id) errors.push(`${player.name}의 recordIds와 기록 소유자가 불일치합니다: ${recordId}`);
    }
    for (const tipId of player.tipIds) {
      const tip = state.tips[tipId];
      if (!tip) errors.push(`${player.name}이 존재하지 않는 제보 ${tipId}를 참조합니다.`);
      else if (tip.ownerId !== player.id) errors.push(`${player.name}의 tipIds와 제보 소유자가 불일치합니다: ${tipId}`);
    }
    for (const rightId of player.useRightIds) {
      const right = state.useRights[rightId];
      if (!right) errors.push(`${player.name}이 존재하지 않는 증거 이용권 ${rightId}를 참조합니다.`);
      else if (right.borrowerId !== player.id) errors.push(`${player.name}의 useRightIds와 증거 이용권 사용자가 불일치합니다: ${rightId}`);
    }
    const submission = player.finalSubmission;
    if (submission) {
      const usedEvidenceIds = new Set<string>();
      const usedFamilies = new Set<string>();
      for (const field of CASE_FIELDS) {
        if (submission.evidenceByField[field].length > 2) errors.push(`${player.name}의 ${field} 증거가 2개를 초과합니다.`);
        for (const evidenceId of submission.evidenceByField[field]) {
          if (usedEvidenceIds.has(evidenceId)) errors.push(`${player.name}의 최종 제출에서 같은 증거 ID가 중복 사용되었습니다.`);
          usedEvidenceIds.add(evidenceId);
          const { record } = resolveEvidenceRecord(state, player.id, evidenceId);
          if (!record) errors.push(`${player.name}이 공식 증거가 아닌 ${evidenceId}를 제출했습니다.`);
          else {
            if (!getPredicateFields(record.predicate).includes(field)) errors.push(`${player.name}의 증거 ${evidenceId}는 ${field}에 붙일 수 없습니다.`);
            if (usedFamilies.has(record.originalFamilyId)) errors.push(`${player.name}의 최종 제출에서 원본 묶음 ${record.originalFamilyId}가 중복되었습니다.`);
            usedFamilies.add(record.originalFamilyId);
          }
        }
      }
    }
  }
  return errors;
}
