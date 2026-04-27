import { useEffect, useState } from 'react';
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
  const [isEditMode, setIsEditMode] = useState(false);

  const handleStart = (players: Player[]) => dispatch({ type: 'START_GAME', players });

  const handleScore = (playerId: string, categoryId: CategoryId, entry: ScoreEntry) =>
    dispatch({ type: 'RECORD_SCORE', playerId, categoryId, entry });

  const handleWin = (winnerId: string, winReason: 'generalaServida') =>
    dispatch({ type: 'SET_WINNER', winnerId, winReason });

  const handleAdvanceTurn = () => dispatch({ type: 'ADVANCE_TURN' });

  const handleReorderPlayers = (players: Player[]) =>
    dispatch({ type: 'REORDER_PLAYERS', players });

  const handleDisableTurnOrder = () => dispatch({ type: 'DISABLE_TURN_ORDER' });

  const handleReset = () => {
    if (state.phase === 'playing' && !isEditMode) {
      if (!window.confirm('¿Abandonar la partida en curso?')) return;
    }
    setIsEditMode(false);
    dispatch({ type: 'RESET_GAME' });
  };

  const handleReopenGame = () => {
    setIsEditMode(true);
    dispatch({ type: 'REOPEN_GAME' });
  };

  const handleDoneEditing = () => {
    setIsEditMode(false);
    const winner = getWinner(state.players);
    dispatch({ type: 'SET_WINNER', winnerId: winner.id, winReason: 'highScore' });
  };

  const handleRestartSamePlayers = () => {
    setIsEditMode(false);
    dispatch({ type: 'RESTART_SAME_PLAYERS' });
  };

  useEffect(() => {
    if (state.phase === 'playing' && !isEditMode && isGameComplete(state.players)) {
      const winner = getWinner(state.players);
      dispatch({ type: 'SET_WINNER', winnerId: winner.id, winReason: 'highScore' });
    }
  }, [state.players, state.phase, isEditMode]);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Dados</span>
        <div className="header-actions">
          {isEditMode && (
            <button className="btn btn-primary" onClick={handleDoneEditing}>
              Terminar edición
            </button>
          )}
          {state.phase !== 'setup' && !isEditMode && (
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
            currentPlayerIndex={state.currentPlayerIndex}
            turnOrderEnabled={state.turnOrderEnabled}
            isEditMode={isEditMode}
            onScore={handleScore}
            onWin={handleWin}
            onAdvanceTurn={handleAdvanceTurn}
            onReorderPlayers={handleReorderPlayers}
            onDisableTurnOrder={handleDisableTurnOrder}
          />
        )}

        {state.phase === 'finished' && (
          <WinnerScreen
            players={state.players}
            winnerId={state.winnerId}
            winReason={state.winReason}
            onNewGame={handleReset}
            onReopenGame={handleReopenGame}
            onRestartSamePlayers={handleRestartSamePlayers}
          />
        )}
      </main>
    </div>
  );
}

export default App;
