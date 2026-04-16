'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Level = 'easy' | 'medium' | 'hard';
type Screen = 'menu' | 'game' | 'results';

interface Question {
  hour: number;
  minute: number;
}

// ─── Time generation ─────────────────────────────────────────────────────────
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

// ─── Hand rotation math ───────────────────────────────────────────────────────
function minuteRotation(minute: number): number {
  return minute * 6;
}

function hourRotation(hour: number, minute: number): number {
  return hour * 30 + minute * 0.5;
}

// ─── Snap helpers ─────────────────────────────────────────────────────────────
function snapMinute(minute: number, level: Level): number {
  if (level === 'easy') return 0;
  if (level === 'medium') return minute < 15 ? 0 : 30;
  return Math.round(minute / 5) * 5;
}

function snapHour(hour: number, minute: number, level: Level): number {
  if (level === 'easy') return hour;
  if (level === 'medium') return minute < 15 ? hour : hour;
  return Math.round((hour * 30 + minute * 0.5) / 30);
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
    rotation: Math.random() * 360,
  }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 999, overflow: 'hidden',
    }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: '-20px',
          left: p.left,
          width: p.size,
          height: p.size * 2,
          background: p.color,
          borderRadius: 2,
          animation: `confettiFall 1.5s ${p.delay} forwards`,
          transform: `rotate(${p.rotation}deg)`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Clock component ──────────────────────────────────────────────────────────
function Clock({
  hourAngle, minuteAngle,
  onHourDrag, onMinuteDrag,
  level,
}: {
  hourAngle: number; minuteAngle: number;
  onHourDrag: (delta: number) => void;
  onMinuteDrag: (delta: number) => void;
  level: Level;
}) {
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null);
  const startAngleRef = useRef(0);
  const startValueRef = useRef(0);
  const clockRef = useRef<HTMLDivElement>(null);

  const getAngleFromPoint = (clientX: number, clientY: number) => {
    if (!clockRef.current) return 0;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const handlePointerDown = (hand: 'hour' | 'minute', e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(hand);
    const angle = getAngleFromPoint(e.clientX, e.clientY);
    startAngleRef.current = angle;
    startValueRef.current = hand === 'hour' ? hourAngle : minuteAngle;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const angle = getAngleFromPoint(e.clientX, e.clientY);
    let delta = angle - startAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    if (dragging === 'minute') {
      const newMinute = ((startValueRef.current + delta) % 360 + 360) % 360;
      onMinuteDrag(newMinute);
    } else {
      const newHour = ((startValueRef.current + delta) % 360 + 360) % 360;
      onHourDrag(newHour);
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  // Snap minute
  const snappedMinute = (() => {
    const raw = Math.round(minuteAngle / 6) * 6;
    return ((raw % 360) + 360) % 360;
  })();

  // Snap hour (snaps to nearest hour-ish value based on level)
  const snappedHourAngle = (() => {
    const raw = ((hourAngle % 360) + 360) % 360;
    if (level === 'easy') {
      return Math.round(raw / 30) * 30;
    }
    return raw;
  })();

  const minuteDeg = snappedMinute;
  const hourDeg = snappedHourAngle;

  // Hour numbers 1-12
  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const angle = i * 30;
    const rad = (angle - 90) * (Math.PI / 180);
    const r = 110;
    const x = 140 + r * Math.cos(rad);
    const y = 140 + r * Math.sin(rad);
    return { num, x, y };
  });

  // Tick marks (60 total: 12 main, 48 minor)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6;
    const isMain = i % 5 === 0;
    const rad = (angle - 90) * (Math.PI / 180);
    const innerR = isMain ? 100 : 108;
    const outerR = 118;
    return {
      x1: 140 + innerR * Math.cos(rad),
      y1: 140 + innerR * Math.sin(rad),
      x2: 140 + outerR * Math.cos(rad),
      y2: 140 + outerR * Math.sin(rad),
      isMain,
    };
  });

  return (
    <div
      ref={clockRef}
      style={{
        width: 280, height: 280,
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg width={280} height={280} viewBox="0 0 280 280">
        {/* Face */}
        <circle cx={140} cy={140} r={135} fill="#ffffff" stroke="#ddd" strokeWidth={3} />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMain ? '#aaa' : '#ccc'} strokeWidth={t.isMain ? 2.5 : 1} />
        ))}

        {/* Hour numbers */}
        {hourNumbers.map(h => (
          <text key={h.num} x={h.x} y={h.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: 'Fredoka', fontSize: 18, fill: '#555', fontWeight: 600 }}>
            {h.num}
          </text>
        ))}

        {/* Center dot */}
        <circle cx={140} cy={140} r={6} fill="#888" />
      </svg>

      {/* Hour hand */}
      <div
        style={{
          position: 'absolute',
          bottom: 140, left: 140,
          width: 8, height: 70,
          transformOrigin: 'center bottom',
          transform: `translate(-50%, 0) rotate(${hourDeg}deg)`,
          cursor: 'grab',
          touchAction: 'none',
          transition: dragging === 'hour' ? 'none' : 'transform 0.15s ease-out',
        }}
        onPointerDown={(e) => handlePointerDown('hour', e)}
      >
        <div style={{
          width: 8, height: 70,
          background: '#FF6B9D',
          borderRadius: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }} />
        {/* Grab target (larger hit area) */}
        <div style={{
          position: 'absolute',
          bottom: 50, left: -12,
          width: 32, height: 40,
          cursor: 'grab',
        }} />
      </div>

      {/* Minute hand */}
      <div
        style={{
          position: 'absolute',
          bottom: 140, left: 140,
          width: 5, height: 100,
          transformOrigin: 'center bottom',
          transform: `translate(-50%, 0) rotate(${minuteDeg}deg)`,
          cursor: 'grab',
          touchAction: 'none',
          transition: dragging === 'minute' ? 'none' : 'transform 0.15s ease-out',
        }}
        onPointerDown={(e) => handlePointerDown('minute', e)}
      >
        <div style={{
          width: 5, height: 100,
          background: '#6BCBFF',
          borderRadius: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }} />
        {/* Grab target */}
        <div style={{
          position: 'absolute',
          bottom: 60, left: -14,
          width: 33, height: 60,
          cursor: 'grab',
        }} />
      </div>
    </div>
  );
}

