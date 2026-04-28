import { useState, useEffect } from 'react';
import type { Player, GameVariant, CategoryId, ScoreEntry, SavedRoll } from '../types/game';
import {
  getCategories,
  findCategory,
  getTotal,
  getUpperSubtotal,
  getUpperBonus,
  isCategoryAvailable,
  isCategoryPermanentlyBlocked,
  getPlayerRanks,
  getRankingValue,
  hasGeneralaServida,
  UPPER_BONUS_THRESHOLD,
  UPPER_BONUS_VALUE,
} from '../games/generala';
import { ScoreModal } from './ScoreModal';
import { ReorderDialog } from './ReorderDialog';
import { DieIcon } from './DieIcon';
import { PlayerAvatar } from './PlayerAvatar';
import { DiceRoller } from './DiceRoller';

interface Props {
  players: Player[];
  currentPlayerIndex: number;
  turnOrderEnabled: boolean;
  virtualDiceEnabled: boolean;
  variant: GameVariant;
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

function getLeadingIds(players: Player[], variant: GameVariant): string[] {
  if (!players.length) return [];
  const max = Math.max(...players.map(p => getRankingValue(p, variant)));
  if (max === 0) return [];
  return players.filter(p => getRankingValue(p, variant) === max).map(p => p.id);
}

export function Scoreboard({
  players, currentPlayerIndex, turnOrderEnabled, virtualDiceEnabled, variant, isEditMode,
  onScore, onDeleteScore, onWin, onReorderPlayers, onDisableTurnOrder,
}: Props) {
  const [dialog, setDialog] = useState<LocalDialog>(null);
  const [toast,  setToast]  = useState<{ msg: string; id: number } | null>(null);
  const [activeRoll, setActiveRoll] = useState<SavedRoll | null>(null);

  const categories = getCategories(variant);
  const isYahtzee = variant === 'yahtzee';
  const upperCats = categories.filter(c => c.section === 'upper');
  const lowerCats = categories.filter(c => c.section === 'lower');

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
    if (isCategoryPermanentlyBlocked(categoryId, player, variant)) {
      showToast('No disponible.');
      return;
    }
    if (!isEditMode && turnOrderEnabled && players[currentPlayerIndex]?.id !== playerId) {
      setDialog({ kind: 'outOfOrder', pendingPlayerId: playerId, pendingCategoryId: categoryId });
      return;
    }

    const lockedToScratchOnly = !isCategoryAvailable(categoryId, player, variant);
    openScoreModal(playerId, categoryId, false, lockedToScratchOnly);
  };

  const handleScoreConfirm = (entry: ScoreEntry) => {
    if (dialog?.kind !== 'score') return;
    const { playerId, categoryId, isEdit } = dialog;
    onScore(playerId, categoryId, entry);
    if (!isEdit) setActiveRoll(null);
    if (!isEdit) {
      const cat = findCategory(categoryId, variant);
      if (cat && entry.served && cat.winOnServed) {
        onWin(playerId, 'generalaServida'); setDialog(null); return;
      }
    }
    setDialog(null);
  };

  const handleDeleteScore = () => {
    if (dialog?.kind !== 'score') return;
    const { playerId, categoryId } = dialog;
    onDeleteScore(playerId, categoryId);
    setDialog(null);
  };

  const rankMap    = getPlayerRanks(players, variant);
  const leadingIds = getLeadingIds(players, variant);
  const currentPlayer = players[currentPlayerIndex];

  const d = dialog;
  const modalPlayer  = d?.kind === 'score'       ? players.find(p => p.id === d.playerId)        : null;
  const modalCat     = d?.kind === 'score'       ? findCategory(d.categoryId, variant)           : null;
  const editPlayer   = d?.kind === 'confirmEdit' ? players.find(p => p.id === d.playerId)        : null;
  const editCat      = d?.kind === 'confirmEdit' ? findCategory(d.categoryId, variant)           : null;
  const oooScorer    = d?.kind === 'outOfOrder'  ? players.find(p => p.id === d.pendingPlayerId) : null;

