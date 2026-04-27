import type { CategoryId, ScoreEntry } from './game';

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
  players: PlayerRecord[];
}
