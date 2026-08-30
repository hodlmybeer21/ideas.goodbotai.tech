'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Tetris (kid edition) — classic 10×20 grid with the 7 standard
// tetrominoes. Soft drop (down arrow), hard drop (space), rotate (up),
// hold (C or Shift). Ghost piece shows landing spot, next-piece preview
// on the side. 3 difficulty tiers (different starting drop speeds).
//   🌱 Easy   · slow gravity
//   🌿 Medium · standard
//   🌳 Hard   · fast, tighter scoring

type Difficulty = 0 | 1 | 2;
type Cell = string | null;
type Grid = Cell[][];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
  type: string;
}

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const VISIBLE_HEIGHT = 20; // show all 20 rows
const CELL_SIZE = 24;

const SHAPES: Record<string, { shape: number[][]; color: string }> = {
  I: { color: '#5B7FFF', shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
  O: { color: '#FFD93D', shape: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]] },
  T: { color: '#9B59B6', shape: [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]] },
  S: { color: '#6BCB77', shape: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]] },
  Z: { color: '#E94B5C', shape: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]] },
  J: { color: '#4D96A8', shape: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]] },
  L: { color: '#FF9F43', shape: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]] },
};

const SHAPE_KEYS = Object.keys(SHAPES);
const DROP_SPEEDS: Record<Difficulty, number> = { 0: 700, 1: 500, 2: 320 }; // ms per row at start

function emptyGrid(): Grid {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

function randomType(): string {
  return SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
}

function makePiece(type: string): Piece {
  const def = SHAPES[type];
  return { shape: def.shape.map(r => r.slice()), x: 3, y: 0, color: def.color, type };
}

function rotateCW(shape: number[][]): number[][] {
  const n = shape.length;
  const out: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][n - 1 - r] = shape[r][c];
  return out;
}

function collides(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (piece.shape[r][c] === 0) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return true;
      if (y >= 0 && grid[y][x] !== null) return true;
    }
  }
  return false;
}

function mergePiece(grid: Grid, piece: Piece): Grid {
  const next = grid.map(r => r.slice());
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (piece.shape[r][c] === 0) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0 && y < GRID_HEIGHT) next[y][x] = piece.color;
    }
  }
  return next;
}

function ghostY(grid: Grid, piece: Piece): number {
  let dy = 0;
  while (!collides(grid, { ...piece, y: piece.y + dy + 1 })) dy++;
  return piece.y + dy;
}

function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const remaining: Grid = [];
  let cleared = 0;
  for (let r = 0; r < GRID_HEIGHT; r++) {
    if (grid[r].every(c => c !== null)) {
      cleared++;
    } else {
      remaining.push(grid[r]);
    }
  }
  while (remaining.length < GRID_HEIGHT) {
    const empty: Cell[] = Array(GRID_WIDTH).fill(null);
    remaining.unshift(empty);
  }
  return { grid: remaining, cleared };
}

function tryRotate(grid: Grid, piece: Piece): Piece | null {
  const rotated = rotateCW(piece.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const k of kicks) {
    const candidate: Piece = { ...piece, shape: rotated, x: piece.x + k };
    if (!collides(grid, candidate)) return candidate;
  }
  return null;
}

