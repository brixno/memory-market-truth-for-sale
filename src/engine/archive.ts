import { ARCHIVE_LABELS, ARCHIVES, MODE_CONFIGS } from '../model/constants';
import type { Archive, ArchiveChoice, CongestionBid, GameState, PendingArchiveDraw } from '../model/types';
import { addLog, findPlayer, playerOrderFromStart, updatePlayer } from './gameSetup';

export function archiveChoicesForMode(mode: GameState['mode']): ArchiveChoice[] {
  return mode === 'light' ? ['people', 'space', 'evidence', 'time', 'admin'] : ['people', 'space', 'evidence', 'time', 'notary', 'funding'];
}

export function selectArchive(state: GameState, playerId: string, choice: ArchiveChoice): GameState {
  findPlayer(state, playerId);
  if (!archiveChoicesForMode(state.mode).includes(choice)) throw new Error('이 모드에서 선택할 수 없는 장소입니다.');
  return {
    ...addLog(state, `${findPlayer(state, playerId).name}이 ${ARCHIVE_LABELS[choice]} 선택을 마쳤습니다.`),
    archiveChoices: { ...state.archiveChoices, [playerId]: choice }
  };
}

export function allArchiveChoicesMade(state: GameState): boolean {
  return state.players.every((player) => Boolean(state.archiveChoices[player.id]));
}

function drawRecords(state: GameState, archive: Archive, count: number): [string[], GameState] {
  const deck = [...state.archives[archive]];
  const drawn = deck.splice(0, count);
  return [drawn, { ...state, archives: { ...state.archives, [archive]: deck } }];
}

export function beginArchiveResolution(state: GameState): GameState {
  let next: GameState = {
    ...state,
    phase: 'archiveResolution',
    archiveResolution: { pendingDraws: [], pendingAuctions: [], resolved: false },
    adminAccessPlayerIds: [],
    notaryCredits: {}
  };
  const pendingDraws: PendingArchiveDraw[] = [];

  for (const player of next.players) {
    const choice = next.archiveChoices[player.id];
    if (choice === 'admin') {
      next = { ...next, adminAccessPlayerIds: [...next.adminAccessPlayerIds, player.id] };
      next = addLog(next, `${player.name}이 이번 라운드 지원 데스크를 이용할 수 있습니다.`);
    }
    if (choice === 'funding') {
      next = updatePlayer(next, player.id, (current) => ({ ...current, coins: current.coins + 4 }));
      next = addLog(next, `${player.name}이 자금 데스크에서 4코인을 받았습니다.`);
    }
    if (choice === 'notary') {
      next = {
        ...next,
        adminAccessPlayerIds: [...next.adminAccessPlayerIds, player.id],
        notaryCredits: { ...next.notaryCredits, [player.id]: next.mode === 'grand' || next.mode === 'extreme' ? 2 : 1 }
      };
      next = addLog(next, `${player.name}이 확인소를 이용할 수 있습니다.`);
    }
  }

  for (const archive of ARCHIVES) {
    const visitors = next.players.filter((player) => next.archiveChoices[player.id] === archive);
    if (visitors.length === 0) continue;
    if (visitors.length <= 2) {
      for (const visitor of visitors) {
        const [drawn, newer] = drawRecords(next, archive, 2);
        next = newer;
        if (drawn.length > 0) pendingDraws.push({ playerId: visitor.id, archive, recordIds: drawn });
        else next = addLog(next, `${ARCHIVE_LABELS[archive]}에 남은 카드가 없어 ${visitor.name}은 기록을 얻지 못했습니다.`);
      }
      next = addLog(next, `${ARCHIVE_LABELS[archive]} 방문자 ${visitors.length}명이 비공개 기록 후보를 확인합니다.`);
    } else {
      const [drawn, newer] = drawRecords(next, archive, 1);
      next = newer;
      if (drawn.length === 0) {
      next = addLog(next, `${ARCHIVE_LABELS[archive]}에 남은 카드가 없어 가격 제안이 열리지 않았습니다.`);
      } else {
        next = {
          ...next,
          archiveResolution: {
            ...next.archiveResolution,
            pendingAuctions: [
              ...next.archiveResolution.pendingAuctions,
              { archive, recordId: drawn[0], visitorIds: visitors.map((visitor) => visitor.id), bids: {}, resolved: false }
            ]
          }
        };
        next = addLog(next, `${ARCHIVE_LABELS[archive]}에 ${visitors.length}명이 몰려 가격 제안이 시작되었습니다.`);
      }
    }
  }

  next = { ...next, archiveResolution: { ...next.archiveResolution, pendingDraws } };
  return markArchiveResolvedIfDone(next);
}

export function chooseArchiveDraw(state: GameState, playerId: string, chosenRecordId: string): GameState {
  const draw = state.archiveResolution.pendingDraws.find((candidate) => candidate.playerId === playerId);
  if (!draw || !draw.recordIds.includes(chosenRecordId)) throw new Error('선택 가능한 공식 기록이 아닙니다.');
  const discarded = draw.recordIds.filter((id) => id !== chosenRecordId);
  const record = state.records[chosenRecordId];
  let next = updatePlayer(state, playerId, (player) => ({ ...player, recordIds: [...player.recordIds, chosenRecordId] }));
  next = {
    ...next,
    records: { ...next.records, [chosenRecordId]: { ...record, ownerId: playerId } },
    discardedRecordIds: [...next.discardedRecordIds, ...discarded],
    archiveResolution: {
      ...next.archiveResolution,
      pendingDraws: next.archiveResolution.pendingDraws.filter((candidate) => candidate !== draw)
    }
  };
  next = addLog(next, `${findPlayer(state, playerId).name}이 ${ARCHIVE_LABELS[draw.archive]}에서 공식 기록 1장을 얻었습니다.`);
  return markArchiveResolvedIfDone(next);
}

