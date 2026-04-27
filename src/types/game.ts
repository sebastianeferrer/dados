export type CategoryId =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'escalera' | 'full' | 'poker' | 'generala' | 'generalaDoble';

export interface ScoreEntry {
  value: number;
  served: boolean;
  scratched: boolean;
}

export interface Player {
  id: string;
  name: string;
  scores: Partial<Record<CategoryId, ScoreEntry>>;
}

export type GamePhase = 'setup' | 'playing' | 'finished';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  winnerId?: string;
  winReason?: 'generalaServida' | 'highScore';
  turnOrderEnabled: boolean;
  gameId: string;
  startedAt: string;
}
