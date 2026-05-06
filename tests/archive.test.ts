import { describe, expect, it } from 'vitest';
import { createNewGame } from '../src/engine/gameSetup';
import { beginArchiveResolution, chooseArchiveDraw, selectArchive, submitCongestionBid } from '../src/engine/archive';

function game() {
  return createNewGame({ mode: 'light', playerCount: 4, humanCount: 4, humanNames: ['A', 'B', 'C', 'D'], seed: 'archive', caseEnvelopeId: 'L001-light' });
}

describe('archive resolution', () => {
  it('lets 1-2 visitors choose one of up to two records', () => {
    let state = game();
    state = selectArchive(state, 'p1', 'people');
    state = selectArchive(state, 'p2', 'admin');
    state = selectArchive(state, 'p3', 'admin');
    state = selectArchive(state, 'p4', 'admin');
    state = beginArchiveResolution(state);
    const draw = state.archiveResolution.pendingDraws[0];
    expect(draw.recordIds.length).toBe(2);
    state = chooseArchiveDraw(state, draw.playerId, draw.recordIds[0]);
    expect(state.players.find((p) => p.id === draw.playerId)?.recordIds).toContain(draw.recordIds[0]);
  });

  it('handles one remaining record and empty decks', () => {
    let state = game();
    state.archives.people = [state.archives.people[0]];
    state = selectArchive(state, 'p1', 'people');
    state = selectArchive(state, 'p2', 'admin');
    state = selectArchive(state, 'p3', 'admin');
    state = selectArchive(state, 'p4', 'admin');
    state = beginArchiveResolution(state);
    expect(state.archiveResolution.pendingDraws[0].recordIds.length).toBe(1);

    state = game();
    state.archives.people = [];
    state = selectArchive(state, 'p1', 'people');
    state = selectArchive(state, 'p2', 'admin');
    state = selectArchive(state, 'p3', 'admin');
    state = selectArchive(state, 'p4', 'admin');
    state = beginArchiveResolution(state);
    expect(state.archiveResolution.pendingDraws).toHaveLength(0);
  });

  it('resolves congestion bids, pass, and tie breakers', () => {
    let state = game();
    for (const id of ['p1', 'p2', 'p3']) state = selectArchive(state, id, 'people');
    state = selectArchive(state, 'p4', 'admin');
    state.players = state.players.map((p) => p.id === 'p2' ? { ...p, coins: 5 } : p);
    state = beginArchiveResolution(state);
    expect(() => submitCongestionBid(state, 'people', 'p1', 0)).toThrow();
    state = submitCongestionBid(state, 'people', 'p1', 2);
    state = submitCongestionBid(state, 'people', 'p2', 2);
    state = submitCongestionBid(state, 'people', 'p3', 'pass');
    expect(state.players.find((p) => p.id === 'p2')?.recordIds.length).toBe(2);

    state = game();
    for (const id of ['p1', 'p2', 'p3']) state = selectArchive(state, id, 'people');
    state = selectArchive(state, 'p4', 'admin');
    state = beginArchiveResolution(state);
    const recordId = state.archiveResolution.pendingAuctions[0].recordId;
    state = submitCongestionBid(state, 'people', 'p1', 'pass');
    state = submitCongestionBid(state, 'people', 'p2', 'pass');
    state = submitCongestionBid(state, 'people', 'p3', 'pass');
    expect(state.discardedRecordIds).toContain(recordId);
  });
});