export function submitCongestionBid(state: GameState, archive: Archive, playerId: string, bid: CongestionBid): GameState {
  const auction = state.archiveResolution.pendingAuctions.find((candidate) => candidate.archive === archive && !candidate.resolved);
  if (!auction || !auction.visitorIds.includes(playerId)) throw new Error('해당 가격 제안에 참여할 수 없습니다.');
  const player = findPlayer(state, playerId);
  if (bid !== 'pass' && (bid < 1 || bid > player.coins)) throw new Error('가격 제안은 패스 또는 1코인 이상이어야 합니다.');
  const pendingAuctions = state.archiveResolution.pendingAuctions.map((candidate) =>
    candidate === auction ? { ...candidate, bids: { ...candidate.bids, [playerId]: bid } } : candidate
  );
  let next: GameState = { ...state, archiveResolution: { ...state.archiveResolution, pendingAuctions } };
  const updated = pendingAuctions.find((candidate) => candidate.archive === archive && !candidate.resolved);
  if (updated && updated.visitorIds.every((id) => updated.bids[id] !== undefined)) next = resolveCongestionAuction(next, archive);
  return markArchiveResolvedIfDone(next);
}

export function resolveCongestionAuction(state: GameState, archive: Archive): GameState {
  const auction = state.archiveResolution.pendingAuctions.find((candidate) => candidate.archive === archive && !candidate.resolved);
  if (!auction) return state;
  const validBids = Object.entries(auction.bids).filter(([, bid]) => bid !== 'pass') as Array<[string, number]>;
  if (validBids.length === 0) {
    const next = {
      ...state,
      discardedRecordIds: [...state.discardedRecordIds, auction.recordId],
      archiveResolution: {
        ...state.archiveResolution,
        pendingAuctions: state.archiveResolution.pendingAuctions.map((candidate) => (candidate === auction ? { ...candidate, resolved: true } : candidate))
      }
    };
    return addLog(next, `${ARCHIVE_LABELS[archive]} 가격 제안에서 전원이 패스해 공개 기록을 버렸습니다.`);
  }
  const order = playerOrderFromStart(state);
  const winnerId = validBids.sort(([a, bidA], [b, bidB]) => {
    if (bidA !== bidB) return bidB - bidA;
    const coinsA = findPlayer(state, a).coins;
    const coinsB = findPlayer(state, b).coins;
    if (coinsA !== coinsB) return coinsA - coinsB;
    return order.indexOf(a) - order.indexOf(b);
  })[0][0];
  const winningBid = auction.bids[winnerId] as number;
  const record = state.records[auction.recordId];
  let next = updatePlayer(state, winnerId, (player) => ({ ...player, coins: player.coins - winningBid, recordIds: [...player.recordIds, auction.recordId] }));
  next = {
    ...next,
    records: { ...next.records, [auction.recordId]: { ...record, ownerId: winnerId } },
    archiveResolution: {
      ...next.archiveResolution,
      pendingAuctions: next.archiveResolution.pendingAuctions.map((candidate) => (candidate === auction ? { ...candidate, resolved: true } : candidate))
    }
  };
  return addLog(next, `${findPlayer(state, winnerId).name}이 ${ARCHIVE_LABELS[archive]}에서 공식 기록 1장을 ${winningBid}코인에 가져갔습니다.`);
}

export function autoResolveArchiveForAi(state: GameState): GameState {
  let next = state;
  for (const draw of [...next.archiveResolution.pendingDraws]) {
    const player = findPlayer(next, draw.playerId);
    if (player.type === 'ai') {
      const chosen = [...draw.recordIds].sort((a, b) => next.records[b].evidenceValue - next.records[a].evidenceValue)[0];
      next = chooseArchiveDraw(next, draw.playerId, chosen);
    }
  }
  for (const auction of [...next.archiveResolution.pendingAuctions.filter((item) => !item.resolved)]) {
    for (const playerId of auction.visitorIds) {
      const player = findPlayer(next, playerId);
      if (player.type === 'ai' && auction.bids[playerId] === undefined) {
        const record = next.records[auction.recordId];
        const bid = player.coins <= 1 ? 'pass' : Math.min(player.coins, Math.max(1, Math.floor(record.evidenceValue + player.coins * 0.08)));
        next = submitCongestionBid(next, auction.archive, playerId, bid);
      }
    }
  }
  return next;
}

export function markArchiveResolvedIfDone(state: GameState): GameState {
  const pendingDraws = state.archiveResolution.pendingDraws.length;
  const pendingAuctions = state.archiveResolution.pendingAuctions.filter((auction) => !auction.resolved).length;
  return {
    ...state,
    archiveResolution: {
      ...state.archiveResolution,
      resolved: pendingDraws === 0 && pendingAuctions === 0
    }
  };
}

export function advanceFromArchiveResolution(state: GameState): GameState {
  if (!state.archiveResolution.resolved) throw new Error('정보 확인이 아직 끝나지 않았습니다.');
  return addLog({ ...state, phase: 'market', marketDonePlayerIds: [] }, '시장 거래 단계가 시작되었습니다.', 'market');
}

export function archiveDeckCounts(state: GameState): Record<Archive, number> {
  return { people: state.archives.people.length, space: state.archives.space.length, evidence: state.archives.evidence.length, time: state.archives.time.length };
}

export function modeUsesAdmin(state: GameState): boolean {
  return MODE_CONFIGS[state.mode].mode === 'light';
}
