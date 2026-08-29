'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Mood Wheel — spin a wheel of emotion emojis, land on one, see coping
// strategies ("what might help when you feel that way"). Reflective
// (no right/wrong), but tracks spins tried + favorite emotion so
// progress persists in the parent dashboard.

type Difficulty = 0 | 1 | 2;

interface Feeling { emoji: string; label: string; color: string; }

const FEELINGS: Record<string, Feeling[]> = {
  easy: [
    { emoji: '😊', label: 'happy', color: '#FFD93D' },
    { emoji: '😢', label: 'sad', color: '#6BCBFF' },
    { emoji: '😠', label: 'angry', color: '#FF6B9D' },
    { emoji: '😨', label: 'scared', color: '#C084FC' },
  ],
  medium: [
    { emoji: '😊', label: 'happy', color: '#FFD93D' },
    { emoji: '😢', label: 'sad', color: '#6BCBFF' },
    { emoji: '😠', label: 'angry', color: '#FF6B9D' },
    { emoji: '😨', label: 'scared', color: '#C084FC' },
    { emoji: '😲', label: 'surprised', color: '#6BCB77' },
    { emoji: '😴', label: 'tired', color: '#FF9F43' },
  ],
  hard: [
    { emoji: '😊', label: 'happy', color: '#FFD93D' },
    { emoji: '😢', label: 'sad', color: '#6BCBFF' },
    { emoji: '😠', label: 'angry', color: '#FF6B9D' },
    { emoji: '😨', label: 'scared', color: '#C084FC' },
    { emoji: '😲', label: 'surprised', color: '#6BCB77' },
    { emoji: '😴', label: 'tired', color: '#FF9F43' },
    { emoji: '😣', label: 'worried', color: '#6BCB77' },
    { emoji: '🤩', label: 'excited', color: '#FF9F43' },
  ],
};

const COPING: Record<string, string[]> = {
  happy:    ['Share it with someone!', 'Do a happy dance', 'Draw how you feel', 'Sing a happy song'],
  sad:      ['Take big slow breaths', 'Hug a stuffed animal', 'Talk to someone you trust', 'Draw how you feel'],
  angry:    ['Take 5 deep belly breaths', 'Squeeze a pillow tight', 'Run around outside', 'Stomp your feet'],
  scared:   ['Tell a grown-up you trust', 'Take slow breaths', 'Get a hug', 'Turn on a favorite song'],
  surprised:['Tell someone what happened!', 'Take a moment to think', 'Write it down', 'Tell the story again'],
  tired:    ['Take a rest', 'Drink some water', 'Slow down for a minute', 'Stretch your arms wide'],
  worried:  ['Talk to a grown-up', 'Make a plan to fix it', 'Take slow breaths', 'Think about something fun'],
  excited:  ['Share it with a friend!', 'Draw what you are excited about', 'Count to 10', 'Do a happy dance'],
};

interface SessionLog { [feelingLabel: string]: number; }

