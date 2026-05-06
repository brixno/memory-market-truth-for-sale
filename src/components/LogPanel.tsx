import { MessageSquareText, RadioTower } from 'lucide-react';
import type { GameState } from '../model/types';

export default function LogPanel({ state }: { state: GameState }) {
  return (
    <aside className="comms-panel">
      <div className="panel-title">
        <RadioTower size={18} />
        <h2>통신 피드</h2>
      </div>
      <div className="comms-list">
        {state.logs.slice(0, 14).map((log) => (
          <article className="comms-entry" key={log.id}>
            <span>R{log.round}</span>
            <p>{log.messageKo}</p>
          </article>
        ))}
      </div>

      <div className="panel-title claim-title">
        <MessageSquareText size={18} />
        <h2>공개 주장</h2>
      </div>
      <div className="claim-stack">
        {state.publicClaims.length === 0 && <p className="muted">아직 공개된 주장이 없습니다.</p>}
        {state.publicClaims.slice(-8).reverse().map((claim) => {
          const player = state.players.find((candidate) => candidate.id === claim.playerId);
          return (
            <article className="claim-tile" key={claim.id}>
              <header>
                <strong>{player?.name}</strong>
                <span>{claim.stake}C</span>
              </header>
              <p>{claim.textKo}</p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
