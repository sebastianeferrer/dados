import { useState } from 'react';
import type { Player } from '../types/game';

interface Props {
  onStart: (players: Player[], turnOrderEnabled: boolean) => void;
}

export function PlayerSetup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(['', '']);
  const [turnControl, setTurnControl] = useState(true);

  const addPlayer    = () => { if (names.length < 10) setNames([...names, '']); };
  const removePlayer = (i: number) => { if (names.length > 2) setNames(names.filter((_, j) => j !== i)); };
  const updateName   = (i: number, v: string) => setNames(names.map((n, j) => j === i ? v : n));

  const trimmed      = names.map(n => n.trim());
  const allFilled    = trimmed.every(n => n.length > 0);
  const noDuplicates = new Set(trimmed.map(n => n.toLowerCase())).size === names.length;
  const canStart     = allFilled && noDuplicates;

  const handleStart = () => {
    if (!canStart) return;
    const players: Player[] = trimmed.map((name, i) => ({
      id: `p${i}-${Date.now()}`,
      name,
      scores: {},
    }));
    onStart(players, turnControl);
  };

  return (
    <div className="setup-container">
      <h2 className="setup-title">Nueva partida</h2>
      <p className="setup-subtitle">Generala — ingresá los jugadores</p>

      <div className="player-list">
        {names.map((name, i) => (
          <div key={i} className="player-input-row">
            <span className="player-number">{i + 1}</span>
            <input
              className="player-input"
              type="text"
              placeholder={`Jugador ${i + 1}`}
              value={name}
              onChange={e => updateName(i, e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              maxLength={20}
              autoFocus={i === 0}
            />
            {names.length > 2 && (
              <button className="remove-btn" onClick={() => removePlayer(i)} aria-label="Eliminar">
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {!noDuplicates && allFilled && (
        <p className="setup-error">Los nombres no pueden repetirse.</p>
      )}

      <label className="setup-checkbox">
        <input
          type="checkbox"
          checked={turnControl}
          onChange={e => setTurnControl(e.target.checked)}
        />
        <span>Control de turno</span>
        <span className="setup-checkbox-hint">
          — detecta y avisa si se anota fuera de orden
        </span>
      </label>

      <div className="setup-actions">
        {names.length < 10 && (
          <button className="btn btn-secondary" onClick={addPlayer}>
            + Agregar jugador
          </button>
        )}
        <button className="btn btn-primary" onClick={handleStart} disabled={!canStart}>
          Comenzar partida
        </button>
      </div>
    </div>
  );
}
