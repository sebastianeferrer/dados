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
  virtualDiceEnabled: boolean;
  gameId: string;
  startedAt: string;
}

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;

export interface SavedRoll {
  values: DieFace[];
  rollNumber: 1 | 2 | 3;
}
