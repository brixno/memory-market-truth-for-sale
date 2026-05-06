import { useEffect, useMemo, useState } from 'react';
import { ARCHIVE_LABELS } from '../model/constants';
import type { GameState } from '../model/types';
import { advanceFromArchiveResolution, autoResolveArchiveForAi, chooseArchiveDraw, submitCongestionBid } from '../engine/archive';
import { effectiveEvidence } from '../engine/laws';
import PlayerGate from './PlayerGate';

export default function ArchiveResolutionScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);
  const [bid, setBid] = useState(1);

  useEffect(() => {
    const next = autoResolveArchiveForAi(state);
    if (next !== state) setState(next);
  }, [state, setState]);

  const humanDraw = useMemo(() => state.archiveResolution.pendingDraws.find((draw) => state.players.find((player) => player.id === draw.playerId)?.type === 'human'), [state]);
  const humanAuction = useMemo(() => state.archiveResolution.pendingAuctions.find((auction) => !auction.resolved && auction.visitorIds.some((id) => state.players.find((player) => player.id === id)?.type === 'human' && auction.bids[id] === undefined)), [state]);
  const activePlayerId = humanDraw?.playerId ?? humanAuction?.visitorIds.find((id) => state.players.find((player) => player.id === id)?.type === 'human' && humanAuction?.bids[id] === undefined);
  const activePlayer = activePlayerId ? state.players.find((player) => player.id === activePlayerId) : undefined;

  if (activePlayer && readyPlayerId !== activePlayer.id) {
    return <PlayerGate playerName={activePlayer.name} label="정보 확인 비공개 처리" onReady={() => setReadyPlayerId(activePlayer.id)} />;
  }

  if (humanDraw && activePlayer) {
    return (
      <div className="phase-panel">
        <h2>{ARCHIVE_LABELS[humanDraw.archive]} 기록 선택</h2>
        <p>이번에 확인한 {humanDraw.recordIds.length}장 중 1장을 가져갑니다.</p>
        <div className="choice-grid">
          {humanDraw.recordIds.map((recordId) => {
            const record = state.records[recordId];
            return (
              <button className="asset-card memory" key={recordId} onClick={() => {
                setState(chooseArchiveDraw(state, activePlayer.id, recordId));
                setReadyPlayerId(null);
              }}>
                <span className="badge">묶음 {record.originalFamilyId}</span>
                <span className="badge">증거 점수 {effectiveEvidence(record, state)}</span>
                <h3>{record.textKo}</h3>
                <p>{record.recordType === 'relation' ? '연결 단서' : '단일 단서'}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (humanAuction && activePlayer) {
    const record = state.records[humanAuction.recordId];
    return (
      <div className="phase-panel">
        <h2>{ARCHIVE_LABELS[humanAuction.archive]} 몰림 처리</h2>
        <article className="asset-card memory public-card">
          <span className="badge">공개 기록</span>
          <span className="badge">묶음 {record.originalFamilyId}</span>
          <h3>{record.textKo}</h3>
          <p>증거 점수 {effectiveEvidence(record, state)}</p>
        </article>
        <label>
          {activePlayer.name} 제시 코인
          <input type="number" min={1} max={activePlayer.coins} value={bid} onChange={(event) => setBid(Number(event.target.value))} />
        </label>
        <div className="button-row">
          <button className="primary" disabled={activePlayer.coins < 1} onClick={() => {
            setState(submitCongestionBid(state, humanAuction.archive, activePlayer.id, Math.max(1, Math.min(activePlayer.coins, bid))));
            setReadyPlayerId(null);
            setBid(1);
          }}>제안 제출</button>
          <button onClick={() => {
            setState(submitCongestionBid(state, humanAuction.archive, activePlayer.id, 'pass'));
            setReadyPlayerId(null);
          }}>패스</button>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-panel">
      <h2>정보 확인 완료</h2>
      <p>지원/자금/확인소 이용권과 정보실 결과가 반영되었습니다.</p>
      <button className="primary" disabled={!state.archiveResolution.resolved} onClick={() => setState(advanceFromArchiveResolution(state))}>시장 거래로 이동</button>
    </div>
  );
}
