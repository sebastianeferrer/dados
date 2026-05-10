import type { CombinationType } from '../types/stats';

/**
 * Detect the best combination present in 5 dice.
 * Priority: generala > poker > full > trio > escaleraLarga > escaleraCorta > doblePar > par > nada
 */
export function detectCombination(dice: number[]): CombinationType {
  if (dice.length !== 5) return 'nada';

  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] ?? 0) + 1;
  const freq = Object.values(counts).sort((a, b) => b - a);

  if (freq[0] === 5) return 'generala';
  if (freq[0] === 4) return 'poker';
  if (freq[0] === 3 && freq[1] === 2) return 'full';
  if (freq[0] === 3) return 'trio';

  // Straights (check before pairs — straights rank higher)
  const sorted = [...dice].sort((a, b) => a - b).join('');
  if (['12345', '23456', '13456'].includes(sorted)) return 'escaleraLarga';

  const set = new Set(dice);
  const smallSeqs = [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]];
  if (smallSeqs.some(seq => seq.every(n => set.has(n)))) return 'escaleraCorta';

  if (freq[0] === 2 && freq[1] === 2) return 'doblePar';
  if (freq[0] === 2) return 'par';

  return 'nada';
}
