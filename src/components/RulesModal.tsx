import { LAWS, MISSIONS, MODE_CONFIGS, MODE_ORDER } from '../model/constants';

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="rules-modal">
        <button className="close-button" onClick={onClose}>닫기</button>
        <h2>게임 규칙 요약</h2>
        <p>이 게임은 정답을 맞히는 추리 게임이면서, 그 정답을 점수로 인정받을 공식 증거를 사고파는 거래 게임입니다. 원본 공식 기록, 공식 복사본, 증거 이용권을 어떻게 모으느냐가 승부를 바꿉니다.</p>
        <h3>모드</h3>
        <ul>
          {MODE_ORDER.map((mode) => {
            const config = MODE_CONFIGS[mode];
            return <li key={mode}><strong>{config.nameKo}</strong> - {config.playerMin}~{config.playerMax}명, {config.rounds}라운드, 공식 기록 {config.totalRecordCount}장, {config.estimatedTimeKo}</li>;
          })}
        </ul>
        <h3>라이트 사건 봉투 001</h3>
        <p>실험실의 공백 기록 - 라이트. 규칙 카드와 개인 목표 없이 원본, 복사본, 증거 이용권, 확인 안 된 제보, 공개 주장, 연결 단서를 체험하는 경량 전략 추리 게임입니다.</p>
        <h3>핵심 규칙</h3>
        <ul>
          <li>최종 제출은 범인, 장소, 핵심 물증, 시간대를 고릅니다.</li>
          <li>확인 안 된 제보와 소문은 공식 증거가 아니며 최종 제출에 붙일 수 없습니다.</li>
          <li>같은 원본 묶음 번호는 최종 제출 전체에서 한 번만 점수로 인정됩니다.</li>
          <li>연결 증거는 연결된 항목을 모두 맞혀야 점수가 납니다.</li>
          <li>공개 주장과 소문은 자유 입력이 아니라 공식 키워드와 정해진 문장 틀로만 만듭니다.</li>
        </ul>
        <h3>규칙 카드</h3>
        <ul>{LAWS.map((law) => <li key={law.id}><strong>{law.nameKo}</strong> ({law.family}) - {law.descriptionKo}</li>)}</ul>
        <h3>개인 목표</h3>
        <ul>{MISSIONS.map((mission) => <li key={mission.id}><strong>{mission.nameKo}</strong> - {mission.descriptionKo}</li>)}</ul>
        <p className="notice">그랜드 모드에서는 생각할 양이 너무 많아지지 않도록 장소×시간과 범인×시간 연결 단서를 각각 5장으로 줄입니다. 대신 범인×장소, 범인×물증, 장소×물증은 6장씩 유지해 핵심 추리 경로를 안정적으로 보장합니다.</p>
      </section>
    </div>
  );
}
