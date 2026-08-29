'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Triple-Digit Treasure — open treasure chests and add up the loot. Pirate theme.
// Stacks 2, 3, or 4 two-digit numbers (with + between them, = at the bottom)
// and asks the player to pick the correct sum from four large buttons.
//
// Three difficulty tiers:
//   🌱 Easy   — 2 two-digit numbers, sum stays ≤ 100
//   🌿 Medium — 3 two-digit numbers, sum can exceed 100
//   🌳 Hard   — 4 two-digit numbers, larger sums (target 100–250)
//
// Reinforcement: correct answer scatters 🪙 coins and bumps the streak.
// Wrong answer resets the streak and reveals the correct sum on the next try.
// 10 rounds per heat. Streak persisted in localStorage (`tripledigit_best_streak`).
//
// CCSS 2.NBT.B.6 — Add up to four two-digit numbers using strategies based on
// place value and properties of operations.

type Difficulty = 0 | 1 | 2;

interface Problem {
  nums: number[];
  answer: number;
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeProblem(difficulty: Difficulty): Problem {
  // Easy: 2 two-digit numbers, sum ≤ 100
  if (difficulty === 0) {
    const a = randInt(11, 89);
    let b = randInt(11, 89);
    // Cap so total never exceeds 100
    if (a + b > 100) b = Math.max(11, 100 - a);
    return { nums: [a, b], answer: a + b };
  }

  // Medium: 3 two-digit numbers, sum can exceed 100
  if (difficulty === 1) {
    const nums: number[] = [];
    let sum = 0;
    const slots = 3;
    for (let i = 0; i < slots; i++) {
      const isLast = i === slots - 1;
      // Bias toward smaller values so 3 numbers don't blow past 200 every time
      let v = randInt(15, 70);
      if (isLast) {
        // Constrain final addend so sum lands roughly 80–170
        const min = Math.max(15, 80 - sum);
        const max = Math.min(89, 170 - sum);
        v = randInt(Math.max(15, min), Math.max(min, max));
      }
      nums.push(v);
      sum += v;
    }
    // If sum is wildly out of range, regenerate once
    if (sum < 50 || sum > 220) return makeProblem(1);
    return { nums, answer: sum };
  }

  // Hard: 4 two-digit numbers, sum typically 100–250
  const nums: number[] = [];
  let sum = 0;
  const slots = 4;
  for (let i = 0; i < slots; i++) {
    const isLast = i === slots - 1;
    let v = randInt(20, 80);
    if (isLast) {
      // Target a final sum in 100–250
      const min = Math.max(20, 100 - sum);
      const max = Math.min(99, 250 - sum);
      v = randInt(Math.max(20, min), Math.max(min, max));
    }
    nums.push(v);
    sum += v;
  }
  if (sum < 100 || sum > 280) return makeProblem(2);
  return { nums, answer: sum };
}

function makeChoices(correct: number): number[] {
  // Distractor offsets mirror TwoDigitSprint: nearby ±5, ±10, ±20 bait.
  const offsets = [
    +5, -5,
    +10, -10,
    +20, -20,
    +1, -1,
    +2, -2,
  ];
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const v = correct + off;
    // Hard-tier sums can reach ~280; clamp plausible distractor range
    if (v >= 0 && v <= 400 && v !== correct) set.add(v);
  }
  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) {
    const v = correct + 7 + arr.length * 13;
    if (v !== correct && !arr.includes(v)) arr.push(v);
    else arr.push(correct + 100 + arr.length);
  }
  return arr.sort(() => Math.random() - 0.5);
}

// ─── Audio (synth, no asset deps) ─────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function coinDink() {
  try {
    const c = ctx();
    // Quick arpeggio of two bright notes — sounds like coins clinking
    [988, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.16, c.currentTime + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.07 + 0.18);
      o.start(c.currentTime + i * 0.07); o.stop(c.currentTime + i * 0.07 + 0.2);
    });
  } catch {}
}
function thud() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.22);
    g.gain.setValueAtTime(0.12, c.currentTime);
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

