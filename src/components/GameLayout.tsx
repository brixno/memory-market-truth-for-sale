import { useEffect, useMemo, useState } from 'react';
import { Clock3, Coins, FileCheck2, GraduationCap, KeyRound, MapPin, PackageSearch, Radio, Save, Shield, Upload, UserRound, UsersRound } from 'lucide-react';
import { CASE_FIELDS, FIELD_LABELS, MODE_CONFIGS, PHASE_LABELS } from '../model/constants';
import { fieldCandidates } from '../model/caseData';
import type { Candidate, CandidateMark, CaseField, GameState } from '../model/types';
import { loadGame, saveGame } from '../engine/persistence';
import ArchiveResolutionScreen from './ArchiveResolutionScreen';
import ArchiveSelectionScreen from './ArchiveSelectionScreen';
import DebugPanel from './DebugPanel';
import FinalSubmissionScreen from './FinalSubmissionScreen';
import LawAuctionScreen from './LawAuctionScreen';
import LogPanel from './LogPanel';
import MarketScreen from './MarketScreen';
import PublicClaimScreen from './PublicClaimScreen';
import RoundHeader from './RoundHeader';
import Scoreboard from './Scoreboard';

type Props = {
  state: GameState;
  setState: (state: GameState) => void;
  onNewGame: () => void;
  onRules: () => void;
  onTutorial: () => void;
};

type GameView = 'action' | 'board' | 'status';

function FieldIcon({ field, size = 18 }: { field: CaseField; size?: number }) {
  if (field === 'suspect') return <UserRound size={size} />;
  if (field === 'place') return <MapPin size={size} />;
  if (field === 'evidence') return <PackageSearch size={size} />;
  return <Clock3 size={size} />;
}

function markLabel(mark?: CandidateMark): string {
  if (mark === 'possible') return '가능';
  if (mark === 'uncertain') return '보류';
  if (mark === 'excluded') return '제외';
  return '미분류';
}

