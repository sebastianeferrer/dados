import { useEffect, useRef, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useHistory } from './hooks/useHistory';
import { useTheme } from './hooks/useTheme';
import { PlayerSetup } from './components/PlayerSetup';
import { Scoreboard } from './components/Scoreboard';
import { WinnerScreen } from './components/WinnerScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ThemeToggle } from './components/ThemeToggle';
import type { Player, GameVariant, CategoryId, ScoreEntry, GameState } from './types/game';
import type { GameRecord, PlayerRecord } from './types/history';
import { isGameComplete, getWinner, getTotal, getRankingValue, computeCurrentPlayerIndex } from './games/generala';

function buildRecord(state: GameState): GameRecord {
  const finishedAt = new Date().toISOString();
  const durationMs = new Date(finishedAt).getTime() - new Date(state.startedAt).getTime();

  const sorted = [...state.players]
    .map((p, oi) => ({
      p, oi,
      total: getTotal(p, state.variant),
      rankValue: getRankingValue(p, state.variant),
    }))
    .sort((a, b) => b.rankValue - a.rankValue || a.oi - b.oi);

  let rank = 1;
  const players: PlayerRecord[] = sorted.map((item, i) => {
    if (i > 0 && item.rankValue < sorted[i - 1].rankValue) rank = i + 1;
    return { name: item.p.name, finalRank: rank, total: item.total, scores: item.p.scores };
  });

  const winner = state.players.find(p => p.id === state.winnerId);
  return {
    id: state.gameId,
    startedAt: state.startedAt,
    finishedAt,
    durationMs,
    winReason: state.winReason ?? 'highScore',
    winnerName: winner?.name,
    variant: state.variant,
    players,
  };
}

function App() {
  const { state, dispatch } = useGameState();
  const { records, addRecord, clearHistory } = useHistory();
  const { theme, toggle } = useTheme();
  const [isEditMode, setIsEditMode]     = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const savedGameIdRef = useRef<string | null>(null);

  // Save to history when game finishes (once per gameId)
  useEffect(() => {
    if (state.phase === 'finished' && !isEditMode && state.gameId !== savedGameIdRef.current) {
      savedGameIdRef.current = state.gameId;
      addRecord(buildRecord(state));
    }
  }, [state.phase, state.gameId, isEditMode]);

  // Auto-detect game completion
  useEffect(() => {
    if (state.phase !== 'playing' || isEditMode) return;
    // All players must have at least one score before checking completion
    if (state.players.some(p => Object.keys(p.scores).length === 0)) return;
    if (isGameComplete(state.players, state.variant)) {
      const winner = getWinner(state.players, state.variant);
      dispatch({ type: 'SET_WINNER', winnerId: winner.id, winReason: 'highScore' });
    }
  }, [state.players, state.phase, state.variant, isEditMode]);

  const handleStart = (
    players: Player[],
    turnOrderEnabled: boolean,
    virtualDiceEnabled: boolean,
    variant: GameVariant,
  ) =>
    dispatch({ type: 'START_GAME', players, turnOrderEnabled, virtualDiceEnabled, variant });

  const handleScore = (playerId: string, categoryId: CategoryId, entry: ScoreEntry) =>
    dispatch({ type: 'RECORD_SCORE', playerId, categoryId, entry });

  const handleDeleteScore = (playerId: string, categoryId: CategoryId) =>
    dispatch({ type: 'DELETE_SCORE', playerId, categoryId });

  const handleWin = (winnerId: string, winReason: 'generalaServida') =>
    dispatch({ type: 'SET_WINNER', winnerId, winReason });

  const handleReorderPlayers = (players: Player[]) => dispatch({ type: 'REORDER_PLAYERS', players });
  const handleDisableTurnOrder = () => dispatch({ type: 'DISABLE_TURN_ORDER' });

  const handleReset = () => {
    if (state.phase === 'playing' && !isEditMode) {
      if (!window.confirm('¿Abandonar la partida en curso?')) return;
    }
    setIsEditMode(false);
    setShowHistory(false);
    dispatch({ type: 'RESET_GAME' });
  };

  const handleReopenGame = () => {
    setIsEditMode(true);
    setShowHistory(false);
    dispatch({ type: 'REOPEN_GAME' });
  };

  const handleDoneEditing = () => {
    setIsEditMode(false);
    const winner = getWinner(state.players, state.variant);
    dispatch({ type: 'SET_WINNER', winnerId: winner.id, winReason: 'highScore' });
  };

  const handleRestartSamePlayers = () => {
    setIsEditMode(false);
    dispatch({ type: 'RESTART_SAME_PLAYERS' });
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">
          Dados
          <a
            className="version-tag"
            href="https://github.com/sebastianeferrer/dados/releases"
            target="_blank"
            rel="noopener noreferrer"
            title={`Versión ${__APP_VERSION__} — ver changelog`}
          >
            v{__APP_VERSION__}
          </a>
        </span>
        <div className="header-actions">
          {isEditMode && (
            <button className="btn btn-primary" onClick={handleDoneEditing}>
              Terminar edición
            </button>
          )}
          {!isEditMode && state.phase !== 'setup' && (
            <button className="btn btn-ghost" onClick={handleReset}>Nueva partida</button>
          )}
          <button
            className={`btn ${showHistory ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setShowHistory(v => !v)}
          >
            Historial
            {records.length > 0 && (
              <span className="history-badge">{records.length}</span>
            )}
          </button>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="app-main">
        {showHistory ? (
          <HistoryScreen
            records={records}
            onBack={() => setShowHistory(false)}
            onClearHistory={clearHistory}
          />
        ) : state.phase === 'setup' ? (
          <PlayerSetup onStart={handleStart} />
        ) : state.phase === 'playing' ? (
          <Scoreboard
            players={state.players}
            currentPlayerIndex={computeCurrentPlayerIndex(state.players)}
            turnOrderEnabled={state.turnOrderEnabled}
            virtualDiceEnabled={state.virtualDiceEnabled}
            variant={state.variant}
            isEditMode={isEditMode}
            onScore={handleScore}
            onDeleteScore={handleDeleteScore}
            onWin={handleWin}
            onReorderPlayers={handleReorderPlayers}
            onDisableTurnOrder={handleDisableTurnOrder}
          />
        ) : (
          <WinnerScreen
            players={state.players}
            winnerId={state.winnerId}
            winReason={state.winReason}
            variant={state.variant}
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
