'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Lunar Lander (kid edition) — land a spaceship on a flat pad using
// thrust to counter gravity. Hold the up arrow (or the THRUST button)
// to fire the thruster and slow your descent. Land softly on the pad
// to score; crash too hard or miss the pad and you're done.
//
//   🌱 Easy   · wide pad, low gravity, plenty of fuel
//   🌿 Medium · narrow pad, mid gravity
//   🌳 Hard   · tiny pad, high gravity, tight fuel

type Difficulty = 0 | 1 | 2;
type Phase = 'flying' | 'landed' | 'crashed';

interface Ship {
  x: number; // 0..1 (horizontal position)
  y: number; // 0..1 (vertical position, 0=top)
  vy: number; // velocity in screen heights per second
}

const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 500;
const SHIP_SIZE = 24;
const GROUND_HEIGHT = 50;
const TOTAL_ROUNDS = 3;

// Difficulty tuning — gravity & thrust in screen-heights per second²
// (1.0 = full stage per second²). Fuel in seconds of thrust.
const DIFFICULTY_CONFIG: Record<Difficulty, {
  gravity: number;
  thrust: number;
  fuel: number;
  padX: number;
  padWidth: number;
  safeLandingVy: number;
  name: string;
}> = {
  0: { gravity: 0.10, thrust: -0.22, fuel: 14, padX: 0.50, padWidth: 140, safeLandingVy: 0.55, name: 'Baby Steps' },
  1: { gravity: 0.15, thrust: -0.30, fuel: 10, padX: 0.50, padWidth: 90,  safeLandingVy: 0.42, name: 'Steady' },
  2: { gravity: 0.22, thrust: -0.40, fuel: 8,  padX: 0.50, padWidth: 55,  safeLandingVy: 0.32, name: 'Rough' },
};

function makeShip(): Ship {
  return { x: 0.5, y: 0.05, vy: 0 };
}

