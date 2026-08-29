'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Plural Puzzlers — form and use frequently occurring irregular plural nouns.
// CCSS 2.L.1.b: "Form and use frequently occurring irregular plural nouns
//   (e.g., feet, mice, teeth, children, geese)."
//
// Three difficulty tiers, 10-round heats, streak + best-streak persistence
// (localStorage). Question types rotate: direct (singular → plural),
// reverse (plural → singular), and fill-in (sentence frame).
//   Easy (🌱): regular plurals + a few common irregulars.
//   Medium (🌿): more irregulars (feet, mice, teeth, children, geese, men, women, people).
//   Hard (🌳): irregular plurals in sentence context.

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;
  correct: string;
  choices: string[];
  tier: Difficulty;
  kind: 'direct' | 'reverse' | 'fill';
  singular: string;
  plural: string;
  sentence?: string;
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Singular → plural pairs. Easy mostly regulars + a few classics; Medium
// emphasizes irregulars; Hard uses sentence-context prompts (so the same
// pair can be asked in multiple ways).
const POOL: Record<string, Array<{ singular: string; plural: string }>> = {
  easy: [
    { singular: 'cat',     plural: 'cats' },
    { singular: 'dog',     plural: 'dogs' },
    { singular: 'book',    plural: 'books' },
    { singular: 'fish',    plural: 'fish' },
    { singular: 'bird',    plural: 'birds' },
    { singular: 'tree',    plural: 'trees' },
    { singular: 'car',     plural: 'cars' },
    { singular: 'hat',     plural: 'hats' },
    { singular: 'sock',    plural: 'socks' },
    { singular: 'foot',    plural: 'feet' },
    { singular: 'tooth',   plural: 'teeth' },
    { singular: 'mouse',   plural: 'mice' },
    { singular: 'child',   plural: 'children' },
    { singular: 'baby',    plural: 'babies' },
  ],
  medium: [
    { singular: 'foot',    plural: 'feet' },
    { singular: 'mouse',   plural: 'mice' },
    { singular: 'tooth',   plural: 'teeth' },
    { singular: 'child',   plural: 'children' },
    { singular: 'goose',   plural: 'geese' },
    { singular: 'man',     plural: 'men' },
    { singular: 'woman',   plural: 'women' },
    { singular: 'person',  plural: 'people' },
    { singular: 'ox',      plural: 'oxen' },
    { singular: 'leaf',    plural: 'leaves' },
    { singular: 'wolf',    plural: 'wolves' },
    { singular: 'knife',   plural: 'knives' },
    { singular: 'potato',  plural: 'potatoes' },
    { singular: 'tomato',  plural: 'tomatoes' },
  ],
  hard: [
    { singular: 'mouse',   plural: 'mice' },
    { singular: 'child',   plural: 'children' },
    { singular: 'foot',    plural: 'feet' },
    { singular: 'tooth',   plural: 'teeth' },
    { singular: 'goose',   plural: 'geese' },
    { singular: 'man',     plural: 'men' },
    { singular: 'woman',   plural: 'women' },
    { singular: 'person',  plural: 'people' },
    { singular: 'wolf',    plural: 'wolves' },
    { singular: 'leaf',    plural: 'leaves' },
    { singular: 'knife',   plural: 'knives' },
    { singular: 'ox',      plural: 'oxen' },
    { singular: 'potato',  plural: 'potatoes' },
    { singular: 'tomato',  plural: 'tomatoes' },
    { singular: 'cactus',  plural: 'cacti' },
    { singular: 'fungus',  plural: 'fungi' },
    { singular: 'octopus', plural: 'octopi' },
    { singular: 'deer',    plural: 'deer' },
    { singular: 'sheep',   plural: 'sheep' },
  ],
};

// Optional sentence frames for Hard tier — the blank always appears as ___
const SENTENCES: Record<string, string> = {
  mouse:   'The ___ ran across the kitchen floor.',
  child:   'The ___ were playing at recess.',
  foot:    'My ___ hurt after the long walk.',
  tooth:   'The dentist counted my ___ carefully.',
  goose:   'A flock of ___ flew over the pond.',
  man:     'Three ___ carried the heavy box.',
  woman:   'Two ___ painted the fence blue.',
  person:  'Many ___ waited at the bus stop.',
  wolf:    'A pack of ___ howled at the moon.',
  leaf:    'The autumn ___ crunched under my feet.',
  knife:   'He sharpened his ___ before dinner.',
  ox:      'Two ___ pulled the heavy cart.',
  potato:  'Mashed ___ are my favorite side dish.',
  tomato:  'Red ___ grow in our summer garden.',
  cactus:  'Tall ___ grow in the desert.',
  fungus:  'Tiny ___ grow on the forest floor.',
  octopus: 'Eight ___ live in the reef.',
  deer:    'Five ___ crossed the road at dusk.',
  sheep:   'The fluffy ___ grazed on the hill.',
};

