'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Match-3 (Candy Crush-style) — swap adjacent candies to make 3+ in a row
// or column. Matched candies vanish, new ones fall in. Chain combos for bonus.
//   🌱 Easy   · 6×6, reach 400 points
//   🌿 Medium · 6×6, reach 800 points
//   🌳 Hard   · 6×6, reach 1400 points
// Controls: tap a candy to select, then tap an adjacent candy to swap.
// If the swap makes 3+ in a row, it sticks; otherwise it swaps back.

type Difficulty = 0 | 1 | 2;
type Cell = number; // 0..4 (candy type)
type Grid = Cell[][];

const SIZE = 6;
const TARGETS: Record<Difficulty, number> = { 0: 400, 1: 800, 2: 1400 };

const CANDY_EMOJI = ['🍎', '🍊', '🍇', '🍓', '🍌'];
const CANDY_COLORS = ['#E94B5C', '#FF9F43', '#A78BFA', '#FF6B9D', '#FFD93D'];
const CANDY_BG = ['#FFE0E5', '#FFEBD5', '#EDE5FF', '#FFE0EC', '#FFF8DC'];
const NUM_CANDIES = CANDY_EMOJI.length; // 5

// Score per match length (3 = 30, 4 = 50, 5+ = 100). Cascade multipliers stack.
const SCORE_TABLE: Record<number, number> = { 3: 30, 4: 50, 5: 100, 6: 150, 7: 200 };

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function randCell(): Cell {
  return Math.floor(Math.random() * NUM_CANDIES);
}

function generateGrid(): Grid {
  // Fill with random candies, then clear any pre-existing matches so the
  // first swap is what triggers the first clear.
  let g: Grid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => randCell())
  );
  // Run a few "shuffle" passes to reduce initial matches.
  for (let pass = 0; pass < 6; pass++) {
    const { hasMatch } = findMatches(g);
    if (!hasMatch) break;
    // Refill matching cells
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (hasMatch.some(p => p.some(([rr, cc]) => rr === r && cc === c))) {
          g[r][c] = randCell();
        }
      }
    }
  }
  return g;
}

function cloneGrid(g: Grid): Grid {
  return g.map(row => row.slice());
}

// Returns the set of matching positions (arrays of [r,c] coords per match).
function findMatches(g: Grid): { positions: [number, number][][]; hasMatch: [number, number][][] } {
  const matches: [number, number][][] = [];

  // Horizontal
  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const sameAsPrev = c < SIZE && g[r][c] !== 0 && g[r][c] === g[r][c - 1];
      if (!sameAsPrev) {
        const runLen = c - runStart;
        if (runLen >= 3 && g[r][runStart] !== 0) {
          const cells: [number, number][] = [];
          for (let k = runStart; k < c; k++) cells.push([r, k]);
          matches.push(cells);
        }
        runStart = c;
      }
    }
  }

  // Vertical
  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const sameAsPrev = r < SIZE && g[r][c] !== 0 && g[r][c] === g[r - 1][c];
      if (!sameAsPrev) {
        const runLen = r - runStart;
        if (runLen >= 3 && g[runStart][c] !== 0) {
          const cells: [number, number][] = [];
          for (let k = runStart; k < r; k++) cells.push([k, c]);
          matches.push(cells);
        }
        runStart = r;
      }
    }
  }

  const flat: [number, number][] = [];
  for (const m of matches) for (const cell of m) flat.push(cell);
  return { positions: matches, hasMatch: matches.length ? matches : [] };
}

function applyGravity(g: Grid): Grid {
  const next = cloneGrid(g);
  for (let c = 0; c < SIZE; c++) {
    // Walk from bottom to top, compact non-zero cells down.
    let writeRow = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== 0) {
        next[writeRow][c] = next[r][c];
        if (writeRow !== r) next[r][c] = 0;
        writeRow--;
      }
    }
    // Fill empty top cells with new random candies.
    for (let r = writeRow; r >= 0; r--) {
      next[r][c] = randCell();
    }
  }
  return next;
}

function removeMatches(g: Grid, positions: [number, number][][]): Grid {
  const next = cloneGrid(g);
  for (const match of positions) {
    for (const [r, c] of match) next[r][c] = 0;
  }
  return next;
}

// Are two cells adjacent (sharing a side, not diagonal)?
function isAdjacent(a: [number, number], b: [number, number]): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

const TOTAL_ROUNDS = 3;

