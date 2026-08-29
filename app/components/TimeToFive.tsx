'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Time to 5 — given an analog clock face with hands at a random 5-minute mark,
// pick the matching digital time from 4 choices. CCSS 2.MD.A.7 (tell/write time
// to nearest 5 min). The house style already has a "Tell Time" game that uses
// button controls to set the hands; this is the complementary read-the-clock
// skill recommended for 2nd grade.

type Difficulty = 0 | 1 | 2;

interface Question {
  hour: number;     // 1..12
  minute: number;   // 0, 5, 10, 15, ..., 55
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeQuestion(difficulty: Difficulty): Question {
  const fiveMinMarks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  if (difficulty === 0) {
    // Easy: hour-only or hour-30 minutes (the easier half)
    const minute = Math.random() < 0.5 ? 0 : 30;
    return { hour: randInt(1, 12), minute };
  }
  if (difficulty === 1) {
    // Medium: any 5-min mark, any hour
    return { hour: randInt(1, 12), minute: fiveMinMarks[randInt(0, 11)] };
  }
  // Hard: random 5-min marks with the hour-hand pointing mid-way (e.g., 1:35 hour hand between 1 and 2)
  return { hour: randInt(1, 12), minute: fiveMinMarks[randInt(0, 11)] };
}

function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, '0')}`;
}

function makeChoices(q: Question): string[] {
  const correct = formatTime(q.hour, q.minute);
  const fiveMinMarks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const set = new Set<string>([correct]);
  // Generate distractors: same hour with different minutes (the classic trap)
  let guard = 0;
  while (set.size < 4 && guard++ < 20) {
    const m = fiveMinMarks[randInt(0, 11)];
    if (m === q.minute) continue;
    set.add(formatTime(q.hour, m));
  }
  // Then distractors: different hours (off-by-one-hour bait)
  while (set.size < 4) {
    const h = (q.hour % 12) + 1;
    const m = fiveMinMarks[randInt(0, 11)];
    const cand = formatTime(h, m);
    if (cand !== correct) set.add(cand);
  }
  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) arr.push(formatTime(q.hour, (q.minute + 5 * arr.length) % 60));
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
function chime() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 1047;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function click() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.16);
    g.gain.setValueAtTime(0.10, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function arpeggio() {
  try {
    const c = ctx();
    [659, 784, 988, 1319].forEach((f, i) => {
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

// ─── Display-only clock (no controls) ────────────────────────────
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  const hourDeg = hour * 30 + minute * 0.5;
  const minuteDeg = minute * 6;

  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i === 0 ? 12 : i;
    const angle = i * 30 - 90;
    const rad = angle * (Math.PI / 180);
    const r = 110;
    return {
      num,
      x: 140 + r * Math.cos(rad),
      y: 140 + r * Math.sin(rad),
    };
  });

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6 - 90;
    const isMain = i % 5 === 0;
    const rad = angle * (Math.PI / 180);
    const innerR = isMain ? 100 : 108;
    const outerR = 118;
    return {
      x1: 140 + innerR * Math.cos(rad), y1: 140 + innerR * Math.sin(rad),
      x2: 140 + outerR * Math.cos(rad), y2: 140 + outerR * Math.sin(rad),
      isMain,
    };
  });

  return (
    <svg width={280} height={280} viewBox="0 0 280 280" aria-label={`Clock showing ${hour}:${minute}`}>
      <circle cx={140} cy={140} r={135} fill="#ffffff" stroke="#E5E0D8" strokeWidth={3} />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isMain ? '#bbb' : '#ddd'} strokeWidth={t.isMain ? 2.5 : 1} />
      ))}
      {hourNumbers.map(h => (
        <text key={h.num} x={h.x} y={h.y} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fill: '#555', fontWeight: 600 }}>
          {h.num}
        </text>
      ))}
      {/* Hour hand (pink) */}
      <g style={{
        transformOrigin: '140px 140px',
        transform: `rotate(${hourDeg}deg)`,
        transition: 'transform 0.4s ease-out',
      }}>
        <line x1={140} y1={140} x2={140} y2={80} stroke="#FF6B9D" strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* Minute hand (blue) */}
      <g style={{
        transformOrigin: '140px 140px',
        transform: `rotate(${minuteDeg}deg)`,
        transition: 'transform 0.4s ease-out',
      }}>
        <line x1={140} y1={140} x2={140} y2={50} stroke="#6BCBFF" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* Center pin */}
      <circle cx={140} cy={140} r={6} fill="#888" />
    </svg>
  );
}

const TOTAL_ROUNDS = 10;

export default function TimeToFive({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
  const [choices, setChoices] = useState<string[]>(() => makeChoices(makeQuestion(1)));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad' | 'almost'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('timeto5_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('timeto5_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const q = makeQuestion(d);
    setQuestion(q);
    setChoices(makeChoices(q));
    setScore(0); setStreak(0); setRound(0); setAttempts(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const q = makeQuestion(d);
    setQuestion(q);
    setChoices(makeChoices(q));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((label: string) => {
    if (locked) return;
    const correctLabel = formatTime(question.hour, question.minute);
    if (label === correctLabel) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      chime();
      setFeedback({ kind: 'good', text: `🎯 Yes! The time is ${correctLabel}` });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) localStorage.setItem('timeto5_best_streak', String(newStreak));
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1100);
    } else {
      click();
      setStreak(0);
      setAttempts(a => a + 1);
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? `Not quite — check the minute hand again!`
          : `The correct time is ${correctLabel}.`,
      });
    }
  }, [locked, question, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try {
        if (score > bestScore) localStorage.setItem('timeto5_best_score', String(score));
      } catch {}
      if (score >= 60) arpeggio();
    }
  }, [screen, score, bestScore]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>⏰</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Time to 5</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 440, margin: '0 auto 24px' }}>
          Look at the analog clock and pick the matching <strong>digital time</strong>. Clocks show time to the nearest <strong>5 minutes</strong> — like a school clock!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · on the hour or half past</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⏱️ Medium · any 5-minute mark</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Hard · watch the hour hand drift</span>
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
          10 clocks per round. Remember: <strong style={{ color: 'var(--accent-pink)' }}>pink</strong> = hour hand, <strong style={{ color: 'var(--accent-blue)' }}>blue</strong> = minute hand.
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
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆⏰' : stars >= 1 ? '🎉⏰' : '💪⏰'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
            Time to head home!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
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
            <button className="btn btn-purple" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="time-to-five"
            activityName="Time to 5"
            activityEmoji="⏰"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── GAME ──────────────────────────────────────────────
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>⏰ Time to 5</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Prompt */}
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-medium)', marginBottom: 12 }}>
        What time does the clock show?
      </p>

      {/* Clock */}
      <div
        style={{
          background: 'white',
          padding: 16,
          borderRadius: 24,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-blue)',
          display: 'inline-block',
          marginBottom: 18,
        }}
      >
        <ClockFace hour={question.hour} minute={question.minute} />
      </div>

      {/* Choices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        maxWidth: 540,
        margin: '0 auto',
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
              padding: '18px 12px',
              background: 'white',
              color: 'var(--text-dark)',
              border: '3px solid #E5E0D8',
              boxShadow: '0 4px 0 #C5B5A2',
              fontFamily: 'Fredoka, sans-serif',
              cursor: locked ? 'default' : 'pointer',
              opacity: locked ? 0.7 : 1,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Hint: <strong style={{ color: 'var(--accent-pink)' }}>pink</strong> hand = hour (counts 1..12),
          {' '}<strong style={{ color: 'var(--accent-blue)' }}>blue</strong> hand = minutes (each number = 5 min).
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
            background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            maxWidth: 540,
            margin: '14px auto 0',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: each big tick mark on the clock = <strong>5 minutes</strong>.
      </p>

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            ⭐ Rate Time to 5
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="time-to-five"
          activityName="Time to 5"
          activityEmoji="⏰"
          kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
