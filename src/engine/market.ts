import { MODE_CONFIGS } from '../model/constants';
import type { GameState, NotarizedRecord, Predicate, RumorCard, UnconfirmedTip, UseRight } from '../model/types';
import { addLog, findPlayer, updatePlayer } from './gameSetup';
import { evaluatePredicate, predicateToKorean, validatePredicateTags } from './predicates';

function assertCoins(coins: number, amount: number) {
  if (amount < 0 || coins < amount) throw new Error('코인은 음수가 될 수 없습니다.');
}

function nextId(prefix: string, state: GameState): string {
  const mapSize =
    prefix === 'copy'
      ? Object.keys(state.records).length
      : prefix === 'right'
        ? Object.keys(state.useRights).length
        : prefix === 'rumor'
          ? Object.keys(state.rumors).length
          : Object.keys(state.tips).length;
  return `${prefix}-${state.round}-${mapSize + 1}`;
}

export function transferCoins(state: GameState, fromId: string, toId: string, amount: number): GameState {
  const from = findPlayer(state, fromId);
  const to = findPlayer(state, toId);
  assertCoins(from.coins, amount);
  let next = updatePlayer(state, fromId, (player) => ({ ...player, coins: player.coins - amount }));
  next = updatePlayer(next, toId, (player) => ({ ...player, coins: player.coins + amount }));
  return addLog(next, `${from.name}이 ${to.name}에게 ${amount}코인을 지급했습니다.`);
}

export function sellRecord(state: GameState, sellerId: string, buyerId: string, recordId: string, price: number): GameState {
  const seller = findPlayer(state, sellerId);
  const buyer = findPlayer(state, buyerId);
  const record = state.records[recordId];
  if (!record || record.ownerId !== sellerId || !seller.recordIds.includes(recordId)) throw new Error('판매자가 해당 공식 기록을 가지고 있지 않습니다.');
  assertCoins(buyer.coins, price);
  let next = updatePlayer(state, buyerId, (player) => ({ ...player, coins: player.coins - price, recordIds: [...player.recordIds, recordId] }));
  next = updatePlayer(next, sellerId, (player) => ({ ...player, coins: player.coins + price, recordIds: player.recordIds.filter((id) => id !== recordId) }));
  next = { ...next, records: { ...next.records, [recordId]: { ...record, ownerId: buyerId } } };
  return addLog(next, `${seller.name}이 ${buyer.name}에게 공식 기록 1장을 ${price}코인에 판매했습니다.`);
}

export function existingUseRightsForRecord(state: GameState, recordId: string): UseRight[] {
  return Object.values(state.useRights).filter((right) => right.recordId === recordId);
}

export function registerUseRight(
  state: GameState,
  issuerId: string,
  borrowerId: string,
  recordId: string,
  price: number,
  waiveFee = false
): GameState {
  const issuer = findPlayer(state, issuerId);
  const borrower = findPlayer(state, borrowerId);
  const record = state.records[recordId];
  if (!record || record.ownerId !== issuerId || !issuer.recordIds.includes(recordId)) throw new Error('빌려주는 사람이 해당 공식 기록을 가지고 있지 않습니다.');
  if (Object.values(state.useRights).some((right) => right.recordId === recordId && right.borrowerId === borrowerId)) {
    throw new Error('같은 사람에게 같은 기록의 증거 이용권을 두 번 만들 수 없습니다.');
  }
  const fee = waiveFee ? 0 : 1;
  assertCoins(borrower.coins, price + fee);
  if (waiveFee && !state.adminAccessPlayerIds.includes(issuerId) && !state.adminAccessPlayerIds.includes(borrowerId)) {
    throw new Error('처리비 면제는 지원 데스크 또는 확인소를 이용할 수 있는 사람만 쓸 수 있습니다.');
  }
  const id = nextId('right', state);
  const right: UseRight = {
    id,
    originalFamilyId: record.originalFamilyId,
    recordId,
    issuerId,
    borrowerId,
    price,
    createdRound: state.round,
    used: false
  };
  let next = updatePlayer(state, borrowerId, (player) => ({ ...player, coins: player.coins - price - fee, useRightIds: [...player.useRightIds, id] }));
  next = updatePlayer(next, issuerId, (player) => ({ ...player, coins: player.coins + price, issuedUseRightIds: [...player.issuedUseRightIds, id] }));
  next = { ...next, useRights: { ...next.useRights, [id]: right } };
  return addLog(next, `${issuer.name}이 ${borrower.name}에게 증거 이용권 1장을 ${price}코인에 만들었습니다${fee ? ' 처리비 1코인이 지불되었습니다.' : ' 처리비가 면제되었습니다.'}`);
}

