'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Flappy Bird (kid edition) — tap to flap, fly through pipe gaps. Don't
// hit the pipes or the ground! 3 difficulty tiers (faster pipes, tighter
// gaps), 3 lives per match, best score saved per level.

type Difficulty = 0 | 1 | 2;

interface Pipe {
  x: number;       // left edge
  gapTop: number;   // y position of the top of the gap
  gapHeight: number;
  scored: boolean;
}

const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 500;
const BIRD_X = 110;
const BIRD_SIZE = 32;
const PIPE_WIDTH = 60;
const PIPE_SPACING = 200;
const GROUND_HEIGHT = 40;
const BIRD_EMOJI = '🐦';

const GRAVITY: Record<Difficulty, number> = { 0: 0.35, 1: 0.45, 2: 0.55 };
const JUMP_V: Record<Difficulty, number> = { 0: -7.5, 1: -8, 2: -8.5 };
const PIPE_SPEED: Record<Difficulty, number> = { 0: 2.2, 1: 3, 2: 3.6 };
const GAP_HEIGHT: Record<Difficulty, number> = { 0: 180, 1: 150, 2: 125 };

const TOTAL_LIVES = 3;

function randGapTop(difficulty: Difficulty): number {
  const min = 60;
  const max = STAGE_HEIGHT - GROUND_HEIGHT - GAP_HEIGHT[difficulty] - 30;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FlappyBird({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [birdY, setBirdY] = useState(STAGE_HEIGHT / 2);
  const [birdVel, setBirdVel] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [flashRed, setFlashRed] = useState(false);
  const [started, setStarted] = useState(false);

  const animRef = useRef<number | null>(null);
  const stateRef = useRef({
    birdY: STAGE_HEIGHT / 2,
    birdVel: 0,
    pipes: [] as Pipe[],
    score: 0,
    lives: TOTAL_LIVES,
    gameOver: false,
    lastSpawn: 0,
  });

  useEffect(() => {
    try {
      const s = localStorage.getItem(`flappy_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  // Start a fresh run
  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setBirdY(STAGE_HEIGHT / 2);
    setBirdVel(0);
    setPipes([{ x: STAGE_WIDTH, gapTop: randGapTop(d), gapHeight: GAP_HEIGHT[d], scored: false }]);
    setScore(0);
    setLives(TOTAL_LIVES);
    setGameOver(false);
    setRound(0);
    setFlashRed(false);
    setStarted(false);
    stateRef.current = {
      birdY: STAGE_HEIGHT / 2,
      birdVel: 0,
      pipes: [{ x: STAGE_WIDTH, gapTop: randGapTop(d), gapHeight: GAP_HEIGHT[d], scored: false }],
      score: 0,
      lives: TOTAL_LIVES,
      gameOver: false,
      lastSpawn: 0,
    };
    setScreen('play');
  }, []);

  // Flap
  const flap = useCallback(() => {
    if (screen !== 'play') return;
    if (!started) {
      setStarted(true);
      setBirdVel(JUMP_V[difficulty]);
      stateRef.current.birdVel = JUMP_V[difficulty];
      return;
    }
    if (gameOver) return;
    setBirdVel(JUMP_V[difficulty]);
    stateRef.current.birdVel = JUMP_V[difficulty];
  }, [screen, started, gameOver, difficulty]);

  // Keyboard + click handler
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, flap]);

  // Animation loop
  useEffect(() => {
    if (screen !== 'play') return;
    let frameCount = 0;
    const speed = PIPE_SPEED[difficulty];
    const gap = GAP_HEIGHT[difficulty];
    const g = GRAVITY[difficulty];

    const tick = () => {
      const s = stateRef.current;
      if (s.gameOver) {
        animRef.current = null;
        return;
      }

      // Bird physics
      s.birdVel += g;
      s.birdY += s.birdVel;

      // Ground / ceiling
      if (s.birdY + BIRD_SIZE / 2 > STAGE_HEIGHT - GROUND_HEIGHT) {
        s.birdY = STAGE_HEIGHT - GROUND_HEIGHT - BIRD_SIZE / 2;
        s.birdVel = 0;
        loseLife();
        return;
      }
      if (s.birdY - BIRD_SIZE / 2 < 0) {
        s.birdY = BIRD_SIZE / 2;
        s.birdVel = 0;
      }

      // Move pipes
      let scoreGained = 0;
      for (const p of s.pipes) {
        p.x -= speed;
        if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) {
          p.scored = true;
          scoreGained++;
        }
      }
      s.score += scoreGained;

      // Spawn new pipe
      frameCount++;
      const lastPipe = s.pipes[s.pipes.length - 1];
      if (!lastPipe || lastPipe.x < STAGE_WIDTH - PIPE_SPACING) {
        s.pipes.push({
          x: STAGE_WIDTH,
          gapTop: randGapTop(difficulty),
          gapHeight: gap,
          scored: false,
        });
      }

      // Remove off-screen pipes
      s.pipes = s.pipes.filter(p => p.x + PIPE_WIDTH > -50);

      // Collision with pipes
      for (const p of s.pipes) {
        const birdLeft   = BIRD_X - BIRD_SIZE / 2;
        const birdRight  = BIRD_X + BIRD_SIZE / 2;
        const birdTop    = s.birdY - BIRD_SIZE / 2;
        const birdBottom = s.birdY + BIRD_SIZE / 2;
        const pipeLeft   = p.x;
        const pipeRight  = p.x + PIPE_WIDTH;
        const inX = birdRight > pipeLeft && birdLeft < pipeRight;
        if (inX) {
          if (birdTop < p.gapTop || birdBottom > p.gapTop + p.gapHeight) {
            loseLife();
            return;
          }
        }
      }

      // Sync to React state (throttled to every other frame to reduce renders)
      if (frameCount % 2 === 0) {
        setBirdY(s.birdY);
        setBirdVel(s.birdVel);
        setPipes([...s.pipes]);
        if (scoreGained > 0) setScore(s.score);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    function loseLife() {
      const s = stateRef.current;
      s.gameOver = true;
      const newLives = s.lives - 1;
      setLives(newLives);
      setFlashRed(true);
      setTimeout(() => setFlashRed(false), 200);

      if (newLives <= 0) {
        // Save best
        if (s.score > bestScore) {
          try {
            localStorage.setItem(`flappy_best_${difficulty}`, String(s.score));
            setBestScore(s.score);
          } catch {}
        }
        const isLast = round + 1 >= TOTAL_LIVES;
        setTimeout(() => {
          if (isLast) {
            setScreen('results');
          } else {
            // Reset for next life
            setBirdY(STAGE_HEIGHT / 2);
            setBirdVel(0);
            setPipes([{ x: STAGE_WIDTH, gapTop: randGapTop(difficulty), gapHeight: gap, scored: false }]);
            setScore(0);
            setGameOver(false);
            setStarted(false);
            setRound(r => r + 1);
            stateRef.current = {
              birdY: STAGE_HEIGHT / 2,
              birdVel: 0,
              pipes: [{ x: STAGE_WIDTH, gapTop: randGapTop(difficulty), gapHeight: gap, scored: false }],
              score: 0,
              lives: newLives,
              gameOver: false,
              lastSpawn: 0,
            };
          }
        }, 800);
      } else {
        // Reset for next life
        setTimeout(() => {
          setBirdY(STAGE_HEIGHT / 2);
          setBirdVel(0);
          setPipes([{ x: STAGE_WIDTH, gapTop: randGapTop(difficulty), gapHeight: gap, scored: false }]);
          setGameOver(false);
          setStarted(false);
          stateRef.current.birdY = STAGE_HEIGHT / 2;
          stateRef.current.birdVel = 0;
          stateRef.current.pipes = [{ x: STAGE_WIDTH, gapTop: randGapTop(difficulty), gapHeight: gap, scored: false }];
          stateRef.current.gameOver = false;
        }, 400);
      }
      animRef.current = null;
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [screen, difficulty, bestScore, round]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🐦</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Flappy Bird</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          <strong>Tap to flap!</strong> Fly through the pipe gaps. Hit a pipe or
          the ground and you lose a life. You have <strong>3 lives</strong> per match.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your speed:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · slow pipes, wide gaps</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · faster, tighter gaps</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · intense timing</span>
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
          3 lives per match. Tap, click, or press Space to flap.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🐦</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Match over!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Best score: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {bestScore >= 30 ? '⭐⭐⭐' : bestScore >= 15 ? '⭐⭐' : '⭐'}
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
            activity="flappy-bird"
            activityName="Flappy Bird"
            activityEmoji="🐦"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const birdRot = Math.max(-25, Math.min(90, birdVel * 4));
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, position: 'relative' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🐦 Flappy Bird</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-blue)' }}>{score}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Lives {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, TOTAL_LIVES - lives))}</span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_LIVES}</span>
      </div>

      <div
        onClick={flap}
        style={{
          background: '#87CEEB',
          padding: 12,
          borderRadius: 14,
          boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
          marginBottom: 16,
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background-color 0.1s',
          backgroundColor: flashRed ? '#FFB3B3' : '#87CEEB',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: STAGE_WIDTH,
            maxWidth: '100%',
            margin: '0 auto',
            height: STAGE_HEIGHT,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
            borderRadius: 8,
            border: '4px solid #1a1a1a',
          }}
        >
          <svg width={STAGE_WIDTH} height={STAGE_HEIGHT} style={{ display: 'block', position: 'absolute', top: 0, left: 0 }}>
            {/* Pipes */}
            {pipes.map((p, i) => (
              <g key={i}>
                {/* Top pipe */}
                <rect
                  x={p.x}
                  y={0}
                  width={PIPE_WIDTH}
                  height={p.gapTop}
                  fill="#6BCB77"
                  stroke="#3D8B47"
                  strokeWidth={2}
                />
                <rect
                  x={p.x - 4}
                  y={p.gapTop - 20}
                  width={PIPE_WIDTH + 8}
                  height={20}
                  fill="#5BAB67"
                  stroke="#3D8B47"
                  strokeWidth={2}
                  rx={2}
                />
                {/* Bottom pipe */}
                <rect
                  x={p.x}
                  y={p.gapTop + p.gapHeight}
                  width={PIPE_WIDTH}
                  height={STAGE_HEIGHT - p.gapTop - p.gapHeight - GROUND_HEIGHT}
                  fill="#6BCB77"
                  stroke="#3D8B47"
                  strokeWidth={2}
                />
                <rect
                  x={p.x - 4}
                  y={p.gapTop + p.gapHeight}
                  width={PIPE_WIDTH + 8}
                  height={20}
                  fill="#5BAB67"
                  stroke="#3D8B47"
                  strokeWidth={2}
                  rx={2}
                />
              </g>
            ))}
            {/* Bird */}
            <g transform={`translate(${BIRD_X}, ${birdY}) rotate(${birdRot})`} style={{ transition: 'transform 0.05s linear' }}>
              <circle cx={0} cy={0} r={BIRD_SIZE / 2} fill="#FFD93D" stroke="#E5B85A" strokeWidth={2} />
              <circle cx={-4} cy={-4} r={3} fill="#fff" />
              <circle cx={-4} cy={-4} r={1.5} fill="#000" />
              <polygon points={`${BIRD_SIZE/2 - 2},-2 ${BIRD_SIZE/2 + 6},0 ${BIRD_SIZE/2 - 2},2`} fill="#FF9F43" />
            </g>
            {/* Ground */}
            <rect
              x={0}
              y={STAGE_HEIGHT - GROUND_HEIGHT}
              width={STAGE_WIDTH}
              height={GROUND_HEIGHT}
              fill="#3D8B47"
              stroke="#1a1a1a"
              strokeWidth={2}
            />
            {/* Grass tufts */}
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={i}
                x1={i * 22 + 5}
                y1={STAGE_HEIGHT - GROUND_HEIGHT}
                x2={i * 22 + 5}
                y2={STAGE_HEIGHT - GROUND_HEIGHT - 6}
                stroke="#1a1a1a"
                strokeWidth={1.5}
              />
            ))}
          </svg>
          {!started && !gameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              textShadow: '0 2px 0 #2D1B00',
              pointerEvents: 'none',
            }}>
              Tap to start!
            </div>
          )}
          {gameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 700, color: '#fff',
              textShadow: '0 2px 0 #2D1B00',
              pointerEvents: 'none',
            }}>
              💥 Oof!
            </div>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: <strong>tap the sky</strong> (or press Space) to flap. Time it perfectly to slip through the gaps!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="flappy-bird"
          activityName="Flappy Bird"
          activityEmoji="🐦"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}