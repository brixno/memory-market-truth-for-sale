import { describe, expect, it } from 'vitest';
import { buildCaseEnvelope } from '../src/model/caseData';
import type { Predicate } from '../src/model/types';
import { evaluatePredicate, predicateToKorean, validatePredicateTags } from '../src/engine/predicates';

const envelope = buildCaseEnvelope('light', 'L001-light');

describe('v1.3.1 predicates', () => {
  it('evaluates entityHasTag and entityLacksTag', () => {
    const has: Predicate = { type: 'entityHasTag', field: 'suspect', tag: '약품', displayKo: '범인은 약품 태그를 가진다.' };
    const lacks: Predicate = { type: 'entityLacksTag', field: 'evidence', tag: '전자', displayKo: '핵심 물증은 전자 태그를 가지지 않는다.' };
    const falseHas: Predicate = { type: 'entityHasTag', field: 'place', tag: '공개', displayKo: '장소는 공개 태그를 가진다.' };
    expect(evaluatePredicate(has, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
    expect(evaluatePredicate(lacks, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
    expect(evaluatePredicate(falseHas, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(false);
  });

  it('evaluates relationAtLeast threshold 2 and 3', () => {
    const t2: Predicate = { type: 'relationAtLeast', relationType: 'suspect_evidence', threshold: 2, displayKo: '관계 2 이상' };
    const t3: Predicate = { type: 'relationAtLeast', relationType: 'suspect_evidence', threshold: 3, displayKo: '관계 3 이상' };
    expect(evaluatePredicate(t2, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
    expect(evaluatePredicate(t3, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
  });

  it('prints Korean and rejects unknown official tags', () => {
    const predicate: Predicate = { type: 'entityHasTag', field: 'suspect', tag: '알리바이조작', displayKo: '' };
    expect(predicateToKorean({ ...predicate, tag: '내부', displayKo: '범인은 내부 태그를 가진다.' }).length).toBeGreaterThan(0);
    expect(validatePredicateTags(predicate, envelope.officialTags)).toEqual(['공식 키워드 목록에 없는 말입니다: 알리바이조작']);
  });
});
