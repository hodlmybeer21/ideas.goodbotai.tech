'use client';

/**
 * Day/night cycle helpers.
 *
 * The campus runs a 4-phase cycle:
 *   dawn  (0.00–0.20) — sun rising, warm pink sky
 *   day   (0.20–0.50) — golden hour (the original Ghibli-pastoral look)
 *   dusk  (0.50–0.70) — sun setting, dusty rose
 *   night (0.70–1.00) — moon + stars, deep navy
 *
 * Cycle duration is 4 minutes (240s) — short enough that a kid playing
 * for ~5 min sees the full arc, long enough that individual moments
 * (sunset, dusk → night transition) feel unhurried.
 */

export const CYCLE_DURATION = 240;

export type PhaseColors = {
  sun: { color: string; position: [number, number, number] };
  ambient: { color: string; intensity: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  fog: { color: string; near: number; far: number };
  bg: string;
};

export const PHASE_COLORS: Record<'dawn' | 'day' | 'dusk' | 'night', PhaseColors> = {
  dawn: {
    sun:        { color: '#FFD8A0', position: [15, 4, -30] },
    ambient:    { color: '#FFD8B0', intensity: 0.45 },
    hemisphere: { sky: '#FFD0A0', ground: '#5C7A52', intensity: 0.50 },
    fog:        { color: '#FFC9A8', near: 28, far: 72 },
    bg:         '#FFC9A8',
  },
  day: {
    sun:        { color: '#FFCB85', position: [60, 18, -25] },
    ambient:    { color: '#FFE8C9', intensity: 0.55 },
    hemisphere: { sky: '#FFD89B', ground: '#7A9B6E', intensity: 0.50 },
    fog:        { color: '#E8C9A8', near: 28, far: 78 },
    bg:         '#E8C9A8',
  },
  dusk: {
    sun:        { color: '#FF9966', position: [-30, 5, -50] },
    ambient:    { color: '#FFA088', intensity: 0.50 },
    hemisphere: { sky: '#FF8866', ground: '#4A4030', intensity: 0.45 },
    fog:        { color: '#B88577', near: 22, far: 65 },
    bg:         '#B88577',
  },
  night: {
    sun:        { color: '#8090B0', position: [20, 35, -50] },
    ambient:    { color: '#3A4570', intensity: 0.40 },
    hemisphere: { sky: '#3A4570', ground: '#1A2030', intensity: 0.35 },
    fog:        { color: '#1A2540', near: 18, far: 55 },
    bg:         '#1A2540',
  },
};

/**
 * Returns the two phases currently being interpolated, plus the local
 * interpolation parameter in [0, 1]. Cycles wrap from night → dawn.
 */
export function getCurrentPhase(t: number): { from: keyof typeof PHASE_COLORS; to: keyof typeof PHASE_COLORS; localT: number } {
  const tt = ((t % 1) + 1) % 1;
  if (tt < 0.20) return { from: 'dawn', to: 'day',  localT: tt / 0.20 };
  if (tt < 0.50) return { from: 'day',  to: 'dusk', localT: (tt - 0.20) / 0.30 };
  if (tt < 0.70) return { from: 'dusk', to: 'night', localT: (tt - 0.50) / 0.20 };
  return            { from: 'night', to: 'dawn', localT: (tt - 0.70) / 0.30 };
}

/**
 * Compute the [0, 1] "how dark is it" factor. Ramps up over 0.65→0.80,
 * holds at 1 until 0.95, then ramps back down to 0 by t=1.0 (dawn).
 */
export function getNightFactor(t: number): number {
  const tt = ((t % 1) + 1) % 1;
  if (tt < 0.65) return 0;
  if (tt < 0.80) return (tt - 0.65) / 0.15;
  if (tt < 0.95) return 1;
  return Math.max(0, 1 - (tt - 0.95) / 0.05);
}

/** Linear-interpolate between two #RRGGBB hex strings. */
export function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
