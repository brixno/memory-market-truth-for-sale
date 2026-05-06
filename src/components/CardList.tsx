import { BadgeCheck, FileCheck2, KeyRound, Radio, ScrollText } from 'lucide-react';
import { FIELD_LABELS, MISSIONS } from '../model/constants';
import type { GameState, Player } from '../model/types';
import { effectiveEvidence } from '../engine/laws';

function MiniBar({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <div className="mini-power" aria-label={`증거 점수 ${value}`}>
      {Array.from({ length: max }, (_, index) => <span key={index} className={index < value ? 'filled' : ''} />)}
    </div>
  );
}

export default function CardList({ state, player, compact = false }: { state: GameState; player: Player; compact?: boolean }) {
  const sections = [
    { id: 'records', title: '공식 기록', count: player.recordIds.length, icon: <FileCheck2 size={18} /> },
    { id: 'rights', title: '증거 이용권', count: player.useRightIds.length, icon: <KeyRound size={18} /> },
    { id: 'tips', title: '제보', count: player.tipIds.length, icon: <Radio size={18} /> },
    { id: 'rumors', title: '소문', count: player.rumorIds.length, icon: <ScrollText size={18} /> }
  ];

  return (
    <div className={compact ? 'inventory-panel compact-cards' : 'inventory-panel'}>
      <div className="inventory-tabs">
        {sections.map((section) => (
          <span key={section.id}>{section.icon}{section.title}<b>{section.count}</b></span>
        ))}
      </div>

      <section className="inventory-section">
        <h3><FileCheck2 size={18} /> 공식 기록</h3>
        {player.recordIds.length === 0 && <p className="muted">보유 공식 기록 없음</p>}
        <div className="inventory-grid">
          {player.recordIds.map((recordId) => {
            const record = state.records[recordId];
            if (!record) return null;
            const issued = Object.values(state.useRights).filter((right) => right.recordId === record.id);
            const value = effectiveEvidence(record, state);
            return (
              <details className={`asset-tile ${record.origin}`} key={record.id}>
                <summary>
                  <span className="asset-icon"><BadgeCheck size={18} /></span>
                  <strong>{record.originalFamilyId}</strong>
                  <MiniBar value={Math.min(3, value)} />
                </summary>
                <p>{record.textKo}</p>
                <div className="badge-row">
                  <span className="badge official">{record.origin === 'original' ? '원본' : '공식 복사본'}</span>
                  <span className="badge">{record.recordType === 'relation' ? '연결 단서' : '단일 단서'}</span>
                  <span className="badge">{record.fields.map((field) => FIELD_LABELS[field]).join(' · ')}</span>
                </div>
                {issued.length > 0 && <small>빌려준 이용권: {issued.map((right) => state.players.find((candidate) => candidate.id === right.borrowerId)?.name).join(', ')}</small>}
              </details>
            );
          })}
        </div>
      </section>

      <section className="inventory-section">
        <h3><KeyRound size={18} /> 증거 이용권</h3>
        {player.useRightIds.length === 0 && <p className="muted">보유 증거 이용권 없음</p>}
        <div className="inventory-grid">
          {player.useRightIds.map((rightId) => {
            const right = state.useRights[rightId];
            const record = right ? state.records[right.recordId] : undefined;
            const issuer = right ? state.players.find((candidate) => candidate.id === right.issuerId) : undefined;
            if (!right || !record) return null;
            return (
              <details className="asset-tile use-right" key={right.id}>
                <summary>
                  <span className="asset-icon"><KeyRound size={18} /></span>
                  <strong>{right.originalFamilyId}</strong>
                  <em>{right.used ? '사용됨' : '1회'}</em>
                </summary>
                <p>{record.textKo}</p>
                <small>발행자: {issuer?.name}</small>
              </details>
            );
          })}
        </div>
      </section>

      <section className="inventory-section">
        <h3><Radio size={18} /> 확인 안 된 제보</h3>
        {player.tipIds.length === 0 && <p className="muted">보유 제보 없음</p>}
        <div className="inventory-grid">
          {player.tipIds.map((tipId) => {
            const tip = state.tips[tipId];
            if (!tip) return null;
            return (
              <details className="asset-tile tip" key={tip.id}>
                <summary>
                  <span className="asset-icon"><Radio size={18} /></span>
                  <strong>{tip.id}</strong>
                  <em>{tip.auditedByPlayerIds.includes(player.id) ? '확인 완료' : '아직 모름'}</em>
                </summary>
                <p>{tip.textKo}</p>
                {tip.auditedByPlayerIds.includes(player.id) && <small>내 확인 결과: {tip.truth ? '참' : '거짓'}</small>}
              </details>
            );
          })}
        </div>
      </section>

      {player.rumorIds.length > 0 && (
        <section className="inventory-section">
          <h3><ScrollText size={18} /> 소문</h3>
          <div className="inventory-grid">
            {player.rumorIds.map((rumorId) => {
              const rumor = state.rumors[rumorId];
              if (!rumor) return null;
              return (
                <details className="asset-tile rumor" key={rumor.id}>
                  <summary>
                    <span className="asset-icon"><ScrollText size={18} /></span>
                    <strong>소문</strong>
                    <em>비공식</em>
                  </summary>
                  <p>{rumor.textKo}</p>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {!compact && player.missionId && (
        <section className="mission-card">
          <h3>개인 목표</h3>
          <p>{MISSIONS.find((mission) => mission.id === player.missionId)?.nameKo}</p>
          <small>{MISSIONS.find((mission) => mission.id === player.missionId)?.descriptionKo}</small>
        </section>
      )}
    </div>
  );
}
