'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Compare Castles — two rival castles display their banner numbers (2- or 3-digit);
// the player decides which castle wins (>, <) or whether they tie (=).
// Three difficulty tiers: Easy = 2-digit, Medium = 3-digit with different hundreds,
// Hard = 3-digit with equal hundreds so the player must compare tens or ones.
// 2nd-grade standard: CCSS 2.NBT.A.4 — compare two three-digit numbers based on
// meanings of the hundreds, tens, and ones digits, using >, =, and < symbols
// to record the results of comparisons.

type Difficulty = 0 | 1 | 2;
type Relation = '>' | '<' | '=';

interface Problem {
  a: number;
  b: number;
  relation: Relation;
  aDigits: [number, number, number]; // [hundreds, tens, ones]
  bDigits: [number, number, number];
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function digitsOf(n: number): [number, number, number] {
  return [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];
}

function compare(a: number, b: number): Relation {
  if (a > b) return '>';
  if (a < b) return '<';
  return '=';
}

function makeProblem(difficulty: Difficulty): Problem {
  let a = 0, b = 0, rel: Relation = '=';

  if (difficulty === 0) {
    // Easy: 2-digit numbers (10..99), never equal
    a = randInt(10, 99);
    do { b = randInt(10, 99); } while (b === a);
    rel = compare(a, b);
  } else if (difficulty === 1) {
    // Medium: 3-digit with different hundreds
    a = randInt(100, 999);
    do { b = randInt(100, 999); } while (Math.floor(a / 100) === Math.floor(b / 100));
    rel = compare(a, b);
  } else {
    // Hard: same hundreds — tens or ones must decide (~30% ties)
    const hundreds = randInt(1, 9);
    const tensA = randInt(0, 9);
    const tensB = randInt(0, 9);
    const onesA = randInt(0, 9);
    const onesB = randInt(0, 9);
    a = hundreds * 100 + tensA * 10 + onesA;
    if (Math.random() < 0.3) {
      // Force a tie by reusing tens + ones
      b = hundreds * 100 + tensA * 10 + onesA;
    } else if (tensA === tensB && onesA === onesB) {
      // Nudge the ones so we don't accidentally tie
      b = hundreds * 100 + tensA * 10 + ((onesA + 1) % 10);
    } else {
      b = hundreds * 100 + tensB * 10 + onesB;
    }
    rel = compare(a, b);
  }

  return {
    a, b, relation: rel,
    aDigits: digitsOf(a),
    bDigits: digitsOf(b),
  };
}

function makeChoices(): Relation[] {
  return (['>', '<', '='] as Relation[]).sort(() => Math.random() - 0.5);
}

// ─── Audio (synth, no asset deps) ─────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }, (_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          background: colors[i % colors.length],
          animationDelay: `${Math.random() * 0.8}s`,
          width: 6 + Math.random() * 8,
          height: 12 + Math.random() * 12,
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

// ─── Single castle ────────────────────────────────────────────────────────────
function Castle({
  name, emoji, number, digits, winner, losing,
}: {
  name: string;
  emoji: string;
  number: number;
  digits: [number, number, number];
  winner: boolean | null;
  losing: boolean;
}) {
  const [hundreds, tens, ones] = digits;
  const isWinner = winner === true;
  const isLoser = winner === false;

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        textAlign: 'center',
        transition: 'transform 0.35s ease',
        transform: isWinner
          ? 'translateY(-10px) scale(1.04)'
          : isLoser ? 'translateY(6px) scale(0.97)' : 'translateY(0) scale(1)',
        opacity: losing ? 0.78 : 1,
        filter: losing ? 'grayscale(0.35)' : 'none',
      }}
    >
      <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 4 }}>{emoji}</div>

      <div
        style={{
          background: isWinner
            ? 'linear-gradient(180deg, #FFE7B5 0%, #FFD580 100%)'
            : isLoser
              ? 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)'
              : 'linear-gradient(180deg, #FFF8E0 0%, #FFE9B0 100%)',
          border: `3px solid ${isWinner ? 'var(--accent-orange)' : isLoser ? '#CBD5E1' : '#C8A91B'}`,
          borderRadius: 14,
          padding: '14px 10px 12px',
          margin: '0 auto',
          maxWidth: 220,
          boxShadow: isWinner ? '0 10px 0 rgba(0,0,0,0.10)' : '0 6px 0 rgba(0,0,0,0.08)',
          transition: 'all 0.25s ease',
        }}
      >
        <div style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-medium)',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 6,
        }}>{name}</div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 6 }}>
          {number >= 100 && (
            <DigitBox value={hundreds} winner={winner} label="H" />
          )}
          <DigitBox value={tens} winner={winner} label="T" />
          <DigitBox value={ones} winner={winner} label="O" />
        </div>

        <div style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 28, fontWeight: 700,
          color: isLoser ? 'var(--text-medium)' : 'var(--accent-orange)',
          marginTop: 6, letterSpacing: 1,
        }}>{number}</div>
      </div>

      <div style={{ marginTop: 12, fontSize: 28, minHeight: 36 }}>
        {isWinner && <span style={{ animation: 'pop 0.35s ease' }}>🏆</span>}
        {isLoser && <span style={{ opacity: 0.6 }}>�</span>}
      </div>
    </div>
  );
}

