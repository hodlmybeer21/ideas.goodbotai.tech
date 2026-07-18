'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

// Dots and Boxes — classic pen-and-paper game, now on screen.
//
// Rules:
//  - Grid of dots. Two players alternate.
//  - On your turn, tap an EDGE between two adjacent dots to draw a line.
//  - If that line completes the 4th side of one or more boxes, you CLAIM them
//    (they fill with your color), score points, and get another turn.
//  - If no box is completed, the turn passes to the other player.
//  - Most boxes at the end wins.
//
// Two modes:
//  - Two Player: hot-seat pass-and-play on the same device.
//  - vs Bot: solo play against a friendly (not-too-bright) AI.
//
// Best score and "best margin" persist across sessions for the parent dashboard.

type Player = 1 | 2;

interface GameState {
  // Horizontal lines: (rows+1) x cols. Each cell: 0 (none), 1 (P1), 2 (P2).
  hLines: number[][];
  // Vertical lines: rows x (cols+1).
  vLines: number[][];
  // Box owners: rows x cols. 0 = unclaimed, 1 = P1, 2 = P2.
  boxes: number[][];
  current: Player;
  scores: { 1: number; 2: number };
  moves: number;
  lastBoxBy: Player | null; // for visual "you go again" pulse
}

const COLORS = {
  1: { line: '#FF6B9D', fill: 'rgba(255,107,157,0.55)', stroke: '#E0487E', label: 'Pink', emoji: '🩷' },
  2: { line: '#6BCBFF', fill: 'rgba(107,203,255,0.55)', stroke: '#3FA9E0', label: 'Blue', emoji: '💙' },
} as const;

// Audio helpers — synth, no asset deps (matches the rest of the codebase)
let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  if (_ctx && _ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}
function lineSnd() {
  const c = ctx(); if (!c) return;
  try {
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 520;
    g.gain.setValueAtTime(0.14, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function boxSnd() {
  const c = ctx(); if (!c) return;
  try {
    [523, 659, 784].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.16, c.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.25);
      o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.26);
    });
  } catch {}
}
function winSnd() {
  const c = ctx(); if (!c) return;
  try {
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.32);
      o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.34);
    });
  } catch {}
}

function emptyGrid(rows: number, cols: number, fill: number): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function newGame(rows: number, cols: number, first: Player = 1): GameState {
  return {
    hLines: emptyGrid(rows + 1, cols, 0),
    vLines: emptyGrid(rows, cols + 1, 0),
    boxes: emptyGrid(rows, cols, 0),
    current: first,
    scores: { 1: 0, 2: 0 },
    moves: 0,
    lastBoxBy: null,
  };
}

// Try to draw a line at (orientation, r, c). Returns { newState, claimedBoxes }.
// If the line is already drawn or invalid, returns null.
function drawLine(
  state: GameState,
  orientation: 'h' | 'v',
  r: number,
  c: number,
  player: Player
): { newState: GameState; claimed: number } | null {
  const grid = orientation === 'h' ? state.hLines : state.vLines;
  if (grid[r][c] !== 0) return null;
  // Make a deep copy so React state updates trigger renders.
  const newH = state.hLines.map(row => row.slice());
  const newV = state.vLines.map(row => row.slice());
  const newBoxes = state.boxes.map(row => row.slice());
  if (orientation === 'h') newH[r][c] = player;
  else newV[r][c] = player;

  // Check which adjacent boxes this line completes.
  let claimed = 0;
  const rows = state.boxes.length;
  const cols = state.boxes[0].length;
  const candidates: [number, number][] = [];
  if (orientation === 'h') {
    // a horizontal edge at (r, c) borders boxes above (r-1, c) and below (r, c)
    if (r - 1 >= 0) candidates.push([r - 1, c]);
    if (r < rows) candidates.push([r, c]);
  } else {
    // a vertical edge at (r, c) borders boxes left (r, c-1) and right (r, c)
    if (c - 1 >= 0) candidates.push([r, c - 1]);
    if (c < cols) candidates.push([r, c]);
  }
  for (const [br, bc] of candidates) {
    if (
      newH[br][bc] !== 0 &&
      newH[br + 1][bc] !== 0 &&
      newV[br][bc] !== 0 &&
      newV[br][bc + 1] !== 0 &&
      newBoxes[br][bc] === 0
    ) {
      newBoxes[br][bc] = player;
      claimed++;
    }
  }
  const newScores = { ...state.scores };
  if (claimed > 0) newScores[player] += claimed;
  return {
    newState: {
      hLines: newH,
      vLines: newV,
      boxes: newBoxes,
      current: player,
      scores: newScores,
      moves: state.moves + 1,
      lastBoxBy: claimed > 0 ? player : null,
    },
    claimed,
  };
}

