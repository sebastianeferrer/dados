import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { RollRecord } from '../types/stats';
import type { CombinationType, StatsVariantFilter } from '../types/stats';
import type { GameVariant } from '../types/game';
import { DieIcon } from './DieIcon';

interface Props {
  rolls: RollRecord[];
  sessionRolls: RollRecord[];
  onBack: () => void;
  onClearStats: () => void;
}

const MIN_SAMPLE = 30;

const COMBO_LABELS: Record<CombinationType, string> = {
  generala: 'Generala',
  poker: 'Poker',
  full: 'Full',
  trio: 'Trío',
  escaleraLarga: 'Escalera larga',
  escaleraCorta: 'Escalera corta',
  doblePar: 'Doble par',
  par: 'Par',
  nada: 'Nada',
};

const COMBO_ORDER: CombinationType[] = [
  'generala', 'poker', 'full', 'trio',
  'escaleraLarga', 'escaleraCorta', 'doblePar', 'par', 'nada',
];

/** Theoretical first-roll probabilities (%) for 5 dice. */
const THEORETICAL: Partial<Record<CombinationType, number>> = {
  generala: 0.077,
  poker: 2.0,
  full: 3.86,
  escaleraLarga: 3.09,
  escaleraCorta: 12.35,
  trio: 15.43,
  doblePar: 23.15,
  par: 46.09,
};

function variantLabel(v: GameVariant): string {
  if (v === 'yahtzee') return 'Generahtzee';
  if (v === 'yahtzeeOriginal') return 'Yahtzee Original';
  return 'Clásica';
}

function useChartColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    text: s.getPropertyValue('--text-secondary').trim() || '#666',
    accent: s.getPropertyValue('--accent').trim() || '#3b82f6',
    border: s.getPropertyValue('--border').trim() || '#e5e7eb',
    gold: s.getPropertyValue('--gold').trim() || '#f59e0b',
    surface: s.getPropertyValue('--surface').trim() || '#fff',
  };
}

function computeFaceData(rolls: RollRecord[]) {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let total = 0;
  for (const r of rolls) {
    for (const v of r.values) {
      counts[v]++;
      total++;
    }
  }
  return [1, 2, 3, 4, 5, 6].map(face => ({
    face: String(face),
    count: counts[face],
    percentage: total > 0 ? +((counts[face] / total) * 100).toFixed(1) : 0,
  }));
}

function computeComboData(rolls: RollRecord[]) {
  const counts: Record<string, number> = {};
  for (const c of COMBO_ORDER) counts[c] = 0;
  for (const r of rolls) counts[r.combination]++;
  return COMBO_ORDER.map(c => ({
    id: c,
    name: COMBO_LABELS[c],
    count: counts[c],
    percentage: rolls.length > 0 ? +((counts[c] / rolls.length) * 100).toFixed(1) : 0,
  }));
}

function computeProbabilityData(rolls: RollRecord[]) {
  const counts: Record<string, number> = {};
  for (const c of COMBO_ORDER) counts[c] = 0;
  for (const r of rolls) counts[r.combination]++;

  return COMBO_ORDER
    .filter(c => THEORETICAL[c] !== undefined && c !== 'nada')
    .map(c => ({
      name: COMBO_LABELS[c],
      observed: rolls.length > 0 ? +((counts[c] / rolls.length) * 100).toFixed(2) : 0,
      theoretical: THEORETICAL[c]!,
    }));
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
}

