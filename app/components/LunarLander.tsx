'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Lunar Lander (kid edition) — land a spaceship on a flat pad using
// thrust to counter gravity. Tap/hold the up arrow to thrust, release to
// coast. Land softly to score; crash too hard and the ship is destroyed.
//   🌱 Easy   · big pad, low gravity, lots of fuel
//   🌿 Medium · narrow pad, standard gravity
//   🌳 Hard   · tiny pad, high gravity, tight fuel

type Difficulty = 0 | 1 | 2;
type Phase = 'flying' | 'landed' | 'crashed' | 'out_of_fuel';

const DIFFICULTY_CONFIG: Record<Difficulty, { gravity: number; thrust: number; startFuel: number; startVy: number; padWidth: number; padX: number }> = {
  0: { gravity: 0.025, thrust: -0.06,  startFuel: 200, startVy: 0,    padWidth: 120, padX: 0.4 },
  1: { gravity: 0.04,  thrust: -0.08,  startFuel: 160, startVy: 0,    padWidth: 80,  padX: 0.45 },
  2: { gravity: 0.06,  thrust: -0.11,  startFuel: 120, startVy: 0.02, padWidth: 50,  padX: 0.475 },
};

const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 500;
const SHIP_SIZE = 22;
const TOTAL_ROUNDS = 3;

interface Ship {
  x: number; // 0..1
  y: number; // 0..1 (0 = top, 1 = bottom)
  vy: number; // velocity (positive = down)
  angle: number; // for visual tilt
}

const SAFE_LANDING_VY = 0.15; // below this velocity = safe landing

function emptyShip(startX: number): Ship {
  return { x: startX, y: 0.1, vy: 0, angle: 0 };
}

function newGame(difficulty: Difficulty): Ship {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return emptyShip(0.5);
}

