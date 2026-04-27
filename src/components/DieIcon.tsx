const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[72, 28], [28, 72]],
  3: [[72, 28], [50, 50], [28, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

interface Props {
  face: 1 | 2 | 3 | 4 | 5 | 6;
  size?: number;
}

export function DieIcon({ face, size = 22 }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="die-icon"
      aria-label={`${face}`}
    >
      <rect x="5" y="5" width="90" height="90" rx="18" className="die-face" />
      {DOTS[face].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7.5" className="die-dot" />
      ))}
    </svg>
  );
}
