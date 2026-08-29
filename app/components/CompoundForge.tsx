'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Compound Word Forge — combine two smaller words into a compound word.
// CCSS 2.L.4.d: "Use knowledge of the meaning of individual words to predict
// the meaning of compound words." Tiers go from familiar everyday compounds
// to less-common / longer ones, including the multi-syllable grand- words.

type Difficulty = 0 | 1 | 2;

interface Compound {
  a: string;
  b: string;
  whole: string;
}

const POOL: Record<string, Compound[]> = {
  easy: [
    { a: 'sun', b: 'flower', whole: 'sunflower' },
    { a: 'rain', b: 'bow', whole: 'rainbow' },
    { a: 'star', b: 'fish', whole: 'starfish' },
    { a: 'cup', b: 'cake', whole: 'cupcake' },
    { a: 'snow', b: 'man', whole: 'snowman' },
    { a: 'bed', b: 'room', whole: 'bedroom' },
    { a: 'dog', b: 'house', whole: 'doghouse' },
    { a: 'foot', b: 'ball', whole: 'football' },
    { a: 'back', b: 'pack', whole: 'backpack' },
    { a: 'bath', b: 'room', whole: 'bathroom' },
    { a: 'air', b: 'plane', whole: 'airplane' },
    { a: 'blue', b: 'berry', whole: 'blueberry' },
    { a: 'home', b: 'work', whole: 'homework' },
    { a: 'base', b: 'ball', whole: 'baseball' },
    { a: 'day', b: 'time', whole: 'daytime' },
  ],
  medium: [
    { a: 'tooth', b: 'brush', whole: 'toothbrush' },
    { a: 'rain', b: 'coat', whole: 'raincoat' },
    { a: 'basket', b: 'ball', whole: 'basketball' },
    { a: 'butter', b: 'fly', whole: 'butterfly' },
    { a: 'water', b: 'fall', whole: 'waterfall' },
    { a: 'mail', b: 'box', whole: 'mailbox' },
    { a: 'pop', b: 'corn', whole: 'popcorn' },
    { a: 'class', b: 'room', whole: 'classroom' },
    { a: 'sun', b: 'shine', whole: 'sunshine' },
    { a: 'eye', b: 'ball', whole: 'eyeball' },
    { a: 'door', b: 'bell', whole: 'doorbell' },
    { a: 'side', b: 'walk', whole: 'sidewalk' },
    { a: 'pan', b: 'cake', whole: 'pancake' },
    { a: 'play', b: 'ground', whole: 'playground' },
    { a: 'book', b: 'mark', whole: 'bookmark' },
  ],
  hard: [
    { a: 'grand', b: 'mother', whole: 'grandmother' },
    { a: 'grand', b: 'father', whole: 'grandfather' },
    { a: 'grand', b: 'parents', whole: 'grandparents' },
    { a: 'mean', b: 'while', whole: 'meanwhile' },
    { a: 'how', b: 'ever', whole: 'however' },
    { a: 'any', b: 'way', whole: 'anyway' },
    { a: 'any', b: 'thing', whole: 'anything' },
    { a: 'every', b: 'one', whole: 'everyone' },
    { a: 'some', b: 'where', whole: 'somewhere' },
    { a: 'any', b: 'where', whole: 'anywhere' },
    { a: 'over', b: 'whelm', whole: 'overwhelm' },
    { a: 'earth', b: 'quake', whole: 'earthquake' },
    { a: 'news', b: 'paper', whole: 'newspaper' },
    { a: 'rain', b: 'storm', whole: 'rainstorm' },
  ],
};