export function copyRecord(state: GameState, playerId: string, recordId: string): GameState {
  const player = findPlayer(state, playerId);
  const record = state.records[recordId];
  if (!record || record.ownerId !== playerId || !player.recordIds.includes(recordId)) throw new Error('복사할 공식 기록을 가지고 있지 않습니다.');
  if (record.origin !== 'original') throw new Error('공식 복사본은 원본 공식 기록에서만 만들 수 있습니다.');
  if (!state.adminAccessPlayerIds.includes(playerId)) throw new Error('이번 라운드에는 공식 복사본을 만들 수 없습니다.');
  const creditCost = state.mode === 'grand' || state.mode === 'extreme' ? 1 : 0;
  if (creditCost && (state.notaryCredits[playerId] ?? 0) < creditCost) throw new Error('확인 포인트가 부족합니다.');
  assertCoins(player.coins, 2);
  const id = nextId('copy', state);
  const copy: NotarizedRecord = {
    ...record,
    id,
    origin: 'certified_copy',
    evidenceValue: Math.max(0, record.evidenceValue - 1),
    ownerId: playerId,
    sourceOriginalId: record.id
  };
  let next = updatePlayer(state, playerId, (current) => ({ ...current, coins: current.coins - 2, recordIds: [...current.recordIds, id] }));
  next = {
    ...next,
    records: { ...next.records, [id]: copy },
    notaryCredits: creditCost ? { ...next.notaryCredits, [playerId]: (next.notaryCredits[playerId] ?? 0) - creditCost } : next.notaryCredits
  };
  return addLog(next, `${player.name}이 원본 묶음 ${record.originalFamilyId}의 공식 복사본을 만들었습니다.`);
}

export function acquireTip(state: GameState, playerId: string): GameState {
  const player = findPlayer(state, playerId);
  if (!MODE_CONFIGS[state.mode].usesTips) throw new Error('이 모드에서는 확인 안 된 제보를 사용하지 않습니다.');
  if (!state.adminAccessPlayerIds.includes(playerId)) throw new Error('제보를 얻으려면 지원 데스크 또는 확인소 이용이 필요합니다.');
  const [tipId, ...rest] = state.tipDeck;
  if (!tipId) throw new Error('확인 안 된 제보 더미가 비었습니다.');
  const tip = state.tips[tipId];
  let next = updatePlayer(state, playerId, (current) => ({ ...current, tipIds: [...current.tipIds, tipId] }));
  next = { ...next, tipDeck: rest, tips: { ...next.tips, [tipId]: { ...tip, ownerId: playerId } } };
  return addLog(next, `${player.name}이 확인 안 된 제보 1장을 얻었습니다.`);
}

