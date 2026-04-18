'use client';

import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Pre-computed SVG paths (generated at build time via D3 geoAlbersUpa) ───
import { STATE_PATHS } from './statePaths';

// ─── Region colors ────────────────────────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  Northeast: '#3B82F6',
  Southeast: '#22C55E',
  Midwest:   '#F59E0B',
  Southwest: '#EF4444',
  West:      '#8B5CF6',
  Mountain:  '#06B6D4',
};

const STATE_REGION: Record<string, string> = {
  'Alabama':'Southeast','Arizona':'Southwest','Arkansas':'Southeast',
  'California':'West','Colorado':'Mountain','Connecticut':'Northeast',
  'Delaware':'Northeast','Florida':'Southeast','Georgia':'Southeast',
  'Idaho':'Mountain','Illinois':'Midwest','Indiana':'Midwest','Iowa':'Midwest',
  'Kansas':'Midwest','Kentucky':'Southeast','Louisiana':'Southeast',
  'Maine':'Northeast','Maryland':'Northeast','Massachusetts':'Northeast',
  'Michigan':'Midwest','Minnesota':'Midwest','Mississippi':'Southeast',
  'Missouri':'Midwest','Montana':'Mountain','Nebraska':'Midwest',
  'Nevada':'West','New Hampshire':'Northeast','New Jersey':'Northeast',
  'New Mexico':'Southwest','New York':'Northeast','North Carolina':'Southeast',
  'North Dakota':'Midwest','Ohio':'Midwest','Oklahoma':'Southwest',
  'Oregon':'West','Pennsylvania':'Northeast','Rhode Island':'Northeast',
  'South Carolina':'Southeast','South Dakota':'Midwest','Tennessee':'Southeast',
  'Texas':'Southwest','Utah':'Mountain','Vermont':'Northeast',
  'Virginia':'Southeast','Washington':'West','West Virginia':'Southeast',
  'Wisconsin':'Midwest','Wyoming':'Mountain',
};

// ─── Levels ─────────────────────────────────────────────────────────────────
const LEVELS = [
  { id: 1, name: 'Northeast Basics', states: ['Connecticut','Massachusetts','New York','Pennsylvania','Vermont','New Jersey'] },
  { id: 2, name: 'More Northeast',   states: ['Maine','New Hampshire','Rhode Island'] },
  { id: 3, name: 'Southeast',         states: ['Florida','Georgia','North Carolina','Virginia','Maryland'] },
  { id: 4, name: 'Midwest',           states: ['Ohio','Michigan','Illinois','Indiana','Wisconsin','Minnesota'] },
  { id: 5, name: 'South & West',      states: ['Texas','California','Washington','Oregon','Colorado','Arizona'] },
  { id: 6, name: 'All 48 States',     states: Object.keys(STATE_PATHS) },
];

const ENCOURAGEMENTS = ["You're getting warmer! 🌡️","Keep trying! 💪","Almost there! 🎯","Great effort! 🌟"];
const CELEBRATIONS   = ["🎉 Fantastic!","🌟 Brilliant!","👏 Awesome!","🏆 Superstar!","⭐ Amazing!"];

type GamePhase = 'intro'|'playing'|'wrong'|'levelcomplete'|'levelselect';