export function StatsScreen({ rolls, sessionRolls, onBack, onClearStats }: Props) {
  const [variantFilter, setVariantFilter] = useState<StatsVariantFilter>('all');
  const colors = useChartColors();

  const filtered = variantFilter === 'all'
    ? rolls
    : rolls.filter(r => r.variant === variantFilter);
  const filteredSession = variantFilter === 'all'
    ? sessionRolls
    : sessionRolls.filter(r => r.variant === variantFilter);

  const faceData = computeFaceData(filtered);
  const comboData = computeComboData(filtered);
  const probabilityData = computeProbabilityData(filtered);
  const presentVariants = new Set(rolls.map(r => r.variant));
  const hasMultipleVariants = presentVariants.size > 1;
  const uniqueGames = new Set(filtered.map(r => r.gameId)).size;

  const handleClear = () => {
    if (window.confirm('¿Borrar todas las estadísticas? Esta acción no se puede deshacer.')) {
      onClearStats();
    }
  };

  return (
    <div className="history-screen stats-screen">
      <div className="history-header">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <span className="history-title">Estadísticas</span>
        <span className="history-sub">
          {filtered.length} tirada{filtered.length !== 1 ? 's' : ''} registrada{filtered.length !== 1 ? 's' : ''}
        </span>
        {rolls.length > 0 && (
          <button className="btn-toolbar danger-text" onClick={handleClear}>
            Borrar todo
          </button>
        )}
      </div>

      {/* Variant filter */}
      {hasMultipleVariants && (
        <div className="stats-filter-bar">
          <div className="ranking-filter">
            <button
              className={`ranking-filter-btn${variantFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setVariantFilter('all')}
            >Todas</button>
            {presentVariants.has('classic') && (
              <button
                className={`ranking-filter-btn${variantFilter === 'classic' ? ' is-active' : ''}`}
                onClick={() => setVariantFilter('classic')}
              >Clásica</button>
            )}
            {presentVariants.has('yahtzee') && (
              <button
                className={`ranking-filter-btn${variantFilter === 'yahtzee' ? ' is-active' : ''}`}
                onClick={() => setVariantFilter('yahtzee')}
              >Generahtzee</button>
            )}
            {presentVariants.has('yahtzeeOriginal') && (
              <button
                className={`ranking-filter-btn${variantFilter === 'yahtzeeOriginal' ? ' is-active' : ''}`}
                onClick={() => setVariantFilter('yahtzeeOriginal')}
              >Yahtzee</button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="history-empty">
          <p>No hay tiradas registradas todavía.</p>
          <p>Jugá una partida con dados virtuales para ver estadísticas acá.</p>
        </div>
      ) : (
        <div className="stats-body">
          {/* Summary cards */}
          <div className="stats-cards">
            <div className="stats-card">
              <span className="stats-card-value">{filtered.length}</span>
              <span className="stats-card-label">Total tiradas</span>
            </div>
            <div className="stats-card">
              <span className="stats-card-value">{filteredSession.length}</span>
              <span className="stats-card-label">Esta sesión</span>
            </div>
            <div className="stats-card">
              <span className="stats-card-value">{uniqueGames}</span>
              <span className="stats-card-label">Partidas</span>
            </div>
          </div>

          {/* Die value distribution 1-6 */}
          <div className="stats-section">
            <h3 className="stats-section-title">Distribución de valores</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={faceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="face" stroke={colors.text} tick={(props: { x: string | number; y: string | number; payload: { value: string } }) => (
                  <g transform={`translate(${props.x},${Number(props.y) + 4})`}>
                    <foreignObject x={-12} y={0} width={24} height={24}>
                      <DieIcon face={Number(props.payload.value) as 1|2|3|4|5|6} size={20} />
                    </foreignObject>
                  </g>
                )} />
                <YAxis tickFormatter={v => `${v}%`} stroke={colors.text} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={16.67} stroke={colors.gold} strokeDasharray="5 5" label={{ value: '16.7%', position: 'right', fill: colors.gold, fontSize: 11 }} />
                <Bar dataKey="percentage" name="Frecuencia" fill={colors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="stats-note">Línea punteada = distribución uniforme teórica (16.7%)</p>
          </div>

          {/* Combination frequency */}
          <div className="stats-section">
            <h3 className="stats-section-title">Frecuencia de combinaciones</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comboData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis type="number" stroke={colors.text} fontSize={12} />
                <YAxis type="category" dataKey="name" stroke={colors.text} width={105} fontSize={12} />
                <Tooltip formatter={(value, _name, item) => [
                  `${value} (${(item.payload as { percentage: number }).percentage}%)`, 'Cantidad'
                ]} />
                <Bar dataKey="count" name="Cantidad" fill={colors.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Observed vs theoretical probabilities */}
          <div className="stats-section">
            <h3 className="stats-section-title">Probabilidad observada vs teórica</h3>
            {filtered.length < MIN_SAMPLE ? (
              <p className="stats-note stats-note-center">
                Se necesitan al menos {MIN_SAMPLE} tiradas para comparar probabilidades.
                Faltan {MIN_SAMPLE - filtered.length}.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={probabilityData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="name" stroke={colors.text} fontSize={11} angle={-20} textAnchor="end" height={50} />
                    <YAxis tickFormatter={v => `${v}%`} stroke={colors.text} fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="observed" name="Observada" fill={colors.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="theoretical" name="Teórica" fill={colors.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="stats-note">
                  Las probabilidades teóricas son para una tirada de 5 dados sin repetir.
                  Tus resultados incluyen re-tiros con dados fijados.
                </p>
              </>
            )}
          </div>

          {/* Recent trends */}
          <div className="stats-section">
            <h3 className="stats-section-title">Últimas tiradas</h3>
            <div className="stats-recent">
              {filtered.slice(0, 20).map(r => (
                <div key={r.id} className="stats-recent-row">
                  <span className="stats-recent-dice">
                    {r.values.map((v, i) => <DieIcon key={i} face={v} size={18} />)}
                  </span>
                  <span className={`stats-recent-combo combo-${r.combination}`}>
                    {COMBO_LABELS[r.combination]}
                  </span>
                  {r.served && <span className="stats-recent-served">S</span>}
                  <span className="stats-recent-player">{r.playerName}</span>
                  {hasMultipleVariants && (
                    <span className={`game-card-badge variant-badge variant-${r.variant}`}>
                      {variantLabel(r.variant)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="stats-note stats-note-center stats-footer-note">
            Solo se registran tiradas con dados virtuales.
          </p>
        </div>
      )}
    </div>
  );
}
