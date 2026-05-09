import { useEffect, useState } from 'react';
import type { GameVariant } from '../types/game';
import { HELP_RULES } from '../constants/helpRules';

interface Props {
  /** Si se pasa, muestra solo las reglas de esa variante (modo dentro de juego). */
  variant?: GameVariant;
  onClose: () => void;
}

export function HelpModal({ variant, onClose }: Props) {
  const variants: GameVariant[] = ['classic', 'yahtzee', 'yahtzeeOriginal'];
  const [active, setActive] = useState<GameVariant>(variant ?? 'classic');

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const content = HELP_RULES[active];
  const showTabs = !variant; // sólo desde el panel principal

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-help" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-category">Reglas — {content.name}</h3>
        </div>

        {showTabs && (
          <div className="help-tabs">
            {variants.map(v => (
              <button
                key={v}
                type="button"
                className={`help-tab${active === v ? ' is-active' : ''}`}
                onClick={() => setActive(v)}
              >
                {HELP_RULES[v].name}
              </button>
            ))}
          </div>
        )}

        <div className="help-content">
          <p className="help-intro">{content.intro}</p>
          {content.sections.map(sec => (
            <div key={sec.title} className="help-section">
              <h4 className="help-section-title">{sec.title}</h4>
              <ul className="help-list">
                {sec.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="confirm-actions">
          <button className="btn btn-primary" onClick={onClose} autoFocus>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
