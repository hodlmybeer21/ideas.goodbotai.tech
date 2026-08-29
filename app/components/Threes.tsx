'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Threes-style (kid-friendly) — swipe to combine tiles, but with the
// classic Threes rules: 1s only combine with 1s, and mostly 1s/2s spawn.
//   🌱 Easy   · 4×4, target 48
//   🌿 Medium · 4×4, target 96
//   🌳 Hard   · 4×4, target 192
// Controls: arrow keys (desktop) or swipe (touch). Each move slides all
// tiles as far as possible, merging equal pairs. 1+1=2, 2+2=4, 3+3=6,
// 6+6=12, etc. — but 1+2 won't merge. Shows the NEXT tile before you
// make your move (classic Threes feature). Tracks best score per
// difficulty in localStorage.

type Difficulty = 0 | 1 | 2;
type Grid = (number | null)[][];

const SIZE = 4;
const TARGETS: Record<Difficulty, number> = { 0: 48, 1: 96, 2: 192 };

// Tile colors — Threes-inspired palette.
const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  1:    { bg: '#5B7FFF', fg: '#FFFFFF' },
  2:    { bg: '#E94B5C', fg: '#FFFFFF' },
  3:    { bg: '#2D2D2D', fg: '#FFFFFF' },
  6:    { bg: '#FF9FB1', fg: '#2D2D2D' },
  12:   { bg: '#FFA94D', fg: '#FFFFFF' },
  24:   { bg: '#FFD93D', fg: '#2D2D2D' },
  48:   { bg: '#6BCB77', fg: '#FFFFFF' },
  96:   { bg: '#4D96A8', fg: '#FFFFFF' },
  192:  { bg: '#9B59B6', fg: '#FFFFFF' },
  384:  { bg: '#6C3BAA', fg: '#FFFFFF' },
  768:  { bg: '#F39C12', fg: '#FFFFFF' },
  1536: { bg: '#E67E22', fg: '#FFFFFF' },
};
const DEFAULT_TILE = { bg: '#888888', fg: '#FFFFFF' };

function tileColor(v: number): { bg: string; fg: string } {
  return TILE_COLORS[v] || DEFAULT_TILE;
}

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function cloneGrid(g: Grid): Grid {
  return g.map(row => row.slice());
}

function gridsEqual(a: Grid, b: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function randEmpty(g: Grid): [number, number] | null {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === null) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

// Threes-style spawn: 60% 1, 30% 2, 10% 3
function spawnValue(): 1 | 2 | 3 {
  const r = Math.random();
  if (r < 0.6) return 1;
  if (r < 0.9) return 2;
  return 3;
}

function initGrid(): Grid {
  const g = emptyGrid();
  const a = randEmpty(g);
  if (a) { const [r, c] = a; g[r][c] = spawnValue(); }
  const b = randEmpty(g);
  if (b) { const [r, c] = b; g[r][c] = spawnValue(); }
  return g;
}

type Direction = 'up' | 'down' | 'left' | 'right';

function move(g: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } {
  let score = 0;
  let moved = false;
  const newG: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let i = 0; i < SIZE; i++) {
    // Extract the line in the direction order (preserving order)
    const line: (number | null)[] = [];
    for (let j = 0; j < SIZE; j++) {
      let r = 0, c = 0;
      if (dir === 'left')  { r = i; c = j; }
      if (dir === 'right') { r = i; c = SIZE - 1 - j; }
      if (dir === 'up')    { r = j; c = i; }
      if (dir === 'down')  { r = SIZE - 1 - j; c = i; }
      line.push(g[r][c]);
    }
    // Slide non-null to the start
    const filtered = line.filter(v => v !== null) as number[];
    // Merge equal adjacent pairs
    const merged: (number | null)[] = [];
    let skip = false;
    for (let k = 0; k < filtered.length; k++) {
      if (skip) { skip = false; continue; }
      if (k + 1 < filtered.length && filtered[k] === filtered[k + 1]) {
        const newVal = filtered[k] * 2;
        merged.push(newVal);
        score += newVal;
        skip = true;
      } else {
        merged.push(filtered[k]);
      }
    }
    while (merged.length < SIZE) merged.push(null);
    // Write back to newG
    for (let j = 0; j < SIZE; j++) {
      let r = 0, c = 0;
      if (dir === 'left')  { r = i; c = j; }
      if (dir === 'right') { r = i; c = SIZE - 1 - j; }
      if (dir === 'up')    { r = j; c = i; }
      if (dir === 'down')  { r = SIZE - 1 - j; c = i; }
      newG[r][c] = merged[j];
    }
  }
  moved = !gridsEqual(g, newG);
  return { grid: newG, score, moved };
}

function canMove(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === null) return true;
      if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return true;
      if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return true;
    }
  }
  return false;
}

function hasTarget(g: Grid, target: number): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] !== null && g[r][c]! >= target) return true;
    }
  }
  return false;
}

function highestTile(g: Grid): number {
  let max = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] !== null && g[r][c]! > max) max = g[r][c]!;
    }
  }
  return max;
}

const TOTAL_ROUNDS = 3;

