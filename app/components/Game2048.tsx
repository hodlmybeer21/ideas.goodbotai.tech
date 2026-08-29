'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Game 2048 (kid-friendly edition) — swipe to combine matching tiles.
//   🌱 Easy   · 4×4, target 64
//   🌿 Medium · 4×4, target 128
//   🌳 Hard   · 4×4, target 256
// Controls: arrow keys (desktop) or swipe gestures (touch). Each move
// slides all tiles as far as possible, merging equal neighbors. A new
// 2 (or 4) spawns after every move. Win by reaching the target tile; game
// ends when no moves remain. Tracks best score per difficulty.

type Difficulty = 0 | 1 | 2;
type Grid = (number | null)[][];

const SIZE = 4;
const TARGETS: Record<Difficulty, number> = { 0: 64, 1: 128, 2: 256 };

// Tile colors. Higher tiles get warmer / more saturated colors.
const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2:    { bg: '#EEE4DA', fg: '#776E65' },
  4:    { bg: '#EDE0C8', fg: '#776E65' },
  8:    { bg: '#F2B179', fg: '#FFFFFF' },
  16:   { bg: '#F59563', fg: '#FFFFFF' },
  32:   { bg: '#F67C5F', fg: '#FFFFFF' },
  64:   { bg: '#F65E3B', fg: '#FFFFFF' },
  128:  { bg: '#EDCF72', fg: '#FFFFFF' },
  256:  { bg: '#EDCC61', fg: '#FFFFFF' },
  512:  { bg: '#EDC850', fg: '#FFFFFF' },
  1024: { bg: '#EDC53F', fg: '#FFFFFF' },
  2048: { bg: '#EDC22E', fg: '#FFFFFF' },
};
const DEFAULT_TILE = { bg: '#3D8B47', fg: '#FFFFFF' };

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

function spawnTile(g: Grid): Grid {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === null) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return g;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = cloneGrid(g);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function initGrid(): Grid {
  let g = emptyGrid();
  g = spawnTile(g);
  g = spawnTile(g);
  return g;
}

type Direction = 'up' | 'down' | 'left' | 'right';

function move(g: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } {
  let score = 0;
  let moved = false;
  // Build a new grid; for each row/col (depending on direction), slide + merge.
  const newG: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let i = 0; i < SIZE; i++) {
    // Extract the line in the direction order
    const line: number[] = [];
    for (let j = 0; j < SIZE; j++) {
      let r = 0, c = 0;
      if (dir === 'left')  { r = i; c = j; }
      if (dir === 'right') { r = i; c = SIZE - 1 - j; }
      if (dir === 'up')    { r = j; c = i; }
      if (dir === 'down')  { r = SIZE - 1 - j; c = i; }
      line.push(g[r][c] ?? 0);
    }
    // Slide non-zero to the start
    const filtered = line.filter(v => v !== 0);
    // Merge adjacent equal pairs
    const merged: number[] = [];
    let skip = false;
    for (let k = 0; k < filtered.length; k++) {
      if (skip) { skip = false; continue; }
      if (k + 1 < filtered.length && filtered[k] === filtered[k + 1]) {
        merged.push(filtered[k] * 2);
        score += filtered[k] * 2;
        skip = true;
      } else {
        merged.push(filtered[k]);
      }
    }
    // Pad with zeros to length SIZE
    while (merged.length < SIZE) merged.push(0);
    // Write back to newG
    for (let j = 0; j < SIZE; j++) {
      let r = 0, c = 0;
      if (dir === 'left')  { r = i; c = j; }
      if (dir === 'right') { r = i; c = SIZE - 1 - j; }
      if (dir === 'up')    { r = j; c = i; }
      if (dir === 'down')  { r = SIZE - 1 - j; c = i; }
      newG[r][c] = merged[j] || null;
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

const TOTAL_ROUNDS = 3; // "rounds" = games played per match

export default function Game2048({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<Grid>(initGrid);
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

  // Load best score for current difficulty
  useEffect(() => {
    try {
      const s = localStorage.getItem(`game2048_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  // Set target when difficulty changes
  useEffect(() => {
    setTarget(TARGETS[difficulty]);
  }, [difficulty]);

  const newGame = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setBusy(false);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setTarget(TARGETS[d]);
    setRound(0);
    setScore(0);
    setGrid(initGrid());
    setGameOver(false);
    setWon(false);
    setBusy(false);
    setScreen('play');
  }, []);

  const finishGame = useCallback(() => {
    setGameOver(true);
    // Update best score
    if (score > bestScore) {
      try {
        localStorage.setItem(`game2048_best_${difficulty}`, String(score));
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
      const withSpawn = spawnTile(next);
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
  }, [gameOver, won, busy, target, finishGame]);

  // Keyboard handler
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

  // Touch / swipe handler
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
  // Mouse drag handler
  const dragStart = useRef<{ x: number; y: number } | null>(null);
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
        <div style={{ fontSize: 80, marginTop: 12 }}>🔢</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>2048</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Swipe to slide tiles. <strong>Same numbers merge into double!</strong>
          Keep combining until you reach the target tile.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your target tile:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · target 64</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · target 128</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · target 256</span>
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
        <div style={{ fontSize: 90, marginTop: 24 }}>🔢</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
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
            activity="2048"
            activityName="2048"
            activityEmoji="🔢"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', userSelect: 'none' }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🔢 2048</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-orange)' }}>{score}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Target <strong style={{ color: 'var(--accent-blue)' }}>{target}</strong></span>
        <span>·</span>
        <span>Game <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'var(--accent-orange)',
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
            background: 'rgba(0,0,0,0.1)',
            padding: 8,
            borderRadius: 8,
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const tile = val !== null ? TILE_COLORS[val] || { bg: '#222', fg: '#fff' } : null;
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
                    fontSize: val !== null && val >= 100 ? 22 : val !== null && val >= 16 ? 28 : 34,
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

      {/* Overlay messages */}
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
        Tip: arrow keys (←↑→↓) on desktop, or swipe in any direction on touch.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="2048"
          activityName="2048"
          activityEmoji="🔢"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}