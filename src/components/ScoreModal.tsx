import { useEffect, useMemo, useState } from 'react';
import type { Player, ScoreEntry, DieFace, GameVariant, CategoryId } from '../types/game';
import type { CategoryDef } from '../games/generala';
import {
  getNumberOptions,
  suggestScoreFromDice,
  resolveChanceTargets,
  getChanceCandidates,
  findCategory,
} from '../games/generala';
import { DieIcon } from './DieIcon';

interface Props {
  player: Player;
  category: CategoryDef;
  variant: GameVariant;
  isEdit?: boolean;
  lockedToScratchOnly?: boolean;
  diceValues?: DieFace[];
  isFirstRoll?: boolean;
  onConfirm: (entry: ScoreEntry) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function ScoreModal({
  player, category, variant, isEdit, lockedToScratchOnly,
  diceValues, isFirstRoll = false,
  onConfirm, onDelete, onCancel,
}: Props) {
  const [chanceTarget, setChanceTarget] = useState<CategoryId | null>(null);
  const [manualMode, setManualMode] = useState<'sum' | 'dice'>('sum');
  const [manualSum, setManualSum] = useState<string>('');
  const [manualDice, setManualDice] = useState<(DieFace | 0)[]>([0, 0, 0, 0, 0]);
  const [manualServed, setManualServed] = useState(false);

  const manualDiceTotal = useMemo(
    () => manualDice.reduce((s, v) => s + v, 0),
    [manualDice]
  );
  const manualDiceComplete = manualDice.every(v => v > 0);
  const parsedSum = parseInt(manualSum, 10);
  const sumValid = Number.isFinite(parsedSum) && parsedSum >= 5 && parsedSum <= 30;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const isChance = category.type === 'chance';

  // When Chance is redirected to another category, render that target's UI.
  const targetCategory = chanceTarget ? findCategory(chanceTarget, variant) : null;
  const effectiveCategory = targetCategory ?? category;
  const viaChanceId = isChance && targetCategory ? targetCategory.id : undefined;

  // Reset manual entry state when switching chance target.
  useEffect(() => {
    setManualSum('');
    setManualDice([0, 0, 0, 0, 0]);
    setManualServed(false);
    setManualMode('sum');
  }, [chanceTarget]);

  const score = (
    value: number,
    served = false,
    scratched = false,
    viaChanceOverride?: CategoryId,
  ) => {
    const entry: ScoreEntry = { value, served, scratched };
    const v = viaChanceOverride ?? viaChanceId;
    if (v) entry.viaChance = v;
    onConfirm(entry);
  };

  const suggestion = diceValues && diceValues.length === 5 && !isChance
    ? suggestScoreFromDice(diceValues, effectiveCategory.id, isFirstRoll, variant)
    : (targetCategory && diceValues && diceValues.length === 5
        ? suggestScoreFromDice(diceValues, targetCategory.id, isFirstRoll, variant)
        : null);

  const options = getNumberOptions(effectiveCategory.id);
  const isNumber = effectiveCategory.type === 'number';

  const canScratch =
    effectiveCategory.id !== 'generala' || player.scores['generalaDoble'] !== undefined;

  // Chance: lista de candidatos (todas las categorías disponibles)
  const chanceCandidates = isChance ? getChanceCandidates(player, variant) : [];
  const chanceCalc = isChance && diceValues && diceValues.length === 5
    ? resolveChanceTargets(diceValues, player, isFirstRoll, variant)
    : [];
  const chanceCalcMap = new Map(chanceCalc.map(t => [t.category.id, t]));

  // Showing chance picker = is Chance category and no target selected yet.
  const showChancePicker = isChance && !lockedToScratchOnly && !targetCategory;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-category">
            {category.dieFace
              ? <span className="modal-die"><DieIcon face={category.dieFace} size={26} /></span>
              : category.label}
            {targetCategory && (
              <span className="modal-edit-badge"> → {targetCategory.label}</span>
            )}
            {isEdit && <span className="modal-edit-badge"> · editando</span>}
          </h3>
          <span className="modal-player">{player.name}</span>
        </div>

        <div className="modal-body">
          {diceValues && diceValues.length === 5 && (
            <div className="modal-dice-strip">
              <span className="modal-dice-label">Tu tirada</span>
              <span className="modal-dice-values">
                {diceValues.map((v, i) => (
                  <DieIcon key={i} face={v} size={28} />
                ))}
              </span>
              {suggestion && suggestion.canApply && !lockedToScratchOnly && !showChancePicker && (
                <button
                  className="btn btn-suggested"
                  onClick={() => score(suggestion.value, suggestion.served, false)}
                  autoFocus
                >
                  Anotar {suggestion.value} pts
                  {suggestion.served && effectiveCategory.winOnServed && ' (¡Ganás!)'}
                  {suggestion.served && !effectiveCategory.winOnServed && ' · servido'}
                </button>
              )}
            </div>
          )}

          {showChancePicker ? (
            <>
              <p className="modal-hint">
                Chance es comodín — elegí qué categoría aplicar.
                {diceValues && diceValues.length === 5
                  ? ' El valor calculado aparece a la derecha.'
                  : ' Después ingresás el valor que corresponda.'}
                <br />
                <span className="confirm-subtext">El valor se anota en Chance; la categoría destino queda libre.</span>
              </p>
              <div className="chance-targets">
                {chanceCandidates.length === 0 && (
                  <p className="modal-hint">No hay categorías disponibles para Chance.</p>
                )}
                {chanceCandidates.map(cat => {
                  const calc = chanceCalcMap.get(cat.id);
                  const hasDice = !!diceValues && diceValues.length === 5;
                  const directApply = hasDice && calc && cat.type !== 'chance';
                  return (
                    <button
                      key={cat.id}
                      className="btn btn-option chance-target"
                      onClick={() => {
                        if (directApply) {
                          score(calc.value, calc.served, false, cat.id);
                        } else {
                          setChanceTarget(cat.id);
                        }
                      }}
                    >
                      <span className="option-dice">
                        {cat.dieFace && <DieIcon face={cat.dieFace} size={18} />} {cat.label}
                      </span>
                      <span className="option-pts">
                        {directApply
                          ? <>{calc.value} pts{calc.served ? ' · servido' : ''}</>
                          : <>elegir →</>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-scratch" onClick={() => score(0, false, true)}>
                Tachar Chance <span className="score-preview">0 pts</span>
              </button>
            </>
          ) : lockedToScratchOnly ? (
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
              {targetCategory && (
                <button className="btn btn-ghost chance-back" onClick={() => setChanceTarget(null)}>
                  ← Cambiar categoría
                </button>
              )}
              <div className="number-options">
                {options.map((value, i) => (
                  <button
                    key={value}
                    className="btn btn-option"
                    onClick={() => score(value)}
                    autoFocus={i === 0 && !suggestion}
                  >
                    <span className="option-dice">{i + 1} dado{i > 0 ? 's' : ''}</span>
                    <span className="option-pts">{value} pts</span>
                  </button>
                ))}
              </div>
              {!targetCategory && (
                <button className="btn btn-scratch" onClick={() => score(0, false, true)}>
                  Tachar <span className="score-preview">0 pts</span>
                </button>
              )}
            </>
          ) : (
            <>
              {targetCategory && (
                <button className="btn btn-ghost chance-back" onClick={() => setChanceTarget(null)}>
                  ← Cambiar categoría
                </button>
              )}
              <div className="combination-options">
                {effectiveCategory.winOnServed && (
                  <button className="btn btn-win" onClick={() => score(effectiveCategory.baseScore, true)}
                    autoFocus={!suggestion}
                  >
                    Servida — ¡Ganá la partida!
                  </button>
                )}
                {!effectiveCategory.winOnServed && effectiveCategory.servedBonus > 0 && !effectiveCategory.sumAllDice && (
                  <button
                    className="btn btn-served"
                    onClick={() => score(effectiveCategory.baseScore + effectiveCategory.servedBonus, true)}
                    autoFocus={!suggestion}
                  >
                    Servido <span className="score-preview">
                      {effectiveCategory.baseScore + effectiveCategory.servedBonus} pts
                    </span>
                  </button>
                )}
                {effectiveCategory.sumAllDice && diceValues && diceValues.length === 5 ? (
                  <button
                    className="btn btn-normal"
                    onClick={() => {
                      const sum = diceValues.reduce((s, v) => s + v, 0);
                      const final = sum + (isFirstRoll ? effectiveCategory.servedBonus : 0);
                      score(final, isFirstRoll, false);
                    }}
                  >
                    {isFirstRoll && effectiveCategory.servedBonus > 0
                      ? `Servido (suma + ${effectiveCategory.servedBonus})`
                      : 'Suma de los 5 dados'}
                    <span className="score-preview">
                      {diceValues.reduce((s, v) => s + v, 0) + (isFirstRoll ? effectiveCategory.servedBonus : 0)} pts
                    </span>
                  </button>
                ) : effectiveCategory.sumAllDice ? (
                  <div className="manual-trio">
                    <div className="manual-trio-tabs">
                      <button
                        type="button"
                        className={`manual-trio-tab${manualMode === 'sum' ? ' is-active' : ''}`}
                        onClick={() => setManualMode('sum')}
                      >
                        Ingresar suma
                      </button>
                      <button
                        type="button"
                        className={`manual-trio-tab${manualMode === 'dice' ? ' is-active' : ''}`}
                        onClick={() => setManualMode('dice')}
                      >
                        Ingresar cada dado
                      </button>
                    </div>

                    {manualMode === 'sum' ? (
                      <>
                        <label className="manual-trio-label">
                          Suma de los 5 dados (entre 5 y 30):
                        </label>
                        <input
                          className="manual-trio-input"
                          type="number"
                          inputMode="numeric"
                          min={5}
                          max={30}
                          value={manualSum}
                          onChange={e => setManualSum(e.target.value)}
                          placeholder="ej. 18"
                          autoFocus
                        />
                      </>
                    ) : (
                      <>
                        <label className="manual-trio-label">Valor de cada dado:</label>
                        <div className="manual-trio-dice">
                          {manualDice.map((val, i) => (
                            <select
                              key={i}
                              className="manual-trio-select"
                              value={val}
                              onChange={e => {
                                const next = [...manualDice];
                                next[i] = parseInt(e.target.value, 10) as DieFace | 0;
                                setManualDice(next);
                              }}
                            >
                              <option value={0}>—</option>
                              {[1, 2, 3, 4, 5, 6].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          ))}
                        </div>
                      </>
                    )}

                    {effectiveCategory.servedBonus > 0 && (
                      <label className="manual-trio-served">
                        <input
                          type="checkbox"
                          checked={manualServed}
                          onChange={e => setManualServed(e.target.checked)}
                        />
                        <span>Servido (+{effectiveCategory.servedBonus} pts en primer tiro)</span>
                      </label>
                    )}

                    {(() => {
                      const base = manualMode === 'sum'
                        ? (sumValid ? parsedSum : 0)
                        : (manualDiceComplete ? manualDiceTotal : 0);
                      const ready = manualMode === 'sum' ? sumValid : manualDiceComplete;
                      const final = base + (manualServed ? effectiveCategory.servedBonus : 0);
                      return (
                        <button
                          className={`btn ${manualServed ? 'btn-served' : 'btn-normal'}`}
                          disabled={!ready}
                          onClick={() => ready && score(final, manualServed, false)}
                        >
                          Anotar{manualServed ? ' servido' : ''}
                          <span className="score-preview">{ready ? `${final} pts` : '—'}</span>
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  <button className="btn btn-normal" onClick={() => score(effectiveCategory.baseScore)}>
                    Normal <span className="score-preview">{effectiveCategory.baseScore} pts</span>
                  </button>
                )}
              </div>
              {!targetCategory && (
                canScratch ? (
                  <button className="btn btn-scratch" onClick={() => score(0, false, true)}>
                    Tachar <span className="score-preview">0 pts</span>
                  </button>
                ) : (
                  <p className="modal-hint scratch-blocked">
                    Para tachar Generala primero tachá Generala Doble.
                  </p>
                )
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
