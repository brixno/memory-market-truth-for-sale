import { CASE_FIELDS, MODE_CONFIGS, MISSIONS, STARTING_COINS } from '../model/constants';
import { buildCaseEnvelope } from '../model/caseData';
import type { GameLogEntry, GamePhase, GameState, NewGameOptions, Player } from '../model/types';
import { createRng, randomChoice, shuffle } from './rng';

export function addLog(state: GameState, messageKo: string, phase: GamePhase = state.phase): GameState {
  const entry: GameLogEntry = {
    id: `log-${state.logs.length + 1}`,
    round: state.round,
    phase,
    messageKo
  };
  return { ...state, logs: [entry, ...state.logs].slice(0, 260) };
}

export function findPlayer(state: GameState, playerId: string): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`존재하지 않는 플레이어입니다: ${playerId}`);
  return player;
}

export function updatePlayer(state: GameState, playerId: string, updater: (player: Player) => Player): GameState {
  return {
    ...state,
    players: state.players.map((player) => (player.id === playerId ? updater(player) : player))
  };
}

export function playerOrderFromStart(state: GameState): string[] {
  const ids = state.players.map((player) => player.id);
  const startIndex = Math.max(0, ids.indexOf(state.startPlayerId));
  return [...ids.slice(startIndex), ...ids.slice(0, startIndex)];
}

export function nextStartPlayerId(state: GameState): string {
  const ids = state.players.map((player) => player.id);
  const index = ids.indexOf(state.startPlayerId);
  return ids[(index + 1 + ids.length) % ids.length] ?? ids[0];
}

export function createNewGame(options: NewGameOptions): GameState {
  const config = MODE_CONFIGS[options.mode];
  const playerCount = Math.min(config.playerMax, Math.max(config.playerMin, options.playerCount));
  const humanCount = Math.min(playerCount, Math.max(1, options.humanCount));
  const seed = options.seed.trim() || `v131-${Date.now()}`;
  let rng = createRng(`${seed}-${options.mode}-${options.caseEnvelopeId}`);
  const envelope = buildCaseEnvelope(options.mode, options.caseEnvelopeId);
  const [shuffledPeople, rngAfterPeople] = shuffle(rng, envelope.archives.people);
  rng = rngAfterPeople;
  const [shuffledSpace, rngAfterSpace] = shuffle(rng, envelope.archives.space);
  rng = rngAfterSpace;
  const [shuffledEvidence, rngAfterEvidence] = shuffle(rng, envelope.archives.evidence);
  rng = rngAfterEvidence;
  const [shuffledTime, rngAfterTime] = shuffle(rng, envelope.archives.time);
  rng = rngAfterTime;
  const [tipDeck, rngAfterTips] = shuffle(rng, envelope.tipDeck);
  rng = rngAfterTips;

  const players: Player[] = [];
  for (let index = 0; index < playerCount; index += 1) {
    let missionId: string | undefined;
    if (config.usesMissions) {
      const [mission, next] = randomChoice(rng, MISSIONS);
      rng = next;
      missionId = mission.id;
    }
    players.push({
      id: `p${index + 1}`,
      name: index < humanCount ? options.humanNames[index]?.trim() || `플레이어 ${index + 1}` : `AI-${index - humanCount + 1}`,
      type: index < humanCount ? 'human' : 'ai',
      coins: STARTING_COINS,
      recordIds: [],
      tipIds: [],
      rumorIds: [],
      useRightIds: [],
      issuedUseRightIds: [],
      missionId,
      falseClaimCount: 0,
      taxDebt: 0
    });
  }

  const archives = {
    people: [...shuffledPeople],
    space: [...shuffledSpace],
    evidence: [...shuffledEvidence],
    time: [...shuffledTime]
  };
  const records = { ...envelope.records };
  for (const player of players) {
    const archiveKey = CASE_FIELDS[Math.max(0, players.indexOf(player)) % CASE_FIELDS.length] === 'suspect'
      ? 'people'
      : CASE_FIELDS[Math.max(0, players.indexOf(player)) % CASE_FIELDS.length] === 'place'
        ? 'space'
        : CASE_FIELDS[Math.max(0, players.indexOf(player)) % CASE_FIELDS.length] === 'evidence'
          ? 'evidence'
          : 'time';
    const recordId = archives[archiveKey].shift();
    if (recordId) {
      records[recordId] = { ...records[recordId], ownerId: player.id };
      player.recordIds.push(recordId);
    }
  }

  const state: GameState = {
    version: '1.3.1',
    seed,
    rngState: rng,
    mode: options.mode,
    caseEnvelopeId: envelope.id,
    caseTitleKo: envelope.titleKo,
    caseDescriptionKo: envelope.descriptionKo,
    round: 1,
    phase: 'archiveSelection',
    startPlayerId: players[0].id,
    solution: envelope.solution,
    candidates: envelope.candidates,
    officialTags: envelope.officialTags,
    relationScores: envelope.relationScores,
    archives,
    discardedRecordIds: [],
    records,
    tipDeck,
    tips: envelope.tips,
    rumors: {},
    useRights: {},
    publicClaims: [],
    pendingPublicClaims: [],
    activeLaws: [],
    players,
    logs: [],
    archiveChoices: {},
    archiveResolution: { pendingDraws: [], pendingAuctions: [], resolved: false },
    adminAccessPlayerIds: [],
    notaryCredits: {},
    marketDonePlayerIds: [],
    publicClaimDonePlayerIds: [],
    candidateMarks: Object.fromEntries(players.map((player) => [player.id, {}])),
    debugShowSolution: false,
    debugShowRelations: false
  };

  return addLog(state, `${config.nameKo} 모드, 사건 파일 ${envelope.id}가 시작되었습니다. 모든 용의선이 공개되었습니다.`);
}

export function emptyFinalEvidence(): Record<(typeof CASE_FIELDS)[number], string[]> {
  return { suspect: [], place: [], evidence: [], time: [] };
}
