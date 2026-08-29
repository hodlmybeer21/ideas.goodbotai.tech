'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Verb Vault — fill in past tense of irregular verbs, or pick the right
// verb form. Treasure-vault theme.
//   🌱 Easy   (regular verbs: -ed endings)
//   🌿 Medium (irregular verbs: ran, made, went, ate, came)
//   🌳 Hard   (irregular + mixed present/past in context)
// CCSS 2.L.1.d: Form and use the past tense of frequently occurring
// irregular verbs (e.g., ran, made, went, ate, came).

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;
  base: string;
  tense: 'past' | 'present' | 'future';
  correct: string;
  choices: string[];
}

const REGULAR_VERBS: { base: string; past: string; emoji: string }[] = [
  { base: 'walk',  past: 'walked',  emoji: '🚶' },
  { base: 'jump',  past: 'jumped',  emoji: '🤸' },
  { base: 'play',  past: 'played',  emoji: '⚽' },
  { base: 'bake',  past: 'baked',   emoji: '🧁' },
  { base: 'paint', past: 'painted', emoji: '🎨' },
  { base: 'cook',  past: 'cooked',  emoji: '🍳' },
  { base: 'clean', past: 'cleaned', emoji: '🧹' },
  { base: 'wash',  past: 'washed',  emoji: '🧼' },
  { base: 'kick',  past: 'kicked',  emoji: '🦵' },
  { base: 'dance', past: 'danced',  emoji: '💃' },
];

const IRREGULAR_VERBS: { base: string; past: string; emoji: string; sentence: string }[] = [
  { base: 'run',  past: 'ran',   emoji: '🏃', sentence: 'Yesterday she ___ fast.' },
  { base: 'go',   past: 'went',  emoji: '🚶', sentence: 'Last week we ___ to the park.' },
  { base: 'make', past: 'made',  emoji: '🔨', sentence: 'Mom ___ a cake for my birthday.' },
  { base: 'eat',  past: 'ate',   emoji: '🍽️', sentence: 'The cat ___ the fish.' },
  { base: 'come', past: 'came',  emoji: '🚪', sentence: 'My friend ___ over to play.' },
  { base: 'see',  past: 'saw',   emoji: '👁️', sentence: 'We ___ a bird in the tree.' },
  { base: 'take', past: 'took',  emoji: '✋', sentence: 'She ___ her book to school.' },
  { base: 'give', past: 'gave',  emoji: '🎁', sentence: 'He ___ me a present.' },
  { base: 'drink', past: 'drank', emoji: '🥤', sentence: 'I ___ milk with dinner.' },
  { base: 'sing', past: 'sang',  emoji: '🎵', sentence: 'She ___ a song at the concert.' },
  { base: 'swim', past: 'swam',  emoji: '🏊', sentence: 'They ___ in the pool.' },
  { base: 'write', past: 'wrote', emoji: '✏️', sentence: 'He ___ a letter to grandma.' },
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

function makeQuestion(difficulty: Difficulty): Question {
  if (difficulty === 0) {
    // Easy: regular verbs, -ed ending
    const verb = pick(REGULAR_VERBS);
    const choices = shuffle([verb.past, ...shuffle(REGULAR_VERBS.filter(v => v.base !== verb.base)).slice(0, 3).map(v => v.past)]).slice(0, 4);
    return {
      prompt: `What is the past tense of "${verb.base}"? (${verb.emoji})`,
      base: verb.base,
      tense: 'past',
      correct: verb.past,
      choices,
    };
  }
  if (difficulty === 1) {
    // Medium: irregular verbs
    const verb = pick(IRREGULAR_VERBS);
    const wrongPool = shuffle(IRREGULAR_VERBS.filter(v => v.base !== verb.base)).slice(0, 4).map(v => v.past);
    const choices = shuffle([verb.past, ...wrongPool.slice(0, 3)]).slice(0, 4);
    return {
      prompt: `${verb.sentence} Fill in the blank with the past tense of "${verb.base}":`,
      base: verb.base,
      tense: 'past',
      correct: verb.past,
      choices,
    };
  }
  // Hard: mix of irregular verbs, full sentence fill
  const verb = pick(IRREGULAR_VERBS);
  const correctTense = verb.past;
  const wrongAnswers = [
    verb.base,           // present (wrong)
    verb.base + 'ed',    // over-regularized (wrong)
    verb.base + 's',     // present 3rd person (wrong)
  ];
  const otherVerbs = shuffle(IRREGULAR_VERBS.filter(v => v.base !== verb.base)).slice(0, 3).map(v => v.past);
  const choices = shuffle([correctTense, ...wrongAnswers.slice(0, 1), ...otherVerbs.slice(0, 2)]).slice(0, 4);
  return {
    prompt: `${verb.sentence} — pick the correct past tense:`,
    base: verb.base,
    tense: 'past',
    correct: correctTense,
    choices,
  };
}

const TOTAL_ROUNDS = 10;

export default function VerbVault({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('verbvault_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ "${question.base}" → "${question.correct}". You cracked the vault!` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('verbvault_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. "${question.base}" → "${question.correct}" is the past tense.` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🕰️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Verb Vault</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto', marginTop: 0, marginBottom: 24 }}>
          Some verbs change shape when they go to the past — <strong>run → ran</strong>,
          <strong> go → went</strong>, <strong>eat → ate</strong>. Crack the vault!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a vault:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · regular verbs (add -ed)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · irregular verbs in sentences</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · watch out for "trap" forms</span>
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
          10 locks per vault. Don't fall for the trap answers!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🕰️' : stars >= 2 ? '🎉🕰️' : stars >= 1 ? '👍🕰️' : '💪🕰️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
          Vault cracked!
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
            activity="verb-vault"
            activityName="Verb Vault"
            activityEmoji="🕰️"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🕰️ Verb Vault</h1>

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
        <div style={{ fontSize: 60, marginBottom: 8 }}>🔐</div>
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)', lineHeight: 1.5 }}>
          {question.prompt}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-medium)', fontStyle: 'italic' }}>
          Verb to convert: <strong style={{ color: 'var(--accent-purple)' }}>{question.base}</strong>
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
        Tip: don't add <strong style={{ color: 'var(--accent-orange)' }}>-ed</strong> to irregular verbs — they have their own past tense!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="verb-vault"
          activityName="Verb Vault"
          activityEmoji="🕰️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}