export default function LunarLander({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [ship, setShip] = useState<Ship>(newGame(0));
  const [fuel, setFuel] = useState(DIFFICULTY_CONFIG[0].startFuel);
  const [thrusting, setThrusting] = useState(false);
  const [phase, setPhase] = useState<Phase>('flying');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [landed, setLanded] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [stars, setStars] = useState<{ x: number; y: number; r: number }[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  const animRef = useRef<number | null>(null);
  const shipRef = useRef<Ship>(ship);
  const fuelRef = useRef<number>(fuel);
  const thrustingRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>('flying');
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem(`lunar_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  // Generate starfield
  useEffect(() => {
    if (screen !== 'play') return;
    const newStars = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.9,
      r: Math.random() * 1.5 + 0.5,
    }));
    setStars(newStars);
  }, [screen]);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  // Sync refs
  useEffect(() => { shipRef.current = ship; }, [ship]);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  useEffect(() => { thrustingRef.current = thrusting; }, [thrusting]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Game loop
  useEffect(() => {
    if (screen !== 'play' || phase === 'landed' || phase === 'crashed') return;

    const tick = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = (timestamp - lastFrameRef.current) / 16; // normalize to ~60fps
      lastFrameRef.current = timestamp;

      const s = shipRef.current;
      const isThrusting = thrustingRef.current && fuelRef.current > 0;
      let newVy = s.vy + cfg.gravity * delta;
      if (isThrusting) {
        newVy += cfg.thrust * delta;
        const newFuel = Math.max(0, fuelRef.current - 1 * delta);
        setFuel(newFuel);
      }
      const newY = s.y + newVy * delta;
      const newAngle = Math.max(-30, Math.min(30, newVy * 600));

      // Check if crashed or landed
      if (newY >= 1) {
        const cfg2 = DIFFICULTY_CONFIG[difficulty];
        if (Math.abs(newVy) < SAFE_LANDING_VY) {
          // Successful landing
          const padStart = cfg2.padX * STAGE_WIDTH - cfg2.padWidth / 2;
          const padEnd = padStart + cfg2.padWidth;
          if (s.x * STAGE_WIDTH >= padStart && s.x * STAGE_WIDTH <= padEnd) {
            setPhase('landed');
            setScore(sc => sc + 50 + Math.floor(fuelRef.current * 0.5));
            setLanded(l => l + 1);
            setMsg('🚀 Touchdown!');
            setTimeout(() => finishRound(true), 1800);
            return;
          }
        }
        // Crashed
        setPhase('crashed');
        setMsg('💥 Crashed!');
        setTimeout(() => finishRound(false), 1800);
        return;
      }

      if (fuelRef.current <= 0 && phaseRef.current === 'flying') {
        setPhase('out_of_fuel');
        setMsg('Out of fuel!');
        setTimeout(() => finishRound(false), 1500);
        return;
      }

      setShip({ x: s.x, y: newY, vy: newVy, angle: newAngle });
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastFrameRef.current = 0;
    };
  }, [screen, phase, difficulty]);

  const finishRound = (success: boolean) => {
    setScore(sc => {
      const ns = sc + (success ? 25 : 0);
      if (ns > bestScore) {
        try { localStorage.setItem(`lunar_best_${difficulty}`, String(ns)); setBestScore(ns); } catch {}
      }
      return ns;
    });
    setRound(r => {
      const nr = r + 1;
      if (nr >= TOTAL_ROUNDS) {
        setTimeout(() => setScreen('results'), 500);
      } else {
        // Reset for next round
        setTimeout(() => {
          setShip(newGame(difficulty));
          setFuel(DIFFICULTY_CONFIG[difficulty].startFuel);
          setPhase('flying');
          setMsg(null);
          setStars(prev => prev); // keep stars
        }, 2000);
      }
      return nr;
    });
  };

  // Keyboard handler
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') {
        e.preventDefault();
        setThrusting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') {
        e.preventDefault();
        setThrusting(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen]);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setShip(newGame(d));
    setFuel(DIFFICULTY_CONFIG[d].startFuel);
    setPhase('flying');
    setThrusting(false);
    setScore(0);
    setRound(0);
    setLanded(0);
    setMsg(null);
    setScreen('play');
  };

  // Touch / mouse controls for the play area
  const handleDown = (e: React.PointerEvent) => {
    if (phase !== 'flying') return;
    e.preventDefault();
    setThrusting(true);
  };
  const handleUp = () => setThrusting(false);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🌙</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Lunar Lander</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Land a spaceship on the moon! <strong>Hold the up arrow</strong> to
          fire the thruster and slow your descent. Land <strong>softly</strong> on the
          flat pad — crash too fast and you lose.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a landing site:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · wide pad, low gravity</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · standard gravity</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · tiny pad, high gravity</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best score (this level): <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} landings per match. Hold the up arrow or tap the play area to thrust.
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
          Landings: <strong>{landed}</strong>/{TOTAL_ROUNDS} · Best: <strong>{bestScore}</strong>
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
  const padStart = cfg.padX * STAGE_WIDTH - cfg.padWidth / 2;
  const padEnd = padStart + cfg.padWidth;
  const shipX = ship.x * STAGE_WIDTH;
  const shipY = ship.y * STAGE_HEIGHT;

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, position: 'relative' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🌙 Lunar Lander</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-blue)' }}>{score}</strong></span>
        <span>·</span>
        <span>Fuel <strong style={{ color: fuel < 30 ? 'var(--accent-pink)' : 'var(--accent-orange)' }}>{Math.floor(fuel)}</strong></span>
        <span>·</span>
        <span>Speed <strong style={{ color: Math.abs(ship.vy) > SAFE_LANDING_VY * 2 ? 'var(--accent-pink)' : 'var(--accent-green)' }}>{Math.abs(ship.vy * 100).toFixed(0)}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Round <strong>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        onPointerCancel={handleUp}
        style={{
          background: '#0a0a1a',
          padding: 4,
          borderRadius: 6,
          border: '4px solid #1a1a1a',
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'none',
          maxWidth: STAGE_WIDTH,
          margin: '0 auto 12px',
          overflow: 'hidden',
          aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
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
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 50,
            background: 'linear-gradient(180deg, #4A4A4A, #2A2A2A)',
          }} />
          {/* Craters */}
          <div style={{ position: 'absolute', left: '5%',  bottom: 8,  width: 16, height: 8, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />
          <div style={{ position: 'absolute', left: '25%', bottom: 12, width: 22, height: 10, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />
          <div style={{ position: 'absolute', right: '15%', bottom: 6, width: 14, height: 7, borderRadius: '50%', background: '#1a1a1a', opacity: 0.5 }} />

          {/* Landing pad */}
          <div style={{
            position: 'absolute', left: padStart, bottom: 50,
            width: cfg.padWidth, height: 8,
            background: '#FFD93D', borderRadius: 2,
            boxShadow: '0 0 8px rgba(255, 217, 61, 0.6)',
          }} />
          {/* Pad legs */}
          <div style={{ position: 'absolute', left: padStart, bottom: 42, width: 4, height: 8, background: '#FFD93D' }} />
          <div style={{ position: 'absolute', left: padEnd - 4, bottom: 42, width: 4, height: 8, background: '#FFD93D' }} />

          {/* Ship */}
          {phase !== 'landed' && phase !== 'crashed' && (
            <div style={{
              position: 'absolute',
              left: shipX - SHIP_SIZE / 2,
              top: shipY - SHIP_SIZE / 2,
              width: SHIP_SIZE, height: SHIP_SIZE,
              transform: `rotate(${ship.angle}deg)`,
              transition: 'transform 0.05s linear',
            }}>
              <svg viewBox="0 0 22 22" width={SHIP_SIZE} height={SHIP_SIZE}>
                <polygon points="11,1 21,21 11,17 1,21" fill="#C0C0C0" stroke="#666" />
                <circle cx="11" cy="12" r="3" fill="#5B7FFF" />
                {thrusting && (
                  <polygon points="11,21 8,28 11,26 14,28" fill="#FF9F43">
                    <animate attributeName="opacity" values="1;0.3;1" dur="0.15s" repeatCount="indefinite" />
                  </polygon>
                )}
              </svg>
            </div>
          )}

          {/* Crash explosion */}
          {phase === 'crashed' && (
            <div style={{
              position: 'absolute', left: shipX - 30, top: shipY - 30,
              width: 60, height: 60, borderRadius: '50%',
              background: 'radial-gradient(circle, #FFD93D 0%, #FF6B3D 40%, transparent 70%)',
              animation: 'puff 0.6s ease-out',
            }} />
          )}

          {/* Speed indicator on the right */}
          <div style={{
            position: 'absolute', right: 10, top: 10,
            fontSize: 10, color: '#fff', opacity: 0.7,
            textAlign: 'right',
          }}>
            {thrusting && <div>🔥 THRUST</div>}
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: phase === 'landed' ? 'var(--accent-green)' : phase === 'crashed' ? 'var(--accent-pink)' : 'var(--accent-orange)', margin: '6px 0' }}>
          {msg}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: <strong>hold the up arrow</strong> (or tap the play area) to thrust. Land <strong>softly</strong> on the yellow pad.
      </p>

      <style>{`
        @keyframes puff {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

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