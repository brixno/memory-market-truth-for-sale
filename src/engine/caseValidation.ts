import { RELATION_FIELDS } from '../model/constants';
import type { CaseSolution, RelationScoreTable, RelationType } from '../model/types';
import { relationKeyForSolution } from './predicates';

export function relationScoreForSolution(solution: CaseSolution, relationScores: RelationScoreTable, relationType: RelationType): number {
  return relationScores[relationType][relationKeyForSolution(relationType, solution)] ?? 0;
}

export function validateCaseSolution(solution: CaseSolution, relationScores: RelationScoreTable): boolean {
  const relations = Object.keys(RELATION_FIELDS) as RelationType[];
  const scores = Object.fromEntries(relations.map((relation) => [relation, relationScoreForSolution(solution, relationScores, relation)])) as Record<RelationType, number>;
  const values = Object.values(scores);
  if (values.some((score) => score === 0)) return false;
  if (values.reduce((sum, score) => sum + score, 0) < 10) return false;
  if (values.filter((score) => score >= 2).length < 3) return false;
  if (scores.suspect_place + scores.suspect_time < 4) return false;
  if (scores.suspect_evidence + scores.place_evidence < 4) return false;
  if (scores.place_time < 2) return false;
  return true;
}

export function caseRelationScoreSummary(solution: CaseSolution, relationScores: RelationScoreTable): Record<RelationType, number> {
  return Object.fromEntries(
    (Object.keys(RELATION_FIELDS) as RelationType[]).map((relation) => [relation, relationScoreForSolution(solution, relationScores, relation)])
  ) as Record<RelationType, number>;
}