export default function LunarLander({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [ship, setShip] = useState<Ship>(makeShip());
  const [fuel, setFuel] = useState(DIFFICULTY_CONFIG[0].fuel);
  const [phase, setPhase] = useState<Phase>('flying');
  const [thrusting, setThrusting] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [landed, setLanded] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [stars, setStars] = useState<{ x: number; y: number; r: number }[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Refs for stale-closure-free game loop
  const shipRef = useRef(ship);
  const fuelRef = useRef(fuel);
  const phaseRef = useRef(phase);
  const difficultyRef = useRef(difficulty);
  const screenRef = useRef(screen);
  const thrustingRef = useRef(thrusting);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  const landedRef = useRef(landed);

  useEffect(() => { shipRef.current = ship; }, [ship]);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { thrustingRef.current = thrusting; }, [thrusting]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { landedRef.current = landed; }, [landed]);

  // Load best score
  useEffect(() => {
    try {
      const s = localStorage.getItem(`lunar_best_${difficulty}`);
      setBestScore(s ? parseInt(s, 10) || 0 : 0);
    } catch {}
  }, [difficulty]);

  // Generate starfield once per play session
  useEffect(() => {
    if (screen !== 'play') return;
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.85,
      r: Math.random() * 1.4 + 0.6,
    }));
    setStars(newStars);
  }, [screen]);

  // Keyboard handler (no deps — uses refs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (screenRef.current === 'play') setThrusting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setThrusting(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== 'play' || phase !== 'flying') return;

    let rafId = 0;
    let lastFrame = 0;

    const tick = (timestamp: number) => {
      if (!lastFrame) lastFrame = timestamp;
      // dt in seconds, capped to 100ms to handle tab-blur jumps
      const dt = Math.min(0.1, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;

      const s = shipRef.current;
      const cfg = DIFFICULTY_CONFIG[difficultyRef.current];
      const isThrusting = thrustingRef.current && fuelRef.current > 0;

      if (isThrusting) {
        setFuel(f => Math.max(0, f - dt));
      }

      let newVy = s.vy + cfg.gravity * dt;
      if (isThrusting) {
        newVy += cfg.thrust * dt;
      }

      const newY = s.y + newVy * dt;

      // Ground collision
      const groundY = 1 - GROUND_HEIGHT / STAGE_HEIGHT;
      const shipBottom = newY + (SHIP_SIZE / 2) / STAGE_HEIGHT;

      if (shipBottom >= groundY) {
        const padStart = (cfg.padX * STAGE_WIDTH - cfg.padWidth / 2) / STAGE_WIDTH;
        const padEnd = (cfg.padX * STAGE_WIDTH + cfg.padWidth / 2) / STAGE_WIDTH;
        const onPad = s.x >= padStart && s.x <= padEnd;
        const soft = Math.abs(newVy) <= cfg.safeLandingVy;

        if (onPad && soft) {
          setPhase('landed');
          setMsg('🚀 Touchdown!');
          setThrusting(false);
          setScore(sc => {
            const ns = sc + 50 + Math.floor(fuelRef.current * 5);
            const nb = Math.max(bestScore, ns);
            setBestScore(nb);
            try { localStorage.setItem(`lunar_best_${difficultyRef.current}`, String(nb)); } catch {}
            return ns;
          });
          setLanded(l => l + 1);
          setTimeout(() => advanceRound(true), 1800);
          return;
        } else {
          setPhase('crashed');
          setMsg(onPad ? '💥 Too fast!' : '💥 Missed the pad!');
          setThrusting(false);
          setTimeout(() => advanceRound(false), 1800);
          return;
        }
      }

      setShip({ x: s.x, y: newY, vy: newVy });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);

    function advanceRound(_success: boolean) {
      const cfg = DIFFICULTY_CONFIG[difficultyRef.current];
      if (roundRef.current + 1 >= TOTAL_ROUNDS) {
        setScreen('results');
      } else {
        setShip(makeShip());
        setFuel(cfg.fuel);
        setPhase('flying');
        setMsg(null);
        setRound(r => r + 1);
      }
    }
  }, [screen, phase, difficulty, bestScore]);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setShip(makeShip());
    setFuel(DIFFICULTY_CONFIG[d].fuel);
    setPhase('flying');
    setThrusting(false);
    setScore(0);
    setRound(0);
    setLanded(0);
    setMsg(null);
    setScreen('play');
  };

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🌙</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Lunar Lander</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 20px' }}>
          Hold <strong>↑</strong> or tap-and-hold <strong>THRUST</strong> to fire the thruster.
          Land <strong>softly</strong> on the yellow pad — crash too fast and you're done!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌱 Easy · wide pad, gentle gravity
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌿 Medium · tighter pad
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌳 Hard · tiny pad, less fuel
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best score: <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} landings per match.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🌙</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Mission complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Landings: <strong>{landed}</strong>/{TOTAL_ROUNDS} · Score: <strong>{score}</strong> · Best: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {landed === TOTAL_ROUNDS ? '⭐⭐⭐' : landed >= 2 ? '⭐⭐' : '⭐'}
        </div>

        {!rated && bestScore > 0 && (
          <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
            ⭐ Rate this game
          </button>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>
            🔄 Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
            📋 Pick Level
          </button>
          <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
            🏠 Home
          </button>
        </div>

        {showRating && !rated && (
          <RatingModal
            activity="lunar-lander"
            activityName="Lunar Lander"
            activityEmoji="🌙"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const padStart = cfg.padX * STAGE_WIDTH - cfg.padWidth / 2;
  const padEnd = padStart + cfg.padWidth;
  const shipX = ship.x * STAGE_WIDTH;
  const shipY = ship.y * STAGE_HEIGHT;
  const speedPct = Math.min(100, (Math.abs(ship.vy) / 1.0) * 100); // 1.0 = 1 stage/sec terminal-ish
  const speedLabel = Math.abs(ship.vy) <= cfg.safeLandingVy ? '✓ Safe' : Math.abs(ship.vy) <= cfg.safeLandingVy * 1.8 ? '⚠ Careful' : '✗ Too fast!';
  const speedColor = Math.abs(ship.vy) <= cfg.safeLandingVy ? 'var(--accent-green)' : Math.abs(ship.vy) <= cfg.safeLandingVy * 1.8 ? 'var(--accent-orange)' : 'var(--accent-pink)';
  const fuelPct = (fuel / cfg.fuel) * 100;
  const fuelColor = fuelPct < 25 ? 'var(--accent-pink)' : fuelPct < 50 ? 'var(--accent-orange)' : 'var(--accent-green)';

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🌙 Lunar Lander</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Score <strong style={{ color: 'var(--accent-blue)' }}>{score}</strong></span>
        <span>·</span>
        <span style={{ color: speedColor }}>Speed <strong>{speedLabel}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: phase === 'landed' ? 'var(--accent-green)' : 'var(--accent-pink)', margin: '6px 0' }}>
          {msg}
        </div>
      )}

      <div
        style={{
          background: 'linear-gradient(180deg, #0a0a1f 0%, #1a1a3a 70%, #2a1a3f 100%)',
          padding: 0,
          borderRadius: 8,
          border: '4px solid #2a2a4a',
          position: 'relative',
          margin: '0 auto 12px',
          maxWidth: STAGE_WIDTH,
          aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Stars */}
        {stars.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: s.r, height: s.r, borderRadius: '50%',
            background: '#fff', opacity: 0.7,
          }} />
        ))}

        {/* Moon surface */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_HEIGHT,
          background: 'linear-gradient(180deg, #6B6B6B 0%, #4A4A4A 50%, #2A2A2A 100%)',
        }} />
        {/* Craters */}
        <div style={{ position: 'absolute', left: '8%',  bottom: 12, width: 18, height: 9, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />
        <div style={{ position: 'absolute', left: '25%', bottom: 18, width: 24, height: 12, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />
        <div style={{ position: 'absolute', right: '15%', bottom: 8, width: 16, height: 8, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />

        {/* Landing pad */}
        <div style={{
          position: 'absolute', left: padStart, bottom: GROUND_HEIGHT,
          width: cfg.padWidth, height: 10,
          background: '#FFD93D', borderRadius: 2,
          boxShadow: '0 0 12px rgba(255, 217, 61, 0.7)',
        }} />
        <div style={{ position: 'absolute', left: padStart + 4, bottom: GROUND_HEIGHT + 10, width: 4, height: 12, background: '#FFD93D' }} />
        <div style={{ position: 'absolute', left: padEnd - 8, bottom: GROUND_HEIGHT + 10, width: 4, height: 12, background: '#FFD93D' }} />

        {/* Ship */}
        {phase === 'flying' && (
          <div style={{
            position: 'absolute',
            left: shipX - SHIP_SIZE / 2,
            top: shipY - SHIP_SIZE / 2,
            width: SHIP_SIZE, height: SHIP_SIZE,
            transition: 'none',
          }}>
            <svg viewBox="0 0 24 24" width={SHIP_SIZE} height={SHIP_SIZE}>
              <polygon points="12,1 22,21 12,17 2,21" fill="#E0E0E0" stroke="#888" strokeWidth="1" />
              <circle cx="12" cy="13" r="3" fill="#5B7FFF" />
              <rect x="9" y="20" width="6" height="2" fill="#888" />
              {thrusting && fuel > 0 && (
                <polygon points="12,22 8,32 12,28 16,32" fill="#FF9F43">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.12s" repeatCount="indefinite" />
                </polygon>
              )}
            </svg>
          </div>
        )}

        {/* Speed indicator on left */}
        <div style={{
          position: 'absolute', right: 10, top: 10,
          fontSize: 11, color: '#fff', opacity: 0.85,
          textAlign: 'right', lineHeight: 1.4,
        }}>
          {thrusting && fuel > 0 && <div style={{ color: '#FF9F43' }}>🔥 THRUST</div>}
          <div style={{ marginTop: 4 }}>vy: {Math.abs(ship.vy).toFixed(2)}</div>
        </div>
      </div>

      {/* Gauges */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', fontSize: 13, color: 'var(--text-medium)', flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⛽ Fuel</span>
          <div style={{ width: 120, height: 12, background: '#E5E0D8', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${fuelPct}%`, height: '100%', background: fuelColor, transition: 'width 0.1s linear' }} />
          </div>
          <strong style={{ color: fuelColor, minWidth: 30 }}>{fuel.toFixed(1)}s</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💨 Speed</span>
          <div style={{ width: 120, height: 12, background: '#E5E0D8', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${speedPct}%`, height: '100%', background: speedColor, transition: 'width 0.05s linear' }} />
          </div>
          <strong style={{ color: speedColor, minWidth: 60 }}>{speedLabel}</strong>
        </div>
      </div>

      {/* Big THRUST button (mobile + desktop) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          className="btn btn-primary"
          onPointerDown={() => setThrusting(true)}
          onPointerUp={() => setThrusting(false)}
          onPointerLeave={() => setThrusting(false)}
          onPointerCancel={() => setThrusting(false)}
          onContextMenu={(e) => e.preventDefault()}
          disabled={fuel <= 0}
          style={{
            fontSize: 22, padding: '18px 60px',
            background: fuel <= 0 ? '#999' : thrusting ? '#FF6B3D' : 'var(--accent-orange)',
            color: 'white',
            fontWeight: 700,
            touchAction: 'manipulation',
            userSelect: 'none',
            minWidth: 220,
          }}
        >
          {fuel <= 0 ? '⛽ Out of fuel' : thrusting ? '🔥 THRUSTING' : '🔥 HOLD TO THRUST'}
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: hold <strong>↑</strong> / <strong>Space</strong> or the THRUST button. Land below the safe-speed bar to score!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="lunar-lander"
          activityName="Lunar Lander"
          activityEmoji="🌙"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}