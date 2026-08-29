'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Stack Tower — time the tap to stack a sliding block on top of the
// previous one. Excess is cut off; misalign too much and it's game over.
//   🌱 Easy   · wider blocks, slower speed
//   🌿 Medium · narrower, faster
//   🌳 Hard   · tight starts, ramps quickly
// Controls: tap anywhere (or press space / click) to drop the block. The
// block moves back and forth automatically; you time the tap to align.

type Difficulty = 0 | 1 | 2;

interface Block {
  x: number;       // left edge
  width: number;   // width of this block
}

const STAGE_WIDTH = 320;
const BLOCK_HEIGHT = 22;
const BLOCK_COLORS = ['#E94B5C', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96A8', '#9B59B6'];
const START_WIDTHS  = [200, 160, 120];
const START_SPEEDS  = [2.5, 3.5, 4.5];
const SPEED_GROWTH  = [1.08, 1.13, 1.18];   // multiplier per successful stack
const MIN_OVERLAP   = [18, 14, 10];       // less than this = game over
const CAMERA_BUFFER = 8;                  // # of blocks visible before camera scrolls

const TOTAL_ROUNDS = 3;

function colorAt(i: number): string {
  return BLOCK_COLORS[i % BLOCK_COLORS.length];
}

function shade(hex: string, amount: number): string {
  // amount: -100..100 (negative darker, positive lighter)
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const adjust = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount)));
  return '#' + adjust(r).toString(16).padStart(2, '0') + adjust(g).toString(16).padStart(2, '0') + adjust(b).toString(16).padStart(2, '0');
}

