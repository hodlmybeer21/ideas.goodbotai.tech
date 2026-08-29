'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Five Senses Lab — body science. Match body parts to senses, identify
// which sense you use for a given stimulus, sort items by sense.
//   🌱 Easy   (which sense: see, hear, smell, taste, touch)
//   🌿 Medium (which body part is used for each sense)
//   🌳 Hard   (multi-step: which senses do you use for X scenario)
// Cross-curricular science. NGSS K-2 body systems strand: "Use observations
// to describe patterns of what plants and animals need to survive."

type Difficulty = 0 | 1 | 2;
type Sense = 'see' | 'hear' | 'smell' | 'taste' | 'touch';

interface Question {
  prompt: string;
  correct: string;
  choices: string[];
  stimulus?: { emoji: string; label: string; sense: Sense };
}

const SENSE_INFO: Record<Sense, { name: string; organ: string; emoji: string; color: string }> = {
  see:    { name: 'sight',   organ: 'eyes',    emoji: '👀', color: 'var(--accent-blue)' },
  hear:   { name: 'hearing', organ: 'ears',    emoji: '👂', color: 'var(--accent-purple)' },
  smell:  { name: 'smell',   organ: 'nose',    emoji: '👃', color: 'var(--accent-orange)' },
  taste:  { name: 'taste',   organ: 'tongue',  emoji: '👅', color: 'var(--accent-pink)' },
  touch:  { name: 'touch',   organ: 'skin',    emoji: '🤚', color: 'var(--accent-green)' },
};

const STIMULI: { emoji: string; label: string; sense: Sense }[] = [
  { emoji: '🌸', label: 'a flower',          sense: 'smell' },
  { emoji: '🍎', label: 'an apple',          sense: 'taste' },
  { emoji: '🎵', label: 'a song',            sense: 'hear' },
  { emoji: '🌞', label: 'the sun',           sense: 'see' },
  { emoji: '🐱', label: 'a soft cat',         sense: 'touch' },
  { emoji: '🍕', label: 'pizza',             sense: 'taste' },
  { emoji: '🔔', label: 'a bell ringing',    sense: 'hear' },
  { emoji: '🌈', label: 'a rainbow',         sense: 'see' },
  { emoji: '🧊', label: 'an ice cube',       sense: 'touch' },
  { emoji: '🍌', label: 'a banana',          sense: 'taste' },
  { emoji: '🌳', label: 'pine trees',        sense: 'smell' },
  { emoji: '🐶', label: 'a dog barking',     sense: 'hear' },
  { emoji: '⭐', label: 'stars at night',    sense: 'see' },
  { emoji: '🍞', label: 'warm bread',        sense: 'touch' },
  { emoji: '🌶️', label: 'spicy food',         sense: 'taste' },
  { emoji: '🌊', label: 'ocean waves',       sense: 'hear' },
  { emoji: '🐑', label: 'a wool sweater',    sense: 'touch' },
  { emoji: '🦋', label: 'a butterfly',       sense: 'see' },
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
    // Easy: which sense do you use for this?
    const stim = pick(STIMULI);
    const correct = SENSE_INFO[stim.sense].name;
    const choices = shuffle(Object.values(SENSE_INFO).map(s => s.name)).slice(0, 4);
    return {
      prompt: `Which sense do you use to experience ${stim.label}?`,
      correct,
      choices,
      stimulus: stim,
    };
  }
  if (difficulty === 1) {
    // Medium: which body part is used for each sense?
    const sense = pick(['see', 'hear', 'smell', 'taste', 'touch'] as Sense[]);
    const correct = SENSE_INFO[sense].organ;
    const wrongOrgans = ['stomach', 'hands', 'feet', 'heart', 'lungs', 'spine', 'brain'];
    const choices = shuffle([correct, ...shuffle(wrongOrgans).slice(0, 3)]).slice(0, 4);
    return {
      prompt: `Which body part helps you with ${SENSE_INFO[sense].name}?`,
      correct,
      choices,
    };
  }
  // Hard: multi-step scenario — pick 2 senses
  const scenario = pick([
    'eating ice cream',
    'watching a fireworks show',
    'petting a fluffy puppy',
    'sniffing fresh-baked cookies',
    'walking through a garden',
  ]);
  const senseMap: Record<string, [Sense, Sense]> = {
    'eating ice cream':        ['taste', 'touch'],
    'watching a fireworks show': ['see', 'hear'],
    'petting a fluffy puppy':   ['touch', 'see'],
    'sniffing fresh-baked cookies': ['smell', 'see'],
    'walking through a garden': ['see', 'smell'],
  };
  const [s1, s2] = senseMap[scenario];
  const correct = `${SENSE_INFO[s1].name} + ${SENSE_INFO[s2].name}`;
  const wrongs = Object.values(SENSE_INFO).filter(s => s.name !== SENSE_INFO[s1].name && s.name !== SENSE_INFO[s2].name);
  const wrongCombos = shuffle(wrongs).slice(0, 2).map(w => `${SENSE_INFO[s1].name} + ${w.name}`);
  const choices = shuffle([correct, ...wrongCombos, `${SENSE_INFO[s1].name} only`]).slice(0, 4);
  return {
    prompt: `When ${scenario}, you use your:`,
    correct,
    choices,
  };
}

const TOTAL_ROUNDS = 10;

export default function FiveSensesLab({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('fivesenseslab_best_streak');
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
            localStorage.setItem('fivesenseslab_best_streak', String(newStreak));
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
        <div style={{ fontSize: 80, marginTop: 12 }}>👁️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Five Senses Lab</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Your body has <strong>five senses</strong>: sight, hearing, smell,
          taste, and touch. Learn what body part helps each one!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 36, marginBottom: 20 }}>
          <span title="sight">👀</span>
          <span title="hearing">👂</span>
          <span title="smell">👃</span>
          <span title="taste">👅</span>
          <span title="touch">🤚</span>
        </div>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a lab experiment:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · which sense do you use?</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · which body part?</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · multi-sense scenarios</span>
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
          10 experiments per lab. Use all your senses!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆👁️' : stars >= 2 ? '🎉👁️' : stars >= 1 ? '👍👁️' : '💪👁️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
          Lab complete!
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
            activity="five-senses-lab"
            activityName="Five Senses Lab"
            activityEmoji="👁️"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>👁️ Five Senses Lab</h1>

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
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
          {question.prompt}
        </p>
        {question.stimulus && (
          <div style={{ marginTop: 14, fontSize: 80, lineHeight: 1 }}>
            {question.stimulus.emoji}
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
        Tip: <strong style={{ color: 'var(--accent-blue)' }}>sight</strong> 👀 · <strong style={{ color: 'var(--accent-purple)' }}>hearing</strong> 👂 · <strong style={{ color: 'var(--accent-orange)' }}>smell</strong> 👃 · <strong style={{ color: 'var(--accent-pink)' }}>taste</strong> 👅 · <strong style={{ color: 'var(--accent-green)' }}>touch</strong> 🤚
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="five-senses-lab"
          activityName="Five Senses Lab"
          activityEmoji="👁️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}