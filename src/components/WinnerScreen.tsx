import type { Player } from '../types/game';
import { getTotal } from '../games/generala';

interface Props {
  players: Player[];
  winnerId?: string;
  winReason?: 'generalaServida' | 'highScore';
  onNewGame: () => void;
  onReopenGame: () => void;
  onRestartSamePlayers: () => void;
}

export function WinnerScreen({
  players,
  winnerId,
  winReason,
  onNewGame,
  onReopenGame,
  onRestartSamePlayers,
}: Props) {
  const winner = players.find(p => p.id === winnerId);
  const sorted = [...players].sort((a, b) => getTotal(b) - getTotal(a));
  const topScore = getTotal(sorted[0]);
  const isTie = sorted.filter(p => getTotal(p) === topScore).length > 1;

  return (
    <div className="winner-screen">
      <div className="winner-content">
        {winReason === 'generalaServida' ? (
          <>
            <p className="winner-badge">Generala servida</p>
            <h1 className="winner-name">{winner?.name} gano</h1>
          </>
        ) : isTie ? (
          <>
            <p className="winner-badge">Empate</p>
            <h1 className="winner-name">{topScore} puntos</h1>
          </>
        ) : (
          <>
            <p className="winner-badge">Partida terminada</p>
            <h1 className="winner-name">{winner?.name} gano</h1>
            <p className="winner-score">{winner && getTotal(winner)} puntos</p>
          </>
        )}

        <div className="final-scores">
          <p className="final-scores-title">Resultados finales</p>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`final-score-row${p.id === winnerId ? ' is-winner' : ''}`}
            >
              <span className="final-pos">{i + 1}</span>
              <span className="final-name">{p.name}</span>
              <span className="final-total">{getTotal(p)} pts</span>
            </div>
          ))}
        </div>

        <div className="winner-actions">
          <button className="btn btn-primary" onClick={onRestartSamePlayers}>
            Repetir con los mismos jugadores
          </button>
          <button className="btn btn-secondary" onClick={onReopenGame}>
            Ver y editar puntajes
          </button>
          <button className="btn btn-ghost" onClick={onNewGame}>
            Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}
