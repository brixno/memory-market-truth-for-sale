import { useMemo, useState } from 'react';
import { MODE_CONFIGS, MODE_ORDER } from '../model/constants';
import { listCaseEnvelopeOptions } from '../model/caseData';
import type { GameMode, GameState } from '../model/types';
import { createNewGame } from '../engine/gameSetup';
import { hasLegacySavedGame, hasSavedGame, loadGame } from '../engine/persistence';

type Props = {
  onStart: (state: GameState) => void;
  onLoad: (state: GameState) => void;
  onRules: () => void;
  onTutorial: () => void;
  onBack: () => void;
};

export default function SetupScreen({ onStart, onLoad, onRules, onTutorial, onBack }: Props) {
  const [mode, setMode] = useState<GameMode>('light');
  const config = MODE_CONFIGS[mode];
  const [playerCount, setPlayerCount] = useState(config.recommendedPlayers);
  const [humanCount, setHumanCount] = useState(1);
  const [seed, setSeed] = useState(() => `L001-${new Date().toISOString().slice(0, 10)}`);
  const [caseEnvelopeId, setCaseEnvelopeId] = useState(`L001-${mode}`);
  const [names, setNames] = useState<string[]>(['플레이어 1']);
  const saved = hasSavedGame();
  const legacy = hasLegacySavedGame();

  const caseOptions = listCaseEnvelopeOptions(mode);
  const humanInputs = useMemo(() => Array.from({ length: humanCount }, (_, index) => names[index] ?? `플레이어 ${index + 1}`), [humanCount, names]);

  const changeMode = (nextMode: GameMode) => {
    const nextConfig = MODE_CONFIGS[nextMode];
    setMode(nextMode);
    setPlayerCount(nextConfig.recommendedPlayers);
    setHumanCount((current) => Math.min(current, nextConfig.recommendedPlayers));
    setCaseEnvelopeId(`L001-${nextMode}`);
  };

  const start = () => {
    if (saved && !confirm('저장된 v1.3.1 게임이 있습니다. 새 게임을 시작하면 자동 저장을 덮어씁니다. 계속할까요?')) return;
    onStart(createNewGame({ mode, playerCount, humanCount, humanNames: humanInputs, seed, caseEnvelopeId }));
  };

  return (
    <main className="setup-screen">
      <section className="setup-panel">
        <div className="setup-heading">
          <div>
            <p className="eyebrow">Memory Market: Truth for Sale v1.3.1</p>
            <h1>게임 설정</h1>
          </div>
          <button type="button" onClick={onBack}>타이틀로</button>
        </div>
        {legacy && <p className="notice">구버전 저장 파일은 v1.3.1과 호환되지 않습니다. 새 게임을 시작하세요.</p>}

        <h2>모드 선택</h2>
        <div className="mode-grid">
          {MODE_ORDER.map((item) => {
            const modeConfig = MODE_CONFIGS[item];
            return (
              <button key={item} className={`mode-card ${mode === item ? 'selected' : ''}`} onClick={() => changeMode(item)}>
                <strong>{modeConfig.nameKo}</strong>
                <span>{modeConfig.playerMin}~{modeConfig.playerMax}명 · 권장 {modeConfig.recommendedPlayers}명 · {modeConfig.rounds}라운드</span>
                <span>공식 기록 {modeConfig.totalRecordCount}장 · {modeConfig.estimatedTimeKo}</span>
                <p>{modeConfig.descriptionKo}</p>
              </button>
            );
          })}
        </div>

        <h2>사건 파일</h2>
        <label>
          사건
          <select value={caseEnvelopeId} onChange={(event) => setCaseEnvelopeId(event.target.value)}>
            {caseOptions.map((option) => <option key={option.id} value={option.id}>{option.titleKo}</option>)}
          </select>
        </label>
        <p className="warning-text">{caseOptions.find((option) => option.id === caseEnvelopeId)?.warningKo}</p>

        <div className="setup-grid">
          <label>
            플레이어 수
            <select value={playerCount} onChange={(event) => {
              const value = Number(event.target.value);
              setPlayerCount(value);
              setHumanCount((current) => Math.min(current, value));
            }}>
              {Array.from({ length: config.playerMax - config.playerMin + 1 }, (_, index) => config.playerMin + index).map((value) => (
                <option key={value} value={value}>{value}명</option>
              ))}
            </select>
          </label>
          <label>
            인간 플레이어
            <select value={humanCount} onChange={(event) => setHumanCount(Number(event.target.value))}>
              {Array.from({ length: playerCount }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>{value}명</option>
              ))}
            </select>
          </label>
          <label>
            게임 코드
            <div className="inline-row">
              <input value={seed} onChange={(event) => setSeed(event.target.value)} />
              <button type="button" onClick={() => setSeed(`L001-${Math.random().toString(36).slice(2, 10)}`)}>랜덤</button>
            </div>
          </label>
        </div>

        <div className="name-list">
          {humanInputs.map((name, index) => (
            <label key={index}>
              인간 {index + 1} 이름
              <input value={name} onChange={(event) => {
                const copy = [...names];
                copy[index] = event.target.value;
                setNames(copy);
              }} />
            </label>
          ))}
        </div>

        <div className="button-row">
          <button className="primary" onClick={start}>게임 시작</button>
          <button onClick={onTutorial}>튜토리얼</button>
          <button onClick={onRules}>룰 보기</button>
          <button disabled={!saved} onClick={() => {
            const loaded = loadGame();
            if (loaded) onLoad(loaded);
          }}>v1.3.1 저장 불러오기</button>
        </div>
      </section>
    </main>
  );
}
