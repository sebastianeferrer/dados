import type { CategoryId, GameVariant, Player, ScoreEntry } from '../types/game';

export type SectionId = 'upper' | 'lower';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  type: 'number' | 'combination' | 'chance' | 'bonus';
  section?: SectionId;
  baseScore: number;
  servedBonus: number;
  winOnServed: boolean;
  maxInput?: number;
  requiresScored?: CategoryId;
  dieFace?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Score is the sum of all 5 dice instead of a fixed value (Three of a Kind). */
  sumAllDice?: boolean;
  /** Categoría especial auto-tracked (Yahtzee Bonus): no cuenta para completar el juego. */
  autoTracked?: boolean;
  /** Yahtzee Original: la escalera larga NO acepta 1-3-4-5-6 como wildcard. */
  strictLargeStraight?: boolean;
}

export const CLASSIC_CATEGORIES: CategoryDef[] = [
  { id: 'ones',   label: 'Unos',   dieFace: 1, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 5  },
  { id: 'twos',   label: 'Doses',  dieFace: 2, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 10 },
  { id: 'threes', label: 'Treses', dieFace: 3, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 15 },
  { id: 'fours',  label: 'Cuatros',dieFace: 4, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 20 },
  { id: 'fives',  label: 'Cincos', dieFace: 5, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 25 },
  { id: 'sixes',  label: 'Seises', dieFace: 6, type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 30 },
  { id: 'escalera',      label: 'Escalera',       type: 'combination', baseScore: 20,  servedBonus: 5, winOnServed: false               },
  { id: 'full',          label: 'Full',           type: 'combination', baseScore: 30,  servedBonus: 5, winOnServed: false               },
  { id: 'poker',         label: 'Poker',          type: 'combination', baseScore: 40,  servedBonus: 5, winOnServed: false               },
  { id: 'generala',      label: 'Generala',       type: 'combination', baseScore: 50,  servedBonus: 0, winOnServed: true                },
  { id: 'generalaDoble', label: 'Generala Doble', type: 'combination', baseScore: 100, servedBonus: 0, winOnServed: false, requiresScored: 'generala' },
];

/** Generahtzee — variante híbrida Generala+Yahtzee del repo. */
export const YAHTZEE_CATEGORIES: CategoryDef[] = [
  // Upper Section
  { id: 'ones',   label: 'Unos',    dieFace: 1, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 5  },
  { id: 'twos',   label: 'Doses',   dieFace: 2, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 10 },
  { id: 'threes', label: 'Treses',  dieFace: 3, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 15 },
  { id: 'fours',  label: 'Cuatros', dieFace: 4, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 20 },
  { id: 'fives',  label: 'Cincos',  dieFace: 5, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 25 },
  { id: 'sixes',  label: 'Seises',  dieFace: 6, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 30 },
  // Lower Section
  // Lower combos (excepto generalas y chance) tienen +5 si se anotan servidas (1er tiro).
  { id: 'threeOfKind',   label: 'Trío',           section: 'lower', type: 'combination', baseScore: 0,   servedBonus: 5, winOnServed: false, sumAllDice: true },
  { id: 'full',          label: 'Full',           section: 'lower', type: 'combination', baseScore: 30,  servedBonus: 5, winOnServed: false },
  { id: 'poker',         label: 'Poker',          section: 'lower', type: 'combination', baseScore: 40,  servedBonus: 5, winOnServed: false },
  { id: 'smallStreet',   label: 'Escalera Corta', section: 'lower', type: 'combination', baseScore: 20,  servedBonus: 5, winOnServed: false },
  { id: 'largeStreet',   label: 'Escalera Larga', section: 'lower', type: 'combination', baseScore: 40,  servedBonus: 5, winOnServed: false },
  { id: 'generala',      label: 'Generala',       section: 'lower', type: 'combination', baseScore: 50,  servedBonus: 0, winOnServed: true  },
  { id: 'generalaDoble', label: 'Generala Doble', section: 'lower', type: 'combination', baseScore: 100, servedBonus: 0, winOnServed: false, requiresScored: 'generala' },
  { id: 'chance',        label: 'Chance',         section: 'lower', type: 'chance',      baseScore: 0,   servedBonus: 0, winOnServed: false },
];

/**
 * Yahtzee Original — reglas oficiales:
 * - Sin bonus servida (+5).
 * - Three/Four of a Kind: suma de los 5 dados (no valores fijos).
 * - Full House = 25, Escalera Corta = 30, Escalera Larga = 40 (estricta, sin 1-3-4-5-6).
 * - Yahtzee = 50 (sin instant-win servida).
 * - Chance = suma de los 5 dados (no comodín).
 * - Yahtzee Bonus: +100 acumulado por cada 5-iguales adicional tras el primer Yahtzee.
 */
