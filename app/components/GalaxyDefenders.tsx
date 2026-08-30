'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Galaxy Defenders (kid edition) — Galaga-style space shooter.
// Wave of aliens oscillates across the top. Player ship at the bottom
// moves with ← → and shoots with SPACE (or holds the FIRE button on
// touch). Aliens shoot back slowly and sometimes dive. Destroy the
// wave to advance. 3 lives per match round, 3 rounds per match.
//
//   🌱 Easy   · 3 aliens, slow + few bullets
//   🌿 Medium · 5 aliens, normal pace
//   🌳 Hard   · 7 aliens, fast + more dives

type Difficulty = 0 | 1 | 2;

interface Bullet { id: number; x: number; y: number; friendly: boolean; }
interface Enemy {
  id: number;
  x: number;
  y: number;
  type: 'small' | 'big';
  fireCooldown: number;
  diving: boolean;
  diveT: number;
  startX: number;
  startY: number;
}
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const STAGE_WIDTH = 400;
const STAGE_HEIGHT = 500;
const PLAYER_SIZE = 28;
const PLAYER_Y = STAGE_HEIGHT - 60;
const PLAYER_SPEED = 0.50; // screen widths per second
const BULLET_SPEED = 0.65; // screen heights per second
const ENEMY_BULLET_SPEED = 0.22;
const TOTAL_LIVES = 3;
const TOTAL_ROUNDS = 3;

const DIFFICULTY_CONFIG: Record<Difficulty, {
  enemyCount: number;
  enemySpeedMult: number;
  enemyFireInterval: number; // seconds between fire attempts per enemy
  playerFireInterval: number; // seconds between player bullets
  diveChance: number; // chance per second per enemy to dive
  name: string;
}> = {
  0: { enemyCount: 3, enemySpeedMult: 1.0, enemyFireInterval: 2.4, playerFireInterval: 0.40, diveChance: 0.10, name: 'Easy' },
  1: { enemyCount: 5, enemySpeedMult: 1.4, enemyFireInterval: 1.7, playerFireInterval: 0.30, diveChance: 0.22, name: 'Medium' },
  2: { enemyCount: 7, enemySpeedMult: 1.8, enemyFireInterval: 1.1, playerFireInterval: 0.22, diveChance: 0.38, name: 'Hard' },
};

let nextBulletId = 0;
let nextEnemyId = 0;
let nextParticleId = 0;
function newBulletId() { return nextBulletId++; }
function newEnemyId() { return nextEnemyId++; }
function newParticleId() { return nextParticleId++; }

function makeWave(d: Difficulty): Enemy[] {
  const cfg = DIFFICULTY_CONFIG[d];
  const cols = cfg.enemyCount;
  const margin = 0.18;
  const spacing = cols > 1 ? (1 - margin * 2) / (cols - 1) : 0;
  const arr: Enemy[] = [];
  for (let i = 0; i < cols; i++) {
    const x = (margin + i * spacing) * STAGE_WIDTH;
    const y = (0.12 + (i % 2) * 0.06) * STAGE_HEIGHT;
    const type: 'small' | 'big' = (i === Math.floor(cols / 2) && cols >= 3) ? 'big' : 'small';
    arr.push({
      id: newEnemyId(),
      x, y, type,
      fireCooldown: 1 + Math.random() * cfg.enemyFireInterval,
      diving: false, diveT: 0,
      startX: x, startY: y,
    });
  }
  return arr;
}

