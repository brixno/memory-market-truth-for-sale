type Props = {
  playerName: string;
  label?: string;
  onReady: () => void;
};

export default function PlayerGate({ playerName, label = '비공개 단계', onReady }: Props) {
  return (
    <div className="player-gate">
      <div>
        <p className="eyebrow">{label}</p>
        <h2>다음 플레이어: {playerName}</h2>
        <p>이전 플레이어의 정보가 보이지 않도록 화면을 가렸습니다.</p>
        <button className="primary" onClick={onReady}>준비되었습니다</button>
      </div>
    </div>
  );
}