export const YAHTZEE_ORIGINAL_CATEGORIES: CategoryDef[] = [
  // Upper Section
  { id: 'ones',   label: 'Unos',    dieFace: 1, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 5  },
  { id: 'twos',   label: 'Doses',   dieFace: 2, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 10 },
  { id: 'threes', label: 'Treses',  dieFace: 3, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 15 },
  { id: 'fours',  label: 'Cuatros', dieFace: 4, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 20 },
  { id: 'fives',  label: 'Cincos',  dieFace: 5, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 25 },
  { id: 'sixes',  label: 'Seises',  dieFace: 6, section: 'upper', type: 'number', baseScore: 0, servedBonus: 0, winOnServed: false, maxInput: 30 },
  // Lower Section
  { id: 'threeOfKind',   label: 'Trío (3 iguales)',  section: 'lower', type: 'combination', baseScore: 0,  servedBonus: 0, winOnServed: false, sumAllDice: true },
  { id: 'poker',         label: 'Poker (4 iguales)', section: 'lower', type: 'combination', baseScore: 0,  servedBonus: 0, winOnServed: false, sumAllDice: true },
  { id: 'full',          label: 'Full',              section: 'lower', type: 'combination', baseScore: 25, servedBonus: 0, winOnServed: false },
  { id: 'smallStreet',   label: 'Escalera Corta',    section: 'lower', type: 'combination', baseScore: 30, servedBonus: 0, winOnServed: false },
  { id: 'largeStreet',   label: 'Escalera Larga',    section: 'lower', type: 'combination', baseScore: 40, servedBonus: 0, winOnServed: false, strictLargeStraight: true },
  { id: 'generala',      label: 'Yahtzee',           section: 'lower', type: 'combination', baseScore: 50, servedBonus: 0, winOnServed: false },
  { id: 'chance',        label: 'Chance',            section: 'lower', type: 'combination', baseScore: 0,  servedBonus: 0, winOnServed: false, sumAllDice: true },
  // Yahtzee Bonus — auto-tracked, +100 por cada 5-iguales adicional tras el primer Yahtzee
  { id: 'yahtzeeBonus',  label: 'Yahtzee Bonus',     section: 'lower', type: 'bonus', baseScore: 0, servedBonus: 0, winOnServed: false, autoTracked: true },
];

export const UPPER_BONUS_THRESHOLD = 63;
export const UPPER_BONUS_VALUE = 35;
export const YAHTZEE_BONUS_VALUE = 100;

export function getCategories(variant: GameVariant): CategoryDef[] {
  if (variant === 'yahtzee') return YAHTZEE_CATEGORIES;
  if (variant === 'yahtzeeOriginal') return YAHTZEE_ORIGINAL_CATEGORIES;
  return CLASSIC_CATEGORIES;
}

/** Categorías que cuentan para "juego completo" (excluye autoTracked). */
export function getRequiredCategories(variant: GameVariant): CategoryDef[] {
  return getCategories(variant).filter(c => !c.autoTracked);
}

/** True si la variante usa la sección superior con bonus +35 a partir de 63. */
export function hasUpperBonus(variant: GameVariant): boolean {
  return variant === 'yahtzee' || variant === 'yahtzeeOriginal';
}

export function findCategory(id: CategoryId, variant: GameVariant): CategoryDef | undefined {
  return getCategories(variant).find(c => c.id === id);
}

/** Backward-compat: classic categories. New code should use getCategories(variant). */
export const CATEGORIES = CLASSIC_CATEGORIES;

function sumScores(player: Player): number {
  return Object.values(player.scores).reduce(
    (sum, entry) => sum + ((entry as ScoreEntry)?.value ?? 0),
    0
  );
}

export function getUpperSubtotal(player: Player, variant: GameVariant): number {
  return getCategories(variant)
    .filter(c => c.section === 'upper')
    .reduce((sum, c) => sum + (player.scores[c.id]?.value ?? 0), 0);
}

export function getUpperBonus(player: Player, variant: GameVariant): number {
  if (!hasUpperBonus(variant)) return 0;
  return getUpperSubtotal(player, variant) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_VALUE : 0;
}

export function getTotal(player: Player, variant: GameVariant = 'classic'): number {
  const base = sumScores(player);
  return base + getUpperBonus(player, variant);
}