// ─── Level button ─────────────────────────────────────────────────────────────
function LevelButton({ level, label, color, onClick }: {
  level: Level; label: string; color: string; onClick: () => void;
}) {
  const shadowColors: Record<Level, string> = {
    easy: '#6BCB77',
    medium: '#FFD93D',
    hard: '#FF6B9D',
  };
  const [pressed, setPressed] = useState(false);

  return (
    <button
      style={{
        fontFamily: 'Fredoka',
        fontSize: 20,
        fontWeight: 600,
        padding: '16px 32px',
        border: 'none',
        borderRadius: 16,
        background: color,
        color: '#fff',
        boxShadow: `0 6px 0 ${shadowColors[level]}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        cursor: 'pointer',
        transition: 'transform 0.1s',
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
    return `The hour hand should point toward the ${hour}!`;
  }
  if (level === 'medium') {
    if (minute === 0) return `The hour hand should point right at ${hour}!`;
    return `The hour hand should point just past the ${hour}!`;
  }
  const hourAngle = hour * 30;
  const minuteAngle = minute * 6;
  const hourHandAngle = hour * 30 + minute * 0.5;
  const diff = ((hourHandAngle - hourAngle + 180) % 360) - 180;
  if (diff > 5) return `The hour hand needs to move a little more toward the ${hour}!`;
  if (diff < -5) return `The hour hand went too far past the ${hour}!`;
  const m = minute;
  if (m === 0) return `The minute hand should point straight up (at 12)!`;
  if (m === 15) return `The minute hand should point straight to the right (at 3)!`;
  if (m === 30) return `The minute hand should point straight down (at 6)!`;
  if (m === 45) return `The minute hand should point straight to the left (at 9)!`;
  return `The minute hand should be at ${m} minutes!`;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TellTime({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentHour, setCurrentHour] = useState(3);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [hourAngle, setHourAngle] = useState(0);
  const [minuteAngle, setMinuteAngle] = useState(0);
  const [hint, setHint] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [totalQuestions] = useState(10);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  // Load best score
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
    setCurrentHour(q.hour);
    setCurrentMinute(q.minute);
    setHourAngle(hourRotation(q.hour, q.minute));
    setMinuteAngle(minuteRotation(q.minute));
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
    setCurrentHour(q.hour);
    setCurrentMinute(q.minute);
    setHourAngle(hourRotation(q.hour, q.minute));
    setMinuteAngle(minuteRotation(q.minute));
    setQuestionIndex(i => i + 1);
    setAttempts(0);
    setHint('');
    setIsCorrect(false);
  }, [questionIndex, level, totalQuestions]);

  const checkAnswer = () => {
    const targetHourAngle = hourRotation(currentHour, currentMinute);
    const targetMinuteAngle = minuteRotation(currentMinute);

    // Allow ±6 degrees tolerance on minute hand, ±3 on hour hand
    const hourDiff = Math.abs(((hourAngle - targetHourAngle + 180) % 360) - 180);
    const minuteDiff = Math.abs(((minuteAngle - targetMinuteAngle + 180) % 360) - 180);

    const correct = hourDiff <= 4 && minuteDiff <= 6;

    if (correct) {
      playCorrect();
      setIsCorrect(true);
      let pts = 10;
      if (attempts === 1) pts = 5;
      else if (attempts === 2) pts = 2;
      setScore(s => s + pts);
      saveBestScore(level, score + pts);
      setHint(`🎉 Great job, ${kidName}!`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      setTimeout(() => {
        setIsCorrect(false);
        advanceQuestion();
      }, 1500);
    } else {
      playWrong();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const newHint = getHint(currentHour, currentMinute, level);
      setHint(newHint);
      setAttempts(a => a + 1);
    }
  };

  const skipQuestion = () => {
    const q = generateQuestion(level);
    setCurrentHour(q.hour);
    setCurrentMinute(q.minute);
    setHourAngle(hourRotation(q.hour, q.minute));
    setMinuteAngle(minuteRotation(q.minute));
    setQuestionIndex(i => i + 1);
    setAttempts(0);
    setHint('');
  };

  const handleHourDrag = (delta: number) => {
    setHourAngle(prev => ((prev + delta) % 360 + 360) % 360);
  };

  const handleMinuteDrag = (delta: number) => {
    setMinuteAngle(prev => ((prev + delta) % 360 + 360) % 360);
  };

  const percentage = Math.round((score / (totalQuestions * 10)) * 100);
  const stars = score >= 100 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  // Screen 1: Menu
  if (screen === 'menu') {
    return (
      <div style={{ fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0', padding: 24 }}>
        <Confetti active={false} />
        <button onClick={onBack} style={{
          fontFamily: 'Fredoka', fontSize: 16, background: 'none', border: 'none',
          cursor: 'pointer', color: '#888', marginBottom: 16,
        }}>
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: '#6BCBFF', margin: 0 }}>
            🕐 Tell Time!
          </h1>
          <p style={{ fontSize: 20, color: '#666', marginTop: 8, marginBottom: 40 }}>
            Move the hands to show the right time!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <LevelButton level="easy" label="🌟 Easy" color="#6BCB77" onClick={() => startGame('easy')} />
          <LevelButton level="medium" label="⭐ Medium" color="#FFD93D" onClick={() => startGame('medium')} />
          <LevelButton level="hard" label="🔥 Hard" color="#FF6B9D" onClick={() => startGame('hard')} />
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 }}>
          {(['easy', 'medium', 'hard'] as Level[]).map(l => {
            const best = getBestScore(l);
            return best > 0 ? (
              <div key={l} style={{ marginTop: 8, textTransform: 'capitalize' }}>
                {l} best: <strong>{best}</strong> pts
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  // Screen 2: Game
  if (screen === 'game') {
    return (
      <div style={{
        fontFamily: 'Fredoka',
        minHeight: '100vh',
        background: '#FFF8F0',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: shake ? 'shake 0.4s' : undefined,
      }}>
        <Confetti active={showConfetti} />

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setScreen('menu')} style={{
            fontFamily: 'Fredoka', fontSize: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: '#888',
          }}>
            ← Menu
          </button>
          <span style={{ fontSize: 18, color: '#555' }}>
            Score: <strong>{score}</strong>
          </span>
        </div>

        {/* Progress */}
        <div style={{ width: '100%', maxWidth: 320, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#888', marginBottom: 6 }}>
            <span>Question {questionIndex + 1} of {totalQuestions}</span>
          </div>
          <div style={{ height: 10, background: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((questionIndex + (isCorrect ? 1 : 0)) / totalQuestions) * 100}%`,
              background: isCorrect ? '#6BCB77' : '#6BCBFF',
              borderRadius: 5,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Target time */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 18, color: '#888', margin: 0 }}>What time is it?</p>
          <p style={{ fontSize: 48, fontWeight: 700, color: '#333', margin: 0 }}>
            {formatTime(currentHour, currentMinute)}
          </p>
        </div>

        {/* Clock */}
        <div style={{
          transform: shake ? 'translateX(-8px)' : undefined,
          animation: shake ? 'shake 0.4s' : undefined,
          marginBottom: 24,
        }}>
          <Clock
            hourAngle={hourAngle}
            minuteAngle={minuteAngle}
            onHourDrag={handleHourDrag}
            onMinuteDrag={handleMinuteDrag}
            level={level}
          />
        </div>

        {/* Hint */}
        {hint && (
          <div style={{
            fontSize: 18,
            color: isCorrect ? '#6BCB77' : '#FF9F43',
            textAlign: 'center',
            marginBottom: 16,
            minHeight: 28,
            fontWeight: 600,
          }}>
            {hint}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={checkAnswer}
            disabled={isCorrect}
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: isCorrect ? '#ccc' : '#6BCB77',
              color: '#fff', cursor: isCorrect ? 'default' : 'pointer',
              boxShadow: isCorrect ? 'none' : '0 6px 0 #4CAF50',
              transition: 'all 0.1s',
            }}
          >
            Am I Right? ✓
          </button>
          <button
            onClick={skipQuestion}
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#ddd', color: '#666',
              boxShadow: '0 6px 0 #bbb',
              cursor: 'pointer',
            }}
          >
            Skip →
          </button>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    );
  }

  // Screen 3: Results
  return (
    <div style={{
      fontFamily: 'Fredoka',
      minHeight: '100vh',
      background: '#FFF8F0',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Confetti active={stars === 3} />

      <h1 style={{ fontSize: 36, fontWeight: 700, color: '#333', textAlign: 'center', margin: 0 }}>
        {kidName}, you did it! 🎉
      </h1>

      <div style={{
        background: '#fff', borderRadius: 24, padding: 32, marginTop: 24,
        textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        minWidth: 280,
      }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#6BCBFF' }}>
          {score}
        </div>
        <div style={{ fontSize: 18, color: '#888' }}>points</div>

        <div style={{ fontSize: 64, margin: '16px 0' }}>
          {'⭐'.repeat(stars)}
          {stars < 3 ? '☆'.repeat(3 - stars) : ''}
        </div>

        <div style={{ fontSize: 20, color: '#555' }}>
          {percentage}% correct
        </div>

        {stars === 3 && (
          <div style={{ fontSize: 22, color: '#FFD93D', fontWeight: 700, marginTop: 8 }}>
            🌟 Perfect! 🌟
          </div>
        )}
        {stars === 2 && (
          <div style={{ fontSize: 22, color: '#6BCB77', fontWeight: 700, marginTop: 8 }}>
            Awesome work!
          </div>
        )}
        {stars === 1 && (
          <div style={{ fontSize: 22, color: '#6BCBFF', fontWeight: 700, marginTop: 8 }}>
            Good job, keep practicing!
          </div>
        )}
        {stars === 0 && (
          <div style={{ fontSize: 22, color: '#888', fontWeight: 700, marginTop: 8 }}>
            Try again, you can do it!
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => { playArpeggio(); startGame(level); }}
          style={{
            fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
            padding: '14px 28px', border: 'none', borderRadius: 16,
            background: '#6BCBFF', color: '#fff',
            boxShadow: '0 6px 0 #4FC3F7',
            cursor: 'pointer',
          }}
        >
          Play Again 🔄
        </button>
        <button
          onClick={() => setScreen('menu')}
          style={{
            fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
            padding: '14px 28px', border: 'none', borderRadius: 16,
            background: '#FF6B9D', color: '#fff',
            boxShadow: '0 6px 0 #E91E63',
            cursor: 'pointer',
          }}
        >
          Pick Level 📋
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          onClick={onBack}
          style={{
            fontFamily: 'Fredoka', fontSize: 16, background: 'none', border: 'none',
            cursor: 'pointer', color: '#888',
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
              fontFamily: 'Fredoka', fontSize: 16, background: 'none', border: 'none',
              cursor: 'pointer', color: '#aaa', textDecoration: 'underline',
            }}
          >
            Rate this activity
          </button>
          {ratingModalOpen && (
            <RatingModal
              activity={`tell-time-${level}`}
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