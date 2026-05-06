import { useCallback, useState } from 'react';
import { MODE_CONFIGS } from '../model/constants';
import type { GameState, Player, Predicate } from '../model/types';
import { aiAcceptsOffer } from '../engine/ai';
import { acquireTip, auditTip, copyRecord, createRumor, registerUseRight, sellRecord, transferCoins, transferTip } from '../engine/market';
import { PredicateBuilder } from './PublicClaimScreen';

type TradeType = 'sellRecord' | 'registerUseRight' | 'sendCoins' | 'transferTip';

export default function TradePanel({ state, setState, player }: { state: GameState; setState: (state: GameState) => void; player: Player }) {
  const [targetId, setTargetId] = useState(state.players.find((candidate) => candidate.id !== player.id)?.id ?? '');
  const [tradeType, setTradeType] = useState<TradeType>('sellRecord');
  const [recordId, setRecordId] = useState(player.recordIds[0] ?? '');
  const [tipId, setTipId] = useState(player.tipIds[0] ?? '');
  const [price, setPrice] = useState(1);
  const [message, setMessage] = useState('');
  const [rumorPredicate, setRumorPredicate] = useState<Predicate>({ type: 'entityHasTag', field: 'suspect', tag: state.officialTags[0] ?? '내부', displayKo: '범인은 [내부] 키워드가 있다.' });
  const handleRumor = useCallback((predicate: Predicate) => setRumorPredicate(predicate), []);
  const target = state.players.find((candidate) => candidate.id === targetId);

  const run = () => {
    if (!target) return;
    try {
      if (target.type === 'ai' && (tradeType === 'sellRecord' || tradeType === 'registerUseRight')) {
        const accepted = aiAcceptsOffer(state, target.id, recordId, price, tradeType === 'registerUseRight');
        if (!accepted) {
          setMessage(`${target.name}이 제안을 거절했습니다.`);
          return;
        }
      }
      if (tradeType === 'sellRecord') setState(sellRecord(state, player.id, target.id, recordId, price));
      if (tradeType === 'registerUseRight') setState(registerUseRight(state, player.id, target.id, recordId, price, state.adminAccessPlayerIds.includes(player.id) || state.adminAccessPlayerIds.includes(target.id)));
      if (tradeType === 'sendCoins') setState(transferCoins(state, player.id, target.id, price));
      if (tradeType === 'transferTip') setState(transferTip(state, player.id, target.id, tipId, price));
      setMessage('거래가 처리되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <section className="trade-panel">
      <h3>시장 거래</h3>
      <div className="form-grid">
        <label>
          상대
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            {state.players.filter((candidate) => candidate.id !== player.id).map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
            ))}
          </select>
        </label>
        <label>
          거래 유형
          <select value={tradeType} onChange={(event) => setTradeType(event.target.value as TradeType)}>
            <option value="sellRecord">공식 기록 판매</option>
            <option value="registerUseRight">증거 이용권 만들기</option>
            <option value="sendCoins">코인 지급</option>
            <option value="transferTip">확인 안 된 제보 판매/전달</option>
          </select>
        </label>
        {(tradeType === 'sellRecord' || tradeType === 'registerUseRight') && (
          <label>
            공식 기록
            <select value={recordId} onChange={(event) => setRecordId(event.target.value)}>
              {player.recordIds.map((id) => <option key={id} value={id}>{state.records[id]?.originalFamilyId} · {state.records[id]?.textKo}</option>)}
            </select>
          </label>
        )}
        {tradeType === 'transferTip' && (
          <label>
            제보
            <select value={tipId} onChange={(event) => setTipId(event.target.value)}>
              {player.tipIds.map((id) => <option key={id} value={id}>{state.tips[id]?.textKo}</option>)}
            </select>
          </label>
        )}
        <label>
          금액
          <input type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value))} />
        </label>
      </div>
      <button onClick={run}>거래 처리</button>
      {message && <p className="notice">{message}</p>}

      <div className="notary-tools">
        <h3>{state.mode === 'light' ? '지원 데스크 기능' : '확인소 기능'}</h3>
        <p>이번 라운드 이용 가능: {state.adminAccessPlayerIds.includes(player.id) ? '가능' : '불가'} · 확인 포인트 {state.notaryCredits[player.id] ?? 0}</p>
        <div className="button-row">
          <button disabled={!state.adminAccessPlayerIds.includes(player.id)} onClick={() => {
            try {
              setState({ ...state, players: state.players.map((candidate) => candidate.id === player.id ? { ...candidate, coins: candidate.coins + 4 } : candidate) });
              setMessage('자금 4코인을 받았습니다.');
            } catch (error) {
              setMessage(error instanceof Error ? error.message : String(error));
            }
          }}>자금 수령</button>
          <button disabled={!state.adminAccessPlayerIds.includes(player.id) || !recordId || player.coins < 2} onClick={() => {
            try {
              setState(copyRecord(state, player.id, recordId));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : String(error));
            }
          }}>공식 복사본 만들기</button>
          <button disabled={!state.adminAccessPlayerIds.includes(player.id) || !MODE_CONFIGS[state.mode].usesTips || state.tipDeck.length === 0} onClick={() => {
            try {
              setState(acquireTip(state, player.id));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : String(error));
            }
          }}>제보 확보</button>
          <button disabled={!state.adminAccessPlayerIds.includes(player.id) || !tipId || player.coins < 1} onClick={() => {
            try {
              const [next, result] = auditTip(state, player.id, tipId);
              setState(next);
              setMessage(`확인 결과: ${result ? '참' : '거짓'}입니다. 이 결과는 당신에게만 표시됩니다.`);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : String(error));
            }
          }}>제보 확인</button>
        </div>
      </div>

      {MODE_CONFIGS[state.mode].allowsRumors && (
        <div className="rumor-tools">
          <h3>소문 생성</h3>
          <PredicateBuilder state={state} onChange={handleRumor} />
          <button disabled={player.coins < 1} onClick={() => {
            try {
              setState(createRumor(state, player.id, rumorPredicate));
            } catch (error) {
              setMessage(error instanceof Error ? error.message : String(error));
            }
          }}>소문 카드 만들기 (1코인)</button>
        </div>
      )}
    </section>
  );
}
