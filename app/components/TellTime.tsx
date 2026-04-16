'use client';
import { useState, useEffect, useCallback } from 'react';
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
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}

function playArpeggio() {
  const ctx = getCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Level = 'easy' | 'medium' | 'hard';
type Screen = 'menu' | 'game' | 'results';

interface Question {
  hour: number;
  minute: number;
}

// ─── Time generation ───────────────────────────────────────────────────────────
function generateQuestion(level: Level): Question {
  const hour = Math.floor(Math.random() * 12) + 1;
  if (level === 'easy') {
    return { hour, minute: 0 };
  } else if (level === 'medium') {
    return { hour, minute: 30 };
  } else {
    const minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][Math.floor(Math.random() * 12)];
    return { hour, minute };
  }
}

function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, '0')}`;
}

// ─── Rotation math ─────────────────────────────────────────────────────────────
function minuteRotation(minute: number): number {
  return minute * 6;
}

function hourRotation(hour: number, minute: number): number {
  return hour * 30 + minute * 0.5;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 0.5}s`,
    size: Math.random() * 8 + 8,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-20px', left: p.left,
          width: p.size, height: p.size * 2, background: p.color,
          borderRadius: 2, animation: `confettiFall 1.5s ${p.delay} forwards`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Step Button ───────────────────────────────────────────────────────────────
function StepButton({ onClick, children, color, shadowColor }: {
  onClick: () => void; children: React.ReactNode; color: string; shadowColor: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      style={{
        width: 52, height: 52,
        border: 'none', borderRadius: 14,
        background: color,
        color: '#fff', fontSize: 28, fontWeight: 700,
        boxShadow: `0 5px 0 ${shadowColor}`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Fredoka',
        lineHeight: 1,
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {children}
    </button>
  );
}

// ─── Clock component (no-drag, button-controlled) ─────────────────────────────
function Clock({
  currentHour, currentMinute, level,
  onHourChange, onMinuteChange,
}: {
  currentHour: number; currentMinute: number; level: Level;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}) {
  const hourDeg = hourRotation(currentHour, currentMinute);
  const minuteDeg = minuteRotation(currentMinute);

  // Step sizes by level
  const hourStep = level === 'easy' ? 1 : 1; // always 1 hour per tap
  const minuteStep = level === 'easy' ? 60 : level === 'medium' ? 30 : 5;

  const adjustHour = (dir: 1 | -1) => {
    let h = currentHour + dir * hourStep;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    onHourChange(h);
  };

  const adjustMinute = (dir: 1 | -1) => {
    let m = currentMinute + dir * minuteStep;
    if (m >= 60) m = 0;
    if (m < 0) m = 60 - minuteStep;
    onMinuteChange(m);
  };

  // Hour numbers
  // 12 numbers, i=0 → 12 (at top/-90°), i=1 → 1, ..., i=11 → 11
  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i === 0 ? 12 : i;
    const angle = i * 30 - 90;
    const rad = angle * (Math.PI / 180);
    const r = 110;
    return {
      num,
      x: 140 + r * Math.cos(rad),
      y: 140 + r * Math.sin(rad),
    };
  });

  // Tick marks: i=0 → tick at 12 o'clock (top), i=15 → tick at 3, etc.
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6 - 90;
    const isMain = i % 5 === 0;
    const rad = angle * (Math.PI / 180);
    const innerR = isMain ? 100 : 108;
    const outerR = 118;
    return {
      x1: 140 + innerR * Math.cos(rad), y1: 140 + innerR * Math.sin(rad),
      x2: 140 + outerR * Math.cos(rad), y2: 140 + outerR * Math.sin(rad),
      isMain,
    };
  });

  const labelStyle = { fontFamily: 'Fredoka', fontSize: 13, fill: '#888', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* SVG Clock */}
      <div style={{ position: 'relative', width: 280, height: 280, touchAction: 'none' }}>
        <svg width={280} height={280} viewBox="0 0 280 280" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx={140} cy={140} r={135} fill="#ffffff" stroke="#ddd" strokeWidth={3} />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMain ? '#aaa' : '#ccc'} strokeWidth={t.isMain ? 2.5 : 1} />
          ))}
          {hourNumbers.map(h => (
            <text key={h.num} x={h.x} y={h.y} textAnchor="middle" dominantBaseline="middle"
              style={{ fontFamily: 'Fredoka', fontSize: 18, fill: '#555', fontWeight: 600 }}>
              {h.num}
            </text>
          ))}
          <circle cx={140} cy={140} r={6} fill="#888" />
        </svg>

        {/* Hour hand */}
        <div style={{
          position: 'absolute', bottom: 140, left: 140,
          width: 8, height: 70,
          transformOrigin: 'center bottom',
          transform: `translate(-50%, 0) rotate(${hourDeg}deg)`,
          transition: 'transform 0.2s ease-out',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 8, height: 70, background: '#FF6B9D',
            borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }} />
        </div>

        {/* Minute hand */}
        <div style={{
          position: 'absolute', bottom: 140, left: 140,
          width: 5, height: 100,
          transformOrigin: 'center bottom',
          transform: `translate(-50%, 0) rotate(${minuteDeg}deg)`,
          transition: 'transform 0.2s ease-out',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 5, height: 100, background: '#6BCBFF',
            borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }} />
        </div>
      </div>

      {/* Current digital readout */}
      <div style={{
        fontFamily: 'Fredoka', fontSize: 28, fontWeight: 700,
        color: '#555', marginTop: 8, letterSpacing: 2,
      }}>
        {formatTime(currentHour, currentMinute)}
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', gap: 40, marginTop: 16, alignItems: 'center' }}>
        {/* Hour controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ ...labelStyle, marginBottom: 2 }}>HOUR</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StepButton onClick={() => adjustHour(-1)} color="#FF6B9D" shadowColor="#E91E63">−</StepButton>
            <StepButton onClick={() => adjustHour(1)} color="#FF6B9D" shadowColor="#E91E63">+</StepButton>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 2, height: 50, background: '#eee', borderRadius: 1, marginTop: 16 }} />

        {/* Minute controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ ...labelStyle, marginBottom: 2 }}>MINUTE</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StepButton onClick={() => adjustMinute(-1)} color="#6BCBFF" shadowColor="#4FC3F7">−</StepButton>
            <StepButton onClick={() => adjustMinute(1)} color="#6BCBFF" shadowColor="#4FC3F7">+</StepButton>
          </div>
        </div>
      </div>

      {/* Hint text for easy level */}
      {level === 'easy' && (
        <div style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#aaa', marginTop: 10 }}>
          ↑ just tap the HOUR buttons (minutes always at 00)
        </div>
      )}
      {level === 'medium' && (
        <div style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#aaa', marginTop: 10 }}>
          ↑ minutes snap to :00 or :30
        </div>
      )}
    </div>
  );
}

