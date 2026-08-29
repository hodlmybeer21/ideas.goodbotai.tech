'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Community Helpers — match people in jobs to the tools/places/vehicles they
// use, and identify what they help with. Civic theme.
//   🌱 Easy   (match the helper to their tool)
//   🌿 Medium (which community place helps with X)
//   🌳 Hard   (multi-step: which helper should you call for a problem)
// Cross-curricular social studies. Civics strand: "Identify roles and
// responsibilities of people in authority and local leaders."

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;
  correct: string;
  choices: string[];
  emoji?: string;
}

interface Helper {
  name: string;
  emoji: string;
  tool: string;
  toolEmoji: string;
  place: string;
  placeEmoji: string;
  helps: string;
}

const HELPERS: Helper[] = [
  { name: 'doctor',      emoji: '👩‍⚕️', tool: 'stethoscope', toolEmoji: '🩺', place: 'hospital',  placeEmoji: '🏥', helps: 'when you are sick or hurt' },
  { name: 'nurse',       emoji: '👨‍⚕️', tool: 'thermometer', toolEmoji: '🌡️', place: 'hospital',  placeEmoji: '🏥', helps: 'helps doctors care for patients' },
  { name: 'police',      emoji: '👮',   tool: 'badge',        toolEmoji: '🛡️', place: 'police station', placeEmoji: '🏛️', helps: 'when something is stolen or someone is in danger' },
  { name: 'firefighter', emoji: '🧑‍🚒', tool: 'fire hose',    toolEmoji: '🚒', place: 'fire station', placeEmoji: '🚒', helps: 'when there is a fire' },
  { name: 'mail carrier', emoji: '📮',  tool: 'mail bag',     toolEmoji: '📬', place: 'post office', placeEmoji: '🏤', helps: 'delivers letters and packages' },
  { name: 'teacher',     emoji: '👩‍🏫', tool: 'book',         toolEmoji: '📚', place: 'school',    placeEmoji: '🏫', helps: 'helps you learn new things' },
  { name: 'librarian',   emoji: '👩‍💼', tool: 'library card', toolEmoji: '🎫', place: 'library',   placeEmoji: '📚', helps: 'helps you find books' },
  { name: 'farmer',      emoji: '👨‍🌾', tool: 'tractor',      toolEmoji: '🚜', place: 'farm',      placeEmoji: '🌾', helps: 'grows the food we eat' },
  { name: 'baker',       emoji: '👨‍🍳', tool: 'rolling pin',  toolEmoji: '🥖', place: 'bakery',    placeEmoji: '🥐', helps: 'makes bread and pastries' },
  { name: 'vet',         emoji: '👩‍⚕️', tool: 'stethoscope', toolEmoji: '🩺', place: 'animal hospital', placeEmoji: '🐾', helps: 'cares for sick animals' },
  { name: 'dentist',     emoji: '🦷',   tool: 'tooth mirror', toolEmoji: '🪥', place: 'dentist office', placeEmoji: '🦷', helps: 'cares for your teeth' },
  { name: 'plumber',     emoji: '🔧',   tool: 'wrench',       toolEmoji: '🔧', place: 'your home', placeEmoji: '🏠', helps: 'fixes leaky pipes' },
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
  const helper = pick(HELPERS);
  if (difficulty === 0) {
    // Easy: which tool does this helper use?
    const choices = shuffle([helper.tool, ...shuffle(HELPERS.filter(h => h.name !== helper.name)).slice(0, 4).map(h => h.tool)]).slice(0, 4);
    return {
      prompt: `A ${helper.name} ${helper.emoji} uses which tool?`,
      correct: helper.tool,
      choices,
      emoji: helper.toolEmoji,
    };
  }
  if (difficulty === 1) {
    // Medium: which place helps with this problem?
    const correct = helper.place;
    const choices = shuffle([correct, ...shuffle(HELPERS.filter(h => h.name !== helper.name)).slice(0, 3).map(h => h.place)]).slice(0, 4);
    return {
      prompt: `Where do you go ${helper.helps}?`,
      correct,
      choices,
      emoji: helper.placeEmoji,
    };
  }
  // Hard: which helper should you call?
  const scenarios = [
    { situation: 'your kitchen sink is leaking and water is everywhere', correct: 'plumber' },
    { situation: 'your house is on fire', correct: 'firefighter' },
    { situation: 'someone stole your bike', correct: 'police' },
    { situation: 'your dog is sick', correct: 'vet' },
    { situation: 'you have a fever and feel terrible', correct: 'doctor' },
    { situation: 'you broke a tooth and it hurts', correct: 'dentist' },
    { situation: 'you need to find a book about dinosaurs', correct: 'librarian' },
    { situation: 'you got a letter in the mail addressed to you', correct: 'mail carrier' },
    { situation: 'you want to learn how to read', correct: 'teacher' },
  ];
  const sc = pick(scenarios);
  const helperMatch = HELPERS.find(h => h.name === sc.correct) || helper;
  const choices = shuffle([helperMatch.name, ...shuffle(HELPERS.filter(h => h.name !== helperMatch.name)).slice(0, 3).map(h => h.name)]).slice(0, 4);
  return {
    prompt: `Which community helper should you call if ${sc.situation}?`,
    correct: helperMatch.name,
    choices,
    emoji: helperMatch.emoji,
  };
}

const TOTAL_ROUNDS = 10;

export default function CommunityHelpers({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('communityhelpers_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ Correct! ${question.correct}.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('communityhelpers_best_streak', String(newStreak));
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
        <div style={{ fontSize: 80, marginTop: 12 }}>👮</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Community Helpers</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Every neighborhood has helpers! Doctors, firefighters, teachers,
          librarians — learn who does what and where to find them.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, fontSize: 30, marginBottom: 20 }}>
          <span title="doctor">👩‍⚕️</span>
          <span title="firefighter">🧑‍🚒</span>
          <span title="police">👮</span>
          <span title="teacher">👩‍🏫</span>
          <span title="librarian">👩‍💼</span>
          <span title="mail carrier">📮</span>
        </div>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a district:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · match helper to their tool</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · where do you go?</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · who should you call?</span>
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
          10 calls per district. Know who to call!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆👮' : stars >= 2 ? '🎉👮' : stars >= 1 ? '👍👮' : '💪👮';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          District complete!
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
            activity="community-helpers"
            activityName="Community Helpers"
            activityEmoji="👮"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>👮 Community Helpers</h1>

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
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
          {question.prompt}
        </p>
        {question.emoji && (
          <div style={{ marginTop: 14, fontSize: 80, lineHeight: 1 }}>
            {question.emoji}
          </div>
        )}
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
        Tip: every helper has a <strong style={{ color: 'var(--accent-blue)' }}>tool</strong> they use and a <strong style={{ color: 'var(--accent-blue)' }}>place</strong> they work!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="community-helpers"
          activityName="Community Helpers"
          activityEmoji="👮"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}