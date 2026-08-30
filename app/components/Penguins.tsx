'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Penguins (kid edition) — classic sliding-ice puzzle. Push ice blocks
// to fill all the holes. You can only push (never pull) and blocks slide
// until they hit a wall, another block, or another penguin.
//   🌱 Easy   · 5×4 grid, 2 holes, 12 moves
//   🌿 Medium · 6×5 grid, 3 holes, 18 moves
//   🌳 Hard   · 7×5 grid, 4 holes, 22 moves
// Controls: click a penguin or block to select it, then click an
// adjacent empty cell to push it. Or use arrow keys to push from that
// direction.

type Difficulty = 0 | 1 | 2;
type CellType = 0 | 1 | 2 | 3; // 0=empty, 1=ice, 2=hole, 3=wall
type Grid = CellType[][];
type Pos = { r: number; c: number };

const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; holes: number; moves: number; name: string }> = {
  0: { rows: 4, cols: 5, holes: 2, moves: 12, name: 'Baby Steps' },
  1: { rows: 5, cols: 6, holes: 3, moves: 18, name: 'Slippery' },
  2: { rows: 5, cols: 7, holes: 4, moves: 22, name: 'Deep Freeze' },
};

const TOTAL_ROUNDS = 3;

function emptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function generateLevel(difficulty: Difficulty): { grid: Grid; penguinStart: Pos; iceBlocks: Pos[]; moves: number } {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const { rows, cols, holes, moves } = cfg;
  const grid = emptyGrid(rows, cols);
  // Place walls around the border
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) grid[r][c] = 3;
    }
  }
  // Place penguin
  const penguinStart: Pos = { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };
  grid[penguinStart.r][penguinStart.c] = 0; // penguin on empty (we'll track separately)
  // Place ice blocks
  const iceBlocks: Pos[] = [];
  for (let i = 0; i < holes; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 1 + Math.floor(Math.random() * (rows - 2));
      const c = 1 + Math.floor(Math.random() * (cols - 2));
      // Check it's not on the penguin or existing blocks
      if ((r === penguinStart.r && c === penguinStart.c) || grid[r][c] !== 0) { attempts++; continue; }
      // Place an ice block adjacent to a hole (so it can be pushed into the hole)
      // For simplicity, just place it anywhere empty
      grid[r][c] = 1; // ice
      iceBlocks.push({ r, c });
      placed = true;
    }
  }
  // Place holes somewhere not occupied
  for (let i = 0; i < holes; i++) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const r = 1 + Math.floor(Math.random() * (rows - 2));
      const c = 1 + Math.floor(Math.random() * (cols - 2));
      if (grid[r][c] === 0) {
        grid[r][c] = 2;
        placed = true;
      }
      attempts++;
    }
  }
  return { grid, penguinStart, iceBlocks, moves };
}

function isSolved(grid: Grid, holes: Pos[]): boolean {
  for (const h of holes) {
    if (grid[h.r][h.c] !== 1) return false; // hole not covered by ice
  }
  return true;
}

function cloneGrid(g: Grid): Grid {
  return g.map(row => row.slice());
}

