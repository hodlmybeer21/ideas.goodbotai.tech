'use client';
import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Audio ─────────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx() {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function playCorrect() {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
}
function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}
function playMilestone() {
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((hz, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.22);
  });
}
function playWin() {
  const ctx = getCtx();
  [523, 659, 784, 1047, 1319].forEach((hz, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.35);
    osc.start(ctx.currentTime + i * 0.13); osc.stop(ctx.currentTime + i * 0.13 + 0.38);
  });
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#6BCB77', '#FFD93D', '#FF9F43', '#FF6B9D', '#C084FC', '#6BCBFF'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.2}s`, size: Math.random() * 8 + 8,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 200 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: p.left, width: p.size, height: p.size * 2,
          background: p.color, borderRadius: 2,
          animation: `confettiFall 1.5s ease-in ${p.delay} forwards`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
type StageId = 'seed' | 'sprout' | 'plant' | 'flower' | 'fruit' | 'seedling';

const STAGES: { id: StageId; label: string; emoji: string; color: string; bg: string; fact: string }[] = [
  { id: 'seed',     label: 'Seed',     emoji: '🌱', color: '#92400E', bg: '#FEF3C7', fact: 'Seeds hold everything a plant needs to start growing — even a giant tree starts as a tiny seed!' },
  { id: 'sprout',   label: 'Sprout',   emoji: '🌿', color: '#166534', bg: '#DCFCE7', fact: 'A sprout has tiny leaves called cotyledons that help the plant make its own food using sunlight!' },
  { id: 'plant',    label: 'Plant',    emoji: '🪴', color: '#15803D', bg: '#BBF7D0', fact: 'Plants use their roots to drink water from the soil, and their leaves to breathe and make food!' },
  { id: 'flower',   label: 'Flower',   emoji: '🌸', color: '#BE185D', bg: '#FCE7F3', fact: 'Flowers are how plants make babies! They use pollen from the stamen to create seeds inside the flower.' },
  { id: 'fruit',    label: 'Fruit',    emoji: '🍎', color: '#DC2626', bg: '#FEE2E2', fact: 'Fruits protect the seeds and help them travel. When animals eat the fruit, they drop seeds somewhere new!' },
  { id: 'seedling', label: 'Seeds',    emoji: '🌾', color: '#6B7280', bg: '#F3F4F6', fact: 'A single apple can have up to 10 seeds — that means one apple could grow 10 new apple trees!' },
];

