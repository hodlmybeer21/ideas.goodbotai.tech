'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import RatingModal from './RatingModal';

// Sight word lists — pulled from the Dolch + Fry K-grade 100 most-common lists.
// We group by length so beginners see short words first and progress.
const WORDS_BY_TIER: { name: string; words: string[] }[] = [
  { name: 'Easy (3 letters)', words: ['the', 'and', 'you', 'can', 'see', 'big', 'red', 'run', 'go', 'we', 'me', 'my', 'it', 'is', 'in', 'no', 'so', 'up'] },
  { name: 'Medium (4-5 letters)', words: ['look', 'come', 'here', 'jump', 'play', 'find', 'help', 'with', 'will', 'have', 'this', 'that', 'they', 'said', 'each', 'made', 'must', 'going'] },
  { name: 'Hard (6+ letters)', words: ['because', 'before', 'could', 'every', 'friend', 'happy', 'little', 'make', 'other', 'people', 'school', 'their', 'under', 'water', 'yellow', 'about', 'again', 'know'] },
];

const ALL_WORDS: string[] = WORDS_BY_TIER.flatMap(t => t.words);

interface Firefly {
  id: number;
  word: string;
  x: number;       // 0..100 percent
  y: number;       // 0..100 percent
  vx: number;      // px/sec horizontal velocity
  vy: number;      // px/sec vertical velocity
  phase: number;   // for glow pulse
  glow: boolean;   // becomes true after catch
  escaping?: boolean; // flies away when wrong word is tapped
  escapeStart?: number;
  escapeFromX?: number;
  escapeFromY?: number;
}

const ARENA_W = 800;
const ARENA_H = 520;

const BING = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'triangle'; o.frequency.value = 880; g.gain.setValueAtTime(0.18, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35); o.start(); o.stop(c.currentTime + 0.35); } catch {} };
const ZAP = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(440, c.currentTime); o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.4); g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4); o.start(); o.stop(c.currentTime + 0.4); } catch {} };
const WIN_SND = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); [523, 659, 784, 1047].forEach((f, i) => { const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.15, c.currentTime + i * 0.12); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3); o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.3); }); } catch {} };

