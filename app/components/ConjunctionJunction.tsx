'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Conjunction Junction — use conjunctions (and, but, or, so, because) to
// identify or build compound sentences. Train theme — sentences are train
// cars being linked together by a conjunction "coupler".
//   � Easy   (pick the conjunction in a sentence)
//   🌿 Medium (pick the right conjunction to combine two sentences)
//   🌳 Hard   (rearrange/expand into a complete compound sentence)
// CCSS 2.L.1.f: Produce, expand, and rearrange complete simple and compound
// sentences (e.g., using conjunctions and, but, or, so, because).

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;       // sentence with ___ where the conjunction goes
  correct: string;       // the conjunction
  choices: string[];     // four conjunctions
  hint?: string;         // optional kid-friendly hint
}

const CONJUNCTIONS = ['and', 'but', 'or', 'so', 'because'];

interface PairEntry {
  first: string;
  second: string;
  conjunction: string;
  combined: string;
}

const POOL: Record<Difficulty, PairEntry[]> = {
  0: [
    { first: 'I like cats',      second: 'dogs',         conjunction: 'and',    combined: 'I like cats and dogs.' },
    { first: 'She is tall',      second: 'short',        conjunction: 'but',    combined: 'She is tall but short.' },
    { first: 'Do you want tea',  second: 'coffee',       conjunction: 'or',     combined: 'Do you want tea or coffee?' },
    { first: 'I was hungry',     second: 'I ate lunch',  conjunction: 'so',     combined: 'I was hungry, so I ate lunch.' },
    { first: 'He stayed inside', second: 'it rained',    conjunction: 'because', combined: 'He stayed inside because it rained.' },
    { first: 'We sang songs',    second: 'played games', conjunction: 'and',    combined: 'We sang songs and played games.' },
    { first: 'I tried',          second: 'I failed',     conjunction: 'but',    combined: 'I tried but I failed.' },
    { first: 'Will you walk',    second: 'drive',        conjunction: 'or',     combined: 'Will you walk or drive?' },
  ],
  1: [
    { first: 'I was tired.',           second: 'I went to bed.',   conjunction: 'so',     combined: 'I was tired, so I went to bed.' },
    { first: 'She smiled.',            second: 'She was happy.',   conjunction: 'because', combined: 'She smiled because she was happy.' },
    { first: 'I like red.',            second: 'I like blue.',     conjunction: 'but',    combined: 'I like red, but I like blue.' },
    { first: 'We can go to the park.', second: 'we can stay home.', conjunction: 'or',     combined: 'We can go to the park, or we can stay home.' },
    { first: 'I like cake.',           second: 'I like cookies.',  conjunction: 'and',    combined: 'I like cake and cookies.' },
    { first: 'It snowed.',             second: 'school closed.',   conjunction: 'so',     combined: 'It snowed, so school closed.' },
    { first: 'He ran fast.',           second: 'he missed the bus.', conjunction: 'but',   combined: 'He ran fast, but he missed the bus.' },
    { first: 'I studied hard.',        second: 'I passed the test.', conjunction: 'because', combined: 'I studied hard because I wanted to pass the test.' },
  ],
  2: [
    { first: 'The sun was setting.',   second: 'it was time to go home.', conjunction: 'so',     combined: 'The sun was setting, so it was time to go home.' },
    { first: 'I love art.',            second: 'my favorite class is music.', conjunction: 'but', combined: 'I love art, but my favorite class is music.' },
    { first: 'You can have ice cream.', second: 'you can have cookies.',  conjunction: 'or',     combined: 'You can have ice cream, or you can have cookies.' },
    { first: 'He brought an umbrella.', second: 'he thought it would rain.', conjunction: 'because', combined: 'He brought an umbrella because he thought it would rain.' },
    { first: 'We packed snacks.',      second: 'we packed drinks.',   conjunction: 'and',    combined: 'We packed snacks and drinks.' },
    { first: 'I forgot my lunch.',     second: 'I had to eat at school.', conjunction: 'so',  combined: 'I forgot my lunch, so I had to eat at school.' },
    { first: 'She sings beautifully.', second: 'she dances beautifully.', conjunction: 'and', combined: 'She sings beautifully and dances beautifully.' },
  ],
};

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