function poolFor(d: Difficulty) {
  return d === 0 ? POOL.easy : d === 1 ? POOL.medium : POOL.hard;
}

function makeChoices(correct: string, allPool: Array<{ singular: string; plural: string }>): string[] {
  const set = new Set<string>([correct]);
  let guard = 0;
  // Pull distractors from across all tiers; dedupe.
  const candidates = Array.from(new Set([
    ...allPool.map(p => p.singular),
    ...allPool.map(p => p.plural),
  ]));
  while (set.size < 4 && guard++ < 60) {
    const v = pick(candidates);
    if (v !== correct) set.add(v);
  }
  const arr = Array.from(set);
  while (arr.length < 4) arr.push(`${correct}-${arr.length}`);
  return shuffled(arr).slice(0, 4);
}

function makeQuestion(difficulty: Difficulty): Question {
  const pool = poolFor(difficulty);
  const allWords = Array.from(new Set([
    ...POOL.easy, ...POOL.medium, ...POOL.hard,
  ].map(p => `${p.singular}|${p.plural}`))).map(s => {
    const [singular, plural] = s.split('|');
    return { singular, plural };
  });
  const item = pick(pool);

  // Pick question type.
  // Easy: ~50% direct, ~25% reverse, ~25% fill
  // Medium: ~40% direct, ~30% reverse, ~30% fill (when fill available)
  // Hard: ~30% direct, ~20% reverse, ~50% fill (always sentence-based)
  let kind: 'direct' | 'reverse' | 'fill';
  const r = Math.random();
  if (difficulty === 0) {
    kind = r < 0.50 ? 'direct' : r < 0.75 ? 'reverse' : 'fill';
  } else if (difficulty === 1) {
    kind = r < 0.40 ? 'direct' : r < 0.70 ? 'reverse' : 'fill';
  } else {
    kind = r < 0.30 ? 'direct' : r < 0.50 ? 'reverse' : 'fill';
  }

  // Build prompt + correct answer per kind.
  let prompt = '';
  let correct = '';
  let sentence: string | undefined;

  if (kind === 'direct') {
    prompt = `What is the plural of "${item.singular}"?`;
    correct = item.plural;
  } else if (kind === 'reverse') {
    prompt = `What is the singular of "${item.plural}"?`;
    correct = item.singular;
  } else {
    const frame = SENTENCES[item.singular] || SENTENCES[item.plural.replace(/s$/, '')] || `I saw two ${item.plural} today.`;
    sentence = frame;
    prompt = frame.replace('___', '___');
    // The correct answer is whatever belongs in the blank. For sentence frames
    // we built using the singular key, the blank holds the singular; for ones
    // keyed by plural, the blank holds the plural.
    if (frame === SENTENCES[item.singular]) {
      correct = item.singular;
    } else {
      correct = item.plural;
    }
  }

  return {
    prompt,
    correct,
    choices: makeChoices(correct, allWords),
    tier: difficulty,
    kind,
    singular: item.singular,
    plural: item.plural,
    sentence,
  };
}

