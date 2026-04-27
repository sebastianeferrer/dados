import { CategoryId, Player, ScoreEntry } from '../types/game';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  type: 'number' | 'combination';
  baseScore: number;
  servedBonus: number;
  winOnServed: boolean;
  maxInput?: number;
  requiresScored?: CategoryId;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'ones',          label: 'Unos',          type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 5   },
  { id: 'twos',          label: 'Doses',          type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 10  },
  { id: 'threes',        label: 'Treses',         type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 15  },
  { id: 'fours',         label: 'Cuatros',        type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 20  },
  { id: 'fives',         label: 'Cincos',         type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 25  },
  { id: 'sixes',         label: 'Seises',         type: 'number',      baseScore: 0,   servedBonus: 0, winOnServed: false, maxInput: 30  },
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
  return players.every(player =>
    CATEGORIES.every(cat => {
      if (player.scores[cat.id] !== undefined) return true;
      // Permanently blocked cells count as complete
      return isCategoryPermanentlyBlocked(cat.id, player);
    })
  );
}

export function getWinner(players: Player[]): Player {
  return players.reduce((best, p) => (getTotal(p) > getTotal(best) ? p : best), players[0]);
}
