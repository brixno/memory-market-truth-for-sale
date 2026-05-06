import { useEffect, useMemo, useState } from 'react';
import { MODE_CONFIGS } from '../model/constants';
import type { GameState } from '../model/types';
import { aiLawBid, chooseAiLaw } from '../engine/ai';
import { activateLaw, chooseAuctionLaw, submitLawBid } from '../engine/laws';
import { endRound } from '../engine/flow';
import PlayerGate from './PlayerGate';

export default function LawAuctionScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);
  const [bid, setBid] = useState(0);
  const auction = state.lawAuction;
  const config = MODE_CONFIGS[state.mode];
  const currentHuman = useMemo(() => {
    if (!auction || auction.resolved) return undefined;
    return state.players.find((player) => player.type === 'human' && auction.bids[player.id] === undefined);
  }, [state.players, auction]);

  useEffect(() => {
    if (!auction || auction.resolved || !config.usesLawAuction) return;
    let next = state;
    let changed = false;
    for (const player of state.players) {
      if (player.type === 'ai' && next.lawAuction && next.lawAuction.bids[player.id] === undefined) {
        const [aiBid, rngState] = aiLawBid(next, player, next.lawAuction.candidates);
        next = submitLawBid({ ...next, rngState }, player.id, aiBid);
        changed = true;
      }
    }
    if (changed) setState(next);
  }, [state, auction, config.usesLawAuction, setState]);

  if (!auction) return <div className="phase-panel"><p>규칙 카드 정보가 없습니다.</p></div>;

  if (!config.usesLawAuction) {
    return (
      <div className="phase-panel">
        <h2>규칙 카드 선택</h2>
        <p>{config.nameKo} 모드는 코인 경쟁 없이 후보 3장 중 1장을 공개 적용합니다.</p>
        <div className="law-candidates">
          {auction.candidates.map((law) => (
            <button className="law-card" key={law.id} onClick={() => setState(endRound(activateLaw({ ...state, lawAuction: undefined }, law)))}>
              <span className="badge law">{law.family}</span>
              <h3>{law.nameKo}</h3>
              <p>{law.descriptionKo}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (currentHuman && readyPlayerId !== currentHuman.id) {
    return <PlayerGate playerName={currentHuman.name} label="규칙 카드 비공개 제안" onReady={() => setReadyPlayerId(currentHuman.id)} />;
  }

  if (currentHuman) {
    return (
      <div className="phase-panel">
        <h2>규칙 카드 코인 제안</h2>
        <div className="law-candidates">
          {auction.candidates.map((law) => (
            <article className="law-card" key={law.id}>
              <span className="badge law">{law.family}</span>
              <h3>{law.nameKo}</h3>
              <p>{law.descriptionKo}</p>
            </article>
          ))}
        </div>
        <label>
          {currentHuman.name} 제시 코인
          <input type="number" min={0} max={currentHuman.coins} value={bid} onChange={(event) => setBid(Number(event.target.value))} />
        </label>
        <button className="primary" onClick={() => {
          setState(submitLawBid(state, currentHuman.id, Math.max(0, Math.min(currentHuman.coins, bid))));
          setReadyPlayerId(null);
          setBid(0);
        }}>제안 제출</button>
      </div>
    );
  }

  const winner = state.players.find((player) => player.id === auction.winnerId);
  if (auction.resolved && winner?.type === 'ai') {
    const law = chooseAiLaw(auction.candidates, state, winner);
    return (
      <div className="phase-panel">
        <h2>규칙 카드 선택권</h2>
        <p>{winner.name}이 선택권을 가져갔고 <strong>{law.nameKo}</strong>을 선택합니다.</p>
        <button className="primary" onClick={() => setState(endRound(chooseAuctionLaw(state, law.id)))}>규칙 카드 적용 후 라운드 종료</button>
      </div>
    );
  }

  if (auction.resolved && winner) {
    return (
      <div className="phase-panel">
        <h2>규칙 카드 선택</h2>
        <p><strong>{winner.name}</strong>이 적용할 규칙 카드를 고르세요.</p>
        <div className="law-candidates">
          {auction.candidates.map((law) => (
            <button className="law-card" key={law.id} onClick={() => setState(endRound(chooseAuctionLaw(state, law.id)))}>
              <span className="badge law">{law.family}</span>
              <h3>{law.nameKo}</h3>
              <p>{law.descriptionKo}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div className="phase-panel"><h2>규칙 카드 처리 중</h2><p>코인 제안을 기다리고 있습니다.</p></div>;
}
