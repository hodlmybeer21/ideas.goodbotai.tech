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
  const colors = ['#FFD93D', '#FF9F43', '#6BCB77', '#FF6B9D', '#C084FC', '#6BCBFF'];
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

// ─── Coin definitions ─────────────────────────────────────────────────────────
type CoinDef = { name: string; value: number; color: string; bg: string; border: string };
const COIN_DEFS: CoinDef[] = [
  { name: 'Penny',  value: 1,  color: '#B45309', bg: '#FEF3C7', border: '#D97706' },
  { name: 'Nickel', value: 5,  color: '#6B7280', bg: '#F3F4F6', border: '#9CA3AF' },
  { name: 'Dime',   value: 10, color: '#6B7280', bg: '#F9FAFB', border: '#9CA3AF' },
  { name: 'Quarter',value: 25, color: '#6B7280', bg: '#E5E7EB', border: '#9CA3AF' },
];

function CoinVisual({ value }: { value: number }) {
  const def = COIN_DEFS.find(c => c.value === value) || COIN_DEFS[0];
  const size = value === 1 ? 40 : value === 5 ? 48 : value === 10 ? 36 : 56;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${def.bg}, ${def.border})`,
        border: `3px solid ${def.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: value <= 5 ? 11 : 13, fontWeight: 700, fontFamily: 'Fredoka',
        color: def.color, boxShadow: `0 3px 8px ${def.border}55`,
      }}>
        {value}¢
      </div>
      <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'Fredoka' }}>{def.name}</span>
    </div>
  );
}

// ─── Problem generation ─────────────────────────────────────────────────────────
type Problem = { coins: number[] };

function genProblem(): Problem {
  const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 coins
  const coins: number[] = [];
  const vals = [1, 5, 10, 25];
  for (let i = 0; i < count; i++) {
    coins.push(vals[Math.floor(Math.random() * vals.length)]);
  }
  return { coins };
}

function getTotal(coins: number[]): number {
  return coins.reduce((a, b) => a + b, 0);
}

function genChoices(total: number): string[] {
  const choices = new Set<string>();
  choices.add(`${total}¢`);
  const offsets = [-5, 5, -10, 10, -15, 15];
  for (const off of offsets) {
    const n = total + off;
    if (choices.size >= 4) break;
    if (n >= 0 && n <= 100) choices.add(`${n}¢`);
  }
  const arr = Array.from(choices);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 4);
}

// ─── Score HUD ─────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, background: 'white', borderRadius: 16, padding: '10px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FF9F43', fontFamily: 'Fredoka' }}>{score}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Streak</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: streak >= 3 ? '#FF9F43' : '#94A3B8', fontFamily: 'Fredoka' }}>{streak >= 3 ? `🔥 ${streak}` : streak}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Best</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{best}</div>
      </div>
    </div>
  );
}

