import { CASE_FIELDS, MODE_CONFIGS } from '../model/constants';
import type { CaseField, GameState, Player } from '../model/types';
import { evaluatePredicate } from './predicates';

export type RoyaltyEvent = {
  useRightId: string;
  issuerId: string;
  borrowerId: string;
  field: CaseField;
  points: number;
};

export type ScoringContext = {
  correctFieldsByPlayer: Record<string, number>;
  royaltyEvents: RoyaltyEvent[];
};

export function evaluateMission(player: Player, state: GameState, context: ScoringContext): boolean {
  if (!MODE_CONFIGS[state.mode].usesMissions || !player.missionId) return false;
  switch (player.missionId) {
    case 'evidence_broker':
      return new Set(context.royaltyEvents.filter((event) => event.issuerId === player.id).map((event) => event.borrowerId)).size >= 3;
    case 'hermit_investigator':
      return !CASE_FIELDS.some((field) => player.finalSubmission?.evidenceByField[field].some((id) => state.useRights[id])) && (context.correctFieldsByPlayer[player.id] ?? 0) >= 3;
    case 'public_accuser': {
      const claims = state.publicClaims.filter((claim) => claim.playerId === player.id);
      return claims.length >= 4 && claims.filter((claim) => evaluatePredicate(claim.predicate, state.solution, state.candidates, state.relationScores)).length >= 3;
    }
    case 'original_collector':
      return CASE_FIELDS.every((field) =>
        player.finalSubmission?.evidenceByField[field].some((id) => state.records[id]?.origin === 'original')
      );
    case 'copy_distributor':
      return player.recordIds.filter((id) => state.records[id]?.origin === 'certified_copy').length >= 4;
    case 'rumor_auditor': {
      const tipAudits = Object.values(state.tips).filter((tip) => tip.auditedByPlayerIds.includes(player.id));
      const rumorAudits = Object.values(state.rumors).filter((rumor) => rumor.auditedByPlayerIds.includes(player.id));
      const falseAudits = [
        ...tipAudits.map((tip) => tip.truth),
        ...rumorAudits.map((rumor) => evaluatePredicate(rumor.predicate, state.solution, state.candidates, state.relationScores))
      ].filter((truth) => !truth);
      return tipAudits.length + rumorAudits.length >= 3 && falseAudits.length >= 2;
    }
    case 'record_monopolist':
      return CASE_FIELDS.some((field) => player.recordIds.filter((id) => state.records[id]?.origin === 'original' && state.records[id]?.fields.includes(field)).length >= 4);
    default:
      return false;
  }
}
