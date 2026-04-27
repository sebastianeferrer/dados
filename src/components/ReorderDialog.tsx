import { useState } from 'react';
import type { Player } from '../types/game';

interface Props {
  players: Player[];
  onConfirm: (reordered: Player[]) => void;
  onCancel: () => void;
}

export function ReorderDialog({ players, onConfirm, onCancel }: Props) {
  const [order, setOrder] = useState<Player[]>([...players]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-category">Orden de turnos</h3>
        </div>
        <p className="modal-hint">
          El primero juega primero. Las columnas de la tabla se reordenan en consecuencia.
        </p>

        <div className="reorder-list">
          {order.map((p, i) => (
            <div key={p.id} className="reorder-item">
              <span className="reorder-pos">{i + 1}</span>
              <span className="reorder-name">{p.name}</span>
              <div className="reorder-arrows">
                <button
                  className="reorder-btn"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  className="reorder-btn"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label="Bajar"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => onConfirm(order)}>
          Confirmar orden
        </button>
        <button className="modal-cancel" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
