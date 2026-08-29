'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Graph Garden — read and make bar/picture graphs. Garden theme — count
// fruits/flowers, then build or read graphs.
//   🌱 Easy   (count up to 10, picture graph with 1:1)
//   🌿 Medium (count up to 20, bar graph with 5-unit scale)
//   🌳 Hard   (multi-category, ask "how many more/less than")
// CCSS 2.MD.D.10: Draw a picture graph and a bar graph (with single-unit
// scale) to represent a data set with up to four categories. Solve simple
// put-together, take-apart, and compare problems using information presented
// in a bar graph.

type Difficulty = 0 | 1 | 2;

interface Category {
  name: string;
  emoji: string;
  count: number;
  color: string;
}

interface Question {
  kind: 'read-count' | 'read-most' | 'read-fewest' | 'compare' | 'build';
  prompt: string;
  correct: string;
  choices: string[];
  categories: Category[];
}

const FRUITS = [
  { name: 'apples',   emoji: '🍎', color: '#FF6B9D' },
  { name: 'oranges',  emoji: '🍊', color: '#FF9F43' },
  { name: 'grapes',   emoji: '🍇', color: '#C084FC' },
  { name: 'lemons',   emoji: '🍋', color: '#FFD93D' },
  { name: 'cherries', emoji: '🍒', color: '#FF6B9D' },
  { name: 'pears',    emoji: '🍐', color: '#6BCB77' },
  { name: 'peaches',  emoji: '🍑', color: '#FF9F43' },
  { name: 'strawberries', emoji: '🍓', color: '#FF6B9D' },
];

const VEGGIES = [
  { name: 'carrots',  emoji: '🥕', color: '#FF9F43' },
  { name: 'broccoli', emoji: '🥦', color: '#3D8B47' },
  { name: 'corn',     emoji: '🌽', color: '#FFD93D' },
  { name: 'tomatoes', emoji: '🍅', color: '#FF6B9D' },
  { name: 'eggplant', emoji: '🍆', color: '#C084FC' },
  { name: 'peppers',  emoji: '🫑', color: '#3D8B47' },
];

const FLOWERS = [
  { name: 'roses',     emoji: '🌹', color: '#FF6B9D' },
  { name: 'tulips',    emoji: '🌷', color: '#FF6B9D' },
  { name: 'sunflowers', emoji: '🌻', color: '#FFD93D' },
  { name: 'daisies',   emoji: '🌼', color: '#FFD93D' },
  { name: 'bluebells', emoji: '🪻', color: '#C084FC' },
];

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

function pickCategories(pool: typeof FRUITS, n: number): Category[] {
  const picks = shuffle([...pool]).slice(0, n);
  return picks.map(p => ({
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    count: 0, // set per question
  }));
}

function makeQuestion(difficulty: Difficulty): Question {
  let pool: typeof FRUITS;
  let nCategories: number;
  let countRange: [number, number];
  let kindRoll = Math.random();

  if (difficulty === 0) {
    pool = pick([FRUITS, FLOWERS]) as typeof FRUITS;
    nCategories = 3;
    countRange = [1, 6];
    kindRoll = Math.random();
  } else if (difficulty === 1) {
    pool = pick([FRUITS, VEGGIES, FLOWERS]) as typeof FRUITS;
    nCategories = 4;
    countRange = [2, 10];
    kindRoll = Math.random();
  } else {
    pool = pick([FRUITS, VEGGIES, FLOWERS]) as typeof FRUITS;
    nCategories = 4;
    countRange = [3, 12];
    kindRoll = Math.random();
  }

  const categories = pickCategories(pool, nCategories);
  // Generate distinct counts
  const usedCounts = new Set<number>();
  for (const c of categories) {
    let v: number;
    do { v = randInt(countRange[0], countRange[1]); } while (usedCounts.has(v));
    usedCounts.add(v);
    c.count = v;
  }
  const counts = categories.map(c => c.count);

  if (kindRoll < 0.4) {
    // Read: how many in a specific category
    const target = pick(categories);
    return {
      kind: 'read-count',
      prompt: `How many ${target.name} are in the graph?`,
      correct: String(target.count),
      choices: shuffle([String(target.count), String(target.count + 1), String(Math.max(0, target.count - 1)), String(target.count + 2), String(Math.max(0, target.count - 2))]).slice(0, 4),
      categories,
    };
  } else if (kindRoll < 0.7) {
    // Which has the most / fewest
    const isMost = Math.random() < 0.5;
    const sorted = [...categories].sort((a, b) => isMost ? b.count - a.count : a.count - b.count);
    const target = sorted[0];
    return {
      kind: isMost ? 'read-most' : 'read-fewest',
      prompt: isMost ? `Which category has the MOST?` : `Which category has the FEWEST?`,
      correct: target.name,
      choices: shuffle(categories.map(c => c.name)).slice(0, 4),
      categories,
    };
  } else {
    // Compare: how many more / fewer
    const a = categories[0];
    const b = categories[1];
    const diff = Math.abs(a.count - b.count);
    return {
      kind: 'compare',
      prompt: `How many MORE ${a.count > b.count ? a.name : b.name} than ${a.count > b.count ? b.name : a.name}?`,
      correct: String(diff),
      choices: shuffle([String(diff), String(diff + 1), String(Math.max(0, diff - 1)), String(diff + 2)]).slice(0, 4),
      categories,
    };
  }
}

function BarGraph({ categories }: { categories: Category[] }) {
  const max = Math.max(...categories.map(c => c.count));
  return (
    <div style={{ marginTop: 16, padding: 12, background: '#FFF8E7', border: '2px solid #E5B85A', borderRadius: 12 }}>
      {categories.map(c => (
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 24, minWidth: 30, textAlign: 'center' }}>{c.emoji}</span>
          <div style={{ flex: 1, background: 'white', border: '2px solid #E5E0D8', borderRadius: 8, height: 28, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(c.count / max) * 100}%`,
                background: c.color,
                height: '100%',
                transition: 'width 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
                color: 'white',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {c.count > 0 && c.count}
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-medium)', minWidth: 60, textTransform: 'capitalize' }}>{c.name}</span>
        </div>
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function GraphGarden({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('graphgarden_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ Correct! ${question.correct}` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('graphgarden_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. The answer was "${question.correct}". Look at the graph!` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>📊</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Graph Garden</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Count fruits and flowers, then read or build <strong>bar graphs</strong>!
          Practice data skills with the garden harvest.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a harvest:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 3 categories, count up to 6</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 4 categories, count to 10</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · compare "how many more"</span>
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
          10 graphs per harvest. Read carefully!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆📊' : stars >= 2 ? '🎉📊' : stars >= 1 ? '👍📊' : '💪📊';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
          Harvest complete!
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
            activity="graph-garden"
            activityName="Graph Garden"
            activityEmoji="📊"
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

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>📊 Graph Garden</h1>

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
          {question.prompt}
        </p>
        <BarGraph categories={question.categories} />
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
              fontSize: question.kind === 'read-most' || question.kind === 'read-fewest' ? 17 : 26,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              textTransform: question.kind === 'read-most' || question.kind === 'read-fewest' ? 'capitalize' : 'none',
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
        Tip: the <strong style={{ color: 'var(--accent-orange)' }}>taller bar</strong> = more. Find the answer by looking at the bar length.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="graph-garden"
          activityName="Graph Garden"
          activityEmoji="📊"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}