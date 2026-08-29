'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Measure Me — length measurement with different units. Construction yard
// theme — the player measures objects using rulers, paper clips, and cm/inch.
//   🌱 Easy   (estimate in paper clips / big units, compare lengths)
//   🌿 Medium (measure with cm/inch, pick the right tool)
//   🌳 Hard   (convert between cm and inch, measure to nearest unit)
// CCSS 2.MD.A.1: Measure the length of an object by selecting and using
// appropriate tools such as rulers, yardsticks, meter sticks, and measuring
// tapes.
// CCSS 2.MD.A.3: Estimate lengths using units of inches, feet, centimeters,
// and meters.
// CCSS 2.MD.A.4: Measure to determine how much longer one object is than
// another.

type Difficulty = 0 | 1 | 2;
type Unit = 'clips' | 'inches' | 'cm' | 'feet';

interface Object {
  name: string;
  emoji: string;
  // Length values per unit (in those units)
  length: { clips: number; inches: number; cm: number; feet: number };
}

const OBJECTS: Object[] = [
  { name: 'pencil',      emoji: '✏️', length: { clips: 3, inches: 6,  cm: 15, feet: 0 } },
  { name: 'book',        emoji: '📕', length: { clips: 5, inches: 8,  cm: 20, feet: 0 } },
  { name: 'notebook',    emoji: '📓', length: { clips: 6, inches: 10, cm: 25, feet: 0 } },
  { name: 'ruler',       emoji: '📏', length: { clips: 7, inches: 12, cm: 30, feet: 1 } },
  { name: 'crayon',      emoji: '🖍️', length: { clips: 2, inches: 4,  cm: 10, feet: 0 } },
  { name: 'marker',      emoji: '🖊️', length: { clips: 4, inches: 5,  cm: 12, feet: 0 } },
  { name: 'eraser',      emoji: '🩹', length: { clips: 1, inches: 2,  cm: 5,  feet: 0 } },
  { name: 'scissors',    emoji: '✂️', length: { clips: 4, inches: 7,  cm: 18, feet: 0 } },
  { name: 'glue stick',  emoji: '🧴', length: { clips: 3, inches: 4,  cm: 11, feet: 0 } },
  { name: 'door',        emoji: '🚪', length: { clips: 18, inches: 80, cm: 200, feet: 7 } },
  { name: 'desk',        emoji: '🪑', length: { clips: 14, inches: 48, cm: 120, feet: 4 } },
  { name: 'table',       emoji: '🟫', length: { clips: 16, inches: 60, cm: 150, feet: 5 } },
  { name: 'bed',         emoji: '🛏️', length: { clips: 22, inches: 80, cm: 200, feet: 7 } },
  { name: 'car',         emoji: '🚗', length: { clips: 28, inches: 180, cm: 450, feet: 15 } },
];

const UNITS: { id: Unit; label: string; emoji: string }[] = [
  { id: 'clips',  label: 'paper clips', emoji: '📎' },
  { id: 'inches', label: 'inches',      emoji: '📏' },
  { id: 'cm',     label: 'centimeters', emoji: '📐' },
  { id: 'feet',   label: 'feet',        emoji: '🦶' },
];

