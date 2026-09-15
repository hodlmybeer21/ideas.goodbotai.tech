'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * TouchJoystick — virtual joystick for tablets/phones.
 * Bottom-left draggable knob. Outputs normalized -1..1 vector.
 * Desktop users don't see it (no pointer events on touch-only devices).
 */
export default function TouchJoystick({
  onMove,
}: {
  onMove: (v: { x: number; z: number }) => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive]   = useState(false);
  const [origin, setOrigin]   = useState<{ x: number; y: number } | null>(null);
  const [vec, setVec]         = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  const RADIUS = 50;

  useEffect(() => {
    if (!active) onMove({ x: 0, z: 0 });
    else onMove(vec);
  }, [vec, active, onMove]);

  const start = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setActive(true);
    update(clientX, clientY, rect);
  };

  const update = (clientX: number, clientY: number, rect?: DOMRect) => {
    if (!baseRef.current || !origin) return;
    const r = rect ?? baseRef.current.getBoundingClientRect();
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
    // Forward = -Y on screen → mapped to -Z in world (forward)
    // Right = +X on screen → mapped to +X in world (right)
    setVec({ x: dx / RADIUS, z: -(dy / RADIUS) });
  };

  const end = () => {
    setActive(false);
    setOrigin(null);
    if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)';
    setVec({ x: 0, z: 0 });
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={(e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; update(t.clientX, t.clientY); }}
      onTouchEnd={end}
      onTouchCancel={end}
      onMouseDown={(e) => { e.preventDefault(); start(e.clientX, e.clientY); }}
      onMouseMove={(e) => { if (active) update(e.clientX, e.clientY); }}
      onMouseUp={end}
      onMouseLeave={end}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        width: 110,
        height: 110,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.35)',
        border: '3px solid rgba(255,255,255,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        touchAction: 'none',
        cursor: active ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B9D, #FFD93D)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: active ? 'none' : 'transform 0.2s',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
