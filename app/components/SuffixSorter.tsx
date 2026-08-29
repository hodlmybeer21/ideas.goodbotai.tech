'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Suffix Sorter — pick the right suffix to match a sentence clue.
// CCSS 2.L.4.b: know how to add suffixes to base words. We focus on the most
// common 2nd-grade suffixes: -ful, -less, -ly, -er, -est.
// Tiers:
//   Easy: -ful vs -less ("full of X" vs "without X")
//   Medium: add -ly ("in an X way")
//   Hard: add -er / -est ("more X" vs "most X")

type Difficulty = 0 | 1 | 2;

interface SuffixItem {
  root: string;
  suffix: string;
  meaning: string;
  sentence: string;
}

interface Problem {
  item: SuffixItem;
  correctAnswer: string;
  choices: string[];
}

const EASY_POOL: SuffixItem[] = [
  { root: 'joy',   suffix: '-ful',  meaning: 'full of',   sentence: 'She felt ___ after the gift.' },
  { root: 'joy',   suffix: '-less', meaning: 'without',   sentence: 'He looked ___ after his toy broke.' },
  { root: 'hope',  suffix: '-ful',  meaning: 'full of',   sentence: 'The kids were ___ about the trip.' },
  { root: 'hope',  suffix: '-less', meaning: 'without',   sentence: 'It was a ___ winter day.' },
  { root: 'care',  suffix: '-ful',  meaning: 'full of',   sentence: 'Be ___ with the puppy!' },
  { root: 'care',  suffix: '-less', meaning: 'without',   sentence: 'He was ___ and dropped the ball.' },
  { root: 'fear',  suffix: '-ful',  meaning: 'full of',   sentence: 'The movie was ___ — I covered my eyes.' },
  { root: 'fear',  suffix: '-less', meaning: 'without',   sentence: 'The brave knight was ___.' },
  { root: 'help',  suffix: '-ful',  meaning: 'full of',   sentence: 'She was ___ when her friend arrived.' },
  { root: 'harm',  suffix: '-ful',  meaning: 'full of',   sentence: "Don't be ___ to bugs!" },
  { root: 'harm',  suffix: '-less', meaning: 'without',   sentence: 'This toy is ___ — totally safe!' },
  { root: 'kind',  suffix: '-ful',  meaning: 'full of',   sentence: 'The nurse was ___ to everyone.' },
];

const MEDIUM_POOL: SuffixItem[] = [
  { root: 'quick', suffix: '-ly',   meaning: 'in a ___ way', sentence: 'She ran ___ across the field.' },
  { root: 'slow',  suffix: '-ly',   meaning: 'in a ___ way', sentence: 'The turtle moved ___ down the road.' },
  { root: 'soft',  suffix: '-ly',   meaning: 'in a ___ way', sentence: 'He ___ closed the door.' },
  { root: 'loud',  suffix: '-ly',   meaning: 'in a ___ way', sentence: 'The bell rang ___ across the room.' },
  { root: 'happy', suffix: '-ly',   meaning: 'in a ___ way', sentence: 'They ___ skipped down the sidewalk.' },
  { root: 'kind',  suffix: '-ly',   meaning: 'in a ___ way', sentence: 'He ___ shared his snack.' },
  { root: 'joy',   suffix: '-ful',  meaning: 'full of',       sentence: 'A ___ smile lit up her face.' },
  { root: 'help',  suffix: '-less', meaning: 'without',       sentence: "Don't be ___ when a friend is sad." },
];

const HARD_POOL: SuffixItem[] = [
  { root: 'tall',   suffix: '-er',  meaning: 'more',          sentence: 'My brother is ___ than me.' },
  { root: 'tall',   suffix: '-est', meaning: 'most',          sentence: 'The giraffe is the ___ animal in the world.' },
  { root: 'fast',   suffix: '-er',  meaning: 'more',          sentence: 'A bike is ___ than walking.' },
  { root: 'fast',   suffix: '-est', meaning: 'most',          sentence: 'A cheetah is the ___ land animal.' },
  { root: 'soft',   suffix: '-er',  meaning: 'more',          sentence: 'This pillow is ___ than the other one.' },
  { root: 'soft',   suffix: '-est', meaning: 'most',          sentence: 'The kitten had the ___ paws of all.' },
  { root: 'cold',   suffix: '-er',  meaning: 'more',          sentence: 'Today is ___ than yesterday.' },
  { root: 'cold',   suffix: '-est', meaning: 'most',          sentence: 'January is usually the ___ month.' },
  { root: 'warm',   suffix: '-er',  meaning: 'more',          sentence: 'A jacket makes you ___.' },
  { root: 'warm',   suffix: '-est', meaning: 'most',          sentence: 'July is the ___ month in summer.' },
  { root: 'quick',  suffix: '-ly',   meaning: 'in a ___ way',  sentence: 'He answered the question ___.' },
  { root: 'kind',   suffix: '-ful',  meaning: 'full of',      sentence: "A ___ gesture can change someone's day." },
];