function makeQuestion(difficulty: Difficulty): Question {
  const entry = pick(POOL[difficulty]);
  if (difficulty === 0) {
    return {
      prompt: entry.combined,
      correct: entry.conjunction,
      choices: shuffle(CONJUNCTIONS),
      hint: 'Which "glue word" connects the two sentences?',
    };
  }
  if (difficulty === 1) {
    return {
      prompt: `${entry.first} ___ ${entry.second.charAt(0).toLowerCase() + entry.second.slice(1)}`,
      correct: entry.conjunction,
      choices: shuffle(CONJUNCTIONS),
      hint: 'Which conjunction best connects these sentences?',
    };
  }
  // Hard: pick from 4 fully-formed compound sentences (with different conjunctions in different positions)
  const alternatives = ['and', 'but', 'or', 'so', 'because']
    .filter(c => c !== entry.conjunction)
    .slice(0, 3)
    .map(c => `${entry.first} ${c} ${entry.second.charAt(0).toLowerCase() + entry.second.slice(1)}`);
  return {
    prompt: entry.first + ' ___ ' + entry.second.charAt(0).toLowerCase() + entry.second.slice(1),
    correct: entry.combined,
    choices: shuffle([entry.combined, ...alternatives]),
    hint: 'Pick the sentence that makes the most sense.',
  };
}

const TOTAL_ROUNDS = 10;

export default function ConjunctionJunction({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('conjunctionjunction_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ Choo choo! "${question.correct}" is the right "coupler".` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('conjunctionjunction_best_streak', String(newStreak));
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
      setFeedback({ kind: 'bad', text: `Not quite. ${question.hint ?? 'Try another conjunction.'}` });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🚂</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Conjunction Junction</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          <strong>Conjunctions</strong> are glue words that connect sentences:
          <strong style={{ color: 'var(--accent-blue)' }}> and</strong>,
          <strong style={{ color: 'var(--accent-orange)' }}> but</strong>,
          <strong style={{ color: 'var(--accent-purple)' }}> or</strong>,
          <strong style={{ color: 'var(--accent-pink)' }}> so</strong>,
          <strong style={{ color: 'var(--accent-green)' }}> because</strong>. Couple those train cars together!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a coupler:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · find the conjunction in a sentence</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · choose the right conjunction</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · build the complete compound sentence</span>
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
          10 rounds per heat. Build a long train!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🚂' : stars >= 2 ? '🎉🚂' : stars >= 1 ? '👍🚂' : '💪🚂';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Junction complete!
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
            activity="conjunction-junction"
            activityName="Conjunction Junction"
            activityEmoji="�"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>� Conjunction Junction</h1>

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
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          {question.hint ?? 'Pick the right "coupler" word:'}
        </p>

        {/* Sentence with blank */}
        <div
          style={{
            marginTop: 14,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: difficulty === 2 ? 19 : 22,
            lineHeight: 1.6,
            color: 'var(--text-dark)',
            padding: '14px 16px',
            background: '#F0F8FF',
            border: '2px dashed #BDE0FE',
            borderRadius: 12,
          }}
        >
          {question.prompt.split(/(___)/).map((part, i) =>
            part === '___'
              ? <span key={i} style={{ display: 'inline-block', minWidth: 70, padding: '2px 12px', margin: '0 4px', background: 'white', border: '2px solid var(--accent-blue)', borderRadius: 8, color: 'var(--accent-blue)', fontWeight: 700 }}>___</span>
              : <span key={i}>{part}</span>
          )}
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
              fontSize: difficulty === 0 ? 22 : difficulty === 2 ? 16 : 20,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              textAlign: 'left',
              lineHeight: 1.4,
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
        Tip: <strong style={{ color: 'var(--accent-blue)' }}>and</strong> = add, <strong style={{ color: 'var(--accent-orange)' }}>but</strong> = contrast, <strong style={{ color: 'var(--accent-purple)' }}>or</strong> = choice, <strong style={{ color: 'var(--accent-pink)' }}>so</strong> = result, <strong style={{ color: 'var(--accent-green)' }}>because</strong> = reason.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="conjunction-junction"
          activityName="Conjunction Junction"
          activityEmoji="🚂"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
