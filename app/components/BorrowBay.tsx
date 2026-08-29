'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Borrow Bay — pirate-themed subtraction with borrowing (regrouping across the
// tens column). Multiple-choice answers. After a correct answer that required
// borrowing, an animated "borrow 1 ten" reinforcement shows how the top tens
// digit traded 10 ones to the ones column. 2nd-grade standard CCSS 2.NBT.B.7
// (subtract within 100 using regrouping).

type Difficulty = 0 | 1 | 2;

interface Problem {
  a: number;        // minuend (top)
  b: number;        // subtrahend (bottom)
  answer: number;   // a - b
  onesA: number;
  onesB: number;
  tensA: number;
  tensB: number;
  onesOriginalDiff: number; // onesA - onesB (negative when borrow needed)
  needsBorrow: boolean;
  borrow: number;          // 0 or 1
  tensAfterBorrow: number; // top tens digit after borrowing
  finalTens: number;       // final tens digit of the answer
  finalOnes: number;       // final ones digit of the answer
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeProblem(difficulty: Difficulty): Problem {
  let a = 0, b = 0;
  if (difficulty === 0) {
    // 2-digit − 1-digit (sometimes borrow)
    a = randInt(11, 89);
    b = randInt(2, 9);
  } else if (difficulty === 1) {
    // 2-digit − 2-digit, ~50/50 borrow vs no-borrow
    const wantBorrow = Math.random() < 0.5;
    let attempts = 0;
    do {
      a = randInt(20, 89);
      b = randInt(11, a - 1);
      attempts++;
      if (attempts > 60) break;
    } while (wantBorrow ? (a % 10) >= (b % 10) : (a % 10) < (b % 10));
  } else {
    // Hard: mostly borrow; sometimes a 9x top with 8x bottom for a classic hard case
    a = randInt(20, 95);
    b = randInt(11, a - 1);
    if (Math.random() < 0.3 && a >= 80 && b <= 79) {
      a = randInt(80, 95);
      b = randInt(20, 79);
    }
    // Re-roll until borrow is required (a%10) < (b%10)
    let safety = 0;
    while ((a % 10) >= (b % 10) && safety++ < 20) {
      a = randInt(20, 95);
      b = randInt(11, a - 1);
    }
  }

  const answer = a - b;
  const onesA = a % 10;
  const onesB = b % 10;
  const tensA = Math.floor(a / 10);
  const tensB = Math.floor(b / 10);
  const needsBorrow = onesA < onesB;
  const borrow = needsBorrow ? 1 : 0;
  const tensAfterBorrow = needsBorrow ? tensA - 1 : tensA;
  const finalOnes = (onesA + 10 - onesB) % 10;
  const finalTens = Math.floor(answer / 10) % 10;
  return {
    a, b, answer,
    onesA, onesB, tensA, tensB,
    onesOriginalDiff: onesA - onesB,
    needsBorrow, borrow,
    tensAfterBorrow, finalOnes, finalTens,
  };
}

function makeChoices(correct: number): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 40) {
    const candidates = [
      correct + 1, correct - 1,
      correct + 10, correct - 10,
      correct + randInt(-9, 9),
    ];
    for (const v of candidates) {
      if (v >= 0 && v <= 198 && v !== correct) set.add(v);
      if (set.size >= 4) break;
    }
  }
  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) {
    const v = correct + 5 + arr.length * 7;
    if (v !== correct && !arr.includes(v)) arr.push(v);
    else arr.push(correct + 100 + arr.length);
  }
  return arr.sort(() => Math.random() - 0.5);
}

