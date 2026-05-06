import { useCallback, useEffect, useMemo, useState } from 'react';
import { CASE_FIELDS, FIELD_LABELS, MODE_CONFIGS, RELATION_CLAIM_TEXT, RELATION_LABELS } from '../model/constants';
import type { CaseField, GameState, Predicate, RelationType } from '../model/types';
import { performAiPublicClaim } from '../engine/ai';
import { allPublicClaimsDone, skipPublicClaim, submitPublicClaim } from '../engine/claims';
import { completePublicClaimPhase } from '../engine/flow';
import { predicateToKorean } from '../engine/predicates';
import PlayerGate from './PlayerGate';

export function PredicateBuilder({ state, onChange }: { state: GameState; onChange: (predicate: Predicate) => void }) {
  const config = MODE_CONFIGS[state.mode];
  const [kind, setKind] = useState<'has' | 'lacks' | 'relation'>('has');
  const [field, setField] = useState<CaseField>('suspect');
  const [tag, setTag] = useState(state.officialTags[0] ?? '내부');
  const [relationType, setRelationType] = useState<RelationType>(config.allowedRelationTypes[0] ?? 'suspect_place');
  const [threshold, setThreshold] = useState<2 | 3>(2);

  const predicate = useMemo<Predicate>(() => {
    if (kind === 'relation') {
      const allowedThreshold = threshold === 3 && !config.allowStrongRelationClaims ? 2 : threshold;
      return { type: 'relationAtLeast', relationType, threshold: allowedThreshold, displayKo: RELATION_CLAIM_TEXT[relationType] };
    }
    const subject = field === 'suspect' ? '범인은' : field === 'place' ? '장소에는' : field === 'evidence' ? '핵심 물증에는' : '시간대에는';
    return {
      type: kind === 'has' ? 'entityHasTag' : 'entityLacksTag',
      field,
      tag,
      displayKo: `${subject} [${tag}] 키워드가 ${kind === 'has' ? '있다' : '없다'}.`
    };
  }, [kind, field, tag, relationType, threshold, config.allowStrongRelationClaims]);

  useEffect(() => onChange(predicate), [predicate, onChange]);

  return (
    <div className="builder">
      <label>
        주장 템플릿
        <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
          <option value="has">키워드가 있다</option>
          <option value="lacks">키워드가 없다</option>
          <option value="relation">연결 주장</option>
        </select>
      </label>
      {kind !== 'relation' ? (
        <>
          <label>
            항목
            <select value={field} onChange={(event) => setField(event.target.value as CaseField)}>
              {CASE_FIELDS.map((item) => <option key={item} value={item}>{FIELD_LABELS[item]}</option>)}
            </select>
          </label>
          <label>
            공식 키워드
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              {state.officialTags.map((item) => <option key={item} value={item}>[{item}]</option>)}
            </select>
          </label>
        </>
      ) : (
        <>
          <label>
            연결
            <select value={relationType} onChange={(event) => setRelationType(event.target.value as RelationType)}>
              {config.allowedRelationTypes.map((item) => <option key={item} value={item}>{RELATION_LABELS[item]}</option>)}
            </select>
          </label>
          <label>
            강도
            <select value={threshold} onChange={(event) => setThreshold(Number(event.target.value) as 2 | 3)}>
              <option value={2}>보통 연결</option>
              {config.allowStrongRelationClaims && <option value={3}>강한 연결</option>}
            </select>
          </label>
        </>
      )}
      <div className="preview-box">{predicateToKorean(predicate)}</div>
    </div>
  );
}

export default function PublicClaimScreen({ state, setState }: { state: GameState; setState: (state: GameState) => void }) {
  const [readyPlayerId, setReadyPlayerId] = useState<string | null>(null);
  const [predicate, setPredicate] = useState<Predicate>({ type: 'entityHasTag', field: 'suspect', tag: '내부', displayKo: '범인은 [내부] 키워드가 있다.' });
  const [stake, setStake] = useState(MODE_CONFIGS[state.mode].claimStakeMin);
  const handlePredicate = useCallback((next: Predicate) => setPredicate(next), []);

  useEffect(() => {
    let next = state;
    let changed = false;
    for (const player of state.players) {
      if (player.type === 'ai' && !next.publicClaimDonePlayerIds.includes(player.id)) {
        const [afterClaim, rngState] = performAiPublicClaim(next, player);
        next = { ...afterClaim, rngState };
        if (!next.publicClaimDonePlayerIds.includes(player.id)) next = skipPublicClaim(next, player.id);
        changed = true;
      }
    }
    if (changed) setState(next);
  }, [state, setState]);

  const currentHuman = state.players.find((player) => player.type === 'human' && !state.publicClaimDonePlayerIds.includes(player.id));
  const config = MODE_CONFIGS[state.mode];

  if (currentHuman && readyPlayerId !== currentHuman.id) {
    return <PlayerGate playerName={currentHuman.name} label="공개 주장 비공개 제출" onReady={() => setReadyPlayerId(currentHuman.id)} />;
  }

  if (currentHuman) {
    return (
      <div className="phase-panel">
        <h2>공개 주장 동시 제출</h2>
        <p><strong>{currentHuman.name}</strong>의 주장입니다. 모두 제출한 뒤 동시에 공개됩니다.</p>
        <PredicateBuilder state={state} onChange={handlePredicate} />
        <label>
          베팅
          <select value={stake} onChange={(event) => setStake(Number(event.target.value))}>
            {Array.from({ length: config.claimStakeMax - config.claimStakeMin + 1 }, (_, index) => config.claimStakeMin + index)
              .filter((value) => value <= currentHuman.coins)
              .map((value) => <option key={value} value={value}>{value}코인</option>)}
          </select>
        </label>
        <div className="button-row">
          <button className="primary" disabled={currentHuman.coins < stake} onClick={() => {
            setState(submitPublicClaim(state, currentHuman.id, predicate, stake));
            setReadyPlayerId(null);
          }}>비공개 제출</button>
          <button onClick={() => {
            setState(skipPublicClaim(state, currentHuman.id));
            setReadyPlayerId(null);
          }}>주장 없음</button>
        </div>
      </div>
    );
  }

  return (
    <div className="phase-panel">
      <h2>공개 주장 제출 완료</h2>
      <p>모든 제출이 끝났습니다. 이제 주장을 동시에 공개합니다.</p>
      <button className="primary" disabled={!allPublicClaimsDone(state)} onClick={() => setState(completePublicClaimPhase(state))}>동시 공개 후 다음 단계</button>
    </div>
  );
}