export default function GalaxyDefenders({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [playerX, setPlayerX] = useState(0.5);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [round, setRound] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Refs for stale-closure-free game loop
  const playerXRef = useRef(playerX);
  const enemiesRef = useRef(enemies);
  const bulletsRef = useRef(bullets);
  const particlesRef = useRef(particles);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  const gameOverRef = useRef(gameOver);
  const screenRef = useRef(screen);
  const difficultyRef = useRef(difficulty);
  const bestScoreRef = useRef(bestScore);
  const keysRef = useRef({ left: false, right: false, fire: false });
  const fireTimerRef = useRef(0);

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { bestScoreRef.current = bestScore; }, [bestScore]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(`galaxy_best_${difficulty}`);
      setBestScore(s ? parseInt(s, 10) || 0 : 0);
    } catch {}
  }, [difficulty]);

  const startWave = useCallback((d: Difficulty) => {
    setEnemies(makeWave(d));
    setBullets([]);
    setParticles([]);
    setLives(TOTAL_LIVES);
    setGameOver(false);
  }, []);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setPlayerX(0.5);
    setScore(0);
    setRound(0);
    keysRef.current = { left: false, right: false, fire: false };
    fireTimerRef.current = 0;
    startWave(d);
    setScreen('play');
  };

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keysRef.current.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keysRef.current.right = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { keysRef.current.fire = true; e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.fire = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (screen !== 'play' || gameOver) return;

    let rafId = 0;
    let lastFrame = 0;

    const tick = (timestamp: number) => {
      if (!lastFrame) lastFrame = timestamp;
      const dt = Math.min(0.1, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;

      const cfg = DIFFICULTY_CONFIG[difficultyRef.current];

      // ─── Player movement ───
      let newPx = playerXRef.current;
      if (keysRef.current.left)  newPx = Math.max(0.06, newPx - PLAYER_SPEED * dt);
      if (keysRef.current.right) newPx = Math.min(0.94, newPx + PLAYER_SPEED * dt);

      // ─── Player fire ───
      fireTimerRef.current -= dt;
      const newBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        const dy = b.friendly ? -BULLET_SPEED * STAGE_HEIGHT * dt : ENEMY_BULLET_SPEED * STAGE_HEIGHT * dt;
        const ny = b.y + dy;
        if (ny > 8 && ny < STAGE_HEIGHT - 8) newBullets.push({ ...b, y: ny });
      }
      if (keysRef.current.fire && fireTimerRef.current <= 0) {
        fireTimerRef.current = cfg.playerFireInterval;
        newBullets.push({ id: newBulletId(), x: newPx * STAGE_WIDTH, y: PLAYER_Y - 12, friendly: true });
      }

      // ─── Enemy logic ───
      const newEnemies = enemiesRef.current.map(e => ({ ...e }));
      for (const e of newEnemies) {
        if (e.diving) {
          e.diveT += dt;
          const px = newPx * STAGE_WIDTH;
          const targetDX = px - e.x;
          e.x += Math.sign(targetDX) * 130 * dt;
          e.y += 95 * dt;
          if (e.diveT > 3 || e.y > STAGE_HEIGHT - 40) {
            e.diving = false;
            e.diveT = 0;
            e.x = e.startX;
            e.y = e.startY;
          }
        } else {
          e.x = e.startX + Math.sin((timestamp + e.id * 137) / 800) * 30 * cfg.enemySpeedMult;
          if (Math.random() < cfg.diveChance * dt) {
            e.diving = true;
            e.diveT = 0;
          }
        }
        e.fireCooldown -= dt;
        if (e.fireCooldown <= 0 && !e.diving && Math.random() < 0.35) {
          e.fireCooldown = cfg.enemyFireInterval * (0.7 + Math.random() * 0.6);
          newBullets.push({ id: newBulletId(), x: e.x, y: e.y + 18, friendly: false });
        }
      }

      // ─── Collisions: bullets vs enemies, enemy bullets vs player ───
      let newScore = scoreRef.current;
      let newLives = livesRef.current;
      const survivingEnemies: Enemy[] = [];
      const addedParticles: Particle[] = [];

      for (const e of newEnemies) {
        let killed = false;
        const remaining: Bullet[] = [];
        for (const b of newBullets) {
          const dx = Math.abs(b.x - e.x);
          const dy = Math.abs(b.y - e.y);
          if (!killed && b.friendly && dx < 18 && dy < 18) {
            killed = true;
            newScore += e.type === 'big' ? 25 : 10;
            for (let k = 0; k < 8; k++) {
              addedParticles.push({
                id: newParticleId(),
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.5, maxLife: 0.5,
                color: e.type === 'big' ? '#FFD93D' : '#FF6B3D',
              });
            }
          } else if (!b.friendly && dx < 18 && Math.abs(b.y - PLAYER_Y) < 18) {
            newLives -= 1;
            for (let k = 0; k < 6; k++) {
              addedParticles.push({
                id: newParticleId(),
                x: newPx * STAGE_WIDTH, y: PLAYER_Y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.6, maxLife: 0.6,
                color: '#5B7FFF',
              });
            }
          } else {
            remaining.push(b);
          }
        }
        newBullets.length = 0;
        newBullets.push(...remaining);
        if (!killed) survivingEnemies.push(e);
      }

      // Diving-enemy body collision
      for (let i = survivingEnemies.length - 1; i >= 0; i--) {
        const e = survivingEnemies[i];
        const dx = Math.abs(e.x - newPx * STAGE_WIDTH);
        const dy = Math.abs(e.y - PLAYER_Y);
        if (dx < 22 && dy < 22) {
          newLives -= 1;
          for (let k = 0; k < 10; k++) {
            addedParticles.push({
              id: newParticleId(),
              x: (e.x + newPx * STAGE_WIDTH) / 2, y: (e.y + PLAYER_Y) / 2,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              life: 0.7, maxLife: 0.7,
              color: '#FF6B3D',
            });
          }
          survivingEnemies.splice(i, 1);
        }
      }

      // ─── Update particles ───
      const stillParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        const np = { ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt };
        if (np.life > 0) stillParticles.push(np);
      }
      const allParticles = [...stillParticles, ...addedParticles].slice(-200);

      // ─── Check round complete or game over ───
      let isGameOver = false;
      let advance = false;
      if (newLives <= 0) {
        isGameOver = true;
      } else if (survivingEnemies.length === 0) {
        advance = true;
      }

      // Apply state
      setPlayerX(newPx);
      setEnemies(survivingEnemies);
      setBullets(newBullets);
      setParticles(allParticles);
      setLives(Math.max(0, newLives));
      setScore(newScore);

      if (isGameOver) {
        setGameOver(true);
        const nb = Math.max(bestScoreRef.current, newScore);
        setBestScore(nb);
        try { localStorage.setItem(`galaxy_best_${difficultyRef.current}`, String(nb)); } catch {}
        setTimeout(() => setScreen('results'), 1500);
        return;
      }
      if (advance) {
        setRound(r => {
          const nr = r + 1;
          if (nr >= TOTAL_ROUNDS) {
            setTimeout(() => setScreen('results'), 800);
          } else {
            setTimeout(() => startWave(difficultyRef.current), 800);
          }
          return nr;
        });
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [screen, gameOver, startWave]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>👾</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Galaxy Defenders</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 20px' }}>
          Aliens are attacking! Use <strong>← →</strong> to move and <strong>SPACE</strong> to shoot.
          Destroy the wave to advance. <strong>3 waves</strong> per match, <strong>3 lives</strong> each.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌱 Easy · 3 aliens, slow
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌿 Medium · 5 aliens
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌳 Hard · 7 aliens, fast
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best score: <strong>{bestScore}</strong>
          </p>
        )}
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    const perfect = round >= TOTAL_ROUNDS;
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>👾</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: perfect ? 'var(--accent-green)' : 'var(--accent-blue)', marginTop: 12 }}>
          {perfect ? 'Galaxy saved!' : 'Mission over'}
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Score: <strong>{score}</strong> · Waves cleared: <strong>{round}</strong>/{TOTAL_ROUNDS} · Best: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {perfect ? '⭐⭐⭐' : round >= 2 ? '⭐⭐' : '⭐'}
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
            activity="galaxy-defenders"
            activityName="Galaxy Defenders"
            activityEmoji="👾"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>👾 Galaxy Defenders</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Wave <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Score <strong style={{ color: 'var(--accent-orange)' }}>{score}</strong></span>
        <span>·</span>
        <span>Lives {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, TOTAL_LIVES - lives))}</span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #050520 0%, #1a0a30 60%, #2a0a40 100%)',
          padding: 0,
          borderRadius: 8,
          border: '4px solid #2a1a4a',
          position: 'relative',
          margin: '0 auto 12px',
          maxWidth: STAGE_WIDTH,
          aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Stars (decorative, static for performance) */}
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 90}%`,
            width: (i % 3) + 1, height: (i % 3) + 1,
            borderRadius: '50%',
            background: '#fff', opacity: 0.5 + (i % 5) * 0.1,
          }} />
        ))}

        {/* Enemies */}
        {enemies.map(e => (
          <div key={e.id} style={{
            position: 'absolute',
            left: e.x - (e.type === 'big' ? 20 : 16),
            top: e.y - (e.type === 'big' ? 20 : 16),
            width: e.type === 'big' ? 40 : 32,
            height: e.type === 'big' ? 40 : 32,
            borderRadius: e.type === 'big' ? '40%' : '50%',
            background: e.type === 'big' ? '#A78BFA' : '#FF6B3D',
            boxShadow: e.type === 'big' ? '0 0 12px rgba(167, 139, 250, 0.6)' : '0 0 6px rgba(255, 107, 61, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: e.type === 'big' ? 22 : 18,
          }}>
            {e.type === 'big' ? '👾' : '👹'}
          </div>
        ))}

        {/* Bullets */}
        {bullets.map(b => (
          <div key={b.id} style={{
            position: 'absolute',
            left: b.x - 3,
            top: b.y - 7,
            width: 6, height: 14,
            borderRadius: 3,
            background: b.friendly ? '#5BFF8C' : '#FF5B5B',
            boxShadow: b.friendly ? '0 0 6px rgba(91, 255, 140, 0.8)' : '0 0 6px rgba(255, 91, 91, 0.8)',
          }} />
        ))}

        {/* Player ship */}
        {lives > 0 && (
          <div style={{
            position: 'absolute',
            left: playerX * STAGE_WIDTH - PLAYER_SIZE / 2,
            top: PLAYER_Y - PLAYER_SIZE / 2,
            width: PLAYER_SIZE, height: PLAYER_SIZE,
          }}>
            <svg viewBox="0 0 28 28" width={PLAYER_SIZE} height={PLAYER_SIZE}>
              <polygon points="14,2 26,26 14,20 2,26" fill="#5B7FFF" stroke="#FFF" strokeWidth="1" />
              <circle cx="14" cy="15" r="3" fill="#FFF" />
              {keysRef.current.fire && (
                <polygon points="14,26 10,32 14,30 18,32" fill="#FF9F43">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.1s" repeatCount="indefinite" />
                </polygon>
              )}
            </svg>
          </div>
        )}

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x - 3,
            top: p.y - 3,
            width: 6, height: 6,
            borderRadius: '50%',
            background: p.color,
            opacity: Math.max(0, p.life / p.maxLife),
          }} />
        ))}

        {/* Wave-clear hint */}
        {enemies.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#5BFF8C',
            textShadow: '0 0 12px rgba(0,0,0,0.8)',
          }}>
            Wave cleared! ✨
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onPointerDown={() => { keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          onPointerCancel={() => { keysRef.current.left = false; }}
          style={{ fontSize: 22, padding: '14px 22px', minWidth: 70, touchAction: 'manipulation' }}
        >
          ◀
        </button>
        <button
          className="btn btn-orange"
          onPointerDown={() => { keysRef.current.fire = true; }}
          onPointerUp={() => { keysRef.current.fire = false; }}
          onPointerLeave={() => { keysRef.current.fire = false; }}
          onPointerCancel={() => { keysRef.current.fire = false; }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ fontSize: 22, padding: '14px 28px', fontWeight: 700, touchAction: 'manipulation', userSelect: 'none', minWidth: 140 }}
        >
          🔥 FIRE
        </button>
        <button
          className="btn btn-primary"
          onPointerDown={() => { keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          onPointerCancel={() => { keysRef.current.right = false; }}
          style={{ fontSize: 22, padding: '14px 22px', minWidth: 70, touchAction: 'manipulation' }}
        >
          ▶
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: <strong>← →</strong> to move, hold <strong>SPACE</strong> or the FIRE button to shoot. 👾 dive at you — dodge!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="galaxy-defenders"
          activityName="Galaxy Defenders"
          activityEmoji="👾"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}