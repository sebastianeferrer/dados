import { useState } from 'react';
import type { GameRecord } from '../types/history';

const HISTORY_KEY = 'dados-history';

export function useHistory() {
  const [records, setRecords] = useState<GameRecord[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? (JSON.parse(saved) as GameRecord[]) : [];
    } catch {
      return [];
    }
  });

  const addRecord = (record: GameRecord) => {
    setRecords(prev => {
      if (prev.some(r => r.id === record.id)) return prev; // ya guardado
      const next = [record, ...prev];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setRecords([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return { records, addRecord, clearHistory };
}