export default function Match3({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<Grid>(generateGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [target, setTarget] = useState<number>(TARGETS[0]);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState<[number, number] | null>(null);

  // Load best score per difficulty
  useEffect(() => {
    try {
      const s = localStorage.getItem(`match3_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  useEffect(() => { setTarget(TARGETS[difficulty]); }, [difficulty]);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setTarget(TARGETS[d]);
    setRound(0);
    setScore(0);
    setGrid(generateGrid());
    setSelected(null);
    setHover(null);
    setWon(false);
    setBusy(false);
    setScreen('play');
  }, []);

  const finishGame = useCallback(() => {
    if (score > bestScore) {
      try {
        localStorage.setItem(`match3_best_${difficulty}`, String(score));
        setBestScore(score);
      } catch {}
    }
    const isLast = round + 1 >= TOTAL_ROUNDS;
    if (isLast) {
      setTimeout(() => setScreen('results'), 1200);
    } else {
      setTimeout(() => {
        setRound(r => r + 1);
        setScore(0);
        setGrid(generateGrid());
        setSelected(null);
        setHover(null);
        setWon(false);
      }, 1500);
    }
  }, [score, bestScore, difficulty, round]);

  // Try a swap. If it produces matches, commit + cascade. Otherwise revert.
  const trySwap = useCallback((a: [number, number], b: [number, number]) => {
    if (busy) return;
    if (!isAdjacent(a, b)) {
      setSelected(null);
      return;
    }
    setBusy(true);
    setGrid(prev => {
      const next = cloneGrid(prev);
      const tmp = next[a[0]][a[1]];
      next[a[0]][a[1]] = next[b[0]][b[1]];
      next[b[0]][b[1]] = tmp;
      const { positions } = findMatches(next);
      if (positions.length === 0) {
        // No match — revert (snap back after a brief delay)
        setTimeout(() => {
          setGrid(p2 => {
            const rev = cloneGrid(p2);
            const t = rev[a[0]][a[1]];
            rev[a[0]][a[1]] = rev[b[0]][b[1]];
            rev[b[0]][b[1]] = t;
            return rev;
          });
          setSelected(null);
          setBusy(false);
        }, 200);
        return next; // keep the (no-match) swap for 200ms visually then revert
      }
      // Matches found — apply cascading clears
      let chain = 1;
      let gained = 0;
      let totalGained = 0;
      let g = next;
      const allCleared: [number, number][] = [];
      while (true) {
        const m = findMatches(g);
        if (m.positions.length === 0) break;
        // Score each match
        let cascadeScore = 0;
        for (const match of m.positions) {
          const len = match.length;
          const base = SCORE_TABLE[len] || SCORE_TABLE[5];
          cascadeScore += base * chain;
          for (const [r, c] of match) allCleared.push([r, c]);
        }
        gained += cascadeScore;
        g = removeMatches(g, m.positions);
        g = applyGravity(g);
        chain++;
      }
      totalGained = gained;
      setScore(s => s + totalGained);
      setSelected(null);
      // Check win
      if ((score + totalGained) >= target) {
        setWon(true);
        setTimeout(() => finishGame(), 800);
        return g;
      }
      setBusy(false);
      return g;
    });
  }, [busy, score, target, finishGame]);

  const handleCellClick = (r: number, c: number) => {
    if (busy) return;
    if (selected === null) {
      setSelected([r, c]);
      return;
    }
    if (selected[0] === r && selected[1] === c) {
      setSelected(null);
      return;
    }
    if (isAdjacent(selected, [r, c])) {
      trySwap(selected, [r, c]);
    } else {
      // Select the new cell instead
      setSelected([r, c]);
    }
  };

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🍬</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Match-3</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          <strong>Swap two adjacent candies</strong> to line up 3 or more in a
          row or column. They vanish, new ones fall in, and chain combos
          score bonus!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: 36, marginBottom: 20 }}>
          <span>🍎</span><span>🍊</span><span>🍇</span><span>🍓</span><span>🍌</span>
        </div>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a target score:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · target 400</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · target 800</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · target 1400</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best score (this level): <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} games per match. Tap a candy, then tap an adjacent one to swap.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🍬</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Best score: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {bestScore >= 1400 ? '⭐⭐⭐' : bestScore >= 800 ? '⭐⭐' : '⭐'}
        </div>

        {!rated && bestScore > 0 && (
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
            activity="match-3"
            activityName="Match-3"
            activityEmoji="🍬"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, position: 'relative' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🍬 Match-3</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-pink)' }}>{score}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Target <strong style={{ color: 'var(--accent-blue)' }}>{target}</strong></span>
        <span>·</span>
        <span>Game <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'var(--accent-pink)',
          padding: 12,
          borderRadius: 14,
          boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
          marginBottom: 16,
          touchAction: 'manipulation',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${SIZE}, 1fr)`,
            gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
            gap: 4,
            background: 'rgba(0,0,0,0.15)',
            padding: 6,
            borderRadius: 10,
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isHover = hover && hover[0] === r && hover[1] === c;
              const showHighlight = isSelected || isHover;
              const candy = val > 0 ? val - 1 : 0;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHover([r, c])}
                  onMouseLeave={() => setHover(null)}
                  disabled={busy}
                  aria-label={`candy ${val} at ${r},${c}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: val === 0 ? 'rgba(255,255,255,0.2)' : CANDY_BG[candy],
                    borderRadius: 8,
                    border: showHighlight ? `3px solid ${CANDY_COLORS[candy]}` : '2px solid transparent',
                    fontSize: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    cursor: busy ? 'default' : 'pointer',
                    transition: 'transform 0.1s, border-color 0.15s',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isSelected ? `0 0 0 3px ${CANDY_COLORS[candy]}55` : 'none',
                  }}
                >
                  {val === 0 ? '' : CANDY_EMOJI[candy]}
                </button>
              );
            })
          )}
        </div>
      </div>

      {won && (
        <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>
          🎉 Target reached! Great matching!
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: tap a candy to select it, then tap an <strong>adjacent</strong> candy to swap. Match 3+ in a row!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="match-3"
          activityName="Match-3"
          activityEmoji="🍬"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}