function CandidateBoard({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const human = state.players.find((player) => player.type === 'human');
  const marks = human ? state.candidateMarks[human.id] ?? {} : {};
  const [selectedId, setSelectedId] = useState(state.candidates[0]?.id ?? '');
  const selected = state.candidates.find((candidate) => candidate.id === selectedId) ?? state.candidates[0];
  const cycle = (current?: CandidateMark): CandidateMark => current === 'possible' ? 'uncertain' : current === 'uncertain' ? 'excluded' : 'possible';

  const updateMark = (candidate: Candidate) => {
    if (!human) return;
    setState({
      ...state,
      candidateMarks: {
        ...state.candidateMarks,
        [human.id]: { ...marks, [candidate.id]: cycle(marks[candidate.id]) }
      }
    });
  };

  return (
    <section className="case-board">
      <div className="board-header">
        <div>
          <span className="hud-kicker">CASE BOARD</span>
          <h2>추리 보드</h2>
        </div>
        <div className="board-legend">
          <span className="dot possible" /> 가능
          <span className="dot uncertain" /> 보류
          <span className="dot excluded" /> 제외
        </div>
      </div>

      <div className="board-grid">
        {CASE_FIELDS.map((field) => (
          <div className="suspect-lane" key={field}>
            <h3><FieldIcon field={field} /> {FIELD_LABELS[field]}</h3>
            <div className="token-stack">
              {fieldCandidates(state.candidates, field).map((candidate) => {
                const mark = marks[candidate.id];
                return (
                  <button
                    key={candidate.id}
                    className={`candidate-token ${mark ?? ''} ${selected?.id === candidate.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(candidate.id)}
                    onDoubleClick={() => updateMark(candidate)}
                    title="클릭: 상세 보기 / 더블클릭: 추적 상태 변경"
                  >
                    <strong>{candidate.nameKo}</strong>
                    <span>{candidate.tags.slice(0, 2).map((tag) => `[${tag}]`).join(' ')}</span>
                    <em>{markLabel(mark)}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {selected && (
          <aside className="candidate-inspector">
            <span className="hud-kicker">PROFILE</span>
            <h3><FieldIcon field={selected.field} /> {selected.nameKo}</h3>
            {selected.subtitleKo && <p>{selected.subtitleKo}</p>}
            <div className="tag-cloud">
              {selected.tags.map((tag) => <span key={tag}>[{tag}]</span>)}
            </div>
            <button onClick={() => updateMark(selected)}>추적 상태: {markLabel(marks[selected.id])}</button>
          </aside>
        )}
      </div>
    </section>
  );
}

function CrewPanel({ state, setState, onTutorial }: { state: GameState; setState: (state: GameState) => void; onTutorial: () => void }) {
  const maxCoins = Math.max(1, ...state.players.map((player) => player.coins));

  return (
    <aside className="crew-panel">
      <div className="panel-title">
        <UsersRound size={18} />
        <h2>작전 인원</h2>
      </div>
      <div className="crew-list">
        {state.players.map((player) => (
          <article className={`crew-card ${player.type}`} key={player.id}>
            <header>
              <strong>{player.name}</strong>
              <span>{player.type === 'human' ? 'HUMAN' : 'AI'}</span>
            </header>
            <div className="coin-bar"><span style={{ width: `${Math.max(6, (player.coins / maxCoins) * 100)}%` }} /></div>
            <div className="stat-grid">
              <span><Coins size={14} /> {player.coins}</span>
              <span><FileCheck2 size={14} /> {player.recordIds.length}</span>
              <span><KeyRound size={14} /> {player.useRightIds.length}</span>
              <span><Radio size={14} /> {player.tipIds.length}</span>
            </div>
            <small>{state.startPlayerId === player.id ? '시작 플레이어' : PHASE_LABELS[state.phase]}</small>
          </article>
        ))}
      </div>

      <div className="quick-actions">
        <button title="현재 게임 저장" onClick={() => saveGame(state)}><Save size={17} /> 저장</button>
        <button title="튜토리얼" onClick={onTutorial}><GraduationCap size={17} /> 튜토리얼</button>
        <button title="저장 불러오기" onClick={() => {
          const loaded = loadGame();
          if (loaded) setState(loaded);
        }}><Upload size={17} /> 불러오기</button>
      </div>

      <DebugPanel state={state} setState={setState} />
    </aside>
  );
}

export default function GameLayout({ state, setState, onNewGame, onRules, onTutorial }: Props) {
  const config = MODE_CONFIGS[state.mode];
  const [gameView, setGameView] = useState<GameView>('action');
  const [roundSplash, setRoundSplash] = useState<number | null>(
    state.phase === 'gameOver' || state.phase === 'finalSubmission' ? null : state.round
  );
  const currentInstruction = useMemo(() => {
    if (state.phase === 'archiveSelection') return '이번 라운드에 갈 정보실이나 창구를 선택하세요.';
    if (state.phase === 'archiveResolution') return '비공개 공식 기록을 고르거나 몰린 정보실의 가격 제안을 처리합니다.';
    if (state.phase === 'market') return '공식 기록, 증거 이용권, 제보, 코인을 거래해 마지막 점수를 설계하세요.';
    if (state.phase === 'publicClaim') return '공식 키워드와 연결 문장으로 공개 주장을 제출하세요.';
    if (state.phase === 'lawAuction') return '시장 분위기를 바꿀 규칙 카드를 선택하거나 코인을 제시하세요.';
    if (state.phase === 'finalSubmission') return '정답과 공식 증거를 확정하세요. 같은 원본 묶음은 한 번만 유효합니다.';
    return '결과를 확인하세요.';
  }, [state.phase]);

  useEffect(() => {
    setGameView('action');
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'gameOver' || state.phase === 'finalSubmission' || state.round > config.rounds) {
      setRoundSplash(null);
      return;
    }

    setRoundSplash(state.round);
    const timer = window.setTimeout(() => setRoundSplash(null), 1850);
    return () => window.clearTimeout(timer);
  }, [state.round, config.rounds]);

  useEffect(() => {
    if (state.phase === 'gameOver' || state.phase === 'finalSubmission') {
      setRoundSplash(null);
    }
  }, [state.phase]);

  const viewTabs: Array<{ id: GameView; labelKo: string; toneKo: string }> = [
    { id: 'action', labelKo: '지금 할 일', toneKo: PHASE_LABELS[state.phase] },
    { id: 'board', labelKo: '추리 보드', toneKo: '후보 정리' },
    { id: 'status', labelKo: '상황판', toneKo: '플레이어와 기록' }
  ];

  const renderPhase = () => {
    switch (state.phase) {
      case 'archiveSelection':
        return <ArchiveSelectionScreen state={state} setState={setState} />;
      case 'archiveResolution':
        return <ArchiveResolutionScreen state={state} setState={setState} />;
      case 'market':
        return <MarketScreen state={state} setState={setState} />;
      case 'publicClaim':
        return <PublicClaimScreen state={state} setState={setState} />;
      case 'lawAuction':
        return <LawAuctionScreen state={state} setState={setState} />;
      case 'finalSubmission':
        return <FinalSubmissionScreen state={state} setState={setState} />;
      case 'gameOver':
        return <Scoreboard state={state} onNewGame={onNewGame} />;
      default:
        return <div className="phase-panel">알 수 없는 단계입니다.</div>;
    }
  };

  return (
    <div className="app-shell game-shell">
      {roundSplash !== null && (
        <div className="round-splash" key={`round-splash-${roundSplash}`} aria-live="polite">
          <div className="round-splash-card">
            <span>ROUND</span>
            <strong>{roundSplash}</strong>
            <small>{config.nameKo}</small>
          </div>
        </div>
      )}
      <RoundHeader state={state} onSave={() => saveGame(state)} onRules={onRules} onNewGame={onNewGame} onTutorial={onTutorial} />
      <div className="game-grid focused-game-grid">
        <main className="stage-panel focused-stage">
          <section className="case-briefing compact-briefing">
            <div>
              <span className="hud-kicker">{state.caseEnvelopeId} · {config.nameKo}</span>
              <h2>{state.caseTitleKo}</h2>
            </div>
            <div className="objective-card">
              <Shield size={18} />
              <span>{currentInstruction}</span>
            </div>
            <details>
              <summary>사건 브리핑</summary>
              <p>{state.caseDescriptionKo}</p>
            </details>
          </section>

          <nav className="play-view-tabs" aria-label="플레이 화면 선택">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                className={gameView === tab.id ? 'active' : ''}
                type="button"
                onClick={() => setGameView(tab.id)}
              >
                <strong>{tab.labelKo}</strong>
                <span>{tab.toneKo}</span>
              </button>
            ))}
          </nav>

          {gameView === 'action' && (
            <section className="action-console focus-console" key={`action-${state.round}-${state.phase}`}>
              <div className="console-header">
                <span className="hud-kicker">ACTION CONSOLE</span>
                <h2>{PHASE_LABELS[state.phase]}</h2>
              </div>
              {renderPhase()}
            </section>
          )}

          {gameView === 'board' && <CandidateBoard state={state} setState={setState} />}

          {gameView === 'status' && (
            <section className="table-dashboard" key={`status-${state.round}-${state.phase}`}>
              <CrewPanel state={state} setState={setState} onTutorial={onTutorial} />
              <LogPanel state={state} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
