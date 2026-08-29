'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Adjective Adventure — pick adjectives that describe a noun, or pick the
// noun that fits an adjective. Explorer/adventure theme.
//   🌱 Easy   (pick the adjective that describes a noun, e.g., "fluffy cat")
//   🌿 Medium (compare — pick the strongest adjective; or fill the blank)
//   🌳 Hard   (sort adjectives by intensity; or pick all that apply)
// CCSS 2.L.1.e: Use adjectives and adverbs, and choose between them
// depending on what is to be modified.

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;
  correct: string;
  choices: string[];
  emoji: string;
}

const NOUNS: { word: string; emoji: string; category: string }[] = [
  { word: 'cat',     emoji: '🐱', category: 'animal' },
  { word: 'dog',     emoji: '🐶', category: 'animal' },
  { word: 'puppy',   emoji: '🐶', category: 'animal' },
  { word: 'kitten',  emoji: '🐱', category: 'animal' },
  { word: 'rabbit',  emoji: '🐰', category: 'animal' },
  { word: 'flower',  emoji: '🌸', category: 'plant' },
  { word: 'tree',    emoji: '🌳', category: 'plant' },
  { word: 'leaf',    emoji: '🍃', category: 'plant' },
  { word: 'cake',    emoji: '🎂', category: 'food' },
  { word: 'cookie',  emoji: '🍪', category: 'food' },
  { word: 'pizza',   emoji: '🍕', category: 'food' },
  { word: 'sun',     emoji: '☀️', category: 'weather' },
  { word: 'cloud',   emoji: '☁️', category: 'weather' },
  { word: 'mountain', emoji: '⛰️', category: 'place' },
  { word: 'castle',  emoji: '🏰', category: 'place' },
  { word: 'house',   emoji: '🏠', category: 'place' },
];

const ADJECTIVES_BY_CAT: Record<string, string[]> = {
  animal: ['fluffy', 'soft', 'tiny', 'playful', 'fast', 'cuddly', 'lazy'],
  plant:  ['green', 'tall', 'pretty', 'leafy', 'fragrant', 'colorful'],
  food:   ['sweet', 'delicious', 'tasty', 'yummy', 'creamy', 'crispy'],
  weather: ['bright', 'warm', 'cool', 'shiny', 'misty'],
  place:  ['big', 'old', 'ancient', 'stone', 'cozy', 'tall'],
};

// Generic adjectives (work for any noun)
const GENERIC_ADJECTIVES = ['shiny', 'colorful', 'big', 'small', 'happy', 'loud', 'quiet', 'fast', 'slow', 'new', 'old', 'cold', 'hot', 'wet', 'dry', 'clean', 'dirty'];

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

function makeQuestion(difficulty: Difficulty): Question {
  const noun = pick(NOUNS);
  const adjs = ADJECTIVES_BY_CAT[noun.category] || GENERIC_ADJECTIVES;

  if (difficulty === 0) {
    // Easy: pick the adjective that describes a noun
    const correct = pick(adjs);
    const choices = shuffle([correct, ...shuffle([...adjs, ...GENERIC_ADJECTIVES].filter(a => a !== correct)).slice(0, 5)]).slice(0, 4);
    return {
      prompt: `Which adjective describes a ${noun.emoji} ${noun.word}?`,
      correct,
      choices,
      emoji: noun.emoji,
    };
  }
  if (difficulty === 1) {
    // Medium: fill in the blank with the right adjective
    const correct = pick(adjs);
    const wrongPool = [...adjs, ...GENERIC_ADJECTIVES].filter(a => a !== correct);
    const choices = shuffle([correct, ...shuffle(wrongPool).slice(0, 4)]).slice(0, 4);
    return {
      prompt: `Complete: "The ${correct.length > 6 ? 'very ' : ''}${noun.emoji} ___ ${noun.word}" — pick the adjective that fits BEST:`,
      correct,
      choices,
      emoji: noun.emoji,
    };
  }
  // Hard: pick the strongest adjective
  const intensityTiers: Record<string, Record<string, string>> = {
    animal: { weak: 'small', mid: 'fluffy', strong: 'majestic' },
    plant: { weak: 'green', mid: 'pretty', strong: 'magnificent' },
    food: { weak: 'tasty', mid: 'delicious', strong: 'exquisite' },
    weather: { weak: 'warm', mid: 'bright', strong: 'radiant' },
    place: { weak: 'big', mid: 'old', strong: 'ancient' },
  };
  const tiers = intensityTiers[noun.category] || { weak: 'new', mid: 'cool', strong: 'magnificent' };
  const tier = pick(['mid', 'mid', 'strong'] as const); // bias toward harder
  const correct = tiers[tier as 'mid' | 'strong'];
  const choices = shuffle([
    correct,
    tiers.weak,
    tiers.mid,
    tiers.strong,
  ]).slice(0, 4);
  return {
    prompt: `Pick the STRONGEST adjective for a ${noun.emoji} ${noun.word}:`,
    correct,
    choices,
    emoji: noun.emoji,
  };
}

const TOTAL_ROUNDS = 10;

export default function AdjectiveAdventure({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('adjectiveadventure_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ "${question.correct}" — that's the right adjective!` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('adjectiveadventure_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. The best adjective was "${question.correct}".` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>✍️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Adjective Adventure</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          <strong>Adjectives</strong> are describing words! Pick the one that
          fits each thing the best.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick an expedition:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · pick the describing word</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · fill in the blank</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · strongest adjective wins</span>
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
          10 challenges per expedition. Words make stories sing!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆✍️' : stars >= 2 ? '🎉✍️' : stars >= 1 ? '👍✍️' : '💪✍️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
          Adventure complete!
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
            activity="adjective-adventure"
            activityName="Adjective Adventure"
            activityEmoji="✍️"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>✍️ Adjective Adventure</h1>

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
        <div style={{ fontSize: 80, marginBottom: 8 }}>{question.emoji}</div>
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
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
              fontSize: 19,
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
        Tip: adjectives answer <strong style={{ color: 'var(--accent-orange)' }}>what kind?</strong> — fluffy, fast, sweet, ancient.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="adjective-adventure"
          activityName="Adjective Adventure"
          activityEmoji="✍️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}