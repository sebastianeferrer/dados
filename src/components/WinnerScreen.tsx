import type { Player, GameVariant } from '../types/game';
import { getTotal, getRankingValue, hasGeneralaServida } from '../games/generala';

interface Props {
  players: Player[];
  winnerId?: string;
  winReason?: 'generalaServida' | 'highScore';
  variant: GameVariant;
  onNewGame: () => void;
  onReopenGame: () => void;
  onRestartSamePlayers: () => void;
}

export function WinnerScreen({
  players,
  winnerId,
  winReason,
  variant,
  onNewGame,
  onReopenGame,
  onRestartSamePlayers,
}: Props) {
  const winner = players.find(p => p.id === winnerId);
  const sorted = [...players].sort((a, b) => getRankingValue(b, variant) - getRankingValue(a, variant));
  const topRank = getRankingValue(sorted[0], variant);
  const topScore = getTotal(sorted[0], variant);
  const tiedWinners = sorted.filter(p => getRankingValue(p, variant) === topRank);
  const isTie = tiedWinners.length > 1;

  // Compute real ranks (handle ties)
  const ranks = new Map<string, number>();
  let currentRank = 1;
  sorted.forEach((p, i) => {
    if (i > 0 && getRankingValue(p, variant) < getRankingValue(sorted[i - 1], variant)) currentRank = i + 1;
    ranks.set(p.id, currentRank);
  });

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
            <p className="winner-badge">Empate en 1°</p>
            <h1 className="winner-name">
              {tiedWinners.map(p => p.name).join(' · ')}
            </h1>
            <p className="winner-score">{topScore} puntos</p>
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
          {sorted.map(p => {
            const served = hasGeneralaServida(p, variant);
            const rank = ranks.get(p.id) ?? 1;
            const isWinner = rank === 1;
            const total = getTotal(p, variant);
            return (
              <div
                key={p.id}
                className={`final-score-row${isWinner ? ' is-winner' : ''}`}
              >
                <span className="final-pos">{rank}</span>
                <span className="final-name">
                  {p.name}
                  {served && <span className="final-served-badge">Servida</span>}
                  {isTie && isWinner && <span className="final-served-badge tie-badge">Empate</span>}
                </span>
                <span className="final-total">
                  {served ? <>∞ <small>({total})</small></> : <>{total} pts</>}
                </span>
              </div>
            );
          })}
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
