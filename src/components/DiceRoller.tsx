import { useState, useEffect } from 'react';
import type { DieFace, SavedRoll } from '../types/game';
import { DieIcon } from './DieIcon';

interface Props {
  onSaveRoll: (roll: SavedRoll) => void;
  hasActiveRoll: boolean;
  onDiscardRoll: () => void;
}

interface Die {
  value: DieFace | null;
  locked: boolean;
}

const EMPTY_DIE: Die = { value: null, locked: false };
const initialDice = (): Die[] => Array.from({ length: 5 }, () => ({ ...EMPTY_DIE }));

const rollFace = (): DieFace =>
  (Math.floor(Math.random() * 6) + 1) as DieFace;

interface HistoryEntry {
  values: DieFace[];
  total: number;
  ts: number;
}

export function DiceRoller({ onSaveRoll, hasActiveRoll, onDiscardRoll }: Props) {
  const [dice, setDice] = useState<Die[]>(initialDice);
  const [rollNum, setRollNum] = useState(0); // 0 = sin tirar
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Cuando el padre marca que ya no hay roll activo (anotó la jugada), reset.
  useEffect(() => {
    if (!hasActiveRoll && rollNum === 3) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveRoll]);

  const reset = () => {
    setDice(initialDice());
    setRollNum(0);
    setRolling(false);
  };

  const handleRoll = () => {
    if (rollNum >= 3 || rolling) return;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setDice(prev =>
        prev.map(d => (d.locked && d.value !== null ? d : { ...d, value: rollFace() }))
      );
      if (ticks >= 6) {
        clearInterval(interval);
        setRollNum(n => n + 1);
        setRolling(false);
      }
    }, 60);
  };

  const toggleLock = (idx: number) => {
    if (rollNum === 0 || rolling) return;
    if (rollNum >= 3) return;
    setDice(prev =>
      prev.map((d, i) => (i === idx && d.value !== null ? { ...d, locked: !d.locked } : d))
    );
  };

  const handleSave = () => {
    const values = dice.map(d => d.value).filter((v): v is DieFace => v !== null);
    if (values.length !== 5) return;
    const total = values.reduce((s, v) => s + v, 0);
    const rn = (Math.min(rollNum, 3) || 1) as 1 | 2 | 3;
    onSaveRoll({ values, rollNumber: rn });
    setHistory(prev => [{ values, total, ts: Date.now() }, ...prev].slice(0, 5));
  };

  const handleDiscard = () => {
    if (hasActiveRoll) onDiscardRoll();
    reset();
  };

  const total = dice.reduce((s, d) => s + (d.value ?? 0), 0);
  const lockedCount = dice.filter(d => d.locked).length;
  const unlockedCount = dice.filter(d => d.value !== null && !d.locked).length;

  const canRoll = rollNum < 3 && !rolling && !hasActiveRoll;
  const canSave = rollNum > 0 && !rolling && !hasActiveRoll;
  const canLock = rollNum > 0 && rollNum < 3 && !rolling && !hasActiveRoll;

  return (
    <div className="dice-roller">
      <div className="dice-row">
        {dice.map((d, i) => (
          <button
            key={i}
            type="button"
            className={`dice-slot${d.value ? ' filled' : ' empty'}${d.locked ? ' locked' : ''}${rolling && !d.locked ? ' rolling' : ''}${canLock && d.value ? ' clickable' : ''}`}
            onClick={() => toggleLock(i)}
            disabled={!canLock || !d.value}
            aria-label={d.value ? `Dado ${i + 1}: ${d.value}${d.locked ? ' (fijado)' : ''}` : `Dado ${i + 1} vacío`}
          >
            {d.value ? (
              <DieIcon face={d.value} size={48} />
            ) : (
              <span className="dice-placeholder">?</span>
            )}
            {d.locked && <span className="dice-lock-badge">🔒</span>}
          </button>
        ))}
      </div>

      <div className="dice-stats">
        <span className="dice-roll-counter">
          {rollNum === 0 ? 'Sin lanzar' : `Tiro ${rollNum} de 3`}
        </span>
        <span className="dice-total">Total: <strong>{total}</strong></span>
        {rollNum > 0 && rollNum < 3 && (
          <span className="dice-lock-info">
            {lockedCount} fijado{lockedCount !== 1 ? 's' : ''} · {unlockedCount} libre{unlockedCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="dice-actions">
        {hasActiveRoll ? (
          <>
            <p className="dice-active-msg">
              Tirada lista. Tocá una celda para anotar.
            </p>
            <button className="btn btn-ghost" onClick={handleDiscard}>
              Descartar tirada
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-primary dice-roll-btn"
              onClick={handleRoll}
              disabled={!canRoll}
            >
              {rollNum === 0
                ? 'Lanzar dados'
                : rollNum < 3
                ? `Relanzar (${unlockedCount})`
                : 'Sin más tiros'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleSave}
              disabled={!canSave}
            >
              Guardar tirada
            </button>
            {rollNum > 0 && (
              <button className="btn btn-ghost" onClick={reset}>
                Nueva tirada
              </button>
            )}
          </>
        )}
      </div>

      {history.length > 0 && (
        <details className="dice-history">
          <summary>Últimas tiradas ({history.length})</summary>
          <div className="dice-history-list">
            {history.map(h => (
              <div key={h.ts} className="dice-history-item">
                <span className="dice-history-values">
                  {h.values.map((v, i) => (
                    <DieIcon key={i} face={v} size={18} />
                  ))}
                </span>
                <span className="dice-history-total">{h.total}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
