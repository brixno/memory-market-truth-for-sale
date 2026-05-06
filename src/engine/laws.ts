import { LAWS, MODE_CONFIGS } from '../model/constants';
import type { GameState, Law, NotarizedRecord, RngState } from '../model/types';
import { addLog, findPlayer, updatePlayer } from './gameSetup';
import { takeRandom } from './rng';

export function getLawById(id: string): Law {
  const law = LAWS.find((candidate) => candidate.id === id);
  if (!law) throw new Error(`존재하지 않는 규칙 카드입니다: ${id}`);
  return law;
}

export function drawLawCandidates(rng: RngState, count = 3): [Law[], RngState] {
  return takeRandom(rng, LAWS, count);
}

export function activeLawByFamily(state: GameState, family: Law['family']): Law | undefined {
  return state.activeLaws.find((law) => law.family === family);
}

export function activateLaw(state: GameState, law: Law): GameState {
  const withoutFamily = state.activeLaws.filter((candidate) => candidate.family !== law.family);
  const capped = [...withoutFamily, law].slice(-2);
  return addLog({ ...state, activeLaws: capped }, `${law.nameKo} 규칙 카드가 적용되었습니다.`);
}

export function effectiveEvidence(record: NotarizedRecord, state: GameState): number {
  const evidenceLaw = activeLawByFamily(state, 'evidence');
  if (evidenceLaw?.id === 'original_certification_priority') {
    return Math.max(0, record.evidenceValue + (record.origin === 'original' ? 1 : -1));
  }
  if (evidenceLaw?.id === 'certified_copy_equality' && record.origin === 'certified_copy' && record.sourceOriginalId) {
    return state.records[record.sourceOriginalId]?.evidenceValue ?? record.evidenceValue;
  }
  return record.evidenceValue;
}

export function royaltyEnabled(state: GameState): boolean {
  const rule = MODE_CONFIGS[state.mode].royaltyRule;
  if (rule === 'law_only') return activeLawByFamily(state, 'useRight')?.id === 'use_right_royalty';
  return true;
}

export function royaltyCap(state: GameState): number | undefined {
  return MODE_CONFIGS[state.mode].royaltyRule === 'light_cap_2' ? 2 : undefined;
}

export function storageTaxEnabled(state: GameState): boolean {
  return activeLawByFamily(state, 'storage')?.id === 'storage_burden';
}

export function claimFactor(state: GameState): number {
  return activeLawByFamily(state, 'claim')?.id === 'claim_accountability' ? 4 : 2;
}

export function applyStorageBurden(state: GameState): GameState {
  if (!storageTaxEnabled(state)) return state;
  let next = state;
  for (const player of next.players) {
    const excess = Math.max(0, player.recordIds.length - 7);
    if (excess === 0) continue;
    const due = excess * 2;
    const paid = Math.min(player.coins, due);
    const debt = due - paid;
    next = updatePlayer(next, player.id, (current) => ({ ...current, coins: current.coins - paid, taxDebt: current.taxDebt + debt }));
    next = addLog(next, `${player.name}이 기록 보관 비용 ${paid}코인을 냈습니다${debt ? `, 부족한 ${debt}코인이 빚으로 남았습니다` : ''}.`);
  }
  return next;
}

export function beginLawAuction(state: GameState): GameState {
  const [candidates, rngState] = drawLawCandidates(state.rngState, 3);
  return addLog(
    {
      ...state,
      rngState,
      phase: 'lawAuction',
      lawAuction: { candidates, bids: {}, resolved: false }
    },
    '규칙 카드 후보 3장이 공개되었습니다.',
    'lawAuction'
  );
}

export function submitLawBid(state: GameState, playerId: string, bid: number): GameState {
  const auction = state.lawAuction;
  if (!auction) throw new Error('진행 중인 규칙 카드 처리가 없습니다.');
  const player = findPlayer(state, playerId);
  if (bid < 0 || bid > player.coins) throw new Error('제시한 코인이 보유 코인 범위를 벗어났습니다.');
  const bids = { ...auction.bids, [playerId]: bid };
  let next: GameState = { ...state, lawAuction: { ...auction, bids } };
  if (state.players.every((candidate) => bids[candidate.id] !== undefined)) next = resolveLawAuctionWinner(next);
  return next;
}

export function resolveLawAuctionWinner(state: GameState): GameState {
  const auction = state.lawAuction;
  if (!auction) return state;
  const order = state.players.map((player) => player.id);
  const startIndex = Math.max(0, order.indexOf(state.startPlayerId));
  const distance = (id: string) => {
    const index = order.indexOf(id);
    return (index - startIndex + order.length) % order.length;
  };
  const winner = [...state.players].sort((a, b) => {
    const bidDiff = (auction.bids[b.id] ?? 0) - (auction.bids[a.id] ?? 0);
    if (bidDiff !== 0) return bidDiff;
    if (a.coins !== b.coins) return a.coins - b.coins;
    return distance(a.id) - distance(b.id);
  })[0];
  const bid = auction.bids[winner.id] ?? 0;
  let next = updatePlayer(state, winner.id, (player) => ({ ...player, coins: player.coins - bid }));
  next = { ...next, lawAuction: { ...auction, winnerId: winner.id, resolved: true } };
  return addLog(next, `${winner.name}이 규칙 카드 선택권을 ${bid}코인에 가져갔습니다.`);
}

export function chooseAuctionLaw(state: GameState, lawId: string): GameState {
  const auction = state.lawAuction;
  if (!auction || !auction.resolved) throw new Error('규칙 카드 선택 단계가 아닙니다.');
  const law = auction.candidates.find((candidate) => candidate.id === lawId);
  if (!law) throw new Error('후보에 없는 규칙 카드입니다.');
  return activateLaw({ ...state, lawAuction: undefined }, law);
}