// All questions with verified correct answers
const QUESTIONS_RAW: {
  type: 'after' | 'before' | 'missing';
  fromStage?: StageId;
  missingStage?: StageId;
  prompt: string;
  correct: StageId;
  wrong: StageId[];
}[] = [
  // AFTER questions
  { type: 'after', fromStage: 'seed',     prompt: 'What comes AFTER the seed?',          correct: 'sprout',   wrong: ['flower', 'plant']    },
  { type: 'after', fromStage: 'sprout',   prompt: 'What comes AFTER the sprout?',        correct: 'plant',    wrong: ['seed', 'fruit']      },
  { type: 'after', fromStage: 'plant',    prompt: 'What comes AFTER the plant?',         correct: 'flower',   wrong: ['seedling', 'sprout'] },
  { type: 'after', fromStage: 'flower',   prompt: 'What comes AFTER the flower?',        correct: 'fruit',    wrong: ['plant', 'seed']      },
  { type: 'after', fromStage: 'fruit',    prompt: 'What comes AFTER the fruit?',         correct: 'seedling', wrong: ['flower', 'sprout']   },
  // BEFORE questions
  { type: 'before', fromStage: 'sprout',  prompt: 'What comes BEFORE the sprout?',       correct: 'seed',     wrong: ['plant', 'fruit']     },
  { type: 'before', fromStage: 'plant',   prompt: 'What comes BEFORE the plant?',        correct: 'sprout',   wrong: ['flower', 'seedling'] },
  { type: 'before', fromStage: 'flower',  prompt: 'What comes BEFORE the flower?',       correct: 'plant',    wrong: ['fruit', 'seed']      },
  { type: 'before', fromStage: 'fruit',   prompt: 'What comes BEFORE the fruit?',        correct: 'flower',   wrong: ['seed', 'sprout']     },
  { type: 'before', fromStage: 'seedling',prompt: 'What comes BEFORE the seeds?',         correct: 'fruit',    wrong: ['plant', 'flower']    },
  // MISSING stage questions
  { type: 'missing', missingStage: 'seed',     prompt: 'Which stage is MISSING from the cycle?', correct: 'seed',     wrong: ['flower', 'plant']    },
  { type: 'missing', missingStage: 'sprout',   prompt: 'Which stage is MISSING from the cycle?', correct: 'sprout',   wrong: ['fruit', 'seed']      },
  { type: 'missing', missingStage: 'plant',    prompt: 'Which stage is MISSING from the cycle?', correct: 'plant',    wrong: ['seedling', 'flower'] },
  { type: 'missing', missingStage: 'flower',   prompt: 'Which stage is MISSING from the cycle?', correct: 'flower',   wrong: ['seed', 'sprout']    },
  { type: 'missing', missingStage: 'fruit',    prompt: 'Which stage is MISSING from the cycle?', correct: 'fruit',    wrong: ['plant', 'seedling']  },
  { type: 'missing', missingStage: 'seedling',prompt: 'Which stage is MISSING from the cycle?', correct: 'seedling', wrong: ['sprout', 'flower']   },
  // Extra AFTER questions
  { type: 'after', fromStage: 'seed',     prompt: 'A seed grows — what does it become?',           correct: 'sprout',   wrong: ['fruit', 'plant']     },
  { type: 'after', fromStage: 'sprout',   prompt: 'A sprout keeps growing. What does it become?',  correct: 'plant',    wrong: ['seed', 'seedling']   },
  { type: 'after', fromStage: 'plant',    prompt: 'After a plant matures, what does it make?',     correct: 'flower',   wrong: ['sprout', 'seedling'] },
  { type: 'after', fromStage: 'flower',   prompt: 'After the flower is pollinated, it turns into?', correct: 'fruit', wrong: ['plant', 'seed']    },
  { type: 'after', fromStage: 'fruit',    prompt: 'The fruit matures and releases its —?',         correct: 'seedling', wrong: ['flower', 'sprout']  },
  // Extra BEFORE questions
  { type: 'before', fromStage: 'plant',   prompt: 'Before it was a plant, it was a?',             correct: 'sprout',   wrong: ['flower', 'seed']     },
  { type: 'before', fromStage: 'fruit',   prompt: 'Before it was a fruit, it was a?',             correct: 'flower',   wrong: ['plant', 'seedling']  },
  { type: 'before', fromStage: 'seedling',prompt: 'Before it was seeds, it was a?',              correct: 'fruit',    wrong: ['plant', 'flower']    },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuestionEntry = {
  type: 'after' | 'before' | 'missing';
  fromStage?: StageId;
  missingStage?: StageId;
  prompt: string;
  choices: StageId[];
  correctIdx: number;
  fact: string;
};

function buildQuestionPool(): QuestionEntry[] {
  return QUESTIONS_RAW.map(q => {
    const factStage = STAGES.find(s => s.id === q.correct)!;
    const choicesRaw = [q.correct, ...q.wrong];
    const shuffled = shuffle(choicesRaw);
    return {
      type: q.type,
      fromStage: q.fromStage,
      missingStage: q.missingStage,
      prompt: q.prompt,
      choices: shuffled,
      correctIdx: shuffled.indexOf(q.correct),
      fact: factStage.fact,
    };
  });
}

// ─── Score HUD ─────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, qNum }: { score: number; streak: number; qNum: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, background: 'white', borderRadius: 16, padding: '10px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{score}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Question</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{qNum}/10</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Streak</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: streak >= 3 ? '#FF9F43' : '#94A3B8', fontFamily: 'Fredoka' }}>{streak >= 3 ? `🔥 ${streak}` : streak}</div>
      </div>
    </div>
  );
}

