import { useState, useEffect } from 'react';
import type { Player, CategoryId, ScoreEntry } from '../types/game';
import {
  CATEGORIES,
  getTotal,
  isCategoryAvailable,
  isCategoryPermanentlyBlocked,
  getCurrentRound,
  getPlayerRanks,
} from '../games/generala';
import { ScoreModal } from './ScoreModal';

interface Props {
  players: Player[];
  onScore: (playerId: string, categoryId: CategoryId, entry: ScoreEntry) => void;
  onWin: (winnerId: string, winReason: 'generalaServida') => void;
}

export function Scoreboard({ players, onScore, onWin }: Props) {
  const [modal, setModal] = useState<{ playerId: string; categoryId: CategoryId } | null>(null);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast?.id]);

  const showToast = (msg: string) => setToast({ msg, id: Date.now() });

  const handleCellClick = (playerId: string, categoryId: CategoryId) => {
    const player = players.find(p => p.id === playerId)!;

    if (player.scores[categoryId] !== undefined) {
      showToast('Ya anotado — los valores no se pueden modificar.');
      return;
    }
    if (isCategoryPermanentlyBlocked(categoryId, player)) {
      showToast('No disponible — Generala fue tachada.');
      return;
    }
    if (!isCategoryAvailable(categoryId, player)) {
      showToast('Primero anotá Generala para habilitar Generala Doble.');
      return;
    }

    setModal({ playerId, categoryId });
  };

  const handleConfirm = (entry: ScoreEntry) => {
    if (!modal) return;
    onScore(modal.playerId, modal.categoryId, entry);
    if (entry.served) {
      const cat = CATEGORIES.find(c => c.id === modal.categoryId)!;
      if (cat.winOnServed) onWin(modal.playerId, 'generalaServida');
    }
    setModal(null);
  };

  const currentRound = getCurrentRound(players);
  const rankMap = getPlayerRanks(players);

  const modalPlayer = modal ? players.find(p => p.id === modal.playerId) : null;
  const modalCategory = modal ? CATEGORIES.find(c => c.id === modal.categoryId) : null;

  return (
    <div className="scoreboard-wrapper">
      <div className="sb-toolbar">
        <span className="sb-round">Ronda {currentRound} de {CATEGORIES.length}</span>
        <span className="sb-hint">Tocá una celda para anotar</span>
      </div>

      <div className="table-container">
        <table className="scoreboard">
          <thead>
            <tr>
              <th className="col-category col-header">Categoría</th>
              {players.map(p => {
                const rank = rankMap.get(p.id) ?? 1;
                const total = getTotal(p);
                return (
                  <th key={p.id} className="col-player col-header" title={p.name}>
                    <div className="player-header-content">
                      <span className="player-header-name">{p.name}</span>
                      <span className="player-header-rank">{rank}° · {total} pts</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat.id}>
                <td className="col-category col-label">{cat.label}</td>
                {players.map(player => {
                  const entry = player.scores[cat.id];
                  const filled = entry !== undefined;
                  const blocked = !filled && isCategoryPermanentlyBlocked(cat.id, player);
                  const locked = !filled && !blocked && !isCategoryAvailable(cat.id, player);

                  let cellClass = 'score-cell';
                  if (filled && entry.scratched)     cellClass += ' scratched';
                  else if (filled && entry.served)   cellClass += ' served';
                  else if (filled)                   cellClass += ' filled';
                  else if (blocked)                  cellClass += ' blocked';
                  else if (locked)                   cellClass += ' locked';
                  else                               cellClass += ' available';

                  return (
                    <td
                      key={player.id}
                      className={cellClass}
                      onClick={() => handleCellClick(player.id, cat.id)}
                    >
                      {filled && (
                        <span>
                          {entry.scratched ? '—' : entry.value}
                          {!entry.scratched && entry.served && !cat.winOnServed && (
                            <sup className="served-mark">S</sup>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="col-category col-label total-label">Total</td>
              {players.map(p => (
                <td key={p.id} className="score-cell total-value">{getTotal(p)}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {toast && (
        <div className="toast" key={toast.id}>{toast.msg}</div>
      )}

      {modal && modalPlayer && modalCategory && (
        <ScoreModal
          player={modalPlayer}
          category={modalCategory}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
