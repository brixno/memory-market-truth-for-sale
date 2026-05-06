import { buildCaseEnvelope } from '../model/caseData';
import type { CaseEnvelope, GameMode } from '../model/types';

export function generateCaseEnvelope(mode: GameMode, caseEnvelopeId = `L001-${mode}`): CaseEnvelope {
  return buildCaseEnvelope(mode, caseEnvelopeId);
}
