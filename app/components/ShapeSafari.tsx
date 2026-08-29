'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Shape Safari — safari animals spot shapes in their habitat. Players identify
// polygons by sides and vertices, or pick the right shape from a name.
// CCSS 2.G.A.1: Recognize and draw shapes having specified attributes, such as
// a given number of angles or a given number of equal faces. Identify triangles,
// quadrilaterals, pentagons, hexagons, and cubes.
// 2nd grade scope: 2-D polygons from triangles through octagons, plus real-world
// shape recognition.

type Difficulty = 0 | 1 | 2;

type ShapeName = 'triangle' | 'square' | 'rectangle' | 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' | 'circle';

interface Question {
  kind: 'name' | 'sides' | 'vertices';
  shape: ShapeName;
  correct: string;
  choices: string[];
}

const SHAPE_INFO: Record<ShapeName, { sides: number; vertices: number; color: string; emoji: string }> = {
  triangle:  { sides: 3, vertices: 3, color: '#6BCB77', emoji: '🔺' },
  square:    { sides: 4, vertices: 4, color: '#FF9F43', emoji: '🟧' },
  rectangle: { sides: 4, vertices: 4, color: '#6BCBFF', emoji: '🟦' },
  pentagon:  { sides: 5, vertices: 5, color: '#C084FC', emoji: '🟣' },
  hexagon:   { sides: 6, vertices: 6, color: '#FFD93D', emoji: '🟡' },
  heptagon:  { sides: 7, vertices: 7, color: '#FF6B9D', emoji: '🟥' },
  octagon:   { sides: 8, vertices: 8, color: '#3D8B47', emoji: '🛑' },
  circle:    { sides: 0, vertices: 0, color: '#FF9F43', emoji: '⭕' },
};

const TIER_POOLS: Record<Difficulty, ShapeName[]> = {
  0: ['triangle', 'square', 'rectangle', 'circle'],
  1: ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'circle'],
  2: ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'circle'],
};

const ALL_SHAPES: ShapeName[] = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'circle'];

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

// ─── Shape SVG renderer ──────────────────────────────────────────────────────
// Returns inline SVG path for the given shape. Slightly irregular (not
// perfectly regular polygons) so kids must count rather than guess by symmetry.
function ShapeSvg({ shape, size = 140 }: { shape: ShapeName; size?: number }) {
  const info = SHAPE_INFO[shape];
  const cx = size / 2, cy = size / 2;
  const fill = info.color;
  const stroke = '#2D1B00';
  const strokeW = 3;
  // Use a slight jitter so shapes look hand-drawn rather than mathematically perfect.
  const jitter = () => 0.85 + Math.random() * 0.3;
  let path = '';
  switch (shape) {
    case 'circle': {
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="circle">
          <circle cx={cx} cy={cy} r={size * 0.4} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        </svg>
      );
    }
    case 'triangle': {
      const p1 = [cx, cy - size * 0.4 * jitter()];
      const p2 = [cx - size * 0.4 * jitter(), cy + size * 0.3 * jitter()];
      const p3 = [cx + size * 0.4 * jitter(), cy + size * 0.3 * jitter()];
      path = `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} L${p3[0]} ${p3[1]} Z`;
      break;
    }
    case 'square': {
      const s = size * 0.4 * jitter();
      const x0 = cx - s, y0 = cy - s;
      path = `M${x0} ${y0} L${x0 + s * 2} ${y0} L${x0 + s * 2} ${y0 + s * 2} L${x0} ${y0 + s * 2} Z`;
      break;
    }
    case 'rectangle': {
      // Wider than tall (or vice versa) to distinguish from square
      const wide = Math.random() < 0.5;
      const w = size * (wide ? 0.45 : 0.32) * jitter();
      const h = size * (wide ? 0.32 : 0.45) * jitter();
      const x0 = cx - w, y0 = cy - h;
      path = `M${x0} ${y0} L${x0 + w * 2} ${y0} L${x0 + w * 2} ${y0 + h * 2} L${x0} ${y0 + h * 2} Z`;
      break;
    }
    case 'pentagon': {
      const r = size * 0.4 * jitter();
      const pts: string[] = [];
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      path = `M${pts.join(' L')} Z`;
      break;
    }
    case 'hexagon': {
      const r = size * 0.4 * jitter();
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 2 * Math.PI) / 6;
        pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      path = `M${pts.join(' L')} Z`;
      break;
    }
    case 'heptagon': {
      const r = size * 0.38 * jitter();
      const pts: string[] = [];
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
        pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      path = `M${pts.join(' L')} Z`;
      break;
    }
    case 'octagon': {
      const r = size * 0.4 * jitter();
      const pts: string[] = [];
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 8;
        pts.push(`${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`);
      }
      path = `M${pts.join(' L')} Z`;
      break;
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={shape}>
      <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
    </svg>
  );
}

