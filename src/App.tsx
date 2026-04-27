import { useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { useTheme } from './hooks/useTheme';
import { PlayerSetup } from './components/PlayerSetup';
import { Scoreboard } from './components/Scoreboard';
import { WinnerScreen } from './components/WinnerScreen';
import { ThemeToggle } from './components/ThemeToggle';
import type { Player, CategoryId, ScoreEntry } from './types/game';
import { isGameComplete, getWinner } from './games/generala';

function App() {
  const { state, dispatch } = useGameState();
  const { theme, toggle } = useTheme();

  const handleStart = (players: Player[]) => {
    dispatch({ type: 'START_GAME', players });
  };

  const handleScore = (playerId: string, categoryId: CategoryId, entry: ScoreEntry) => {
    dispatch({ type: 'RECORD_SCORE', playerId, categoryId, entry });
  };

  const handleWin = (winnerId: string, winReason: 'generalaServida') => {
    dispatch({ type: 'SET_WINNER', winnerId, winReason });
  };

  const handleReset = () => {
    if (state.phase === 'playing') {
      if (!window.confirm('¿Abandonar la partida en curso?')) return;
    }
    dispatch({ type: 'RESET_GAME' });
  };

  useEffect(() => {
    if (state.phase === 'playing' && isGameComplete(state.players)) {
      const winner = getWinner(state.players);
      dispatch({ type: 'SET_WINNER', winnerId: winner.id, winReason: 'highScore' });
    }
  }, [state.players, state.phase]);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Dados</span>
        <div className="header-actions">
          {state.phase !== 'setup' && (
            <button className="btn btn-ghost" onClick={handleReset}>
              Nueva partida
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="app-main">
        {state.phase === 'setup' && <PlayerSetup onStart={handleStart} />}

        {state.phase === 'playing' && (
          <Scoreboard
            players={state.players}
            onScore={handleScore}
            onWin={handleWin}
          />
        )}

        {state.phase === 'finished' && (
          <WinnerScreen
            players={state.players}
            winnerId={state.winnerId}
            winReason={state.winReason}
            onNewGame={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
