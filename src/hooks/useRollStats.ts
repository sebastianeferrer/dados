import { useState, useEffect, useRef } from 'react';
import type { RollRecord, RollStatsStore, StatsVariantFilter } from '../types/stats';

const STORAGE_KEY = 'dados-roll-stats';
const MAX_ROLLS = 1000;

function newSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadStore(): RollStatsStore {
  const sessionId = newSessionId();
  const sessionStartedAt = new Date().toISOString();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as RollStatsStore;
      return { ...parsed, sessionId, sessionStartedAt };
    }
  } catch { /* corrupted — start fresh */ }
  return { rolls: [], sessionId, sessionStartedAt };
}

export function useRollStats() {
  const [store, setStore] = useState<RollStatsStore>(loadStore);
  const sessionStartRef = useRef(store.sessionStartedAt);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* quota exceeded — silently ignore */ }
  }, [store]);

  const addRoll = (roll: Omit<RollRecord, 'id' | 'timestamp'>) => {
    setStore(prev => {
      const id = `${roll.gameId}-${Date.now()}`;
      const record: RollRecord = { ...roll, id, timestamp: new Date().toISOString() };
      const next = [record, ...prev.rolls].slice(0, MAX_ROLLS);
      return { ...prev, rolls: next };
    });
  };

  const clearStats = () => {
    setStore({
      rolls: [],
      sessionId: newSessionId(),
      sessionStartedAt: new Date().toISOString(),
    });
  };

  const getRolls = (filter: StatsVariantFilter = 'all'): RollRecord[] => {
    if (filter === 'all') return store.rolls;
    return store.rolls.filter(r => r.variant === filter);
  };

  const getSessionRolls = (filter: StatsVariantFilter = 'all'): RollRecord[] => {
    const start = sessionStartRef.current;
    const rolls = store.rolls.filter(r => r.timestamp >= start);
    if (filter === 'all') return rolls;
    return rolls.filter(r => r.variant === filter);
  };

  return { rolls: store.rolls, addRoll, clearStats, getRolls, getSessionRolls };
}
