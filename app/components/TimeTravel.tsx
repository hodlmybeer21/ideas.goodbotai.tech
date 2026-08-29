'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Time Travel — solve elapsed-time word problems. Time-machine theme — pilot
// a clock through time jumps.
//   🌱 Easy   (within the hour, e.g., "It's 2:00. +30 = 2:30")
//   🌿 Medium (across the hour, e.g., "It's 1:30. +45 = 2:15")
//   🌳 Hard   (word problems with scenarios + a.m./p.m.)
// CCSS 2.MD.C.7: Tell and write time from analog and digital clocks to the
// nearest five minutes, using a.m. and p.m., and describe time intervals in
// minutes.

type Difficulty = 0 | 1 | 2;

interface Problem {
  startHour: number;
  startMin: number;
  elapsedMin: number;
  answerHour: number;
  answerMin: number;
  scenario: string;
  useAmPm: boolean;
  ampm: 'am' | 'pm' | null;  // for tier 2 word problems
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function addMinutes(hour: number, min: number, add: number): { hour: number; min: number } {
  let totalMin = hour * 60 + min + add;
  // Wrap around 12-hour clock
  totalMin = ((totalMin % (12 * 60)) + 12 * 60) % (12 * 60);
  return { hour: Math.floor(totalMin / 60) || 12, min: totalMin % 60 };
}

function formatTime(h: number, m: number, useAmPm: boolean, ampm: 'am' | 'pm' | null): string {
  const base = `${h}:${m.toString().padStart(2, '0')}`;
  if (useAmPm && ampm) return `${base} ${ampm}`;
  return base;
}

function makeProblem(difficulty: Difficulty): Problem {
  const fiveMinMarks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  if (difficulty === 0) {
    // Easy: within the hour (startMin + elapsedMin < 60)
    const startMin = pick(fiveMinMarks);
    const maxElapse = Math.max(5, 55 - startMin);
    const elapsedMin = pick(fiveMinMarks.filter(m => m >= 5 && m <= maxElapse));
    const startHour = randInt(1, 12);
    const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
    return {
      startHour, startMin, elapsedMin,
      answerHour: hour, answerMin: min,
      scenario: `It's ${formatTime(startHour, startMin, false, null)}. What time will it be in ${elapsedMin} minutes?`,
      useAmPm: false, ampm: null,
    };
  }

  if (difficulty === 1) {
    // Medium: across the hour (startMin + elapsedMin >= 60, wraps to next hour)
    const startMin = pick([15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const elapsedMin = pick([30, 35, 40, 45, 50, 55, 60, 75, 90].filter(m => m >= 60 - startMin + 5 && m <= 95));
    const startHour = randInt(1, 12);
    const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
    return {
      startHour, startMin, elapsedMin,
      answerHour: hour, answerMin: min,
      scenario: `It's ${formatTime(startHour, startMin, false, null)}. What time will it be in ${elapsedMin} minutes?`,
      useAmPm: false, ampm: null,
    };
  }

  // Hard: word problem with scenario + a.m./p.m.
  const recipes: Array<() => Problem> = [
    () => {
      // Recess
      const startHour = 10, startMin = pick([10, 15, 20, 25]);
      const elapsedMin = pick([20, 25, 30]);
      const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
      return {
        startHour, startMin, elapsedMin,
        answerHour: hour, answerMin: min,
        scenario: `Recess starts at ${formatTime(startHour, startMin, false, null)} a.m. and lasts ${elapsedMin} minutes. When does it end?`,
        useAmPm: true, ampm: 'am',
      };
    },
    () => {
      // Movie
      const startHour = pick([7, 8]);
      const startMin = pick([0, 15, 30]);
      const elapsedMin = pick([90, 105, 120]);
      const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
      return {
        startHour, startMin, elapsedMin,
        answerHour: hour, answerMin: min,
        scenario: `The movie starts at ${formatTime(startHour, startMin, false, null)} p.m. and lasts ${elapsedMin >= 60 ? `${Math.floor(elapsedMin/60)} hour${elapsedMin>=120?'s':''}${elapsedMin%60?' and '+(elapsedMin%60)+' minutes':''}` : elapsedMin + ' minutes'}. When does it end?`,
        useAmPm: true, ampm: 'pm',
      };
    },
    () => {
      // Soccer practice
      const startHour = pick([4, 5]);
      const startMin = pick([0, 15, 30]);
      const elapsedMin = pick([60, 75, 90]);
      const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
      return {
        startHour, startMin, elapsedMin,
        answerHour: hour, answerMin: min,
        scenario: `Soccer practice starts at ${formatTime(startHour, startMin, false, null)} p.m. It lasts ${elapsedMin} minutes. When does it end?`,
        useAmPm: true, ampm: 'pm',
      };
    },
    () => {
      // Bedtime story
      const startHour = pick([7, 8]);
      const startMin = pick([0, 15, 30]);
      const elapsedMin = pick([30, 45]);
      const { hour, min } = addMinutes(startHour, startMin, elapsedMin);
      return {
        startHour, startMin, elapsedMin,
        answerHour: hour, answerMin: min,
        scenario: `Storytime starts at ${formatTime(startHour, startMin, false, null)} p.m. and lasts ${elapsedMin} minutes. When does it end?`,
        useAmPm: true, ampm: 'pm',
      };
    },
  ];
  return pick(recipes)();
}

function makeChoices(problem: Problem, count = 4): string[] {
  const correct = formatTime(problem.answerHour, problem.answerMin, problem.useAmPm, problem.ampm);
  const offsets = [-30, -15, -10, -5, 5, 10, 15, 30, 45, 60];
  const candidates = new Set<string>();
  for (const off of offsets) {
    const { hour, min } = addMinutes(problem.answerHour, problem.answerMin, off);
    candidates.add(formatTime(hour, min, problem.useAmPm, problem.ampm));
  }
  candidates.delete(correct);
  const arr = shuffle([...candidates]).slice(0, count - 1);
  return shuffle([correct, ...arr]).slice(0, count);
}

function AnalogClock({ hour, minute, size = 160 }: { hour: number; minute: number; size?: number }) {
  const cx = size / 2, cy = size / 2;
  // Hour hand: 30deg per hour + half of minute degree
  const hourDeg = ((hour % 12) * 30) + (minute * 0.5);
  const minDeg = minute * 6;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`clock ${hour}:${minute}`}>
      <circle cx={cx} cy={cy} r={size * 0.45} fill="white" stroke="#2D1B00" strokeWidth={3} />
      {/* Tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = cx + Math.sin(a) * size * 0.42;
        const y1 = cy - Math.cos(a) * size * 0.42;
        const x2 = cx + Math.sin(a) * size * 0.36;
        const y2 = cy - Math.cos(a) * size * 0.36;
        const isQuarter = i % 3 === 0;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#2D1B00"
            strokeWidth={isQuarter ? 4 : 2}
            strokeLinecap="round"
          />
        );
      })}
      {/* Hour numbers */}
      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r = size * 0.3;
        return (
          <text
            key={num}
            x={cx + Math.sin(a) * r}
            y={cy - Math.cos(a) * r + 5}
            fontSize={size * 0.1}
            fontWeight="700"
            textAnchor="middle"
            fill="#2D1B00"
            fontFamily="Fredoka, sans-serif"
          >
            {num}
          </text>
        );
      })}
      {/* Minute hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.sin((minDeg * Math.PI) / 180) * size * 0.36}
        y2={cy - Math.cos((minDeg * Math.PI) / 180) * size * 0.36}
        stroke="var(--accent-blue)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Hour hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.sin((hourDeg * Math.PI) / 180) * size * 0.24}
        y2={cy - Math.cos((hourDeg * Math.PI) / 180) * size * 0.24}
        stroke="var(--accent-orange)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={5} fill="#2D1B00" />
    </svg>
  );
}

const TOTAL_ROUNDS = 10;

export default function TimeTravel({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<string[]>(() => makeChoices(makeProblem(1)));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('timetravel_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p));
    setScore(0);
    setStreak(0);
    setCurrent(0);
    setFeedback(null);
    setLocked(false);
    setFlash(null);
    setScreen('play');
  }, []);

  const answer = useCallback((choice: string) => {
    if (locked) return;
    const correct = formatTime(problem.answerHour, problem.answerMin, problem.useAmPm, problem.ampm);
    const isCorrect = choice === correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      setFeedback({ kind: 'good', text: `✅ Time warp! ${correct} — perfect landing.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('timetravel_best_streak', String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1100);
    } else {
      setStreak(0);
      setFlash('bad');
      setFeedback({ kind: 'bad', text: `Not quite. ${problem.elapsedMin} minutes after ${formatTime(problem.startHour, problem.startMin, false, null)} = ${correct}.` });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, problem, streak, score, current, bestStreak, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'play' && current > 0 && current % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [current, screen, showRating, rated]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>⏳</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Time Travel</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Pilot a clock through time jumps! Read the clock and figure out the
          new time after some minutes have passed.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a time machine:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · within the hour</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · across the hour</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · word problems with a.m./p.m.</span>
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
          10 rounds per heat. Land every jump!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆⏳' : stars >= 2 ? '🎉⏳' : stars >= 1 ? '👍⏳' : '💪⏳';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Mission complete!
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
            � Home
          </button>
        </div>

        {showRating && !rated && (
          <RatingModal
            activity="time-travel"
            activityName="Time Travel"
            activityEmoji="⏳"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 255, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>⏳ Time Travel</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-blue)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-blue)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-dark)' }}>
          {problem.scenario}
        </p>

        <div style={{ marginTop: 16, display: 'inline-block' }}>
          <AnalogClock hour={problem.startHour} minute={problem.startMin} size={180} />
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--accent-orange)',
          }}
        >
          Start: {formatTime(problem.startHour, problem.startMin, problem.useAmPm, problem.ampm)}
        </div>
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(c)}
            disabled={locked}
            className="btn"
            style={{
              background: locked && c === formatTime(problem.answerHour, problem.answerMin, problem.useAmPm, problem.ampm) ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === formatTime(problem.answerHour, problem.answerMin, problem.useAmPm, problem.ampm) ? 'white' : 'var(--text-dark)',
              border: locked && c === formatTime(problem.answerHour, problem.answerMin, problem.useAmPm, problem.ampm) ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: 22,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
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
        Tip: count by 5s when you count minutes — 5, 10, 15, 20...
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="time-travel"
          activityName="Time Travel"
          activityEmoji="⏳"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