function remainingEdges(state: GameState): { orientation: 'h' | 'v'; r: number; c: number }[] {
  const edges: { orientation: 'h' | 'v'; r: number; c: number }[] = [];
  for (let r = 0; r < state.hLines.length; r++) {
    for (let c = 0; c < state.hLines[0].length; c++) {
      if (state.hLines[r][c] === 0) edges.push({ orientation: 'h', r, c });
    }
  }
  for (let r = 0; r < state.vLines.length; r++) {
    for (let c = 0; c < state.vLines[0].length; c++) {
      if (state.vLines[r][c] === 0) edges.push({ orientation: 'v', r, c });
    }
  }
  return edges;
}

function isBoxCompletedBy(state: GameState, br: number, bc: number): boolean {
  return (
    state.hLines[br][bc] !== 0 &&
    state.hLines[br + 1][bc] !== 0 &&
    state.vLines[br][bc] !== 0 &&
    state.vLines[br][bc + 1] !== 0
  );
}

// Would drawing this edge give the opponent a free box? (Bot uses this.)
function edgeIsSafe(state: GameState, e: { orientation: 'h' | 'v'; r: number; c: number }): boolean {
  // Simulate the draw (without mutating).
  const grid = e.orientation === 'h' ? state.hLines : state.vLines;
  if (grid[e.r][e.c] !== 0) return false;
  const sim = {
    hLines: state.hLines.map(row => row.slice()),
    vLines: state.vLines.map(row => row.slice()),
    boxes: state.boxes.map(row => row.slice()),
  } as GameState;
  if (e.orientation === 'h') sim.hLines[e.r][e.c] = 99;
  else sim.vLines[e.r][e.c] = 99;
  // Look at every unclaimed box that this edge borders. If after the draw that box
  // would have 3 sides filled (i.e. the opponent can close it), this edge is BAD.
  const rows = state.boxes.length;
  const cols = state.boxes[0].length;
  const candidates: [number, number][] = [];
  if (e.orientation === 'h') {
    if (e.r - 1 >= 0) candidates.push([e.r - 1, e.c]);
    if (e.r < rows) candidates.push([e.r, e.c]);
  } else {
    if (e.c - 1 >= 0) candidates.push([e.r, e.c - 1]);
    if (e.c < cols) candidates.push([e.r, e.c]);
  }
  for (const [br, bc] of candidates) {
    if (state.boxes[br][bc] !== 0) continue;
    if (isBoxCompletedBy(sim, br, bc)) return false; // would finish the box
    // Also count 3-sided chains: if after this draw the box has 3 sides, opponent closes it.
    const sides = [
      sim.hLines[br][bc] !== 0 ? 1 : 0,
      sim.hLines[br + 1][bc] !== 0 ? 1 : 0,
      sim.vLines[br][bc] !== 0 ? 1 : 0,
      sim.vLines[br][bc + 1] !== 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    if (sides >= 3) return false;
  }
  return true;
}

// Bot picks an edge. Friendly-for-kids logic:
//  1. Take any box-completing move (free point + another turn).
//  2. Otherwise, take a "safe" edge (one that doesn't hand the kid a free box).
//  3. Otherwise, pick a random edge. (Bot will lose some — that's fine.)
function botPick(state: GameState): { orientation: 'h' | 'v'; r: number; c: number } | null {
  const edges = remainingEdges(state);
  if (edges.length === 0) return null;

  // 1. Free boxes
  for (const e of edges) {
    const result = drawLine(state, e.orientation, e.r, e.c, 2);
    if (result && result.claimed > 0) return e;
  }
  // 2. Safe moves (don't open a side for the kid)
  const safe = edges.filter(e => edgeIsSafe(state, e));
  if (safe.length > 0) {
    return safe[Math.floor(Math.random() * safe.length)];
  }
  // 3. Random
  return edges[Math.floor(Math.random() * edges.length)];
}

interface ConfettiProps { active: boolean }
function Confetti({ active }: ConfettiProps) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: Math.random() * 100, color: colors[i % colors.length],
    delay: Math.random() * 1.2, size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color,
          animationDelay: `${p.delay}s`,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

type Mode = 'two-player' | 'bot';
type Difficulty = 4 | 5;

interface DotsAndBoxesProps {
  onBack: () => void;
  kidName: string;
}

export default function DotsAndBoxes({ onBack, kidName }: DotsAndBoxesProps) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'win'>('menu');
  const [mode, setMode] = useState<Mode>('two-player');
  const [difficulty, setDifficulty] = useState<Difficulty>(4); // 4 -> 4x4 boxes, 5 -> 5x5
  const [state, setState] = useState<GameState>(() => newGame(4, 4));
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [bestMargin, setBestMargin] = useState(0);
  const botTimerRef = useRef<number | null>(null);

  // Persist best margin across sessions (parent dashboard can read this later).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dotsandboxes_best_margin');
      if (saved) setBestMargin(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((m: Mode, d: Difficulty) => {
    setMode(m);
    setDifficulty(d);
    setState(newGame(d, d));
    setScreen('game');
  }, []);

  const reset = useCallback(() => {
    setState(newGame(difficulty, difficulty));
  }, [difficulty]);

  const checkGameOver = useCallback((s: GameState): boolean => {
    return s.scores[1] + s.scores[2] >= s.boxes.length * s.boxes[0].length;
  }, []);

  const finalizeWin = useCallback((s: GameState) => {
    setScreen('win');
    winSnd();
    const margin = Math.abs(s.scores[1] - s.scores[2]);
    if (margin > bestMargin) {
      setBestMargin(margin);
      try { localStorage.setItem('dotsandboxes_best_margin', String(margin)); } catch {}
    }
  }, [bestMargin]);

  // Handle player move
  const handleEdge = useCallback((orientation: 'h' | 'v', r: number, c: number) => {
    setState(prev => {
      // Block input during bot's turn or after game ends.
      if (screen !== 'game') return prev;
      if (mode === 'bot' && prev.current === 2) return prev;
      const result = drawLine(prev, orientation, r, c, prev.current);
      if (!result) return prev;
      lineSnd();
      if (result.claimed > 0) boxSnd();
      let next = result.newState;
      // Same player goes again if they claimed; otherwise flip.
      if (result.claimed === 0) {
        next = { ...next, current: (next.current === 1 ? 2 : 1) as Player, lastBoxBy: null };
      }
      // Check end
      if (checkGameOver(next)) {
        // Defer state update + win screen to avoid setState-during-render in some Next.js builds.
        setTimeout(() => finalizeWin(next), 50);
      }
      return next;
    });
  }, [screen, mode, checkGameOver, finalizeWin]);

  // Bot turn loop — runs whenever it's P2's turn in bot mode and the game is live.
  useEffect(() => {
    if (screen !== 'game' || mode !== 'bot') return;
    if (state.current !== 2) return;
    if (checkGameOver(state)) return;
    // Small thinking pause so the kid can see the bot "decide".
    botTimerRef.current = window.setTimeout(() => {
      setState(prev => {
        const pick = botPick(prev);
        if (!pick) return prev;
        const result = drawLine(prev, pick.orientation, pick.r, pick.c, 2);
        if (!result) return prev;
        // No sound on bot moves; keep it subtle so the kid's taps stay the focus.
        let next = result.newState;
        if (result.claimed === 0) {
          next = { ...next, current: 1 as Player, lastBoxBy: null };
        }
        if (checkGameOver(next)) {
          setTimeout(() => finalizeWin(next), 50);
        }
        return next;
      });
    }, 650);
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [screen, mode, state, checkGameOver, finalizeWin]);

  // ── MENU ────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <>
        <div className="canvas-page slide-up">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1 className="page-title">📦 Dots &amp; Boxes</h1>
          <p style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            Take turns drawing lines between the dots. When you finish the 4th
            side of a box, you <strong>claim it</strong> and go again!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420, margin: '0 auto' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a mode:</p>
            <button
              className="btn btn-pink"
              onClick={() => startGame('two-player', difficulty)}
              style={{ fontSize: 18, padding: '16px 20px', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👫 Two Players</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Pass &amp; play</span>
              </div>
            </button>
            <button
              className="btn btn-blue"
              onClick={() => startGame('bot', difficulty)}
              style={{ fontSize: 18, padding: '16px 20px', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🤖 vs Bot</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Play solo</span>
              </div>
            </button>

            <p style={{ margin: '16px 0 4px', fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Grid size:</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className={difficulty === 4 ? 'btn btn-secondary' : 'btn'}
                onClick={() => setDifficulty(4)}
                style={{ fontSize: 14, padding: '10px 14px', opacity: difficulty === 4 ? 1 : 0.7 }}
              >
                🌱 4×4 Easy
              </button>
              <button
                className={difficulty === 5 ? 'btn btn-secondary' : 'btn'}
                onClick={() => setDifficulty(5)}
                style={{ fontSize: 14, padding: '10px 14px', opacity: difficulty === 5 ? 1 : 0.7 }}
              >
                🌳 5×5 Hard
              </button>
            </div>
          </div>

          {bestMargin > 0 && (
            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
              🏆 Best win margin: <strong>{bestMargin}</strong>
            </p>
          )}
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
            Tip: tap the line between two dots to draw it. Most boxes wins!
          </p>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="dots-and-boxes"
            activityName="Dots & Boxes"
            activityEmoji="📦"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ── WIN SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'win') {
    const p1 = state.scores[1];
    const p2 = state.scores[2];
    const tied = p1 === p2;
    const p1Won = p1 > p2;
    let headline = '';
    let sub = '';
    if (tied) { headline = 'It\'s a tie! 🤝'; sub = `Both players got ${p1} boxes.`; }
    else if (mode === 'bot') {
      headline = p1Won ? 'You beat the Bot! 🎉' : 'Bot won this round 🤖';
      sub = p1Won ? `${p1} to ${p2} — great job!` : `${p1} to ${p2} — try again!`;
    } else {
      headline = `${p1Won ? COLORS[1].emoji : COLORS[2].emoji} ${p1Won ? COLORS[1].label : COLORS[2].label} wins!`;
      sub = `${p1} to ${p2}`;
    }
    return (
      <>
        <Confetti active={p1Won || tied} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 32 }}>{p1Won || tied ? '🏆' : '🤖'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
            {headline}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>{sub}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18, fontSize: 16 }}>
            <span style={{ color: COLORS[1].stroke, fontWeight: 700 }}>🩷 Pink: {p1}</span>
            <span style={{ color: COLORS[2].stroke, fontWeight: 700 }}>💙 Blue: {p2}</span>
          </div>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 28, fontSize: 18, padding: '16px 32px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => { reset(); setScreen('game'); }} style={{ fontSize: 16, padding: '14px 24px' }}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
              🎲 Change Mode
            </button>
            <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="dots-and-boxes"
            activityName="Dots & Boxes"
            activityEmoji="📦"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ── GAME SCREEN ─────────────────────────────────────────────────────────
  return (
    <Board
      state={state}
      mode={mode}
      onEdge={handleEdge}
      onBack={onBack}
      onShowRating={() => setShowRating(true)}
      onReset={() => { reset(); }}
      showRating={showRating && !rated}
      kidName={kidName}
    />
  );
}

// ── Board component ───────────────────────────────────────────────────────
interface BoardProps {
  state: GameState;
  mode: Mode;
  onEdge: (orientation: 'h' | 'v', r: number, c: number) => void;
  onBack: () => void;
  onShowRating: () => void;
  onReset: () => void;
  showRating: boolean;
  kidName: string;
}

function Board({ state, mode, onEdge, onBack, onShowRating, onReset, showRating, kidName }: BoardProps) {
  const rows = state.boxes.length;
  const cols = state.boxes[0].length;
  // Visual sizing — fit a comfortable playfield on phones too.
  // Use a fixed virtual coordinate space, scale with CSS.
  const VB_W = 480;
  const VB_H = 480;
  const PAD = 30; // padding inside the viewBox so dots aren't flush at edges
  const playW = VB_W - PAD * 2;
  const playH = VB_H - PAD * 2;
  const stepX = playW / cols;
  const stepY = playH / rows;

  const dot = (r: number, c: number) => ({ x: PAD + c * stepX, y: PAD + r * stepY });

  // Edge hit-targets overlap by a small margin so adjacent edges are easy to tap
  // and feel like a single connected line once both halves of a side are drawn.
  const HIT_W = Math.min(stepX, stepY) * 0.55;

  const total = rows * cols;
  const cur = state.current;
  const curColor = COLORS[cur];
  const turnLocked = mode === 'bot' && cur === 2;

  return (
    <>
      <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <button className="back-btn" onClick={onBack}>← Back</button>
          <button
            className="btn"
            onClick={onReset}
            style={{ fontSize: 13, padding: '8px 14px' }}
            title="Start over from this same mode"
          >
            🔄 Reset
          </button>
        </div>
        <h1 className="page-title" style={{ marginBottom: 4 }}>📦 Dots &amp; Boxes</h1>

        {/* Score + turn banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, marginBottom: 12, flexWrap: 'wrap',
        }}>
          <div
            key={`turn-${cur}-${state.moves}`}
            style={{
              background: curColor.fill,
              border: `2px solid ${curColor.stroke}`,
              color: curColor.stroke,
              padding: '10px 18px',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 18,
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'pop 0.35s ease',
            }}
          >
            <span>{curColor.emoji}</span>
            <span>
              {mode === 'bot'
                ? (cur === 1 ? 'Your turn' : 'Bot is thinking…')
                : `${curColor.label}'s turn`}
            </span>
            {state.lastBoxBy === cur && (
              <span style={{ marginLeft: 4, fontSize: 14 }}>· go again!</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 16 }}>
            <span style={{ color: COLORS[1].stroke, fontWeight: 700 }}>🩷 {state.scores[1]}</span>
            <span style={{ color: 'var(--text-medium)' }}>·</span>
            <span style={{ color: COLORS[2].stroke, fontWeight: 700 }}>💙 {state.scores[2]}</span>
            <span style={{ color: 'var(--text-medium)' }}>·</span>
            <span style={{ color: 'var(--text-medium)' }}>
              {state.scores[1] + state.scores[2]}/{total}
            </span>
          </div>
        </div>

        {/* Playfield */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            maxWidth: 560,
            margin: '0 auto',
            background: 'linear-gradient(180deg, #FFF7ED 0%, #FEF3C7 100%)',
            border: '3px solid #E5D7B8',
            borderRadius: 18,
            padding: 8,
            boxShadow: '0 8px 22px rgba(0,0,0,0.08), inset 0 0 40px rgba(255,217,61,0.18)',
            touchAction: 'manipulation',
            userSelect: 'none',
          }}
          aria-label={`Dots and boxes playfield, ${rows} by ${cols}, ${curColor.label} to move`}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            height="100%"
            style={{ display: 'block', borderRadius: 12 }}
          >
            {/* Box fills */}
            {state.boxes.map((row, br) =>
              row.map((owner, bc) => {
                if (owner === 0) return null;
                const tl = dot(br, bc);
                const fill = COLORS[owner as 1 | 2].fill;
                const stroke = COLORS[owner as 1 | 2].stroke;
                return (
                  <g key={`b-${br}-${bc}`} style={{ animation: 'fadeIn 0.3s ease' }}>
                    <rect
                      x={tl.x + 2}
                      y={tl.y + 2}
                      width={stepX - 4}
                      height={stepY - 4}
                      rx={6}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={2}
                    />
                  </g>
                );
              })
            )}

            {/* Filled horizontal lines */}
            {state.hLines.map((row, r) =>
              row.map((owner, c) => {
                if (owner === 0) return null;
                const a = dot(r, c);
                const b = dot(r, c + 1);
                return (
                  <line
                    key={`h-${r}-${c}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={COLORS[owner as 1 | 2].line}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })
            )}

            {/* Filled vertical lines */}
            {state.vLines.map((row, r) =>
              row.map((owner, c) => {
                if (owner === 0) return null;
                const a = dot(r, c);
                const b = dot(r + 1, c);
                return (
                  <line
                    key={`v-${r}-${c}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={COLORS[owner as 1 | 2].line}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })
            )}

            {/* Dots */}
            {Array.from({ length: rows + 1 }, (_, r) =>
              Array.from({ length: cols + 1 }, (_, c) => {
                const p = dot(r, c);
                return (
                  <circle
                    key={`d-${r}-${c}`}
                    cx={p.x} cy={p.y} r={5}
                    fill="#2D1B00"
                  />
                );
              })
            )}

            {/* Hit targets — render last so they sit on top */}
            {/* Horizontal edges */}
            {Array.from({ length: rows + 1 }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const a = dot(r, c);
                const isFree = state.hLines[r][c] === 0;
                const enabled = isFree && !turnLocked;
                return (
                  <rect
                    key={`hh-${r}-${c}`}
                    x={a.x}
                    y={a.y - HIT_W / 2}
                    width={stepX}
                    height={HIT_W}
                    fill="transparent"
                    style={{
                      cursor: enabled ? 'pointer' : 'default',
                      pointerEvents: enabled ? 'auto' : 'none',
                    }}
                    onClick={() => onEdge('h', r, c)}
                  >
                    {!enabled && !isFree && (
                      <title>already drawn</title>
                    )}
                  </rect>
                );
              })
            )}
            {/* Vertical edges */}
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols + 1 }, (_, c) => {
                const a = dot(r, c);
                const isFree = state.vLines[r][c] === 0;
                const enabled = isFree && !turnLocked;
                return (
                  <rect
                    key={`vv-${r}-${c}`}
                    x={a.x - HIT_W / 2}
                    y={a.y}
                    width={HIT_W}
                    height={stepY}
                    fill="transparent"
                    style={{
                      cursor: enabled ? 'pointer' : 'default',
                      pointerEvents: enabled ? 'auto' : 'none',
                    }}
                    onClick={() => onEdge('v', r, c)}
                  />
                );
              })
            )}
          </svg>
        </div>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--text-medium)' }}>
          {mode === 'two-player'
            ? <>Pass the device when the color changes. <strong style={{ color: curColor.stroke }}>{curColor.label}</strong> is up.</>
            : cur === 1
              ? <>Tap any line between two dots. <strong>You</strong> are up next.</>
              : <>🤖 Bot is choosing a line…</>}
        </p>

        {!showRating && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={onShowRating} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
              ⭐ Rate Dots &amp; Boxes
            </button>
          </div>
        )}
      </div>

      {showRating && (
        <RatingModal
          activity="dots-and-boxes"
          activityName="Dots & Boxes"
          activityEmoji="📦"
          kidName={kidName}
          onClose={() => {}}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}