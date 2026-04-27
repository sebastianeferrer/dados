import { useState } from 'react';
import type { Player, CategoryId, ScoreEntry } from '../types/game';
import {
  CATEGORIES,
  getTotal,
  isCategoryAvailable,
  isCategoryPermanentlyBlocked,
} from '../games/generala';
import { ScoreModal } from './ScoreModal';

interface Props {
  players: Player[];
  onScore: (playerId: string, categoryId: CategoryId, entry: ScoreEntry) => void;
  onWin: (winnerId: string, winReason: 'generalaServida') => void;
}

export function Scoreboard({ players, onScore, onWin }: Props) {
  const [modal, setModal] = useState<{ playerId: string; categoryId: CategoryId } | null>(null);

  const handleCellClick = (playerId: string, categoryId: CategoryId) => {
    const player = players.find(p => p.id === playerId)!;
    if (player.scores[categoryId] !== undefined) return;
    if (!isCategoryAvailable(categoryId, player)) return;
    setModal({ playerId, categoryId });
  };

  const handleConfirm = (entry: ScoreEntry) => {
    if (!modal) return;
    onScore(modal.playerId, modal.categoryId, entry);

    if (entry.served) {
      const cat = CATEGORIES.find(c => c.id === modal.categoryId)!;
      if (cat.winOnServed) {
        onWin(modal.playerId, 'generalaServida');
      }
    }

    setModal(null);
  };

  const modalPlayer = modal ? players.find(p => p.id === modal.playerId) : null;
  const modalCategory = modal ? CATEGORIES.find(c => c.id === modal.categoryId) : null;

  return (
    <div className="scoreboard-wrapper">
      <div className="table-container">
        <table className="scoreboard">
          <thead>
            <tr>
              <th className="col-category col-header">Categoría</th>
              {players.map(p => (
                <th key={p.id} className="col-player col-header" title={p.name}>
                  {p.name}
                </th>
              ))}
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
                  const available = !filled && !blocked && !locked;

                  let cellClass = 'score-cell';
                  if (filled && entry.scratched) cellClass += ' scratched';
                  else if (filled && entry.served) cellClass += ' served';
                  else if (filled) cellClass += ' filled';
                  else if (blocked) cellClass += ' blocked';
                  else if (locked) cellClass += ' locked';
                  else cellClass += ' available';

                  return (
                    <td
                      key={player.id}
                      className={cellClass}
                      onClick={() => available && handleCellClick(player.id, cat.id)}
                    >
                      {filled && (
                        <span>
                          {entry.scratched ? '—' : entry.value}
                          {filled && !entry.scratched && entry.served && !cat.winOnServed && (
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
                <td key={p.id} className="score-cell total-value">
                  {getTotal(p)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

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