// Build the four choice strings + the correct one.
function makeQuestion(difficulty: Difficulty): Question {
  const pool = TIER_POOLS[difficulty].slice();
  const shape = pick(pool);
  const info = SHAPE_INFO[shape];

  // Pick a question kind; weights vary by tier.
  const kindRoll = Math.random();
  let kind: 'name' | 'sides' | 'vertices';
  if (difficulty === 0) {
    kind = kindRoll < 0.7 ? 'name' : 'sides';
  } else if (difficulty === 1) {
    kind = kindRoll < 0.5 ? 'name' : kindRoll < 0.85 ? 'sides' : 'vertices';
  } else {
    kind = kindRoll < 0.4 ? 'name' : kindRoll < 0.7 ? 'sides' : 'vertices';
  }

  // Circle edge cases for sides/vertices — they don't have straight sides/vertices.
  if (shape === 'circle' && (kind === 'sides' || kind === 'vertices')) {
    // Promote circle to 'name' mode.
    return makeNameQuestion('circle');
  }

  if (kind === 'name') return makeNameQuestion(shape);
  if (kind === 'sides') return makeCountQuestion(shape, 'sides');
  return makeCountQuestion(shape, 'vertices');
}

function makeNameQuestion(shape: ShapeName): Question {
  const correct = shape;
  const distractorPool = ALL_SHAPES.filter(s => s !== shape);
  const distractors = shuffle(distractorPool).slice(0, 3);
  const choices = shuffle([correct, ...distractors]);
  return { kind: 'name', shape, correct, choices };
}

function makeCountQuestion(shape: ShapeName, what: 'sides' | 'vertices'): Question {
  const info = SHAPE_INFO[shape];
  const correct = String(info[what]);
  const correctNum = info[what];
  const distractors: string[] = [];
  const candidates = [
    correctNum + 1, correctNum - 1,
    correctNum + 2, correctNum - 2,
    correctNum + 3,
  ].filter(n => n >= 0 && n !== correctNum && n <= 12);
  while (distractors.length < 3 && candidates.length) {
    const idx = randInt(0, candidates.length - 1);
    distractors.push(String(candidates[idx]));
    candidates.splice(idx, 1);
  }
  while (distractors.length < 3) distractors.push(String(randInt(0, 12)));
  const choices = shuffle([correct, ...distractors]);
  return { kind: what, shape, correct, choices };
}

const TOTAL_ROUNDS = 10;

export default function ShapeSafari({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('shapesafari_best_streak');
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
      const info = SHAPE_INFO[question.shape];
      const expl =
        question.kind === 'name'
          ? `✅ Yes — that's a ${question.shape}!`
          : question.kind === 'sides'
          ? `✅ A ${question.shape} has ${info.sides} sides!`
          : `✅ A ${question.shape} has ${info.vertices} vertices (corners)!`;
      setFeedback({ kind: 'good', text: expl });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('shapesafari_best_streak', String(newStreak));
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
      const info = SHAPE_INFO[question.shape];
      const expl =
        question.kind === 'name'
          ? `Not quite. Try counting the sides — count them out loud!`
          : `Not quite. A ${question.shape} has ${info[question.kind]} ${question.kind}.`;
      setFeedback({ kind: 'bad', text: expl });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🦒</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Shape Safari</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          The safari animals are spotting shapes in the savanna! Help them
          identify each shape by its sides and corners (vertices).
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a habitat:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · triangles, squares, rectangles, circles</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · + pentagons and hexagons</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · + heptagons, octagons, and real-world shapes</span>
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
          10 rounds per heat. Spot them all to be a master ranger!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🦒' : stars >= 2 ? '�🦒' : stars >= 1 ? '👍🦒' : '💪🦒';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
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
            activity="shape-safari"
            activityName="Shape Safari"
            activityEmoji="🦒"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const info = SHAPE_INFO[question.shape];
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 119, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🦒 Shape Safari</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-green)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Question card */}
      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-green)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          {question.kind === 'name' && 'What shape is this?'}
          {question.kind === 'sides' && <>How many <strong>sides</strong> does a <strong style={{ color: info.color }}>{question.shape}</strong> have?</>}
          {question.kind === 'vertices' && <>How many <strong>vertices</strong> (corners) does a <strong style={{ color: info.color }}>{question.shape}</strong> have?</>}
        </p>
        <div style={{ marginTop: 12, display: 'inline-block' }}>
          <ShapeSvg shape={question.shape} size={160} />
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
              background: locked && c === question.correct
                ? 'var(--accent-green)'
                : locked
                ? '#E5E0D8'
                : 'white',
              color: locked && c === question.correct ? 'white' : 'var(--text-dark)',
              border: locked && c === question.correct ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: question.kind === 'name' ? 19 : 24,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              textTransform: question.kind === 'name' ? 'capitalize' : 'none',
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
        Tip: <strong>sides</strong> are the straight edges. <strong>Vertices</strong> are the corners where sides meet.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="shape-safari"
          activityName="Shape Safari"
          activityEmoji="🦒"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
