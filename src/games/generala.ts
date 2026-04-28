import type { CategoryId, Player, ScoreEntry } from '../types/game';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  type: 'number' | 'combination';
  baseScore: number;
  servedBonus: number;
  winOnServed: boolean;
  maxInput?: number;
  requiresScored?: CategoryId;
  dieFace?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const CATEGORIES: CategoryDef[] = [
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

export function getTotal(player: Player): number {
  return Object.values(player.scores).reduce(
    (sum, entry) => sum + ((entry as ScoreEntry)?.value ?? 0),
    0
  );
}

export function hasGeneralaServida(player: Player): boolean {
  return CATEGORIES.some(cat => {
    if (!cat.winOnServed) return false;
    const entry = player.scores[cat.id];
    return entry !== undefined && !entry.scratched && entry.served === true;
  });
}

/** Total used for ranking. Generala servida = instant win → Infinity. */
export function getRankingValue(player: Player): number {
  return hasGeneralaServida(player) ? Infinity : getTotal(player);
}

export function isCategoryAvailable(categoryId: CategoryId, player: Player): boolean {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat?.requiresScored) return true;
  const req = player.scores[cat.requiresScored];
  return req !== undefined && !req.scratched;
}

export function isCategoryPermanentlyBlocked(categoryId: CategoryId, player: Player): boolean {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat?.requiresScored) return false;
  const req = player.scores[cat.requiresScored];
  return req?.scratched === true;
}

export function isGameComplete(players: Player[]): boolean {
  if (players.length === 0) return false;
  return players.every(player => {
    // A player who hasn't scored anything yet is never complete
    if (Object.keys(player.scores).length === 0) return false;
    return CATEGORIES.every(cat => {
      if (player.scores[cat.id] !== undefined) return true;
      return isCategoryPermanentlyBlocked(cat.id, player);
    });
  });
}

export function getWinner(players: Player[]): Player {
  return players.reduce(
    (best, p) => (getRankingValue(p) > getRankingValue(best) ? p : best),
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

/**
 * Given the 5 dice values + whether it was the first roll, returns the suggested
 * scoring for a category. Returns null if the dice don't qualify (non-served combo
 * that's not even achievable). The caller decides whether to apply it or scratch.
 */
export function suggestScoreFromDice(
  dice: number[],
  categoryId: CategoryId,
  isFirstRoll: boolean
): { value: number; served: boolean; canApply: boolean } | null {
  if (dice.length !== 5) return null;
  const sorted = [...dice].sort((a, b) => a - b);
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;

  // Number categories: 1-6
  if (cat.type === 'number' && cat.dieFace) {
    const face = cat.dieFace;
    const n = dice.filter(d => d === face).length;
    return { value: n * face, served: false, canApply: n > 0 };
  }

  // Combinations
  const isStraight =
    sorted.join('') === '12345' || sorted.join('') === '23456';
  // En Generala el As (1) puede usarse en lugar del 6 → 1,2,3,4,5 cubre ambos.
  const isFull = countValues[0] === 3 && countValues[1] === 2;
  const isPoker = countValues[0] >= 4;
  const isGenerala = countValues[0] === 5;

  switch (categoryId) {
    case 'escalera':
      if (!isStraight) return null;
      return {
        value: cat.baseScore + (isFirstRoll ? cat.servedBonus : 0),
        served: isFirstRoll,
        canApply: true,
      };
    case 'full':
      if (!isFull) return null;
      return {
        value: cat.baseScore + (isFirstRoll ? cat.servedBonus : 0),
        served: isFirstRoll,
        canApply: true,
      };
    case 'poker':
      if (!isPoker) return null;
      return {
        value: cat.baseScore + (isFirstRoll ? cat.servedBonus : 0),
        served: isFirstRoll,
        canApply: true,
      };
    case 'generala':
      if (!isGenerala) return null;
      return { value: cat.baseScore, served: isFirstRoll, canApply: true };
    case 'generalaDoble':
      if (!isGenerala) return null;
      return { value: cat.baseScore, served: false, canApply: true };
  }
  return null;
}

export function getCurrentRound(players: Player[]): number {
  if (players.length === 0) return 1;
  const minFilled = Math.min(...players.map(p => Object.keys(p.scores).length));
  return Math.min(minFilled + 1, CATEGORIES.length);
}

/**
 * Returns the index of the player whose turn it is.
 * Rule: the player with the fewest scored cells goes next.
 * Ties are broken left-to-right (lowest index first).
 * This is always computed from current scores — no stored index needed.
 */
export function computeCurrentPlayerIndex(players: Player[]): number {
  if (players.length === 0) return 0;
  const counts = players.map(p => Object.keys(p.scores).length);
  const min = Math.min(...counts);
  return counts.findIndex(c => c === min);
}

export function getPlayerRanks(players: Player[]): Map<string, number> {
  const sorted = [...players].sort((a, b) => getRankingValue(b) - getRankingValue(a));
  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getRankingValue(sorted[i]) < getRankingValue(sorted[i - 1])) rank = i + 1;
    rankMap.set(sorted[i].id, rank);
  }
  return rankMap;
}
