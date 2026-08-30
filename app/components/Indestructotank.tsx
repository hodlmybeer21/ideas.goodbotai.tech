'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Indestructotank (kid edition) — top-down tank battle. Move your tank
// with ← → ↑ ↓ (the tank faces the last direction you pressed), fire
// with SPACE (or hold FIRE). Enemy tanks spawn at the edges and slowly
// chase you. Push them into walls, shoot them, or just survive.
//
//   🌱 Easy   · open arena, 1 slow enemy, no enemy fire
//   🌿 Medium · some walls, 2 enemies, enemies fire slowly
//   🌳 Hard   · maze of walls, 3 fast enemies, frequent enemy fire
//
// 3 rounds per match, 3 lives each. Score per kill: 50.

type Difficulty = 0 | 1 | 2;
type Direction = 'up' | 'down' | 'left' | 'right';

interface Tank {
  id: number;
  r: number;
  c: number;
  dir: Direction;
  moveAccum: number;
  fireAccum: number;
}

interface Bullet {
  id: number;
  r: number;
  c: number;
  dir: Direction;
  friendly: boolean;
  alive: boolean;
  moveAccum: number;
}

interface Particle {
  id: number;
  r: number;
  c: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const GRID_W = 11;
const GRID_H = 9;
const CELL = 36; // pixels per cell
const STAGE_W = GRID_W * CELL; // 396
const STAGE_H = GRID_H * CELL; // 324
const BULLET_SPEED = 12; // cells per second
const BULLET_MOVE_INTERVAL = 1 / BULLET_SPEED;
const TOTAL_LIVES = 3;
const TOTAL_ROUNDS = 3;

const DIFFICULTY_CONFIG: Record<Difficulty, {
  enemyCount: number;
  enemySpeed: number;
  enemyFireInterval: number; // 0 = never fires
  playerSpeed: number;
  playerFireInterval: number;
  name: string;
}> = {
  0: { enemyCount: 1, enemySpeed: 1.6, enemyFireInterval: 0,    playerSpeed: 4.5, playerFireInterval: 0.45, name: 'Easy' },
  1: { enemyCount: 2, enemySpeed: 2.4, enemyFireInterval: 2.0,  playerSpeed: 5.0, playerFireInterval: 0.35, name: 'Medium' },
  2: { enemyCount: 3, enemySpeed: 3.2, enemyFireInterval: 1.2,  playerSpeed: 5.5, playerFireInterval: 0.28, name: 'Hard' },
};

const MAPS: string[][] = [
  // Easy — open arena
  [
    '###########',
    '#.........#',
    '#.........#',
    '#....P....#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '###########',
  ],
  // Medium — some walls for cover
  [
    '###########',
    '#.........#',
    '#...#.....#',
    '#...#.....#',
    '#....P....#',
    '#.....#...#',
    '#.........#',
    '#.....#...#',
    '###########',
  ],
  // Hard — maze of walls
  [
    '###########',
    '#.#.#.#.#.#',
    '#.........#',
    '#.#..P..#.#',
    '#.........#',
    '#.#.....#.#',
    '#.........#',
    '#.#.#.#.#.#',
    '###########',
  ],
];

let nextId = 1;
function newId() { return nextId++; }

function parseMap(map: string[]): { walls: boolean[][]; playerStart: { r: number; c: number } } {
  const walls: boolean[][] = [];
  let playerStart = { r: 1, c: 1 };
  for (let r = 0; r < GRID_H; r++) {
    walls.push([]);
    for (let c = 0; c < GRID_W; c++) {
      const ch = map[r]?.[c] || '#';
      walls[r].push(ch === '#');
      if (ch === 'P') playerStart = { r, c };
    }
  }
  return { walls, playerStart };
}

function dirOffset(d: Direction): { dr: number; dc: number } {
  switch (d) {
    case 'up':    return { dr: -1, dc: 0 };
    case 'down':  return { dr: 1,  dc: 0 };
    case 'left':  return { dr: 0,  dc: -1 };
    case 'right': return { dr: 0,  dc: 1 };
  }
}

const TANK_EMOJI: Record<Direction, string> = {
  up: '🔼', down: '🔽', left: '◀', right: '▶',
};

function canStand(walls: boolean[][], r: number, c: number): boolean {
  return r >= 0 && r < GRID_H && c >= 0 && c < GRID_W && !walls[r][c];
}

export default function Indestructotank({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [walls, setWalls] = useState<boolean[][]>([]);
  const [player, setPlayer] = useState<Tank | null>(null);
  const [enemies, setEnemies] = useState<Tank[]>([]);
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
  const playerRef = useRef(player);
  const enemiesRef = useRef(enemies);
  const bulletsRef = useRef(bullets);
  const particlesRef = useRef(particles);
  const wallsRef = useRef(walls);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const roundRef = useRef(round);
  const gameOverRef = useRef(gameOver);
  const difficultyRef = useRef(difficulty);
  const screenRef = useRef(screen);
  const bestScoreRef = useRef(bestScore);
  const keysRef = useRef({ up: false, down: false, left: false, right: false, fire: false });

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);
  useEffect(() => { wallsRef.current = walls; }, [walls]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { bestScoreRef.current = bestScore; }, [bestScore]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(`tank_best_${difficulty}`);
      setBestScore(s ? parseInt(s, 10) || 0 : 0);
    } catch {}
  }, [difficulty]);

  const startRound = useCallback((d: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[d];
    const { walls: w, playerStart } = parseMap(MAPS[d]);
    setWalls(w);

    const newPlayer: Tank = {
      id: newId(), r: playerStart.r, c: playerStart.c,
      dir: 'up', moveAccum: 0, fireAccum: 0,
    };
    setPlayer(newPlayer);

    // Spawn enemies at random edge cells (interior side of border)
    const edgeCells: { r: number; c: number; dir: Direction }[] = [];
    for (let c = 1; c < GRID_W - 1; c++) {
      if (!w[1][c]) edgeCells.push({ r: 1, c, dir: 'down' });
      if (!w[GRID_H - 2][c]) edgeCells.push({ r: GRID_H - 2, c, dir: 'up' });
    }
    for (let r = 1; r < GRID_H - 1; r++) {
      if (!w[r][1]) edgeCells.push({ r, c: 1, dir: 'right' });
      if (!w[r][GRID_W - 2]) edgeCells.push({ r, c: GRID_W - 2, dir: 'left' });
    }
    // Shuffle
    for (let i = edgeCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edgeCells[i], edgeCells[j]] = [edgeCells[j], edgeCells[i]];
    }
    const newEnemies: Tank[] = [];
    for (let i = 0; i < cfg.enemyCount && i < edgeCells.length; i++) {
      const cell = edgeCells[i];
      newEnemies.push({
        id: newId(),
        r: cell.r, c: cell.c,
        dir: cell.dir,
        moveAccum: Math.random() * 0.4,
        fireAccum: 1 + Math.random() * cfg.enemyFireInterval,
      });
    }
    setEnemies(newEnemies);
    setBullets([]);
    setParticles([]);
    setLives(TOTAL_LIVES);
    setGameOver(false);
  }, []);

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setScore(0);
    setRound(0);
    keysRef.current = { up: false, down: false, left: false, right: false, fire: false };
    startRound(d);
    setScreen('play');
  };

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') { keysRef.current.up = true; e.preventDefault(); }
      if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') { keysRef.current.down = true; e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') { keysRef.current.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keysRef.current.right = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') { keysRef.current.fire = true; e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'f' || e.key === 'F') keysRef.current.fire = false;
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
      const w = wallsRef.current;
      const playerCurrent = playerRef.current;

      // ─── Player movement + facing ───
      let newPlayer = playerCurrent ? { ...playerCurrent } : null;
      if (newPlayer) {
        let dir: Direction | null = null;
        if (keysRef.current.up)         dir = 'up';
        else if (keysRef.current.down)  dir = 'down';
        else if (keysRef.current.left)  dir = 'left';
        else if (keysRef.current.right) dir = 'right';

        if (dir) {
          newPlayer.dir = dir;
          newPlayer.moveAccum += dt;
          const moveInterval = 1 / cfg.playerSpeed;
          while (newPlayer.moveAccum >= moveInterval) {
            newPlayer.moveAccum -= moveInterval;
            const off = dirOffset(dir);
            const nr = newPlayer.r + off.dr;
            const nc = newPlayer.c + off.dc;
            if (canStand(w, nr, nc)) {
              newPlayer.r = nr;
              newPlayer.c = nc;
            } else {
              newPlayer.moveAccum = 0;
              break;
            }
          }
        } else {
          newPlayer.moveAccum = 0;
        }

        // Player fire
        if (keysRef.current.fire) {
          newPlayer.fireAccum += dt;
          if (newPlayer.fireAccum >= cfg.playerFireInterval) {
            newPlayer.fireAccum = 0;
            const off = dirOffset(newPlayer.dir);
            const br = newPlayer.r + off.dr;
            const bc = newPlayer.c + off.dc;
            if (canStand(w, br, bc)) {
              bulletsRef.current.push({
                id: newId(), r: br, c: bc,
                dir: newPlayer.dir, friendly: true, alive: true, moveAccum: 0,
              });
            }
          }
        } else {
          newPlayer.fireAccum = 0;
        }
      }

      // ─── Enemy AI ───
      const newEnemies: Tank[] = [];
      for (const e of enemiesRef.current) {
        const ne = { ...e };
        ne.moveAccum += dt;
        const moveInterval = 1 / cfg.enemySpeed;
        let movedThisStep = false;
        while (ne.moveAccum >= moveInterval) {
          ne.moveAccum -= moveInterval;
          if (!playerCurrent) break;
          const dr = Math.sign(playerCurrent.r - ne.r);
          const dc = Math.sign(playerCurrent.c - ne.c);
          const preferred: Direction = dr !== 0 ? (dr < 0 ? 'up' : 'down') : (dc < 0 ? 'left' : 'right');
          const tryDirs: Direction[] = [preferred];
          const perp: Direction[] = (preferred === 'up' || preferred === 'down') ? ['left', 'right'] : ['up', 'down'];
          // Random perpendicular first
          tryDirs.push(perp[Math.random() < 0.5 ? 0 : 1], perp[Math.random() < 0.5 ? 0 : 1]);

          let moved = false;
          for (const tryDir of tryDirs) {
            const off = dirOffset(tryDir);
            const nr = ne.r + off.dr;
            const nc = ne.c + off.dc;
            if (canStand(w, nr, nc) && !(nr === playerCurrent.r && nc === playerCurrent.c)) {
              ne.r = nr;
              ne.c = nc;
              ne.dir = tryDir;
              moved = true;
              break;
            }
          }
          if (!moved) {
            ne.moveAccum = 0;
            break;
          }
          movedThisStep = true;
        }
        // Enemy fire
        if (cfg.enemyFireInterval > 0) {
          ne.fireAccum -= dt;
          if (ne.fireAccum <= 0 && playerCurrent && Math.random() < 0.4) {
            // Try to aim toward player
            const dr = playerCurrent.r - ne.r;
            const dc = playerCurrent.c - ne.c;
            let aim: Direction = ne.dir;
            if (dr !== 0 && (dr < 0 ? 'up' : 'down')) aim = dr < 0 ? 'up' : 'down';
            else if (dc !== 0) aim = dc < 0 ? 'left' : 'right';
            const off = dirOffset(aim);
            const br = ne.r + off.dr;
            const bc = ne.c + off.dc;
            if (canStand(w, br, bc)) {
              bulletsRef.current.push({
                id: newId(), r: br, c: bc,
                dir: aim, friendly: false, alive: true, moveAccum: 0,
              });
              ne.dir = aim;
            }
            ne.fireAccum = cfg.enemyFireInterval * (0.7 + Math.random() * 0.6);
          }
        }
        newEnemies.push(ne);
      }

      // ─── Bullet movement + collisions ───
      let newScore = scoreRef.current;
      let newLives = livesRef.current;
      const addedParticles: Particle[] = [];

      const survivingBullets: Bullet[] = [];
      for (const b of bulletsRef.current) {
        if (!b.alive) continue;
        b.moveAccum += dt;
        while (b.moveAccum >= BULLET_MOVE_INTERVAL) {
          b.moveAccum -= BULLET_MOVE_INTERVAL;
          const off = dirOffset(b.dir);
          b.r += off.dr;
          b.c += off.dc;
          if (!canStand(w, b.r, b.c)) {
            b.alive = false;
            if (b.r >= 0 && b.r < GRID_H && b.c >= 0 && b.c < GRID_W) {
              addedParticles.push({ id: newId(), r: b.r, c: b.c, vx: 0, vy: 0, life: 0.2, maxLife: 0.2, color: '#FFD93D' });
            }
            break;
          }
        }
        if (!b.alive) continue;

        // Bullet vs player
        if (!b.friendly && newPlayer && b.r === newPlayer.r && b.c === newPlayer.c) {
          newLives -= 1;
          for (let j = 0; j < 8; j++) {
            addedParticles.push({ id: newId(), r: newPlayer.r, c: newPlayer.c, vx: (Math.random()-0.5)*80, vy: (Math.random()-0.5)*80, life: 0.5, maxLife: 0.5, color: '#5B7FFF' });
          }
          b.alive = false;
          continue;
        }

        // Bullet vs enemies
        if (b.friendly) {
          const idx = newEnemies.findIndex(e => e.r === b.r && e.c === b.c);
          if (idx >= 0) {
            newEnemies.splice(idx, 1);
            newScore += 50;
            for (let j = 0; j < 8; j++) {
              addedParticles.push({ id: newId(), r: b.r, c: b.c, vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, life: 0.5, maxLife: 0.5, color: '#FF6B3D' });
            }
            b.alive = false;
            continue;
          }
        }
        survivingBullets.push(b);
      }

      // Enemy ramming into player
      for (let i = newEnemies.length - 1; i >= 0; i--) {
        const e = newEnemies[i];
        if (newPlayer && e.r === newPlayer.r && e.c === newPlayer.c) {
          newEnemies.splice(i, 1);
          newLives -= 1;
          for (let j = 0; j < 10; j++) {
            addedParticles.push({ id: newId(), r: e.r, c: e.c, vx: (Math.random()-0.5)*120, vy: (Math.random()-0.5)*120, life: 0.6, maxLife: 0.6, color: '#FF6B3D' });
          }
        }
      }

      // ─── Update particles ───
      const stillParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        const np = { ...p, r: p.r + p.vx * dt / CELL, c: p.c + p.vy * dt / CELL, life: p.life - dt };
        if (np.life > 0) stillParticles.push(np);
      }
      const allParticles = [...stillParticles, ...addedParticles].slice(-200);

      // ─── State transitions ───
      let isGameOver = false;
      let advance = false;
      if (newLives <= 0) isGameOver = true;
      else if (newEnemies.length === 0) advance = true;

      setPlayer(newPlayer);
      setEnemies(newEnemies);
      setBullets(survivingBullets);
      setParticles(allParticles);
      setLives(Math.max(0, newLives));
      setScore(newScore);

      if (isGameOver) {
        setGameOver(true);
        const nb = Math.max(bestScoreRef.current, newScore);
        setBestScore(nb);
        try { localStorage.setItem(`tank_best_${difficultyRef.current}`, String(nb)); } catch {}
        setTimeout(() => setScreen('results'), 1500);
        return;
      }
      if (advance) {
        setRound(r => {
          const nr = r + 1;
          if (nr >= TOTAL_ROUNDS) {
            setTimeout(() => setScreen('results'), 800);
          } else {
            setTimeout(() => startRound(difficultyRef.current), 800);
          }
          return nr;
        });
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [screen, gameOver, startRound]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🚜</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Indestructotank</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 20px' }}>
          Top-down tank battle! Move with <strong>← → ↑ ↓</strong> (your tank faces the last direction you pressed).
          Press <strong>SPACE</strong> to fire in that direction. Blast the enemy tanks before they blast you!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌱 Easy · open arena, 1 enemy
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌿 Medium · walls, 2 enemies
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px' }}>
            🌳 Hard · maze, 3 fast enemies
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
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🚜</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
          Battle over!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Score: <strong>{score}</strong> · Best: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {round >= TOTAL_ROUNDS ? '⭐⭐⭐' : round >= 2 ? '⭐⭐' : '⭐'}
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
            activity="indestructotank"
            activityName="Indestructotank"
            activityEmoji="🚜"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🚜 Indestructotank</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Score <strong style={{ color: 'var(--accent-orange)' }}>{score}</strong></span>
        <span>·</span>
        <span>Lives {'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, TOTAL_LIVES - lives))}</span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
      </div>

      <div
        style={{
          background: '#1a1a2e',
          padding: 0,
          borderRadius: 6,
          border: '4px solid #2a2a4a',
          position: 'relative',
          margin: '0 auto 12px',
          width: STAGE_W,
          height: STAGE_H,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {/* Walls + floor grid */}
        {walls.map((row, r) =>
          row.map((isWall, c) => (
            <div key={`w-${r}-${c}`} style={{
              position: 'absolute',
              left: c * CELL, top: r * CELL,
              width: CELL, height: CELL,
              background: isWall ? '#4a4a5e' : '#2a2a3e',
              borderRight: '1px solid rgba(0,0,0,0.2)',
              borderBottom: '1px solid rgba(0,0,0,0.2)',
            }} />
          ))
        )}

        {/* Enemies */}
        {enemies.map(e => (
          <div key={`e-${e.id}`} style={{
            position: 'absolute',
            left: e.c * CELL + 2,
            top: e.r * CELL + 2,
            width: CELL - 4, height: CELL - 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            transform: 'rotate(0deg)',
            filter: 'drop-shadow(0 0 4px rgba(255, 107, 61, 0.5))',
          }}>
            {TANK_EMOJI[e.dir] === '◀' || TANK_EMOJI[e.dir] === '▶' ? (
              <div style={{ background: '#FF6B3D', width: '80%', height: '60%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {TANK_EMOJI[e.dir]}
              </div>
            ) : (
              <div style={{ background: '#FF6B3D', width: '60%', height: '80%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {TANK_EMOJI[e.dir]}
              </div>
            )}
          </div>
        ))}

        {/* Bullets */}
        {bullets.filter(b => b.alive).map(b => (
          <div key={`b-${b.id}`} style={{
            position: 'absolute',
            left: b.c * CELL + CELL/2 - 4,
            top: b.r * CELL + CELL/2 - 4,
            width: 8, height: 8,
            borderRadius: '50%',
            background: b.friendly ? '#5BFF8C' : '#FF5B5B',
            boxShadow: b.friendly ? '0 0 6px rgba(91,255,140,0.8)' : '0 0 6px rgba(255,91,91,0.8)',
          }} />
        ))}

        {/* Player */}
        {player && (
          <div style={{
            position: 'absolute',
            left: player.c * CELL + 2,
            top: player.r * CELL + 2,
            width: CELL - 4, height: CELL - 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
            filter: 'drop-shadow(0 0 6px rgba(91, 127, 255, 0.7))',
            transition: 'transform 0.05s linear',
          }}>
            {TANK_EMOJI[player.dir] === '◀' || TANK_EMOJI[player.dir] === '▶' ? (
              <div style={{ background: '#5B7FFF', width: '80%', height: '60%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white' }}>
                {TANK_EMOJI[player.dir]}
              </div>
            ) : (
              <div style={{ background: '#5B7FFF', width: '60%', height: '80%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white' }}>
                {TANK_EMOJI[player.dir]}
              </div>
            )}
          </div>
        )}

        {/* Particles */}
        {particles.map(p => (
          <div key={`p-${p.id}`} style={{
            position: 'absolute',
            left: p.c * CELL + CELL/2 - 3,
            top: p.r * CELL + CELL/2 - 3,
            width: 6, height: 6,
            borderRadius: '50%',
            background: p.color,
            opacity: Math.max(0, p.life / p.maxLife),
          }} />
        ))}
      </div>

      {/* Touch controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gridTemplateRows: 'repeat(3, 56px)', gap: 4 }}>
          <div />
          <button
            className="btn btn-primary"
            onPointerDown={() => { keysRef.current.up = true; }}
            onPointerUp={() => { keysRef.current.up = false; }}
            onPointerLeave={() => { keysRef.current.up = false; }}
            onPointerCancel={() => { keysRef.current.up = false; }}
            style={{ fontSize: 22, padding: 0, touchAction: 'manipulation' }}
          >▲</button>
          <div />
          <button
            className="btn btn-primary"
            onPointerDown={() => { keysRef.current.left = true; }}
            onPointerUp={() => { keysRef.current.left = false; }}
            onPointerLeave={() => { keysRef.current.left = false; }}
            onPointerCancel={() => { keysRef.current.left = false; }}
            style={{ fontSize: 22, padding: 0, touchAction: 'manipulation' }}
          >◀</button>
          <button
            className="btn btn-orange"
            onPointerDown={() => { keysRef.current.fire = true; }}
            onPointerUp={() => { keysRef.current.fire = false; }}
            onPointerLeave={() => { keysRef.current.fire = false; }}
            onPointerCancel={() => { keysRef.current.fire = false; }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ fontSize: 18, padding: 0, fontWeight: 700, touchAction: 'manipulation', userSelect: 'none' }}
          >🔥</button>
          <button
            className="btn btn-primary"
            onPointerDown={() => { keysRef.current.right = true; }}
            onPointerUp={() => { keysRef.current.right = false; }}
            onPointerLeave={() => { keysRef.current.right = false; }}
            onPointerCancel={() => { keysRef.current.right = false; }}
            style={{ fontSize: 22, padding: 0, touchAction: 'manipulation' }}
          >▶</button>
          <div />
          <button
            className="btn btn-primary"
            onPointerDown={() => { keysRef.current.down = true; }}
            onPointerUp={() => { keysRef.current.down = false; }}
            onPointerLeave={() => { keysRef.current.down = false; }}
            onPointerCancel={() => { keysRef.current.down = false; }}
            style={{ fontSize: 22, padding: 0, touchAction: 'manipulation' }}
          >▼</button>
          <div />
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: hold <strong>← → ↑ ↓</strong> to drive, the tank faces your last direction. Press <strong>SPACE</strong> / hold 🔥 to fire.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="indestructotank"
          activityName="Indestructotank"
          activityEmoji="🚜"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}