export function hasGeneralaServida(player: Player, variant: GameVariant = 'classic'): boolean {
  return getCategories(variant).some(cat => {
    if (!cat.winOnServed) return false;
    const entry = player.scores[cat.id];
    return entry !== undefined && !entry.scratched && entry.served === true;
  });
}

/** Total used for ranking. Generala servida = instant win → Infinity. */
export function getRankingValue(player: Player, variant: GameVariant = 'classic'): number {
  return hasGeneralaServida(player, variant) ? Infinity : getTotal(player, variant);
}

export function isCategoryAvailable(
  categoryId: CategoryId,
  player: Player,
  variant: GameVariant = 'classic'
): boolean {
  const cat = findCategory(categoryId, variant);
  if (!cat?.requiresScored) return true;
  const req = player.scores[cat.requiresScored];
  return req !== undefined && !req.scratched;
}

export function isCategoryPermanentlyBlocked(
  categoryId: CategoryId,
  player: Player,
  variant: GameVariant = 'classic'
): boolean {
  const cat = findCategory(categoryId, variant);
  if (!cat?.requiresScored) return false;
  const req = player.scores[cat.requiresScored];
  if (categoryId === 'generalaDoble' && req?.scratched === true) return false;
  return req?.scratched === true;
}

export function isGameComplete(players: Player[], variant: GameVariant = 'classic'): boolean {
  if (players.length === 0) return false;
  const cats = getRequiredCategories(variant);
  return players.every(player => {
    if (Object.keys(player.scores).length === 0) return false;
    return cats.every(cat => {
      if (player.scores[cat.id] !== undefined) return true;
      return isCategoryPermanentlyBlocked(cat.id, player, variant);
    });
  });
}

export function getWinner(players: Player[], variant: GameVariant = 'classic'): Player {
  return players.reduce(
    (best, p) => (getRankingValue(p, variant) > getRankingValue(best, variant) ? p : best),
    players[0]
  );
}

const DIE_FACE: Partial<Record<CategoryId, number>> = {
  ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6,
};

export function getNumberOptions(categoryId: CategoryId): number[] {
  const face = DIE_FACE[categoryId];
  if (!face) return [];
  return [1, 2, 3, 4, 5].map(n => n * face);
}

/** Detect if the dice form a small straight (4 consecutive). */
function isSmallStraight(dice: number[]): boolean {
  const set = new Set(dice);
  const seqs = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];
  return seqs.some(seq => seq.every(n => set.has(n)));
}

/**
 * Detect if the dice form a large straight (5 consecutive).
 * @param strict si true, NO acepta 1-3-4-5-6 (modo Yahtzee Original).
 */
function isLargeStraight(dice: number[], strict = false): boolean {
  const sorted = [...dice].sort((a, b) => a - b).join('');
  if (sorted === '12345' || sorted === '23456') return true;
  if (!strict && sorted === '13456') return true; // 1 actúa como 7 en Generala/Generahtzee
  return false;
}

/**
 * Suggested score for a category given the dice. Returns null when the dice
 * don't qualify for that combo. Caller decides whether to apply or scratch.
 */
export function suggestScoreFromDice(
  dice: number[],
  categoryId: CategoryId,
  isFirstRoll: boolean,
  variant: GameVariant = 'classic'
): { value: number; served: boolean; canApply: boolean } | null {
  if (dice.length !== 5) return null;
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const sumAll = dice.reduce((s, v) => s + v, 0);
  const cat = findCategory(categoryId, variant);
  if (!cat) return null;

  if (cat.type === 'number' && cat.dieFace) {
    const face = cat.dieFace;
    const n = dice.filter(d => d === face).length;
    return { value: n * face, served: false, canApply: n > 0 };
  }

  // Combinations
  const isFull = countValues[0] === 3 && countValues[1] === 2;
  const isPoker = countValues[0] >= 4;
  const isGenerala = countValues[0] === 5;
  const isThreeOfKind = countValues[0] >= 3;
  const isStrictLarge = !!cat.strictLargeStraight;

  // Helper para combos que pueden ser sumAll o baseScore
  const comboValue = (matched: boolean) => {
    if (!matched) return null;
    const base = cat.sumAllDice ? sumAll : cat.baseScore;
    return {
      value: base + (isFirstRoll ? cat.servedBonus : 0),
      served: isFirstRoll && cat.servedBonus > 0,
      canApply: true,
    };
  };

  switch (categoryId) {
    case 'escalera':
      return comboValue(isLargeStraight(dice));
    case 'full':
      return comboValue(isFull);
    case 'poker':
      return comboValue(isPoker);
    case 'generala':
      if (!isGenerala) return null;
      return { value: cat.baseScore, served: cat.winOnServed && isFirstRoll, canApply: true };
    case 'generalaDoble':
      if (!isGenerala) return null;
      return { value: cat.baseScore, served: false, canApply: true };
    case 'threeOfKind':
      return comboValue(isThreeOfKind);
    case 'smallStreet':
      return comboValue(isSmallStraight(dice));
    case 'largeStreet':
      return comboValue(isLargeStraight(dice, isStrictLarge));
    case 'chance':
      // Si la variante usa chance como sumAll (Yahtzee Original) lo manejamos aquí.
      // Si es comodín (Generahtzee), el caller usa resolveChanceTargets().
      if (cat.sumAllDice) {
        return { value: sumAll, served: false, canApply: true };
      }
      return null;
  }
  return null;
}

