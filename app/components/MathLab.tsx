'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import RatingModal from './RatingModal';

// ─── Audio helpers ───────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playCorrect() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
}

function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}

function playMilestone() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.18);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.2);
  });
}

// ─── Confetti ────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 0.6}s`,
    size: Math.random() * 8 + 8,
    rotation: Math.random() * 360,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 100 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: p.left,
            width: p.size,
            height: p.size * 2,
            background: p.color,
            borderRadius: 2,
            animation: `confettiFall 1.2s ease-in ${p.delay} forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Pressable card button ────────────────────────────────────────────────────
function CardBtn({ label, emoji, color, shadow, onTap, subtitle }: {
  label: string; emoji: string; color: string; shadow: string;
  onTap: () => void; subtitle?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: color, border: 'none', borderRadius: 20, padding: '24px 16px',
        cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 6px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        minHeight: 120, minWidth: 120,
      }}
    >
      <span style={{ fontSize: 36 }}>{emoji}</span>
      <span>{label}</span>
      {subtitle && <span style={{ fontSize: 11, opacity: 0.8 }}>{subtitle}</span>}
    </button>
  );
}

// ─── Choice button ─────────────────────────────────────────────────────────────
function ChoiceBtn({ value, onTap, color, shadow, disabled }: {
  value: number | string; onTap: () => void; color: string; shadow: string; disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      style={{
        background: disabled ? '#E5E0D8' : color,
        border: 'none', borderRadius: 16, padding: '16px 20px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Fredoka', fontWeight: 700, fontSize: 28, color: disabled ? '#94A3B8' : 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 5px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        minWidth: 80, minHeight: 64,
      }}
    >
      {value}
    </button>
  );
}

// ─── Score HUD ────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, bestStreak }: {
  score: number; streak: number; bestStreak: number;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20,
      background: '#FFF8F0', borderRadius: 16, padding: '10px 20px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B9D', fontFamily: 'Fredoka' }}>{score}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Streak</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: streak >= 3 ? '#FF9F43' : '#94A3B8', fontFamily: 'Fredoka' }}>
          {streak >= 3 ? `🔥 ${streak}` : streak}
        </div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Best</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{bestStreak}</div>
      </div>
    </div>
  );
}

// ─── Mini-game: Number Bonds ───────────────────────────────────────────────────
type BondsProblem = { a: number; b: number; missing: 'left' | 'right' };

function genBondsProblem(level: number): BondsProblem {
  const maxSum = Math.min(10, 5 + level);
  const sum = Math.floor(Math.random() * (maxSum - 4)) + 5;
  const a = Math.floor(Math.random() * (sum - 1)) + 1;
  const b = sum - a;
  const missing = Math.random() < 0.5 ? 'left' : 'right';
  return { a, b, missing };
}

function genChoices(correct: number, _level: number): number[] {
  // Guarantee 4 unique choices with no infinite loop.
  // Strategy: correct + nearby in-bounds + fill from remaining ints.
  const choices = new Set<number>([correct]);

  // Nearby wrong answers (always in bounds since correct ∈ [0,10])
  const offsets = [-2, -1, 1, 2, 3, 4, -3, -4];
  for (const offset of offsets) {
    const c = correct + offset;
    if (c >= 0 && c <= 10 && c !== correct) choices.add(c);
    if (choices.size >= 4) break;
  }

  // Fill remaining with any other in-bounds integers
  if (choices.size < 4) {
    for (let c = 0; c <= 10 && choices.size < 4; c++) {
      if (c !== correct) choices.add(c);
    }
  }

  const result = Array.from(choices);
  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function NumberBonds({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) {
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState<BondsProblem>(() => genBondsProblem(1));
  const [choices, setChoices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  const initProblem = useCallback((lvl: number) => {
    const p = genBondsProblem(lvl);
    const correct = p.missing === 'left' ? p.a : p.b;
    setProblem(p);
    setChoices(genChoices(correct, lvl));
    setFeedback(null);
    setWrongAnswer(null);
    setQuestionKey(k => k + 1);
  }, []);

  useEffect(() => { initProblem(1); }, [initProblem]);

  const handleAnswer = useCallback((ans: number) => {
    const correct = problem.missing === 'left' ? problem.a : problem.b;
    if (ans === correct) {
      playCorrect();
      const newStreak = streak + 1;
      const newScore = score + 1;
      setStreak(newStreak);
      setScore(newScore);
      onScore(newScore);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      const isMilestone = newScore % 5 === 0;
      if (isMilestone) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      const newLvl = newStreak >= 3 && newStreak % 3 === 0 ? Math.min(5, level + 1) : level;
      setLevel(newLvl);
      setFeedback('correct');
      setTimeout(() => initProblem(newLvl), 800);
    } else {
      playWrong();
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setWrongAnswer(ans);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongAnswer(null); }, 1000);
    }
  }, [problem, streak, score, bestStreak, level, onScore, initProblem]);

  const correct = problem.missing === 'left' ? problem.a : problem.b;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <Confetti active={showConfetti} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>🧮 Number Bonds</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>Fill in the missing number!</p>
      </div>

      <ScoreHUD score={score} streak={streak} bestStreak={bestStreak} />

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          fontSize: 13, background: '#E8F4FD', borderRadius: 8, padding: '4px 12px',
          display: 'inline-block', marginBottom: 16, fontFamily: 'Fredoka', color: '#6BCBFF',
        }}>Level {level} · Sum {5 + level} to {10}</div>

        <div
          key={questionKey}
          style={{
            background: 'white', borderRadius: 24, padding: '32px 24px', marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {problem.missing === 'left' ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', border: '4px solid #FF6B9D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, fontWeight: 700, fontFamily: 'Fredoka', color: '#FF6B9D',
                  animation: feedback === 'correct' ? 'pulse 0.3s ease' : 'none',
                }}>
                  {feedback === 'correct' ? correct : '?'}
                </div>
                <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>+</span>
                <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>{problem.b}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>{problem.a}</span>
                <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>+</span>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', border: '4px solid #FF6B9D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, fontWeight: 700, fontFamily: 'Fredoka', color: '#FF6B9D',
                  animation: feedback === 'correct' ? 'pulse 0.3s ease' : 'none',
                }}>
                  {feedback === 'correct' ? correct : '?'}
                </div>
              </>
            )}
            <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>=</span>
            <span style={{ fontSize: 48, fontWeight: 700, fontFamily: 'Fredoka', color: '#2D3748' }}>{problem.a + problem.b}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {choices.map(choice => (
            <ChoiceBtn
              key={choice}
              value={choice}
              onTap={() => handleAnswer(choice)}
              color={wrongAnswer === choice ? '#FCA5A5' : feedback === 'correct' ? '#6BCB77' : '#FF6B9D'}
              shadow={wrongAnswer === choice ? '#c95050' : feedback === 'correct' ? '#4fa05c' : '#c9456e'}
              disabled={feedback === 'correct'}
            />
          ))}
        </div>

        {feedback === 'wrong' && (
          <div style={{ marginTop: 16, fontSize: 18, color: '#F87171', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
            Try again! You can do it! 💪
          </div>
        )}
      </div>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Mini-game: True or False ─────────────────────────────────────────────────
type TFPProblem = { text: string; isTrue: boolean };

function genTFProblem(level: number): TFPProblem {
  const useAdd = Math.random() < 0.5;
  let text: string;
  let isTrue: boolean;
  if (useAdd) {
    const a = Math.floor(Math.random() * (level <= 1 ? 10 : 15)) + 1;
    const b = Math.floor(Math.random() * (level <= 1 ? 10 : 10)) + 1;
    const correct = a + b;
    isTrue = Math.random() < 0.5;
    let wrong: number;
    if (isTrue) {
      wrong = correct;
    } else {
      // Keep generating wrong values until they actually differ from correct
      do {
        wrong = correct + Math.floor(Math.random() * 5) - 2;
      } while (wrong === correct);
    }
    text = `${a} + ${b} = ${wrong}`;
  } else {
    const a = Math.floor(Math.random() * (level <= 1 ? 10 : 15)) + 2;
    const b = Math.floor(Math.random() * Math.min(a - 1, level <= 1 ? 9 : 12)) + 1;
    const correct = a - b;
    isTrue = Math.random() < 0.5;
    let wrong: number;
    if (isTrue) {
      wrong = correct;
    } else {
      do {
        wrong = correct + Math.floor(Math.random() * 5) - 2;
      } while (wrong === correct);
    }
    text = `${a} - ${b} = ${wrong}`;
  }
  return { text, isTrue };
}

function TrueFalse({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) {
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState<TFPProblem>(() => genTFProblem(1));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const initProblem = useCallback((lvl: number) => {
    setProblem(genTFProblem(lvl));
    setFeedback(null);
    setQuestionKey(k => k + 1);
  }, []);

  useEffect(() => { initProblem(1); }, [initProblem]);

  const handleAnswer = useCallback((answer: boolean) => {
    if (answer === problem.isTrue) {
      playCorrect();
      const newStreak = streak + 1;
      const newScore = score + 1;
      setStreak(newStreak);
      setScore(newScore);
      onScore(newScore);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newScore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      const newLvl = newStreak >= 3 && newStreak % 3 === 0 ? Math.min(5, level + 1) : level;
      setLevel(newLvl);
      setFeedback('correct');
      setTimeout(() => initProblem(newLvl), 800);
    } else {
      playWrong();
      setStreak(0);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); }, 1000);
    }
  }, [problem, streak, score, bestStreak, level, onScore, initProblem]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <Confetti active={showConfetti} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6BCBFF', margin: 0 }}>🎯 True or False</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>Is the equation correct?</p>
      </div>

      <ScoreHUD score={score} streak={streak} bestStreak={bestStreak} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, background: '#E8F4FD', borderRadius: 8, padding: '4px 12px', display: 'inline-block', marginBottom: 16, fontFamily: 'Fredoka', color: '#6BCBFF' }}>
          Level {level}
        </div>

        <div
          key={questionKey}
          style={{
            background: 'white', borderRadius: 24, padding: '36px 24px', marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            animation: feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          }}
        >
          <div style={{
            fontSize: 42, fontWeight: 700, fontFamily: 'Fredoka',
            color: feedback === 'correct' ? '#6BCB77' : feedback === 'wrong' ? '#F87171' : '#2D3748',
          }}>
            {problem.text}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <button
            onClick={() => handleAnswer(true)}
            disabled={feedback !== null}
            style={{
              padding: '20px 40px', fontSize: 28, fontFamily: 'Fredoka', fontWeight: 700,
              background: feedback === 'correct' && problem.isTrue ? '#6BCB77' : feedback === 'wrong' && !problem.isTrue ? '#FCA5A5' : '#6BCBFF',
              border: 'none', borderRadius: 20, cursor: feedback !== null ? 'default' : 'pointer',
              color: 'white', boxShadow: `0 5px 0 ${feedback === 'correct' && problem.isTrue ? '#4fa05c' : '#4a9fd9'}`,
              transform: 'translateY(0)', transition: 'transform 0.1s, box-shadow 0.1s',
              opacity: feedback !== null && !(feedback === 'correct' && problem.isTrue) ? 0.6 : 1,
            }}
          >
            ✅ True
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={feedback !== null}
            style={{
              padding: '20px 40px', fontSize: 28, fontFamily: 'Fredoka', fontWeight: 700,
              background: feedback === 'correct' && !problem.isTrue ? '#6BCB77' : feedback === 'wrong' && problem.isTrue ? '#FCA5A5' : '#FF9F43',
              border: 'none', borderRadius: 20, cursor: feedback !== null ? 'default' : 'pointer',
              color: 'white', boxShadow: `0 5px 0 ${feedback === 'correct' && !problem.isTrue ? '#4fa05c' : '#cc7a2f'}`,
              transform: 'translateY(0)', transition: 'transform 0.1s, box-shadow 0.1s',
              opacity: feedback !== null && !(feedback === 'correct' && !problem.isTrue) ? 0.6 : 1,
            }}
          >
            ❌ False
          </button>
        </div>

        {feedback === 'wrong' && (
          <div style={{ marginTop: 16, fontSize: 18, color: '#F87171', fontFamily: 'Fredoka' }}>
            Not quite! Try the next one! 💪
          </div>
        )}
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Mini-game: Count the Animals ─────────────────────────────────────────────
const ANIMAL_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'];

function genCountingProblem(): { count: number; emoji: string } {
  const count = Math.floor(Math.random() * 13) + 3; // 3-15
  const emoji = ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)];
  return { count, emoji };
}

function genCountChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  while (choices.size < 4) {
    let c = correct + Math.floor(Math.random() * 5) - 2;
    if (c >= 1 && c <= 20) choices.add(c);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

function CountAnimals({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) {
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [data, setData] = useState(() => genCountingProblem());
  const [choices, setChoices] = useState<number[]>(() => {
    const d = genCountingProblem();
    return genCountChoices(d.count);
  });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  const initProblem = useCallback(() => {
    const d = genCountingProblem();
    setData(d);
    setChoices(genCountChoices(d.count));
    setFeedback(null);
    setWrongAnswer(null);
    setQuestionKey(k => k + 1);
  }, []);

  useEffect(() => { initProblem(); }, [initProblem]);

  const handleAnswer = useCallback((ans: number) => {
    if (ans === data.count) {
      playCorrect();
      const newStreak = streak + 1;
      const newScore = score + 1;
      setStreak(newStreak);
      setScore(newScore);
      onScore(newScore);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newScore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => initProblem(), 800);
    } else {
      playWrong();
      setStreak(0);
      setWrongAnswer(ans);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongAnswer(null); }, 1000);
    }
  }, [data, streak, score, bestStreak, onScore, initProblem]);

  // Generate a scattered layout for the animals
  const gridSize = 5;
  const positions = Array.from({ length: data.count }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const jitter = () => (Math.random() - 0.5) * 16;
    return { row, col, jitterX: jitter(), jitterY: jitter() };
  });

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <Confetti active={showConfetti} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6BCB77', margin: 0 }}>🔢 Count the Animals</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>Count them all and tap the right number!</p>
      </div>

      <ScoreHUD score={score} streak={streak} bestStreak={bestStreak} />

      <div style={{ textAlign: 'center' }}>
        <div
          key={questionKey}
          style={{
            background: 'white', borderRadius: 24, padding: '24px 16px', marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            animation: feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          }}
        >
          {/* Animal grid */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 8, marginBottom: 16, position: 'relative',
          }}>
            {positions.map((pos, i) => (
              <div
                key={i}
                style={{
                  fontSize: 38,
                  transform: `translate(${pos.jitterX}px, ${pos.jitterY}px)`,
                  animationDelay: `${i * 0.03}s`,
                }}
              >
                {data.emoji}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 16, color: '#94A3B8', fontFamily: 'Fredoka' }}>
            How many {data.emoji}s do you see?
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {choices.map(choice => (
            <ChoiceBtn
              key={choice}
              value={choice}
              onTap={() => handleAnswer(choice)}
              color={wrongAnswer === choice ? '#FCA5A5' : feedback === 'correct' ? '#6BCB77' : '#6BCB77'}
              shadow={wrongAnswer === choice ? '#c95050' : '#4fa05c'}
              disabled={feedback === 'correct'}
            />
          ))}
        </div>

        {feedback === 'wrong' && (
          <div style={{ marginTop: 16, fontSize: 18, color: '#F87171', fontFamily: 'Fredoka' }}>
            Oops! Count slowly and try again! 🔢
          </div>
        )}
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Mini-game: Quick Math ───────────────────────────────────────────────────
type QMProblem = { text: string; answer: number };

function genQMProblem(level: number): QMProblem {
  const isAdd = Math.random() < 0.5;
  if (isAdd) {
    const maxA = level <= 2 ? 10 : level <= 4 ? 15 : 20;
    const a = Math.floor(Math.random() * maxA) + 1;
    const maxB = level <= 2 ? 5 : level <= 4 ? 10 : 15;
    const b = Math.floor(Math.random() * maxB) + 1;
    return { text: `${a} + ${b} = ?`, answer: a + b };
  } else {
    const maxA = level <= 2 ? 15 : level <= 4 ? 20 : 20;
    const a = Math.floor(Math.random() * maxA) + 5;
    const b = Math.floor(Math.random() * Math.min(a - 1, level <= 2 ? 5 : level <= 4 ? 10 : 15)) + 1;
    return { text: `${a} - ${b} = ?`, answer: a - b };
  }
}

function genQMChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const sign = Math.random() < 0.5 ? 1 : -1;
    const c = correct + offset * sign;
    if (c >= 0 && c <= 40) choices.add(c);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

function QuickMath({ onBack, onScore }: { onBack: () => void; onScore: (s: number) => void }) {
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState<QMProblem>(() => genQMProblem(1));
  const [choices, setChoices] = useState<number[]>(() => genQMChoices(genQMProblem(1).answer));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  const initProblem = useCallback((lvl: number) => {
    const p = genQMProblem(lvl);
    setProblem(p);
    setChoices(genQMChoices(p.answer));
    setFeedback(null);
    setWrongAnswer(null);
    setQuestionKey(k => k + 1);
  }, []);

  useEffect(() => { initProblem(1); }, [initProblem]);

  const handleAnswer = useCallback((ans: number) => {
    if (ans === problem.answer) {
      playCorrect();
      const newStreak = streak + 1;
      const newScore = score + 1;
      setStreak(newStreak);
      setScore(newScore);
      onScore(newScore);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      if (newScore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      const newLvl = newStreak >= 3 && newStreak % 3 === 0 ? Math.min(5, level + 1) : level;
      setLevel(newLvl);
      setFeedback('correct');
      setTimeout(() => initProblem(newLvl), 800);
    } else {
      playWrong();
      setStreak(0);
      setWrongAnswer(ans);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongAnswer(null); }, 1000);
    }
  }, [problem, streak, score, bestStreak, level, onScore, initProblem]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <Confetti active={showConfetti} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#C084FC', margin: 0 }}>➕➖ Quick Math</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>Solve the equation!</p>
      </div>

      <ScoreHUD score={score} streak={streak} bestStreak={bestStreak} />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, background: '#F3E8FF', borderRadius: 8, padding: '4px 12px', display: 'inline-block', marginBottom: 16, fontFamily: 'Fredoka', color: '#C084FC' }}>
          Level {level} · Addition & Subtraction
        </div>

        <div
          key={questionKey}
          style={{
            background: 'white', borderRadius: 24, padding: '32px 24px', marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            animation: feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          }}
        >
          <div style={{
            fontSize: 52, fontWeight: 700, fontFamily: 'Fredoka',
            color: feedback === 'correct' ? '#6BCB77' : feedback === 'wrong' ? '#F87171' : '#2D3748',
          }}>
            {problem.text}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {choices.map(choice => (
            <ChoiceBtn
              key={choice}
              value={choice}
              onTap={() => handleAnswer(choice)}
              color={wrongAnswer === choice ? '#FCA5A5' : feedback === 'correct' ? '#6BCB77' : '#C084FC'}
              shadow={wrongAnswer === choice ? '#c95050' : '#9660d4'}
              disabled={feedback === 'correct'}
            />
          ))}
        </div>

        {feedback === 'wrong' && (
          <div style={{ marginTop: 16, fontSize: 18, color: '#F87171', fontFamily: 'Fredoka' }}>
            Almost! Give it another shot! 💪
          </div>
        )}
      </div>
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Menu Screen ────────────────────────────────────────────────────────────────
function MenuScreen({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <button onClick={onBack} style={{
        background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
        padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
        fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
      }}>← Back</button>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🧮</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Math Lab</h1>
        <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 24px' }}>Pick a game, {kidName}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
        <CardBtn label="Number Bonds" emoji="🧮" color="#FF6B9D" shadow="#c9456e" onTap={() => {}} subtitle="Addition within 10" />
        <CardBtn label="True or False" emoji="🎯" color="#6BCBFF" shadow="#4a9fd9" onTap={() => {}} subtitle="Is it correct?" />
        <CardBtn label="Count Animals" emoji="🔢" color="#6BCB77" shadow="#4fa05c" onTap={() => {}} subtitle="Count 1 to 20" />
        <CardBtn label="Quick Math" emoji="➕➖" color="#C084FC" shadow="#9660d4" onTap={() => {}} subtitle="Add & subtract" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MathLab({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'bonds' | 'truefalse' | 'counting' | 'quickmath'>('menu');
  const [rated, setRated] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  // Per-game scores for display
  const [gameScores, setGameScores] = useState<Record<string, number>>({});

  const handleGameScore = useCallback((game: string, score: number) => {
    setGameScores(prev => ({ ...prev, [game]: score }));
    setTotalScore(Object.entries({ ...gameScores, [game]: score }).reduce((sum, [, s]) => sum + s, 0));
  }, [gameScores]);

  if (screen === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Back</button>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧮</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Math Lab</h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 24px' }}>Hi, {kidName}! Pick a game to play!</p>
        </div>

        {/* Score summary */}
        {totalScore > 0 && (
          <div style={{ textAlign: 'center', background: '#FFF0F5', borderRadius: 16, padding: '12px 20px', marginBottom: 20 }}>
            <span style={{ fontFamily: 'Fredoka', fontSize: 15, color: '#FF6B9D' }}>
              🏆 Total correct today: <strong>{totalScore}</strong>
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
          <CardBtn
            label="Number Bonds"
            emoji="🧮"
            color="#FF6B9D"
            shadow="#c9456e"
            onTap={() => setScreen('bonds')}
            subtitle="Fill in the missing number!"
          />
          <CardBtn
            label="True or False"
            emoji="🎯"
            color="#6BCBFF"
            shadow="#4a9fd9"
            onTap={() => setScreen('truefalse')}
            subtitle="Is the equation correct?"
          />
          <CardBtn
            label="Count Animals"
            emoji="🔢"
            color="#6BCB77"
            shadow="#4fa05c"
            onTap={() => setScreen('counting')}
            subtitle="Count them all!"
          />
          <CardBtn
            label="Quick Math"
            emoji="➕➖"
            color="#C084FC"
            shadow="#9660d4"
            onTap={() => setScreen('quickmath')}
            subtitle="Solve fast!"
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={() => setRated(true)}
            style={{
              padding: '14px 32px', fontSize: 18, background: '#FFD93D', color: '#5a4a00',
              border: 'none', borderRadius: 16, cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700,
              boxShadow: '0 4px 0 #c9a82e', transform: 'translateY(0)',
              display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
            }}
          >
            ⭐ Rate Math Lab
          </button>
        </div>

        {rated && <RatingModal activity="math-lab" activityName="Math Lab" activityEmoji="🧮" kidName={kidName} onClose={() => setRated(true)} />}
      </div>
    );
  }

  if (screen === 'bonds') return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <NumberBonds onBack={() => setScreen('menu')} onScore={(s) => handleGameScore('bonds', s)} />
    </div>
  );
  if (screen === 'truefalse') return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <TrueFalse onBack={() => setScreen('menu')} onScore={(s) => handleGameScore('truefalse', s)} />
    </div>
  );
  if (screen === 'counting') return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <CountAnimals onBack={() => setScreen('menu')} onScore={(s) => handleGameScore('counting', s)} />
    </div>
  );
  if (screen === 'quickmath') return (
    <div style={{ background: '#FFF8F0', minHeight: '100vh' }}>
      <QuickMath onBack={() => setScreen('menu')} onScore={(s) => handleGameScore('quickmath', s)} />
    </div>
  );

  return null;
}