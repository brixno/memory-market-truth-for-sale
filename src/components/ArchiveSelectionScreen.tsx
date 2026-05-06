import { useEffect, useMemo, useState } from 'react';
import { ARCHIVE_LABELS } from '../model/constants';
import type { GameState } from '../model/types';
import { allArchiveChoicesMade, archiveChoicesForMode, beginArchiveResolution, selectArchive } from '../engine/archive';
import { chooseAiArchive } from '../engine/ai';
import PlayerGate from './PlayerGate';

export default function ArchiveSelectionScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let next = state;
    let changed = false;
    for (const player of state.players) {
      if (player.type === 'ai' && !next.archiveChoices[player.id]) {
        const [choice, rngState] = chooseAiArchive(next, player);
        next = selectArchive({ ...next, rngState }, player.id, choice);
        changed = true;
      }
    }
    if (changed) setState(next);
  }, [state, setState]);

  const currentHuman = useMemo(() => state.players.find((player) => player.type === 'human' && !state.archiveChoices[player.id]), [state]);

  if (currentHuman && readyPlayerId !== currentHuman.id) {
    return <PlayerGate playerName={currentHuman.name} label="방문 장소 비공개 선택" onReady={() => setReadyPlayerId(currentHuman.id)} />;
  }

  return (
    <div className="phase-panel">
      <h2>방문 장소 선택</h2>
      {currentHuman ? (
        <>
          <p><strong>{currentHuman.name}</strong>의 선택입니다.</p>
          <div className="choice-grid">
            {archiveChoicesForMode(state.mode).map((choice) => (
              <button className="choice-card" key={choice} onClick={() => {
                setState(selectArchive(state, currentHuman.id, choice));
                setReadyPlayerId(null);
              }}>
                {ARCHIVE_LABELS[choice]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p>모든 플레이어가 선택을 마쳤습니다. 동시에 공개합니다.</p>
          <div className="result-grid">
            {state.players.map((player) => (
              <div className="mini-row" key={player.id}>
                <strong>{player.name}</strong>
                <span>{ARCHIVE_LABELS[state.archiveChoices[player.id]]}</span>
              </div>
            ))}
          </div>
          <button className="primary" disabled={!allArchiveChoicesMade(state)} onClick={() => setState(beginArchiveResolution(state))}>정보 확인으로 이동</button>
        </>
      )}
    </div>
  );
}
