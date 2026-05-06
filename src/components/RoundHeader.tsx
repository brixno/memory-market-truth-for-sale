import { Activity, BookOpen, GraduationCap, RotateCcw, Save } from 'lucide-react';
import { MODE_CONFIGS, PHASE_LABELS } from '../model/constants';
import type { GameState } from '../model/types';

type Props = {
  state: GameState;
  onSave: () => void;
  onRules: () => void;
  onNewGame: () => void;
  onTutorial: () => void;
};

export default function RoundHeader({ state, onSave, onRules, onNewGame, onTutorial }: Props) {
  const config = MODE_CONFIGS[state.mode];
  const progress = Math.round((state.round / config.rounds) * 100);

  return (
    <header className="topbar command-bar">
      <div className="brand-lockup">
        <span className="hud-kicker">MEMORY MARKET v{state.version}</span>
        <h1>기억시장: 진실을 사고파는 밤</h1>
      </div>

      <div className="mission-status">
        <div className="status-orbit">
          <Activity size={18} />
          <strong>{PHASE_LABELS[state.phase]}</strong>
        </div>
        <div className="round-meter" aria-label={`라운드 ${state.round}/${config.rounds}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{config.nameKo} · R{state.round}/{config.rounds}</small>
      </div>

      <div className="law-strip compact-feed">
        {state.activeLaws.length === 0 ? (
          <span className="feed-chip neutral">규칙 카드 없음</span>
        ) : (
          state.activeLaws.map((law) => (
            <span className="feed-chip law" key={law.id}>{law.nameKo}</span>
          ))
        )}
      </div>

      <div className="icon-actions">
        <button title="저장" onClick={onSave}><Save size={18} /></button>
        <button title="튜토리얼" onClick={onTutorial}><GraduationCap size={18} /></button>
        <button title="룰 보기" onClick={onRules}><BookOpen size={18} /></button>
        <button title="새 게임" onClick={onNewGame}><RotateCcw size={18} /></button>
      </div>
    </header>
  );
}