export default function Threes({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [nextTile, setNextTile] = useState<1 | 2 | 3>(spawnValue);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [target, setTarget] = useState<number>(TARGETS[0]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [busy, setBusy] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // Load best score per difficulty
  useEffect(() => {
    try {
      const s = localStorage.getItem(`threes_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  useEffect(() => {
    setTarget(TARGETS[difficulty]);
  }, [difficulty]);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setTarget(TARGETS[d]);
    setRound(0);
    setScore(0);
    setGrid(initGrid());
    setNextTile(spawnValue());
    setGameOver(false);
    setWon(false);
    setBusy(false);
    setScreen('play');
  }, []);

  const finishGame = useCallback(() => {
    setGameOver(true);
    if (score > bestScore) {
      try {
        localStorage.setItem(`threes_best_${difficulty}`, String(score));
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
        setGrid(initGrid());
        setNextTile(spawnValue());
        setGameOver(false);
        setWon(false);
      }, 1500);
    }
  }, [score, bestScore, difficulty, round]);

  const doMove = useCallback((dir: Direction) => {
    if (gameOver || won || busy) return;
    setBusy(true);
    setGrid(prev => {
      const { grid: next, score: gained, moved } = move(prev, dir);
      if (!moved) {
        setBusy(false);
        return prev;
      }
      setScore(s => s + gained);
      // Place the queued next tile
      const cell = randEmpty(next);
      const withSpawn = cloneGrid(next);
      if (cell) {
        const [r, c] = cell;
        withSpawn[r][c] = nextTile;
      }
      // Roll a new next tile
      setNextTile(spawnValue());
      // Win check
      if (hasTarget(withSpawn, target)) {
        setWon(true);
        setTimeout(() => finishGame(), 800);
        return withSpawn;
      }
      // Game over check
      if (!canMove(withSpawn)) {
        setTimeout(() => finishGame(), 600);
        return withSpawn;
      }
      setBusy(false);
      return withSpawn;
    });
  }, [gameOver, won, busy, target, nextTile, finishGame]);

  // Keyboard
  useEffect(() => {
    if (screen !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      if (gameOver || won) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); doMove('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); doMove('right'); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); doMove('up'); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); doMove('down'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, gameOver, won, doMove]);

  // Touch / mouse swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 20) { touchStart.current = null; return; }
    if (absX > absY) doMove(dx > 0 ? 'right' : 'left');
    else            doMove(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < 20) { dragStart.current = null; return; }
    if (absX > absY) doMove(dx > 0 ? 'right' : 'left');
    else            doMove(dy > 0 ? 'down' : 'up');
    dragStart.current = null;
  };

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🎲</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Threes</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Swipe to slide tiles. <strong>Match same numbers to double them!</strong>
          1 + 1 = 2, 2 + 2 = 4, 3 + 3 = 6, and so on. Keep combining until
          you hit the target!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your target tile:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · target 48</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · target 96</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · target 192</span>
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
          {TOTAL_ROUNDS} games per match. Use arrow keys (desktop) or swipe (touch).
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    const high = highestTile(grid);
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🎲</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Best score: <strong>{bestScore}</strong> · Highest tile: <strong>{high}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {high >= target ? '⭐⭐⭐' : high >= target / 2 ? '⭐⭐' : '⭐'}
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
            activity="threes"
            activityName="Threes"
            activityEmoji="🎲"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const nextColor = tileColor(nextTile);
  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', userSelect: 'none' }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🎲 Threes</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-blue)' }}>{score}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Target <strong style={{ color: 'var(--accent-orange)' }}>{target}</strong></span>
        <span>·</span>
        <span>Game <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Next-tile preview — classic Threes feature */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.6)',
        padding: '8px 14px', borderRadius: 10,
        marginBottom: 10,
        fontSize: 14, color: 'var(--text-medium)',
        boxShadow: 'var(--shadow)',
      }}>
        <span><strong>Next:</strong></span>
        <div
          style={{
            width: 40, height: 40, borderRadius: 6,
            background: nextColor.bg,
            color: nextColor.fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fredoka, sans-serif', fontSize: 22, fontWeight: 700,
          }}
        >
          {nextTile}
        </div>
        <span style={{ fontSize: 12 }}>swipe to place it</span>
      </div>

      <div
        style={{
          background: 'var(--accent-blue)',
          padding: 12,
          borderRadius: 14,
          boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
          marginBottom: 16,
          touchAction: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${SIZE}, 1fr)`,
            gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
            gap: 8,
            background: 'rgba(0,0,0,0.15)',
            padding: 8,
            borderRadius: 8,
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const tile = val !== null ? tileColor(val) : null;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    aspectRatio: '1 / 1',
                    background: tile?.bg || 'rgba(255,255,255,0.35)',
                    color: tile?.fg || 'transparent',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: val !== null && val >= 100 ? 22 : val !== null && val >= 12 ? 28 : 34,
                    fontWeight: 700,
                    transition: 'background-color 0.15s, color 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {val !== null ? val : ''}
                </div>
              );
            })
          )}
        </div>
      </div>

      {won && (
        <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>
          🎉 You hit {target}! Game over, great job!
        </div>
      )}
      {gameOver && !won && (
        <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-pink)' }}>
          💪 No more moves! Game over.
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: arrow keys (←↑→↓) on desktop, or swipe. Plan around the <strong>next tile</strong>!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="threes"
          activityName="Threes"
          activityEmoji="🎲"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}