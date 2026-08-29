'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Earth Explorer — geography game for 2nd grade. Identify continents, oceans,
// and basic landforms on a stylized world map.
//   🌱 Easy   (7 continents)
//   🌿 Medium (+ 5 oceans)
//   🌳 Hard   (+ landforms: mountain, river, lake, desert, island)
// Cross-curricular social studies / geography. Builds on the NGSS + state
// social-studies framework: "Use maps, graphs, and other representations to
// describe places." Also ties into CCSS RI.2.7 (use information from images).

type Difficulty = 0 | 1 | 2;

interface Question {
  target: string;       // canonical name ("Asia", "Pacific Ocean", "Mountain")
  category: 'continent' | 'ocean' | 'landform';
  correct: string;
  choices: string[];
}

// Stylized 7-continent map. Each entry is a path id → continent name + rough color.
const CONTINENT_COLORS: Record<string, string> = {
  asia: '#FF6B9D',
  africa: '#FFD93D',
  north_america: '#6BCBFF',
  south_america: '#6BCB77',
  antarctica: '#C084FC',
  europe: '#FF9F43',
  australia: '#3D8B47',
};

const CONTINENT_NAMES: Record<string, string> = {
  asia: 'Asia',
  africa: 'Africa',
  north_america: 'North America',
  south_america: 'South America',
  antarctica: 'Antarctica',
  europe: 'Europe',
  australia: 'Australia',
};

const OCEAN_NAMES: Record<string, string> = {
  pacific: 'Pacific Ocean',
  atlantic: 'Atlantic Ocean',
  indian: 'Indian Ocean',
  arctic: 'Arctic Ocean',
  southern: 'Southern Ocean',
};

const LANDFORM_NAMES: Record<string, string> = {
  mountain: 'Mountain',
  river: 'River',
  lake: 'Lake',
  desert: 'Desert',
  island: 'Island',
  volcano: 'Volcano',
  valley: 'Valley',
  canyon: 'Canyon',
  forest: 'Forest',
  waterfall: 'Waterfall',
};

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1) + lo);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Stylized world map SVG ──────────────────────────────────────────────────
// 700×420 viewBox. Continent shapes are intentionally simple — kids recognize
// the rough shape + name, not perfect cartography.
function WorldMap({ highlighted }: { highlighted: string | null }) {
  const fillFor = (key: string) =>
    highlighted === key ? '#FFD93D' : CONTINENT_COLORS[key] || '#E5E0D8';
  const strokeFor = (key: string) => highlighted === key ? '#2D1B00' : '#2D1B00';
  return (
    <svg width="100%" viewBox="0 0 700 420" style={{ maxWidth: 520, background: '#BDE0FE', borderRadius: 12 }}>
      {/* Ocean */}
      <rect x="0" y="0" width="700" height="420" fill="#BDE0FE" />
      {/* Asia — upper right large blob */}
      <path data-id="asia" d="M380,90 Q420,60 480,80 L560,110 Q610,140 600,200 L540,260 Q500,280 450,260 L420,210 Q380,170 380,90 Z"
        fill={fillFor('asia')} stroke={strokeFor('asia')} strokeWidth={2} />
      {/* Africa — center, vertical */}
      <path data-id="africa" d="M310,180 Q340,170 360,200 L370,260 Q360,310 330,340 L290,350 Q280,320 280,280 L290,210 Z"
        fill={fillFor('africa')} stroke={strokeFor('africa')} strokeWidth={2} />
      {/* Europe — upper center small */}
      <path data-id="europe" d="M280,90 Q310,70 350,80 L390,100 Q400,130 370,150 L320,160 Q280,140 280,90 Z"
        fill={fillFor('europe')} stroke={strokeFor('europe')} strokeWidth={2} />
      {/* North America — upper left */}
      <path data-id="north_america" d="M50,80 Q100,60 170,80 L220,140 Q230,200 200,230 L140,250 Q80,240 60,200 L40,140 Z"
        fill={fillFor('north_america')} stroke={strokeFor('north_america')} strokeWidth={2} />
      {/* South America — lower left */}
      <path data-id="south_america" d="M170,260 Q200,250 220,280 L230,330 Q220,370 190,380 L160,370 Q150,330 160,290 Z"
        fill={fillFor('south_america')} stroke={strokeFor('south_america')} strokeWidth={2} />
      {/* Australia — lower right */}
      <path data-id="australia" d="M540,300 Q580,290 610,310 L620,350 Q600,370 560,370 L530,360 Q520,330 540,300 Z"
        fill={fillFor('australia')} stroke={strokeFor('australia')} strokeWidth={2} />
      {/* Antarctica — bottom */}
      <path data-id="antarctica" d="M120,390 Q200,380 320,390 L450,395 L580,390 Q600,400 580,415 L100,415 Q80,400 120,390 Z"
        fill={fillFor('antarctica')} stroke={strokeFor('antarctica')} strokeWidth={2} />
    </svg>
  );
}

// Landform icons (simple emoji-based cards)
function LandformCard({ kind, size = 140 }: { kind: string; size?: number }) {
  const emoji: Record<string, string> = {
    mountain: '⛰️',
    river: '🏞️',
    lake: '🏞️',
    desert: '🏜️',
    island: '🏝️',
    volcano: '🌋',
    valley: '🏞️',
    canyon: '🏞️',
    forest: '🌲',
    waterfall: '🌊',
  };
  return (
    <div
      style={{
        display: 'inline-block',
        width: size, height: size,
        background: '#FFF8E7',
        border: '3px solid #E5B85A',
        borderRadius: 14,
        textAlign: 'center',
        lineHeight: `${size}px`,
        fontSize: size * 0.55,
      }}
    >
      {emoji[kind] || '🗺️'}
    </div>
  );
}

