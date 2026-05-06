import { MODE_CONFIGS } from '../model/constants';
import type { GameState } from '../model/types';
import { allPublicClaimsDone, revealPendingPublicClaims } from './claims';
import { addLog, nextStartPlayerId } from './gameSetup';
import { applyStorageBurden, beginLawAuction } from './laws';

export function startPublicClaimPhase(state: GameState): GameState {
  return addLog({ ...state, phase: 'publicClaim', publicClaimDonePlayerIds: [], pendingPublicClaims: [] }, '공개 주장 동시 제출 단계가 시작되었습니다.', 'publicClaim');
}

export function completePublicClaimPhase(state: GameState): GameState {
  if (!allPublicClaimsDone(state)) throw new Error('아직 공개 주장 제출을 마치지 않은 플레이어가 있습니다.');
  const revealed = revealPendingPublicClaims(state);
  const config = MODE_CONFIGS[revealed.mode];
  if (config.usesLawAuction && (revealed.round === 2 || revealed.round === 4)) return beginLawAuction(revealed);
  if (config.usesLaws && !config.usesLawAuction && (revealed.round === 3 || revealed.round === 5) && revealed.activeLaws.length < 2) {
    return beginLawAuction(revealed);
  }
  return endRound(revealed);
}

export function endRound(state: GameState): GameState {
  const config = MODE_CONFIGS[state.mode];
  let next = applyStorageBurden(state);
  next = {
    ...next,
    startPlayerId: nextStartPlayerId(next),
    archiveChoices: {},
    archiveResolution: { pendingDraws: [], pendingAuctions: [], resolved: false },
    adminAccessPlayerIds: [],
    notaryCredits: {},
    marketDonePlayerIds: [],
    publicClaimDonePlayerIds: [],
    lawAuction: undefined
  };
  if (next.round >= config.rounds) {
    return addLog({ ...next, phase: 'finalSubmission' }, `${config.rounds}라운드가 끝났습니다. 최종 제출을 시작합니다.`, 'finalSubmission');
  }
  const round = next.round + 1;
  return addLog({ ...next, round, phase: 'archiveSelection' }, `라운드 ${round} 시작. 시작 플레이어가 이동했습니다.`, 'archiveSelection');
}
