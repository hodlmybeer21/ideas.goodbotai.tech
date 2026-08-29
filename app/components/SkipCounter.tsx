'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Skip Counter — count by 5s, 10s, or 25s along a number line.
// CCSS 2.NBT.A.2: "Count within 1000; skip-count by 5s, 10s, and 100s."
// We extend that to 25s in the hard tier. Visual: 5 boxes in a row with one
// hidden ("?"); kid fills in the missing number from 4 choices.

type Difficulty = 0 | 1 | 2;

interface Problem {
  start: number;
  step: number;        // 5, 10, or 25
  // Sequence is 5 numbers: [start, start+step, start+2*step, start+3*step, start+4*step]
  // One of those 5 is hidden; the kid must fill it.
  sequence: (number | null)[];  // length 5, exactly one null
  answer: number;
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeProblem(difficulty: Difficulty): Problem {
  let step: number, start: number, max: number;
  if (difficulty === 0) {
    step = 10;
    start = randInt(0, 5) * 10;        // 0,10,20,30,40,50
    max = 200;
  } else if (difficulty === 1) {
    step = 5;
    start = randInt(0, 20);            // 0..20
    max = 200;
  } else {
    // Hard: step 25, sometimes step 5 starting from non-zero
    if (Math.random() < 0.6) {
      step = 25;
      start = randInt(0, 7) * 25;      // 0,25,...,175
      max = 500;
    } else {
      step = 5;
      start = randInt(0, 12) * 5 + randInt(0, 4); // some multiples of 5 + a small offset
      max = 200;
    }
  }

  const sequence: (number | null)[] = Array.from({ length: 5 }, (_, i) => start + i * step);
  // keep within max
  const lastVal = sequence[sequence.length - 1] ?? 0;
  if (lastVal > max) {
    return makeProblem(difficulty); // try again
  }
  const hiddenIndex = randInt(0, 4);
  const answer = sequence[hiddenIndex] as number;
  sequence[hiddenIndex] = null;
  return { start, step, sequence, answer };
}

function makeChoices(correct: number, step: number): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 30) {
    const candidates = [
      correct + step,            // off-by-one (one extra hop)
      correct - step,            // off-by-one (one short)
      correct + 1, correct - 1,
      correct + step * 2,
    ];
    for (const v of candidates) {
      if (v >= 0 && v !== correct) set.add(v);
      if (set.size >= 4) break;
    }
  }
  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) arr.push(correct + step * (arr.length + 1));
  return arr.sort(() => Math.random() - 0.5);
}

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function hop() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function thud() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
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
    id: i, left: `${Math.random() * 100}%`,
    color: colors[i % colors.length], delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color, animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function SkipCounter({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(makeProblem(1).answer, makeProblem(1).step));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('skipcount_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('skipcount_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer, p.step));
    setScore(0); setStreak(0); setRound(0); setAttempts(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer, p.step));
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
      hop();
      setFeedback({
        kind: 'good',
        text: `🎯 Right! Skip-counting by ${problem.step}, the missing number was ${problem.answer}.`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try { if (newStreak > bestStreak) localStorage.setItem('skipcount_best_streak', String(newStreak)); } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      thud();
      setStreak(0);
      setAttempts(a => a + 1);
      setFeedback({
        kind: 'bad',
        text: attempts === 0 ? `Not quite — try again!`
             : `The answer is ${problem.answer}. Each jump = +${problem.step}.`,
      });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('skipcount_best_score', String(score)); } catch {}
      if (score >= 60) fanfare();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏃</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Skip Counter</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Skip-count by jumping forward by <strong>5s</strong>, <strong>10s</strong>, or <strong>25s</strong>. One number on the track is missing — fill it in to keep going!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔟 Easy · count by 10s (0, 10, 20…)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✋ Medium · count by 5s from anywhere</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💰 Hard · count by 25s (quarters!)</span>
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
          10 rounds per heat. Skip-counting is how you learn your multiplication tables!
        </p>
      </div>
    );
  }

  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🏃' : stars >= 1 ? '🎉🏃' : '💪🏃'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>Track complete!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>

          {!rated && score >= 50 && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Run Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="skip-counter" activityName="Skip Counter" activityEmoji="🏃" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🏃 Skip Counter</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
        Skip-count by <span style={{ color: 'var(--accent-pink)' }}>{problem.step}s</span> — what's the missing number?
      </p>

      {/* Track */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8, maxWidth: 640, margin: '0 auto 18px',
      }}>
        {problem.sequence.map((n, i) => (
          <div key={i} style={{
            background: n === null
              ? 'linear-gradient(180deg, #FEF3C7, #FFD93D)'
              : 'linear-gradient(180deg, #FFFFFF, #FEF3C7)',
            border: n === null ? '3px dashed var(--accent-orange)' : '3px solid var(--accent-yellow)',
            borderRadius: 16,
            padding: '20px 8px',
            fontSize: 28, fontWeight: 700,
            color: n === null ? 'var(--accent-orange)' : 'var(--text-dark)',
            fontFamily: 'Fredoka, sans-serif',
            textAlign: 'center',
            boxShadow: '0 4px 0 rgba(0,0,0,0.05)',
            animation: n === null ? 'pop 0.4s ease' : 'none',
          }}>
            {n === null ? '?' : n}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-medium)', marginBottom: 14 }}>
        Start: <strong>{problem.start}</strong> · Each jump = +{problem.step}
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 12, maxWidth: 540, margin: '0 auto',
      }}>
        {choices.map((c, i) => (
          <button key={`${c}-${i}`} onClick={() => choose(c)} disabled={locked} className="btn"
            style={{
              fontSize: 26, fontWeight: 700, padding: '18px 10px',
              background: 'white', color: 'var(--text-dark)',
              border: '3px solid #E5E0D8', boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.6 : 1,
            }}>{c}</button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip: find the closest known number and count up by {problem.step}s until you reach the gap.
        </p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-blue)' : '#FEF3C7',
          color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 540, margin: '14px auto 0',
        }}>{feedback.text}</div>
      )}

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button onClick={() => setShowRating(true)} style={{
            background: 'none', border: 'none', color: 'var(--accent-blue)',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
          }}>⭐ Rate Skip Counter</button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="skip-counter" activityName="Skip Counter" activityEmoji="🏃" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