export default function StackTower({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [stack, setStack] = useState<Block[]>([]);
  const [slidingX, setSlidingX] = useState(0);
  const [slidingDir, setSlidingDir] = useState<1 | -1>(1);
  const [slidingWidth, setSlidingWidth] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [dropped, setDropped] = useState(false); // visual flash on drop
  const [comboMsg, setComboMsg] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  // Load best score
  useEffect(() => {
    try {
      const s = localStorage.getItem(`stacktower_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  const startGame = useCallback((d: Difficulty) => {
    const w = START_WIDTHS[d];
    setStack([{ x: (STAGE_WIDTH - w) / 2, width: w }]);
    setSlidingX(0);
    setSlidingDir(1);
    setSlidingWidth(w);
    setSpeed(START_SPEEDS[d]);
    setScore(0);
    setGameOver(false);
    setRound(0);
    setDifficulty(d);
    setDropped(false);
    setComboMsg(null);
    setScreen('play');
  }, []);

  const finishGame = useCallback(() => {
    if (score > bestScore) {
      try {
        localStorage.setItem(`stacktower_best_${difficulty}`, String(score));
        setBestScore(score);
      } catch {}
    }
    const isLast = round + 1 >= TOTAL_ROUNDS;
    if (isLast) {
      setTimeout(() => setScreen('results'), 1500);
    } else {
      setTimeout(() => {
        setRound(r => r + 1);
        const w = START_WIDTHS[difficulty];
        setStack([{ x: (STAGE_WIDTH - w) / 2, width: w }]);
        setSlidingX(0);
        setSlidingDir(1);
        setSlidingWidth(w);
        setSpeed(START_SPEEDS[difficulty]);
        setScore(0);
        setGameOver(false);
        setDropped(false);
        setComboMsg(null);
      }, 1500);
    }
  }, [score, bestScore, difficulty, round]);

  const dropBlock = useCallback(() => {
    if (gameOver || stack.length === 0 || dropped) return;
    setDropped(true);
    setTimeout(() => setDropped(false), 120);

    const last = stack[stack.length - 1];
    const overlapStart = Math.max(slidingX, last.x);
    const overlapEnd = Math.min(slidingX + slidingWidth, last.x + last.width);
    const overlapWidth = Math.max(0, overlapEnd - overlapStart);

    if (overlapWidth < MIN_OVERLAP[difficulty]) {
      setGameOver(true);
      setComboMsg(null);
      finishGame();
      return;
    }

    const newStack = [...stack, { x: overlapStart, width: overlapWidth }];
    setStack(newStack);
    // Score = area of the block placed (capped to original width)
    const points = Math.round(overlapWidth);
    setScore(s => s + points);
    setSlidingX(0);
    setSlidingDir(1);
    setSlidingWidth(overlapWidth);
    setSpeed(s => s * SPEED_GROWTH[difficulty]);

    // Combo / streak message
    if (overlapWidth >= slidingWidth * 0.9) {
      setComboMsg('✨ Perfect stack!');
    } else if (overlapWidth >= slidingWidth * 0.6) {
      setComboMsg('👍 Nice!');
    } else {
      setComboMsg('⚠️ Trimmed!');
    }
    setTimeout(() => setComboMsg(null), 800);
  }, [gameOver, stack, slidingX, slidingWidth, slidingDir, speed, difficulty, dropped, finishGame]);

  // Keyboard handler (space / arrows to drop)
  useEffect(() => {
    if (screen !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        dropBlock();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, dropBlock]);

  // Animation loop for sliding block
  useEffect(() => {
    if (screen !== 'play' || gameOver) return;
    const animate = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      if (delta > 16) {
        setSlidingX(prev => {
          let newX = prev + slidingDir * speed * (delta / 16);
          if (newX + slidingWidth >= STAGE_WIDTH) {
            newX = STAGE_WIDTH - slidingWidth;
            setSlidingDir(-1);
          } else if (newX <= 0) {
            newX = 0;
            setSlidingDir(1);
          }
          return newX;
        });
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastFrameRef.current = 0;
    };
  }, [screen, gameOver, slidingDir, speed, slidingWidth]);

  // Camera offset: scroll up when stack exceeds buffer
  const cameraY = Math.max(0, (stack.length - CAMERA_BUFFER) * BLOCK_HEIGHT);
  const stageHeight = (CAMERA_BUFFER + 2) * BLOCK_HEIGHT;

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏗️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Stack Tower</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          A block slides back and forth. <strong>Tap to drop it on top!</strong>
          The better the alignment, the more points. Stack as high as you can.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your speed:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · wide blocks, slow</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · narrower, faster</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · tight starts, ramps fast</span>
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
          {TOTAL_ROUNDS} games per match. Tap, click, or press Space to drop.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🏗️</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)', marginTop: 12 }}>
          Tower complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Best score: <strong>{bestScore}</strong> · Tallest stack: <strong>{stack.length}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {bestScore >= 1500 ? '⭐⭐⭐' : bestScore >= 800 ? '⭐⭐' : '⭐'}
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
            activity="stack-tower"
            activityName="Stack Tower"
            activityEmoji="🏗️"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏗️ Stack Tower</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-orange)' }}>{score}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Tallest <strong style={{ color: 'var(--accent-blue)' }}>{stack.length}</strong></span>
        <span>·</span>
        <span>Game <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        onClick={dropBlock}
        style={{
          background: '#2D2D2D',
          padding: 12,
          borderRadius: 14,
          boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
          marginBottom: 16,
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: STAGE_WIDTH,
            maxWidth: '100%',
            margin: '0 auto',
            height: stageHeight,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 60%, #2D8B6E 60%, #3D8B47 100%)',
            borderRadius: 8,
            border: '4px solid #1a1a1a',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -cameraY,
              transition: 'top 0.3s ease',
            }}
          >
            <svg width={STAGE_WIDTH} height={stack.length * BLOCK_HEIGHT + BLOCK_HEIGHT + 8} style={{ display: 'block' }}>
              {/* Render stacked blocks */}
              {stack.map((block, i) => {
                const y = (stack.length - 1 - i) * BLOCK_HEIGHT + 4;
                const color = colorAt(i);
                const top = shade(color, 30);
                const side = shade(color, -30);
                return (
                  <g key={i}>
                    {/* Side face (right) */}
                    <polygon
                      points={`${block.x + block.width},${y} ${block.x + block.width + 6},${y - 6} ${block.x + block.width + 6},${y + BLOCK_HEIGHT - 6} ${block.x + block.width},${y + BLOCK_HEIGHT}`}
                      fill={side}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                    {/* Top face */}
                    <polygon
                      points={`${block.x},${y} ${block.x + block.width},${y} ${block.x + block.width + 6},${y - 6} ${block.x + 6},${y - 6}`}
                      fill={top}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                    {/* Front face */}
                    <rect
                      x={block.x}
                      y={y}
                      width={block.width}
                      height={BLOCK_HEIGHT}
                      fill={color}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                  </g>
                );
              })}
              {/* Render sliding block on top */}
              {slidingWidth > 0 && !gameOver && (() => {
                const i = stack.length;
                const y = -4;
                const color = colorAt(i);
                const top = shade(color, 30);
                const side = shade(color, -30);
                return (
                  <g style={{ opacity: dropped ? 0.5 : 1, transition: 'opacity 0.1s' }}>
                    <polygon
                      points={`${slidingX + slidingWidth},${y} ${slidingX + slidingWidth + 6},${y - 6} ${slidingX + slidingWidth + 6},${y + BLOCK_HEIGHT - 6} ${slidingX + slidingWidth},${y + BLOCK_HEIGHT}`}
                      fill={side}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                    <polygon
                      points={`${slidingX},${y} ${slidingX + slidingWidth},${y} ${slidingX + slidingWidth + 6},${y - 6} ${slidingX + 6},${y - 6}`}
                      fill={top}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                    <rect
                      x={slidingX}
                      y={y}
                      width={slidingWidth}
                      height={BLOCK_HEIGHT}
                      fill={color}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                    />
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Floating combo message */}
      {comboMsg && !gameOver && (
        <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent-orange)', minHeight: 28 }}>
          {comboMsg}
        </div>
      )}

      {gameOver && (
        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-pink)' }}>
          💥 Off the edge! Game over.
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: <strong>tap the stage</strong> (or press Space) at just the right moment to drop the block!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="stack-tower"
          activityName="Stack Tower"
          activityEmoji="🏗️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}