export default function MoodWheel({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'play'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Feeling | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [sessionLog, setSessionLog] = useState<SessionLog>({});
  const [lifetimeLog, setLifetimeLog] = useState<SessionLog>({});
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('moodwheel_log');
      if (raw) setLifetimeLog(JSON.parse(raw));
    } catch {}
  }, []);

  const pool = difficulty === 0 ? FEELINGS.easy : difficulty === 1 ? FEELINGS.medium : FEELINGS.hard;
  const spin = useCallback(() => {
    if (spinning) return;
    setLanded(null);
    setSpinning(true);
    const targetIdx = Math.floor(Math.random() * pool.length);
    const baseTurns = 5 + Math.floor(Math.random() * 3); // 5-7 full turns
    const finalAngle = (360 - (targetIdx / pool.length) * 360); // approximate spin target
    const nextRot = rotation + baseTurns * 360 + finalAngle;
    setRotation(nextRot);
    // After animation: announce landing
    setTimeout(() => {
      const landedFeeling = pool[targetIdx];
      setLanded(landedFeeling);
      setSpinning(false);
      setSpinCount(c => c + 1);
      setSessionLog(prev => ({ ...prev, [landedFeeling.label]: (prev[landedFeeling.label] || 0) + 1 }));
      setLifetimeLog(prev => {
        const next = { ...prev, [landedFeeling.label]: (prev[landedFeeling.label] || 0) + 1 };
        try { localStorage.setItem('moodwheel_log', JSON.stringify(next)); } catch {}
        try { localStorage.setItem('moodwheel_count', String(Object.values(next).reduce((a, b) => a + b, 0))); } catch {}
        return next;
      });
      try { heartTone(); } catch {}
    }, 3200);
  }, [spinning, rotation, pool]);

  // music: warm tone played on land (frequencies tied to feeling color? simple bell works)
  let _ctx: AudioContext | null = null;
  function ctx(): AudioContext {
    if (typeof window === 'undefined') return {} as AudioContext;
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }
  function heartTone() {
    try {
      const c = ctx();
      [659, 988].forEach((f, i) => {
        const o = c.createOscillator(); const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.18, c.currentTime + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.3);
        o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.32);
      });
    } catch {}
  }

  if (screen === 'menu') {
    const lifetimeCount = Object.values(lifetimeLog).reduce((a, b) => a + b, 0);
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>😊</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Mood Wheel</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Spin the wheel of <strong>feelings</strong>! Whatever it lands on, you can pick a card that might help when you feel that way. There is no score — every emotion is welcome.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a wheel:</p>
          <button className="btn btn-green" onClick={() => { setDifficulty(0); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Small wheel · 4 feelings</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => { setDifficulty(1); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Bigger wheel · 6 feelings</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => { setDifficulty(2); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Full wheel · 8 feelings</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {lifetimeCount > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🌀 You have tried <strong>{lifetimeCount}</strong> feelings so far!
          </p>
        )}
      </div>
    );
  }

  // Play screen
  const recentFavorite = Object.entries(sessionLog).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>😊 Mood Wheel</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>🌀 Spins this session: <strong style={{ color: 'var(--accent-pink)' }}>{spinCount}</strong></span>
        <span>·</span>
        <span>📒 Feelings tried today: <strong style={{ color: 'var(--accent-blue)' }}>{Object.keys(sessionLog).length}</strong></span>
      </div>

      <div style={{
        position: 'relative', width: 320, height: 320,
        margin: '0 auto 20px',
      }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', top: -8, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '24px solid var(--accent-pink)',
          filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.15))',
          zIndex: 5,
        }} />
        {/* Wheel */}
        <div style={{
          width: 320, height: 320, borderRadius: '50%',
          background: 'white',
          boxShadow: 'var(--shadow)',
          border: '6px solid var(--accent-yellow)',
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.3, 1)' : 'none',
          position: 'relative', overflow: 'hidden',
        }}>
          {pool.map((f, i) => {
            const sliceAngle = 360 / pool.length;
            const angle = i * sliceAngle;
            const emojiRotate = -rotation;
            return (
              <div key={f.label} style={{
                position: 'absolute', top: 0, left: '50%',
                width: 0, height: 0,
                transform: `rotate(${angle}deg)`,
                transformOrigin: '0 160px',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 18, left: -32,
                  width: 64, height: 64,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36,
                  transform: `rotate(${sliceAngle / 2}deg)`,
                }}>{f.emoji}</div>
              </div>
            );
          })}
          {/* Center hub */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 56, height: 56, borderRadius: '50%',
            background: 'white',
            border: '4px solid var(--accent-pink)',
            boxShadow: 'var(--shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>🤖</div>
        </div>
      </div>

      <button onClick={spin} disabled={spinning} className="btn btn-primary"
        style={{
          fontSize: 19, fontWeight: 700,
          padding: '16px 32px',
          opacity: spinning ? 0.6 : 1,
          cursor: spinning ? 'wait' : 'pointer',
        }}
      >
        {spinning ? '🌀 Spinning...' : '🎯 Spin the wheel!'}
      </button>

      {landed && !spinning && (
        <div style={{
          marginTop: 24, padding: '20px 22px',
          background: 'white',
          border: `3px solid ${landed.color}`,
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          maxWidth: 560, margin: '24px auto 0',
          animation: 'pop 0.4s ease',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-medium)', textAlign: 'center' }}>
            You landed on:
          </p>
          <p style={{ margin: '6px 0 4px', fontSize: 56, textAlign: 'center', lineHeight: 1 }}>{landed.emoji}</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center', textTransform: 'capitalize' }}>
            {landed.label}
          </p>
          <p style={{ margin: '14px 0 6px', fontSize: 13, color: 'var(--text-medium)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
            What might help when you feel {landed.label}?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
            {(COPING[landed.label] || []).map((tip, i) => (
              <div key={i} style={{
                background: `linear-gradient(180deg, ${landed.color}22, ${landed.color}44)`,
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14, fontWeight: 600,
                color: 'var(--text-dark)',
                textAlign: 'center',
              }}>{tip}</div>
            ))}
          </div>
        </div>
      )}

      {recentFavorite && recentFavorite[1] >= 2 && (
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--text-medium)' }}>
          💛 You have been landing on <strong style={{ textTransform: 'capitalize' }}>{recentFavorite[0]}</strong> a lot — that is totally okay. Want to talk about it?
        </p>
      )}

      {spinCount >= 4 && !rated && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowRating(true)} className="btn btn-primary" style={{ fontSize: 16, padding: '12px 24px' }}>
            ⭐ Rate Mood Wheel
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
        Every feeling is okay. Some feelings visit more than others. 💜
      </p>

      {showRating && !rated && (
        <RatingModal activity="mood-wheel" activityName="Mood Wheel" activityEmoji="😊" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
