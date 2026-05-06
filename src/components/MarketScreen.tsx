import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../model/types';
import { acquireTip, copyRecord, markMarketDone } from '../engine/market';
import { startPublicClaimPhase } from '../engine/flow';
import CardList from './CardList';
import PlayerGate from './PlayerGate';
import TradePanel from './TradePanel';

export default function MarketScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let next = state;
    let changed = false;
    for (const player of state.players) {
      if (player.type === 'ai' && !next.marketDonePlayerIds.includes(player.id)) {
        const current = next.players.find((candidate) => candidate.id === player.id)!;
        if (next.adminAccessPlayerIds.includes(current.id)) {
          if (next.mode === 'light' && next.tipDeck.length > 0) {
            try { next = acquireTip(next, current.id); } catch { /* optional */ }
          } else if (current.recordIds.length > 0 && current.coins >= 2) {
            const original = current.recordIds.find((id) => next.records[id]?.origin === 'original');
            if (original) {
              try { next = copyRecord(next, current.id, original); } catch { /* optional */ }
            }
          }
        }
        next = markMarketDone(next, current.id);
        changed = true;
      }
    }
    if (changed) setState(next);
  }, [state, setState]);

  const currentHuman = useMemo(() => state.players.find((player) => player.type === 'human' && !state.marketDonePlayerIds.includes(player.id)), [state]);

  if (currentHuman && readyPlayerId !== currentHuman.id) {
    return <PlayerGate playerName={currentHuman.name} label="거래 비공개 턴" onReady={() => setReadyPlayerId(currentHuman.id)} />;
  }

  if (currentHuman) {
    return (
      <div className="market-view">
        <section className="phase-panel">
          <h2>거래: {currentHuman.name}</h2>
          <p>공식 기록, 공식 복사본, 증거 이용권, 제보와 코인을 주고받을 수 있습니다.</p>
          <CardList state={state} player={currentHuman} />
          <div className="button-row">
            <button className="primary" onClick={() => {
              setState(markMarketDone(state, currentHuman.id));
              setReadyPlayerId(null);
            }}>거래 단계 종료</button>
            <button onClick={() => {
              let next = state;
              for (const player of state.players) {
                if (!next.marketDonePlayerIds.includes(player.id)) next = markMarketDone(next, player.id);
              }
              setState(startPublicClaimPhase(next));
            }}>전체 거래 건너뛰기</button>
          </div>
        </section>
        <TradePanel state={state} setState={setState} player={currentHuman} />
      </div>
    );
  }

  const allDone = state.players.every((player) => state.marketDonePlayerIds.includes(player.id));
  return (
    <div className="phase-panel">
      <h2>거래 완료</h2>
      <p>모든 플레이어가 거래 행동을 마쳤습니다.</p>
      <button className="primary" disabled={!allDone} onClick={() => setState(startPublicClaimPhase(state))}>공개 주장 단계로 이동</button>
    </div>
  );
}
