import { useState, useEffect } from 'react';
import type { Player, ScoreEntry } from '../types/game';
import type { CategoryDef } from '../games/generala';

interface Props {
  player: Player;
  category: CategoryDef;
  onConfirm: (entry: ScoreEntry) => void;
  onCancel: () => void;
}

export function ScoreModal({ player, category, onConfirm, onCancel }: Props) {
  const [numberValue, setNumberValue] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleServed = () => {
    if (category.winOnServed) {
      onConfirm({ value: category.baseScore, served: true, scratched: false });
    } else {
      onConfirm({ value: category.baseScore + category.servedBonus, served: true, scratched: false });
    }
  };

  const handleNormal = () => {
    if (category.type === 'number') {
      const val = parseInt(numberValue, 10);
      if (isNaN(val) || val < 0 || (category.maxInput !== undefined && val > category.maxInput)) return;
      onConfirm({ value: val, served: false, scratched: false });
    } else {
      onConfirm({ value: category.baseScore, served: false, scratched: false });
    }
  };

  const handleScratch = () => {
    onConfirm({ value: 0, served: false, scratched: true });
  };

  const numberVal = parseInt(numberValue, 10);
  const numberValid =
    !isNaN(numberVal) &&
    numberVal >= 0 &&
    (category.maxInput === undefined || numberVal <= category.maxInput);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-category">{category.label}</h3>
          <span className="modal-player">{player.name}</span>
        </div>

        <div className="modal-body">
          {category.type === 'number' ? (
            <>
              <p className="modal-hint">
                Ingresá el total de puntos (máx. {category.maxInput})
              </p>
              <div className="number-input-group">
                <input
                  type="number"
                  className="number-input"
                  min={0}
                  max={category.maxInput}
                  value={numberValue}
                  onChange={e => setNumberValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && numberValid && handleNormal()}
                  placeholder="0"
                  autoFocus
                />
                <button
                  className="btn btn-primary"
                  onClick={handleNormal}
                  disabled={!numberValid}
                >
                  Guardar
                </button>
              </div>
            </>
          ) : (
            <div className="combination-options">
              {category.winOnServed && (
                <button className="btn btn-win" onClick={handleServed}>
                  Servida — ¡Ganá la partida!
                </button>
              )}
              {!category.winOnServed && category.servedBonus > 0 && (
                <button className="btn btn-served" onClick={handleServed}>
                  Servido
                  <span className="score-preview">
                    {category.baseScore + category.servedBonus} pts
                  </span>
                </button>
              )}
              <button className="btn btn-normal" onClick={handleNormal}>
                Normal
                <span className="score-preview">{category.baseScore} pts</span>
              </button>
            </div>
          )}

          <button className="btn btn-scratch" onClick={handleScratch}>
            Tachar <span className="score-preview">0 pts</span>
          </button>
        </div>

        <button className="modal-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