const SUFFIX_OPTIONS: Record<string, string[]> = {
  easy:   ['-ful', '-less'],
  medium: ['-ful', '-less', '-ly'],
  hard:   ['-ful', '-less', '-er', '-est', '-ly'],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolFor(d: Difficulty): SuffixItem[] {
  if (d === 0) return EASY_POOL;
  if (d === 1) return MEDIUM_POOL;
  return HARD_POOL;
}
function optsFor(d: Difficulty): string[] {
  if (d === 0) return SUFFIX_OPTIONS.easy;
  if (d === 1) return SUFFIX_OPTIONS.medium;
  return SUFFIX_OPTIONS.hard;
}

function makeProblem(difficulty: Difficulty): Problem {
  const pool = poolFor(difficulty);
  const opts = optsFor(difficulty);
  const item = pick(pool);
  const wrong = opts.filter(s => s !== item.suffix);
  const choices = shuffled([item.suffix, ...shuffled(wrong).slice(0, opts.length - 1)]).slice(0, opts.length);
  return { item, correctAnswer: item.suffix, choices };
}

// ─── Audio ──────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function popSfx() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 988;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.start(c.currentTime); o.stop(c.currentTime + 0.22);
  } catch {}
}
function buzzSfx() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.24);
    o.start(c.currentTime); o.stop(c.currentTime + 0.26);
  } catch {}
}
function cheer() {
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
    id: i, left: `${Math.random() * 100}%`,
    color: colors[i % colors.length], delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color, animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function SuffixSorter({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [problem, setProblem] = useState<Problem>(() => makeProblem(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [round, setRound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('suffixsort_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('suffixsort_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setProblem(makeProblem(d));
    setScore(0); setStreak(0); setRound(0); setAttempts(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setProblem(makeProblem(d));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((suffix: string) => {
    if (locked) return;
    if (suffix === problem.correctAnswer) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      popSfx();
      const full = problem.item.root + suffix.replace('-', '');
      setFeedback({
        kind: 'good',
        text: `${problem.item.root} + ${suffix} = ${full}. Meaning: ${problem.item.meaning}.`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try { if (newStreak > bestStreak) localStorage.setItem('suffixsort_best_streak', String(newStreak)); } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      buzzSfx();
      setStreak(0);
      setAttempts(a => a + 1);
      const full = problem.item.root + problem.item.suffix.replace('-', '');
      setFeedback({
        kind: 'bad',
        text: attempts === 0 ? 'Read the clue again — try once more!'
             : `The answer is ${problem.item.suffix} (makes ${full}, ${problem.item.meaning}).`,
      });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('suffixsort_best_score', String(score)); } catch {}
      if (score >= 60) cheer();
    }
  }, [screen, score, bestScore]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>✏️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Suffix Sorter</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          A <strong>suffix</strong> sticks to the end of a word and changes its meaning! Read the sentence clue and pick the suffix that makes the sentence make sense.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Easy · -ful vs -less</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Medium · add -ly (in a ___ way)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Hard · add -er / -est (more / most)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {(bestStreak > 0 || bestScore > 0) && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best: streak <strong>{bestStreak}</strong> · score <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 suffixes per round. -ful = full of. -less = without. -ly = in a ___ way. -er = more. -est = most.
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
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆✏️' : stars >= 1 ? '🎉✏️' : '💪✏️'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>Sorting complete!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
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
            <button className="btn btn-purple" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="suffix-sorter" activityName="Suffix Sorter" activityEmoji="✏️" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  // ─── GAME ──────────────────────────────────────────────
  const item = problem.item;
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>✏️ Suffix Sorter</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
        Read the clue — which suffix fits?
      </p>

      <div style={{
        background: 'white',
        border: '3px solid var(--accent-purple)',
        borderRadius: 16,
        padding: '18px 22px',
        marginBottom: 14,
        boxShadow: 'var(--shadow)',
        display: 'inline-block',
        maxWidth: 540,
      }}>
        <p style={{ fontSize: 19, color: 'var(--text-dark)', lineHeight: 1.5, margin: 0 }}>
          {item.sentence.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span style={{
                  display: 'inline-block',
                  background: 'linear-gradient(180deg, #FEF3C7, #FFD93D)',
                  color: 'var(--accent-orange)',
                  padding: '2px 12px',
                  borderRadius: 6,
                  margin: '0 4px',
                  fontWeight: 700,
                  border: '2px dashed var(--accent-orange)',
                  minWidth: 32,
                }}>___</span>
              )}
            </span>
          ))}
        </p>
      </div>

      <p style={{ fontSize: 15, color: 'var(--text-medium)', marginBottom: 16 }}>
        Root word:{' '}
        <strong style={{ color: 'var(--accent-blue)' }}>{item.root}</strong>
        {' + '}
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(180deg, #FEF3C7, #FFD93D)',
          color: 'var(--accent-orange)',
          padding: '2px 14px',
          borderRadius: 6,
          fontWeight: 700,
          border: '2px dashed var(--accent-orange)',
        }}>?</span>
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 12, maxWidth: 540, margin: '0 auto',
      }}>
        {problem.choices.map((s, i) => (
          <button key={`${s}-${i}`} onClick={() => choose(s)} disabled={locked} className="btn"
            style={{
              fontSize: 24, fontWeight: 700, padding: '18px 10px',
              background: 'white', color: 'var(--accent-purple)',
              border: '3px solid var(--accent-purple)', boxShadow: '0 4px 0 #7C3AED',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.6 : 1,
              fontFamily: 'Fredoka, sans-serif',
            }}>{s}</button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip: the clue sentence hints at the meaning — <em>{item.meaning}</em>.
        </p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-purple)' : '#FEF3C7',
          color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 540, margin: '14px auto 0',
        }}>{feedback.text}</div>
      )}

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button onClick={() => setShowRating(true)} style={{
            background: 'none', border: 'none', color: 'var(--accent-purple)',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
          }}>⭐ Rate Suffix Sorter</button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="suffix-sorter" activityName="Suffix Sorter" activityEmoji="✏️" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
