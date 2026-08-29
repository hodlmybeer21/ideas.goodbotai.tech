'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Odd-Even Oasis — sort numbers into odd and even groups, framed as pairs of
// camels gathering at desert watering holes. Tiers raise the difficulty in
// range and presentation:
//   🌱 Easy   (1–20)         show camels paired (plus a lonely one if odd)
//   🌿 Medium (1–50)         pair visualization on, larger numbers
//   🌳 Hard   (1–99)         mix in word-form numbers ("seventeen" → 17)
// Three difficulty tiers, 10-round heats, streak + best-streak persistence
// (localStorage). Kid-friendly prompts, big tap targets, synth audio feedback.
// CCSS 2.OA.C.3: Determine whether a group of objects (up to 20) has an odd or
// even number of members, e.g., by pairing objects or counting them by 2s;
// write an equation to express an even number as a sum of two equal addends.

type Difficulty = 0 | 1 | 2;

interface Round {
  n: number;       // the numeric value
  isEven: boolean;
  label: string;   // "17" or "seventeen" for the hard tier
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

const NUMBER_WORDS: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
  11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen',
  15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen',
  19: 'nineteen', 20: 'twenty', 21: 'twenty-one', 22: 'twenty-two',
  23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
  26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight',
  29: 'twenty-nine', 30: 'thirty', 31: 'thirty-one', 32: 'thirty-two',
  33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
  36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight',
  39: 'thirty-nine', 40: 'forty', 41: 'forty-one', 42: 'forty-two',
  43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
  46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight',
  49: 'forty-nine', 50: 'fifty',
  51: 'fifty-one', 55: 'fifty-five', 60: 'sixty',
  66: 'sixty-six', 70: 'seventy', 77: 'seventy-seven',
  80: 'eighty', 88: 'eighty-eight', 90: 'ninety', 99: 'ninety-nine',
};

function makeRound(difficulty: Difficulty): Round {
  let n = 0;
  if (difficulty === 0) {
    // Easy: 1–20
    n = randInt(1, 20);
  } else if (difficulty === 1) {
    // Medium: 1–50
    n = randInt(1, 50);
  } else {
    // Hard: 1–99, occasionally word-form
    n = randInt(1, 99);
  }
  const useWords = difficulty === 2 && Math.random() < 0.4 && NUMBER_WORDS[n];
  return {
    n,
    isEven: n % 2 === 0,
    label: useWords ? NUMBER_WORDS[n] : String(n),
  };
}

// ─── Audio (synth, no asset deps) ─────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    _ctx = new AC();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function ding() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function waterDrop() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.16, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function buzz() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.22);
    g.gain.setValueAtTime(0.13, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.26);
    o.start(c.currentTime); o.stop(c.currentTime + 0.28);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.28);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.3);
    });
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
    delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          background: p.color,
          animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

// ─── Pair visualization ──────────────────────────────────────────────────────
// Renders N camels as camel pairs (with a lonely camel when odd). Easy + Medium.
function CamelPairs({ n }: { n: number }) {
  const pairs = Math.floor(n / 2);
  const lonely = n % 2 === 1;
  const items: { kind: 'pair' | 'lonely'; key: string }[] = [];
  for (let i = 0; i < pairs; i++) {
    items.push({ kind: 'pair', key: `p${i}` });
  }
  if (lonely) {
    items.push({ kind: 'lonely', key: 'lonely' });
  }
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 8px',
        background: 'linear-gradient(180deg, #FFF8E7 0%, #FFE9B0 100%)',
        borderRadius: 16,
        border: '2px dashed #E5B85A',
      }}
      aria-label={`${n} camels arranged in ${pairs} pairs${lonely ? ' and one lonely camel' : ''}`}
    >
      {items.map(it => (
        <div
          key={it.key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: it.kind === 'pair' ? 64 : 36,
            height: 40,
            padding: it.kind === 'pair' ? '0 4px' : 0,
            background: it.kind === 'pair'
              ? 'rgba(107, 203, 119, 0.15)'
              : 'rgba(255, 159, 67, 0.18)',
            border: it.kind === 'pair'
              ? '2px solid rgba(107, 203, 119, 0.55)'
              : '2px dashed rgba(255, 159, 67, 0.7)',
            borderRadius: 12,
            fontSize: it.kind === 'pair' ? 28 : 28,
            filter: it.kind === 'lonely' ? 'grayscale(0.15) opacity(0.85)' : 'none',
          }}
        >
          {it.kind === 'pair' ? '🐫🐫' : '🐫'}
        </div>
      ))}
    </div>
  );
}

