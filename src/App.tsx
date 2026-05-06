import { useState } from 'react';
import type { GameState } from './model/types';
import SetupScreen from './components/SetupScreen';
import GameLayout from './components/GameLayout';
import OpeningScreen from './components/OpeningScreen';
import RulesModal from './components/RulesModal';
import TutorialOverlay from './components/TutorialOverlay';
import { saveGame } from './engine/persistence';

type AppScreen = 'opening' | 'setup';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<AppScreen>('opening');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const updateState = (next: GameState) => {
    setState(next);
    saveGame(next);
  };

  if (!state) {
    return (
      <>
        {screen === 'opening' ? (
          <OpeningScreen onTutorial={() => setTutorialOpen(true)} onStartSetup={() => setScreen('setup')} />
        ) : (
          <SetupScreen
            onStart={updateState}
            onLoad={(loaded) => setState(loaded)}
            onRules={() => setRulesOpen(true)}
            onTutorial={() => setTutorialOpen(true)}
            onBack={() => setScreen('opening')}
          />
        )}
        {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
        {tutorialOpen && <TutorialOverlay state={state} onClose={() => setTutorialOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <GameLayout
        state={state}
        setState={updateState}
        onNewGame={() => {
          setState(null);
          setScreen('opening');
        }}
        onRules={() => setRulesOpen(true)}
        onTutorial={() => setTutorialOpen(true)}
      />
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {tutorialOpen && <TutorialOverlay state={state} onClose={() => setTutorialOpen(false)} />}
    </>
  );
}