/**
 * Categories the player could redirect Chance into: not yet scored,
 * not blocked, not Chance itself. No dice required — pure schema check.
 */
export function getChanceCandidates(
  player: Player,
  variant: GameVariant
): CategoryDef[] {
  return getCategories(variant).filter(cat => {
    if (cat.id === 'chance') return false;
    if (isCategoryPermanentlyBlocked(cat.id, player, variant)) return false;
    if (!isCategoryAvailable(cat.id, player, variant)) return false;
    return true;
  });
}

/**
 * Returns the available targets for Chance: every non-scored, non-blocked
 * category (excluding Chance itself) with the value it would produce.
 */
export function resolveChanceTargets(
  dice: number[],
  player: Player,
  isFirstRoll: boolean,
  variant: GameVariant
): Array<{ category: CategoryDef; value: number; served: boolean }> {
  const cats = getCategories(variant);
  const out: Array<{ category: CategoryDef; value: number; served: boolean }> = [];
  for (const cat of cats) {
    if (cat.id === 'chance') continue;
    if (isCategoryPermanentlyBlocked(cat.id, player, variant)) continue;
    if (!isCategoryAvailable(cat.id, player, variant)) continue;
    const sug = suggestScoreFromDice(dice, cat.id, isFirstRoll, variant);
    // Chance accepts any value (even 0 for an unproductive number category)
    const value = sug?.value ?? 0;
    out.push({ category: cat, value, served: sug?.served ?? false });
  }
  return out;
}

export function getCurrentRound(players: Player[], variant: GameVariant = 'classic'): number {
  if (players.length === 0) return 1;
  const cats = getRequiredCategories(variant);
  const minFilled = Math.min(...players.map(p => Object.keys(p.scores).length));
  return Math.min(minFilled + 1, cats.length);
}

/** True si los 5 dados son iguales (Yahtzee/Generala). */
export function isFiveOfKind(dice: number[]): boolean {
  return dice.length === 5 && new Set(dice).size === 1;
}

/**
 * Yahtzee Bonus: +100 por cada Yahtzee adicional luego de anotar el primero ≥50.
 * Devuelve cuánto se debe sumar al bonus actual del jugador, dado que acaba de
 * usar `dice` para anotar `categoryId`. Devuelve 0 si no aplica.
 */
export function getYahtzeeBonusIncrement(
  player: Player,
  dice: number[],
  categoryId: CategoryId,
  variant: GameVariant
): number {
  if (variant !== 'yahtzeeOriginal') return 0;
  if (categoryId === 'generala') return 0; // anotando el Yahtzee inicial no genera bonus
  if (!isFiveOfKind(dice)) return 0;
  const yahtzee = player.scores['generala'];
  if (!yahtzee || yahtzee.scratched) return 0;
  if (yahtzee.value < 50) return 0;
  return YAHTZEE_BONUS_VALUE;
}

/**
 * Returns the index of the player whose turn it is.
 * Rule: the player with the fewest scored cells goes next.
 * Ties are broken left-to-right (lowest index first).
 */
export function computeCurrentPlayerIndex(players: Player[]): number {
  if (players.length === 0) return 0;
  const counts = players.map(p => Object.keys(p.scores).length);
  const min = Math.min(...counts);
  return counts.findIndex(c => c === min);
}

export function getPlayerRanks(
  players: Player[],
  variant: GameVariant = 'classic'
): Map<string, number> {
  const sorted = [...players].sort(
    (a, b) => getRankingValue(b, variant) - getRankingValue(a, variant)
  );
  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (
      i > 0 &&
      getRankingValue(sorted[i], variant) < getRankingValue(sorted[i - 1], variant)
    ) {
      rank = i + 1;
    }
    rankMap.set(sorted[i].id, rank);
  }
  return rankMap;
}
