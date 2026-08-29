'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Hundreds Hide & Seek — count within 1000 and skip-count by 5s, 10s, and
// 100s. Animals hide at number positions; players count to find them.
//   🌱 Easy   (count by 1s within 100, sometimes backward)
//   🌿 Medium (skip-count by 5s and 10s within 100)
//   🌳 Hard   (skip-count by 100s up to 1000, mixed 5/10/100)
// CCSS 2.NBT.A.2: Count within 1000; skip-count by 5s, 10s, and 100s.

type Difficulty = 0 | 1 | 2;

interface Problem {
  sequence: number[];   // 3 numbers + null at the end
  answer: number;
  stepSize: number;     // 1, 5, 10, or 100
  direction: 'forward' | 'backward';
  hint: string;
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeProblem(difficulty: Difficulty): Problem {
  let stepSize = 1;
  let rangeLo = 0, rangeHi = 100;
  let direction: 'forward' | 'backward' = 'forward';
  let hint = '';

  if (difficulty === 0) {
    // Easy: count by 1s within 100, occasionally backward
    stepSize = 1;
    rangeLo = 5; rangeHi = 95;
    direction = Math.random() < 0.25 ? 'backward' : 'forward';
    hint = direction === 'backward' ? 'Counting down by 1.' : 'Counting up by 1.';
  } else if (difficulty === 1) {
    // Medium: skip-count by 5s or 10s within 100
    stepSize = Math.random() < 0.5 ? 5 : 10;
    rangeLo = stepSize; rangeHi = 100;
    direction = 'forward';
    hint = `Skip-counting by ${stepSize}s.`;
  } else {
    // Hard: skip-count by 100s up to 1000, sometimes 5/10
    const r = Math.random();
    if (r < 0.6) {
      stepSize = 100;
      rangeLo = 100; rangeHi = 900;
      hint = 'Skip-counting by 100s!';
    } else if (r < 0.85) {
      stepSize = 10;
      rangeLo = 10; rangeHi = 990;
      hint = 'Skip-counting by 10s (up to 1000).';
    } else {
      stepSize = 50;
      rangeLo = 50; rangeHi = 950;
      hint = 'Skip-counting by 50s!';
    }
    direction = 'forward';
  }

  // Pick a starting number that leaves room for 3 steps within range.
  const start = direction === 'forward'
    ? randInt(rangeLo, rangeHi - 3 * stepSize)
    : randInt(rangeLo + 3 * stepSize, rangeHi);

  const delta = direction === 'forward' ? stepSize : -stepSize;
  const seq = [start, start + delta, start + delta * 2];
  const answer = start + delta * 3;

  return { sequence: seq, answer, stepSize, direction, hint };
}

function makeChoices(correct: number, stepSize: number, count = 4): number[] {
  const set = new Set<number>([correct]);
  const candidates = [
    correct + stepSize, correct - stepSize,
    correct + 2 * stepSize, correct - 2 * stepSize,
    correct + 1, correct - 1,
    correct + (stepSize > 1 ? -stepSize - 1 : 0),
    correct + (stepSize > 1 ? stepSize + 1 : 0),
  ].filter(n => n >= 0 && n <= 1100 && n !== correct);
  while (set.size < count && candidates.length) {
    const i = randInt(0, candidates.length - 1);
    set.add(candidates[i]);
    candidates.splice(i, 1);
  }
  return shuffle([...set]).slice(0, count);
}

const TOTAL_ROUNDS = 10;

export default function HundredsHideSeek({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [choices, setChoices] = useState<number[]>(() => makeChoices(makeProblem(1).answer, makeProblem(1).stepSize));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [found, setFound] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('hundreds_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer, p.stepSize));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
    setFound(false);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const p = makeProblem(d);
    setProblem(p);
    setChoices(makeChoices(p.answer, p.stepSize));
    setScore(0);
    setStreak(0);
    setCurrent(0);
    setFeedback(null);
    setLocked(false);
    setFlash(null);
    setFound(false);
    setScreen('play');
  }, []);

  const answer = useCallback((choice: number) => {
    if (locked) return;
    const isCorrect = choice === problem.answer;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      setFound(true);
      setFeedback({ kind: 'good', text: `✅ Found you! The next number is ${problem.answer}.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('hundreds_best_streak', String(newStreak));
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
      setFeedback({
        kind: 'bad',
        text: `Not quite — count carefully! ${problem.hint}`,
      });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🔍</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Hundreds Hide &amp; Seek</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Animals are hiding at number positions on the number line! Count by 1s,
          5s, 10s, or 100s to find where each one is hiding.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a hiding spot:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · count by 1s within 100</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · skip-count by 5s and 10s</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · skip-count by 100s up to 1000</span>
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
          10 rounds per heat. Find them all to be a master spotter!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🔍' : stars >= 2 ? '🎉🔍' : stars >= 1 ? '👍🔍' : '💪🔍';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
          Round complete!
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

        {showRating && !rated && (
          <RatingModal
            activity="hundreds-hide-seek"
            activityName="Hundreds Hide & Seek"
            activityEmoji="🔍"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(192, 132, 252, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🔍 Hundreds Hide &amp; Seek</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-purple)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Sequence card */}
      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-purple)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          {problem.hint} What's next?
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
            flexWrap: 'wrap',
          }}
        >
          {problem.sequence.map((n, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 32,
                fontWeight: 700,
                background: 'var(--accent-purple)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: 12,
                minWidth: 70,
                textAlign: 'center',
                boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
              }}
            >
              {n}
            </div>
          ))}
          <div
            aria-label="missing number"
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 32,
              fontWeight: 700,
              background: found ? 'var(--accent-green)' : 'white',
              color: found ? 'white' : '#C5B5A2',
              border: found ? '3px solid #3D8B47' : '3px dashed #C5B5A2',
              padding: '12px 20px',
              borderRadius: 12,
              minWidth: 70,
              textAlign: 'center',
              animation: found ? 'pop 0.4s ease' : 'none',
            }}
          >
            {found ? problem.answer : '?'}
          </div>
        </div>

        {/* Number line visualization */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '0 4px',
          }}
        >
          <div
            style={{
              position: 'relative',
              height: 28,
              minWidth: 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 13,
                left: 0,
                right: 0,
                height: 3,
                background: '#C5B5A2',
                borderRadius: 2,
              }}
            />
            {[problem.sequence[0], problem.sequence[1], problem.sequence[2], problem.answer].map((n, i) => {
              // Map number onto a 0..600 px range using min/max of the four numbers
              const nums = [problem.sequence[0], problem.sequence[1], problem.sequence[2], problem.answer];
              const minN = Math.min(...nums);
              const maxN = Math.max(...nums);
              const range = Math.max(1, maxN - minN);
              const x = ((n - minN) / range) * 540 + 30;
              const isLast = i === 3;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x - 18,
                    top: 0,
                    width: 36,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: found && isLast ? 'white' : isLast ? '#C5B5A2' : '#2D1B00',
                    background: found && isLast ? 'var(--accent-green)' : 'transparent',
                    borderRadius: 4,
                  }}
                >
                  {found && isLast ? n : isLast ? '?' : n}
                </div>
              );
            })}
          </div>
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
              background: locked && c === problem.answer ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === problem.answer ? 'white' : 'var(--text-dark)',
              border: locked && c === problem.answer ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: 24,
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
        Tip: count out loud — "{problem.sequence[2]}... and the next one is ?"
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="hundreds-hide-seek"
          activityName="Hundreds Hide & Seek"
          activityEmoji="🔍"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
