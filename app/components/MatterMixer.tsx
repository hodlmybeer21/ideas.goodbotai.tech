'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Matter Mixer — science game for 2nd grade. Classify items as solid, liquid,
// or gas, and identify state changes.
//   🌱 Easy   (sort items into solid / liquid / gas)
//   🌿 Medium (more items, less obvious examples)
//   🌳 Hard   (state changes: melting, freezing, evaporation, condensation)
// Cross-curricular science. Aligns with NGSS 2-PS1-1: "Plan and conduct an
// investigation to describe and classify different kinds of materials by their
// observable properties." Also ties into K-2 matter strand.

type Difficulty = 0 | 1 | 2;

type State = 'solid' | 'liquid' | 'gas';
type Change = 'melt' | 'freeze' | 'evaporate' | 'condense';

interface Question {
  kind: 'classify' | 'change';
  // For classify: prompt + correct state
  prompt: string;
  visual: string;     // emoji or short label
  correct: State | Change;
  choices: string[];
}

interface Item {
  name: string;
  state: State;
  emoji: string;
}

const ITEMS: Item[] = [
  // Solids (obvious)
  { name: 'ice cube',          state: 'solid',  emoji: '🧊' },
  { name: 'rock',              state: 'solid',  emoji: '🪨' },
  { name: 'book',              state: 'solid',  emoji: '📕' },
  { name: 'apple',             state: 'solid',  emoji: '🍎' },
  { name: 'chair',             state: 'solid',  emoji: '🪑' },
  { name: 'toy car',           state: 'solid',  emoji: '🚗' },
  { name: 'shoe',              state: 'solid',  emoji: '👟' },
  // Liquids
  { name: 'water',             state: 'liquid', emoji: '💧' },
  { name: 'milk',              state: 'liquid', emoji: '🥛' },
  { name: 'juice',             state: 'liquid', emoji: '🧃' },
  { name: 'honey',             state: 'liquid', emoji: '🍯' },
  { name: 'rain',              state: 'liquid', emoji: '🌧️' },
  { name: 'soup',              state: 'liquid', emoji: '🍲' },
  // Gases (clearer examples)
  { name: 'air',               state: 'gas',    emoji: '💨' },
  { name: 'steam',             state: 'gas',    emoji: '♨️' },
  { name: 'helium',            state: 'gas',    emoji: '🎈' },
  { name: 'oxygen',            state: 'gas',    emoji: '🫁' },
  // Less obvious examples (medium/hard)
  { name: 'sand',              state: 'solid',  emoji: '⏳' },
  { name: 'fog',               state: 'gas',    emoji: '🌫️' },
  { name: 'syrup',             state: 'liquid', emoji: '🍁' },
  { name: 'wood',              state: 'solid',  emoji: '🪵' },
];

const CHANGES: { kind: Change; label: string; emoji: string; prompt: string }[] = [
  { kind: 'melt',      label: 'melting',       emoji: '🧊→💧', prompt: 'An ice cube warms up on the table and turns into water. This is called…' },
  { kind: 'freeze',    label: 'freezing',      emoji: '💧→🧊', prompt: 'Water gets very cold in the freezer and becomes ice. This is called…' },
  { kind: 'evaporate', label: 'evaporation',   emoji: '💧→💨', prompt: 'A puddle of water disappears on a hot day as it turns into vapor. This is called…' },
  { kind: 'condense',  label: 'condensation',  emoji: '💨→💧', prompt: 'Water vapor in the air cools down and forms tiny drops on a cold glass. This is called…' },
];

const STATE_LABELS: Record<State, { label: string; emoji: string; color: string }> = {
  solid:  { label: 'solid',  emoji: '🧊', color: 'var(--accent-blue)' },
  liquid: { label: 'liquid', emoji: '💧', color: 'var(--accent-blue)' },
  gas:    { label: 'gas',    emoji: '💨', color: 'var(--accent-purple)' },
};

const CHANGE_LABELS: Record<Change, string> = {
  melt:      'melting',
  freeze:    'freezing',
  evaporate: 'evaporation',
  condense:  'condensation',
};

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1) + lo);
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
  if (difficulty === 0) {
    // Easy: classify items from a smaller, very obvious set
    const easyItems = ITEMS.filter(i =>
      ['ice cube', 'rock', 'book', 'apple', 'chair',
       'water', 'milk', 'juice',
       'air', 'steam'].includes(i.name)
    );
    const item = pick(easyItems);
    const correct: State = item.state;
    const choices = shuffle(['solid', 'liquid', 'gas']);
    return {
      kind: 'classify',
      prompt: `Is "${item.name}" a solid, liquid, or gas?`,
      visual: item.emoji,
      correct,
      choices,
    };
  }
  if (difficulty === 1) {
    // Medium: classify items from full pool
    const item = pick(ITEMS);
    const correct: State = item.state;
    const choices = shuffle(['solid', 'liquid', 'gas']);
    return {
      kind: 'classify',
      prompt: `Is "${item.name}" a solid, liquid, or gas?`,
      visual: item.emoji,
      correct,
      choices,
    };
  }
  // Hard: state change question (60%) or tricky classify (40%)
  if (Math.random() < 0.6) {
    const c = pick(CHANGES);
    const correct: Change = c.kind;
    const choices = shuffle(['melt', 'freeze', 'evaporate', 'condense']);
    return {
      kind: 'change',
      prompt: c.prompt,
      visual: c.emoji,
      correct,
      choices,
    };
  } else {
    // Tricky classify — items that look ambiguous
    const tricky = ITEMS.filter(i => ['sand', 'fog', 'syrup', 'wood', 'rain', 'honey'].includes(i.name));
    const item = pick(tricky);
    const choices = shuffle(['solid', 'liquid', 'gas']);
    return {
      kind: 'classify',
      prompt: `Is "${item.name}" a solid, liquid, or gas?`,
      visual: item.emoji,
      correct: item.state,
      choices,
    };
  }
}

