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

type SetupStep = 'mode' | 'case' | 'players';

const SETUP_STEPS: Array<{ id: SetupStep; titleKo: string; hintKo: string }> = [
  { id: 'mode', titleKo: '모드', hintKo: '게임의 무게를 고릅니다' },
  { id: 'case', titleKo: '사건', hintKo: '오늘 풀 사건을 고릅니다' },
  { id: 'players', titleKo: '인원', hintKo: '플레이어를 정합니다' }
];

export default function SetupScreen({ onStart, onLoad, onRules, onTutorial, onBack }: Props) {
  const [setupStep, setSetupStep] = useState<SetupStep>('mode');
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
  const selectedCase = caseOptions.find((option) => option.id === caseEnvelopeId) ?? caseOptions[0];
  const humanInputs = useMemo(() => Array.from({ length: humanCount }, (_, index) => names[index] ?? `플레이어 ${index + 1}`), [humanCount, names]);
  const currentStepIndex = SETUP_STEPS.findIndex((step) => step.id === setupStep);
  const goNext = () => setSetupStep(SETUP_STEPS[Math.min(SETUP_STEPS.length - 1, currentStepIndex + 1)].id);
  const goBack = () => setSetupStep(SETUP_STEPS[Math.max(0, currentStepIndex - 1)].id);

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
      <section className="setup-panel setup-panel-progressive">
        <div className="setup-heading">
          <div>
            <p className="eyebrow">Memory Market: Truth for Sale v1.3.1</p>
            <h1>게임 설정</h1>
          </div>
          <button type="button" onClick={onBack}>타이틀로</button>
        </div>
        {legacy && <p className="notice">구버전 저장 파일은 v1.3.1과 호환되지 않습니다. 새 게임을 시작하세요.</p>}

        <nav className="setup-stepper" aria-label="게임 설정 단계">
          {SETUP_STEPS.map((step, index) => (
            <button
              type="button"
              key={step.id}
              className={`setup-step-tab ${setupStep === step.id ? 'active' : ''} ${index < currentStepIndex ? 'done' : ''}`}
              onClick={() => setSetupStep(step.id)}
            >
              <span>{index + 1}</span>
              <strong>{step.titleKo}</strong>
              <small>{step.hintKo}</small>
            </button>
          ))}
        </nav>

        <div className="setup-summary-strip">
          <span>모드 <strong>{config.nameKo}</strong></span>
          <span>사건 <strong>{selectedCase?.titleKo ?? '선택 대기'}</strong></span>
          <span>인원 <strong>{playerCount}명 중 인간 {humanCount}명</strong></span>
        </div>

        {setupStep === 'mode' && (
          <section className="setup-step-card">
            <div className="setup-step-title">
              <p className="eyebrow">STEP 1</p>
              <h2>얼마나 묵직하게 플레이할까요?</h2>
              <p>먼저 게임의 길이와 복잡도를 고릅니다. 자세한 규칙은 선택한 모드만 펼쳐서 볼 수 있습니다.</p>
            </div>
            <div className="mode-grid compact-mode-grid">
              {MODE_ORDER.map((item) => {
                const modeConfig = MODE_CONFIGS[item];
                return (
                  <button key={item} className={`mode-card compact-mode-card ${mode === item ? 'selected' : ''}`} onClick={() => changeMode(item)}>
                    <strong>{modeConfig.nameKo}</strong>
                    <span>{modeConfig.playerMin}~{modeConfig.playerMax}명 · {modeConfig.rounds}라운드</span>
                    <span>{modeConfig.estimatedTimeKo}</span>
                  </button>
                );
              })}
            </div>
            <details className="setup-details">
              <summary>{config.nameKo} 자세히 보기</summary>
              <p>{config.descriptionKo}</p>
              <div className="setup-fact-grid">
                <span>권장 {config.recommendedPlayers}명</span>
                <span>공식 기록 {config.totalRecordCount}장</span>
                <span>공개 주장 {config.claimStakeMin}~{config.claimStakeMax}코인</span>
                <span>{config.usesLaws ? '규칙 카드 사용' : '규칙 카드 없음'}</span>
              </div>
            </details>
            <div className="setup-nav-row">
              <button onClick={onTutorial}>튜토리얼</button>
              <button onClick={onRules}>룰 보기</button>
              <button className="primary" onClick={goNext}>다음: 사건 파일</button>
            </div>
          </section>
        )}

        {setupStep === 'case' && (
          <section className="setup-step-card">
            <div className="setup-step-title">
              <p className="eyebrow">STEP 2</p>
              <h2>오늘의 사건 파일을 고르세요</h2>
              <p>지금은 L001 사건을 중심으로 플레이합니다. 같은 사건을 이미 해본 사람은 정답을 알고 있을 수 있습니다.</p>
            </div>
            <article className="case-file-card">
              <label>
                사건 파일
                <select value={caseEnvelopeId} onChange={(event) => setCaseEnvelopeId(event.target.value)}>
                  {caseOptions.map((option) => <option key={option.id} value={option.id}>{option.titleKo}</option>)}
                </select>
              </label>
              <p>{selectedCase?.warningKo}</p>
            </article>
            <div className="setup-nav-row">
              <button onClick={goBack}>이전</button>
              <button className="primary" onClick={goNext}>다음: 인원 설정</button>
            </div>
          </section>
        )}

        {setupStep === 'players' && (
          <section className="setup-step-card">
            <div className="setup-step-title">
              <p className="eyebrow">STEP 3</p>
              <h2>플레이어를 정하면 바로 시작합니다</h2>
              <p>부족한 자리는 AI가 채웁니다. 인간 플레이어가 여러 명이면 이름만 입력해 주세요.</p>
            </div>
            <div className="setup-grid">
              <label>
                전체 플레이어
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
            </div>

            <div className="name-list compact-name-list">
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

            <details className="setup-details">
              <summary>고급 설정</summary>
              <label>
                게임 코드
                <div className="inline-row">
                  <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                  <button type="button" onClick={() => setSeed(`L001-${Math.random().toString(36).slice(2, 10)}`)}>랜덤</button>
                </div>
              </label>
            </details>

            <div className="setup-nav-row">
              <button onClick={goBack}>이전</button>
              <button disabled={!saved} onClick={() => {
                const loaded = loadGame();
                if (loaded) onLoad(loaded);
              }}>저장 불러오기</button>
              <button className="primary" onClick={start}>게임 시작</button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