export default function StateFinder({ onBack, kidName = 'Friend' }: { onBack: () => void; kidName?: string }) {
  const [phase, setPhase]             = useState<GamePhase>('intro');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels]               = useState<Set<number>>(new Set([1]));
  const [queue, setQueue]             = useState<string[]>([]);
  const [currentState, setCurrentState] = useState('');
  const [correct, setCorrect]           = useState(0);
  const [missed, setMissed]             = useState<string[]>([]);
  const [flashState, setFlashState]     = useState<string|null>(null);
  const [wrongGuess, setWrongGuess]     = useState<string|null>(null);
  const [showAnswer, setShowAnswer]     = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [celebration, setCelebration]   = useState('');
  const [showRating, setShowRating]     = useState(false);
  const [starRating, setStarRating]     = useState(0);

  // Map viewBox — matches the pre-computed path coordinates (NaturalEarth1, centered)
  const MAP_W = 920, MAP_H = 600;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const shuffle = <T,>(a: T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  function getActiveStatesUpTo(levelId: number): Set<string> {
    const active = new Set<string>();
    for (let l = 0; l < levelId - 1; l++) LEVELS[l].states.forEach(s => active.add(s));
    return active;
  }

  // ── Level management ──────────────────────────────────────────────────────

  const startLevel = (levelId: number) => {
    const level = LEVELS[levelId - 1];
    setCurrentLevel(levelId);
    setQueue(shuffle([...level.states]));
    setCurrentState(level.states[0]);
    setCorrect(0);
    setMissed([]);
    setFlashState(null);
    setWrongGuess(null);
    setShowAnswer(false);
    setCelebration('');
    setPhase('playing');
  };

  const advanceQueue = useCallback(() => {
    const remaining = queue.slice(1);
    if (remaining.length === 0) {
      const totalAttempts = correct + missed.length;
      const stars = totalAttempts > 0 && correct / totalAttempts >= 0.9 ? 3
                  : totalAttempts > 0 && correct / totalAttempts >= 0.7 ? 2 : 1;
      setStarRating(stars);
      setPhase('levelcomplete');
    } else {
      setQueue(remaining);
      setCurrentState(remaining[0]);
    }
  }, [queue, correct, missed]);

  // ── Click handler ───────────────────────────────────────────────────────────

  const handleStateClick = (clickedName: string) => {
    if (phase !== 'playing') return;
    if (clickedName === currentState) {
      setFlashState(clickedName);
      setCorrect(c => c + 1);
      setCelebration(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
      setTimeout(() => { setFlashState(null); setCelebration(''); advanceQueue(); }, 900);
    } else {
      setMissed(m => (m.includes(currentState) ? m : [...m, currentState]));
      setWrongGuess(clickedName);
      setShowAnswer(true);
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setPhase('wrong');
      setTimeout(() => { setWrongGuess(null); setShowAnswer(false); setEncouragement(''); setPhase('playing'); }, 1800);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const activeStates  = getActiveStatesUpTo(currentLevel);
  const regionColor   = (name: string) => REGION_COLORS[STATE_REGION[name] ?? ''] ?? '#9CA3AF';
  const levelId       = currentLevel;

  // ── Intro ───────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🗺️ State Finder</h1>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 24 }}>
          Learn the US map one region at a time!
        </p>
        <div style={{
          background: '#F0FFF4', border: '2px solid #22C55E', borderRadius: 18,
          padding: '16px 20px', marginBottom: 24, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#166534', fontWeight: 600 }}>
            🌎 48 states · 6 regions · Progressive difficulty
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LEVELS.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-green"
                style={{ flex: 1, fontSize: 15, padding: '14px 20px' }}
                onClick={() => startLevel(l.id)}
              >
                🌟 Level {l.id}: {l.name}
                <span style={{ display: 'block', fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  {l.states.length} states
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Level complete ──────────────────────────────────────────────────────────

  if (phase === 'levelcomplete') {
    const totalAttempts = correct + missed.length;
    const pct = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🏆 Level {levelId} Complete!</h1>
        <div style={{ fontSize: 48, margin: '20px 0' }}>🎉</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', marginBottom: 8 }}>
          Way to go, {kidName}!
        </div>
        <div style={{ fontSize: 18, color: '#6B7280', marginBottom: 16 }}>
          You got {correct}/{totalAttempts} ({pct}%)
        </div>
        <div style={{ fontSize: 32, marginBottom: 24 }}>
          {'⭐'.repeat(starRating)}{'☆'.repeat(3 - starRating)}
        </div>
        {missed.length > 0 && (
          <div style={{ marginBottom: 20, fontSize: 14, color: '#F59E0B' }}>
            ⚠️ Keep practicing: {missed.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
          {levelId < 6 && (
            <button className="btn btn-green" style={{ fontSize: 16 }} onClick={() => startLevel(levelId + 1)}>
              Next Level ➡️
            </button>
          )}
          <button className="btn btn-blue" style={{ fontSize: 15 }} onClick={() => startLevel(levelId)}>
            🔄 Play Again
          </button>
          <button className="btn btn-gray" style={{ fontSize: 14 }} onClick={() => setPhase('intro')}>
            Choose Level
          </button>
          <button className="btn" style={{ fontSize: 13, background: '#F472B6', color: 'white' }}
            onClick={() => setShowRating(true)}>
            ⭐ Rate this game
          </button>
        </div>
      </div>
    );
  }

  // ── Main game ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 className="page-title">🗺️ State Finder</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPhase('intro')}
              style={{ fontSize: 12, background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#6B7280' }}
            >
              Levels
            </button>
          </div>
        </div>

        {/* Level + progress */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
            <span>Level {levelId}: {LEVELS[levelId - 1].name}</span>
            <span>{correct}/{queue.length + correct + missed.length} correct</span>
          </div>
          <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(correct + missed.length) > 0 ? (correct / (correct + missed.length + queue.length)) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
              borderRadius: 4,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* Find prompt */}
        <div style={{
          background: regionColor(currentState),
          color: 'white',
          borderRadius: 16,
          padding: '14px 20px',
          marginBottom: 12,
          textAlign: 'center',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'Fredoka, sans-serif',
          letterSpacing: 0.5,
          boxShadow: `0 4px 16px ${regionColor(currentState)}55`,
        }}>
          Find: {currentState.toUpperCase()}
        </div>

        {/* Map */}
        <div style={{
          background: '#DBEAFE',
          borderRadius: 16,
          padding: 8,
          marginBottom: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 340 }}
          >
            {Object.entries(STATE_PATHS).map(([name, path]) => {
              const isActive  = activeStates.has(name);
              const isCurrent = name === currentState;
              const isFlash   = flashState === name;
              const isWrong   = wrongGuess === name;
              const isShown   = showAnswer && name === currentState;

              let fill = '#CBD5E1'; // inactive — soft gray
              if (isActive) {
                fill = isFlash  ? '#22C55E'
                     : isWrong  ? '#EF4444'
                     : isShown  ? '#F59E0B'
                     : isCurrent ? regionColor(name)
                     : regionColor(name) + '99'; // transparent for non-target active
              }

              return (
                <path
                  key={name}
                  d={path}
                  fill={fill}
                  stroke="white"
                  strokeWidth={isCurrent || isFlash || isShown ? 2.5 : 0.5}
                  style={{
                    cursor: isActive && phase === 'playing' ? 'pointer' : 'default',
                    transition: 'fill 0.2s',
                    filter: isFlash ? 'brightness(1.3)' : undefined,
                  }}
                  onClick={() => isActive && handleStateClick(name)}
                />
              );
            })}
          </svg>
        </div>

        {/* Wrong answer message */}
        {phase === 'wrong' && (
          <div style={{
            background: '#FFF0F4', border: '2px solid #EF4444',
            borderRadius: 14, padding: '12px 16px', marginBottom: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: '#EF4444', fontWeight: 700 }}>
              {encouragement} The answer was: {currentState}
            </div>
          </div>
        )}

        {/* Celebration */}
        {celebration && (
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>
            {celebration}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {missed.length > 0 && (
            <div style={{ fontSize: 12, color: '#F59E0B', background: '#FFFBEB', padding: '4px 10px', borderRadius: 8 }}>
              🔁 {missed.length} to review
            </div>
          )}
          <div style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', padding: '4px 10px', borderRadius: 8 }}>
            {queue.length} left
          </div>
        </div>
      </div>

      {showRating && (
        <RatingModal activity="statefinder" activityName="State Finder" activityEmoji="🗺️"
          kidName={kidName} onClose={() => setShowRating(false)} />
      )}
    </>
  );
}
