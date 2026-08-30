'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Avalanche (kid edition) — falling boulders come at you from the top.
// Move left/right at the bottom to dodge them. Survive as long as you can.
//   🌱 Easy   · slow boulders, wide play area
//   🌿 Medium · faster, narrower
//   🌳 Hard   · fast, narrow, multiple boulder types
// 3 difficulty levels. 3 lives per match. Best score per level saved.

type Difficulty = 0 | 1 | 2;
type BoulderKind = 'rock' | 'big' | 'fast';

interface Boulder {
  x: number; // 0..1
  y: number; // 0..1 (top to bottom)
  kind: BoulderKind;
  speed: number; // multiplier
  radius: number;
}

const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 500;
const GROUND_HEIGHT = 40;
const PLAYER_SIZE = 28;
const TOTAL_LIVES = 3;
const TOTAL_ROUNDS = 3;

const DIFFICULTY_CONFIG: Record<Difficulty, { spawnInterval: number; baseSpeed: number; maxBoulders: number; name: string }> = {
  0: { spawnInterval: 900, baseSpeed: 0.005, maxBoulders: 4, name: 'Calm' },
  1: { spawnInterval: 650, baseSpeed: 0.008, maxBoulders: 6, name: 'Steady' },
  2: { spawnInterval: 450, baseSpeed: 0.012, maxBoulders: 8, name: 'Wild' },
};

const KIND_INFO: Record<BoulderKind, { radius: number; color: string; speedMult: number; emoji: string }> = {
  rock: { radius: 12, color: '#888888', speedMult: 1,   emoji: '🪨' },
  big:  { radius: 18, color: '#5B3A29', speedMult: 0.8, emoji: '🪨' },
  fast: { radius: 8,  color: '#A78BFA', speedMult: 1.8, emoji: '⚡' },
};

const PLAYER_EMOJI = '🧗';

function newGame(d: Difficulty) {
  return {
    boulders: [] as Boulder[],
    score: 0,
    lives: TOTAL_LIVES,
    spawnTimer: 0,
    elapsed: 0,
    playerX: 0.5,
    crashed: false,
    gameOver: false,
  };
}

