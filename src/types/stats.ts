import type { DieFace, GameVariant, CategoryId } from './game';

export type CombinationType =
  | 'nada'
  | 'par'
  | 'doblePar'
  | 'trio'
  | 'full'
  | 'poker'
  | 'generala'
  | 'escaleraCorta'
  | 'escaleraLarga';

export interface RollRecord {
  id: string;
  gameId: string;
  values: [DieFace, DieFace, DieFace, DieFace, DieFace];
  combination: CombinationType;
  appliedCategory?: CategoryId;
  served: boolean;
  rollNumber: 1 | 2 | 3;
  playerName: string;
  variant: GameVariant;
  timestamp: string;
}

export interface RollStatsStore {
  rolls: RollRecord[];
  sessionId: string;
  sessionStartedAt: string;
}

export type StatsVariantFilter = 'all' | GameVariant;
