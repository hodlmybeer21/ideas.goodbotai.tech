'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Feelings Match — read a short social situation and pick the feeling that fits.
// CASEL-aligned: identifying emotions in self and others. Three tiers widen
// the emotion set as kids get more vocabulary.

type Difficulty = 0 | 1 | 2;

interface Feeling { emoji: string; label: string; }

const FEELINGS: Record<string, Feeling[]> = {
  easy: [
    { emoji: '😊', label: 'happy' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😠', label: 'angry' },
    { emoji: '😨', label: 'scared' },
  ],
  medium: [
    { emoji: '😊', label: 'happy' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😠', label: 'angry' },
    { emoji: '😨', label: 'scared' },
    { emoji: '😲', label: 'surprised' },
    { emoji: '😴', label: 'tired' },
  ],
  hard: [
    { emoji: '😊', label: 'happy' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😠', label: 'angry' },
    { emoji: '😨', label: 'scared' },
    { emoji: '😲', label: 'surprised' },
    { emoji: '😴', label: 'tired' },
    { emoji: '😣', label: 'worried' },
    { emoji: '🤩', label: 'excited' },
  ],
};

interface Scenario {
  text: string;
  answer: string; // emoji of correct feeling
  poolKey: 'easy' | 'medium' | 'hard';
}

const SCENARIOS: Record<string, Scenario[]> = {
  easy: [
    { poolKey: 'easy', text: 'Your friend just gave you a birthday present.', answer: '😊' },
    { poolKey: 'easy', text: 'Your ice cream fell on the ground.', answer: '😢' },
    { poolKey: 'easy', text: 'Someone took your toy without asking.', answer: '😠' },
    { poolKey: 'easy', text: 'You hear a loud thunder crash at night.', answer: '😨' },
    { poolKey: 'easy', text: 'You open a present and find exactly what you wanted!', answer: '😊' },
    { poolKey: 'easy', text: 'Your dog runs away at the park.', answer: '😢' },
    { poolKey: 'easy', text: 'A friend knocks down your block tower on purpose.', answer: '😠' },
    { poolKey: 'easy', text: 'You wake up and it is very dark.', answer: '😨' },
    { poolKey: 'easy', text: 'Your grandma comes to visit.', answer: '😊' },
    { poolKey: 'easy', text: 'Your favorite show is on.', answer: '😊' },
    { poolKey: 'easy', text: 'You lose your favorite stuffed animal.', answer: '😢' },
    { poolKey: 'easy', text: 'You have to go to bed when you are not tired.', answer: '😠' },
    { poolKey: 'easy', text: 'You hear a spooky noise under your bed.', answer: '😨' },
    { poolKey: 'easy', text: 'You get a great big hug from Mom.', answer: '😊' },
  ],
  medium: [
    { poolKey: 'medium', text: 'Your friend has to move to a different town.', answer: '😢' },
    { poolKey: 'medium', text: 'You find a surprise present waiting on your desk.', answer: '😲' },
    { poolKey: 'medium', text: 'You have to take a nap when you are not sleepy.', answer: '😴' },
    { poolKey: 'medium', text: 'Someone shouts "Boo!" behind you.', answer: '😲' },
    { poolKey: 'medium', text: 'You cannot find your socks anywhere!', answer: '😠' },
    { poolKey: 'medium', text: 'The movie ends and it is super happy.', answer: '😊' },
    { poolKey: 'medium', text: 'You stay up way past your bedtime.', answer: '😴' },
    { poolKey: 'medium', text: 'You hear a strange noise in the closet.', answer: '😨' },
    { poolKey: 'medium', text: 'You get the BEST grade on your test.', answer: '🤩' },
    { poolKey: 'medium', text: 'You missed the school bus and have to wait.', answer: '😣' },
    { poolKey: 'medium', text: 'Your pet hamster is hiding and you cannot find it.', answer: '😣' },
    { poolKey: 'medium', text: 'You open a gift box and it is empty.', answer: '😲' },
    { poolKey: 'medium', text: 'Your blanket gets washed and feels different.', answer: '😢' },
    { poolKey: 'medium', text: 'You are going to Disney World tomorrow!', answer: '🤩' },
  ],
  hard: [
    { poolKey: 'hard', text: 'Tomorrow is the last day of summer break.', answer: '😢' },
    { poolKey: 'hard', text: 'You hear someone whisper your name at midnight.', answer: '😨' },
    { poolKey: 'hard', text: 'Your team wins the big game by one point!', answer: '🤩' },
    { poolKey: 'hard', text: 'You are not sure if your test went well.', answer: '😣' },
    { poolKey: 'hard', text: 'Your best friend is sick and cannot come to school.', answer: '😢' },
    { poolKey: 'hard', text: 'Someone gives you a HUGE surprise birthday party.', answer: '😲' },
    { poolKey: 'hard', text: 'You have three things to do and only 10 minutes.', answer: '😣' },
    { poolKey: 'hard', text: 'You fall asleep in the car after a long day.', answer: '😴' },
    { poolKey: 'hard', text: 'You see a popping balloon before everyone else.', answer: '😲' },
    { poolKey: 'hard', text: 'You cannot remember where you put your homework.', answer: '😣' },
    { poolKey: 'hard', text: 'You get the toy you have wanted for months.', answer: '🤩' },
    { poolKey: 'hard', text: 'Your friend tells you they are moving next month.', answer: '😢' },
  ],
};

interface Round {
  scenario: Scenario;
  choices: Feeling[];
  correct: Feeling;
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

function poolFor(d: Difficulty): Feeling[] {
  if (d === 0) return FEELINGS.easy;
  if (d === 1) return FEELINGS.medium;
  return FEELINGS.hard;
}
function scenariosFor(d: Difficulty): Scenario[] {
  if (d === 0) return SCENARIOS.easy;
  if (d === 1) return SCENARIOS.medium;
  return SCENARIOS.hard;
}

function makeRound(d: Difficulty): Round {
  const scenarios = scenariosFor(d);
  const feelingPool = poolFor(d);
  const scenario = pick(scenarios);
  const correct = feelingPool.find(f => f.emoji === scenario.answer) || feelingPool[0];
  const others = feelingPool.filter(f => f.emoji !== correct.emoji);
  const choices = shuffled([correct, ...shuffled(others).slice(0, 3)]).slice(0, 4);
  return { scenario, choices, correct };
}

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function heartChime() {
  try {
    const c = ctx();
    [659, 880].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.05 + 0.3);
      o.start(c.currentTime + i * 0.05); o.stop(c.currentTime + i * 0.05 + 0.32);
    });
  } catch {}
}
function thud() {
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
function cheer() {
  try {
    const c = ctx();
    [523, 659, 784, 988, 1319].forEach((f, i) => {
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

const TOTAL_ROUNDS = 8;

export default function FeelingsMatch({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [round, setRound] = useState<Round>(() => makeRound(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'try'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('feelings_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('feelings_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setRound(makeRound(d));
    setScore(0); setStreak(0); setRoundCount(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setRound(makeRound(d));
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((f: Feeling) => {
    if (locked) return;
    if (f.emoji === round.correct.emoji) {
      const newStreak = streak + 1;
      setScore(s => s + 10);
      setStreak(newStreak);
      setRoundCount(c => c + 1);
      setLocked(true);
      heartChime();
      setFeedback({
        kind: 'good',
        text: `Yes — ${f.label}. ${round.correct.emoji} You're great at noticing feelings!`,
      });
      const isLast = roundCount + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) localStorage.setItem('feelings_best_streak', String(newStreak));
        } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1500);
    } else {
      thud();
      setStreak(0);
      setFeedback({
        kind: 'try',
        text: `Hmm — that was ${f.label}. The feelings in this one were ${round.correct.label}. Keep trying!`,
      });
    }
  }, [locked, round, streak, bestStreak, roundCount, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('feelings_best_score', String(score)); } catch {}
      if (score >= 50) cheer();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🤝</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Feelings Match</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Read the little story and pick the <strong>feeling</strong> that fits. Everyone feels happy, sad, scared, and surprised — knowing how to spot a feeling is a super skill!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a level:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 4 feelings (happy, sad, angry, scared)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 6 feelings (adds surprised, tired)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · 8 feelings (adds worried, excited)</span>
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
          8 scenarios per round. There are no wrong answers here — every feeling is real!
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
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>You noticed every feeling!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Play Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-primary" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="feelings-match" activityName="Feelings Match" activityEmoji="🤝" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🤝 Feelings Match</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{roundCount + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{
        background: 'linear-gradient(180deg, #FFF8F0, #FEF3C7)',
        border: '3px solid var(--accent-yellow)',
        borderRadius: 18,
        padding: '24px 22px',
        marginBottom: 22,
        boxShadow: 'var(--shadow)',
        maxWidth: 560, margin: '0 auto 22px',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-medium)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
          How does this person feel?
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', margin: 0, lineHeight: 1.4 }}>
          {round.scenario.text}
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, maxWidth: 560, margin: '0 auto',
      }}>
        {round.choices.map((f, i) => (
          <button key={`${f.emoji}-${i}`} onClick={() => choose(f)} disabled={locked} className="btn"
            style={{
              fontSize: 38,
              padding: '20px 10px',
              background: 'white',
              border: '3px solid #E5E0D8', boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.7 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
            <span style={{ fontSize: 44, lineHeight: 1 }}>{f.emoji}</span>
            <span style={{ fontSize: 13, color: 'var(--text-medium)', fontWeight: 600, textTransform: 'lowercase' }}>
              {f.label}
            </span>
          </button>
        ))}
      </div>

      {feedback && (
        <div style={{
          marginTop: 18, padding: '12px 18px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 17,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
          color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 560, margin: '18px auto 0',
        }}>{feedback.text}</div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        💡 Notice how the words and what just happened can tell you how someone feels.
      </p>

      {showRating && !rated && (
        <RatingModal activity="feelings-match" activityName="Feelings Match" activityEmoji="🤝" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
