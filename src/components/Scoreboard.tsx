import { CASE_FIELDS, FIELD_LABELS } from '../model/constants';
import { fieldCandidates } from '../model/caseData';
import type { GameState } from '../model/types';
import { evaluatePredicate, solutionCandidateId } from '../engine/predicates';
import { rankedBreakdowns } from '../engine/scoring';

export default function Scoreboard({ state, onNewGame }: { state: GameState; onNewGame: () => void }) {
  const ranked = rankedBreakdowns(state.scoreBreakdowns ?? []);
  const nameOf = (id: string) => state.candidates.find((candidate) => candidate.id === id)?.nameKo ?? id;

  return (
    <div className="phase-panel scoreboard">
      <h2>점수 공개</h2>
      <section className="solution-box">
        <h3>정답</h3>
        <p>{CASE_FIELDS.map((field) => `${FIELD_LABELS[field]}: ${nameOf(solutionCandidateId(state.solution, field))}`).join(' · ')}</p>
      </section>

      <div className="ranking-list">
        {ranked.map((score, index) => {
          const player = state.players.find((candidate) => candidate.id === score.playerId);
          if (!player) return null;
          return (
            <details className="rank-card" key={score.playerId} open={index < 3}>
              <summary>
                <span>{index + 1}위</span>
                <strong>{player.name}</strong>
                <b>{score.total}점</b>
              </summary>
              <div className="score-grid">
                <span>정답 {score.answerScore}</span>
                <span>증거 {score.evidenceScore}</span>
                <span>주장 {score.publicClaimScore}</span>
                <span>목표 {score.missionScore}</span>
                <span>코인 {score.coinScore}</span>
                <span>이용 보너스 {score.royaltyScore}</span>
                <span>벌점 -{score.penalties}</span>
              </div>
              {player.finalSubmission && (
                <p><strong>제출:</strong> {CASE_FIELDS.map((field) => `${FIELD_LABELS[field]} ${nameOf(solutionCandidateId(player.finalSubmission!.guesses, field))}`).join(' · ')}</p>
              )}
              <p><strong>점수로 인정된 원본 묶음:</strong> {score.scoredOriginalFamilyIds.join(', ') || '없음'}</p>
              <ul>
                {score.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            </details>
          );
        })}
      </div>

      <section>
        <h3>공개 주장 결과</h3>
        {state.publicClaims.map((claim) => {
          const player = state.players.find((candidate) => candidate.id === claim.playerId);
          const truth = evaluatePredicate(claim.predicate, state.solution, state.candidates, state.relationScores);
          return (
            <div className="claim-result" key={claim.id}>
              <strong>{player?.name}</strong>
              <span>{claim.textKo}</span>
              <b>{truth ? '참' : '거짓'}</b>
            </div>
          );
        })}
      </section>

      <section>
        <h3>전체 용의선</h3>
        <div className="candidate-board compact-board">
          {CASE_FIELDS.map((field) => (
            <div key={field}>
              <h4>{FIELD_LABELS[field]}</h4>
              {fieldCandidates(state.candidates, field).map((candidate) => <p key={candidate.id}>{candidate.nameKo}</p>)}
            </div>
          ))}
        </div>
      </section>
      <button className="primary" onClick={onNewGame}>새 게임</button>
    </div>
  );
}