function DigitBox({ value, winner, label }: { value: number; winner: boolean | null; label: string }) {
  const isWinner = winner === true;
  const isLoser = winner === false;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 44, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'white',
        border: `2.5px solid ${isWinner ? 'var(--accent-orange)' : isLoser ? '#CBD5E1' : '#E5E0D8'}`,
        borderRadius: 10,
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 30, fontWeight: 700,
        color: isLoser ? 'var(--text-medium)' : 'var(--text-dark)',
        boxShadow: '0 2px 0 rgba(0,0,0,0.05)',
      }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-medium)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function CompareCastles({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<Relation[]>(() => makeChoices());
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad' | 'tie'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);
  const [winnerSide, setWinnerSide] = useState<'left' | 'right' | null>(null);

  // Hydrate + persist best streak
  useEffect(() => {
    try {
      const s = localStorage.getItem('comparecastles_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);
  useEffect(() => {
    if (streak > 0 && streak > bestStreak) {
      setBestStreak(streak);
      try { localStorage.setItem('comparecastles_best_streak', String(streak)); } catch {}
    }
  }, [streak, bestStreak]);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setProblem(makeProblem(d));
    setChoices(makeChoices());
    setRound(0); setStreak(0); setAttempts(0);
    setFeedback(null); setLocked(false); setWinnerSide(null);
    setScreen('play');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setProblem(makeProblem(d));
    setChoices(makeChoices());
    setAttempts(0); setFeedback(null); setLocked(false); setWinnerSide(null);
  }, []);

  const choose = useCallback((sym: Relation) => {
    if (locked) return;
    if (sym === problem.relation) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      ding();

      if (problem.relation === '=') {
        setWinnerSide(null);
        setFeedback({ kind: 'tie', text: `🤝 Tied! Both castles read ${problem.a}. Same digits, same number.` });
      } else {
        setWinnerSide(problem.relation === '>' ? (problem.a > problem.b ? 'left' : 'right') : (problem.a < problem.b ? 'left' : 'right'));
        const winner = problem.relation === '>' ? problem.a : problem.b;
        const loser = problem.relation === '>' ? problem.b : problem.a;
        setFeedback({ kind: 'good', text: `✅ ${winner} ${problem.relation} ${loser} — ${winner} wins the duel!` });
      }

      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1400);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? `Not quite — look at the digits carefully.`
          : `The correct relation is ${problem.relation}. ${problem.a} ${problem.relation} ${problem.b}.`,
      });
    }
  }, [locked, problem, attempts, streak, round, difficulty, nextRound]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏰</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Compare Castles</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 440, margin: '0 auto 24px' }}>
          Two castles stand with banners showing their numbers. Is one <strong>greater</strong> than the other,
          <strong> less</strong>, or are they <strong>equal</strong>? Tap <strong>{'>'}</strong>, <strong>{'<'}</strong>, or <strong>=</strong> to crown the winner!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 2-digit numbers</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 3-digit, different hundreds</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · same hundreds — check tens &amp; ones!</span>
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
          10 rounds per heat. Build a streak by answering correctly in a row!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((round / TOTAL_ROUNDS) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>
            {stars >= 3 ? '🏆🏰' : stars >= 1 ? '🎉🏰' : '💪🏰'}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
            Heat complete!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            You got <strong>{round}</strong> out of {TOTAL_ROUNDS} correct · best streak this heat: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          {!rated && round >= 5 && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              � Rate this game
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
            activity="compare-castles"
            activityName="Compare Castles"
            activityEmoji="🏰"
            kidName={kidName || 'friend'}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  // Tier-specific hint after a wrong guess
  let hint: string | null = null;
  if (attempts >= 1 && !locked) {
    const hA = Math.floor(problem.a / 100);
    const hB = Math.floor(problem.b / 100);
    if (difficulty === 2 && hA === hB) {
      const tA = Math.floor(problem.a / 10) % 10;
      const tB = Math.floor(problem.b / 10) % 10;
      if (tA !== tB) {
        hint = `💡 The hundreds are both ${hA}. Look at the tens: ${tA} vs ${tB}.`;
      } else {
        hint = `💡 The hundreds (${hA}) and tens (${tA}) match. Look at the ones: ${problem.a % 10} vs ${problem.b % 10}.`;
      }
    } else if (difficulty === 1 && hA !== hB) {
      hint = `💡 Hundreds are ${hA} vs ${hB} — the bigger hundreds digit wins.`;
    }
  }

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 760 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏰 Compare Castles</h1>

      {/* Top status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 best <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Two castles side by side */}
      <div
        style={{
          background: 'linear-gradient(180deg, #FFFDF5 0%, #FFF4D6 100%)',
          padding: '24px 16px 8px',
          borderRadius: 20,
          boxShadow: 'var(--shadow)',
          border: '3px solid #E8C97A',
          marginBottom: 18,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
        }}
      >
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Castle
            name="Blue Keep"
            emoji="🏰"
            number={problem.a}
            digits={problem.aDigits}
            winner={winnerSide === 'left' ? true : winnerSide === 'right' ? false : null}
            losing={winnerSide === 'right'}
          />
          <Castle
            name="Red Keep"
            emoji="🏯"
            number={problem.b}
            digits={problem.bDigits}
            winner={winnerSide === 'right' ? true : winnerSide === 'left' ? false : null}
            losing={winnerSide === 'left'}
          />
        </div>
      </div>

      {/* Three symbol buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 6 }}>
        {choices.map((sym) => {
          const isCorrect = locked && sym === problem.relation;
          return (
            <button
              key={sym}
              onClick={() => choose(sym)}
              disabled={locked}
              aria-label={sym === '>' ? 'Greater than' : sym === '<' ? 'Less than' : 'Equal to'}
              className="btn"
              style={{
                fontSize: 44, fontWeight: 700, padding: '18px 8px',
                background: isCorrect ? 'linear-gradient(180deg, #B7EFC5 0%, #6BCB77 100%)' : 'white',
                color: isCorrect ? 'white' : 'var(--text-dark)',
                border: isCorrect ? '3px solid #4FAE5B' : '3px solid #E5E0D8',
                boxShadow: isCorrect ? '0 6px 0 #2E7D34' : '0 4px 0 #C5B5A2',
                fontFamily: 'Fredoka, sans-serif',
                cursor: locked ? 'default' : 'pointer',
                opacity: locked && !isCorrect ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {sym}
            </button>
          );
        })}
      </div>

      {hint && (
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-medium)', marginTop: 12 }}>{hint}</p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-green)'
            : feedback.kind === 'tie' ? 'var(--accent-blue)' : '#FEF3C7',
          color: feedback.kind === 'bad' ? 'var(--text-dark)' : 'white',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
        }}>
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap a symbol to decide the duel. Wrong guesses reset your streak — try again!
      </p>

      {/* Rate prompt every 7 correct */}
      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            ⭐ Rate Compare Castles
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="compare-castles"
          activityName="Compare Castles"
          activityEmoji="🏰"
          kidName={kidName || 'friend'}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
