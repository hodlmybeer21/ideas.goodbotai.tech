'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Equal Groups — intro multiplication via cookie-tray arrays.
// CCSS 2.OA.4: "Use addition to find the total number of objects arranged in
// rectangular arrays with up to 5 rows and up to 5 columns." We extend to 10×10
// in later tiers and introduce the inverse ("given total + one dimension, find
// the other") as the Hard tier.

type Difficulty = 0 | 1 | 2;

interface Problem {
  rows: number;
  cols: number;
  total: number;       // rows * cols
  unknown: 'total' | 'rows' | 'cols';
  // When unknown is 'rows' or 'cols', the kid computes the missing factor.
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function makeProblem(difficulty: Difficulty): Problem {
  let rows: number, cols: number, unknown: Problem['unknown'];
  if (difficulty === 0) {
    rows = randInt(2, 5);
    cols = randInt(2, 5);
    unknown = 'total';
  } else if (difficulty === 1) {
    rows = randInt(2, 10);
    cols = randInt(2, 10);
    unknown = 'total';
  } else {
    // Hard: alternate between "find total" and "find missing factor"
    const r = Math.random();
    if (r < 0.5) {
      rows = randInt(2, 6);
      cols = randInt(2, 6);
      unknown = 'total';
    } else if (r < 0.75) {
      rows = randInt(2, 6);
      cols = randInt(3, 10);
      unknown = 'rows';
    } else {
      rows = randInt(3, 10);
      cols = randInt(2, 6);
      unknown = 'cols';
    }
  }
  return { rows, cols, total: rows * cols, unknown };
}

function makeChoices(correct: number): number[] {
  const set = new Set<number>([correct]);
  let guard = 0;
  while (set.size < 4 && guard++ < 30) {
    const candidates = [
      correct + 1, correct - 1,
      correct + rowsVari(correct),
      correct + 5,
      Math.max(1, correct + randInt(-4, 4)),
    ];
    for (const v of candidates) {
      if (v >= 1 && v !== correct && v !== 0) set.add(v);
      if (set.size >= 4) break;
    }
  }
  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) arr.push(correct + 3 + arr.length * 5);
  return arr.sort(() => Math.random() - 0.5);
}
function rowsVari(c: number) { return Math.floor(c / 2); }

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
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.24);
    o.start(c.currentTime); o.stop(c.currentTime + 0.26);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
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

export default function EqualGroups({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(makeProblem(1).total));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad' | 'reveal'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('equalgroups_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('equalgroups_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(answerFor(p)));
    setScore(0); setStreak(0); setRound(0); setAttempts(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(answerFor(p)));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((n: number) => {
    if (locked) return;
    const correct = answerFor(problem);
    if (n === correct) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      ding();
      const arrangement = `${problem.rows} × ${problem.cols}`;
      setFeedback({
        kind: 'reveal',
        text: problem.unknown === 'total'
          ? `🎉 ${arrangement} = ${correct} cookies!`
          : `🎉 ${problem.rows} × ${problem.cols} = ${problem.total}. So ${problem.unknown} = ${correct}!`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) localStorage.setItem('equalgroups_best_streak', String(newStreak));
        } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      setFeedback({
        kind: 'bad',
        text: attempts === 0 ? 'Count the cookies again — try once more!'
            : `The answer is ${correct}. Skip-count by ${problem.unknown === 'rows' ? problem.cols : problem.rows} to find it!`,
      });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try {
        if (score > bestScore) localStorage.setItem('equalgroups_best_score', String(score));
      } catch {}
      if (score >= 60) fanfare();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🍪</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Equal Groups</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Count cookies in <strong>rows × columns</strong>. <em>Rows</em> go up and down, <em>columns</em> go side to side. Practice counting arrays and finding the missing factor!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🍪 Easy · 2×2 to 5×5 arrays</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧁 Medium · up to 10×10 arrays</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Hard · find missing factors</span>
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
          10 trays per heat. Arrays are a fast way to learn multiplication!
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
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🍪' : stars >= 1 ? '🎉🍪' : '💪🍪'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>Tray complete!</h1>
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
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Bake Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="equal-groups" activityName="Equal Groups" activityEmoji="🍪" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  // GAME
  const correctAnswer = answerFor(problem);
  const isBig = problem.total > 36;
  const cookieSize = isBig ? 22 : 32;
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🍪 Equal Groups</h1>

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
      <div style={{
        background: 'white', border: '3px solid var(--accent-pink)',
        borderRadius: 14, padding: '14px 18px', marginBottom: 18,
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
          {problem.unknown === 'total' && (
            <>How many cookies are <span style={{ color: 'var(--accent-pink)' }}>{problem.rows}</span> rows × <span style={{ color: 'var(--accent-blue)' }}>{problem.cols}</span> columns?</>
          )}
          {problem.unknown === 'rows' && (
            <>If a tray has <span style={{ color: 'var(--accent-blue)' }}>{problem.cols}</span> columns and <strong>{problem.total}</strong> cookies, how many <strong>rows</strong> are there?</>
          )}
          {problem.unknown === 'cols' && (
            <>If a tray has <span style={{ color: 'var(--accent-pink)' }}>{problem.rows}</span> rows and <strong>{problem.total}</strong> cookies, how many <strong>columns</strong> are there?</>
          )}
        </p>
      </div>

      {/* Cookie tray */}
      <div style={{
        background: 'linear-gradient(180deg, #FEF3C7 0%, #FFD93D22 100%)',
        border: '3px solid var(--accent-yellow)',
        borderRadius: 18, padding: 16, marginBottom: 18,
        display: 'inline-block',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${problem.cols}, ${cookieSize}px)`,
          gridTemplateRows: `repeat(${problem.rows}, ${cookieSize}px)`,
          gap: 4,
        }}>
          {Array.from({ length: problem.rows * problem.cols }).map((_, i) => (
            <div key={i} style={{
              fontSize: cookieSize - 6,
              lineHeight: `${cookieSize}px`,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 6,
              animation: locked && i < problem.total ? 'pop 0.3s ease' : 'none',
            }}>🍪</div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-medium)', marginTop: 8 }}>
          {problem.rows} {problem.rows === 1 ? 'row' : 'rows'} × {problem.cols} {problem.cols === 1 ? 'column' : 'columns'}
        </p>
      </div>

      {/* Choices */}
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
          💡 Tip: <strong>{problem.rows} × {problem.cols}</strong> means add {problem.cols} cookies to yourself {problem.rows} times, or use the array trick — count each row then add rows.
        </p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'reveal' ? 'var(--accent-pink)'
                    : feedback.kind === 'bad' ? '#FEF3C7' : 'var(--accent-green)',
          color: feedback.kind === 'bad' ? 'var(--text-dark)' : 'white',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 540, margin: '14px auto 0',
        }}>{feedback.text}</div>
      )}

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button onClick={() => setShowRating(true)} style={{
            background: 'none', border: 'none', color: 'var(--accent-pink)',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
          }}>⭐ Rate Equal Groups</button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="equal-groups" activityName="Equal Groups" activityEmoji="🍪" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}

function answerFor(p: Problem): number {
  if (p.unknown === 'total') return p.total;
  if (p.unknown === 'rows') return p.rows;
  return p.cols;
}