// ─── Question generation ─────────────────────────────────────────────────────
function makeQuestion(difficulty: Difficulty): Question {
  if (difficulty === 0) {
    // Easy: 7 continents
    const ids = Object.keys(CONTINENT_NAMES);
    const targetId = pick(ids);
    const target = CONTINENT_NAMES[targetId];
    const correct = target;
    const distractors = shuffle(ids.filter(id => id !== targetId))
      .slice(0, 3)
      .map(id => CONTINENT_NAMES[id]);
    return {
      target,
      category: 'continent',
      correct,
      choices: shuffle([correct, ...distractors]),
    };
  }
  if (difficulty === 1) {
    // Medium: continents + oceans
    const oceanIds = Object.keys(OCEAN_NAMES);
    const continentIds = Object.keys(CONTINENT_NAMES);
    const pool: Array<{ id: string; name: string; category: 'continent' | 'ocean' }> = [
      ...continentIds.map(id => ({ id, name: CONTINENT_NAMES[id], category: 'continent' as const })),
      ...oceanIds.map(id => ({ id, name: OCEAN_NAMES[id], category: 'ocean' as const })),
    ];
    const target = pick(pool);
    const distractors = shuffle(pool.filter(p => p.id !== target.id)).slice(0, 3).map(p => p.name);
    return {
      target: target.name,
      category: target.category,
      correct: target.name,
      choices: shuffle([target.name, ...distractors]),
    };
  }
  // Hard: continents + oceans + landforms
  const landformIds = Object.keys(LANDFORM_NAMES);
  const all: Array<{ name: string; category: 'continent' | 'ocean' | 'landform' }> = [
    ...Object.values(CONTINENT_NAMES).map(n => ({ name: n, category: 'continent' as const })),
    ...Object.values(OCEAN_NAMES).map(n => ({ name: n, category: 'ocean' as const })),
    ...landformIds.map(id => ({ name: LANDFORM_NAMES[id], category: 'landform' as const })),
  ];
  const target = pick(all);
  const distractors = shuffle(all.filter(p => p.name !== target.name)).slice(0, 3).map(p => p.name);
  return {
    target: target.name,
    category: target.category,
    correct: target.name,
    choices: shuffle([target.name, ...distractors]),
  };
}

const TOTAL_ROUNDS = 10;

export default function EarthExplorer({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => {
    const q = makeQuestion(1);
    return q;
  });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('earthexplorer_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
    setScore(0);
    setStreak(0);
    setCurrent(0);
    setFeedback(null);
    setLocked(false);
    setFlash(null);
    setScreen('play');
  }, []);

  const answer = useCallback((choice: string) => {
    if (locked) return;
    const isCorrect = choice === question.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      setFeedback({ kind: 'good', text: `✅ Correct! That's ${question.correct}. 🌍` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('earthexplorer_best_streak', String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1100);
    } else {
      setStreak(0);
      setFlash('bad');
      setFeedback({ kind: 'bad', text: `Not quite. The answer was "${question.correct}".` });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, question, streak, score, current, bestStreak, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'play' && current > 0 && current % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [current, screen, showRating, rated]);

  // Resolve map highlight for continent queries.
  const mapHighlight = question.category === 'continent'
    ? Object.entries(CONTINENT_NAMES).find(([, n]) => n === question.target)?.[0] ?? null
    : null;
  // Resolve landform id for landform queries.
  const landformId = question.category === 'landform'
    ? Object.entries(LANDFORM_NAMES).find(([, n]) => n === question.target)?.[0] ?? null
    : null;

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🌍</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Earth Explorer</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Hop around our planet! Learn the <strong>7 continents</strong>,
          the <strong>5 oceans</strong>, and basic <strong>landforms</strong>.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick an expedition:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 7 continents on the map</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · + 5 oceans</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · + landforms (mountain, river, lake, desert…)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best streak: <strong>{bestStreak}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 rounds per heat. Earn a streak to be a globe-trotter!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🌍' : stars >= 2 ? '🎉🌍' : stars >= 1 ? '👍🌍' : '💪🌍';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
          Trip complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {!rated && score >= 50 && (
          <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
            ⭐ Rate this game
          </button>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>
            🔄 Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
            📋 Pick Level
          </button>
          <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
            🏠 Home
          </button>
        </div>

        {showRating && !rated && (
          <RatingModal
            activity="earth-explorer"
            activityName="Earth Explorer"
            activityEmoji="🌍"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 119, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🌍 Earth Explorer</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-green)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-green)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          {question.category === 'landform' ? 'What landform is shown?' : 'Which ' + question.category + ' is highlighted?'}
        </p>

        {question.category === 'landform' && landformId && (
          <div style={{ marginTop: 14 }}>
            <LandformCard kind={landformId} size={150} />
          </div>
        )}

        {(question.category === 'continent' || question.category === 'ocean') && (
          <div style={{ marginTop: 14 }}>
            <WorldMap highlighted={mapHighlight} />
          </div>
        )}
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(c)}
            disabled={locked}
            className="btn"
            style={{
              background: locked && c === question.correct ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === question.correct ? 'white' : 'var(--text-dark)',
              border: locked && c === question.correct ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: 17,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 17,
            animation: 'pop 0.3s ease',
            background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: our planet has <strong style={{ color: 'var(--accent-blue)' }}>7 continents</strong> and <strong style={{ color: 'var(--accent-blue)' }}>5 oceans</strong> — that's a lot of water!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="earth-explorer"
          activityName="Earth Explorer"
          activityEmoji="🌍"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}