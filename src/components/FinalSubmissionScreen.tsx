import { useEffect, useMemo, useState } from 'react';
import { CASE_FIELDS, FIELD_LABELS, MODE_CONFIGS } from '../model/constants';
import { fieldCandidates } from '../model/caseData';
import type { CaseField, CaseSolution, FinalSubmission, GameState } from '../model/types';
import { chooseAiFinalSubmission } from '../engine/ai';
import { updatePlayer } from '../engine/gameSetup';
import { effectiveEvidence } from '../engine/laws';
import { resolveEvidenceRecord } from '../engine/market';
import { getPredicateFields } from '../engine/predicates';
import { finalizeScoring } from '../engine/scoring';
import PlayerGate from './PlayerGate';

function emptyEvidence(): FinalSubmission['evidenceByField'] {
  return { suspect: [], place: [], evidence: [], time: [] };
}

function initialGuesses(state: GameState): CaseSolution {
  return {
    suspectId: fieldCandidates(state.candidates, 'suspect')[0].id,
    placeId: fieldCandidates(state.candidates, 'place')[0].id,
    evidenceId: fieldCandidates(state.candidates, 'evidence')[0].id,
    timeId: fieldCandidates(state.candidates, 'time')[0].id
  };
}

export default function FinalSubmissionScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<CaseSolution>(() => initialGuesses(state));
  const [evidenceByField, setEvidenceByField] = useState<FinalSubmission['evidenceByField']>(() => emptyEvidence());

  useEffect(() => {
    let next = state;
    let changed = false;
    for (const player of state.players) {
      if (player.type === 'ai' && !player.finalSubmission) {
        const [submission, rngState] = chooseAiFinalSubmission(next, player);
        next = updatePlayer({ ...next, rngState }, player.id, (candidate) => ({ ...candidate, finalSubmission: submission }));
        changed = true;
      }
    }
    if (changed) {
      setState(next.players.every((player) => Boolean(player.finalSubmission)) ? finalizeScoring(next) : next);
    }
  }, [state, setState]);

  const currentHuman = useMemo(() => state.players.find((player) => player.type === 'human' && !player.finalSubmission), [state.players]);

  useEffect(() => {
    if (currentHuman) {
      setGuesses(initialGuesses(state));
      setEvidenceByField(emptyEvidence());
    }
  }, [currentHuman?.id]);

  if (currentHuman && readyPlayerId !== currentHuman.id) {
    return <PlayerGate playerName={currentHuman.name} label="최종 제출 비공개 단계" onReady={() => setReadyPlayerId(currentHuman.id)} />;
  }

  if (!currentHuman) {
    return (
      <div className="phase-panel">
        <h2>최종 제출 정리 중</h2>
        <button className="primary" onClick={() => setState(finalizeScoring(state))}>점수 계산</button>
      </div>
    );
  }

  const config = MODE_CONFIGS[state.mode];
  const evidenceIds = [...currentHuman.recordIds, ...currentHuman.useRightIds];
  const usedFamiliesOutside = (field: CaseField) => new Set(
    CASE_FIELDS.filter((item) => item !== field).flatMap((item) => evidenceByField[item].map((id) => resolveEvidenceRecord(state, currentHuman.id, id).record?.originalFamilyId).filter(Boolean) as string[])
  );
  const usedIdsOutside = (field: CaseField) => new Set(CASE_FIELDS.filter((item) => item !== field).flatMap((item) => evidenceByField[item]));

  const toggleEvidence = (field: CaseField, id: string) => {
    setEvidenceByField((current) => {
      const selected = current[field].includes(id);
      const nextField = selected ? current[field].filter((item) => item !== id) : current[field].length < config.evidencePerField ? [...current[field], id] : current[field];
      return { ...current, [field]: nextField };
    });
  };

  const submit = () => {
    const submission: FinalSubmission = { guesses, evidenceByField };
    let next = updatePlayer(state, currentHuman.id, (player) => ({ ...player, finalSubmission: submission }));
    if (next.players.every((player) => Boolean(player.finalSubmission))) next = finalizeScoring(next);
    setState(next);
    setReadyPlayerId(null);
  };

  return (
    <div className="phase-panel final-panel">
      <h2>최종 제출: {currentHuman.name}</h2>
      <div className="guess-grid">
        {CASE_FIELDS.map((field) => (
          <label key={field}>
            {FIELD_LABELS[field]}
            <select value={guesses[`${field}Id` as keyof CaseSolution]} onChange={(event) => setGuesses((current) => ({ ...current, [`${field}Id`]: event.target.value }))}>
              {fieldCandidates(state.candidates, field).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.nameKo}</option>)}
            </select>
          </label>
        ))}
      </div>
      {CASE_FIELDS.map((field) => {
        const usedIds = usedIdsOutside(field);
        const usedFamilies = usedFamiliesOutside(field);
        return (
          <section className="evidence-picker" key={field}>
            <h3>{FIELD_LABELS[field]} 증거 붙이기</h3>
            <p className="muted">공식 기록과 증거 이용권만 표시됩니다. 같은 원본 묶음은 한 번만 점수로 인정됩니다.</p>
            <div className="evidence-list">
              {evidenceIds.map((id) => {
                const { record, useRight } = resolveEvidenceRecord(state, currentHuman.id, id);
                if (!record) return null;
                const selected = evidenceByField[field].includes(id);
                let reason = '';
                if (!getPredicateFields(record.predicate).includes(field)) reason = `이 증거는 ${FIELD_LABELS[field]}에 붙일 수 없습니다.`;
                if (usedIds.has(id)) reason = '이미 다른 항목에 사용한 증거입니다.';
                if (usedFamilies.has(record.originalFamilyId)) reason = `원본 묶음 ${record.originalFamilyId}가 이미 사용되었습니다.`;
                if (!selected && evidenceByField[field].length >= config.evidencePerField) reason = '이 항목의 증거 슬롯이 가득 찼습니다.';
                return (
                  <label className={`evidence-option ${reason && !selected ? 'disabled' : ''}`} key={`${field}-${id}`}>
                    <input type="checkbox" checked={selected} disabled={Boolean(reason && !selected)} onChange={() => toggleEvidence(field, id)} />
                    <span>
                      <strong>{useRight ? '증거 이용권' : record.origin === 'original' ? '원본' : '공식 복사본'}</strong>
                      {' '}묶음 {record.originalFamilyId} · {record.textKo} · 증거 점수 {effectiveEvidence(record, state)}
                      {reason && !selected && <em>{reason}</em>}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
      <button className="primary" onClick={submit}>최종 제출 확정</button>
    </div>
  );
}
