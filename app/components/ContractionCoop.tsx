'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Contraction Co-op — pair up two source words to form a contraction.
// CCSS 2.L.2.b: "Use apostrophes to form contractions." Tiers go:
//   Easy: -n't (don't, isn't, aren't, can't, won't, doesn't, didn't)
//   Medium: 'm / 're / 's (= "is" or "us") (I'm, you're, let's, it's, he's...)
//   Hard: 'll / 've / 'd (I'll, we've, she'd, I'd...)

type Difficulty = 0 | 1 | 2;

interface Contraction {
  words: [string, string];
  result: string;
}

const POOL: Record<string, Contraction[]> = {
  easy: [
    { words: ['do', 'not'], result: "don't" },
    { words: ['is', 'not'], result: "isn't" },
    { words: ['are', 'not'], result: "aren't" },
    { words: ['can', 'not'], result: "can't" },
    { words: ['will', 'not'], result: "won't" },
    { words: ['does', 'not'], result: "doesn't" },
    { words: ['did', 'not'], result: "didn't" },
    { words: ['has', 'not'], result: "hasn't" },
    { words: ['have', 'not'], result: "haven't" },
  ],
  medium: [
    { words: ['I', 'am'], result: "I'm" },
    { words: ['you', 'are'], result: "you're" },
    { words: ['we', 'are'], result: "we're" },
    { words: ['they', 'are'], result: "they're" },
    { words: ['it', 'is'], result: "it's" },
    { words: ['he', 'is'], result: "he's" },
    { words: ['she', 'is'], result: "she's" },
    { words: ['let', 'us'], result: "let's" },
    { words: ['what', 'is'], result: "what's" },
    { words: ['that', 'is'], result: "that's" },
  ],
  hard: [
    { words: ['I', 'will'], result: "I'll" },
    { words: ['we', 'will'], result: "we'll" },
    { words: ['you', 'will'], result: "you'll" },
    { words: ['they', 'will'], result: "they'll" },
    { words: ['she', 'will'], result: "she'll" },
    { words: ['I', 'have'], result: "I've" },
    { words: ['we', 'have'], result: "we've" },
    { words: ['you', 'have'], result: "you've" },
    { words: ['they', 'have'], result: "they've" },
    { words: ['I', 'would'], result: "I'd" },
    { words: ['you', 'would'], result: "you'd" },
    { words: ['they', 'would'], result: "they'd" },
  ],
};