// ─── Choice button ─────────────────────────────────────────────────────────────
function CBtn({ value, onTap, color, shadow, disabled }: {
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
        border: 'none', borderRadius: 16, padding: '16px 24px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: disabled ? '#94A3B8' : 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 5px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        minWidth: 140,
      }}
    >
      {value}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CoinChallenge({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu'|'playing'|'win'>('menu');
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
  const [qCount, setQCount] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const initProblem = useCallback(() => {
    const p = genProblem();
    setProblem(p);
    setChoices(genChoices(getTotal(p.coins)));
    setFeedback(null); setWrongChoice(null);
    setQKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (phase === 'playing') initProblem();
  }, [phase, initProblem]);

  const handleAnswer = useCallback((choice: string) => {
    if (!problem || feedback === 'correct') return;
    const total = getTotal(problem.coins);
    if (choice === `${total}¢`) {
      playCorrect();
      const ns = streak + 1;
      const nscore = score + 1;
      const nqcount = qCount + 1;
      setStreak(ns); setScore(nscore); setQCount(nqcount);
      if (ns > bestStreak) setBestStreak(ns);
      if (nscore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => {
        if (nqcount >= 10) { playWin(); setPhase('win'); }
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
  }, [problem, feedback, streak, score, bestStreak, qCount, initProblem]);

  // ── MENU ─────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#FF9F43', margin: 0 }}>Coin Challenge</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px' }}>Count the coins and pick the right total!</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {COIN_DEFS.map(c => {
            const size = c.value === 1 ? 40 : c.value === 5 ? 48 : c.value === 10 ? 36 : 56;
            return (
              <div key={c.value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: size, height: size, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${c.bg}, ${c.border})`,
                  border: `3px solid ${c.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: c.value <= 5 ? 11 : 13, fontWeight: 700, fontFamily: 'Fredoka', color: c.color,
                  boxShadow: `0 3px 8px ${c.border}55`,
                }}>
                  {c.value}¢
                </div>
                <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'Fredoka' }}>{c.name}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#FF9F43', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>How to Play 💰</h3>
          <p style={{ fontSize: 14, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.6, margin: 0 }}>
            🪙 Count the coins shown — look at each coin and add them up!<br />
            💵 Pick the correct total in cents from the choices.<br /><br />
            Get 10 questions right to win!
          </p>
        </div>

        <button
          onClick={() => { setScore(0); setStreak(0); setQCount(0); setPhase('playing'); }}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #FF9F43, #FFD93D)',
            border: 'none', borderRadius: 20, padding: '18px 24px',
            cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: 'white',
            boxShadow: '0 6px 0 #cc7a2f', transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          💰 Start Counting!
        </button>
      </div>
    );
  }

  // ── WIN ─────────────────────────────────────────────────────────────────────
  if (phase === 'win') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh', textAlign: 'center' }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: 64, marginTop: 40 }}>🏆</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#FF9F43', margin: '16px 0 8px' }}>Money Master!</h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You got <strong>{score}/10</strong> right!
        </p>
        <div style={{ fontSize: 32, marginBottom: 28 }}>{'⭐'.repeat(Math.ceil(score / 3) || 1)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          <button onClick={() => { setScore(0); setStreak(0); setQCount(0); setPhase('playing'); }} style={{ background: 'linear-gradient(135deg, #FF9F43, #FFD93D)', border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: '0 5px 0 #cc7a2f' }}>
            💰 Play Again!
          </button>
          <button onClick={() => setShowRating(true)} style={{ background: '#FFD93D', border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#5a4a00', boxShadow: '0 5px 0 #c9a82e' }}>
            ⭐ Rate This Game
          </button>
          <button onClick={() => setPhase('menu')} style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Back to Menu
          </button>
        </div>
        {showRating && <RatingModal activity="coin-challenge" activityName="Coin Challenge" activityEmoji="💰" kidName="Player" onClose={() => setShowRating(false)} />}
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (!problem) return null;
  const total = getTotal(problem.coins);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>Question {qCount + 1}/10</span>
        <span style={{ fontSize: 13, color: '#FF9F43', fontFamily: 'Fredoka', fontWeight: 600 }}>🪙 Count Coins</span>
      </div>

      <ScoreHUD score={score} streak={streak} best={bestStreak} />

      <div
        key={qKey}
        style={{
          background: 'white', borderRadius: 24, padding: '28px 20px', marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 16, color: '#374151', fontFamily: 'Fredoka', margin: '0 0 20px' }}>
          How much money is shown below?
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          {problem.coins.map((v, i) => (
            <CoinVisual key={i} value={v} />
          ))}
        </div>

        {feedback === 'correct' && (
          <div style={{ fontSize: 28, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
            ✓ {total}¢
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {choices.map(choice => (
          <CBtn
            key={choice}
            value={choice}
            onTap={() => handleAnswer(choice)}
            color={feedback === 'correct' ? '#6BCB77' : wrongChoice === choice ? '#FCA5A5' : '#FF9F43'}
            shadow={feedback === 'correct' ? '#4fa05c' : wrongChoice === choice ? '#c95050' : '#cc7a2f'}
            disabled={feedback === 'correct'}
          />
        ))}
      </div>

      {feedback === 'wrong' && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 15, color: '#F87171', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
          The answer was: <strong>{total}¢</strong> 💪
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}