// ─── Level button ─────────────────────────────────────────────────────────────
function LevelButton({ label, color, shadowColor, onClick }: {
  label: string; color: string; shadowColor: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      style={{
        fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
        padding: '16px 32px', border: 'none', borderRadius: 16,
        background: color, color: '#fff',
        boxShadow: `0 6px 0 ${shadowColor}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        cursor: 'pointer', transition: 'transform 0.1s',
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {label}
    </button>
  );
}

// ─── Hint messages ─────────────────────────────────────────────────────────────
function getHint(hour: number, minute: number, level: Level): string {
  if (level === 'easy') {
    return `The hour hand should point toward ${hour}!`;
  }
  if (level === 'medium') {
    if (minute === 0) return `The hour hand should point right at ${hour}!`;
    return `The hour hand should point just past ${hour}!`;
  }
  if (minute === 0) return `The minute hand should point straight up (at 12)!`;
  if (minute === 15) return `The minute hand should point to 3!`;
  if (minute === 30) return `The minute hand should point straight down (at 6)!`;
  if (minute === 45) return `The minute hand should point to 9!`;
  return `The minute hand should be at ${minute}!`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TellTime({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [targetHour, setTargetHour] = useState(3);
  const [targetMinute, setTargetMinute] = useState(0);
  const [currentHour, setCurrentHour] = useState(3);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [hint, setHint] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [totalQuestions] = useState(10);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`telltime_best_${lvl}`) || '0', 10);
  };
  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`telltime_best_${lvl}`, String(s));
  };

  const startGame = (lvl: Level) => {
    setLevel(lvl);
    const q = generateQuestion(lvl);
    setTargetHour(q.hour);
    setTargetMinute(q.minute);
    setCurrentHour(q.hour);
    setCurrentMinute(q.minute);
    setQuestionIndex(0);
    setScore(0);
    setAttempts(0);
    setHint('');
    setIsCorrect(false);
    setScreen('game');
  };

  const advanceQuestion = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setScreen('results');
      return;
    }
    const q = generateQuestion(level);
    setTargetHour(q.hour);
    setTargetMinute(q.minute);
    setCurrentHour(q.hour);
    setCurrentMinute(q.minute);
    setQuestionIndex(i => i + 1);
    setAttempts(0);
    setHint('');
    setIsCorrect(false);
  }, [questionIndex, level]);

  const checkAnswer = () => {
    if (isCorrect) {
      advanceQuestion();
      return;
    }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Tolerance: hour ±1 hour, minute ±1 step
    const minuteTolerance = level === 'hard' ? 5 : level === 'medium' ? 15 : 0;
    const hourDiff = Math.abs(currentHour - targetHour);
    const minuteDiff = Math.abs(currentMinute - targetMinute);
    const minuteDiff2 = 60 - minuteDiff; // handle wrap-around
    const minDiff = Math.min(minuteDiff, minuteDiff2);

    const hourOk = level === 'easy' ? currentHour === targetHour :
      (hourDiff === 0 || hourDiff === 12);
    const minuteOk = minDiff <= minuteTolerance;

    if (hourOk && minuteOk) {
      setIsCorrect(true);
      setShowConfetti(true);
      const earned = newAttempts === 1 ? 10 : newAttempts === 2 ? 5 : 2;
      setScore(s => s + earned);
      playCorrect();
      setHint('🎉 Correct!');
      setTimeout(() => {
        setShowConfetti(false);
        advanceQuestion();
      }, 1500);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      playWrong();
      setHint(getHint(targetHour, targetMinute, level));
    }
  };

  const handleSkip = () => {
    advanceQuestion();
  };

  const handleBack = () => {
    setScreen('menu');
  };

  // Results
  useEffect(() => {
    if (screen === 'results') {
      saveBestScore(level, score);
      if (score >= 80) {
        setShowConfetti(true);
        playArpeggio();
      }
    }
  }, [screen, level, score]);

  const pct = Math.round((score / (totalQuestions * 10)) * 100);
  const stars = pct >= 95 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  const bestEasy = getBestScore('easy');
  const bestMedium = getBestScore('medium');
  const bestHard = getBestScore('hard');

  // ─── MENU ────────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{
        fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 20, left: 20,
          fontFamily: 'Fredoka', fontSize: 16, background: 'none',
          border: 'none', cursor: 'pointer', color: '#aaa',
        }}>← Back</button>

        <div style={{ fontSize: 60, marginBottom: 8 }}>🕐</div>
        <h1 style={{ fontSize: 42, fontWeight: 700, color: '#6BCBFF', margin: '0 0 8px' }}>Tell Time!</h1>
        <p style={{ fontSize: 18, color: '#888', margin: '0 0 32px', textAlign: 'center' }}>
          Move the hands to show the right time!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 300 }}>
          <LevelButton label="🌟 Easy — Hours" color="#6BCB77" shadowColor="#4CAF50" onClick={() => startGame('easy')} />
          <LevelButton label="⭐ Medium — Half Hours" color="#FFD93D" shadowColor="#F9A825" onClick={() => startGame('medium')} />
          <LevelButton label="🚀 Hard — 5-Min Intervals" color="#FF6B9D" shadowColor="#E91E63" onClick={() => startGame('hard')} />
        </div>

        {(bestEasy > 0 || bestMedium > 0 || bestHard > 0) && (
          <div style={{ marginTop: 28, background: '#fff', borderRadius: 16, padding: '16px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8, textAlign: 'center' }}>🏆 Best Scores</div>
            <div style={{ display: 'flex', gap: 24 }}>
              {bestEasy > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#6BCB77' }}>{bestEasy}</div><div style={{ fontSize: 12, color: '#aaa' }}>Easy</div></div>}
              {bestMedium > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#FFD93D' }}>{bestMedium}</div><div style={{ fontSize: 12, color: '#aaa' }}>Medium</div></div>}
              {bestHard > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#FF6B9D' }}>{bestHard}</div><div style={{ fontSize: 12, color: '#aaa' }}>Hard</div></div>}
            </div>
          </div>
        )}

        <button onClick={onBack} style={{
          marginTop: 24, fontFamily: 'Fredoka', fontSize: 15,
          background: 'none', border: 'none', cursor: 'pointer', color: '#ccc',
        }}>← Back to Home</button>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────────
  if (screen === 'results') {
    return (
      <div style={{
        fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: 80, marginBottom: 8 }}>🎉</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#333', margin: '0 0 24px', textAlign: 'center' }}>
          {kidName ? `${kidName}, you did it!` : 'You did it!'}
        </h1>

        <div style={{
          background: '#fff', borderRadius: 24, padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 280,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#6BCBFF' }}>{score}</div>
          <div style={{ fontSize: 18, color: '#888' }}>points</div>

          <div style={{ fontSize: 64, margin: '16px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          <div style={{ fontSize: 20, color: '#555' }}>{pct}% correct</div>

          {stars === 3 && <div style={{ fontSize: 22, color: '#FFD93D', fontWeight: 700, marginTop: 8 }}>🌟 Perfect! 🌟</div>}
          {stars === 2 && <div style={{ fontSize: 22, color: '#6BCB77', fontWeight: 700, marginTop: 8 }}>Awesome work!</div>}
          {stars === 1 && <div style={{ fontSize: 22, color: '#6BCBFF', fontWeight: 700, marginTop: 8 }}>Good job, keep practicing!</div>}
          {stars === 0 && <div style={{ fontSize: 22, color: '#888', fontWeight: 700, marginTop: 8 }}>Try again, you can do it!</div>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#6BCBFF', color: '#fff',
              boxShadow: '0 6px 0 #4FC3F7', cursor: 'pointer',
            }}
            onClick={() => { setShowConfetti(false); startGame(level); }}
          >
            Play Again 🔄
          </button>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#FF6B9D', color: '#fff',
              boxShadow: '0 6px 0 #E91E63', cursor: 'pointer',
            }}
            onClick={() => setScreen('menu')}
          >
            Pick Level 📋
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{
              fontFamily: 'Fredoka', fontSize: 16, background: 'none',
              border: 'none', cursor: 'pointer', color: '#888',
            }}
          >
            ← Back to Home
          </button>
        </div>

        {score >= 60 && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setRatingModalOpen(true)}
              style={{
                fontFamily: 'Fredoka', fontSize: 15, background: 'none',
                border: 'none', cursor: 'pointer', color: '#ccc', textDecoration: 'underline',
              }}
            >
              Rate this activity
            </button>
            {ratingModalOpen && (
              <RatingModal
                activity="tell-time"
                activityName="Tell Time"
                activityEmoji="🕐"
                onClose={() => setRatingModalOpen(false)}
                kidName={kidName}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── GAME ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
      padding: '16px 16px 32px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 0,
    }}>
      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={handleBack}
          style={{
            fontFamily: 'Fredoka', fontSize: 15, background: 'none',
            border: 'none', cursor: 'pointer', color: '#aaa',
          }}
        >
          ← Back
        </button>
        <div style={{
          fontSize: 14, color: '#aaa',
          background: '#fff', borderRadius: 20, padding: '4px 14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {questionIndex + 1} of {totalQuestions}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD93D' }}>⭐ {score}</div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 320, height: 8, background: '#eee', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#6BCBFF', borderRadius: 4,
          width: `${((questionIndex + (isCorrect ? 1 : 0)) / totalQuestions) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Target time prompt */}
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: '#aaa' }}>What time is it?</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: '#333', letterSpacing: 2 }}>
          {formatTime(targetHour, targetMinute)}
        </div>
      </div>

      {/* Hint */}
      {hint && (
        <div style={{
          background: hint.includes('🎉') ? '#E8F5E9' : '#FFF3E0',
          color: hint.includes('🎉') ? '#2E7D32' : '#E65100',
          borderRadius: 12, padding: '8px 16px', marginBottom: 12,
          fontSize: 15, fontWeight: 600, textAlign: 'center',
          animation: hint.includes('🎉') ? 'none' : 'none',
        }}>
          {hint}
        </div>
      )}

      {/* Clock with controls */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '20px 16px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transform: shake ? 'translateX(-8px)' : 'translateX(0)',
        transition: 'transform 0.1s',
      }}>
        <Clock
          currentHour={currentHour}
          currentMinute={currentMinute}
          level={level}
          onHourChange={setCurrentHour}
          onMinuteChange={setCurrentMinute}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={handleSkip}
          style={{
            fontFamily: 'Fredoka', fontSize: 16, fontWeight: 600,
            padding: '12px 20px', border: 'none', borderRadius: 14,
            background: '#fff', color: '#aaa',
            boxShadow: '0 4px 0 #ddd', cursor: 'pointer',
          }}
        >
          Skip →
        </button>
        <button
          onClick={checkAnswer}
          style={{
            fontFamily: 'Fredoka', fontSize: 18, fontWeight: 700,
            padding: '14px 32px', border: 'none', borderRadius: 16,
            background: isCorrect ? '#6BCB77' : '#FFD93D',
            color: isCorrect ? '#fff' : '#333',
            boxShadow: `0 6px 0 ${isCorrect ? '#4CAF50' : '#F9A825'}`,
            cursor: 'pointer', transform: 'translateY(0)',
          }}
        >
          {isCorrect ? 'Next →' : 'Am I Right? 🤔'}
        </button>
      </div>

      {/* Attempts indicator */}
      {attempts > 0 && !isCorrect && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#ccc' }}>
          Try {attempts} of 3 — hint above ↑ 
        </div>
      )}
    </div>
  );
}
