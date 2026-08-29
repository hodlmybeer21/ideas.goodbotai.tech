'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Place Value Pirates — hundreds, tens, ones, expanded form, count to 1000.
// Pirate theme — the player counts treasure chests and reads pirate maps.
//   🌱 Easy   (tens + ones, expanded form within 99)
//   🌿 Medium (hundreds + tens + ones, expanded form within 999)
//   🌳 Hard   (count to 1000, expanded form, compare 3-digit numbers)
// CCSS 2.NBT.A.1: Understand that the three digits of a three-digit number
// represent amounts of hundreds, tens, and ones.
// CCSS 2.NBT.A.2: Count within 1000; skip-count by 5s, 10s, and 100s.
// CCSS 2.NBT.A.3: Read and write numbers to 1000 using base-ten numerals,
// number names, and expanded form.
// CCSS 2.NBT.A.4: Compare two three-digit numbers based on meanings of the
// hundreds, tens, and ones digits, using >, =, and < symbols.

type Difficulty = 0 | 1 | 2;

interface Question {
  kind: 'expanded' | 'name' | 'compare' | 'build' | 'next';
  prompt: string;
  correct: string;
  choices: string[];
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

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(n: number): string {
  if (n === 0) return 'zero';
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ONES[n / 100 | 0] + ' hundred');
    n = n % 100;
  }
  if (n >= 20) {
    parts.push(TENS[n / 10 | 0]);
    if (n % 10) parts.push(ONES[n % 10]);
  } else if (n >= 10) {
    parts.push(TEENS[n - 10]);
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

function makeQuestion(difficulty: Difficulty): Question {
  if (difficulty === 0) {
    // Easy: 2-digit, expanded form or name
    const n = randInt(11, 99);
    if (Math.random() < 0.6) {
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      const expanded = ones === 0 ? `${tens * 10}` : `${tens * 10} + ${ones}`;
      return {
        kind: 'expanded',
        prompt: `What is ${n} in expanded form?`,
        correct: expanded,
        choices: shuffle([
          expanded,
          `${tens + 1 * 10} + ${ones + 1}`,
          `${tens * 10} + ${ones + 10}`,
          `${tens * 100}`,
          `${tens} + ${ones * 10}`,
        ]).slice(0, 4),
      };
    } else {
      const correct = numberToWords(n);
      return {
        kind: 'name',
        prompt: `How do you write "${n}" in words?`,
        correct,
        choices: shuffle([correct, numberToWords(n + 1), numberToWords(n - 1), numberToWords(n + 10), numberToWords(n - 10)]).slice(0, 4),
      };
    }
  }
  if (difficulty === 1) {
    // Medium: 3-digit, expanded form / name / compare
    const kind = Math.random();
    if (kind < 0.5) {
      // 3-digit expanded form
      const n = randInt(101, 999);
      const hundreds = Math.floor(n / 100);
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;
      const parts: string[] = [`${hundreds * 100}`];
      if (tens > 0) parts.push(`${tens * 10}`);
      if (ones > 0) parts.push(`${ones}`);
      const expanded = parts.join(' + ');
      const correct = expanded;
      return {
        kind: 'expanded',
        prompt: `What is ${n} in expanded form?`,
        correct,
        choices: shuffle([
          expanded,
          `${(hundreds + 1) * 100} + ${tens * 10} + ${ones}`,
          `${hundreds * 100} + ${(tens + 1) * 10} + ${ones}`,
          `${hundreds * 10} + ${tens * 100} + ${ones}`,
          `${hundreds * 100} + ${tens * 10} + ${ones + 10}`,
        ]).slice(0, 4),
      };
    } else if (kind < 0.75) {
      // Number name
      const n = randInt(100, 999);
      const correct = numberToWords(n);
      return {
        kind: 'name',
        prompt: `How do you write "${n}" in words?`,
        correct,
        choices: shuffle([correct, numberToWords(n + 100), numberToWords(n - 100), numberToWords(n + 10), numberToWords(n - 10)]).slice(0, 4),
      };
    } else {
      // Compare two 3-digit numbers
      const a = randInt(100, 999);
      let b: number;
      do {
        b = randInt(100, 999);
      } while (b === a);
      const relation = a > b ? '>' : a < b ? '<' : '=';
      return {
        kind: 'compare',
        prompt: `Compare: ${a} ___ ${b}`,
        correct: relation,
        choices: shuffle([relation, relation === '>' ? '<' : relation === '<' ? '>' : '>', relation === '=' ? '>' : '=', relation === '=' ? '<' : '>']).slice(0, 3),
      };
    }
  }
  // Hard: count to 1000 / build number from parts
  if (Math.random() < 0.5) {
    // Build the number from parts
    const hundreds = randInt(1, 9);
    const tens = randInt(0, 9);
    const ones = randInt(0, 9);
    const correct = hundreds * 100 + tens * 10 + ones;
    return {
      kind: 'build',
      prompt: `How much treasure is ${hundreds} hundred + ${tens} ten + ${ones} one?`,
      correct: String(correct),
      choices: shuffle([
        String(correct),
        String(correct + 10),
        String(correct - 10),
        String(correct + 100),
        String(correct - 1),
      ]).slice(0, 4),
    };
  } else {
    // What's next / previous in a skip-count sequence
    const startHundreds = randInt(1, 8);
    const start = startHundreds * 100;
    const sequence = [start, start + 100, start + 200, start + 300];
    const correct = start + 400;
    return {
      kind: 'next',
      prompt: `Continue: ${sequence.join(', ')}, ___`,
      correct: String(correct),
      choices: shuffle([
        String(correct),
        String(correct + 100),
        String(correct - 100),
        String(correct + 10),
        String(correct - 10),
      ]).slice(0, 4),
    };
  }
}

const TOTAL_ROUNDS = 10;

export default function PlaceValuePirates({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('placevaluepirates_best_streak');
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
            localStorage.setItem('placevaluepirates_best_streak', String(newStreak));
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🏴‍☠️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Place Value Pirates</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Yo ho ho! Read pirate treasure maps using <strong>place value</strong> —
          hundreds, tens, and ones. Expand, compare, and count to 1000!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a voyage:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 2-digit expanded form</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 3-digit + compare</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · build from parts + count to 1000</span>
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
          10 maps per voyage. X marks the spot!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🏴‍☠️' : stars >= 2 ? '🎉🏴‍☠️' : stars >= 1 ? '👍🏴‍☠️' : '💪🏴‍☠️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
          Voyage complete!
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
            activity="place-value-pirates"
            activityName="Place Value Pirates"
            activityEmoji="🏴‍☠️"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏴‍☠️ Place Value Pirates</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-purple)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-purple)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>🗺️</div>
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)', lineHeight: 1.5 }}>
          {question.prompt}
        </p>
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
              fontSize: question.kind === 'compare' ? 32 : 20,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              minHeight: 50,
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
        Tip: <strong style={{ color: 'var(--accent-purple)' }}>hundreds</strong> is the third digit (100, 200…), <strong style={{ color: 'var(--accent-purple)' }}>tens</strong> is the second (10, 20…), <strong style={{ color: 'var(--accent-purple)' }}>ones</strong> is the last (1, 2…).
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="place-value-pirates"
          activityName="Place Value Pirates"
          activityEmoji="🏴‍☠️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}