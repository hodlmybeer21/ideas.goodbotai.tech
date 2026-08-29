'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Array Architect — design buildings from rows × columns of bricks.
//   🌱 Easy   (given rows × cols, find the total)
//   🌿 Medium (given a total, find a factor pair)
//   🌳 Hard   (partition a rectangle into same-size squares)
// CCSS 2.OA.C.4: Use addition to find the total number of objects arranged in
// rectangular arrays with up to 5 rows and up to 5 columns; write an equation
// to express the total as a sum of equal addends.
// CCSS 2.G.A.2: Partition a rectangle into rows and columns of same-size
// squares and count the total.

type Difficulty = 0 | 1 | 2;
type Mode = 'total' | 'factor' | 'partition';

interface Problem {
  mode: Mode;
  rows: number;
  cols: number;
  total: number;
  // For tier 2 (partition): size of the square tiles (e.g., 2x2 squares within a 4x6)
  tileSize: number;
  // Pre-computed display
  prompt: string;
  correct: string;
  choices: string[];
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

// Generate factor pairs for a number (small, ordered uniquely).
function factorPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0 && i <= 5 && n / i <= 5) {
      pairs.push([i, n / i]);
    }
  }
  return pairs;
}

function makeProblem(difficulty: Difficulty): Problem {
  if (difficulty === 0) {
    // Easy: given rows × cols, find total. Max 5×5 per CCSS.
    const rows = randInt(2, 5);
    const cols = randInt(2, 5);
    const total = rows * cols;
    const correct = String(total);
    const choices = shuffle([
      correct,
      String(total + rows),                  // off-by-rows error
      String(total + cols),                  // off-by-cols error
      String(total + 1),                     // off-by-one
      String(Math.max(0, total - 1)),        // off-by-one down
    ]).slice(0, 4);
    return {
      mode: 'total', rows, cols, total,
      tileSize: 1,
      prompt: `${rows} rows × ${cols} bricks = how many bricks?`,
      correct, choices,
    };
  }

  if (difficulty === 1) {
    // Medium: given total, find a factor pair (rows × cols).
    // Pick a total that has multiple factor pairs ≤ 5×5
    const candidates = [12, 16, 18, 20, 24];
    const total = pick(candidates);
    const pairs = factorPairs(total);
    if (pairs.length === 0) {
      return makeProblem(1); // try again
    }
    const [r, c] = pick(pairs);
    const correct = `${r} × ${c}`;
    // Build distractors: a wrong factor pair (within bounds), single number, sum
    const wrongPair = pairs.find(([a, b]) => !(a === r && b === c)) ?? [1, total];
    const choices = shuffle([
      correct,
      `${wrongPair[0]} × ${wrongPair[1]}`,
      String(total),
      `${total} + ${total}`,
      `${r + 1} × ${c}`,
    ]).slice(0, 4);
    return {
      mode: 'factor', rows: r, cols: c, total,
      tileSize: 1,
      prompt: `${total} bricks = ? × ? (in a rectangle)`,
      correct, choices,
    };
  }

  // Hard: partition rectangle into same-size squares.
  // Examples: 4×6 = 6 squares of 2×2. 4×6 = 4 squares of 2×3. 6×6 = 4 squares of 3×3.
  const recipe = pick([
    { w: 4, h: 6, ts: 2 },
    { w: 6, h: 4, ts: 2 },
    { w: 4, h: 6, ts: 3 },
    { w: 6, h: 4, ts: 3 },
    { w: 6, h: 6, ts: 3 },
    { w: 6, h: 4, ts: 2 },
    { w: 4, h: 4, ts: 2 },
    { w: 6, h: 6, ts: 2 },
  ]);
  const { w, h, ts } = recipe;
  const squaresAcross = w / ts;
  const squaresDown = h / ts;
  const numSquares = squaresAcross * squaresDown;
  const correct = `${numSquares}`;
  const choices = shuffle([
    correct,
    String(numSquares * 2),
    String(numSquares + 1),
    String(Math.max(1, numSquares - 1)),
    String(Math.floor(numSquares / 2)),
  ]).slice(0, 4);
  return {
    mode: 'partition', rows: w, cols: h, total: w * h,
    tileSize: ts,
    prompt: `Partition a ${w}×${h} rectangle into squares of size ${ts}×${ts}. How many squares?`,
    correct, choices,
  };
}