// ─── Missing Stage Track ────────────────────────────────────────────────────────
function MissingTrack({ missingId }: { missingId: StageId }) {
  const visible = STAGES.filter(s => s.id !== missingId);
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '14px 16px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        {visible.map((def, i) => (
          <div key={def.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 44, height: 44, background: def.bg,
              border: `2px solid ${def.color}`, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {def.emoji}
            </div>
            {i < visible.length - 1 && <div style={{ fontSize: 14, color: '#D1D5DB' }}>→</div>}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#DC2626', fontFamily: 'Fredoka', fontWeight: 600 }}>
        ❓ Which stage is MISSING?
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PlantLifeCycle({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'win'>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [qNum, setQNum] = useState(0);
  const [pool, setPool] = useState<QuestionEntry[]>([]);
  const [current, setCurrent] = useState<QuestionEntry | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(false); // true = showing fact, waiting for Next tap
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const startGame = useCallback(() => {
    const fullPool = buildQuestionPool();
    const selected = shuffle(fullPool).slice(0, 10);
    setPool(selected);
    setQNum(0);
    setScore(0);
    setStreak(0);
    setCurrent(selected[0]);
    setChosenIdx(null);
    setWaiting(false);
    setPhase('playing');
  }, []);

  const advance = useCallback(() => {
    if (qNum + 1 >= 10) {
      playWin();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      setPhase('win');
    } else {
      const next = pool[qNum + 1];
      setCurrent(next);
      setQNum(n => n + 1);
      setChosenIdx(null);
      setWaiting(false);
    }
  }, [qNum, pool]);

  const handleChoice = useCallback((idx: number) => {
    if (chosenIdx !== null || waiting) return;
    const correct = current!.correctIdx;
    setChosenIdx(idx);
    if (idx === correct) {
      playCorrect();
      const ns = streak + 1;
      setStreak(ns);
      setScore(s => s + 1);
      if ((qNum + 1) % 3 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      // Show fact, wait for Next button
    } else {
      playWrong();
      setStreak(0);
      setTimeout(() => { setChosenIdx(null); }, 1200);
    }
  }, [chosenIdx, waiting, current, streak, qNum]);

  // ── MENU ─────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#F0FDF4', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#059669', margin: 0, fontFamily: 'Fredoka' }}>Plant Life Cycle</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px', fontFamily: 'Fredoka' }}>Learn how a seed grows into a plant!</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#059669', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>The Life Cycle 🌻</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {STAGES.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 28 }}>{s.emoji}</div>
                {i < STAGES.length - 1 && <div style={{ fontSize: 14, color: '#D1D5DB' }}>→</div>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.5, margin: 0 }}>
            Seed → Sprout → Plant → Flower → Fruit → Seeds. Then the cycle starts again!
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#059669', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>How to Play 🌱</h3>
          <p style={{ fontSize: 14, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.6, margin: 0 }}>
            🔄 10 questions per game, shuffled every time<br />
            🌿 "What comes AFTER / BEFORE?" questions<br />
            🔍 "Which stage is MISSING?" questions<br />
            💡 Fun facts appear after each correct answer<br />
            ▶️ Tap "Next" when ready to continue<br /><br />
            Good luck, plant scientist! 🌸
          </p>
        </div>

        <button
          onClick={startGame}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #059669, #10B981)',
            border: 'none', borderRadius: 20, padding: '18px 24px', cursor: 'pointer',
            fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: 'white',
            boxShadow: '0 6px 0 #047857',
          }}
        >
          🌱 Start Growing!
        </button>
      </div>
    );
  }

  // ── WIN ─────────────────────────────────────────────────────────────────────
  if (phase === 'win') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#F0FDF4', minHeight: '100vh', textAlign: 'center' }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: 64, marginTop: 40 }}>🌻</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#059669', margin: '16px 0 8px', fontFamily: 'Fredoka' }}>Plant Expert!</h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You scored <strong>{score} / 10</strong>!
        </p>
        <div style={{ fontSize: 32, marginBottom: 28 }}>🌱🌿🪴🌸🍎</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          <button onClick={startGame}
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)', border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: '0 5px 0 #047857' }}>
            🔄 Play Again!
          </button>
          <button onClick={() => setShowRating(true)}
            style={{ background: '#FFD93D', border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#5a4a00', boxShadow: '0 5px 0 #c9a82e' }}>
            ⭐ Rate This Game
          </button>
          <button onClick={() => setPhase('menu')}
            style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Back to Menu
          </button>
        </div>
        {showRating && <RatingModal activity="plant-life-cycle" activityName="Plant Life Cycle" activityEmoji="🌱" kidName="Player" onClose={() => setShowRating(false)} />}
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (!current) return null;

  const fromStageDef = current.fromStage ? STAGES.find(s => s.id === current.fromStage)! : null;
  const correctDef = STAGES.find(s => s.id === current.choices[current.correctIdx])!;
  const showFact = chosenIdx !== null && chosenIdx === current.correctIdx;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#F0FDF4', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <ScoreHUD score={score} streak={streak} qNum={qNum + 1} />

      {/* Question header */}
      <div style={{ background: 'white', borderRadius: 20, padding: '14px 20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#059669', fontFamily: 'Fredoka', fontWeight: 600, marginBottom: 4 }}>
          {current.type === 'after' ? '🌿 What Comes Next?' : current.type === 'before' ? '⏮️ What Comes Before?' : '🔍 Spot the Missing Stage'}
        </div>
        <p style={{ fontSize: 16, color: '#374151', fontFamily: 'Fredoka', margin: 0, fontWeight: 600 }}>{current.prompt}</p>
      </div>

      {/* Stage anchor for before/after questions */}
      {fromStageDef && (
        <div style={{ background: '#DCFCE7', borderRadius: 20, padding: '16px 20px', marginBottom: 16, border: '3px solid #6BCB77', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#166534', fontFamily: 'Fredoka', fontWeight: 600, marginBottom: 8 }}>Start from:</div>
          <div style={{ fontSize: 40, marginBottom: 4 }}>{fromStageDef.emoji}</div>
          <div style={{ fontSize: 14, color: '#166534', fontFamily: 'Fredoka', fontWeight: 700 }}>{fromStageDef.label}</div>
          <div style={{ fontSize: 20, color: '#059669', marginTop: 4 }}>↓</div>
        </div>
      )}

      {/* Missing stage track */}
      {current.type === 'missing' && current.missingStage && (
        <MissingTrack missingId={current.missingStage} />
      )}

      {/* Fun fact + Next button — shown only when answer is correct */}
      {showFact && (
        <div style={{ background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: 20, padding: '18px 20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(5,150,105,0.3)', border: '3px solid #047857' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#A7F3D0', fontFamily: 'Fredoka', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Did you know?</div>
              <p style={{ fontSize: 15, color: 'white', fontFamily: 'Fredoka', margin: 0, lineHeight: 1.5 }}>{current.fact}</p>
            </div>
          </div>
          <button
            onClick={advance}
            style={{
              marginTop: 14, width: '100%', background: 'white', border: 'none', borderRadius: 14,
              padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700,
              fontSize: 16, color: '#059669', boxShadow: '0 4px 0 #047857',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            ▶️ Next Question
          </button>
        </div>
      )}

      {/* Answer choices — disabled once correct answer shown */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {current.choices.map((sid, idx) => {
          const def = STAGES.find(s => s.id === sid)!;
          const isChosen = chosenIdx === idx;
          const isCorrect = idx === current.correctIdx;
          const answered = chosenIdx !== null;
          let bg = def.bg;
          let border = def.color;
          if (answered && isCorrect) { bg = '#86EFAC'; border = '#4fa05c'; }
          if (answered && isChosen && !isCorrect) { bg = '#FCA5A5'; border = '#ef4444'; }
          return (
            <button
              key={sid}
              onClick={() => handleChoice(idx)}
              disabled={answered}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '16px 22px',
                background: isChosen ? bg : def.bg,
                border: `3px solid ${isChosen ? border : def.color}`,
                borderRadius: 16,
                cursor: answered ? 'default' : 'pointer',
                boxShadow: `0 5px 0 ${isChosen ? border : def.color}`,
                minWidth: 100,
              }}
            >
              <div style={{ fontSize: 36 }}>{def.emoji}</div>
              <span style={{ fontSize: 14, fontFamily: 'Fredoka', fontWeight: 600, color: isChosen ? border : def.color }}>{def.label}</span>
            </button>
          );
        })}
      </div>

      {/* Wrong answer hint */}
      {chosenIdx !== null && chosenIdx !== current.correctIdx && (
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, color: '#DC2626', fontFamily: 'Fredoka', fontWeight: 600 }}>
          Not quite! Try the next one! 💪
        </div>
      )}

      <style>{`@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }`}</style>
    </div>
  );
}