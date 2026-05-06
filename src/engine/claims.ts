import { MODE_CONFIGS } from '../model/constants';
import type { GameState, Predicate, PublicClaim } from '../model/types';
import { addLog, findPlayer, updatePlayer } from './gameSetup';
import { predicateToKorean, validatePredicateTags } from './predicates';

export function submitPublicClaim(state: GameState, playerId: string, predicate: Predicate, stake: number): GameState {
  const config = MODE_CONFIGS[state.mode];
  const player = findPlayer(state, playerId);
  if (state.publicClaimDonePlayerIds.includes(playerId)) throw new Error('이번 라운드 공개 주장 제출은 이미 끝났습니다.');
  if (stake < config.claimStakeMin || stake > config.claimStakeMax || player.coins < stake) throw new Error('공개 주장 베팅 범위가 올바르지 않습니다.');
  if (predicate.type === 'relationAtLeast') {
    if (!config.allowedRelationTypes.includes(predicate.relationType)) throw new Error('이 모드에서는 해당 연결 주장을 사용할 수 없습니다.');
    if (predicate.threshold === 3 && !config.allowStrongRelationClaims) throw new Error('이 모드에서는 강한 연결 공개 주장을 사용할 수 없습니다.');
  }
  const tagErrors = validatePredicateTags(predicate, state.officialTags);
  if (tagErrors.length > 0) throw new Error(tagErrors.join('\n'));
  const claim: PublicClaim = {
    id: `claim-${state.round}-${state.pendingPublicClaims.length + state.publicClaims.length + 1}`,
    playerId,
    round: state.round,
    predicate,
    textKo: predicateToKorean(predicate),
    stake
  };
  let next = updatePlayer(state, playerId, (current) => ({ ...current, coins: current.coins - stake }));
  next = {
    ...next,
    pendingPublicClaims: [...next.pendingPublicClaims, claim],
    publicClaimDonePlayerIds: [...next.publicClaimDonePlayerIds, playerId]
  };
  return addLog(next, `${player.name}이 공개 주장을 비공개로 제출했습니다.`);
}

export function skipPublicClaim(state: GameState, playerId: string): GameState {
  if (state.publicClaimDonePlayerIds.includes(playerId)) return state;
  findPlayer(state, playerId);
  return {
    ...addLog(state, `${findPlayer(state, playerId).name}이 공개 주장을 하지 않았습니다.`),
    publicClaimDonePlayerIds: [...state.publicClaimDonePlayerIds, playerId]
  };
}

export function allPublicClaimsDone(state: GameState): boolean {
  return state.players.every((player) => state.publicClaimDonePlayerIds.includes(player.id));
}

export function revealPendingPublicClaims(state: GameState): GameState {
  if (state.pendingPublicClaims.length === 0) return state;
  let next: GameState = { ...state, publicClaims: [...state.publicClaims, ...state.pendingPublicClaims], pendingPublicClaims: [] };
  for (const claim of state.pendingPublicClaims) {
    const player = state.players.find((candidate) => candidate.id === claim.playerId);
    next = addLog(next, `${player?.name ?? '누군가'}의 공개 주장 공개: ${claim.textKo} / ${claim.stake}코인`);
  }
  return next;
}
