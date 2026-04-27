import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label="Cambiar tema">
      {theme === 'light' ? 'Oscuro' : 'Claro'}
    </button>
  );
}
