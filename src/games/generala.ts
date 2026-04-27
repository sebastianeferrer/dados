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
  return players.reduce((best, p) => (getTotal(p) > getTotal(best) ? p : best), players[0]);
}

const DIE_FACE: Partial<Record<CategoryId, number>> = {
  ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6,
};

export function getNumberOptions(categoryId: CategoryId): number[] {
  const face = DIE_FACE[categoryId];
  if (!face) return [];
  return [1, 2, 3, 4, 5].map(n => n * face);
}

export function getCurrentRound(players: Player[]): number {
  if (players.length === 0) return 1;
  const minFilled = Math.min(...players.map(p => Object.keys(p.scores).length));
  return Math.min(minFilled + 1, CATEGORIES.length);
}

export function getPlayerRanks(players: Player[]): Map<string, number> {
  const sorted = [...players].sort((a, b) => getTotal(b) - getTotal(a));
  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getTotal(sorted[i]) < getTotal(sorted[i - 1])) rank = i + 1;
    rankMap.set(sorted[i].id, rank);
  }
  return rankMap;
}
