'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Symmetry Safari — identify lines of symmetry on shapes. Safari theme —
// each animal has a symmetric pattern to spot.
//   🌱 Easy   (count lines of symmetry on common shapes)
//   🌿 Medium (pick which shape has a vertical/horizontal line of symmetry)
//   🌳 Hard   (complete the symmetric pattern; multi-axis symmetry)
// CCSS 2.G.A.1: Recognize and draw shapes having specified attributes,
// such as a given number of angles or a given number of equal faces.
// Identify triangles, quadrilaterals, pentagons, hexagons, and cubes.
// 2nd grade extension: identify lines of symmetry in shapes.

type Difficulty = 0 | 1 | 2;

interface Question {
  shape: ShapeName;
  prompt: string;
  correct: string;
  choices: string[];
}

type ShapeName = 'square' | 'rectangle' | 'circle' | 'triangle' | 'rhombus' | 'hexagon' | 'trapezoid' | 'equilateral';

interface ShapeInfo {
  sides: number;
  symmetry: number;     // number of lines of symmetry
  emoji: string;
  hasVertical: boolean;
  hasHorizontal: boolean;
  hasDiagonal: boolean;
}

const SHAPES: Record<ShapeName, ShapeInfo> = {
  square:     { sides: 4, symmetry: 4, emoji: '🟧', hasVertical: true, hasHorizontal: true, hasDiagonal: true },
  rectangle:  { sides: 4, symmetry: 2, emoji: '🟦', hasVertical: true, hasHorizontal: true, hasDiagonal: false },
  rhombus:    { sides: 4, symmetry: 2, emoji: '◆',  hasVertical: true, hasHorizontal: false, hasDiagonal: true },
  circle:     { sides: 0, symmetry: 99, emoji: '⭕', hasVertical: true, hasHorizontal: true, hasDiagonal: true },
  equilateral: { sides: 3, symmetry: 3, emoji: '🔺', hasVertical: true, hasHorizontal: false, hasDiagonal: true },
  hexagon:    { sides: 6, symmetry: 6, emoji: '⬢',  hasVertical: true, hasHorizontal: true, hasDiagonal: true },
  trapezoid:  { sides: 4, symmetry: 0, emoji: '🟫', hasVertical: false, hasHorizontal: false, hasDiagonal: false },
  triangle:   { sides: 3, symmetry: 0, emoji: '🔻', hasVertical: false, hasHorizontal: false, hasDiagonal: false },
};

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1) + lo);
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Render a shape with one or more dashed symmetry lines on top
function ShapeWithLines({ shape, lines }: { shape: ShapeName; lines: 'vertical' | 'horizontal' | 'both' | 'none' | 'diagonal' }) {
  const cx = 100, cy = 100, size = 80;
  let shapeEl: React.ReactNode = null;
  switch (shape) {
    case 'square':
      shapeEl = <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    case 'rectangle':
      shapeEl = <rect x={cx - size * 1.2} y={cy - size * 0.7} width={size * 2.4} height={size * 1.4} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    case 'rhombus':
      shapeEl = <polygon points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    case 'circle':
      shapeEl = <circle cx={cx} cy={cy} r={size} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    case 'equilateral':
    case 'triangle': {
      const p1 = [cx, cy - size];
      const p2 = [cx - size * 0.9, cy + size * 0.6];
      const p3 = [cx + size * 0.9, cy + size * 0.6];
      shapeEl = <polygon points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    }
    case 'hexagon': {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pts.push(`${cx + size * 0.9 * Math.cos(a)},${cy + size * 0.9 * Math.sin(a)}`);
      }
      shapeEl = <polygon points={pts.join(' ')} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
    }
    case 'trapezoid':
      shapeEl = <polygon points={`${cx - size},${cy + size * 0.7} ${cx + size},${cy + size * 0.7} ${cx + size * 0.5},${cy - size * 0.7} ${cx - size * 0.5},${cy - size * 0.7}`} fill="none" stroke="#2D1B00" strokeWidth={3} />;
      break;
  }

  let linesEl: React.ReactNode = null;
  const lineStyle = { stroke: 'var(--accent-pink)', strokeWidth: 2, strokeDasharray: '6 4' };
  if (lines === 'vertical' || lines === 'both') {
    linesEl = <line x1={cx} y1={cy - size * 1.2} x2={cx} y2={cy + size * 1.2} {...lineStyle} />;
  }
  if (lines === 'horizontal' || lines === 'both') {
    linesEl = (
      <>
        {linesEl}
        <line x1={cx - size * 1.5} y1={cy} x2={cx + size * 1.5} y2={cy} {...lineStyle} />
      </>
    );
  }
  if (lines === 'diagonal') {
    linesEl = (
      <>
        <line x1={cx - size * 1.2} y1={cy - size * 1.2} x2={cx + size * 1.2} y2={cy + size * 1.2} {...lineStyle} />
        <line x1={cx - size * 1.2} y1={cy + size * 1.2} x2={cx + size * 1.2} y2={cy - size * 1.2} {...lineStyle} />
      </>
    );
  }

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" style={{ background: '#FFF8E7', borderRadius: 14, border: '2px solid #E5B85A' }}>
      {shapeEl}
      {linesEl}
    </svg>
  );
}