function randomBag(): string[] {
  const bag = [...SHAPE_KEYS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

const SCORE_TABLE: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };
const TOTAL_ROUNDS = 3; // "rounds" = new game sessions per match

export default function Tetris({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [current, setCurrent] = useState<Piece | null>(null);
  const [next, setNext] = useState<string>(randomType);
  const [hold, setHold] = useState<string | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [comboMsg, setComboMsg] = useState<string | null>(null);
  const [lineFlash, setLineFlash] = useState<number[]>([]);

  const bagRef = useRef<string[]>(randomBag());
  const dropTimerRef = useRef<number | null>(null);
  const lockTimerRef = useRef<number | null>(null);

  // Load best score
  useEffect(() => {
    try {
      const s = localStorage.getItem(`tetris_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  const spawnNext = useCallback(() => {
    if (bagRef.current.length === 0) bagRef.current = randomBag();
    const type = bagRef.current.shift()!;
    const piece = makePiece(type);
    if (collides(grid, piece)) {
      setGameOver(true);
      if (score > bestScore) {
        try {
          localStorage.setItem(`tetris_best_${difficulty}`, String(score));
          setBestScore(score);
        } catch {}
      }
      setTimeout(() => {
        const isLast = round + 1 >= TOTAL_ROUNDS;
        if (isLast) {
          setScreen('results');
        } else {
          setRound(r => r + 1);
          setGrid(emptyGrid());
          setCurrent(null);
          setNext(randomType());
          setHold(null);
          setCanHold(true);
          setScore(0);
          setLines(0);
          setLevel(1);
          setGameOver(false);
          bagRef.current = randomBag();
        }
      }, 1500);
      return null;
    }
    return piece;
  }, [grid, score, bestScore, difficulty, round]);

  // Game loop
  useEffect(() => {
    if (screen !== 'play' || !current || gameOver) return;

    const dropInterval = Math.max(80, DROP_SPEEDS[difficulty] - (level - 1) * 30);

    const drop = () => {
      const nextPiece: Piece = { ...current, y: current.y + 1 };
      if (collides(grid, nextPiece)) {
        // Lock the piece
        const merged = mergePiece(grid, current);
        const { grid: clearedGrid, cleared } = clearLines(merged);
        setGrid(clearedGrid);
        if (cleared > 0) {
          const gained = SCORE_TABLE[cleared] * level;
          setScore(s => s + gained);
          setLines(l => {
            const newLines = l + cleared;
            setLevel(Math.floor(newLines / 10) + 1);
            return newLines;
          });
          const msgs = ['', 'Nice!', 'Great!', 'Awesome!', 'TETRIS!'];
          setComboMsg(msgs[cleared]);
          setLineFlash([]);
          setTimeout(() => setComboMsg(null), 1200);
        }
        // Spawn next
        const np = spawnNext();
        if (np) {
          setCurrent(np);
          setCanHold(true);
        } else {
          setCurrent(null);
        }
      } else {
        setCurrent(nextPiece);
      }
    };

    dropTimerRef.current = window.setInterval(drop, dropInterval);
    return () => {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    };
  }, [screen, current, grid, difficulty, level, gameOver, spawnNext]);

  // Continuous soft drop while holding down
  useEffect(() => {
    if (screen !== 'play' || !current || gameOver) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat && (e.key === 'ArrowDown' || e.key === 's')) {
        e.preventDefault();
        const next: Piece = { ...current, y: current.y + 1 };
        if (!collides(grid, next)) {
          setCurrent(next);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, current, grid, gameOver]);

  // Spawn the first piece when entering play
  useEffect(() => {
    if (screen === 'play' && !current && !gameOver) {
      const p = spawnNext();
      if (p) setCurrent(p);
    }
  }, [screen, current, gameOver, spawnNext]);

  // Player actions
  const move = (dx: number) => {
    if (!current) return;
    const next: Piece = { ...current, x: current.x + dx };
    if (!collides(grid, next)) setCurrent(next);
  };

  const rotate = () => {
    if (!current) return;
    const rotated = tryRotate(grid, current);
    if (rotated) setCurrent(rotated);
  };

  const softDrop = () => {
    if (!current) return;
    const next: Piece = { ...current, y: current.y + 1 };
    if (!collides(grid, next)) {
      setCurrent(next);
      setScore(s => s + 1);
    }
  };

  const hardDrop = () => {
    if (!current) return;
    const dropY = ghostY(grid, current);
    const distance = dropY - current.y;
    const next: Piece = { ...current, y: dropY };
    setCurrent(next);
    setScore(s => s + distance * 2);
    // Force-lock by clearing the timer (the next tick will lock it)
    setTimeout(() => {
      if (!next) return;
      const merged = mergePiece(grid, next);
      const { grid: clearedGrid, cleared } = clearLines(merged);
      setGrid(clearedGrid);
      if (cleared > 0) {
        const gained = SCORE_TABLE[cleared] * level;
        setScore(s => s + gained);
        setLines(l => {
          const newLines = l + cleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
        const msgs = ['', 'Nice!', 'Great!', 'Awesome!', 'TETRIS!'];
        setComboMsg(msgs[cleared]);
        setTimeout(() => setComboMsg(null), 1200);
      }
      const np = spawnNext();
      if (np) {
        setCurrent(np);
        setCanHold(true);
      } else {
        setCurrent(null);
      }
    }, 0);
  };

  const holdPiece = () => {
    if (!current || !canHold) return;
    if (hold) {
      // Swap with held
      const newPiece = makePiece(hold);
      if (!collides(grid, newPiece)) {
        setHold(current.type);
        setCurrent(newPiece);
      }
    } else {
      setHold(current.type);
      const np = spawnNext();
      if (np) setCurrent(np);
    }
    setCanHold(false);
  };

  // Keyboard handler
  useEffect(() => {
    if (screen !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); move(-1); break;
        case 'ArrowRight': e.preventDefault(); move(1); break;
        case 'ArrowUp':    e.preventDefault(); rotate(); break;
        case 'ArrowDown':
        case 's':          e.preventDefault(); softDrop(); break;
        case ' ':
        case 'Enter':      e.preventDefault(); hardDrop(); break;
        case 'c':
        case 'C':
        case 'Shift':      e.preventDefault(); holdPiece(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, gameOver, current, grid, canHold, hold]);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setGrid(emptyGrid());
    setCurrent(null);
    setNext(randomType());
    setHold(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setRound(0);
    bagRef.current = randomBag();
    setScreen('play');
  };

  const gY = current ? ghostY(grid, current) : 0;

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🧱</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Tetris</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Stack the falling blocks to clear <strong>horizontal lines</strong>.
          Use arrows to move, <strong>up</strong> to rotate, <strong>space</strong> to
          hard-drop, <strong>C</strong> to hold.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your gravity:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · slow drop</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · standard</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · fast, big scoring</span>
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
          {TOTAL_ROUNDS} games per match. Clear 1 line = 100×level, 4 lines (Tetris!) = 800×level.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🧱</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Game over!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Best score: <strong>{bestScore}</strong> · Lines cleared: <strong>{lines}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {bestScore >= 5000 ? '⭐⭐⭐' : bestScore >= 2000 ? '⭐⭐' : '⭐'}
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
            activity="tetris"
            activityName="Tetris"
            activityEmoji="🧱"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🧱 Tetris</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-blue)' }}>{score}</strong></span>
        <span>·</span>
        <span>Lines <strong style={{ color: 'var(--accent-green)' }}>{lines}</strong></span>
        <span>·</span>
        <span>Level <strong style={{ color: 'var(--accent-orange)' }}>{level}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Game <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* Hold display */}
        <div style={{ background: '#1a1a1a', padding: 10, borderRadius: 10, minWidth: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>HOLD</div>
          {hold && (
            <svg width={50} height={50}>
              {SHAPES[hold].shape.map((row, r) =>
                row.map((v, c) => v ? <rect key={`${r}-${c}`} x={c * 11 + 6} y={r * 11 + 6} width={11} height={11} fill={SHAPES[hold].color} /> : null)
              )}
            </svg>
          )}
        </div>

        {/* Play field */}
        <div
          onClick={(e) => {
            // Simple click controls: left/right halves of the field
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) move(-1);
            else move(1);
          }}
          style={{
            background: '#0a0a0a',
            padding: 4,
            borderRadius: 4,
            border: '4px solid #1a1a1a',
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'manipulation',
          }}
        >
          <div style={{ position: 'relative', width: GRID_WIDTH * CELL_SIZE, height: GRID_HEIGHT * CELL_SIZE }}>
            {/* Locked cells */}
            {grid.map((row, r) =>
              row.map((c, ci) => c !== null ? (
                <div key={`locked-${r}-${ci}`} style={{
                  position: 'absolute',
                  left: ci * CELL_SIZE, top: r * CELL_SIZE,
                  width: CELL_SIZE, height: CELL_SIZE,
                  background: c, border: '1px solid rgba(0,0,0,0.3)',
                  boxSizing: 'border-box',
                }} />
              ) : null)
            )}

            {/* Ghost piece */}
            {current && !gameOver && (
              <div style={{ position: 'absolute', left: 0, top: gY * CELL_SIZE, width: '100%', height: CELL_SIZE * 4, opacity: 0.18, pointerEvents: 'none' }}>
                {current.shape.map((row, r) =>
                  row.map((v, c) => v ? <div key={`g-${r}-${c}`} style={{
                    position: 'absolute',
                    left: (current.x + c) * CELL_SIZE, top: r * CELL_SIZE,
                    width: CELL_SIZE, height: CELL_SIZE,
                    background: current.color, border: '1px solid rgba(0,0,0,0.3)',
                    boxSizing: 'border-box',
                  }} /> : null)
                )}
              </div>
            )}

            {/* Active piece */}
            {current && !gameOver && (
              <div style={{ position: 'absolute', left: 0, top: current.y * CELL_SIZE, width: '100%', height: CELL_SIZE * 4, pointerEvents: 'none' }}>
                {current.shape.map((row, r) =>
                  row.map((v, c) => v ? <div key={`p-${r}-${c}`} style={{
                    position: 'absolute',
                    left: (current.x + c) * CELL_SIZE, top: r * CELL_SIZE,
                    width: CELL_SIZE, height: CELL_SIZE,
                    background: current.color, border: '2px solid rgba(0,0,0,0.4)',
                    boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)',
                    boxSizing: 'border-box',
                  }} /> : null)
                )}
              </div>
            )}

            {/* Combo message */}
            {comboMsg && (
              <div style={{
                position: 'absolute', top: '30%', left: 0, right: 0,
                textAlign: 'center', fontSize: 32, fontWeight: 700,
                color: '#FFD93D', textShadow: '0 3px 0 #2D1B00, 0 0 20px rgba(255,217,61,0.6)',
                animation: 'pop 0.3s ease', pointerEvents: 'none',
              }}>
                {comboMsg}
              </div>
            )}

            {/* Game over overlay */}
            {gameOver && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', textShadow: '0 2px 0 #2D1B00' }}>💥 Game Over!</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#FFD93D', textShadow: '0 1px 0 #2D1B00' }}>Score: {score}</div>
              </div>
            )}
          </div>
        </div>

        {/* Next piece display */}
        <div style={{ background: '#1a1a1a', padding: 10, borderRadius: 10, minWidth: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>NEXT</div>
          {next && (
            <svg width={50} height={50}>
              {SHAPES[next].shape.map((row, r) =>
                row.map((v, c) => v ? <rect key={`${r}-${c}`} x={c * 11 + 6} y={r * 11 + 6} width={11} height={11} fill={SHAPES[next].color} /> : null)
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => move(-1)} style={{ fontSize: 16, padding: '10px 16px' }}>◀</button>
        <button className="btn btn-secondary" onClick={rotate} style={{ fontSize: 16, padding: '10px 16px' }}>↻</button>
        <button className="btn btn-secondary" onClick={() => move(1)} style={{ fontSize: 16, padding: '10px 16px' }}>▶</button>
        <button className="btn btn-secondary" onClick={softDrop} style={{ fontSize: 14, padding: '10px 16px' }}>▼</button>
        <button className="btn btn-primary" onClick={hardDrop} style={{ fontSize: 14, padding: '10px 16px' }}>⤓</button>
        <button className="btn btn-secondary" onClick={holdPiece} disabled={!canHold} style={{ fontSize: 14, padding: '10px 16px' }}>↔</button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 12 }}>
        Tip: ← → move, ↑ rotate, ↓ soft drop, <strong>space</strong> hard drop, <strong>C</strong> hold
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="tetris"
          activityName="Tetris"
          activityEmoji="🧱"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}