import { useState } from 'react';
import { CASE_FIELDS, FIELD_LABELS, MODE_CONFIGS, MODE_ORDER, RELATION_LABELS } from '../model/constants';
import type { GameState } from '../model/types';
import { caseRelationScoreSummary } from '../engine/caseValidation';
import { clearSavedGame } from '../engine/persistence';
import { solutionCandidateId } from '../engine/predicates';
import { runAutoSimulation } from '../engine/simulation';
import { validateGameState } from '../engine/validation';

export default function DebugPanel({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('');
  const nameOf = (id: string) => state.candidates.find((candidate) => candidate.id === id)?.nameKo ?? id;

  return (
    <section className="debug-panel">
      <button onClick={() => setOpen((current) => !current)}>디버그 {open ? '접기' : '열기'}</button>
      {open && (
        <div>
          <label className="toggle-row">
            <input type="checkbox" checked={state.debugShowSolution} onChange={(event) => setState({ ...state, debugShowSolution: event.target.checked })} />
            정답 보기
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={state.debugShowRelations} onChange={(event) => setState({ ...state, debugShowRelations: event.target.checked })} />
            관계 점수 보기
          </label>
          {state.debugShowSolution && <p className="solution-debug">{CASE_FIELDS.map((field) => `${FIELD_LABELS[field]} ${nameOf(solutionCandidateId(state.solution, field))}`).join(' · ')}</p>}
          {state.debugShowRelations && (
            <pre className="debug-output">{Object.entries(caseRelationScoreSummary(state.solution, state.relationScores)).map(([key, value]) => `${RELATION_LABELS[key as keyof typeof RELATION_LABELS]}: ${value}`).join('\n')}</pre>
          )}
          <div className="button-row">
            <button onClick={() => {
              const errors = validateGameState(state);
              setResult(errors.length === 0 ? '모든 공식 기록과 상태 검사를 통과했습니다.' : errors.join('\n'));
            }}>모든 공식 기록 검사</button>
            <button onClick={() => {
              const results = Array.from({ length: 20 }, (_, index) => runAutoSimulation({ mode: 'light', playerCount: 5, seed: `light-debug-${index}`, caseEnvelopeId: 'L001-light' }));
              const failed = results.filter((item) => !item.success);
              setResult(failed.length === 0 ? '라이트 20회 자동 시뮬레이션 성공' : failed.map((item) => `${item.seed}: ${item.errors.join(', ')}`).join('\n'));
            }}>라이트 20회 자동 시뮬레이션</button>
            <button onClick={() => {
              const results = Array.from({ length: 10 }, (_, index) => runAutoSimulation({ mode: 'standard_basic', playerCount: 6, seed: `std-debug-${index}`, caseEnvelopeId: 'L001-standard_basic' }));
              const failed = results.filter((item) => !item.success);
              setResult(failed.length === 0 ? '스탠다드 10회 자동 시뮬레이션 성공' : failed.map((item) => `${item.seed}: ${item.errors.join(', ')}`).join('\n'));
            }}>스탠다드 10회 자동 시뮬레이션</button>
            <button onClick={() => {
              const results = MODE_ORDER.map((mode) => runAutoSimulation({ mode, playerCount: MODE_CONFIGS[mode].recommendedPlayers, seed: `all-${mode}`, caseEnvelopeId: `L001-${mode}` }));
              const failed = results.filter((item) => !item.success);
              setResult(failed.length === 0 ? '모든 모드 1회씩 자동 시뮬레이션 성공' : failed.map((item) => `${item.mode}: ${item.errors.join(', ')}`).join('\n'));
            }}>모든 모드 1회</button>
            <button onClick={() => {
              clearSavedGame();
              setResult('localStorage 저장 데이터를 지웠습니다.');
            }}>localStorage 초기화</button>
          </div>
          {result && <pre className="debug-output">{result}</pre>}
        </div>
      )}
    </section>
  );
}
