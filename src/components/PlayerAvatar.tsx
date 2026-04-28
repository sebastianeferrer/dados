interface Props {
  name: string;
  id: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#d946ef', '#ec4899',
];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function PlayerAvatar({ name, id, size = 28, className = '' }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const bg = colorFor(id);
  return (
    <span
      className={`player-avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.round(size * 0.45),
      }}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