export default function Avalanche({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [playerX, setPlayerX] = useState(0.5);
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [round, setRound] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  const animRef = useRef<number | null>(null);
  const stateRef = useRef(newGame(0));
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem(`avalanche_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setPlayerX(0.5);
    setBoulders([]);
    setScore(0);
    setLives(TOTAL_LIVES);
    setRound(0);
    setCrashed(false);
    setGameOver(false);
    stateRef.current = newGame(d);
    setScreen('play');
  };

  const move = (dx: number) => {
    if (crashed || gameOver) return;
    setPlayerX(x => Math.max(0.05, Math.min(0.95, x + dx)));
  };

  // Keyboard handler
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a')  { e.preventDefault(); move(-0.05); }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); move(0.05); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, crashed, gameOver]);

  // Game loop
  useEffect(() => {
    if (screen !== 'play' || gameOver) return;

    const tick = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = (timestamp - lastFrameRef.current) / 16;
      lastFrameRef.current = timestamp;

      const state = stateRef.current;
      const cfg = DIFFICULTY_CONFIG[difficulty];
      state.elapsed += delta;

      // Spawn boulders
      state.spawnTimer += delta * 16; // ms
      if (state.spawnTimer >= cfg.spawnInterval && state.boulders.length < cfg.maxBoulders) {
        state.spawnTimer = 0;
        const kinds: BoulderKind[] = ['rock'];
        if (difficulty >= 1) kinds.push('rock', 'big');
        if (difficulty >= 2) kinds.push('rock', 'big', 'fast', 'fast');
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const info = KIND_INFO[kind];
        state.boulders.push({
          x: 0.1 + Math.random() * 0.8,
          y: -0.05,
          kind,
          speed: cfg.baseSpeed * info.speedMult * (0.8 + state.elapsed / 3000),
          radius: info.radius,
        });
      }

      // Move boulders
      const stillOnScreen: Boulder[] = [];
      let lives = state.lives;
      let crashed = false;
      for (const b of state.boulders) {
        b.y += b.speed * delta;
        // Check collision with player
        const px = state.playerX * STAGE_WIDTH;
        const py = (1 - GROUND_HEIGHT / STAGE_HEIGHT - PLAYER_SIZE / STAGE_HEIGHT / 2);
        const bx = b.x * STAGE_WIDTH;
        const by = (1 - b.y) * STAGE_HEIGHT; // b.y is 0..1 top to bottom
        const dist = Math.hypot(px - bx, (py * STAGE_HEIGHT) - by);
        if (dist < PLAYER_SIZE / 2 + b.radius * 0.7) {
          lives -= 1;
          crashed = true;
        } else if (b.y < 1) {
          stillOnScreen.push(b);
        } else {
          // Scored!
          state.score += 1;
        }
      }
      state.boulders = stillOnScreen;
      state.lives = lives;

      // Update React state
      setBoulders([...state.boulders]);
      setLives(state.lives);
      setScore(state.score);

      if (crashed) {
        setCrashed(true);
        if (state.lives <= 0) {
          state.gameOver = true;
          setGameOver(true);
          if (state.score > bestScore) {
            try { localStorage.setItem(`avalanche_best_${difficulty}`, String(state.score)); setBestScore(state.score); } catch {}
          }
          setTimeout(() => {
            const isLast = round + 1 >= TOTAL_ROUNDS;
            if (isLast) setScreen('results');
            else {
              setTimeout(() => {
                setRound(r => r + 1);
                stateRef.current = newGame(difficulty);
                setBoulders([]);
                setScore(0);
                setLives(TOTAL_LIVES);
                setCrashed(false);
                setPlayerX(0.5);
              }, 1500);
            }
          }, 600);
          return;
        }
        // Brief invincibility, respawn
        setTimeout(() => {
          setCrashed(false);
          stateRef.current.playerX = state.playerX;
        }, 800);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastFrameRef.current = 0;
    };
  }, [screen, gameOver, difficulty, bestScore, round]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🪨</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Avalanche</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Boulders come tumbling down from the top. Move <strong>left and
          right</strong> to dodge them. Survive as long as you can. You have
          <strong> 3 lives</strong>.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your avalanche:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · slow boulders</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · faster, big boulders</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · fast purple bolts</span>
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
          {TOTAL_ROUNDS} runs per match. Arrow keys or tap the buttons.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🪨</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
          All lives used!
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
            activity="avalanche"
            activityName="Avalanche"
            activityEmoji="🪨"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🪨 Avalanche</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Score <strong style={{ color: 'var(--accent-orange)' }}>{score}</strong></span>
        <span>·</span>
        <span>Lives {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, TOTAL_LIVES - lives))}</span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
        <span>·</span>
        <span>Round <strong>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #C2B280 85%, #8B7355 100%)',
          padding: 0,
          borderRadius: 6,
          border: '4px solid #1a1a1a',
          position: 'relative',
          margin: '0 auto 12px',
          maxWidth: STAGE_WIDTH,
          aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
          overflow: 'hidden',
          touchAction: 'manipulation',
        }}
      >
        {/* Player */}
        <div style={{
          position: 'absolute', left: `calc(${playerX * 100}% - ${PLAYER_SIZE / 2}px)`,
          bottom: GROUND_HEIGHT - PLAYER_SIZE / 2,
          width: PLAYER_SIZE, height: PLAYER_SIZE,
          fontSize: 24, textAlign: 'center', lineHeight: `${PLAYER_SIZE}px`,
          transition: crashed ? 'none' : 'left 0.08s linear',
          opacity: crashed ? 0.4 : 1,
        }}>
          {PLAYER_EMOJI}
        </div>

        {/* Boulders */}
        {boulders.map((b, i) => {
          const info = KIND_INFO[b.kind];
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `calc(${b.x * 100}% - ${b.radius}px)`,
              top: `calc(${b.y * 100}% - ${b.radius}px)`,
              width: b.radius * 2, height: b.radius * 2,
              borderRadius: '50%',
              background: info.color,
              boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.3)',
              fontSize: b.radius,
              textAlign: 'center', lineHeight: `${b.radius * 2}px`,
            }} />
          );
        })}

        {/* Ground */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_HEIGHT,
          background: '#8B7355', borderTop: '3px solid #5C4A2C',
        }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => move(-0.1)} style={{ fontSize: 20, padding: '12px 24px', touchAction: 'manipulation' }}>◀</button>
        <button className="btn btn-primary" onClick={() => move(0.1)} style={{ fontSize: 20, padding: '12px 24px', touchAction: 'manipulation' }}>▶</button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 12 }}>
        Tip: ← → or tap the buttons to dodge the boulders. <strong>Big brown ones</strong> are slow, <strong>purple bolts</strong> are fast!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="avalanche"
          activityName="Avalanche"
          activityEmoji="🪨"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}