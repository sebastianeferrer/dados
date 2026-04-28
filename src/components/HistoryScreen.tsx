import { useState } from 'react';
import type { GameRecord, PlayerRecord } from '../types/history';
import { CATEGORIES } from '../games/generala';
import { DieIcon } from './DieIcon';

interface Props {
  records: GameRecord[];
  onBack: () => void;
  onClearHistory: () => void;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function computeStats(players: PlayerRecord[]) {
  let servedCount = 0;
  let bestPlay: { player: string; label: string; value: number } | null = null;

  for (const p of players) {
    for (const [catId, entry] of Object.entries(p.scores)) {
      if (!entry || entry.scratched) continue;
      const cat = CATEGORIES.find(c => c.id === catId);
      if (entry.served && !cat?.winOnServed) servedCount++;
      if (!bestPlay || entry.value > bestPlay.value) {
        bestPlay = { player: p.name, label: cat?.label ?? catId, value: entry.value };
      }
    }
  }
  return { servedCount, bestPlay };
}

function recordHasServida(p: PlayerRecord): boolean {
  return CATEGORIES.some(cat => {
    if (!cat.winOnServed) return false;
    const entry = p.scores[cat.id];
    return !!entry && !entry.scratched && entry.served === true;
  });
}

function totalDisplay(p: PlayerRecord): string {
  return recordHasServida(p) ? '∞' : String(p.total);
}

function isTieRecord(record: GameRecord): boolean {
  return record.players.filter(p => p.finalRank === 1).length > 1;
}

interface PlayerStats {
  name: string;
  first: number;
  second: number;
  third: number;
  games: number;
}

function computePlayerRanking(records: GameRecord[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>();
  for (const r of records) {
    for (const p of r.players) {
      const key = p.name.trim().toLowerCase();
      const existing = map.get(key) ?? {
        name: p.name, first: 0, second: 0, third: 0, games: 0,
      };
      existing.games += 1;
      if (p.finalRank === 1) existing.first += 1;
      else if (p.finalRank === 2) existing.second += 1;
      else if (p.finalRank === 3) existing.third += 1;
      map.set(key, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    b.first - a.first ||
    b.second - a.second ||
    b.third - a.third ||
    b.games - a.games ||
    a.name.localeCompare(b.name)
  );
}

function GameDetail({ record, onBack }: { record: GameRecord; onBack: () => void }) {
  const { servedCount, bestPlay } = computeStats(record.players);
  const tie = isTieRecord(record);

  return (
    <div className="history-screen">
      <div className="history-header">
        <button className="back-btn" onClick={onBack}>← Historial</button>
        <div className="history-title-block">
          <span className="history-title">{fmt(record.startedAt)} · {fmtTime(record.startedAt)}</span>
          <span className="history-sub">
            {record.players.length} jugadores · {fmtDuration(record.durationMs)}
            {tie && ' · Empate en 1°'}
          </span>
        </div>
      </div>

      <div className="history-detail-body">
        {/* Podium */}
        <div className="podium">
          {record.players.slice(0, 3).map((p, i) => (
            <div key={i} className={`podium-item podium-pos-${p.finalRank}`}>
              <span className="podium-rank">{p.finalRank}°</span>
              <span className="podium-name">{p.name}</span>
              <span className="podium-total">{totalDisplay(p)} pts</span>
              {p.finalRank === 1 && record.winReason === 'generalaServida' && recordHasServida(p) && (
                <span className="podium-badge">Generala Servida</span>
              )}
              {p.finalRank === 1 && tie && (
                <span className="podium-badge tie-badge">Empate</span>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="detail-stats">
          {servedCount > 0 && (
            <span className="detail-stat">⚡ {servedCount} jugada{servedCount !== 1 ? 's' : ''} servida{servedCount !== 1 ? 's' : ''}</span>
          )}
          {bestPlay && (
            <span className="detail-stat">
              Mejor: {bestPlay.player} — {bestPlay.label} ({bestPlay.value} pts)
            </span>
          )}
        </div>

        {/* Read-only scoreboard */}
        <div className="table-container detail-table">
          <table className="scoreboard">
            <thead>
              <tr>
                <th className="col-category col-header">Categoría</th>
                {record.players.map((p, i) => (
                  <th
                    key={i}
                    className={`col-player col-header${p.finalRank === 1 ? ' leading-player' : ''}`}
                  >
                    <div className="player-header-content">
                      <span className="player-header-name">
                        {p.finalRank === 1 && '🏆 '}{p.name}
                      </span>
                      <span className="player-header-meta">{p.finalRank}° · {totalDisplay(p)} pts</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => (
                <tr key={cat.id}>
                  <td className="col-category col-label">
                    {cat.dieFace
                      ? <DieIcon face={cat.dieFace} size={20} />
                      : cat.label}
                  </td>
                  {record.players.map((p, i) => {
                    const entry = p.scores[cat.id];
                    const cls = [
                      'score-cell',
                      entry?.scratched ? 'scratched'
                      : entry?.served   ? 'served'
                      : entry           ? 'filled'
                      :                   '',
                    ].filter(Boolean).join(' ');
                    return (
                      <td key={i} className={cls}>
                        {entry && (
                          <span>
                            {entry.scratched ? '✕' : entry.value}
                            {!entry.scratched && entry.served && !cat.winOnServed && (
                              <sup className="served-mark">S</sup>
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="col-category col-label total-label">Total</td>
                {record.players.map((p, i) => {
                  const served = recordHasServida(p);
                  return (
                    <td
                      key={i}
                      className={`score-cell total-value${served ? ' served-winner' : ''}`}
                      title={served ? `Generala servida — ${p.total} pts` : undefined}
                    >
                      {served ? '∞' : p.total}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export function HistoryScreen({ records, onBack, onClearHistory }: Props) {
  const [selected, setSelected] = useState<GameRecord | null>(null);

  if (selected) return <GameDetail record={selected} onBack={() => setSelected(null)} />;

  const handleClear = () => {
    if (window.confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) {
      onClearHistory();
    }
  };

  return (
    <div className="history-screen">
      <div className="history-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <span className="history-title">Historial</span>
        <span className="history-sub">{records.length} partida{records.length !== 1 ? 's' : ''}</span>
        {records.length > 0 && (
          <button className="btn-toolbar danger-text" onClick={handleClear}>
            Borrar todo
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="history-empty">
          <p>No hay partidas registradas todavía.</p>
          <p>Terminá una partida para verla acá.</p>
        </div>
      ) : (
        <>
          {/* Ranking global */}
          {(() => {
            const ranking = computePlayerRanking(records);
            if (ranking.length === 0) return null;
            return (
              <div className="player-ranking">
                <div className="player-ranking-title">Ranking de jugadores</div>
                <div className="player-ranking-table">
                  <div className="player-ranking-row player-ranking-head">
                    <span className="pr-name">Jugador</span>
                    <span className="pr-cell" title="Veces 1°">🥇</span>
                    <span className="pr-cell" title="Veces 2°">🥈</span>
                    <span className="pr-cell" title="Veces 3°">🥉</span>
                    <span className="pr-cell pr-games" title="Partidas jugadas">PJ</span>
                  </div>
                  {ranking.map(p => (
                    <div key={p.name} className="player-ranking-row">
                      <span className="pr-name">{p.name}</span>
                      <span className="pr-cell">{p.first}</span>
                      <span className="pr-cell">{p.second}</span>
                      <span className="pr-cell">{p.third}</span>
                      <span className="pr-cell pr-games">{p.games}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="history-list">
            {records.map((r, idx) => {
              const tie = isTieRecord(r);
              const winners = r.players.filter(p => p.finalRank === 1);
              const others = r.players.filter(p => p.finalRank !== 1).slice(0, 3 - winners.length);
              const podiumCards = [...winners, ...others].slice(0, 3);
              return (
                <button key={r.id} className="game-card" onClick={() => setSelected(r)}>
                  <div className="game-card-header">
                    <span className="game-card-num">#{records.length - idx}</span>
                    <span className="game-card-date">{fmt(r.startedAt)} · {fmtTime(r.startedAt)}</span>
                    <span className="game-card-dur">{fmtDuration(r.durationMs)}</span>
                  </div>
                  <div className="game-card-podium">
                    {podiumCards.map((p, i) => (
                      <span
                        key={i}
                        className={`game-card-player ${p.finalRank === 1 ? 'card-winner' : ''}`}
                      >
                        {p.finalRank}° {p.name} · {totalDisplay(p)}
                      </span>
                    ))}
                    {r.players.length > podiumCards.length && (
                      <span className="game-card-more">+{r.players.length - podiumCards.length}</span>
                    )}
                  </div>
                  <div className="game-card-badges">
                    {tie && <span className="game-card-badge tie-badge">Empate</span>}
                    {r.winReason === 'generalaServida' && (
                      <span className="game-card-badge">Generala Servida</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
