import { useReducer, useEffect } from 'react';
import type { GameState, GameVariant, Player, CategoryId, ScoreEntry } from '../types/game';

const STORAGE_KEY = 'dados-game-state';

type Action =
  | { type: 'START_GAME'; players: Player[]; turnOrderEnabled: boolean; virtualDiceEnabled: boolean; variant: GameVariant }
  | { type: 'RECORD_SCORE'; playerId: string; categoryId: CategoryId; entry: ScoreEntry }
  | { type: 'DELETE_SCORE'; playerId: string; categoryId: CategoryId }
  | { type: 'SET_WINNER'; winnerId: string; winReason: GameState['winReason'] }
  | { type: 'REORDER_PLAYERS'; players: Player[] }
  | { type: 'DISABLE_TURN_ORDER' }
  | { type: 'REOPEN_GAME' }
  | { type: 'RESTART_SAME_PLAYERS' }
  | { type: 'RESET_GAME' };

const now = () => new Date().toISOString();
const newId = () => Date.now().toString();

const initialState: GameState = {
  phase: 'setup',
  players: [],
  turnOrderEnabled: true,
  virtualDiceEnabled: false,
  variant: 'classic',
  gameId: newId(),
  startedAt: now(),
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        phase: 'playing',
        players: action.players,
        turnOrderEnabled: action.turnOrderEnabled,
        virtualDiceEnabled: action.virtualDiceEnabled,
        variant: action.variant,
        gameId: newId(),
        startedAt: now(),
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

    case 'DELETE_SCORE':
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== action.playerId) return p;
          const scores = { ...p.scores };
          delete scores[action.categoryId];
          return { ...p, scores };
        }),
      };

    case 'SET_WINNER':
      return { ...state, phase: 'finished', winnerId: action.winnerId, winReason: action.winReason };

    case 'REORDER_PLAYERS':
      return { ...state, players: action.players };

    case 'DISABLE_TURN_ORDER':
      return { ...state, turnOrderEnabled: false };

    case 'REOPEN_GAME':
      return { ...state, phase: 'playing', winnerId: undefined, winReason: undefined };

    case 'RESTART_SAME_PLAYERS':
      return {
        ...state,
        phase: 'playing',
        players: state.players.map(p => ({ ...p, scores: {} })),
        turnOrderEnabled: true,
        winnerId: undefined,
        winReason: undefined,
        gameId: newId(),
        startedAt: now(),
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
      const p = JSON.parse(saved) as Partial<GameState>;
      return {
        ...initialState,
        ...p,
        turnOrderEnabled:    p.turnOrderEnabled    ?? true,
        virtualDiceEnabled:  p.virtualDiceEnabled  ?? false,
        variant:             p.variant             ?? 'classic',
        gameId:              p.gameId              ?? newId(),
        startedAt:           p.startedAt           ?? now(),
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