interface Question {
  kind: 'estimate' | 'measure' | 'compare' | 'convert';
  prompt: string;
  object: Object;
  unit: Unit;
  correct: number | string;
  choices: (number | string)[];
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

function unitChoices(correct: number, count = 4): number[] {
  const set = new Set<number>([correct]);
  const offsets = [-3, -2, -1, 1, 2, 3, 5, -5];
  for (const off of offsets) {
    if (set.size >= count + 2) break;
    const candidate = Math.max(0, correct + off);
    set.add(candidate);
  }
  return shuffle([...set]).slice(0, count);
}

function makeQuestion(difficulty: Difficulty): Question {
  const obj = pick(OBJECTS.filter(o => o.length.clips > 0));

  if (difficulty === 0) {
    // Easy: estimate in paper clips or compare lengths
    if (Math.random() < 0.6) {
      const correct = obj.length.clips;
      return {
        kind: 'estimate',
        prompt: `About how many 📎 paper clips long is a ${obj.name}?`,
        object: obj,
        unit: 'clips',
        correct,
        choices: unitChoices(correct),
      };
    } else {
      // Compare: pick the longer of two objects
      const other = pick(OBJECTS.filter(o => o.name !== obj.name && o.length.clips > 0));
      const objClips = obj.length.clips;
      const otherClips = other.length.clips;
      const longer = objClips >= otherClips ? obj.name : other.name;
      return {
        kind: 'compare',
        prompt: `Which is longer: a ${obj.name} (${objClips} clips) or a ${other.name} (${otherClips} clips)?`,
        object: obj,
        unit: 'clips',
        correct: longer,
        choices: shuffle([obj.name, other.name, 'They are the same length']).slice(0, 3),
      };
    }
  }

  if (difficulty === 1) {
    // Medium: measure in inches or cm
    const unit: Unit = Math.random() < 0.5 ? 'inches' : 'cm';
    const correct = obj.length[unit];
    return {
      kind: 'measure',
      prompt: `How ${UNITS.find(u => u.id === unit)?.label} long is a ${obj.name} ${obj.emoji}?`,
      object: obj,
      unit,
      correct,
      choices: unitChoices(correct),
    };
  }

  // Hard: convert cm ↔ inches, or measure a longer object
  if (Math.random() < 0.5) {
    const unit: Unit = Math.random() < 0.5 ? 'inches' : 'cm';
    const correct = obj.length[unit];
    return {
      kind: 'measure',
      prompt: `How ${UNITS.find(u => u.id === unit)?.label} long is a ${obj.name} ${obj.emoji}? Round to the nearest whole number.`,
      object: obj,
      unit,
      correct,
      choices: unitChoices(correct, 4),
    };
  } else {
    // Convert
    const cmVal = obj.length.cm;
    const inchVal = obj.length.inches;
    const correct = Math.round(cmVal / 2.54);
    return {
      kind: 'convert',
      prompt: `A ${obj.name} is ${cmVal} cm long. About how many inches is that? (1 inch ≈ 2.5 cm)`,
      object: obj,
      unit: 'inches',
      correct,
      choices: unitChoices(correct, 4),
    };
  }
}

const TOTAL_ROUNDS = 10;

export default function MeasureMe({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('measureme_best_streak');
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

  const answer = useCallback((choice: number | string) => {
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
      setFeedback({ kind: 'good', text: `✅ Correct! ${question.object.name} ${question.object.emoji} is ${question.correct} ${UNITS.find(u => u.id === question.unit)?.label}.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('measureme_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. The answer was ${question.correct} ${UNITS.find(u => u.id === question.unit)?.label}.` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>📏</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Measure Me</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          How long is a pencil? How tall is a door? Measure everyday objects
          using <strong>paper clips</strong>, <strong>inches</strong>, and <strong>centimeters</strong>.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a tool:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · estimate in paper clips</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · measure with inches or cm</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · bigger objects + cm ↔ inch</span>
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
          10 measurements per shift. Pick the right tool for the job!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆📏' : stars >= 2 ? '🎉📏' : stars >= 1 ? '👍📏' : '💪📏';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Job done!
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
            activity="measure-me"
            activityName="Measure Me"
            activityEmoji="📏"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 255, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>📏 Measure Me</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-blue)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-blue)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)', lineHeight: 1.5 }}>
          {question.prompt}
        </p>
        <div style={{ marginTop: 16, fontSize: 64, lineHeight: 1 }}>
          {question.object.emoji}
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
        Tip: 1 inch ≈ 2.5 cm. A paper clip is about 1 inch long!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="measure-me"
          activityName="Measure Me"
          activityEmoji="📏"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}