// ─── Audio (synth, no asset deps) ─────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function ding() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function buzz() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.22);
    g.gain.setValueAtTime(0.13, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.26);
    o.start(c.currentTime); o.stop(c.currentTime + 0.28);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.28);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.3);
    });
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
    delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          background: p.color,
          animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function PluralPuzzlers({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0); // # of correctly solved
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);

  // Hydrate best streak
  useEffect(() => {
    try {
      const s = localStorage.getItem('pluralpuzzlers_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
    setScore(0);
    setStreak(0);
    setRound(0);
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
    setScreen('play');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((choice: string) => {
    if (locked) return;
    if (choice === question.correct) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      ding();
      // Save best streak eagerly
      try {
        if (newStreak > bestStreak) {
          localStorage.setItem('pluralpuzzlers_best_streak', String(newStreak));
          setBestStreak(newStreak);
        }
      } catch {}
      setFeedback({
        kind: 'good',
        text: question.kind === 'direct'
          ? `✨ ${question.singular} → ${question.plural} ✅`
          : question.kind === 'reverse'
          ? `✨ ${question.plural} → ${question.singular} ✅`
          : `✨ "${question.correct}" fits perfectly! ✅`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? 'Not quite — try again!'
          : `The answer is "${question.correct}". Keep going!`,
      });
    }
  }, [locked, question, attempts, streak, bestStreak, round, difficulty, nextRound]);

  // Fanfare on results with high score
  useEffect(() => {
    if (screen === 'results' && score >= 70) fanfare();
  }, [screen, score]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🐾</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Plural Puzzlers</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Most plurals just add <strong>-s</strong>. But some words do something <strong>tricky</strong>: one <em>mouse</em> becomes two <em>mice</em>, one <em>foot</em> becomes two <em>feet</em>! Match the right plural to each word.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · regulars + a few classics</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · feet, mice, teeth, children…</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · plurals in sentence context</span>
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
          10 rounds per heat. Score faster by getting it right on the first try!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🐾' : stars >= 1 ? '🎉🐾' : '💪🐾'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
            Heat complete!
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
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="plural-puzzlers"
            activityName="Plural Puzzlers"
            activityEmoji="🐾"
            kidName={kidName || 'friend'}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🐾 Plural Puzzlers</h1>

      {/* Top status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Question card */}
      <div
        style={{
          background: 'white',
          padding: '24px 18px 20px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-purple)',
          marginBottom: 18,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
        }}
      >
        {question.kind === 'fill' && question.sentence ? (
          <p style={{ fontSize: 20, color: 'var(--text-dark)', lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
            {question.sentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{
                    display: 'inline-block',
                    background: 'linear-gradient(180deg, #FEF3C7, #FFD93D)',
                    color: 'var(--accent-orange)',
                    padding: '2px 14px',
                    borderRadius: 8,
                    margin: '0 4px',
                    fontWeight: 700,
                    border: '2px dashed var(--accent-orange)',
                    minWidth: 44,
                  }}>___</span>
                )}
              </span>
            ))}
          </p>
        ) : (
          <p style={{ fontSize: 22, color: 'var(--text-dark)', lineHeight: 1.4, margin: 0, fontWeight: 700 }}>
            {question.prompt}
          </p>
        )}

        {/* Tiny hint chip showing the question kind */}
        <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: 'var(--text-medium)' }}>
          {question.kind === 'direct' && '🟣 singular → plural'}
          {question.kind === 'reverse' && '🟣 plural → singular'}
          {question.kind === 'fill' && '🟣 fill in the blank'}
        </p>
      </div>

      {/* Answer choices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 6,
        maxWidth: 600,
        margin: '0 auto',
      }}>
        {question.choices.map((c, i) => (
          <button
            key={`${c}-${i}`}
            onClick={() => choose(c)}
            disabled={locked}
            className="btn"
            style={{
              fontSize: 26,
              fontWeight: 700,
              padding: '18px 10px',
              background: 'white',
              color: 'var(--accent-purple)',
              border: '3px solid var(--accent-purple)',
              boxShadow: '0 4px 0 #7C3AED',
              cursor: locked ? 'default' : 'pointer',
              opacity: locked ? 0.6 : 1,
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Hints after multiple wrong attempts */}
      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip:{' '}
          {question.kind === 'direct' && <>The plural of <strong>{question.singular}</strong> is irregular — don't just add -s!</>}
          {question.kind === 'reverse' && <>Find the singular of <strong>{question.plural}</strong> — irregular plurals don't follow the usual rule.</>}
          {question.kind === 'fill' && <>Read the whole sentence — what word fits grammatically?</>}
        </p>
      )}

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
            background: feedback.kind === 'good' ? 'var(--accent-purple)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            maxWidth: 540,
            margin: '14px auto 0',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap the word that fits. If you get it wrong, try again — but your streak resets!
      </p>

      {/* Quick rate prompt every 7 correct */}
      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            ⭐ Rate Plural Puzzlers
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="plural-puzzlers"
          activityName="Plural Puzzlers"
          activityEmoji="🐾"
          kidName={kidName || 'friend'}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