// Scattered coins animation — floats down + fades on correct answer.
function CoinShower({ active }: { active: boolean }) {
  if (!active) return null;
  const coins = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    duration: `${1.4 + Math.random() * 1.0}s`,
    size: 22 + Math.random() * 18,
    drift: -40 + Math.random() * 80,
  }));
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden',
    }}>
      {coins.map(c => (
        <span
          key={c.id}
          style={{
            position: 'absolute',
            top: -40,
            left: c.left,
            fontSize: c.size,
            animation: `coinFall ${c.duration} ease-in ${c.delay} forwards`,
            ['--drift' as any]: `${c.drift}px`,
          }}
        >
          🪙
        </span>
      ))}
      <style>{`
        @keyframes coinFall {
          0%   { transform: translate(0, -20px) rotate(0deg);   opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(var(--drift), 110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = 'tripledigit_best_streak';

export default function TripleDigitTreasure({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(makeProblem(1).answer));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0); // # of problems solved
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [coinsActive, setCoinsActive] = useState(false);
  const [shake, setShake] = useState(false);

  // Hydrate best streak from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  // Persist best streak as soon as it improves
  useEffect(() => {
    try {
      if (streak > bestStreak) {
        localStorage.setItem(STORAGE_KEY, String(streak));
        setBestStreak(streak);
      }
    } catch {}
  }, [streak, bestStreak]);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer));
    setScore(0);
    setStreak(0);
    setRound(0);
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
    setShowRating(false);
    setScreen('play');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((n: number) => {
    if (locked) return;
    if (n === problem.answer) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      const newRound = round + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(newRound);
      setLocked(true);
      coinDink();
      // Coin shower
      setCoinsActive(true);
      setTimeout(() => setCoinsActive(false), 2200);

      setFeedback({
        kind: 'good',
        text: `✨ ${problem.nums.join(' + ')} = ${problem.answer} — ${earned} 🪙!`,
      });

      const isLast = newRound >= TOTAL_ROUNDS;
      // Rating prompt every 7 correct answers
      if (newRound > 0 && newRound % 7 === 0 && !rated) {
        setShowRating(true);
      }
      setTimeout(() => {
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1500);
    } else {
      thud();
      setStreak(0); // streak resets on wrong
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? `❌ Not quite — try again!`
          : `❌ The correct sum is ${problem.answer}. Keep hunting for treasure!`,
      });
    }
  }, [locked, problem, attempts, streak, round, difficulty, nextRound, rated]);

  // Fanfare on results if streak was strong
  useEffect(() => {
    if (screen === 'results' && streak >= 5) fanfare();
  }, [screen, streak]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏴‍☠️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Triple-Digit Treasure</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 440, margin: '0 auto 24px' }}>
          Open treasure chests and add up the loot! Stack of two-digit numbers, one correct sum.
          Tap the right answer to fill your <strong>coin pouch</strong>.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a chest:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 2 numbers (sum ≤ 100)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 3 numbers</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · 4 numbers (sum 100–250)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best streak: <strong>{bestStreak}</strong> in a row
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 chests per heat. Miss one and your coin streak resets!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <CoinShower active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>
            {stars >= 3 ? '🏆🏴‍☠️' : stars >= 1 ? '🎉🪙' : '💪🏴‍☠️'}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
            Treasure secured!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Final streak: <strong>{streak}</strong>
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-medium)', marginTop: 4 }}>
            🏆 Best streak ever: <strong>{bestStreak}</strong>
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
              📋 Pick Chest
            </button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="triple-digit-treasure"
            activityName="Triple-Digit Treasure"
            activityEmoji="🏴‍☠️"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const maxDigits = Math.max(2, String(problem.answer).length); // 2 for two-digit, 3 when sum ≥ 100
  const rightPadWidth = 26; // matches the carry slot width above

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏴‍☠️ Triple-Digit Treasure</h1>

      {/* Top status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Treasure chest card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF6E5 0%, #FFE4B5 100%)',
          padding: '24px 18px 18px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid #C68A4A',
          marginBottom: 18,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', top: 8, left: 12, fontSize: 22, opacity: 0.85,
        }} aria-hidden>🪙</div>
        <div style={{
          position: 'absolute', top: 8, right: 12, fontSize: 22, opacity: 0.85,
        }} aria-hidden>🪙</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {/* Each addend on its own row, right-aligned, with + between */}
            {problem.nums.map((n, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ display: 'inline-block', width: rightPadWidth, textAlign: 'right', fontSize: 22, fontWeight: 700, color: i === 0 ? 'transparent' : 'var(--accent-purple)' }}>
                  {i === 0 ? '' : '+'}
                </span>
                <span style={chestDigitBox('plain', maxDigits)}>{Math.floor(n / 10)}</span>
                <span style={chestDigitBox('plain', maxDigits)}>{n % 10}</span>
              </div>
            ))}
            {/* Divider */}
            <div style={{ width: '100%', height: 3, background: 'var(--text-medium)', margin: '6px 0' }} />
            {/* Answer slot */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', minHeight: 52 }}>
              <span style={{ display: 'inline-block', width: rightPadWidth }} />
              {locked ? (
                maxDigits === 3 ? (
                  <>
                    <span style={chestDigitBox('correct', maxDigits)}>{Math.floor(problem.answer / 100)}</span>
                    <span style={chestDigitBox('correct', maxDigits)}>{Math.floor(problem.answer / 10) % 10}</span>
                    <span style={chestDigitBox('correct', maxDigits)}>{problem.answer % 10}</span>
                  </>
                ) : (
                  <>
                    <span style={{ display: 'inline-block', width: rightPadWidth }} />
                    <span style={chestDigitBox('correct', maxDigits)}>{Math.floor(problem.answer / 10)}</span>
                    <span style={chestDigitBox('correct', maxDigits)}>{problem.answer % 10}</span>
                  </>
                )
              ) : (
                <>
                  <span style={{ display: 'inline-block', width: rightPadWidth }} />
                  <span style={chestDigitBox('pending', maxDigits)}>?</span>
                  <span style={chestDigitBox('pending', maxDigits)}>?</span>
                  {maxDigits === 3 && <span style={chestDigitBox('pending', maxDigits)}>?</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answer choices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        marginBottom: 6,
      }}>
        {choices.map((c, i) => (
          <button
            key={`${c}-${i}`}
            onClick={() => choose(c)}
            disabled={locked}
            className="btn"
            style={{
              fontSize: 26,
              fontWeight: 700,
              padding: '20px 12px',
              background: 'white',
              color: 'var(--text-dark)',
              border: '3px solid #E5E0D8',
              boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer',
              opacity: locked ? 0.6 : 1,
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hint after a couple of misses */}
      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip — add the ones first, then the tens. Try pairing numbers that round to friendly sums.
        </p>
      )}

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
            background: feedback.kind === 'good' ? 'var(--accent-orange)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap the correct sum to collect gold. Wrong answers reset your streak!
      </p>

      <CoinShower active={coinsActive} />

      {/* Quick rate prompt every 7 rounds */}
      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            ⭐ Rate Triple-Digit Treasure
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="triple-digit-treasure"
          activityName="Triple-Digit Treasure"
          activityEmoji="🏴‍☠️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}

function chestDigitBox(tone: 'plain' | 'pending' | 'correct', maxDigits: number): React.CSSProperties {
  // Wider boxes when the answer can be 3 digits
  const w = maxDigits === 3 ? 46 : 48;
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: w, height: 52,
    borderRadius: 10,
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 30,
    fontWeight: 700,
    background: 'white',
  };
  if (tone === 'pending') return { ...base, border: '2px dashed #C68A4A', color: '#C5B5A2' };
  if (tone === 'correct') return { ...base, border: '3px solid var(--accent-orange)', color: 'var(--accent-orange)' };
  return { ...base, border: '2px solid #C68A4A', color: 'var(--text-dark)' };
}