type Props = {
  onTutorial: () => void;
  onStartSetup: () => void;
};

export default function OpeningScreen({ onTutorial, onStartSetup }: Props) {
  return (
    <main className="opening-screen" aria-label="기억시장 시작 화면">
      <section className="opening-title">
        <h1>기억시장</h1>
        <p className="opening-subtitle">진실을 사고파는 밤</p>
      </section>

      <nav className="opening-actions" aria-label="시작 메뉴">
        <button type="button" onClick={onTutorial}>튜토리얼</button>
        <button type="button" className="primary" onClick={onStartSetup}>게임 시작</button>
      </nav>
    </main>
  );
}
