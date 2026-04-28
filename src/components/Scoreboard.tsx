import { useState, useEffect } from 'react';
import type { Player, CategoryId, ScoreEntry } from '../types/game';
import {
  CATEGORIES,
  getTotal,
  isCategoryAvailable,
  isCategoryPermanentlyBlocked,
  getPlayerRanks,
  getRankingValue,
  hasGeneralaServida,
} from '../games/generala';
import { ScoreModal } from './ScoreModal';
import { ReorderDialog } from './ReorderDialog';
import { DieIcon } from './DieIcon';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  players: Player[];
  currentPlayerIndex: number;
  turnOrderEnabled: boolean;
  isEditMode: boolean;
  onScore: (playerId: string, categoryId: CategoryId, entry: ScoreEntry) => void;
  onDeleteScore: (playerId: string, categoryId: CategoryId) => void;
  onWin: (winnerId: string, winReason: 'generalaServida') => void;
  onReorderPlayers: (players: Player[]) => void;
  onDisableTurnOrder: () => void;
}

type LocalDialog =
  | null
  | { kind: 'score'; playerId: string; categoryId: CategoryId; isEdit: boolean; lockedToScratchOnly: boolean }
  | { kind: 'confirmEdit'; playerId: string; categoryId: CategoryId }
  | { kind: 'outOfOrder'; pendingPlayerId: string; pendingCategoryId: CategoryId }
  | { kind: 'reorder' };

function getLeadingIds(players: Player[]): string[] {
  if (!players.length) return [];
  const max = Math.max(...players.map(getRankingValue));
  if (max === 0) return [];
  return players.filter(p => getRankingValue(p) === max).map(p => p.id);
}

