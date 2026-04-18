'use client';

import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Region colors ───────────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  Northeast: '#3B82F6',
  Southeast: '#22C55E',
  Midwest: '#F59E0B',
  Southwest: '#EF4444',
  West: '#8B5CF6',
  Mountain: '#06B6D4',
};

// ─── Level definitions ────────────────────────────────────────────
const LEVELS = [
  { id: 1, name: 'Northeast Basics', states: ['New York', 'Connecticut', 'Massachusetts', 'Pennsylvania', 'New Jersey', 'Vermont'] },
  { id: 2, name: 'More Northeast', states: ['Maine', 'New Hampshire', 'Rhode Island'] },
  { id: 3, name: 'Southeast', states: ['Florida', 'Georgia', 'North Carolina', 'Virginia', 'Maryland'] },
  { id: 4, name: 'Midwest', states: ['Ohio', 'Michigan', 'Illinois', 'Indiana', 'Wisconsin', 'Minnesota'] },
  { id: 5, name: 'South & West', states: ['Texas', 'California', 'Washington', 'Oregon', 'Colorado', 'Arizona'] },
  { id: 6, name: 'All 48 States', states: [
    'Alabama','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
    'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska',
    'Nevada','New Hampshire','New Jersey','New Mexico','New York',
    'North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
    'Rhode Island','South Carolina','South Dakota','Tennessee','Texas',
    'Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  ]},
];

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

const ENCOURAGEMENTS = ["You're getting warmer! 🌡️","Keep trying! 💪","Almost there! 🎯","Great effort! 🌟","You're doing amazing! 🚀"];
const CELEBRATIONS = ["🎉 Fantastic!","🌟 Brilliant!","👏 Awesome!","🏆 Superstar!","🔥 Nailed it!","⭐ Amazing!"];

// ─── SVG US Map — simplified recognizable state shapes ───────────
const US_MAP_SVG = `
<svg viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg">
  <path id="Washington" d="M 68,38 L 120,38 L 136,72 L 118,102 L 72,98 Z" />
  <path id="Oregon" d="M 72,98 L 118,102 L 135,148 L 122,202 L 75,198 L 55,142 Z" />
  <path id="California" d="M 55,142 L 75,198 L 122,202 L 130,305 L 72,295 L 38,230 Z" />
  <path id="Nevada" d="M 122,202 L 135,148 L 162,145 L 165,205 L 130,208 Z" />
  <path id="Idaho" d="M 136,72 L 198,56 L 210,128 L 200,185 L 135,185 L 135,148 Z" />
  <path id="Montana" d="M 198,56 L 302,50 L 314,125 L 295,182 L 210,185 L 200,185 Z" />
  <path id="Wyoming" d="M 200,185 L 295,182 L 306,238 L 215,242 Z" />
  <path id="Utah" d="M 165,205 L 215,242 L 222,302 L 228,308 L 130,305 L 130,208 Z" />
  <path id="Colorado" d="M 215,242 L 306,238 L 318,305 L 228,308 Z" />
  <path id="New Mexico" d="M 228,308 L 318,305 L 328,372 L 238,378 Z" />
  <path id="Arizona" d="M 130,305 L 228,308 L 238,378 L 328,372 L 322,305 Z" />
  <path id="North Dakota" d="M 302,50 L 388,44 L 392,102 L 314,108 Z" />
  <path id="South Dakota" d="M 314,108 L 392,102 L 400,158 L 322,162 Z" />
  <path id="Nebraska" d="M 322,162 L 400,158 L 432,205 L 348,210 Z" />
  <path id="Kansas" d="M 348,210 L 432,205 L 452,270 L 368,275 Z" />
  <path id="Oklahoma" d="M 368,275 L 452,270 L 478,338 L 392,344 Z" />
  <path id="Texas" d="M 392,344 L 478,338 L 540,428 L 490,512 L 372,480 L 355,392 Z" />
  <path id="Minnesota" d="M 388,44 L 472,38 L 480,108 L 392,112 Z" />
  <path id="Iowa" d="M 392,112 L 480,108 L 496,175 L 408,180 Z" />
  <path id="Missouri" d="M 408,180 L 496,175 L 520,272 L 432,278 Z" />
  <path id="Arkansas" d="M 432,278 L 520,272 L 532,342 L 448,348 Z" />
  <path id="Louisiana" d="M 448,348 L 532,342 L 545,408 L 462,415 Z" />
  <path id="Mississippi" d="M 448,348 L 545,342 L 552,408 L 455,415 Z" />
  <path id="Alabama" d="M 455,415 L 552,408 L 562,462 L 468,470 Z" />
  <path id="Wisconsin" d="M 472,38 L 555,32 L 568,108 L 482,115 Z" />
  <path id="Illinois" d="M 482,115 L 568,108 L 585,182 L 500,188 Z" />
  <path id="Indiana" d="M 555,108 L 622,102 L 634,175 L 568,182 Z" />
  <path id="Ohio" d="M 622,102 L 695,92 L 706,162 L 634,172 Z" />
  <path id="Michigan" d="M 555,32 L 642,24 L 660,88 L 572,98 Z M 632,52 L 672,44 L 682,78 L 642,84 Z" />
  <path id="Kentucky" d="M 568,182 L 706,172 L 720,232 L 582,240 Z" />
  <path id="Tennessee" d="M 500,188 L 720,185 L 730,242 L 512,248 Z" />
  <path id="North Carolina" d="M 706,162 L 802,152 L 814,212 L 720,220 Z" />
  <path id="South Carolina" d="M 720,220 L 814,212 L 826,272 L 735,280 Z" />
  <path id="Georgia" d="M 552,408 L 735,402 L 745,458 L 562,465 Z" />
  <path id="Florida" d="M 562,465 L 745,458 L 775,552 L 648,568 L 570,525 Z" />
  <path id="Virginia" d="M 695,152 L 795,142 L 808,200 L 708,210 Z" />
  <path id="West Virginia" d="M 706,162 L 765,154 L 776,205 L 718,215 Z" />
  <path id="Maryland" d="M 765,142 L 822,134 L 834,188 L 776,198 Z" />
  <path id="Delaware" d="M 822,134 L 840,130 L 844,158 L 826,162 Z" />
  <path id="Pennsylvania" d="M 695,92 L 785,82 L 798,142 L 708,152 Z" />
  <path id="New York" d="M 745,52 L 832,42 L 846,102 L 760,112 Z" />
  <path id="New Jersey" d="M 822,102 L 852,96 L 858,132 L 828,138 Z" />
  <path id="Connecticut" d="M 826,82 L 856,78 L 860,102 L 830,106 Z" />
  <path id="Rhode Island" d="M 844,85 L 864,82 L 867,98 L 847,101 Z" />
  <path id="Massachusetts" d="M 852,52 L 898,48 L 904,80 L 858,84 Z" />
  <path id="Vermont" d="M 842,26 L 880,20 L 886,54 L 848,60 Z" />
  <path id="New Hampshire" d="M 880,20 L 916,14 L 922,50 L 886,56 Z" />
  <path id="Maine" d="M 890,4 L 962,0 L 966,52 L 898,58 Z" />
</svg>`;

function getActiveStatesForLevel(levelId: number): Set<string> {
  const active = new Set<string>();
  for (let l = 0; l < LEVELS.length; l++) {
    if (l + 1 > levelId) break;
    LEVELS[l].states.forEach(s => active.add(s));
  }
  return active;
}

type GamePhase = 'intro' | 'playing' | 'wrong' | 'levelcomplete' | 'levelselect';

export default function StateFinder({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<Set<number>>(new Set([1]));
  const [queue, setQueue] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState('');
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [flashState, setFlashState] = useState<string | null>(null);
  const [wrongGuess, setWrongGuess] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [celebration, setCelebration] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [levelStats, setLevelStats] = useState<Record<number, { correct: number; total: number }>>({});

  const activeStates = getActiveStatesForLevel(currentLevel);

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  const buildQueue = (states: string[], extra: string[] = []) => {
    const weighted = [...states, ...states.filter(s => extra.includes(s))];
    return shuffle(weighted);
  };

  const startLevel = (levelId: number) => {
    const level = LEVELS[levelId - 1];
    const q = buildQueue(level.states, []);
    setCurrentLevel(levelId);
    setQueue(q);
    setCurrentState(q[0] || '');
    setCorrect(0);
    setTotal(0);
    setMissed([]);
    setWrongCount(0);
    setFlashState(null);
    setWrongGuess(null);
    setShowAnswer(false);
    setPhase('playing');
  };

  const advanceQueue = useCallback(() => {
    const remaining = queue.slice(1);
    if (remaining.length === 0) {
      const score = correct + missed.length;
      const stars = score > 0 && correct / score >= 0.9 ? 3 : score > 0 && correct / score >= 0.7 ? 2 : 1;
      setStarRating(stars);
      setLevelStats(prev => ({ ...prev, [currentLevel]: { correct, total: score } }));
      const newUnlocked = new Set(unlockedLevels);
      if (currentLevel < 6) newUnlocked.add(currentLevel + 1);
      setUnlockedLevels(newUnlocked);
      setPhase('levelcomplete');
    } else {
      setQueue(remaining);
      setCurrentState(remaining[0]);
    }
  }, [queue, correct, missed, currentLevel, unlockedLevels]);

  const handleStateClick = (clickedName: string) => {
    if (phase !== 'playing') return;
    if (clickedName === currentState) {
      setFlashState(clickedName);
      setCorrect(c => c + 1);
      setCelebration(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
      setTimeout(() => { setFlashState(null); setCelebration(''); advanceQueue(); }, 800);
    } else {
      setWrongCount(w => w + 1);
      setMissed(m => (m.includes(currentState) ? m : [...m, currentState]));
      setWrongGuess(clickedName);
      setShowAnswer(true);
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setPhase('wrong');
      setTimeout(() => { setWrongGuess(null); setShowAnswer(false); setEncouragement(''); setPhase('playing'); }, 1600);
    }
  };

  const handleSkip = () => {
    setMissed(m => (m.includes(currentState) ? m : [...m, currentState]));
    advanceQueue();
  };

  const activeLevelStates = LEVELS[currentLevel - 1]?.states || [];
  const regionColor = currentState ? REGION_COLORS[STATE_REGION[currentState] || 'Northeast'] : '#3B82F6';
  const levelProgress = activeLevelStates.length > 0 ? (correct / activeLevelStates.length) : 0;

  const getStateColor = (name: string) => {
    if (flashState === name) return REGION_COLORS[STATE_REGION[name] || 'Northeast'];
    if (showAnswer && name === currentState) return REGION_COLORS[STATE_REGION[name] || 'Northeast'];
    if (wrongGuess === name) return '#EF4444';
    if (!activeStates.has(name)) return '#E5E7EB';
    return REGION_COLORS[STATE_REGION[name] || 'Northeast'];
  };

  const renderStars = (n: number) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

  const levelButtonStyle = (unlocked: boolean) => ({
    background: unlocked ? REGION_COLORS['Northeast'] : '#E5E7EB',
    color: unlocked ? 'white' : '#9CA3AF',
    opacity: unlocked ? 1 : 0.6,
    cursor: unlocked ? 'pointer' : 'not-allowed',
    padding: '14px 20px', borderRadius: 14, border: 'none',
    fontFamily: 'Fredoka', fontSize: 16, fontWeight: 600 as const,
    width: '100%', textAlign: 'left' as const,
  });

  // ── Parse SVG and inject dynamic colors ──────────────────────
  const renderMap = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(US_MAP_SVG, 'image/svg+xml');
    const paths = doc.querySelectorAll('path');
    const allStateNames = Array.from(paths).map(p => p.getAttribute('id') || '');
    return { parsed: doc, allStateNames };
  };

  const { allStateNames } = renderMap();

  return (
    <>
      <div className="canvas-page slide-up" style={{ minHeight: '100vh' }}>
        <button className="back-btn" onClick={onBack}>← Back</button>

        {/* ── Intro ─────────────────────────────────────────── */}
        {phase === 'intro' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 72, marginBottom: 10 }}>🗺️</div>
            <h1 className="page-title">State Finder</h1>
            <p style={{ fontSize: 16, color: 'var(--text-medium)', marginBottom: 20 }}>
              Learn the US map — one region at a time!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto' }}>
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  style={levelButtonStyle(unlockedLevels.has(l.id))}
                  onClick={() => unlockedLevels.has(l.id) ? startLevel(l.id) : null}
                >
                  {unlockedLevels.has(l.id) ? '' : '🔒 '}
                  Level {l.id}: {l.name} ({l.states.length} states)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Level Select ───────────────────────────────────── */}
        {phase === 'levelselect' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <h1 className="page-title">Choose a Level</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '20px auto' }}>
              {LEVELS.map(l => {
                const stats = levelStats[l.id];
                return (
                  <button
                    key={l.id}
                    style={levelButtonStyle(unlockedLevels.has(l.id))}
                    onClick={() => startLevel(l.id)}
                  >
                    {unlockedLevels.has(l.id) ? '' : '🔒 '}
                    Level {l.id}: {l.name}
                    {stats && <span style={{ opacity: 0.85, marginLeft: 8 }}>{stats.correct}/{stats.total} {renderStars(stats.total > 0 && stats.correct / stats.total >= 0.9 ? 3 : stats.total > 0 && stats.correct / stats.total >= 0.7 ? 2 : 1)}</span>}
                  </button>
                );
              })}
            </div>
            <button className="back-btn" onClick={() => setPhase('intro')}>← Back</button>
          </div>
        )}

        {/* ── Playing / Wrong ────────────────────────────────── */}
        {(phase === 'playing' || phase === 'wrong') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button onClick={() => setPhase('levelselect')} style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>🗺️ Levels</button>
              <span style={{ fontSize: 13, color: 'var(--text-medium)' }}>Level {currentLevel}: {LEVELS[currentLevel - 1]?.name}</span>
              <span style={{ fontSize: 13, color: 'var(--text-medium)' }}>{renderStars(starRating)}</span>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#E5E7EB', borderRadius: 8, height: 10, marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ background: regionColor, height: '100%', borderRadius: 8, width: `${Math.min(100, levelProgress * 100)}%`, transition: 'width 0.4s ease' }} />
            </div>

            {/* Prompt banner */}
            <div style={{ background: regionColor, borderRadius: 20, padding: '16px 24px', textAlign: 'center', marginBottom: 10, position: 'relative' }}>
              {phase === 'wrong' && <div style={{ position: 'absolute', top: -8, right: 16, fontSize: 28, animation: 'pop 0.3s ease' }}>🔴</div>}
              <div style={{ color: 'white', fontSize: 12, fontWeight: 500, marginBottom: 2, opacity: 0.9 }}>Find this state:</div>
              <div style={{ color: 'white', fontSize: 30, fontWeight: 700, fontFamily: 'Fredoka' }}>{currentState}</div>
              {phase === 'wrong' && <div style={{ color: 'white', fontSize: 14, marginTop: 4, opacity: 0.9 }}>{encouragement}</div>}
              {phase === 'playing' && celebration && <div style={{ color: 'white', fontSize: 18, marginTop: 4 }}>{celebration}</div>}
            </div>

            {/* Score */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: '#22C55E', fontWeight: 600 }}>✅ {correct}</span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>❌ {wrongCount}</span>
              {missed.length > 0 && <span style={{ color: '#F59E0B', fontWeight: 600 }}>📝 Missed: {missed.length}</span>}
            </div>

            {/* Map */}
            <div style={{ width: '100%', cursor: 'pointer', borderRadius: 16, overflow: 'hidden', border: '3px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <svg viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
                {allStateNames.map(name => {
                  const color = getStateColor(name);
                  const isActive = activeStates.has(name);
                  const isHighlight = flashState === name || (showAnswer && name === currentState);
                  const isWrong = wrongGuess === name;
                  return (
                    <path
                      key={name}
                      d={(() => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(US_MAP_SVG, 'image/svg+xml');
                        const el = doc.querySelector(`#${CSS.escape(name)}`);
                        return el?.getAttribute('d') || '';
                      })()}
                      fill={color}
                      stroke="white"
                      strokeWidth={isHighlight ? 3 : isWrong ? 2.5 : 1.5}
                      style={{ cursor: isActive ? 'pointer' : 'default', transition: 'fill 0.2s', filter: isHighlight ? 'brightness(1.2)' : undefined }}
                      onClick={() => isActive && handleStateClick(name)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
              <button onClick={handleSkip} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#F1F5F9', fontFamily: 'Fredoka', fontSize: 14, cursor: 'pointer', color: '#64748B' }}>Skip ⏭️</button>
              <button onClick={startLevel.bind(null, currentLevel)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#F1F5F9', fontFamily: 'Fredoka', fontSize: 14, cursor: 'pointer', color: '#64748B' }}>Retry Level 🔄</button>
            </div>
          </>
        )}

        {/* ── Level Complete ─────────────────────────────────── */}
        {phase === 'levelcomplete' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 80, marginBottom: 10 }}>
              {starRating === 3 ? '🏆' : starRating === 2 ? '🌟' : '👏'}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 6, fontFamily: 'Fredoka' }}>
              Way to go, {kidName}!
            </h1>
            <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Level {currentLevel} Complete!</p>
            <p style={{ fontSize: 48, marginBottom: 8 }}>{renderStars(starRating)}</p>
            <p style={{ fontSize: 18, color: 'var(--text-medium)', marginBottom: 4 }}>
              You got <strong style={{ color: '#22C55E' }}>{correct}</strong> out of <strong>{correct + missed.length}</strong> states!
            </p>
            {missed.length > 0 && (
              <p style={{ fontSize: 14, color: '#F59E0B', marginBottom: 16 }}>
                States to practice: {missed.join(', ')}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '20px auto' }}>
              {currentLevel < 6 && (
                <button
                  onClick={() => startLevel(currentLevel + 1)}
                  style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: '#22C55E', color: 'white', fontFamily: 'Fredoka', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
                >
                  Next Level ➡️
                </button>
              )}
              <button
                onClick={() => startLevel(currentLevel)}
                style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: '#F1F5F9', color: '#374151', fontFamily: 'Fredoka', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
              >
                Play Again 🔄
              </button>
              <button
                onClick={() => { setShowRating(true); }}
                style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: 'var(--accent-pink)', color: 'white', fontFamily: 'Fredoka', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
              >
                Rate this game ⭐
              </button>
              <button
                onClick={() => setPhase('levelselect')}
                style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: '#F1F5F9', color: '#64748B', fontFamily: 'Fredoka', fontSize: 15, cursor: 'pointer' }}
              >
                Choose Level
              </button>
            </div>
          </div>
        )}
      </div>

      {showRating && (
        <RatingModal
          activity="statefinder"
          activityName="State Finder"
          activityEmoji="🗺️"
          kidName={kidName}
          onClose={() => setShowRating(false)}
        />
      )}
    </>
  );
}