function makeQuestion(difficulty: Difficulty): Question {
  if (difficulty === 0) {
    // Easy: how many lines of symmetry does this shape have?
    const pool: ShapeName[] = ['square', 'rectangle', 'circle', 'equilateral', 'triangle'];
    const shape = pick(pool);
    const correct = shape === 'circle' ? 'many (∞)' : String(SHAPES[shape].symmetry);
    const choices = shuffle(['0', '1', '2', '4', 'many (∞)']).slice(0, 4);
    return {
      shape,
      prompt: `How many lines of symmetry does this shape have?`,
      correct: shape === 'circle' ? 'many (∞)' : String(SHAPES[shape].symmetry),
      choices,
    };
  }
  if (difficulty === 1) {
    // Medium: does this shape have a vertical line of symmetry? (Yes/No)
    const pool: ShapeName[] = ['square', 'rectangle', 'rhombus', 'circle', 'triangle', 'trapezoid'];
    const shape = pick(pool);
    const hasVert = SHAPES[shape].hasVertical;
    return {
      shape,
      prompt: `Does this shape have a vertical line of symmetry (a line down the middle)?`,
      correct: hasVert ? 'Yes' : 'No',
      choices: ['Yes', 'No'],
    };
  }
  // Hard: which shape has MORE lines of symmetry?
  const shapePool: ShapeName[] = ['square', 'rectangle', 'circle', 'equilateral', 'hexagon', 'triangle', 'trapezoid'];
  const a = pick(shapePool);
  let b: ShapeName;
  do { b = pick(shapePool); } while (b === a);
  return {
    shape: a,
    prompt: `Which shape has MORE lines of symmetry?`,
    correct: SHAPES[a].symmetry >= SHAPES[b].symmetry ? a : b,
    choices: shuffle([a, b]).slice(0, 2),
  };
}

const TOTAL_ROUNDS = 10;

export default function SymmetrySafari({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
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
      const s = localStorage.getItem('symmetrysafari_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
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
    const isCorrect = choice === question.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      const info = SHAPES[question.shape as ShapeName];
      setFeedback({ kind: 'good', text: `✅ ${question.shape} has ${question.correct} lines of symmetry.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('symmetrysafari_best_streak', String(newStreak));
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
      const info = SHAPES[question.shape as ShapeName];
      setFeedback({ kind: 'bad', text: `Not quite. The answer was "${question.correct}".` });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, question, streak, score, current, bestStreak, difficulty, nextRound]);

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
        <div style={{ fontSize: 80, marginTop: 12 }}>🦋</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Symmetry Safari</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          A <strong>line of symmetry</strong> divides a shape into two
          mirror-image halves. Find symmetry in the savanna!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a habitat:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · count lines of symmetry</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · yes/no vertical symmetry</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · which has more symmetry</span>
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
          10 sightings per safari. Look for mirror halves!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🦋' : stars >= 2 ? '🎉🦋' : stars >= 1 ? '👍🦋' : '💪🦋';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
          Safari complete!
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
            activity="symmetry-safari"
            activityName="Symmetry Safari"
            activityEmoji="🦋"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(255, 107, 157, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🦋 Symmetry Safari</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-pink)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
          {question.prompt}
        </p>
        <div style={{ marginTop: 14, display: 'inline-block' }}>
          <ShapeWithLines shape={question.shape as ShapeName} lines={difficulty === 1 ? 'vertical' : 'none'} />
        </div>
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(c)}
            disabled={locked}
            className="btn"
            style={{
              background: locked && c === question.correct ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === question.correct ? 'white' : 'var(--text-dark)',
              border: locked && c === question.correct ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: 18,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              textTransform: 'capitalize',
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
        Tip: a <strong style={{ color: 'var(--accent-pink)' }}>vertical line</strong> goes up-down through the middle. A horizontal line goes left-right.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="symmetry-safari"
          activityName="Symmetry Safari"
          activityEmoji="🦋"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}