export function Scoreboard({
  players, currentPlayerIndex, turnOrderEnabled, isEditMode,
  onScore, onDeleteScore, onWin, onReorderPlayers, onDisableTurnOrder,
}: Props) {
  const [dialog, setDialog] = useState<LocalDialog>(null);
  const [toast,  setToast]  = useState<{ msg: string; id: number } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialog) setDialog(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [dialog]);

  const showToast = (msg: string) => setToast({ msg, id: Date.now() });

  const openScoreModal = (
    playerId: string, categoryId: CategoryId, isEdit: boolean, lockedToScratchOnly = false
  ) => setDialog({ kind: 'score', playerId, categoryId, isEdit, lockedToScratchOnly });

  const handleCellClick = (playerId: string, categoryId: CategoryId) => {
    const player = players.find(p => p.id === playerId)!;

    if (player.scores[categoryId] !== undefined) {
      setDialog({ kind: 'confirmEdit', playerId, categoryId });
      return;
    }
    if (isCategoryPermanentlyBlocked(categoryId, player)) {
      showToast('No disponible — Generala fue tachada.');
      return;
    }
    if (!isEditMode && turnOrderEnabled && players[currentPlayerIndex]?.id !== playerId) {
      setDialog({ kind: 'outOfOrder', pendingPlayerId: playerId, pendingCategoryId: categoryId });
      return;
    }

    // Allow locked cells (e.g. Generala Doble before Generala) — only show Tachar
    const lockedToScratchOnly = !isCategoryAvailable(categoryId, player);
    openScoreModal(playerId, categoryId, false, lockedToScratchOnly);
  };

  const handleScoreConfirm = (entry: ScoreEntry) => {
    if (dialog?.kind !== 'score') return;
    const { playerId, categoryId, isEdit } = dialog;
    onScore(playerId, categoryId, entry);
    if (!isEdit) {
      const cat = CATEGORIES.find(c => c.id === categoryId)!;
      if (entry.served && cat.winOnServed) { onWin(playerId, 'generalaServida'); setDialog(null); return; }
    }
    setDialog(null);
  };

  const handleDeleteScore = () => {
    if (dialog?.kind !== 'score') return;
    const { playerId, categoryId } = dialog;
    onDeleteScore(playerId, categoryId);
    // El turno se recalcula automáticamente basado en celdas completas
    setDialog(null);
  };

  const rankMap    = getPlayerRanks(players);
  const leadingIds = getLeadingIds(players);
  const currentPlayer = players[currentPlayerIndex];

  const d = dialog;
  const modalPlayer  = d?.kind === 'score'       ? players.find(p => p.id === d.playerId)        : null;
  const modalCat     = d?.kind === 'score'       ? CATEGORIES.find(c => c.id === d.categoryId)   : null;
  const editPlayer   = d?.kind === 'confirmEdit' ? players.find(p => p.id === d.playerId)        : null;
  const editCat      = d?.kind === 'confirmEdit' ? CATEGORIES.find(c => c.id === d.categoryId)   : null;
  const oooScorer    = d?.kind === 'outOfOrder'  ? players.find(p => p.id === d.pendingPlayerId) : null;

  return (
    <div className="scoreboard-wrapper">
      {/* ── Turn banner ── */}
      <div className="sb-toolbar">
        {isEditMode ? (
          <div className="turn-banner edit-mode">
            <span className="turn-banner-label">Modo edición</span>
          </div>
        ) : turnOrderEnabled && currentPlayer ? (
          <div className="turn-banner active" key={currentPlayer.id}>
            <PlayerAvatar name={currentPlayer.name} id={currentPlayer.id} size={36} />
            <span className="turn-banner-text">
              <span className="turn-banner-label">Turno de</span>
              <strong className="turn-banner-name">{currentPlayer.name}</strong>
            </span>
          </div>
        ) : (
          <div className="turn-banner free-mode">
            <span className="turn-banner-label">Orden libre</span>
          </div>
        )}
        <button className="btn-toolbar" onClick={() => setDialog({ kind: 'reorder' })}>
          Cambiar orden
        </button>
      </div>

      {/* ── Table ── */}
      <div className="table-container">
        <table className="scoreboard">
          <thead>
            <tr>
              <th className="col-category col-header">Categoría</th>
              {players.map((p, idx) => {
                const isLeading = leadingIds.includes(p.id);
                const isCurrent = !isEditMode && turnOrderEnabled && idx === currentPlayerIndex;
                const filled = Object.keys(p.scores).length;
                const rank   = rankMap.get(p.id) ?? 1;
                return (
                  <th
                    key={p.id}
                    className={[
                      'col-player col-header',
                      isLeading ? 'leading-player' : '',
                      isCurrent ? 'current-turn'   : '',
                    ].filter(Boolean).join(' ')}
                    title={p.name}
                  >
                    <div className="player-header-content">
                      <div className="player-header-top">
                        <PlayerAvatar name={p.name} id={p.id} size={26} />
                        <span className="player-header-name">
                          {isLeading && '🏆 '}{p.name}
                        </span>
                      </div>
                      <span className="player-header-meta">
                        {rank}° · {filled}/{CATEGORIES.length}
                        <span
                          className="info-tip"
                          title="N° = posición en el ranking · X/11 = jugadas completadas"
                        >i</span>
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat.id}>
                <td className="col-category col-label">
                  {cat.dieFace
                    ? <DieIcon face={cat.dieFace} size={20} />
                    : cat.label}
                </td>
                {players.map((player, pIdx) => {
                  const entry = player.scores[cat.id];
                  const filled  = entry !== undefined;
                  const blocked = !filled && isCategoryPermanentlyBlocked(cat.id, player);
                  const locked  = !filled && !blocked && !isCategoryAvailable(cat.id, player);
                  const isCurrentCol = !isEditMode && turnOrderEnabled && pIdx === currentPlayerIndex;

                  const cellClass = [
                    'score-cell',
                    filled && entry.scratched ? 'scratched'
                    : filled && entry.served  ? 'served'
                    : filled                  ? 'filled'
                    : blocked                 ? 'blocked'
                    : locked                  ? 'locked'
                    :                          'available',
                    isCurrentCol ? 'col-current' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <td key={player.id} className={cellClass} onClick={() => handleCellClick(player.id, cat.id)}>
                      {filled && (
                        <span>
                          {entry.scratched ? 'X' : entry.value}
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
              {players.map((p, idx) => {
                const isCurrentCol = !isEditMode && turnOrderEnabled && idx === currentPlayerIndex;
                const served = hasGeneralaServida(p);
                const leaderRank = Math.max(...players.map(getRankingValue));
                const someoneHasServida = players.some(hasGeneralaServida);
                const total = getTotal(p);
                const myRank = getRankingValue(p);
                const diff = myRank - leaderRank;
                return (
                  <td
                    key={p.id}
                    className={`score-cell total-value${isCurrentCol ? ' col-current' : ''}${served ? ' served-winner' : ''}`}
                    title={served ? `Generala servida — ${total} pts` : undefined}
                  >
                    <div className="total-stack">
                      <span>{served ? '∞' : total}</span>
                      {players.length > 1 && !served && (
                        someoneHasServida
                          ? <span className="total-diff">{total} pts</span>
                          : diff < 0 && <span className="total-diff">{diff}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Score modal ── */}
      {d?.kind === 'score' && modalPlayer && modalCat && (
        <ScoreModal
          player={modalPlayer}
          category={modalCat}
          isEdit={d.isEdit}
          lockedToScratchOnly={d.lockedToScratchOnly}
          onConfirm={handleScoreConfirm}
          onDelete={d.isEdit ? handleDeleteScore : undefined}
          onCancel={() => setDialog(null)}
        />
      )}

      {/* ── Confirm edit ── */}
      {d?.kind === 'confirmEdit' && editPlayer && editCat && (
        <div className="modal-overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-category">Modificar puntaje</h3>
            </div>
            <p className="confirm-text">
              ¿Querés cambiar <strong>{editCat.label}</strong> de <strong>{editPlayer.name}</strong>?
              <br /><span className="confirm-subtext">El valor anterior se va a reemplazar o podés borrarlo.</span>
            </p>
            <div className="confirm-actions">
              <button className="btn btn-primary" autoFocus
                onClick={() => openScoreModal(d.playerId, d.categoryId, true)}>
                Sí, modificar
              </button>
              <button className="btn btn-ghost" onClick={() => setDialog(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Out of order ── */}
      {d?.kind === 'outOfOrder' && (
        <div className="modal-overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-category">Orden de turno</h3>
            </div>
            <p className="confirm-text">
              Es el turno de <strong>{currentPlayer?.name}</strong>, pero estás anotando para <strong>{oooScorer?.name}</strong>.
            </p>
            <div className="combination-options">
              <button className="btn btn-normal" autoFocus
                onClick={() => {
                  const p = players.find(pl => pl.id === d.pendingPlayerId)!;
                  openScoreModal(d.pendingPlayerId, d.pendingCategoryId, false, !isCategoryAvailable(d.pendingCategoryId, p));
                }}>
                Continuar igual
              </button>
              <button className="btn btn-normal"
                onClick={() => {
                  onDisableTurnOrder();
                  const p = players.find(pl => pl.id === d.pendingPlayerId)!;
                  openScoreModal(d.pendingPlayerId, d.pendingCategoryId, false, !isCategoryAvailable(d.pendingCategoryId, p));
                }}>
                Ignorar el contador de turno
              </button>
              <button className="btn btn-secondary"
                onClick={() => setDialog({ kind: 'reorder' })}>
                Cambiar el orden
              </button>
            </div>
            <button className="modal-cancel" onClick={() => setDialog(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Reorder dialog ── */}
      {d?.kind === 'reorder' && (
        <ReorderDialog
          players={players}
          onConfirm={reordered => { onReorderPlayers(reordered); setDialog(null); }}
          onCancel={() => setDialog(null)}
        />
      )}

      {toast && <div className="toast" key={toast.id}>{toast.msg}</div>}
    </div>
  );
}
