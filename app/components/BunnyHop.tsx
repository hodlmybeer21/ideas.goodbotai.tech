'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Bunny Hop Counting — a horizontal number line 0–20. Kid is given a target
// number and either "count on" (start low, hop forward) or "count back" (start
// high, hop backward). Tap the right number of times to land on the target.
// Builds the count-on / count-back mental model that K–1 teachers ask for and
// that MathLab / TensOnesExplorer don't fully cover.

type Mode = 'on' | 'back';

interface Round {
  start: number;
  target: number;
  // For "count on" → hop_count = target - start (always positive).
  // For "count back" → hop_count = start - target (always positive).
  // We clamp so start + hop_count fits in 0..20 either direction.
  hops: number;
  mode: Mode;
}

const MAX = 20;
const MIN = 0;

// Audio helpers (synth, no asset deps)
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function hop() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function landGood() {
  try {
    const c = ctx();
    [523, 659, 784].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.07 + 0.25);
      o.start(c.currentTime + i * 0.07); o.stop(c.currentTime + i * 0.07 + 0.26);
    });
  } catch {}
}
function landBad() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(330, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.25);
    g.gain.setValueAtTime(0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    o.start(c.currentTime); o.stop(c.currentTime + 0.3);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3);
      o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.32);
    });
  } catch {}
}

