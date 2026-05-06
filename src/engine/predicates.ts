import { RELATION_CLAIM_TEXT, RELATION_FIELDS } from '../model/constants';
import type { Candidate, CaseField, CaseSolution, Predicate, RelationScoreTable, RelationType } from '../model/types';

export function solutionCandidateId(solution: CaseSolution, field: CaseField): string {
  switch (field) {
    case 'suspect':
      return solution.suspectId;
    case 'place':
      return solution.placeId;
    case 'evidence':
      return solution.evidenceId;
    case 'time':
      return solution.timeId;
  }
}

export function findCandidate(candidates: Candidate[], id: string): Candidate | undefined {
  return candidates.find((candidate) => candidate.id === id);
}

export function relationKeyForSolution(relationType: RelationType, solution: CaseSolution): string {
  const [left, right] = RELATION_FIELDS[relationType];
  return `${solutionCandidateId(solution, left)}:${solutionCandidateId(solution, right)}`;
}

export function evaluatePredicate(
  predicate: Predicate,
  solution: CaseSolution,
  candidates: Candidate[],
  relationScores: RelationScoreTable
): boolean {
  if (predicate.type === 'entityHasTag' || predicate.type === 'entityLacksTag') {
    const candidate = findCandidate(candidates, solutionCandidateId(solution, predicate.field));
    if (!candidate) return false;
    const hasTag = candidate.tags.includes(predicate.tag);
    return predicate.type === 'entityHasTag' ? hasTag : !hasTag;
  }
  const key = relationKeyForSolution(predicate.relationType, solution);
  return (relationScores[predicate.relationType][key] ?? 0) >= predicate.threshold;
}

export function predicateToKorean(predicate: Predicate): string {
  const subject = predicate.type === 'relationAtLeast'
    ? ''
    : predicate.field === 'suspect'
      ? '범인은'
      : predicate.field === 'place'
        ? '장소에는'
        : predicate.field === 'evidence'
          ? '핵심 물증에는'
          : '시간대에는';
  if (predicate.type === 'entityHasTag') {
    return predicate.displayKo || `${subject} [${predicate.tag}] 키워드가 있다.`;
  }
  if (predicate.type === 'entityLacksTag') {
    return predicate.displayKo || `${subject} [${predicate.tag}] 키워드가 없다.`;
  }
  return predicate.displayKo || RELATION_CLAIM_TEXT[predicate.relationType];
}

export function getPredicateFields(predicate: Predicate): CaseField[] {
  if (predicate.type === 'entityHasTag' || predicate.type === 'entityLacksTag') return [predicate.field];
  return [...RELATION_FIELDS[predicate.relationType]];
}

export function isRelationPredicate(predicate: Predicate): boolean {
  return predicate.type === 'relationAtLeast';
}

export function isOfficialTag(tag: string, officialTags: string[]): boolean {
  return officialTags.includes(tag);
}

export function validatePredicateTags(predicate: Predicate, officialTags: string[]): string[] {
  if ((predicate.type === 'entityHasTag' || predicate.type === 'entityLacksTag') && !isOfficialTag(predicate.tag, officialTags)) {
    return [`공식 키워드 목록에 없는 말입니다: ${predicate.tag}`];
  }
  return [];
}