function equalGrids(a: Grid, b: Grid): boolean {
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function tryPush(grid: Grid, penguin: Pos, dr: number, dc: number): { grid: Grid; penguin: Pos; moved: boolean } {
  const { rows, cols } = { rows: grid.length, cols: grid[0].length };
  const nr = penguin.r + dr;
  const nc = penguin.c + dc;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return { grid, penguin, moved: false };
  const target = grid[nr][nc];
  if (target === 3) return { grid, penguin, moved: false }; // wall
  if (target === 0) {
    // Empty cell - just move
    return { grid, penguin: { r: nr, c: nc }, moved: true };
  }
  if (target === 1 || target === 2) {
    // Ice or hole - need to push. Find the next cell.
    let pr = nr;
    let pc = nc;
    while (true) {
      pr += dr;
      pc += dc;
      if (pr < 0 || pr >= rows || pc < 0 || pc >= cols) return { grid, penguin, moved: false };
      const t = grid[pr][pc];
      if (t === 3 || t === 1 || t === 2) return { grid, penguin, moved: false }; // blocked
      // Empty cell - push the block here
      const newGrid = cloneGrid(grid);
      newGrid[pr][pc] = target; // move the block
      newGrid[nr][nc] = 0; // clear the cell where block was
      return { grid: newGrid, penguin: { r: nr, c: nc }, moved: true };
    }
  }
  return { grid, penguin, moved: false };
}

const TOTAL_MOVES_BY_DIFF: Record<Difficulty, number> = { 0: 12, 1: 18, 2: 22 };

const CELL_COLORS: Record<CellType, string> = {
  0: '#E8F4F8', // empty (ice floor)
  1: '#B3D9E8', // ice block
  2: '#1B4F6B', // hole (dark water)
  3: '#6B8B95', // wall
};
const PENGUIN_COLOR = '#2D2D2D';
const PENGUIN_BELLY = '#FFFFFF';

export default function Penguins({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<Grid>(emptyGrid(4, 5));
  const [penguin, setPenguin] = useState<Pos>({ r: 0, c: 0 });
  const [holes, setHoles] = useState<Pos[]>([]);
  const [movesLeft, setMovesLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(0);
  const [bestSolved, setBestSolved] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [selected, setSelected] = useState<Pos | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(`penguins_best_${difficulty}`);
      if (s) setBestSolved(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  const startLevel = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const level = generateLevel(d);
    setGrid(level.grid);
    setPenguin(level.penguinStart);
    setHoles(level.iceBlocks.map(b => {
      // Find a nearby empty cell for the hole
      // For simplicity, place hole right next to the block
      const neighbors: Pos[] = [
        { r: b.r + 1, c: b.c }, { r: b.r - 1, c: b.c },
        { r: b.r, c: b.c + 1 }, { r: b.r, c: b.c - 1 },
      ];
      for (const n of neighbors) {
        if (n.r > 0 && n.r < level.grid.length - 1 && n.c > 0 && n.c < level.grid[0].length - 1 && level.grid[n.r][n.c] === 0) {
          return n;
        }
      }
      return b; // fallback
    }));
    setMovesLeft(level.moves);
    setSolved(0);
    setGameOver(false);
    setSelected(null);
    setMsg(null);
    setRound(0);
    setScreen('play');
  }, []);

  // Reset moves for a new puzzle within the same match
  useEffect(() => {
    if (screen === 'play' && movesLeft === 0 && solved < TOTAL_ROUNDS) {
      // Auto-start next puzzle
      const level = generateLevel(difficulty);
      setGrid(level.grid);
      setPenguin(level.penguinStart);
      setHoles(level.iceBlocks.map(b => {
        const neighbors: Pos[] = [
          { r: b.r + 1, c: b.c }, { r: b.r - 1, c: b.c },
          { r: b.r, c: b.c + 1 }, { r: b.r, c: b.c - 1 },
        ];
        for (const n of neighbors) {
          if (n.r > 0 && n.r < level.grid.length - 1 && n.c > 0 && n.c < level.grid[0].length - 1 && level.grid[n.r][n.c] === 0) {
            return n;
          }
        }
        return b;
      }));
      setMovesLeft(level.moves);
      setMsg('New puzzle!');
      setTimeout(() => setMsg(null), 1000);
    }
  }, [movesLeft, solved, screen, difficulty]);

  const doMove = (dr: number, dc: number) => {
    if (gameOver || movesLeft <= 0) return;
    const result = tryPush(grid, penguin, dr, dc);
    if (!result.moved) return;
    if (equalGrids(result.grid, grid)) return; // no actual change
    setGrid(result.grid);
    setPenguin(result.penguin);
    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);
    if (isSolved(result.grid, holes)) {
      setSolved(s => {
        const newSolved = s + 1;
        if (newSolved > bestSolved) {
          try { localStorage.setItem(`penguins_best_${difficulty}`, String(newSolved)); setBestSolved(newSolved); } catch {}
        }
        return newSolved;
      });
      setMsg('🎉 All holes filled!');
      const newSolvedCount = solved + 1;
      setTimeout(() => {
        if (newSolvedCount >= TOTAL_ROUNDS) {
          setScreen('results');
        }
      }, 1500);
    } else if (newMoves <= 0) {
      setGameOver(true);
      setTimeout(() => setScreen('results'), 1200);
    }
  };

  const handleClick = (r: number, c: number) => {
    if (gameOver) return;
    // Check if clicked on penguin or adjacent
    if (r === penguin.r && c === penguin.c) {
      setSelected({ r, c });
      return;
    }
    if (selected && (Math.abs(r - selected.r) + Math.abs(c - selected.c) === 1)) {
      const dr = r - selected.r;
      const dc = c - selected.c;
      doMove(dr, dc);
      setSelected(null);
    } else {
      setSelected({ r, c });
    }
  };

  // Keyboard handler
  useEffect(() => {
    if (screen !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowUp':    e.preventDefault(); doMove(-1, 0); break;
        case 'ArrowDown':  e.preventDefault(); doMove(1, 0); break;
        case 'ArrowLeft':  e.preventDefault(); doMove(0, -1); break;
        case 'ArrowRight': e.preventDefault(); doMove(0, 1); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const startGame = (d: Difficulty) => {
    setSolved(0);
    setBestSolved(0);
    setRound(0);
    startLevel(d);
  };

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🐧</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Penguins</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Push the <strong>ice blocks</strong> (light blue) to fill all the
          <strong> holes</strong> (dark blue). You can only push — blocks
          slide until they hit a wall. Use arrow keys or tap to move.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a puzzle:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 5×4, 2 holes</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 6×5, 3 holes</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · 7×5, 4 holes</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestSolved > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best puzzles solved (this level): <strong>{bestSolved}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} puzzles per match. Arrow keys or tap the penguin then an adjacent cell.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🐧</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Puzzles solved: <strong>{solved}</strong>/{TOTAL_ROUNDS} · Best: <strong>{bestSolved}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {solved === TOTAL_ROUNDS ? '⭐⭐⭐' : solved >= 2 ? '⭐⭐' : '⭐'}
        </div>

        {!rated && bestSolved > 0 && (
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
            activity="penguins"
            activityName="Penguins"
            activityEmoji="🐧"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const cellSize = Math.min(56, Math.floor(420 / Math.max(rows, cols)));

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, position: 'relative' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🐧 Penguins</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Puzzle <strong style={{ color: 'var(--accent-blue)' }}>{solved + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Moves <strong style={{ color: 'var(--accent-orange)' }}>{movesLeft}</strong></span>
        <span>·</span>
        <span>Solved <strong style={{ color: 'var(--accent-green)' }}>{solved}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestSolved}</strong></span>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent-green)', margin: '8px 0' }}>
          {msg}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 2,
            padding: 4,
            background: '#4A6B7A',
            borderRadius: 6,
            border: '3px solid #1B4F6B',
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPenguin = r === penguin.r && c === penguin.c;
              const isSelected = selected && selected.r === r && selected.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  disabled={gameOver}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isPenguin ? PENGUIN_COLOR : CELL_COLORS[cell as CellType],
                    border: isSelected ? '3px solid var(--accent-orange)' : '1px solid rgba(0,0,0,0.2)',
                    borderRadius: 4, padding: 0,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  {isPenguin && (
                    <div style={{
                      position: 'absolute', top: '20%', left: '20%',
                      width: '60%', height: '50%', background: PENGUIN_BELLY, borderRadius: '50%',
                    }} />
                  )}
                  {cell === 2 && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: '40%', height: '40%', background: '#1B4F6B', borderRadius: '50%',
                    }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: arrow keys to push the penguin. Push ice blocks into the dark holes. You can only push — never pull!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="penguins"
          activityName="Penguins"
          activityEmoji="🐧"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}