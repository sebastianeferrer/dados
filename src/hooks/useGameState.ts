import { useReducer, useEffect } from 'react';
import { GameState, Player, CategoryId, ScoreEntry } from '../types/game';

const STORAGE_KEY = 'dados-game-state';

type Action =
  | { type: 'START_GAME'; players: Player[] }
  | { type: 'RECORD_SCORE'; playerId: string; categoryId: CategoryId; entry: ScoreEntry }
  | { type: 'SET_WINNER'; winnerId: string; winReason: GameState['winReason'] }
  | { type: 'RESET_GAME' };

const initialState: GameState = { phase: 'setup', players: [] };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { phase: 'playing', players: action.players };

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
      return saved ? (JSON.parse(saved) as GameState) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return { state, dispatch };
}
