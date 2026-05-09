import { useRef, useEffect } from 'react';
import type { DieFace } from '../types/game';
import { DieIcon } from './DieIcon';

/**
 * Rotation applied to the CUBE so that face N is facing the viewer.
 * Standard die layout: 1↔6, 2↔5, 3↔4.
 * Front=1, Back=6, Top=2, Bottom=5, Right=3, Left=4
 */
const FACE_TRANSFORM: Record<DieFace, string> = {
  1: 'rotateX(0deg)   rotateY(0deg)',
  2: 'rotateX(90deg)  rotateY(0deg)',
  3: 'rotateX(0deg)   rotateY(-90deg)',
  4: 'rotateX(0deg)   rotateY(90deg)',
  5: 'rotateX(-90deg) rotateY(0deg)',
  6: 'rotateX(0deg)   rotateY(180deg)',
};

/**
 * Same visual orientation as FACE_TRANSFORM but with 2 extra full rotations
 * added so the cube looks like it's spinning before landing.
 * (720 = 2×360, so the visual end is identical to FACE_TRANSFORM.)
 */
const ROLL_END_TRANSFORM: Record<DieFace, string> = {
  1: 'rotateX(720deg) rotateY(720deg)',
  2: 'rotateX(810deg) rotateY(720deg)',   // 720+90
  3: 'rotateX(720deg) rotateY(630deg)',   // 720-90
  4: 'rotateX(720deg) rotateY(810deg)',   // 720+90
  5: 'rotateX(630deg) rotateY(720deg)',   // 720-90
  6: 'rotateX(720deg) rotateY(900deg)',   // 720+180
};

interface Props {
  face: DieFace | null;
  rolling: boolean;
  rollKey: number;
}

export function Die3D({ face, rolling, rollKey }: Props) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    animRef.current?.cancel();
    animRef.current = null;

    if (rolling && face) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        cube.style.transform = FACE_TRANSFORM[face];
        return;
      }

      // No limpiar cube.style.transform — la API de animación lo sobreescribe igual,
      // y borrarlo causa que el elemento quede sin transform por un frame,
      // lo que hace que el browser abandone la capa GPU y al recrearla produce el flash blanco.
      animRef.current = cube.animate(
        [
          { transform: 'rotateX(0deg)   rotateY(0deg)   rotateZ(0deg)' },
          { transform: 'rotateX(210deg) rotateY(150deg) rotateZ(-12deg)', offset: 0.3 },
          { transform: 'rotateX(410deg) rotateY(300deg) rotateZ(8deg)',   offset: 0.6 },
          { transform: 'rotateX(580deg) rotateY(440deg) rotateZ(-4deg)',  offset: 0.82 },
          { transform: ROLL_END_TRANSFORM[face] },
        ],
        {
          duration: 1600,
          easing: 'cubic-bezier(0.45, 0, 0.55, 1)', /* lento → rápido → lento */
          fill: 'forwards',
        }
      );
    } else {
      cube.style.transform = face ? FACE_TRANSFORM[face] : 'rotateX(0deg) rotateY(0deg)';
    }
  }, [rolling, rollKey, face]);

  // No face yet — placeholder
  if (!face) {
    return <span className="dice-placeholder">?</span>;
  }

  return (
    // Wrapper sin transform propio: aplica overflow/clip de forma estable.
    // Si el clip se aplicara directo en .dice-slot (con hover transform),
    // el contexto 3D del hover defeats el clipping en Chrome desktop.
    <div className="die-3d-clip">
      <div className="die-3d-scene">
        <div ref={cubeRef} className="die-3d-cube">
          <div className="die-cube-face die-cube-face--front">  <DieIcon face={1} size={32} /></div>
          <div className="die-cube-face die-cube-face--back">   <DieIcon face={6} size={32} /></div>
          <div className="die-cube-face die-cube-face--top">    <DieIcon face={2} size={32} /></div>
          <div className="die-cube-face die-cube-face--bottom"> <DieIcon face={5} size={32} /></div>
          <div className="die-cube-face die-cube-face--right">  <DieIcon face={3} size={32} /></div>
          <div className="die-cube-face die-cube-face--left">   <DieIcon face={4} size={32} /></div>
        </div>
      </div>
    </div>
  );
}
