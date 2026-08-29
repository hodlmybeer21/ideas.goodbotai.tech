'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Word Problem Woods — multi-step story problems. Forest theme — the player
// hikes through the woods solving real-life word problems.
//   🌱 Easy   (one-step, within 100)
//   🌿 Medium (two-step, within 100)
//   🌳 Hard   (two-step with extra info, within 1000)
// CCSS 2.OA.A.1: Use addition and subtraction within 100 to solve one- and
// two-step word problems involving situations of adding to, taking from,
// putting together, taking apart, and comparing, with unknowns in all
// positions, e.g., by using drawings and equations with a symbol for the
// unknown number to represent the problem.

type Difficulty = 0 | 1 | 2;

interface Problem {
  story: string;      // the word problem text
  equation: string;   // the matching math equation (e.g., "23 + 14 = 37")
  correct: number;
  choices: number[];
  hasExtra: boolean;  // tier 2 — irrelevant extra info
}

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

interface ScenEntry {
  storyTemplate: (a: number, b: number, extra?: number) => string;
  op: '+' | '-';
  extra?: (a: number, b: number) => number;
  label: string;
  emoji: string;
}

const SCENARIOS: ScenEntry[] = [
  // "adding to" — start + more
  { label: 'apples', emoji: '🍎', op: '+', storyTemplate: (a, b) => `${a} apples grew on a tree. Then ${b} more apples grew. How many apples in all?` },
  { label: 'cookies', emoji: '🍪', op: '+', storyTemplate: (a, b) => `Mia baked ${a} cookies. Her friend baked ${b} more. How many cookies do they have altogether?` },
  { label: 'marbles', emoji: '🔮', op: '+', storyTemplate: (a, b) => `${a} marbles are in a jar. ${b} more marbles are added. How many marbles are in the jar now?` },
  { label: 'stickers', emoji: '⭐', op: '+', storyTemplate: (a, b) => `Sam has ${a} stickers. He gets ${b} more for his birthday. How many stickers does Sam have now?` },
  { label: 'books', emoji: '📚', op: '+', storyTemplate: (a, b) => `There are ${a} books on one shelf and ${b} books on another. How many books are there in all?` },
  // "taking from" — start - taken
  { label: 'balloons', emoji: '🎈', op: '-', storyTemplate: (a, b) => `${a} balloons are floating. ${b} of them fly away. How many balloons are left?` },
  { label: 'birds', emoji: '🐦', op: '-', storyTemplate: (a, b) => `${a} birds are sitting on a fence. ${b} of them fly away. How many birds are still on the fence?` },
  { label: 'candies', emoji: '🍬', op: '-', storyTemplate: (a, b) => `${a} candies are in a bag. ${b} candies are eaten. How many candies are left?` },
  { label: 'fish', emoji: '🐟', op: '-', storyTemplate: (a, b) => `There were ${a} fish in the pond. ${b} fish swam away. How many fish are left?` },
  { label: 'pencils', emoji: '✏️', op: '-', storyTemplate: (a, b) => `Emma had ${a} pencils. She gave ${b} away. How many pencils does Emma have now?` },
  // "comparing" — difference
  { label: 'marbles-difference', emoji: '🔮', op: '-', storyTemplate: (a, b) => `Sam has ${a} marbles. Lily has ${b} marbles. How many more marbles does Sam have than Lily?` },
  { label: 'apples-difference', emoji: '🍎', op: '-', storyTemplate: (a, b) => `${a} red apples and ${b} green apples are in a basket. How many more red apples than green apples?` },
  // "putting together" — total
  { label: 'stickers-total', emoji: '⭐', op: '+', storyTemplate: (a, b) => `There are ${a} star stickers and ${b} heart stickers in a box. How many stickers in all?` },
  // Tier 1 / 2 — comparison word problems
  { label: 'candles', emoji: '🕯️', op: '-', storyTemplate: (a, b) => `A cake has ${a} candles. ${b} of them are blue. How many candles are NOT blue?` },
  { label: 'pages', emoji: '📖', op: '-', storyTemplate: (a, b) => `A book has ${a} pages. Maya has read ${b} pages. How many pages does she have left to read?` },
];

