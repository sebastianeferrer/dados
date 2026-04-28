import type { CategoryId, GameVariant, ScoreEntry } from './game';

export interface PlayerRecord {
  name: string;
  finalRank: number;
  total: number;
  scores: Partial<Record<CategoryId, ScoreEntry>>;
}

export interface GameRecord {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  winReason: 'generalaServida' | 'highScore';
  winnerName?: string;
  /** Old records may not have this; treat as 'classic' when missing. */
  variant?: GameVariant;
  players: PlayerRecord[];
}