interface Problem {
  contraction: Contraction;
  mode: 'build' | 'split';   // build: words → result.  split: result → words.
  prompt: string;            // shown above the choices
  correctAnswer: string;     // canonical answer string for grading
  choices: string[];         // 4 multiple choice options
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function flatten(c: Contraction): string {
  return `${c.words[0]} + ${c.words[1]}`; // unique per contraction
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeProblem(difficulty: Difficulty): Problem {
  const key = difficulty === 0 ? 'easy' : difficulty === 1 ? 'medium' : 'hard';
  const pool = POOL[key];
  const target = pick(pool);
  const mode: 'build' | 'split' = Math.random() < 0.5 ? 'build' : 'split';

  if (mode === 'build') {
    // words → contraction
    const correctAnswer = target.result;
    const others = pool.filter(p => p.result !== correctAnswer).map(p => p.result);
    const choices = shuffled([correctAnswer, ...shuffled(others).slice(0, 3)]).slice(0, 4);
    return {
      contraction: target, mode,
      prompt: `What contraction does "${target.words[0]} ${target.words[1]}" make?`,
      correctAnswer, choices,
    };
  }
  // split: contraction → words
  const correctAnswer = flatten(target);
  const others = pool.filter(p => flatten(p) !== correctAnswer).map(p => flatten(p));
  const choices = shuffled([correctAnswer, ...shuffled(others).slice(0, 3)]).slice(0, 4);
  return {
    contraction: target, mode,
    prompt: `Which two words make "${target.result}"?`,
    correctAnswer, choices,
  };
}

function makeChoicesFix(correct: string, others: string[]): string[] {
  // Defensive: pad/trim to exactly 4 unique choices
  const set = new Set<string>([correct]);
  for (const o of others) if (!set.has(o)) set.add(o);
  while (set.size < 4) set.add(`__filler_${set.size}`);
  return shuffled(Array.from(set)).slice(0, 4);
}

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
    o.type = 'sine'; o.frequency.value = 988;
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
    o.type = 'square';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 988, 1319].forEach((f, i) => {
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

export default function ContractionCoop({ onBack, kidName }: { onBack: () => void; kidName: string }) {
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
      const s = localStorage.getItem('contraction_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('contraction_best_score');
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
      ding();
      const c = problem.contraction;
      setFeedback({
        kind: 'good',
        text: problem.mode === 'build'
          ? `🤝 ${c.words[0]} ${c.words[1]} → ${c.result} ✅`
          : `🤝 ${c.result} = ${c.words[0]} ${c.words[1]} ✅`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try { if (newStreak > bestStreak) localStorage.setItem('contraction_best_streak', String(newStreak)); } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1300);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      const c = problem.contraction;
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? 'Not quite — try again!'
          : `The answer is "${problem.mode === 'build' ? c.result : `${c.words[0]} + ${c.words[1]}`}". Keep going!`,
      });
    }
  }, [locked, problem, attempts, streak, bestStreak, round, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('contraction_best_score', String(score)); } catch {}
      if (score >= 60) fanfare();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🤝</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Contraction Co-op</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          When two words come together, the missing letters get replaced by an <strong>apostrophe</strong>! Sometimes we <strong>build</strong> contractions, sometimes we <strong>split</strong> them back apart.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · -n't (don't, isn't, can't)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🤝 Medium · 'm / 're / 's (I'm, you're, let's)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔍 Hard · 'll / 've / 'd (I'll, we've, she'd)</span>
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
          10 contractions per round. Half the time you'll build, half you'll split!
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
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🤝' : stars >= 1 ? '🎉🤝' : '💪🤝'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>Teamwork pays off!</h1>
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
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Play Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-purple" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="contraction-coop" activityName="Contraction Co-op" activityEmoji="🤝" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  const c = problem.contraction;
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🤝 Contraction Co-op</h1>

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

      {/* Word-tray visual: two source word cards if building, single contraction card if splitting */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 12, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {problem.mode === 'build' ? (
          <>
            <WordChip text={c.words[0]} color="var(--accent-blue)" />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-orange)' }}>+</span>
            <WordChip text={c.words[1]} color="var(--accent-pink)" />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-medium)' }}>→</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
          </>
        ) : (
          <>
            <WordChip text={c.result} color="var(--accent-purple)" />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-medium)' }}>→</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-medium)' }}>+</span>
            <WordChip text="?" color="var(--accent-yellow)" pulse />
          </>
        )}
      </div>

      {/* Choices */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, maxWidth: 540, margin: '0 auto',
      }}>
        {problem.choices.map((c, i) => (
          <button key={`${c}-${i}`} onClick={() => choose(c)} disabled={locked} className="btn"
            style={{
              fontSize: 22, fontWeight: 700, padding: '16px 8px',
              background: 'white', color: 'var(--text-dark)',
              border: '3px solid #E5E0D8', boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.6 : 1,
              fontFamily: 'Fredoka, sans-serif',
            }}>{c.replace(' + ', ' + ')}</button>
        ))}
      </div>

      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Tip: contractions always swap the missing letters for a single apostrophe. <em>do not → don't</em>.
        </p>
      )}

      {feedback && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
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
          }}>⭐ Rate Contraction Co-op</button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="contraction-coop" activityName="Contraction Co-op" activityEmoji="🤝" kidName={kidName}
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
      padding: '14px 22px',
      fontSize: 30, fontWeight: 700,
      boxShadow: `0 4px 0 ${color}66`,
      animation: pulse ? 'pop 0.4s ease' : 'none',
      minWidth: 64, textAlign: 'center',
    }}>{text}</div>
  );
}