function makeProblem(difficulty: Difficulty): Problem {
  if (difficulty === 0) {
    // Easy: one-step within 100
    const scenario = pick(SCENARIOS);
    let a: number, b: number;
    if (scenario.op === '+') {
      a = randInt(5, 40);
      b = randInt(5, 40);
    } else {
      a = randInt(10, 50);
      b = randInt(2, Math.min(a - 1, 30));
    }
    const correct = scenario.op === '+' ? a + b : a - b;
    const equation = scenario.op === '+' ? `${a} + ${b}` : `${a} − ${b}`;
    const choices = shuffle([correct, correct + 1, correct - 1, correct + 10, correct - 10]).slice(0, 4);
    return {
      story: scenario.storyTemplate(a, b),
      equation: `${equation} = ?`,
      correct,
      choices,
      hasExtra: false,
    };
  }
  if (difficulty === 1) {
    // Medium: two-step within 100
    const a = randInt(10, 40);
    const b = randInt(5, 30);
    const c = randInt(5, 25);
    // Mix of patterns: start + b then + c, or start + b then - c, or start - b then - c
    const patterns = [
      { story: `${a} birds were on a tree. ${b} more birds came. Then ${c} birds flew away. How many birds are on the tree now?`, correct: a + b - c, equation: `${a} + ${b} − ${c}` },
      { story: `${a} balloons were at a party. ${b} floated away. Then ${c} new balloons arrived. How many balloons are at the party now?`, correct: a - b + c, equation: `${a} − ${b} + ${c}` },
      { story: `Sam has ${a} toy cars. He gives ${b} to his friend. Then he buys ${c} more. How many toy cars does Sam have now?`, correct: a - b + c, equation: `${a} − ${b} + ${c}` },
      { story: `There were ${a} cookies on a plate. The family ate ${b} cookies for snack and ${c} more for dessert. How many cookies are left?`, correct: a - b - c, equation: `${a} − ${b} − ${c}` },
      { story: `${a} kids went to the library. ${b} kids checked out books. Then ${c} more kids arrived. How many kids are in the library now?`, correct: a - b + c, equation: `${a} − ${b} + ${c}` },
    ];
    const picked = pick(patterns);
    const choices = shuffle([picked.correct, picked.correct + 1, picked.correct - 1, picked.correct + 5, picked.correct - 5]).slice(0, 4);
    return {
      story: picked.story,
      equation: `${picked.equation} = ?`,
      correct: picked.correct,
      choices,
      hasExtra: false,
    };
  }
  // Hard: two-step with extra info OR within 1000
  if (Math.random() < 0.5) {
    // Within 1000 (3-digit answer)
    const a = randInt(100, 400);
    const b = randInt(100, 300);
    const c = randInt(50, 200);
    const correct = a + b - c;
    const equation = `${a} + ${b} − ${c}`;
    const story = `A library has ${a} books on the first floor and ${b} books on the second floor. ${c} books were checked out. How many books are left on the shelves?`;
    const choices = shuffle([correct, correct + 10, correct - 10, correct + 50, correct - 50]).slice(0, 4);
    return { story, equation: `${equation} = ?`, correct, choices, hasExtra: false };
  }
  // Two-step with extra (irrelevant) info
  const a = randInt(15, 40);
  const b = randInt(5, 20);
  const c = randInt(3, 15);
  const extra = randInt(10, 50); // irrelevant fact
  const correct = a + b - c;
  const equation = `${a} + ${b} − ${c}`;
  const story = `There are ${a} red flowers and ${b} yellow flowers in the garden. ${c} of the red flowers wilted. (There are also ${extra} daisies nearby.) How many red flowers are still healthy?`;
  const choices = shuffle([correct, correct + 1, correct - 1, correct + a, correct - b]).slice(0, 4);
  return { story, equation: `${equation} = ?`, correct, choices, hasExtra: true };
}

const TOTAL_ROUNDS = 10;

export default function WordProblemWoods({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('wordproblemwoods_best_streak');
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

  const answer = useCallback((choice: number) => {
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
      setFeedback({ kind: 'good', text: `✅ Correct! ${problem.equation} ${problem.correct}` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('wordproblemwoods_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. ${problem.equation} ${problem.correct}. Read the story step by step!` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🌲</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Word Problem Woods</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Solve real-life word problems as you hike through the woods! Read
          the story, figure out what math to do, then pick the answer.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a trail:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · one-step stories</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · two-step stories</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · extra info to ignore</span>
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
          10 stories per hike. Read carefully — extra details might be there to trick you!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🌲' : stars >= 2 ? '🎉🌲' : stars >= 1 ? '👍🌲' : '💪🌲';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
          Hike complete!
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
            activity="word-problem-woods"
            activityName="Word Problem Woods"
            activityEmoji="🌲"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🌲 Word Problem Woods</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-green)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-green)',
          marginBottom: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)', lineHeight: 1.5 }}>
          {problem.story}
        </p>
        {problem.hasExtra && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--accent-orange)', fontStyle: 'italic' }}>
            💡 Hint: ignore any facts you don't need!
          </p>
        )}
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
              fontSize: 26,
              fontWeight: 700,
              padding: '18px 12px',
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
        Tip: read the story once, then figure out what numbers you need and what to do with them (add? subtract?).
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="word-problem-woods"
          activityName="Word Problem Woods"
          activityEmoji="🌲"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}