// ─── Audio ─────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function coinClink() {
  try {
    const c = ctx();
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.04 + 0.22);
      o.start(c.currentTime + i * 0.04); o.stop(c.currentTime + i * 0.04 + 0.24);
    });
  } catch {}
}
function thud() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.13, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.24);
    o.start(c.currentTime); o.stop(c.currentTime + 0.26);
  } catch {}
}
function bootyFanfare() {
  try {
    const c = ctx();
    [392, 523, 659, 784].forEach((f, i) => {
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

const TOTAL_ROUNDS = 10;

export default function BorrowBay({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(makeProblem(1).answer));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'borrow' | 'plain'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('borrowbay_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('borrowbay_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer));
    setScore(0); setStreak(0); setRound(0); setAttempts(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
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
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      coinClink();
      if (problem.needsBorrow) {
        setFeedback({
          kind: 'borrow',
          text: `🏴‍☠️ ${problem.a} − ${problem.b} = ${problem.answer} — borrow a ten from the top! 🪙`,
        });
      } else {
        setFeedback({
          kind: 'plain',
          text: `🎯 Right! ${problem.a} − ${problem.b} = ${problem.answer}`,
        });
      }
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) localStorage.setItem('borrowbay_best_streak', String(newStreak));
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1300);
    } else {
      thud();
      setStreak(0);
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({ kind: 'good', text: attempts === 0 ? 'Walk the plank — try again!' : `Not it. The booty is ${problem.answer}. Keep going!` });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try {
        if (score > bestScore) localStorage.setItem('borrowbay_best_score', String(score));
      } catch {}
      if (score >= 60) bootyFanfare();
    }
  }, [screen, score, bestScore]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏴‍☠️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Borrow Bay</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Subtract two 2-digit numbers. When the bottom ones digit is bigger than the top, <strong>borrow a ten</strong> from the tens column to score the booty!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-orange" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🪙 Easy · 2-digit − 1-digit</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⛵ Medium · 2-digit − 2-digit (mixed)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💀 Hard · mostly borrowing</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {(bestStreak > 0 || bestScore > 0) && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best: streak <strong>{bestStreak}</strong> · score <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 problems per raid. The fastest pirates score the most doubloons!
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
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🏴‍☠️' : stars >= 1 ? '🎉⛵' : '💪🪙'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
            Raid complete, Captain!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Booty: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
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
              🔄 Raid Again
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
              📋 Pick Level
            </button>
            <button className="btn btn-orange" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="borrow-bay"
            activityName="Borrow Bay"
            activityEmoji="🏴‍☠️"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── GAME ──────────────────────────────────────────────
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏴‍☠️ Borrow Bay</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> doubloons</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Vertical subtraction problem */}
      <div
        style={{
          background: 'white',
          padding: '24px 18px 18px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-orange)',
          marginBottom: 18,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {/* Top number — strikethrough on tens if borrowed */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block', width: 26,
                fontWeight: 700, fontSize: 16, textAlign: 'center',
                color: '#E5E0D8',
              }} />
              <span
                style={{
                  ...digitBox('tens'),
                  textDecoration: problem.needsBorrow && locked ? 'line-through' : 'none',
                  textDecorationThickness: '3px',
                  textDecorationColor: 'var(--accent-orange)',
                  color: problem.needsBorrow && locked ? '#C5B5A2' : 'var(--text-dark)',
                }}
              >
                {problem.needsBorrow && locked ? problem.tensAfterBorrow : problem.tensA}
              </span>
              <span style={digitBox('tens')}>{problem.onesA}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{
                display: 'inline-block', width: 26,
                fontSize: 26, fontWeight: 700,
                color: 'var(--accent-orange)', textAlign: 'center', lineHeight: 1,
              }}>
                −
              </span>
              <span style={{ ...digitBox('tens'), borderColor: 'var(--accent-orange)' }}>{problem.tensB}</span>
              <span style={{ ...digitBox('tens'), borderColor: 'var(--accent-orange)' }}>{problem.onesB}</span>
            </div>
            <div style={{ width: '100%', height: 2, background: 'var(--text-medium)', margin: '4px 0' }} />
            {/* Answer row */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', minHeight: 52 }}>
              <span style={{ display: 'inline-block', width: 26 }} />
              {locked ? (
                <>
                  <span style={digitBox('tens', 'correct')}>{problem.finalTens}</span>
                  <span style={digitBox('tens', 'correct')}>{problem.finalOnes}</span>
                </>
              ) : (
                <>
                  <span style={digitBox('tens', 'pending')}>?</span>
                  <span style={digitBox('tens', 'pending')}>?</span>
                </>
              )}
            </div>
            {/* Borrow visual: a small "10" badge below the ones column when borrowing */}
            {problem.needsBorrow && locked && (
              <div style={{
                alignSelf: 'flex-end', marginTop: 8,
                padding: '4px 10px',
                background: 'var(--accent-yellow)',
                borderRadius: 10,
                fontWeight: 700, fontSize: 14,
                color: 'var(--text-dark)',
                animation: 'pop 0.3s ease',
              }}>
                ⬇️ Borrowed 1 ten → now {(problem.onesA) + 10} ones
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Choices */}
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
              fontSize: 28,
              fontWeight: 700,
              padding: '20px 12px',
              background: 'white',
              color: 'var(--text-dark)',
              border: '3px solid #E5E0D8',
              boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer',
              opacity: locked ? 0.6 : 1,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Hint: ones are <strong>{problem.onesA} − {problem.onesB}</strong>
          {problem.needsBorrow
            ? ` — can't, so borrow! That's ${problem.onesA + 10} ones − ${problem.onesB} = ${problem.finalOnes}.`
            : ` = ${problem.finalOnes}.`}
        </p>
      )}

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
            background:
              feedback.kind === 'plain' ? 'var(--accent-green)'
              : feedback.kind === 'borrow' ? 'var(--accent-orange)'
              : '#FEF3C7',
            color: feedback.kind === 'good' ? 'var(--text-dark)' : 'white',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap an answer. Wrong picks shake the plank — try again, your streak will reset!
      </p>

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            ⭐ Rate Borrow Bay
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="borrow-bay"
          activityName="Borrow Bay"
          activityEmoji="🏴‍☠️"
          kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}

function digitBox(col: 'tens' | 'ones', tone: 'plain' | 'pending' | 'correct' = 'plain'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48, height: 52,
    borderRadius: 10,
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 30,
    fontWeight: 700,
    background: 'white',
  };
  if (tone === 'pending') return { ...base, border: '2px dashed #E5E0D8', color: '#C5B5A2' };
  if (tone === 'correct') return { ...base, border: '3px solid var(--accent-green)', color: 'var(--accent-green)' };
  return { ...base, border: '2px solid #E5E0D8', color: 'var(--text-dark)' };
}