export function auditTip(state: GameState, playerId: string, tipId: string): [GameState, boolean] {
  const player = findPlayer(state, playerId);
  const tip = state.tips[tipId];
  if (!tip || tip.ownerId !== playerId || !player.tipIds.includes(tipId)) throw new Error('확인할 제보를 가지고 있지 않습니다.');
  if (!state.adminAccessPlayerIds.includes(playerId)) throw new Error('이번 라운드에는 제보를 확인할 수 없습니다.');
  const creditCost = state.mode === 'grand' || state.mode === 'extreme' ? 1 : 0;
  if (creditCost && (state.notaryCredits[playerId] ?? 0) < creditCost) throw new Error('확인 포인트가 부족합니다.');
  assertCoins(player.coins, 1);
  const result = evaluatePredicate(tip.predicate, state.solution, state.candidates, state.relationScores);
  let next = updatePlayer(state, playerId, (current) => ({ ...current, coins: current.coins - 1 }));
  next = {
    ...next,
    tips: { ...next.tips, [tipId]: { ...tip, auditedByPlayerIds: Array.from(new Set([...tip.auditedByPlayerIds, playerId])) } },
    notaryCredits: creditCost ? { ...next.notaryCredits, [playerId]: (next.notaryCredits[playerId] ?? 0) - creditCost } : next.notaryCredits
  };
  next = addLog(next, `${player.name}이 제보 1장의 참/거짓을 확인했습니다.`);
  return [next, result];
}

export function transferTip(state: GameState, fromId: string, toId: string, tipId: string, price: number): GameState {
  const from = findPlayer(state, fromId);
  const to = findPlayer(state, toId);
  const tip = state.tips[tipId];
  if (!tip || tip.ownerId !== fromId || !from.tipIds.includes(tipId)) throw new Error('제보 소유자가 아닙니다.');
  assertCoins(to.coins, price);
  let next = updatePlayer(state, toId, (player) => ({ ...player, coins: player.coins - price, tipIds: [...player.tipIds, tipId] }));
  next = updatePlayer(next, fromId, (player) => ({ ...player, coins: player.coins + price, tipIds: player.tipIds.filter((id) => id !== tipId) }));
  next = { ...next, tips: { ...next.tips, [tipId]: { ...tip, ownerId: toId } } };
  return addLog(next, `${from.name}이 ${to.name}에게 확인 안 된 제보 1장을 ${price}코인에 넘겼습니다.`);
}

export function createRumor(state: GameState, creatorId: string, predicate: Predicate): GameState {
  const creator = findPlayer(state, creatorId);
  const config = MODE_CONFIGS[state.mode];
  if (!config.allowsRumors) throw new Error('이 모드에서는 자유 소문 생성이 비활성화되어 있습니다.');
  if (config.rumorLimitPerPlayer !== undefined) {
    const created = Object.values(state.rumors).filter((rumor) => rumor.creatorId === creatorId).length;
    if (created >= config.rumorLimitPerPlayer) throw new Error('이 모드의 소문 생성 횟수를 모두 사용했습니다.');
  }
  const tagErrors = validatePredicateTags(predicate, state.officialTags);
  if (tagErrors.length > 0) throw new Error(tagErrors.join('\n'));
  assertCoins(creator.coins, 1);
  const id = nextId('rumor', state);
  const rumor: RumorCard = {
    id,
    predicate,
    textKo: predicateToKorean(predicate),
    creatorId,
    ownerId: creatorId,
    auditedByPlayerIds: []
  };
  let next = updatePlayer(state, creatorId, (player) => ({ ...player, coins: player.coins - 1, rumorIds: [...player.rumorIds, id] }));
  next = { ...next, rumors: { ...next.rumors, [id]: rumor } };
  return addLog(next, `${creator.name}이 소문 카드 1장을 만들었습니다.`);
}

export function markMarketDone(state: GameState, playerId: string): GameState {
  if (state.marketDonePlayerIds.includes(playerId)) return state;
  return addLog({ ...state, marketDonePlayerIds: [...state.marketDonePlayerIds, playerId] }, `${findPlayer(state, playerId).name}이 시장 거래를 마쳤습니다.`);
}

export function resolveEvidenceRecord(state: GameState, playerId: string, evidenceId: string): { record?: NotarizedRecord; useRight?: UseRight } {
  const record = state.records[evidenceId];
  if (record && record.ownerId === playerId) return { record };
  const right = state.useRights[evidenceId];
  if (right && right.borrowerId === playerId) return { record: state.records[right.recordId], useRight: right };
  return {};
}

export function canUseAdminAction(state: GameState, playerId: string): boolean {
  return state.adminAccessPlayerIds.includes(playerId);
}
