'use client';
import { useState, useCallback, useEffect } from 'react';
import RatingModal from './RatingModal';

// ─── Audio helpers ─────────────────────────────────────────────────────────────
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
  [523, 659, 784, 1047].forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.22);
  });
}

function playWin() {
  const ctx = getCtx();
  [523, 659, 784, 1047, 1319].forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.35);
    osc.start(ctx.currentTime + i * 0.13);
    osc.stop(ctx.currentTime + i * 0.13 + 0.38);
  });
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.2}s`,
    size: Math.random() * 8 + 8,
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
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Base-10 Blocks Visual ────────────────────────────────────────────────────
function Base10Blocks({ tens: rawTens, ones: rawOnes }: { tens: number; ones: number }) {
  // clamp display so it doesn't overflow — show at most 10 tens + up to 9 ones
  const showTens = Math.min(rawTens, 10);
  const showOnes = Math.min(rawOnes, 9);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Tens = long bars */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 280 }}>
        {Array.from({ length: showTens }, (_, i) => (
          <div key={`t${i}`} style={{
            width: 44, height: 20,
            background: 'linear-gradient(135deg, #FF9F43, #FFD93D)',
            borderRadius: 6,
            border: '2px solid #c97000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#7a4000', fontFamily: 'Fredoka',
          }}>
            10
          </div>
        ))}
        {rawTens > 10 && (
          <div style={{
            width: 44, height: 20, background: '#FEF3C7',
            borderRadius: 6, border: '2px dashed #F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#92400E', fontFamily: 'Fredoka',
          }}>
            +{rawTens - 10}
          </div>
        )}
      </div>
      {/* Ones = small squares */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 280 }}>
        {Array.from({ length: showOnes }, (_, i) => (
          <div key={`o${i}`} style={{
            width: 20, height: 20,
            background: 'linear-gradient(135deg, #6BCBFF, #A5D8FF)',
            borderRadius: 4,
            border: '2px solid #1D68AA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#1D68AA', fontFamily: 'Fredoka',
          }}>
            1
          </div>
        ))}
        {rawOnes > 9 && (
          <div style={{
            width: 20, height: 20, background: '#E0F2FE',
            borderRadius: 4, border: '2px dashed #6BCBFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#0369A1', fontFamily: 'Fredoka',
          }}>
            +{rawOnes - 9}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Level config ─────────────────────────────────────────────────────────────
type Level = {
  id: number; name: string; minNum: number; maxNum: number; tens: number; ones: number;
  label: string; color: string; shadow: string;
};
const LEVELS: Level[] = [
  { id: 1, name: 'Tens',      label: 'Count by 10s to 50',   minNum: 10, maxNum: 50, tens: 10, ones: 0,  color: '#FF6B9D', shadow: '#c9456e' },
  { id: 2, name: 'Tens+Ones', label: 'Numbers 11–50',        minNum: 11, maxNum: 50, tens: 10, ones: 9,  color: '#6BCBFF', shadow: '#4a9fd9' },
  { id: 3, name: 'Bigger',    label: 'Numbers 20–79',         minNum: 20, maxNum: 79, tens: 10, ones: 9,  color: '#6BCB77', shadow: '#4fa05c' },
  { id: 4, name: 'Almost 100',label: 'Numbers 50–99',         minNum: 50, maxNum: 99, tens: 10, ones: 9,  color: '#C084FC', shadow: '#9660d4' },
  { id: 5, name: 'Full 99',  label: 'All numbers 10–99',     minNum: 10, maxNum: 99, tens: 10, ones: 9,  color: '#FF9F43', shadow: '#cc7a2f' },
];

// ─── Problem generation ────────────────────────────────────────────────────────
type Problem = { number: number; tens: number; ones: number };

function genProblem(level: Level): Problem {
  const num = Math.floor(Math.random() * (level.maxNum - level.minNum + 1)) + level.minNum;
  // Ensure tens and ones fit the level
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return { number: num, tens, ones };
}

function genChoices(correct: number, tens: number): string[] {
  const choices = new Set<string>();
  choices.add(`${correct} = ${tens * 10} + ${correct - tens * 10}`);
  // Add wrong options
  const offsets = [3, 7, -3, -7, 5, -5, 10, -10];
  for (const off of offsets) {
    const n = correct + off;
    if (n >= 10 && n <= 99 && n !== correct) {
      choices.add(`${n} = ${Math.floor(n / 10) * 10} + ${n - Math.floor(n / 10) * 10}`);
    }
    if (choices.size >= 4) break;
  }
  // Fill if needed
  for (let n = 10; n <= 99 && choices.size < 4; n++) {
    if (n !== correct) {
      choices.add(`${n} = ${Math.floor(n / 10) * 10} + ${n - Math.floor(n / 10) * 10}`);
    }
  }
  const arr = Array.from(choices);
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 4);
}

// ─── Choice button ─────────────────────────────────────────────────────────────
function ChoiceBtn({ value, onTap, color, shadow, disabled }: {
  value: string; onTap: () => void; color: string; shadow: string; disabled?: boolean;
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
        border: 'none', borderRadius: 16, padding: '14px 12px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: disabled ? '#94A3B8' : 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 5px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        minWidth: 200, minHeight: 56, textAlign: 'center', lineHeight: 1.3,
      }}
    >
      {value}
    </button>
  );
}

// ─── Score HUD ────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20,
      background: 'white', borderRadius: 16, padding: '10px 20px',
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
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{best}</div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TensOnesExplorer({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu'|'playing'|'win'>('menu');
  const [levelIdx, setLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [wrongChoice, setWrongChoice] = useState<string|null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [qKey, setQKey] = useState(0);

  const level = LEVELS[levelIdx];

  const initProblem = useCallback(() => {
    const p = genProblem(level);
    setProblem(p);
    setChoices(genChoices(p.number, p.tens));
    setFeedback(null);
    setWrongChoice(null);
    setQKey(k => k + 1);
  }, [level]);

  useEffect(() => {
    if (phase === 'playing') initProblem();
  }, [phase, initProblem]);

  const handleAnswer = useCallback((choice: string) => {
    if (!problem || feedback === 'correct') return;
    const correctStr = `${problem.number} = ${problem.tens * 10} + ${problem.ones}`;
    if (choice === correctStr) {
      playCorrect();
      const ns = streak + 1;
      const nscore = score + 1;
      setStreak(ns); setScore(nscore);
      if (ns > bestStreak) setBestStreak(ns);
      if (nscore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => {
        if (nscore >= 10) { playWin(); setPhase('win'); }
        else { initProblem(); }
      }, 900);
    } else {
      playWrong();
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setWrongChoice(choice);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongChoice(null); }, 1400);
    }
  }, [problem, feedback, streak, score, bestStreak, initProblem]);

  // ── MENU ────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🔢</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Tens & Ones Explorer</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px' }}>Learn place value with base-10 blocks!</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LEVELS.map(l => (
            <button
              key={l.id}
              onClick={() => { setLevelIdx(l.id - 1); setScore(0); setStreak(0); setPhase('playing'); }}
              style={{
                background: l.color, border: 'none', borderRadius: 18, padding: '16px 20px',
                cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: 'white',
                boxShadow: `0 5px 0 ${l.shadow}`, transform: 'translateY(0)',
                transition: 'transform 0.1s, box-shadow 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>
                <span style={{ fontSize: 22 }}>⭐</span> Level {l.id}: {l.name}
                <span style={{ display: 'block', fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{l.label}</span>
              </span>
              <span style={{ fontSize: 22 }}>→</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, background: '#F0F9FF', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#0369A1', fontFamily: 'Fredoka', fontWeight: 600, margin: 0 }}>
            🧱 How it works: count the tens bars and ones cubes to build the number!
          </p>
        </div>
      </div>
    );
  }

  // ── WIN ─────────────────────────────────────────────────────────────────────
  if (phase === 'win') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh', textAlign: 'center' }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: 64, marginTop: 40 }}>🏆</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#FF6B9D', margin: '16px 0 8px' }}>
          Amazing, Number Star!
        </h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You got <strong>{score}</strong> correct in Level {level.id}!
        </p>
        <div style={{ fontSize: 32, marginBottom: 24 }}>
          {'⭐'.repeat(3)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          {levelIdx < LEVELS.length - 1 && (
            <button
              onClick={() => { setLevelIdx(i => i + 1); setScore(0); setStreak(0); setPhase('playing'); }}
              style={{ background: LEVELS[levelIdx + 1].color, border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: `0 5px 0 ${LEVELS[levelIdx + 1].shadow}`, transform: 'translateY(0)', transition: 'transform 0.1s' }}
            >
              Next Level → {LEVELS[levelIdx + 1].name}
            </button>
          )}
          <button
            onClick={() => { setScore(0); setStreak(0); setPhase('playing'); }}
            style={{ background: level.color, border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: 'white', boxShadow: `0 5px 0 ${level.shadow}`, transform: 'translateY(0)', transition: 'transform 0.1s' }}
          >
            🔄 Play Again
          </button>
          <button onClick={() => setPhase('menu')} style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Choose Level
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (!problem) return null;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />

      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>Level {level.id}: {level.name}</div>
          <div style={{ fontSize: 12, color: level.color, fontFamily: 'Fredoka', fontWeight: 600 }}>{level.label}</div>
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>🔢 {score}/10</div>
      </div>

      <ScoreHUD score={score} streak={streak} best={bestStreak} />

      {/* Problem card */}
      <div
        key={qKey}
        style={{
          background: 'white', borderRadius: 24, padding: '24px 20px', marginBottom: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 15, color: '#64748B', fontFamily: 'Fredoka', margin: '0 0 16px' }}>
          Count the blocks. What number does this show?
        </p>

        <Base10Blocks tens={problem.tens} ones={problem.ones} />

        <div style={{ marginTop: 16, fontSize: 28, fontWeight: 700, color: level.color, fontFamily: 'Fredoka' }}>
          ? = ? + ?
        </div>
      </div>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        {choices.map(choice => {
          const isCorrect = choice === `${problem.number} = ${problem.tens * 10} + ${problem.ones}`;
          const isWrong = wrongChoice === choice;
          const baseColor = level.color;
          return (
            <ChoiceBtn
              key={choice}
              value={choice}
              onTap={() => handleAnswer(choice)}
              color={feedback === 'correct' && isCorrect ? '#6BCB77' : isWrong ? '#FCA5A5' : baseColor}
              shadow={feedback === 'correct' && isCorrect ? '#4fa05c' : isWrong ? '#c95050' : level.shadow}
              disabled={feedback === 'correct'}
            />
          );
        })}
      </div>

      {feedback === 'wrong' && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: '#F87171', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
          Keep going! Count the orange bars = tens, blue cubes = ones! 🧱
        </div>
      )}

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
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
