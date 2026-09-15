'use client';

import { useRef, useState, useEffect, CSSProperties } from 'react';

type Mode = 'move' | 'camera';

type Props = {
  onMove: (v: { x: number; z: number }) => void;
  /** Position on screen — pass bottom+right for a right-side joystick. */
  position?: { bottom?: number; top?: number; left?: number; right?: number };
  /** 'move' emits normalized (strafe, forward) for player movement.
   *  'camera' emits normalized (yawDelta, pitchDelta) for camera rotation
   *  (we only read x = yawDelta on the parent side). */
  mode?: Mode;
  /** Custom knob gradient, defaults differ by mode. */
  knobGradient?: string;
};

const RADIUS = 50;

/**
 * TouchJoystick — virtual joystick for tablets/phones (and mouse on desktop).
 *
 * Two are rendered on screen now: one bottom-left for movement, one bottom-right
 * for camera rotation. They share this component and are distinguished by `mode`.
 */
export default function TouchJoystick({
  onMove,
  position = { bottom: 24, left: 24 },
  mode = 'move',
  knobGradient,
}: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [vec, setVec] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  useEffect(() => {
    if (!active) onMove({ x: 0, z: 0 });
    else onMove(vec);
  }, [vec, active, onMove]);

  const start = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    setActive(true);
    update(clientX, clientY);
  };

  const update = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const r = baseRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // Normalize [-1, 1] on each axis
    setVec({ x: dx / RADIUS, z: dy / RADIUS });
  };

  const end = () => {
    setActive(false);
    if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)';
    setVec({ x: 0, z: 0 });
  };

  const baseStyle: CSSProperties = {
    position: 'fixed',
    ...position,
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)',
    border: `3px solid ${mode === 'camera' ? 'rgba(108, 200, 255, 0.7)' : 'rgba(255,255,255,0.6)'}`,
    backdropFilter: 'blur(6px)',
    zIndex: 50,
    touchAction: 'none',
    cursor: active ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  };

  const knobStyle: CSSProperties = {
    width: 50,
    height: 50,
    borderRadius: '50%',
    background:
      knobGradient ??
      (mode === 'camera'
        ? 'linear-gradient(135deg, #6BCBFF, #C084FC)'
        : 'linear-gradient(135deg, #FF6B9D, #FFD93D)'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: active ? 'none' : 'transform 0.2s',
    pointerEvents: 'none',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    start(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    update(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    end();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Touch fallback for browsers without pointer events (older Safari)
      onTouchStart={(e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; update(t.clientX, t.clientY); }}
      onTouchEnd={end}
      onTouchCancel={end}
      style={baseStyle}
    >
      <div ref={knobRef} style={knobStyle} />
    </div>
  );
}
