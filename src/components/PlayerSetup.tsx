import { useState } from 'react';
import type { Player, GameVariant } from '../types/game';

interface Props {
  onStart: (
    players: Player[],
    turnOrderEnabled: boolean,
    virtualDiceEnabled: boolean,
    variant: GameVariant,
  ) => void;
}

export function PlayerSetup({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(['', '']);
  const [turnControl, setTurnControl] = useState(true);
  const [virtualDice, setVirtualDice] = useState(false);
  const [variant, setVariant] = useState<GameVariant>('classic');

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
    onStart(players, turnControl, virtualDice, variant);
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

      <div className="setup-mode-group">
        <span className="setup-mode-label">Variante del juego</span>
        <div className="setup-mode-options">
          <button
            type="button"
            className={`setup-mode-btn${variant === 'classic' ? ' is-active' : ''}`}
            onClick={() => setVariant('classic')}
          >
            <span className="setup-mode-title">Generala Clásica</span>
            <span className="setup-mode-sub">11 categorías, escalera 20 / full 30 / poker 40</span>
          </button>
          <button
            type="button"
            className={`setup-mode-btn${variant === 'yahtzee' ? ' is-active' : ''}`}
            onClick={() => setVariant('yahtzee')}
          >
            <span className="setup-mode-title">Yahtzee / Generala Moderna</span>
            <span className="setup-mode-sub">13 categorías, bonus +35, Trío y Chance</span>
          </button>
        </div>
      </div>

      <div className="setup-mode-group">
        <span className="setup-mode-label">Modo de partida</span>
        <div className="setup-mode-options">
          <button
            type="button"
            className={`setup-mode-btn${!virtualDice ? ' is-active' : ''}`}
            onClick={() => setVirtualDice(false)}
          >
            <span className="setup-mode-title">Sin dados virtuales</span>
            <span className="setup-mode-sub">Solo conteo de puntos</span>
          </button>
          <button
            type="button"
            className={`setup-mode-btn${virtualDice ? ' is-active' : ''}`}
            onClick={() => setVirtualDice(true)}
          >
            <span className="setup-mode-title">Con dados virtuales</span>
            <span className="setup-mode-sub">Lanzar dados en pantalla</span>
          </button>
        </div>
      </div>

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