const TOTAL_ROUNDS = 10;

export default function ArrayArchitect({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
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
      const s = localStorage.getItem('arrayarchitect_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setProblem(makeProblem(d));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setProblem(makeProblem(d));
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
    const isCorrect = choice === problem.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      let expl: string;
      if (problem.mode === 'total') {
        expl = `✅ ${problem.rows} × ${problem.cols} = ${problem.total} bricks!`;
      } else if (problem.mode === 'factor') {
        expl = `✅ ${problem.total} = ${problem.correct} (a ${problem.rows}×${problem.cols} rectangle)`;
      } else {
        expl = `✅ A ${problem.rows}×${problem.cols} rectangle partitioned into ${problem.tileSize}×${problem.tileSize} squares = ${problem.correct} squares!`;
      }
      setFeedback({ kind: 'good', text: expl });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('arrayarchitect_best_streak', String(newStreak));
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
      let hint: string;
      if (problem.mode === 'total') {
        hint = `Count carefully: ${problem.rows} rows with ${problem.cols} bricks each.`;
      } else if (problem.mode === 'factor') {
        hint = `Find two numbers that multiply to ${problem.total}.`;
      } else {
        hint = `Divide the rectangle into rows and columns of ${problem.tileSize}×${problem.tileSize} squares.`;
      }
      setFeedback({ kind: 'bad', text: `Not quite. ${hint}` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🏗️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Array Architect</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Build rectangles out of bricks! Count rows × columns, find factor pairs,
          and partition rectangles into squares.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a project:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · rows × cols = total</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · find a factor pair</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · partition into same-size squares</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            � Best streak: <strong>{bestStreak}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 rounds per heat. Build them all to be a master architect!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🏗️' : stars >= 2 ? '🎉🏗️' : stars >= 1 ? '👍🏗️' : '💪🏗️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
          Build complete!
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
            activity="array-architect"
            activityName="Array Architect"
            activityEmoji="🏗️"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(255, 159, 67, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  // Render rectangle grid for tier 0 and tier 2.
  const rectWidth = Math.min(problem.rows * 28, 280);
  const rectHeight = Math.min(problem.cols * 28, 280);

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏗️ Array Architect</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-orange)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-orange)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
          <strong>{problem.prompt}</strong>
        </p>

        {/* Rectangle visualization */}
        <div
          style={{
            marginTop: 16,
            display: 'inline-block',
            padding: 12,
            background: '#FFF8E7',
            border: '2px solid #E5B85A',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${problem.cols}, 1fr)`,
              gridTemplateColumns: `repeat(${problem.rows}, 1fr)`,
              gap: 2,
              width: rectWidth,
              height: rectHeight,
              background: '#2D1B00',
              padding: 2,
              borderRadius: 6,
            }}
          >
            {Array.from({ length: problem.cols * problem.rows }).map((_, i) => {
              // For partition mode, color tile boundaries
              const isTileCenter = problem.mode === 'partition'
                ? (() => {
                    const row = Math.floor(i / problem.rows);
                    const col = i % problem.rows;
                    const inTileRow = row % problem.tileSize === Math.floor(problem.tileSize / 2);
                    const inTileCol = col % problem.tileSize === Math.floor(problem.tileSize / 2);
                    return inTileRow && inTileCol;
                  })()
                : false;
              return (
                <div
                  key={i}
                  style={{
                    background: isTileCenter
                      ? 'rgba(255, 215, 0, 0.85)'
                      : '#FF9F43',
                    borderRadius: 2,
                    fontSize: 9,
                    color: '#2D1B00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {problem.mode === 'total' && i + 1}
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-medium)' }}>
          {problem.rows} rows × {problem.cols} bricks{problem.mode === 'partition' ? ` · ${problem.tileSize}×${problem.tileSize} tiles` : ''}
        </p>
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {problem.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(c)}
            disabled={locked}
            className="btn"
            style={{
              background: locked && c === problem.correct ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === problem.correct ? 'white' : 'var(--text-dark)',
              border: locked && c === problem.correct ? '3px solid #3D8B47' : '2px solid #E5E0D8',
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
        Tip: multiplication is repeated addition — {problem.rows} × {problem.cols} = {problem.rows} added to itself {problem.cols} times!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="array-architect"
          activityName="Array Architect"
          activityEmoji="🏗️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