interface Problem {
  target: Compound;
  mode: 'forge' | 'split';
  prompt: string;
  correctAnswer: string;
  choices: string[];
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

function makeProblem(difficulty: Difficulty): Problem {
  const pool = POOL[
    difficulty === 0 ? 'easy' : difficulty === 1 ? 'medium' : 'hard'
  ];
  const target = pick(pool);
  const mode: 'forge' | 'split' = Math.random() < 0.5 ? 'forge' : 'split';

  if (mode === 'forge') {
    const correctAnswer = target.whole;
    const otherWholes = pool.filter(p => p.whole !== correctAnswer).map(p => p.whole);
    const choices = shuffled([correctAnswer, ...shuffled(otherWholes).slice(0, 3)]).slice(0, 4);
    return { target, mode, prompt: `Forge these into a compound word:`, correctAnswer, choices };
  }
  // split
  const correctAnswer = `${target.a} + ${target.b}`;
  const others = pool.filter(p => `${p.a} + ${p.b}` !== correctAnswer).map(p => `${p.a} + ${p.b}`);
  const choices = shuffled([correctAnswer, ...shuffled(others).slice(0, 3)]).slice(0, 4);
  return { target, mode, prompt: `Split this compound into two parts:`, correctAnswer, choices };
}

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function anvil() {
  try {
    const c = ctx();
    [660, 880].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.18);
      o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.2);
    });
  } catch {}
}
function buzz() {
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
function fanfare() {
  try {
    const c = ctx();
    [392, 523, 659, 784, 988].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
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

export default function CompoundForge({ onBack, kidName }: { onBack: () => void; kidName: string }) {
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
      const s = localStorage.getItem('compound_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('compound_best_score');
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

  const choose = useCallback((choice: string) => {
    if (locked) return;
    if (choice === problem.correctAnswer) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      anvil();
      const t = problem.target;
      setFeedback({
        kind: 'good',
        text: problem.mode === 'forge'
          ? `⚒️ ${t.a} + ${t.b} = ${t.whole} ✅`
          : `⚒️ ${t.whole} = ${t.a} + ${t.b} ✅`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try { if (newStreak > bestStreak) localStorage.setItem('compound_best_streak', String(newStreak)); } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      const t = problem.target;
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? 'Try again — look at the two parts!'
          : `The answer is "${problem.mode === 'forge' ? t.whole : `${t.a} + ${t.b}`}". Keep going!`,
      });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('compound_best_score', String(score)); } catch {}
      if (score >= 60) fanfare();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>⚒️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Compound Word Forge</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          A <strong>compound word</strong> is two smaller words hammered together to make a brand-new word! Mix <strong>forging</strong> two halves into one, and <strong>splitting</strong> them apart.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-orange" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌻 Easy · everyday compounds (sun + flower)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🦋 Medium · longer compounds</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧓 Hard · multi-syllable (grand-, every-, any-)</span>
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
          10 compounds per round. If you know the meaning of each part, you can guess the whole!
        </p>
      </div>
    );
  }

  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆⚒️' : stars >= 1 ? '🎉⚒️' : '💪⚒️'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>Forge complete!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>

          {!rated && score >= 50 && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Forge Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-orange" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="compound-forge" activityName="Compound Word Forge" activityEmoji="⚒️" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  const t = problem.target;
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>⚒️ Compound Word Forge</h1>

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
        {problem.prompt}
      </p>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 14, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {problem.mode === 'forge' ? (
          <>
            <WordChip text={t.a} color="var(--accent-blue)" />
            <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-orange)' }}>⚒️</span>
            <WordChip text={t.b} color="var(--accent-pink)" />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-medium)' }}>=</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
          </>
        ) : (
          <>
            <WordChip text={t.whole} color="var(--accent-purple)" />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-medium)' }}>=</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-orange)' }}>+</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
          </>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, maxWidth: 540, margin: '0 auto',
      }}>
        {problem.choices.map((c, i) => (
          <button key={`${c}-${i}`} onClick={() => choose(c)} disabled={locked} className="btn"
            style={{
              fontSize: 22, fontWeight: 700, padding: '16px 10px',
              background: 'white', color: 'var(--text-dark)',
              border: '3px solid #E5E0D8', boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.6 : 1,
              fontFamily: 'Fredoka, sans-serif',
            }}>{c}</button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip: a compound word keeps the meaning of each part. <em>sun (yellow ball in sky) + flower (pretty plant) = sunflower</em>.
        </p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-orange)' : '#FEF3C7',
          color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 540, margin: '14px auto 0',
        }}>{feedback.text}</div>
      )}

      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button onClick={() => setShowRating(true)} style={{
            background: 'none', border: 'none', color: 'var(--accent-orange)',
            cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
          }}>⭐ Rate Compound Forge</button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="compound-forge" activityName="Compound Word Forge" activityEmoji="⚒️" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}

function WordChip({ text, color, pulse }: { text: string; color: string; pulse?: boolean }) {
  return (
    <div style={{
      fontFamily: 'Fredoka, sans-serif',
      background: 'white', color,
      border: `3px solid ${color}`,
      borderRadius: 14,
      padding: '12px 18px',
      fontSize: 26, fontWeight: 700,
      boxShadow: `0 4px 0 ${color}66`,
      animation: pulse ? 'pop 0.4s ease' : 'none',
      minWidth: 60, textAlign: 'center',
    }}>{text}</div>
  );
}