function makeRound(difficulty: number, forceMode?: Mode): Round {
  // difficulty 0: hops 1-3, 0-10 range. 1: 1-5, 0-15. 2: 1-7, 0-20.
  const ranges = [{ maxHop: 3, max: 10 }, { maxHop: 5, max: 15 }, { maxHop: 7, max: 20 }];
  const r = ranges[Math.min(2, Math.max(0, difficulty))];
  const mode: Mode = forceMode ?? (Math.random() < 0.5 ? 'on' : 'back');
  const hops = 1 + Math.floor(Math.random() * r.maxHop);
  if (mode === 'on') {
    const maxStart = Math.max(MIN, r.max - hops);
    const start = Math.floor(Math.random() * (maxStart + 1));
    return { start, target: start + hops, hops, mode };
  } else {
    const minStart = Math.min(MAX, hops);
    const start = minStart + Math.floor(Math.random() * (r.max - hops + 1));
    return { start, target: start - hops, hops, mode };
  }
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: Math.random() * 100, color: colors[i % colors.length], delay: Math.random() * 1.2, size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          background: p.color,
          animationDelay: `${p.delay}s`,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

export default function BunnyHop({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'win'>('menu');
  const [difficulty, setDifficulty] = useState(1);
  const [forceMode, setForceMode] = useState<Mode | 'mixed'>('mixed');
  const [round, setRound] = useState<Round>(() => makeRound(1));
  const [position, setPosition] = useState<number>(round.start);
  const [bounces, setBounces] = useState<number>(0); // visual hop count for "wrong attempt" feedback
  const [targetBounces, setTargetBounces] = useState<number>(round.hops);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundsDone, setRoundsDone] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Persist best streak
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bunnyhop_best_streak');
      if (saved) setBestStreak(parseInt(saved, 10) || 0);
    } catch {}
  }, []);
  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak);
      try { localStorage.setItem('bunnyhop_best_streak', String(streak)); } catch {}
    }
  }, [streak, bestStreak]);

  const startGame = useCallback((d: number, mode: Mode | 'mixed') => {
    setDifficulty(d);
    setForceMode(mode);
    const first = makeRound(d, mode === 'mixed' ? undefined : mode);
    setRound(first);
    setPosition(first.start);
    setTargetBounces(first.hops);
    setBounces(0);
    setScore(0);
    setStreak(0);
    setRoundsDone(0);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: number, mode: Mode | 'mixed') => {
    const r = makeRound(d, mode === 'mixed' ? undefined : mode);
    setRound(r);
    setPosition(r.start);
    setTargetBounces(r.hops);
    setBounces(0);
    setLocked(false);
  }, []);

  const doHop = useCallback((dir: 1 | -1) => {
    if (screen !== 'game' || locked) return;
    const correctDir = round.mode === 'on' ? 1 : -1;
    const expectedHops = round.hops;

    // Wrong direction = hard penalty (a real mistake; resets the round)
    if (dir !== correctDir) {
      landBad();
      setStreak(0);
      setFeedback({ kind: 'bad', text: `Wrong way! You're ${round.mode === 'on' ? 'counting on (+)' : 'counting back (−)'}. Start over from ${round.start}.` });
      setLocked(true);
      setTimeout(() => {
        setPosition(round.start);
        setBounces(0);
        setLocked(false);
        setFeedback(null);
      }, 1300);
      return;
    }

    // Right direction: move the bunny, count the hop, check result.
    const currentPos = position;
    const next = currentPos + dir;
    const clamped = Math.max(MIN, Math.min(MAX, next));
    if (clamped === currentPos) {
      // Hit edge before target — soft penalty
      landBad();
      setStreak(0);
      setFeedback({ kind: 'bad', text: `Edge! You can't hop past ${currentPos} — try again from ${round.start}.` });
      setLocked(true);
      setTimeout(() => {
        setPosition(round.start);
        setBounces(0);
        setLocked(false);
        setFeedback(null);
      }, 1300);
      return;
    }
    hop();
    const newBounces = bounces + 1;
    setBounces(newBounces);
    setPosition(clamped);

    if (clamped === round.target) {
      // Reached target exactly on correct hop count — SUCCESS
      const bonus = Math.max(2, 12 - bounces * 1); // fewer hops = more bonus
      setScore(s => s + bonus);
      setStreak(s => s + 1);
      setRoundsDone(n => n + 1);
      landGood();
      const hopWord = newBounces === 1 ? 'hop' : 'hops';
      setFeedback({ kind: 'good', text: `🎯 Landed on ${round.target} in ${newBounces} ${hopWord}! +${bonus}` });
      setLocked(true);
      setTimeout(() => {
        setRoundsDone(currentRounds => {
          if (currentRounds >= 10) {
            setScreen('win');
            fanfare();
          } else {
            nextRound(difficulty, forceMode);
            setFeedback(null);
          }
          return currentRounds;
        });
      }, 1400);
    } else if (newBounces > expectedHops) {
      // Overshoot — went the right direction but blown past target
      landBad();
      setStreak(0);
      setFeedback({ kind: 'bad', text: `Too far! You needed ${expectedHops} ${expectedHops === 1 ? 'hop' : 'hops'} from ${round.start}. Try again!` });
      setLocked(true);
      setTimeout(() => {
        setPosition(round.start);
        setBounces(0);
        setLocked(false);
        setFeedback(null);
      }, 1400);
    } else if (clamped === MAX || clamped === MIN) {
      // Bumped edge in right direction mid-count
      landBad();
      setStreak(0);
      setFeedback({ kind: 'bad', text: `Edge! You can't hop past ${clamped}. Try again from ${round.start}.` });
      setLocked(true);
      setTimeout(() => {
        setPosition(round.start);
        setBounces(0);
        setLocked(false);
        setFeedback(null);
      }, 1300);
    }
    // Otherwise: keep going, the kid hops again
  }, [screen, locked, bounces, position, round, difficulty, forceMode, nextRound]);

  // Keyboard support: arrow keys
  useEffect(() => {
    if (screen !== 'game' || locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') doHop(1);
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') doHop(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, locked, doHop]);

  if (screen === 'menu') {
    return (
      <>
        <div className="canvas-page slide-up">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1 className="page-title">🐰 Bunny Hop Counting</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24 }}>
            Help the bunny hop along the number line and <strong>land exactly on the target number</strong>!
          </p>

          <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
            <button className="btn btn-green" onClick={() => startGame(0, forceMode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🌱 Easy · 0-10, hop 1-3</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
              </div>
            </button>
            <button className="btn btn-blue" onClick={() => startGame(1, forceMode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🌿 Medium · 0-15, hop 1-5</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
              </div>
            </button>
            <button className="btn btn-purple" onClick={() => startGame(2, forceMode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🌳 Hard · 0-20, hop 1-7</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
              </div>
            </button>

            <p style={{ margin: '16px 0 4px', fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Round type:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className={forceMode === 'mixed' ? 'btn btn-secondary' : 'btn'}
                onClick={() => setForceMode('mixed')}
                style={{ fontSize: 14, padding: '10px 14px', opacity: forceMode === 'mixed' ? 1 : 0.7 }}
              >
                🎲 Mixed
              </button>
              <button
                className={forceMode === 'on' ? 'btn btn-secondary' : 'btn'}
                onClick={() => setForceMode('on')}
                style={{ fontSize: 14, padding: '10px 14px', opacity: forceMode === 'on' ? 1 : 0.7 }}
              >
                ⏩ Count On (+)
              </button>
              <button
                className={forceMode === 'back' ? 'btn btn-secondary' : 'btn'}
                onClick={() => setForceMode('back')}
                style={{ fontSize: 14, padding: '10px 14px', opacity: forceMode === 'back' ? 1 : 0.7 }}
              >
                ⏪ Count Back (−)
              </button>
            </div>
          </div>

          {bestStreak > 0 && (
            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
              🏆 Personal best streak: <strong>{bestStreak}</strong>
            </p>
          )}
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
            Use the big arrow buttons or your keyboard (←/→ or A/D).
          </p>
        </div>
      </>
    );
  }

  if (screen === 'win') {
    return (
      <>
        <Confetti active />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 32 }}>🐰🌟</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
            You hopped every round!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
          </p>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 28, fontSize: 18, padding: '16px 32px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty, forceMode)} style={{ fontSize: 16, padding: '14px 24px' }}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="bunny-hop"
            activityName="Bunny Hop Counting"
            activityEmoji="🐰"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  return (
    <GameBoard
      round={round}
      position={position}
      bounces={bounces}
      targetBounces={targetBounces}
      score={score}
      streak={streak}
      bestStreak={bestStreak}
      roundsDone={roundsDone}
      feedback={feedback}
      onHop={doHop}
      onBack={onBack}
      onShowRating={() => setShowRating(true)}
      showRating={showRating && !rated}
      kidName={kidName}
      locked={locked}
    />
  );
}

interface BoardProps {
  round: Round;
  position: number;
  bounces: number;
  targetBounces: number;
  score: number;
  streak: number;
  bestStreak: number;
  roundsDone: number;
  feedback: { kind: 'good' | 'bad'; text: string } | null;
  onHop: (dir: 1 | -1) => void;
  onBack: () => void;
  onShowRating: () => void;
  showRating: boolean;
  kidName: string;
  locked: boolean;
}

function GameBoard({ round, position, bounces, score, streak, bestStreak, roundsDone, feedback, onHop, onBack, onShowRating, showRating, kidName, locked }: BoardProps) {
  const ticks = Array.from({ length: MAX + 1 }, (_, i) => i);
  const dirSign = round.mode === 'on' ? 1 : -1;
  const dirArrow = round.mode === 'on' ? '➡️' : '⬅️';
  const directionWord = round.mode === 'on' ? 'count on' : 'count back';

  return (
    <>
      <div className="canvas-page slide-up" style={{ maxWidth: 940 }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title" style={{ marginBottom: 4 }}>🐰 Bunny Hop Counting</h1>

        {/* Top status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--text-medium)' }}>
            <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
            <span>·</span>
            <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
            <span>·</span>
            <span>🏆 <strong>{bestStreak}</strong></span>
            <span>·</span>
            <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{roundsDone + 1}</strong>/10</span>
          </div>
        </div>

        {/* Prompt banner */}
        <div style={{
          background: round.mode === 'on' ? 'var(--accent-green)' : 'var(--accent-blue)',
          color: 'white',
          padding: '14px 20px',
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 22,
          textAlign: 'center',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          marginBottom: 18,
        }}>
          {dirArrow} Start at <span style={{ background: 'rgba(255,255,255,0.3)', padding: '2px 10px', borderRadius: 8, marginRight: 6 }}>{round.start}</span>
          and {directionWord} to land on
          <span style={{ background: 'white', color: 'var(--accent-pink)', padding: '2px 12px', borderRadius: 8, marginLeft: 6 }}>{round.target}</span>
        </div>

        {/* Number line */}
        <div style={{
          background: 'linear-gradient(180deg, #FAF5FF 0%, #FEF3C7 100%)',
          border: '3px solid #E5E0D8',
          borderRadius: 18,
          padding: '24px 16px 18px',
          position: 'relative',
          minHeight: 180,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
            {ticks.map(n => {
              const isStart = n === round.start;
              const isTarget = n === round.target;
              const isHere = n === position;
              return (
                <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0, position: 'relative' }}>
                  {/* Tick labels with semantic color */}
                  <div style={{
                    fontWeight: 700,
                    fontSize: isStart || isTarget ? 18 : 14,
                    color: isTarget ? 'var(--accent-pink)'
                      : isStart ? 'var(--accent-blue)'
                      : isHere ? 'var(--accent-orange)'
                      : 'var(--text-medium)',
                    lineHeight: 1,
                    minHeight: 22,
                    display: 'flex', alignItems: 'center',
                  }}>
                    {n}
                  </div>
                  {/* Tick line */}
                  <div style={{
                    width: 2,
                    height: isStart || isTarget ? 32 : 18,
                    background: isTarget ? 'var(--accent-pink)' : isStart ? 'var(--accent-blue)' : '#C5B5A2',
                    marginTop: 4,
                  }} />
                  {/* Hint bouncy highlight */}
                  {isStart && (
                    <div style={{
                      position: 'absolute', bottom: -10, fontSize: 14,
                      color: 'var(--accent-blue)', fontWeight: 700,
                    }}>START</div>
                  )}
                  {isTarget && (
                    <div style={{
                      position: 'absolute', bottom: -10, fontSize: 14,
                      color: 'var(--accent-pink)', fontWeight: 700,
                    }}>GOAL 🏁</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* The bunny, positioned by percentage over the number-line row */}
          <div style={{
            position: 'absolute',
            left: `${(position / MAX) * 100}%`,
            top: 8,
            transform: 'translateX(-50%)',
            transition: locked ? 'none' : 'left 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fontSize: 38,
            filter: locked
              ? 'drop-shadow(0 4px 0 rgba(0,0,0,0.12))'
              : 'drop-shadow(0 6px 0 rgba(0,0,0,0.12))',
            animation: locked ? 'none' : 'hoppy 0.22s ease',
            pointerEvents: 'none',
          }}>
            {position === round.target ? '🐰🎉' : '🐰'}
          </div>
        </div>

        {/* Hop counter under the line */}
        <div style={{
          textAlign: 'center', marginTop: 14, fontSize: 15, color: 'var(--text-medium)',
        }}>
          Hops so far: <strong style={{ color: 'var(--accent-orange)', fontSize: 20 }}>{bounces}</strong>
          {bounces > 0 && (
            <span style={{ marginLeft: 8 }}>
              {bounces === round.hops ? '✅ exactly right!' : '…'}
            </span>
          )}
        </div>

        {/* Big hop buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 18 }}>
          <button
            className="btn btn-orange"
            disabled={locked}
            onClick={() => onHop(-1)}
            style={{
              fontSize: 26, padding: '16px 28px', minWidth: 110,
              opacity: locked ? 0.5 : 1,
              cursor: locked ? 'not-allowed' : 'pointer',
            }}
            aria-label="Hop left"
          >
            ⬅️ Hop −1
          </button>
          <button
            className="btn btn-green"
            disabled={locked}
            onClick={() => onHop(1)}
            style={{
              fontSize: 26, padding: '16px 28px', minWidth: 110,
              opacity: locked ? 0.5 : 1,
              cursor: locked ? 'not-allowed' : 'pointer',
            }}
            aria-label="Hop right"
          >
            Hop +1 ➡️
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 18px',
              borderRadius: 14,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 18,
              animation: 'pop 0.35s ease',
              background: feedback.kind === 'good' ? 'var(--accent-green)' : 'var(--accent-pink)',
              color: 'white',
              boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            }}
          >
            {feedback.text}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          Tap the arrow that points toward the goal. Stop exactly on the pink number!
        </p>

        {/* Gentle in-session rating prompt */}
        {streak > 0 && streak % 8 === 0 && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button onClick={onShowRating} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
              ⭐ Rate Bunny Hop
            </button>
          </div>
        )}
      </div>

      {showRating && (
        <RatingModal
          activity="bunny-hop"
          activityName="Bunny Hop Counting"
          activityEmoji="🐰"
          kidName={kidName}
          onClose={() => {}} /* will hide on next mount via parent state */
        />
      )}
    </>
  );
}
