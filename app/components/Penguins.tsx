'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Penguins (kid edition) — classic sliding-ice puzzle.
// Push ice blocks (light blue) into the holes (dark blue). Penguin can
// walk into empty cells (and over holes). Pushing into an ice block
// slides the ice until it hits the wall, another ice, or a hole. Ice
// filling a hole makes both disappear. Win when no holes remain.
//
//   🌱 Easy   · 5×6, 2 holes, 15 moves
//   🌿 Medium · 5×7, 3 holes, 20 moves
//   🌳 Hard   · 6×8, 4 holes, 28 moves
//
// Controls: arrow keys (↑↓←→ or WASD) or tap the on-screen direction buttons.

type Difficulty = 0 | 1 | 2;
type CellType = 0 | 1 | 2; // 0=empty, 1=ice, 2=hole (penguin tracked separately)
type Pos = { r: number; c: number };

const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; holes: number; moves: number; name: string }> = {
  0: { rows: 5, cols: 6, holes: 2, moves: 15, name: 'Baby Steps' },
  1: { rows: 5, cols: 7, holes: 3, moves: 20, name: 'Slippery' },
  2: { rows: 6, cols: 8, holes: 4, moves: 28, name: 'Deep Freeze' },
};

const TOTAL_ROUNDS = 3;

function makeGrid(rows: number, cols: number): CellType[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0 as CellType));
}

function countHoles(grid: CellType[][]): number {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell === 2) n++;
  return n;
}

// Slide a block from (startR, startC) in direction (dr, dc).
// Ice slides until it hits the wall, another ice, or a hole.
// - Stops in empty: ice lands in last empty cell
// - Stops in hole: both ice and hole disappear
function slideBlock(
  grid: CellType[][],
  startR: number,
  startC: number,
  dr: number,
  dc: number
): { grid: CellType[][]; moved: boolean } {
  const rows = grid.length;
  const cols = grid[0].length;
  let r = startR;
  let c = startC;
  while (true) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break; // wall
    if (grid[nr][nc] === 1) break; // another ice
    r = nr;
    c = nc;
    if (grid[r][c] === 2) break; // hole — stop here
  }
  if (r === startR && c === startC) {
    return { grid, moved: false };
  }
  const newGrid = grid.map(row => row.slice());
  newGrid[startR][startC] = 0;
  newGrid[r][c] = (grid[r][c] === 2) ? 0 : 1; // fill hole (empty) or place ice
  return { grid: newGrid, moved: true };
}

function tryMove(
  grid: CellType[][],
  penguin: Pos,
  dr: number,
  dc: number
): { grid: CellType[][]; penguin: Pos; moved: boolean } {
  const nr = penguin.r + dr;
  const nc = penguin.c + dc;
  if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) {
    return { grid, penguin, moved: false };
  }
  const target = grid[nr][nc];
  if (target === 0 || target === 2) {
    // empty or hole — penguin walks there (holes are passable)
    return { grid, penguin: { r: nr, c: nc }, moved: true };
  }
  if (target === 1) {
    // ice — push it
    const result = slideBlock(grid, nr, nc, dr, dc);
    if (!result.moved) return { grid, penguin, moved: false };
    return { grid: result.grid, penguin: { r: nr, c: nc }, moved: true };
  }
  return { grid, penguin, moved: false };
}

