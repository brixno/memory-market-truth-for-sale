import { describe, expect, it } from 'vitest';
import { ARCHIVES, RELATION_CLAIM_TEXT } from '../src/model/constants';
import { buildCaseEnvelope, recordsByArchive } from '../src/model/caseData';
import type { Predicate } from '../src/model/types';
import { evaluatePredicate } from '../src/engine/predicates';

const envelope = buildCaseEnvelope('light', 'L001-light');

describe('L001-light case envelope', () => {
  it('loads L001-light with 20 candidates and 48 records', () => {
    expect(envelope.id).toBe('L001-light');
    expect(envelope.candidates).toHaveLength(20);
    expect(Object.values(envelope.records)).toHaveLength(48);
    for (const archive of ARCHIVES) expect(recordsByArchive(envelope.records, archive)).toHaveLength(12);
  });

  it('all notarized records are true and have originalFamilyId', () => {
    const familyIds = new Set<string>();
    for (const record of Object.values(envelope.records)) {
      expect(record.originalFamilyId).toBeTruthy();
      expect(familyIds.has(record.originalFamilyId)).toBe(false);
      familyIds.add(record.originalFamilyId);
      expect(evaluatePredicate(record.predicate, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
    }
  });

  it('loads 16 unconfirmed tips and public claim table matches the solution', () => {
    expect(Object.values(envelope.tips)).toHaveLength(16);
    for (const tip of Object.values(envelope.tips)) {
      expect(evaluatePredicate(tip.predicate, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(tip.truth);
    }
    const relationClaims: Predicate[] = [
      { type: 'relationAtLeast', relationType: 'suspect_place', threshold: 2, displayKo: RELATION_CLAIM_TEXT.suspect_place },
      { type: 'relationAtLeast', relationType: 'suspect_evidence', threshold: 2, displayKo: RELATION_CLAIM_TEXT.suspect_evidence },
      { type: 'relationAtLeast', relationType: 'place_evidence', threshold: 2, displayKo: RELATION_CLAIM_TEXT.place_evidence }
    ];
    for (const claim of relationClaims) expect(evaluatePredicate(claim, envelope.solution, envelope.candidates, envelope.relationScores)).toBe(true);
  });
});