const TOTAL_ROUNDS = 10;

export default function MatterMixer({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('mattermixer_best_streak');
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
      let expl: string;
      if (question.kind === 'classify') {
        const s = STATE_LABELS[question.correct as State];
        expl = `✅ ${question.correct === 'solid' ? 'Solid — keeps its shape!' : question.correct === 'liquid' ? 'Liquid — pours and takes the shape of its container!' : 'Gas — spreads out to fill the space!'} ${s.emoji}`;
      } else {
        expl = `✅ That's ${CHANGE_LABELS[question.correct as Change]}! ${question.correct === 'melt' ? 'Solid → Liquid (warm)' : question.correct === 'freeze' ? 'Liquid → Solid (cold)' : question.correct === 'evaporate' ? 'Liquid → Gas (hot)' : 'Gas → Liquid (cool)'}`;
      }
      setFeedback({ kind: 'good', text: expl });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('mattermixer_best_streak', String(newStreak));
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
      let expl: string;
      if (question.kind === 'classify') {
        const s = STATE_LABELS[question.correct as State];
        expl = `Not quite. ${question.correct === 'solid' ? 'A solid keeps its shape.' : question.correct === 'liquid' ? 'A liquid pours and flows.' : 'A gas spreads out — you usually can\'t see it.'}`;
      } else {
        expl = `Not quite. The correct answer was ${CHANGE_LABELS[question.correct as Change]}.`;
      }
      setFeedback({ kind: 'bad', text: expl });
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🧪</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Matter Mixer</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Everything around us is <strong>matter</strong> — and matter comes in
          three forms: <strong style={{ color: 'var(--accent-blue)' }}>solid</strong>,
          <strong style={{ color: 'var(--accent-blue)' }}> liquid</strong>, and
          <strong style={{ color: 'var(--accent-purple)' }}> gas</strong>. Sort everyday items, then watch matter change!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a lab:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · sort items into solid / liquid / gas</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · trickier items + all 3 states</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · state changes (melting, freezing, evaporation…)</span>
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
          10 rounds per heat. Mix up some science!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🧪' : stars >= 2 ? '🎉🧪' : stars >= 1 ? '👍🧪' : '💪🧪';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
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
            activity="matter-mixer"
            activityName="Matter Mixer"
            activityEmoji="🧪"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🧪 Matter Mixer</h1>

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
        <p style={{ margin: 0, fontSize: 16, color: 'var(--text-dark)' }}>
          {question.prompt}
        </p>

        <div
          style={{
            marginTop: 16,
            display: 'inline-block',
            padding: '16px 24px',
            background: '#F5F0FF',
            border: '2px dashed #C084FC',
            borderRadius: 14,
            fontSize: 72,
            lineHeight: 1,
            minWidth: 120,
            minHeight: 100,
            textAlign: 'center',
          }}
        >
          {question.visual}
        </div>

        {question.kind === 'classify' && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-medium)' }}>
            Think: does it keep its shape, or does it pour/flow/spread?
          </p>
        )}
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {question.choices.map((c, i) => {
          let label: string;
          let emoji: string;
          if (question.kind === 'classify') {
            const s = STATE_LABELS[c as State];
            label = s.label;
            emoji = s.emoji;
          } else {
            label = CHANGE_LABELS[c as Change];
            emoji = '';
          }
          const isCorrect = locked && c === question.correct;
          return (
            <button
              key={i}
              onClick={() => answer(c)}
              disabled={locked}
              className="btn"
              style={{
                background: isCorrect ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
                color: isCorrect ? 'white' : 'var(--text-dark)',
                border: isCorrect ? '3px solid #3D8B47' : '2px solid #E5E0D8',
                fontSize: 18,
                fontWeight: 700,
                padding: '14px 12px',
                borderRadius: 14,
                cursor: locked ? 'default' : 'pointer',
                fontFamily: 'Fredoka, sans-serif',
              }}
            >
              <span style={{ fontSize: 22, marginRight: 6 }}>{emoji}</span>
              {label}
            </button>
          );
        })}
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
            fontSize: 16,
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
        Tip: <strong style={{ color: 'var(--accent-blue)' }}>Solid</strong> = keeps shape. <strong style={{ color: 'var(--accent-blue)' }}>Liquid</strong> = pours. <strong style={{ color: 'var(--accent-purple)' }}>Gas</strong> = spreads in air.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="matter-mixer"
          activityName="Matter Mixer"
          activityEmoji="🧪"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}