const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function generateLevel(d: Difficulty): { grid: CellType[][]; penguin: Pos } {
  const cfg = DIFFICULTY_CONFIG[d];
  const grid = makeGrid(cfg.rows, cfg.cols);

  // Place holes (interior cells, not adjacent to each other for cleaner puzzles)
  const placedHoles: Pos[] = [];
  let tries = 0;
  while (placedHoles.length < cfg.holes && tries < 500) {
    tries++;
    const r = 1 + Math.floor(Math.random() * (cfg.rows - 2));
    const c = 1 + Math.floor(Math.random() * (cfg.cols - 2));
    if (grid[r][c] !== 0) continue;
    const tooClose = placedHoles.some(h => Math.abs(h.r - r) + Math.abs(h.c - c) <= 1);
    if (tooClose) continue;
    grid[r][c] = 2;
    placedHoles.push({ r, c });
  }

  // Place one ice block adjacent to each hole
  for (const hole of placedHoles) {
    const shuffled = [...DIRS].sort(() => Math.random() - 0.5);
    let placed = false;
    for (const [dr, dc] of shuffled) {
      const br = hole.r + dr;
      const bc = hole.c + dc;
      if (br >= 1 && br < cfg.rows - 1 && bc >= 1 && bc < cfg.cols - 1 && grid[br][bc] === 0) {
        grid[br][bc] = 1;
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let r = 1; r < cfg.rows - 1 && !placed; r++) {
        for (let c = 1; c < cfg.cols - 1 && !placed; c++) {
          if (grid[r][c] === 0) { grid[r][c] = 1; placed = true; }
        }
      }
    }
  }

  // Place penguin on a random empty cell
  const emptyCells: Pos[] = [];
  for (let r = 1; r < cfg.rows - 1; r++) {
    for (let c = 1; c < cfg.cols - 1; c++) {
      if (grid[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  const penguin: Pos = emptyCells.length > 0
    ? emptyCells[Math.floor(Math.random() * emptyCells.length)]
    : { r: 1, c: 1 };
  return { grid, penguin };
}

export default function Penguins({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<CellType[][]>(makeGrid(5, 6));
  const [penguin, setPenguin] = useState<Pos>({ r: 0, c: 0 });
  const [movesLeft, setMovesLeft] = useState(15);
  const [round, setRound] = useState(0);
  const [bestSolved, setBestSolved] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Refs for stale-closure-free handlers
  const gridRef = useRef(grid);
  const penguinRef = useRef(penguin);
  const movesLeftRef = useRef(movesLeft);
  const screenRef = useRef(screen);
  const gameOverRef = useRef(gameOver);
  const difficultyRef = useRef(difficulty);
  const bestSolvedRef = useRef(bestSolved);
  const roundRef = useRef(round);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { penguinRef.current = penguin; }, [penguin]);
  useEffect(() => { movesLeftRef.current = movesLeft; }, [movesLeft]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { bestSolvedRef.current = bestSolved; }, [bestSolved]);
  useEffect(() => { roundRef.current = round; }, [round]);

  // Load best on difficulty change
  useEffect(() => {
    try {
      const s = localStorage.getItem(`penguins_best_${difficulty}`);
      setBestSolved(s ? parseInt(s, 10) || 0 : 0);
    } catch {}
  }, [difficulty]);

  const startLevel = useCallback((d: Difficulty) => {
    const level = generateLevel(d);
    setGrid(level.grid);
    setPenguin(level.penguin);
    setMovesLeft(DIFFICULTY_CONFIG[d].moves);
    setRound(0);
    setGameOver(false);
    setMsg(null);
    setScreen('play');
  }, []);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    startLevel(d);
  };

  const nextPuzzle = useCallback(() => {
    const d = difficultyRef.current;
    const level = generateLevel(d);
    setGrid(level.grid);
    setPenguin(level.penguin);
    setMovesLeft(DIFFICULTY_CONFIG[d].moves);
    setMsg(null);
  }, []);

  const doMove = useCallback((dr: number, dc: number) => {
    if (screenRef.current !== 'play' || gameOverRef.current) return;
    if (movesLeftRef.current <= 0) return;
    const result = tryMove(gridRef.current, penguinRef.current, dr, dc);
    if (!result.moved) return;
    setGrid(result.grid);
    setPenguin(result.penguin);
    const newMoves = movesLeftRef.current - 1;
    setMovesLeft(newMoves);

    const holesLeft = countHoles(result.grid);
    if (holesLeft === 0) {
      setRound(r => {
        const nr = r + 1;
        const newBest = Math.max(bestSolvedRef.current, nr);
        try { localStorage.setItem(`penguins_best_${difficultyRef.current}`, String(newBest)); } catch {}
        setBestSolved(newBest);
        if (nr >= TOTAL_ROUNDS) {
          setMsg('🎉 All puzzles solved!');
          setTimeout(() => setScreen('results'), 1200);
        } else {
          setMsg(`🎉 Puzzle ${nr}!`);
          setTimeout(() => nextPuzzle(), 1000);
        }
        return nr;
      });
    } else if (newMoves <= 0) {
      setGameOver(true);
      setMsg('😢 Out of moves!');
      setTimeout(() => setScreen('results'), 1500);
    }
  }, [nextPuzzle]);

  // Keyboard handler — added once, reads from refs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      let dr = 0, dc = 0;
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': dr = -1; dc = 0; break;
        case 'ArrowDown':  case 's': case 'S': dr = 1;  dc = 0; break;
        case 'ArrowLeft':  case 'a': case 'A': dr = 0;  dc = -1; break;
        case 'ArrowRight': case 'd': case 'D': dr = 0;  dc = 1; break;
        default: return;
      }
      e.preventDefault();
      doMove(dr, dc);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doMove]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🐧</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Penguins</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 20px' }}>
          Push the <strong>ice blocks</strong> (light blue) to fill all the
          <strong> holes</strong> (dark blue). Arrow keys or tap to move. Plan your pushes — ice slides until it hits something!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌱 Easy · 5×6, 2 holes
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌿 Medium · 5×7, 3 holes
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌳 Hard · 6×8, 4 holes
          </button>
        </div>

        {bestSolved > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best puzzles solved: <strong>{bestSolved}</strong>/{TOTAL_ROUNDS}
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} puzzles per match. Fill all the holes to win each one!
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
          {round >= TOTAL_ROUNDS ? 'Match complete!' : 'Game over'}
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Puzzles solved: <strong>{round}</strong>/{TOTAL_ROUNDS} · Best: <strong>{bestSolved}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {round >= TOTAL_ROUNDS ? '⭐⭐⭐' : round >= 2 ? '⭐⭐' : '⭐'}
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
  const cellSize = Math.min(64, Math.floor(420 / Math.max(rows, cols)));
  const holesLeft = countHoles(grid);

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🐧 Penguins</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Puzzle <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Moves <strong style={{ color: 'var(--accent-orange)' }}>{movesLeft}</strong></span>
        <span>·</span>
        <span>Holes <strong style={{ color: 'var(--accent-pink)' }}>{holesLeft}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestSolved}</strong></span>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: 'var(--accent-green)', margin: '8px 0' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 2,
            padding: 6,
            background: '#D6E9F2',
            borderRadius: 8,
            border: '3px solid #5B7FFF',
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPenguin = r === penguin.r && c === penguin.c;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isPenguin ? '#1B4F6B' : '#F5FBFD',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 4,
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: cellSize * 0.6,
                  }}
                >
                  {isPenguin ? '🐧' : cell === 1 ? '🧊' : cell === 2 ? '🕳️' : ''}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* On-screen direction buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gridTemplateRows: 'repeat(3, 60px)', gap: 6 }}>
          <div />
          <button className="btn btn-primary" onClick={() => doMove(-1, 0)} style={{ fontSize: 24, padding: 0, touchAction: 'manipulation' }}>▲</button>
          <div />
          <button className="btn btn-primary" onClick={() => doMove(0, -1)} style={{ fontSize: 24, padding: 0, touchAction: 'manipulation' }}>◀</button>
          <div />
          <button className="btn btn-primary" onClick={() => doMove(0, 1)} style={{ fontSize: 24, padding: 0, touchAction: 'manipulation' }}>▶</button>
          <div />
          <button className="btn btn-primary" onClick={() => doMove(1, 0)} style={{ fontSize: 24, padding: 0, touchAction: 'manipulation' }}>▼</button>
          <div />
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: arrow keys or tap the buttons. Push 🧊 into 🕳️ to fill holes. Penguins can walk over holes safely.
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