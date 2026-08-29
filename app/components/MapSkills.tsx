'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Map Skills — compass rose, cardinal directions, map key/legend. Explorer
// theme — the player navigates using a compass and reads simple maps.
//   🌱 Easy   (N/S/E/W, which way is up on the map)
//   🌿 Medium (NE/NW/SE/SW, compass rose directions)
//   🌳 Hard   (read a simple map key, find a location on a grid)
// Cross-curricular geography. Builds on map skills typically introduced in
// grade 2 social studies.

type Difficulty = 0 | 1 | 2;

interface Question {
  prompt: string;
  correct: string;
  choices: string[];
  visual?: 'compass' | 'grid';
}

const DIRECTIONS_4 = [
  { abbr: 'N', name: 'North' },
  { abbr: 'S', name: 'South' },
  { abbr: 'E', name: 'East' },
  { abbr: 'W', name: 'West' },
];

const DIRECTIONS_8 = [
  ...DIRECTIONS_4,
  { abbr: 'NE', name: 'Northeast' },
  { abbr: 'NW', name: 'Northwest' },
  { abbr: 'SE', name: 'Southeast' },
  { abbr: 'SW', name: 'Southwest' },
];

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1) + lo);
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Compact compass rose SVG
function CompassRose({ highlight }: { highlight?: string }) {
  const w = 160, h = 160, cx = w / 2, cy = h / 2;
  const dirs = [
    { abbr: 'N', angle: 0, label: 'N' },
    { abbr: 'NE', angle: 45, label: 'NE' },
    { abbr: 'E', angle: 90, label: 'E' },
    { abbr: 'SE', angle: 135, label: 'SE' },
    { abbr: 'S', angle: 180, label: 'S' },
    { abbr: 'SW', angle: 225, label: 'SW' },
    { abbr: 'W', angle: 270, label: 'W' },
    { abbr: 'NW', angle: 315, label: 'NW' },
  ];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ background: '#FFF8E7', borderRadius: 14, border: '2px solid #E5B85A' }}>
      <circle cx={cx} cy={cy} r={70} fill="#FFE9B0" stroke="#2D1B00" strokeWidth={2} />
      {/* 8-point star */}
      {dirs.map(d => {
        const rad = (d.angle - 90) * Math.PI / 180;
        const x = cx + 60 * Math.cos(rad);
        const y = cy + 60 * Math.sin(rad);
        const isHighlighted = highlight === d.abbr;
        return (
          <g key={d.abbr}>
            <line
              x1={cx} y1={cy}
              x2={x} y2={y}
              stroke={isHighlighted ? 'var(--accent-pink)' : '#2D1B00'}
              strokeWidth={isHighlighted ? 4 : 2}
              strokeDasharray={d.abbr.length > 1 ? '4 3' : 'none'}
            />
            <text
              x={cx + 70 * Math.cos(rad)}
              y={cy + 70 * Math.sin(rad) + 5}
              fontSize={d.abbr.length > 1 ? 12 : 14}
              fontWeight={700}
              textAnchor="middle"
              fill={isHighlighted ? 'var(--accent-pink)' : '#2D1B00'}
              fontFamily="Fredoka, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      {/* North arrow (red/standard) */}
      <polygon
        points={`${cx},${cy - 50} ${cx - 8},${cy} ${cx},${cy - 8} ${cx + 8},${cy}`}
        fill="var(--accent-pink)"
        stroke="#2D1B00"
        strokeWidth={1}
      />
      <circle cx={cx} cy={cy} r={5} fill="#2D1B00" />
    </svg>
  );
}

// Simple 4x4 grid map with a marker; player picks the direction to move
function GridMap({ marker }: { marker: { row: number; col: number; target: { row: number; col: number } } }) {
  const size = 4;
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" style={{ background: '#FFF8E7', borderRadius: 12, border: '2px solid #E5B85A' }}>
      {/* Grid */}
      {Array.from({ length: size + 1 }).map((_, i) => (
        <g key={i}>
          <line x1={i * 50} y1={0} x2={i * 50} y2={200} stroke="#C5B5A2" strokeWidth={1} />
          <line x1={0} y1={i * 50} x2={200} y2={i * 50} stroke="#C5B5A2" strokeWidth={1} />
        </g>
      ))}
      {/* Player marker */}
      <circle cx={marker.col * 50 + 25} cy={marker.row * 50 + 25} r={14} fill="var(--accent-blue)" stroke="#2D1B00" strokeWidth={2} />
      <text x={marker.col * 50 + 25} y={marker.row * 50 + 30} fontSize={16} textAnchor="middle" fill="white" fontWeight={700}>📍</text>
      {/* Target marker */}
      {marker.target && (
        <rect x={marker.target.col * 50 + 8} y={marker.target.row * 50 + 8} width={34} height={34} fill="var(--accent-pink)" stroke="#2D1B00" strokeWidth={2} rx={4} />
      )}
    </svg>
  );
}

function makeQuestion(difficulty: Difficulty): Question {
  if (difficulty === 0) {
    // Easy: cardinal directions
    const kind = Math.random();
    if (kind < 0.5) {
      // "Which direction is up on a map?" → North
      return {
        prompt: 'Which direction is at the TOP of a map?',
        correct: 'North',
        choices: shuffle(['North', 'South', 'East', 'West']),
        visual: 'compass',
      };
    } else {
      // Identify a direction on the compass
      const dir = pick(DIRECTIONS_4);
      return {
        prompt: `Which direction does "${dir.abbr}" stand for on the compass?`,
        correct: dir.name,
        choices: shuffle(DIRECTIONS_4.map(d => d.name)),
        visual: 'compass',
      };
    }
  }
  if (difficulty === 1) {
    // Medium: 8-direction compass
    const dir = pick(DIRECTIONS_8);
    return {
      prompt: `Which direction is between North and East on the compass?`,
      correct: dir.abbr === 'NE' ? 'Northeast' : dir.name,
      choices: shuffle(DIRECTIONS_8.map(d => d.name)),
      visual: 'compass',
    };
  }
  // Hard: grid map navigation — "where do you go to get to X?"
  const playerRow = randInt(1, 2);
  const playerCol = randInt(1, 2);
  let targetRow: number, targetCol: number;
  do {
    targetRow = randInt(0, 3);
    targetCol = randInt(0, 3);
  } while (targetRow === playerRow && targetCol === playerCol);
  const dRow = targetRow - playerRow;
  const dCol = targetCol - playerCol;
  let direction: string;
  if (dRow < 0 && dCol === 0) direction = 'North';
  else if (dRow > 0 && dCol === 0) direction = 'South';
  else if (dRow === 0 && dCol > 0) direction = 'East';
  else if (dRow === 0 && dCol < 0) direction = 'West';
  else if (dRow < 0 && dCol > 0) direction = 'Northeast';
  else if (dRow < 0 && dCol < 0) direction = 'Northwest';
  else if (dRow > 0 && dCol > 0) direction = 'Southeast';
  else direction = 'Southwest';
  return {
    prompt: `You're at 📍. Which direction do you go to reach 🟪?`,
    correct: direction,
    choices: shuffle(DIRECTIONS_8.map(d => d.name)),
    visual: 'grid',
  };
}

const TOTAL_ROUNDS = 10;

export default function MapSkills({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
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
      const s = localStorage.getItem('mapskills_best_streak');
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
      setFeedback({ kind: 'good', text: `✅ Correct! ${question.correct} is right.` });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('mapskills_best_streak', String(newStreak));
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

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🗺️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Map Skills</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Learn to read a compass and a grid map! Find your way with
          <strong> North, South, East, West</strong> — and the diagonals too.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a compass:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · N, S, E, W</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · + NE, NW, SE, SW</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · navigate a grid map</span>
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
          10 waypoints per expedition. Follow the compass!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🗺️' : stars >= 2 ? '🎉🗺️' : stars >= 1 ? '👍🗺️' : '💪🗺️';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Expedition complete!
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
            activity="map-skills"
            activityName="Map Skills"
            activityEmoji="🗺️"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(107, 203, 255, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🗺️ Map Skills</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-blue)' }}>{score}</strong> pts</span>
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
          border: '3px solid var(--accent-blue)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 17, color: 'var(--text-dark)' }}>
          {question.prompt}
        </p>
        <div style={{ marginTop: 14, display: 'inline-block' }}>
          {question.visual === 'grid' ? (
            <GridMap marker={{ row: 1, col: 1, target: { row: 2, col: 2 } }} />
          ) : (
            <CompassRose />
          )}
        </div>
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
              fontSize: 18,
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
        Tip: <strong style={{ color: 'var(--accent-pink)' }}>N</strong>orth is up, <strong style={{ color: 'var(--accent-pink)' }}>E</strong>ast is right, <strong style={{ color: 'var(--accent-pink)' }}>S</strong>outh is down, <strong style={{ color: 'var(--accent-pink)' }}>W</strong>est is left.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="map-skills"
          activityName="Map Skills"
          activityEmoji="🗺️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}