// Pair-equation helper for the on-screen explanation after a correct answer.
function pairEquation(n: number): string | null {
  if (n % 2 !== 0) return null;
  const half = n / 2;
  return `${n} = ${half} + ${half}`;
}

const TOTAL_ROUNDS = 10;

export default function OddEvenOasis({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [round, setRound] = useState<Round>(() => makeRound(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [current, setCurrent] = useState(0); // # of correctly solved so far
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false); // short lockout after correct
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [hopping, setHopping] = useState<{ to: 'odd' | 'even'; key: number } | null>(null);

  // Hydrate best streak from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('oddeven_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setRound(makeRound(d));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setRound(makeRound(d));
    setScore(0);
    setStreak(0);
    setCurrent(0);
    setFeedback(null);
    setLocked(false);
    setFlash(null);
    setScreen('play');
  }, []);

  const answer = useCallback((guess: 'odd' | 'even') => {
    if (locked) return;
    const correct = round.isEven ? 'even' : 'odd';
    if (guess === correct) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      waterDrop();
      // Make the number "hop" to its oasis side
      setHopping({ to: correct, key: Date.now() });

      // Build a kid-friendly explanation. For evens, surface the pair-equation.
      let explain: string;
      if (round.isEven) {
        const eq = pairEquation(round.n);
        explain = eq
          ? `✅ ${round.n} is even — ${eq}! 🐫🐫`
          : `✅ ${round.n} is even!`;
      } else {
        explain = round.n === 1
          ? `✅ 1 is odd — one lonely camel! 🐫`
          : `✅ ${round.n} is odd — pairs plus one lonely camel!`;
      }
      setFeedback({ kind: 'good', text: explain });

      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        setHopping(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('oddeven_best_streak', String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1200);
    } else {
      buzz();
      setStreak(0);
      setFlash('bad');
      setFeedback({
        kind: 'bad',
        text: `Not quite — try again! Look at the camels: can you pair them up?`,
      });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, round, streak, score, current, bestStreak, difficulty, nextRound]);

  // Show the rating modal every 7 correct answers (per spec).
  useEffect(() => {
    if (screen === 'play' && current > 0 && current % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [current, screen, showRating, rated]);

  const showPairs = difficulty === 0 || difficulty === 1;

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🐫</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Odd-Even Oasis</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Welcome to the oasis! Camels come in <strong>pairs</strong> — two by two. If there's a
          lonely camel left over, the herd is <strong>odd</strong>. If everyone has a buddy, it's <strong>even</strong>.
          Sort each number into the right watering hole!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a herd size:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · numbers 1–20 (with pairs)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · numbers 1–50</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · numbers 1–99, words sneak in</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best streak: <strong>{bestStreak}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 camels per heat. Build a long streak to be a desert legend!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji =
      stars >= 3 ? '🏆🐫' : stars >= 2 ? '🎉🐫' : stars >= 1 ? '👍🐫' : '💪🐫';
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
            Heat complete!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          {!rated && score >= 50 && (
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
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="odd-even-oasis"
            activityName="Odd-Even Oasis"
            activityEmoji="🐫"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 119, 0.35)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.35)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{
        maxWidth: 720,
        position: 'relative',
        transition: 'background-color 0.18s',
        background: flashBg,
      }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🐫 Odd-Even Oasis</h1>

      {/* Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-orange)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>
          🔥 streak{' '}
          <strong style={{ color: 'var(--accent-orange)', display: 'inline-block', minWidth: 16, textAlign: 'center' }}>
            {streak}
          </strong>
          {hopping && (
            <span
              key={hopping.key}
              style={{
                marginLeft: 6,
                color: 'var(--accent-green)',
                fontWeight: 700,
                animation: 'hopUp 0.7s ease-out',
                display: 'inline-block',
              }}
            >
              +1
            </span>
          )}
        </span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Prompt + number */}
      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-orange)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          Is this number odd or even?
        </p>
        <div
          style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 84,
            fontWeight: 700,
            color: 'var(--accent-orange)',
            lineHeight: 1.1,
            marginTop: 4,
            textShadow: '0 2px 0 rgba(0,0,0,0.05)',
            letterSpacing: 0.5,
          }}
        >
          {round.label}
        </div>
        {round.label !== String(round.n) && (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-medium)' }}>
            (= {round.n})
          </p>
        )}

        {/* Pair visualization */}
        {showPairs && (
          <div style={{ marginTop: 14 }}>
            <CamelPairs n={round.n} />
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-medium)' }}>
              Can every camel find a buddy?
            </p>
          </div>
        )}
      </div>

      {/* Tap prompt */}
      <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-medium)', marginBottom: 10 }}>
        Tap the camel with the right herd! 🐫
      </p>

      {/* Big choice buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => answer('odd')}
          disabled={locked}
          aria-label="Odd"
          className="btn"
          style={{
            background: 'linear-gradient(180deg, #BDE0FE 0%, #6BCBFF 100%)',
            color: 'white',
            border: '3px solid #3FA9D6',
            boxShadow: '0 6px 0 #2C7FA8',
            fontSize: 30,
            fontWeight: 800,
            padding: '22px 8px',
            borderRadius: 18,
            cursor: locked ? 'default' : 'pointer',
            opacity: locked ? 0.7 : 1,
            transition: 'transform 0.08s, box-shadow 0.08s',
            textShadow: '0 2px 0 rgba(0,0,0,0.15)',
            fontFamily: 'Fredoka, sans-serif',
          }}
        >
          <div style={{ fontSize: 42, lineHeight: 1 }}>🐫</div>
          <div style={{ marginTop: 6, letterSpacing: 1 }}>ODD</div>
          <div style={{ fontSize: 12, opacity: 0.95, marginTop: 4, fontWeight: 600 }}>
            lonely camel
          </div>
        </button>
        <button
          onClick={() => answer('even')}
          disabled={locked}
          aria-label="Even"
          className="btn"
          style={{
            background: 'linear-gradient(180deg, #C8F0CF 0%, #6BCB77 100%)',
            color: 'white',
            border: '3px solid #4DA15A',
            boxShadow: '0 6px 0 #2F7A3D',
            fontSize: 30,
            fontWeight: 800,
            padding: '22px 8px',
            borderRadius: 18,
            cursor: locked ? 'default' : 'pointer',
            opacity: locked ? 0.7 : 1,
            transition: 'transform 0.08s, box-shadow 0.08s',
            textShadow: '0 2px 0 rgba(0,0,0,0.15)',
            fontFamily: 'Fredoka, sans-serif',
          }}
        >
          <div style={{ fontSize: 42, lineHeight: 1 }}>🐫🐫</div>
          <div style={{ marginTop: 6, letterSpacing: 1 }}>EVEN</div>
          <div style={{ fontSize: 12, opacity: 0.95, marginTop: 4, fontWeight: 600 }}>
            paired up
          </div>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 17,
            animation: 'pop 0.3s ease',
            background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Remember: <strong style={{ color: 'var(--accent-blue)' }}>odd</strong> = pairs plus one lonely camel. <strong style={{ color: 'var(--accent-green)' }}>Even</strong> = every camel has a buddy!
      </p>

      {/* Inline hop animation (small +1 next to streak) — also small inline keyframes */}
      <style>{`
        @keyframes hopUp {
          0%   { transform: translateY(0); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-18px); opacity: 0; }
        }
      `}</style>

      {showRating && !rated && (
        <RatingModal
          activity="odd-even-oasis"
          activityName="Odd-Even Oasis"
          activityEmoji="🐫"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