function pickTargetWord(tierIdx: number): string {
  const pool = WORDS_BY_TIER[tierIdx].words;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickDecoys(target: string, tierIdx: number, n: number): string[] {
  const samePool = WORDS_BY_TIER[tierIdx].words;
  const decoys: string[] = [];
  while (decoys.length < n && decoys.length < samePool.length - 1) {
    const cand = samePool[Math.floor(Math.random() * samePool.length)];
    if (cand !== target && !decoys.includes(cand)) decoys.push(cand);
  }
  return decoys;
}

export default function BugCatcher({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'win'>('menu');
  const [tierIdx, setTierIdx] = useState(0);
  const [target, setTarget] = useState<string>('');
  const [caught, setCaught] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<{ kind: 'good' | 'bad'; x: number; y: number; text: string } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Persist best score across sessions (parent dashboard can read this later)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bugcatcher_best_streak');
      if (saved) setBestStreak(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak);
      try { localStorage.setItem('bugcatcher_best_streak', String(streak)); } catch {}
    }
  }, [streak, bestStreak]);

  const startRound = useCallback((tier: number) => {
    setTierIdx(tier);
    setTarget(pickTargetWord(tier));
    setCaught([]);
    setScore(0);
    setStreak(0);
    setScreen('game');
  }, []);

  const handleWin = useCallback(() => {
    setScreen('win');
    try { window.setTimeout(() => WIN_SND(), 50); } catch {}
  }, []);

  // Back to menu
  if (screen === 'menu') {
    return (
      <>
        <div className="canvas-page slide-up">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1 className="page-title">🐛 Bug Catcher</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24 }}>
            Sight words in the night sky! Catch the firefly that shows the right word.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
            {WORDS_BY_TIER.map((t, i) => (
              <button
                key={t.name}
                className={`btn ${['btn-green', 'btn-blue', 'btn-purple'][i]}`}
                onClick={() => startRound(i)}
                style={{ fontSize: 18, padding: '16px 20px', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🌟 {t.name}</span>
                  <span style={{ fontSize: 14, opacity: 0.85 }}>{t.words.length} words</span>
                </div>
              </button>
            ))}
          </div>

          {bestStreak > 0 && (
            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
              🏆 Personal best streak: <strong>{bestStreak}</strong>
            </p>
          )}

          <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-medium)' }}>
            Tip: tap on a firefly to catch it. Read the word out loud first!
          </p>
        </div>

        {screen === 'menu' && showRating && (
          <RatingModal
            activity="bug-catcher"
            activityName="Bug Catcher"
            activityEmoji="🐛"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  if (screen === 'win') {
    return (
      <>
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 80, marginTop: 40 }}>🌟</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
            You caught every word!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
          </p>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 32, fontSize: 18, padding: '16px 32px' }}>
            ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
            <button className="btn btn-blue" onClick={() => startRound(tierIdx)} style={{ fontSize: 16, padding: '14px 24px' }}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>

        {showRating && !rated && (
          <RatingModal
            activity="bug-catcher"
            activityName="Bug Catcher"
            activityEmoji="🐛"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  return (
    <GameArena
      target={target}
      tierIdx={tierIdx}
      initialCaught={caught}
      initialScore={score}
      initialStreak={streak}
      onCatch={(word, isTarget) => {
        if (isTarget) {
          BING();
          setScore(s => s + 10);
          setStreak(s => s + 1);
          setFlash({ kind: 'good', x: 50, y: 50, text: `+10 · ${word} ✨` });
          // Mark caught, advance target.
          setCaught(prev => {
            const next = prev.includes(word) ? prev : [...prev, word];
            // If we've seen every word in the tier, win
            const tierSize = WORDS_BY_TIER[tierIdx].words.length;
            if (next.length >= tierSize) {
              setTimeout(() => handleWin(), 600);
              return next;
            }
            // Pick a fresh, uncatched target.
            const remaining = WORDS_BY_TIER[tierIdx].words.filter(w => !next.includes(w));
            setTarget(remaining[Math.floor(Math.random() * remaining.length)]);
            return next;
          });
        } else {
          ZAP();
          setStreak(0);
          setFlash({ kind: 'bad', x: 50, y: 50, text: `Not "${word}" — try again!` });
        }
        setTimeout(() => setFlash(null), 1200);
      }}
      flash={flash}
      score={score}
      streak={streak}
      bestStreak={bestStreak}
      onBack={onBack}
      onShowRating={() => setShowRating(true)}
      showRating={showRating}
      rated={rated}
      kidName={kidName}
    />
  );
}

interface ArenaProps {
  target: string;
  tierIdx: number;
  initialCaught: string[];
  initialScore: number;
  initialStreak: number;
  onCatch: (word: string, isTarget: boolean) => void;
  flash: { kind: 'good' | 'bad'; x: number; y: number; text: string } | null;
  score: number;
  streak: number;
  bestStreak: number;
  onBack: () => void;
  onShowRating: () => void;
  showRating: boolean;
  rated: boolean;
  kidName: string;
}

function GameArena({ target, tierIdx, onCatch, flash, score, streak, bestStreak, onBack, onShowRating, showRating, rated, kidName }: ArenaProps) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: ARENA_W, h: ARENA_H });
  const [bugs, setBugs] = useState<Firefly[]>([]);
  const tickRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  // Reset bugs whenever target word changes
  useEffect(() => {
    const decoys = pickDecoys(target, tierIdx, 4);
    const placed: Firefly[] = [];
    const taken: { x: number; y: number }[] = [];
    const tryPlace = (word: string) => {
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = 10 + Math.random() * 80;
        const y = 20 + Math.random() * 70;
        if (!taken.some(p => Math.abs(p.x - x) < 14 && Math.abs(p.y - y) < 12)) {
          taken.push({ x, y });
          const angle = Math.random() * Math.PI * 2;
          const speed = 12 + Math.random() * 14;
          placed.push({
            id: placed.length,
            word,
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            phase: Math.random() * Math.PI * 2,
            glow: false,
          });
          return;
        }
      }
      // Fallback
      placed.push({
        id: placed.length,
        word,
        x: 50, y: 50,
        vx: 0, vy: 0,
        phase: 0, glow: false,
      });
    };
    tryPlace(target);
    decoys.forEach(tryPlace);
    setBugs(placed);
  }, [target, tierIdx]);

  // Track arena size for responsive hit-testing
  useEffect(() => {
    const measure = () => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Animation loop
  useEffect(() => {
    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;
      setBugs(prev => prev.map(b => {
        let { x, y, vx, vy, escaping, escapeFromX, escapeFromY, escapeStart } = b;
        if (escaping) {
          const elapsed = (ts - (escapeStart || 0)) / 1000;
          // Fly diagonally up-right
          x = (escapeFromX || x) + elapsed * 320;
          y = (escapeFromY || y) + elapsed * -180;
          if (x > 110) return null as any;
          return { ...b, x, y, phase: b.phase + dt * 8 };
        }
        x += (vx / 100) * dt * 100;
        y += (vy / 100) * dt * 100;
        // Bounce
        if (x < 6) { x = 6; vx = Math.abs(vx); }
        if (x > 94) { x = 94; vx = -Math.abs(vx); }
        if (y < 14) { y = 14; vy = Math.abs(vy); }
        if (y > 88) { y = 88; vy = -Math.abs(vy); }
        // Tiny drift
        vx += (Math.random() - 0.5) * dt * 6;
        vy += (Math.random() - 0.5) * dt * 6;
        // Clamp speed
        const sp = Math.sqrt(vx * vx + vy * vy);
        const maxSp = 22;
        if (sp > maxSp) { vx = (vx / sp) * maxSp; vy = (vy / sp) * maxSp; }
        return { ...b, x, y, vx, vy, phase: b.phase + dt * 4 };
      }).filter(Boolean) as Firefly[]);
      tickRef.current = window.requestAnimationFrame(tick);
    };
    tickRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      lastTsRef.current = 0;
    };
  }, []);

  const handleBugTap = (b: Firefly) => {
    if (b.escaping) return;
    const isTarget = b.word === target;
    onCatch(b.word, isTarget);
    if (!isTarget) {
      // Make this bug fly off-screen
      setBugs(prev => prev.map(pb => pb.id === b.id
        ? { ...pb, escaping: true, escapeStart: performance.now(), escapeFromX: pb.x, escapeFromY: pb.y, vx: 0, vy: 0 }
        : pb
      ));
      // Respawn a fresh decoy elsewhere after a moment so the player has 4 options
      setTimeout(() => {
        setBugs(prev => prev.filter(pb => !(pb.id === b.id && pb.escaping)));
        const fresh = pickDecoys(target, tierIdx, 1)[0];
        // Place randomly
        const x = 10 + Math.random() * 80;
        const y = 20 + Math.random() * 70;
        const angle = Math.random() * Math.PI * 2;
        const speed = 12 + Math.random() * 14;
        setBugs(prev => [...prev, {
          id: Date.now(),
          word: fresh,
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          phase: Math.random() * Math.PI * 2,
          glow: false,
        }]);
      }, 700);
    } else {
      // Glow the target and respawn it elsewhere after a moment so the game continues
      setBugs(prev => prev.map(pb => pb.id === b.id ? { ...pb, glow: true } : pb));
    }
  };

  return (
    <>
      <div className="canvas-page slide-up" style={{ maxWidth: 920 }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🐛 Bug Catcher</h1>

        {/* Target banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 12, flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'var(--accent-yellow)', color: 'var(--text-dark)',
            padding: '10px 18px', borderRadius: 14, fontWeight: 700, fontSize: 22,
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-medium)' }}>Catch:</span>
            <span style={{ letterSpacing: 1 }}>{target}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--text-medium)' }}>
            <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
            <span>·</span>
            <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
            <span>·</span>
            <span>🏆 <strong>{bestStreak}</strong></span>
          </div>
        </div>

        {/* Arena */}
        <div
          ref={arenaRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${ARENA_W} / ${ARENA_H}`,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.2), inset 0 0 60px rgba(99,102,241,0.18)',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
          aria-label={`Find the firefly showing the word "${target}"`}
        >
          {/* Stars background */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const cx = (i * 37) % 100;
              const cy = (i * 53) % 100;
              const r = ((i % 5) + 1) * 0.4 + 0.4;
              return <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r={r} fill="white" opacity={0.55} />;
            })}
          </svg>

          {/* Bug layer */}
          {bugs.map(b => {
            const isTarget = b.word === target;
            const glow = b.glow;
            const pulse = 0.6 + 0.4 * Math.sin(b.phase * 6);
            return (
              <button
                key={b.id}
                onClick={() => handleBugTap(b)}
                aria-label={`Firefly showing ${b.word}`}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  pointerEvents: b.escaping ? 'none' : 'auto',
                  opacity: b.escaping ? 0.6 : 1,
                }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  filter: glow
                    ? `drop-shadow(0 0 ${10 + pulse * 12}px var(--accent-yellow)) drop-shadow(0 0 4px white)`
                    : isTarget
                    ? `drop-shadow(0 0 ${6 + pulse * 8}px var(--accent-yellow))`
                    : 'none',
                  transition: 'filter 0.2s',
                }}>
                  <div style={{
                    fontSize: 28,
                    lineHeight: 1,
                    animation: `floaty ${1 + (b.id % 3) * 0.2}s ease-in-out infinite`,
                  }}>
                    {glow || isTarget ? '🌟' : '🔥'}
                  </div>
                  <div style={{
                    background: glow ? 'var(--accent-yellow)' : isTarget ? 'rgba(255, 217, 61, 0.92)' : 'rgba(255,255,255,0.92)',
                    color: 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: b.word.length > 6 ? 13 : b.word.length > 4 ? 15 : 17,
                    padding: '4px 10px',
                    borderRadius: 10,
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                    border: isTarget ? '2px solid var(--accent-pink)' : '1.5px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  }}>
                    {b.word}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Floating flash overlay */}
          {flash && (
            <div
              style={{
                position: 'absolute',
                left: `${flash.x}%`,
                top: `${flash.y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                background: flash.kind === 'good' ? 'var(--accent-green)' : 'var(--accent-pink)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 14,
                fontSize: 18,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                animation: 'pop 0.4s ease',
                zIndex: 5,
                whiteSpace: 'nowrap',
              }}
            >
              {flash.text}
            </div>
          )}

          {/* Decorative grass at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '14%',
            background: 'linear-gradient(180deg, rgba(34,197,94,0.0), rgba(34,197,94,0.5))',
            pointerEvents: 'none',
          }} />
        </div>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-medium)' }}>
          Tap the firefly that shows the word <strong style={{ color: 'var(--accent-pink)' }}>{target}</strong>. Wrong flies zoom off!
        </p>

        {/* Rate button mid-session (gentle, optional) */}
        {!rated && streak > 0 && streak % 8 === 0 && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={onShowRating} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
              ⭐ Rate Bug Catcher
            </button>
          </div>
        )}
      </div>

      {showRating && !rated && (
        <RatingModal
          activity="bug-catcher"
          activityName="Bug Catcher"
          activityEmoji="🐛"
          kidName={kidName}
          onClose={() => {}} /* parent stays open until win */
        />
      )}
    </>
  );
}
