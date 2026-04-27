import { useEffect } from 'react';
import type { Player, ScoreEntry } from '../types/game';
import type { CategoryDef } from '../games/generala';
import { getNumberOptions } from '../games/generala';
import { DieIcon } from './DieIcon';

interface Props {
  player: Player;
  category: CategoryDef;
  isEdit?: boolean;
  lockedToScratchOnly?: boolean;
  onConfirm: (entry: ScoreEntry) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function ScoreModal({
  player, category, isEdit, lockedToScratchOnly, onConfirm, onDelete, onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const score = (value: number, served = false, scratched = false) =>
    onConfirm({ value, served, scratched });

  const options = getNumberOptions(category.id);
  const isNumber = category.type === 'number';

  // Generala solo se puede tachar si Generala Doble ya fue anotada o tachada
  const canScratch =
    category.id !== 'generala' || player.scores['generalaDoble'] !== undefined;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-category">
            {category.dieFace
              ? <span className="modal-die"><DieIcon face={category.dieFace} size={26} /></span>
              : category.label}
            {isEdit && <span className="modal-edit-badge"> · editando</span>}
          </h3>
          <span className="modal-player">{player.name}</span>
        </div>

        <div className="modal-body">
          {lockedToScratchOnly ? (
            <>
              <p className="modal-hint">
                Generala Doble solo se puede tachar hasta que anotes Generala.
              </p>
              <button className="btn btn-scratch" onClick={() => score(0, false, true)} autoFocus>
                Tachar <span className="score-preview">0 pts</span>
              </button>
            </>
          ) : isNumber ? (
            <>
              <div className="number-options">
                {options.map((value, i) => (
                  <button
                    key={value}
                    className="btn btn-option"
                    onClick={() => score(value)}
                    autoFocus={i === 0}
                  >
                    <span className="option-dice">{i + 1} dado{i > 0 ? 's' : ''}</span>
                    <span className="option-pts">{value} pts</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-scratch" onClick={() => score(0, false, true)}>
                Tachar <span className="score-preview">0 pts</span>
              </button>
            </>
          ) : (
            <>
              <div className="combination-options">
                {category.winOnServed && (
                  <button className="btn btn-win" onClick={() => score(category.baseScore, true)} autoFocus>
                    Servida — ¡Ganá la partida!
                  </button>
                )}
                {!category.winOnServed && category.servedBonus > 0 && (
                  <button className="btn btn-served" onClick={() => score(category.baseScore + category.servedBonus, true)} autoFocus>
                    Servido <span className="score-preview">{category.baseScore + category.servedBonus} pts</span>
                  </button>
                )}
                <button className="btn btn-normal" onClick={() => score(category.baseScore)}>
                  Normal <span className="score-preview">{category.baseScore} pts</span>
                </button>
              </div>
              {canScratch ? (
                <button className="btn btn-scratch" onClick={() => score(0, false, true)}>
                  Tachar <span className="score-preview">0 pts</span>
                </button>
              ) : (
                <p className="modal-hint scratch-blocked">
                  Para tachar Generala primero tachá Generala Doble.
                </p>
              )}
            </>
          )}

          {isEdit && onDelete && (
            <button className="btn btn-delete" onClick={onDelete}>
              Borrar anotación
            </button>
          )}
        </div>

        <button className="modal-cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
