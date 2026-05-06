import { MODE_CONFIGS } from '../model/constants';
import type { GameState, SimulationOptions, SimulationResult } from '../model/types';
import { advanceFromArchiveResolution, autoResolveArchiveForAi, beginArchiveResolution, selectArchive } from './archive';
import { aiLawBid, chooseAiArchive, chooseAiFinalSubmission, chooseAiLaw, performAiPublicClaim } from './ai';
import { skipPublicClaim } from './claims';
import { completePublicClaimPhase, endRound, startPublicClaimPhase } from './flow';
import { createNewGame, updatePlayer } from './gameSetup';
import { activateLaw, chooseAuctionLaw, submitLawBid } from './laws';
import { acquireTip, copyRecord, markMarketDone } from './market';
import { finalizeScoring, rankedBreakdowns } from './scoring';
import { validateGameState } from './validation';

function makeAllAiGame(options: SimulationOptions): GameState {
  const state = createNewGame({ ...options, humanCount: 1, humanNames: ['AI-0'] });
  return {
    ...state,
    players: state.players.map((player, index) => ({ ...player, type: 'ai', name: `AI-${index + 1}` }))
  };
}

function runAiMarket(state: GameState): GameState {
  let next = state;
  for (const player of [...next.players]) {
    const current = next.players.find((candidate) => candidate.id === player.id)!;
    if (next.adminAccessPlayerIds.includes(current.id)) {
      if (next.mode === 'light' && next.tipDeck.length > 0) {
        try {
          next = acquireTip(next, current.id);
        } catch {
          // Optional action.
        }
      } else if (current.recordIds.length > 0 && current.coins >= 2) {
        try {
          next = copyRecord(next, current.id, current.recordIds.find((id) => next.records[id]?.origin === 'original') ?? current.recordIds[0]);
        } catch {
          // Optional action.
        }
      }
    }
    next = markMarketDone(next, current.id);
  }
  return next;
}

function runRound(state: GameState): GameState {
  let next = state;
  for (const player of [...next.players]) {
    const current = next.players.find((candidate) => candidate.id === player.id)!;
    const [choice, rngState] = chooseAiArchive(next, current);
    next = selectArchive({ ...next, rngState }, current.id, choice);
  }
  next = beginArchiveResolution(next);
  next = autoResolveArchiveForAi(next);
  if (!next.archiveResolution.resolved) throw new Error('AI 기록실 처리가 끝나지 않았습니다.');
  next = advanceFromArchiveResolution(next);
  next = runAiMarket(next);
  next = startPublicClaimPhase(next);
  for (const player of [...next.players]) {
    const current = next.players.find((candidate) => candidate.id === player.id)!;
    const [afterClaim, rngState] = performAiPublicClaim(next, current);
    next = { ...afterClaim, rngState };
    if (!next.publicClaimDonePlayerIds.includes(current.id)) next = skipPublicClaim(next, current.id);
  }
  next = completePublicClaimPhase(next);
  if (next.phase === 'lawAuction') {
    const auction = next.lawAuction;
    if (auction && MODE_CONFIGS[next.mode].usesLawAuction) {
      for (const player of [...next.players]) {
        const current = next.players.find((candidate) => candidate.id === player.id)!;
        const [bid, rngState] = aiLawBid(next, current, auction.candidates);
        next = submitLawBid({ ...next, rngState }, current.id, bid);
      }
      const winner = next.players.find((player) => player.id === next.lawAuction?.winnerId) ?? next.players[0];
      const chosen = chooseAiLaw(next.lawAuction?.candidates ?? [], next, winner);
      next = chooseAuctionLaw(next, chosen.id);
      next = endRound(next);
    } else if (auction) {
      const chosen = chooseAiLaw(auction.candidates, next, next.players[0]);
      next = activateLaw({ ...next, lawAuction: undefined }, chosen);
      next = endRound(next);
    }
  }
  return next;
}

function runFinal(state: GameState): GameState {
  let next = state;
  for (const player of [...next.players]) {
    const current = next.players.find((candidate) => candidate.id === player.id)!;
    const [submission, rngState] = chooseAiFinalSubmission(next, current);
    next = updatePlayer({ ...next, rngState }, current.id, (candidate) => ({ ...candidate, finalSubmission: submission }));
  }
  return finalizeScoring(next);
}

export function runAutoSimulation(options: SimulationOptions): SimulationResult {
  try {
    let state = makeAllAiGame(options);
    while (state.phase !== 'finalSubmission') state = runRound(state);
    state = runFinal(state);
    const validationErrors = validateGameState(state);
    const scoreErrors = (state.scoreBreakdowns ?? []).flatMap((score) => (Number.isNaN(score.total) ? [`${score.playerId} 점수가 NaN입니다.`] : []));
    const errors = [...validationErrors, ...scoreErrors];
    const winnerId = rankedBreakdowns(state.scoreBreakdowns ?? [])[0]?.playerId;
    return {
      success: errors.length === 0 && state.phase === 'gameOver',
      seed: options.seed,
      mode: options.mode,
      playerCount: options.playerCount,
      winnerId,
      totalRounds: MODE_CONFIGS[options.mode].rounds,
      errors,
      scoreBreakdowns: state.scoreBreakdowns
    };
  } catch (error) {
    return {
      success: false,
      seed: options.seed,
      mode: options.mode,
      playerCount: options.playerCount,
      totalRounds: MODE_CONFIGS[options.mode].rounds,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}