  const renderCategoryRow = (cat: ReturnType<typeof getCategories>[number]) => (
    <tr key={cat.id}>
      <td className="col-category col-label">
        {cat.dieFace
          ? <DieIcon face={cat.dieFace} size={20} />
          : cat.label}
      </td>
      {players.map((player, pIdx) => {
        const entry = player.scores[cat.id];
        const filled  = entry !== undefined;
        const blocked = !filled && isCategoryPermanentlyBlocked(cat.id, player, variant);
        const locked  = !filled && !blocked && !isCategoryAvailable(cat.id, player, variant);
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
                {entry.viaChance && (
                  <sup className="served-mark" title="Vía Chance">★</sup>
                )}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );

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
              <span className="turn-banner-label">
                Turno de {isYahtzee && '· Yahtzee'}
              </span>
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

      {/* ── Dice roller ── */}
      {virtualDiceEnabled && !isEditMode && (
        <DiceRoller
          onSaveRoll={setActiveRoll}
          hasActiveRoll={activeRoll !== null}
          onDiscardRoll={() => setActiveRoll(null)}
        />
      )}

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
                        {rank}° · {filled}/{categories.length}
                        <span
                          className="info-tip"
                          title={`N° = posición · ${filled}/${categories.length} = jugadas completadas`}
                        >i</span>
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {isYahtzee ? (
            <>
              <tbody>
                <tr className="section-divider">
                  <td colSpan={players.length + 1}>Sección Superior</td>
                </tr>
                {upperCats.map(renderCategoryRow)}
                <tr className="subtotal-row">
                  <td className="col-category col-label">Subtotal</td>
                  {players.map((p, idx) => {
                    const isCurrentCol = !isEditMode && turnOrderEnabled && idx === currentPlayerIndex;
                    const sub = getUpperSubtotal(p, variant);
                    const remaining = Math.max(0, UPPER_BONUS_THRESHOLD - sub);
                    return (
                      <td
                        key={p.id}
                        className={`score-cell subtotal-cell${isCurrentCol ? ' col-current' : ''}`}
                        title={remaining > 0
                          ? `Faltan ${remaining} pts para el bonus de +${UPPER_BONUS_VALUE}`
                          : `Bonus de +${UPPER_BONUS_VALUE} pts conseguido`}
                      >
                        <span>{sub}</span>
                        {remaining > 0 && <small className="bonus-progress">faltan {remaining}</small>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="bonus-row">
                  <td className="col-category col-label">Bonus (≥{UPPER_BONUS_THRESHOLD})</td>
                  {players.map((p, idx) => {
                    const isCurrentCol = !isEditMode && turnOrderEnabled && idx === currentPlayerIndex;
                    const bonus = getUpperBonus(p, variant);
                    return (
                      <td
                        key={p.id}
                        className={`score-cell bonus-cell${bonus > 0 ? ' achieved' : ''}${isCurrentCol ? ' col-current' : ''}`}
                      >
                        {bonus > 0 ? `+${bonus}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
              <tbody>
                <tr className="section-divider">
                  <td colSpan={players.length + 1}>Sección Inferior</td>
                </tr>
                {lowerCats.map(renderCategoryRow)}
              </tbody>
            </>
          ) : (
            <tbody>
              {categories.map(renderCategoryRow)}
            </tbody>
          )}

          <tfoot>
            <tr>
              <td className="col-category col-label total-label">Total</td>
              {players.map((p, idx) => {
                const isCurrentCol = !isEditMode && turnOrderEnabled && idx === currentPlayerIndex;
                const served = hasGeneralaServida(p, variant);
                const leaderRank = Math.max(...players.map(pl => getRankingValue(pl, variant)));
                const someoneHasServida = players.some(pl => hasGeneralaServida(pl, variant));
                const total = getTotal(p, variant);
                const myRank = getRankingValue(p, variant);
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
          variant={variant}
          isEdit={d.isEdit}
          lockedToScratchOnly={d.lockedToScratchOnly}
          diceValues={!d.isEdit ? activeRoll?.values : undefined}
          isFirstRoll={!d.isEdit && activeRoll?.rollNumber === 1}
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
                  openScoreModal(d.pendingPlayerId, d.pendingCategoryId, false, !isCategoryAvailable(d.pendingCategoryId, p, variant));
                }}>
                Continuar igual
              </button>
              <button className="btn btn-normal"
                onClick={() => {
                  onDisableTurnOrder();
                  const p = players.find(pl => pl.id === d.pendingPlayerId)!;
                  openScoreModal(d.pendingPlayerId, d.pendingCategoryId, false, !isCategoryAvailable(d.pendingCategoryId, p, variant));
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
