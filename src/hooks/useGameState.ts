import { useReducer, useEffect } from 'react';
import type { GameState, Player, CategoryId, ScoreEntry } from '../types/game';

const STORAGE_KEY = 'dados-game-state';

type Action =
  | { type: 'START_GAME'; players: Player[] }
  | { type: 'RECORD_SCORE'; playerId: string; categoryId: CategoryId; entry: ScoreEntry }
  | { type: 'SET_WINNER'; winnerId: string; winReason: GameState['winReason'] }
  | { type: 'ADVANCE_TURN' }
  | { type: 'REORDER_PLAYERS'; players: Player[] }
  | { type: 'DISABLE_TURN_ORDER' }
  | { type: 'REOPEN_GAME' }
  | { type: 'RESTART_SAME_PLAYERS' }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  phase: 'setup',
  players: [],
  currentPlayerIndex: 0,
  turnOrderEnabled: true,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        phase: 'playing',
        players: action.players,
        currentPlayerIndex: 0,
        turnOrderEnabled: true,
      };

    case 'RECORD_SCORE':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId
            ? { ...p, scores: { ...p.scores, [action.categoryId]: action.entry } }
            : p
        ),
      };

    case 'SET_WINNER':
      return { ...state, phase: 'finished', winnerId: action.winnerId, winReason: action.winReason };

    case 'ADVANCE_TURN':
      return {
        ...state,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      };

    case 'REORDER_PLAYERS':
      return { ...state, players: action.players, currentPlayerIndex: 0 };

    case 'DISABLE_TURN_ORDER':
      return { ...state, turnOrderEnabled: false };

    case 'REOPEN_GAME':
      return { ...state, phase: 'playing', winnerId: undefined, winReason: undefined };

    case 'RESTART_SAME_PLAYERS':
      return {
        ...state,
        phase: 'playing',
        players: state.players.map(p => ({ ...p, scores: {} })),
        currentPlayerIndex: 0,
        turnOrderEnabled: true,
        winnerId: undefined,
        winReason: undefined,
      };

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;
      const parsed = JSON.parse(saved) as Partial<GameState>;
      return {
        ...initialState,
        ...parsed,
        currentPlayerIndex: parsed.currentPlayerIndex ?? 0,
        turnOrderEnabled: parsed.turnOrderEnabled ?? true,
      };
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return { state, dispatch };
}
