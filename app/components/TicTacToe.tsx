'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Tic Tac Toe — classic 3x3 grid, X vs O. Single-player vs AI with three tiers
//   🌱 Easy   (AI plays randomly — kid will win most of the time)
//   🌿 Medium (AI blocks threats and takes the center)
//   🌳 Hard   (AI uses minimax — a real challenge)
// 5 rounds per match; tracks wins/losses/draws and best win streak.
// Pure game — lives in the Games tab.

type Difficulty = 0 | 1 | 2;
type Cell = 'X' | 'O' | null;

interface Question {} // placeholder unused

const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],          // diagonals
];

function checkWinner(board: Cell[]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  if (board.every(c => c !== null)) return { winner: 'draw', line: null };
  return { winner: null, line: null };
}

function emptyBoard(): Cell[] {
  return Array(9).fill(null);
}

// Easy AI — random moves
function aiRandom(board: Cell[]): number {
  const open = board.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);
  return open[Math.floor(Math.random() * open.length)];
}

// Medium AI — win / block / center / corner / edge
function aiSmart(board: Cell[]): number {
  // Win if possible
  for (const line of LINES) {
    const vals = line.map(i => board[i]);
    const opens = line.filter(i => board[i] === null);
    if (vals.filter(v => v === 'O').length === 2 && opens.length === 1) return opens[0];
  }
  // Block player threats
  for (const line of LINES) {
    const vals = line.map(i => board[i]);
    const opens = line.filter(i => board[i] === null);
    if (vals.filter(v => v === 'X').length === 2 && opens.length === 1) return opens[0];
  }
  // Take center
  if (board[4] === null) return 4;
  // Take a corner
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return aiRandom(board);
}

// Hard AI — minimax with depth limit. Plays perfectly.
function aiOptimal(board: Cell[]): number {
  // If board is empty or only center filled, take center
  if (board.filter(c => c !== null).length === 0) return 4;
  if (board.filter(c => c !== null).length === 1 && board[4] === 'X') {
    // Player took center — pick a corner
    const corners = [0, 2, 6, 8];
    return corners[Math.floor(Math.random() * 4)];
  }
  const open = board.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);

  // Standard minimax. Score from O's perspective.
  // O is the AI (maximizer). X is the player (minimizer).
  let bestScore = -Infinity;
  let bestMove = open[0];
  for (const i of open) {
    const next = board.slice();
    next[i] = 'O';
    const score = minimax(next, 0, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function minimax(board: Cell[], depth: number, isMaximizing: boolean): number {
  const r = checkWinner(board);
  if (r.winner === 'O') return 10 - depth;
  if (r.winner === 'X') return depth - 10;
  if (r.winner === 'draw') return 0;

  const open = board.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of open) {
      board[i] = 'O';
      const score = minimax(board, depth + 1, false);
      board[i] = null;
      best = Math.max(best, score);
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of open) {
      board[i] = 'X';
      const score = minimax(board, depth + 1, true);
      board[i] = null;
      best = Math.min(best, score);
    }
    return best;
  }
}

function pickAIMove(board: Cell[], difficulty: Difficulty): number {
  if (difficulty === 0) return aiRandom(board);
  if (difficulty === 1) return aiSmart(board);
  return aiOptimal(board);
}

const TOTAL_ROUNDS = 5;

export default function TicTacToe({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [board, setBoard] = useState<Cell[]>(emptyBoard());
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('tictactoe_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const newGame = useCallback(() => {
    setBoard(emptyBoard());
    setWinner(null);
    setWinningLine(null);
    setBusy(false);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setStats({ wins: 0, losses: 0, draws: 0 });
    setStreak(0);
    setRound(0);
    newGame();
    setScreen('play');
  }, [newGame]);

  const finishGame = useCallback((result: 'X' | 'O' | 'draw', line: number[] | null) => {
    setWinner(result);
    setWinningLine(line);
    setRound(r => r + 1);
    setStats(s => ({
      wins: s.wins + (result === 'X' ? 1 : 0),
      losses: s.losses + (result === 'O' ? 1 : 0),
      draws: s.draws + (result === 'draw' ? 1 : 0),
    }));
    if (result === 'X') {
      const newStreak = streak + 1;
      setStreak(newStreak);
      try {
        if (newStreak > bestStreak) {
          localStorage.setItem('tictactoe_best_streak', String(newStreak));
          setBestStreak(newStreak);
        }
      } catch {}
    } else {
      setStreak(0);
    }
    const isLast = round + 1 >= TOTAL_ROUNDS;
    if (isLast) {
      setTimeout(() => setScreen('results'), 1200);
    } else {
      setTimeout(() => newGame(), 1200);
    }
  }, [streak, bestStreak, round, newGame]);

  const handleCellClick = useCallback((i: number) => {
    if (screen !== 'play') return;
    if (busy) return;
    if (winner) return;
    if (board[i] !== null) return;

    // Player is X. Place X.
    const next = board.slice();
    next[i] = 'X';

    const r = checkWinner(next);
    if (r.winner || next.every(c => c !== null)) {
      setBoard(next);
      finishGame(r.winner || 'draw', r.line);
      return;
    }

    // AI responds.
    setBoard(next);
    setBusy(true);
    setTimeout(() => {
      const aiMove = pickAIMove(next, difficulty);
      const after = next.slice();
      if (after[aiMove] === null) after[aiMove] = 'O';
      else {
        const fallback = after.findIndex(c => c === null);
        if (fallback >= 0) after[fallback] = 'O';
      }
      const r2 = checkWinner(after);
      setBoard(after);
      setBusy(false);
      if (r2.winner || after.every(c => c !== null)) {
        finishGame(r2.winner || 'draw', r2.line);
      }
    }, 400);
  }, [board, busy, winner, screen, difficulty, finishGame]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>⭕</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Tic Tac Toe</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Classic 3×3! You're <strong style={{ color: 'var(--accent-blue)' }}>X</strong>, the AI is <strong style={{ color: 'var(--accent-pink)' }}>O</strong>.
          Three in a row across, down, or diagonal wins!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your AI opponent:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · AI plays random moves</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · AI blocks + takes center</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · AI plays optimally (good luck!)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best win streak: <strong>{bestStreak}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          5 rounds per match. Build the longest win streak!
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    const pct = stats.wins + stats.losses + stats.draws > 0
      ? Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100)
      : 0;
    const stars = pct >= 70 ? 3 : pct >= 40 ? 2 : pct >= 10 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆⭕' : stars >= 2 ? '🎉⭕' : stars >= 1 ? '👍⭕' : '💪⭕';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          <span style={{ color: 'var(--accent-green)' }}>{stats.wins} W</span>{' '}·{' '}
          <span style={{ color: 'var(--accent-pink)' }}>{stats.losses} L</span>{' '}·{' '}
          <span style={{ color: 'var(--text-medium)' }}>{stats.draws} D</span>
          {' · '}Best streak: <strong>{bestStreak}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {!rated && stats.wins >= 1 && (
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
            activity="tic-tac-toe"
            activityName="Tic Tac Toe"
            activityEmoji="⭕"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const flashBg = winner === 'X' ? 'rgba(107, 203, 119, 0.32)'
    : winner === 'O' ? 'rgba(255, 107, 107, 0.32)'
    : winner === 'draw' ? 'rgba(255, 217, 61, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>⭕ Tic Tac Toe</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-green)' }}>{stats.wins}</strong> W</span>
        <span>·</span>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{stats.losses}</strong> L</span>
        <span>·</span>
        <span><strong>{stats.draws}</strong> D</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-blue)',
          marginBottom: 16,
        }}
      >
        <p style={{ margin: '0 0 14px', fontSize: 18, color: 'var(--text-dark)', fontWeight: 700, textAlign: 'center' }}>
          {winner === 'X' && '🎉 You win!'}
          {winner === 'O' && "🤖 AI wins!"}
          {winner === 'draw' && "🤝 It's a draw!"}
          {!winner && (busy ? 'AI is thinking…' : 'Your turn (X)')}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(3, 1fr)',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            maxWidth: 320,
            margin: '0 auto',
            aspectRatio: '1 / 1',
          }}
        >
          {board.map((cell, i) => {
            const isWin = winningLine?.includes(i) ?? false;
            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={busy || cell !== null || winner !== null}
                aria-label={`cell ${i + 1}`}
                style={{
                  background: isWin ? 'rgba(107, 203, 119, 0.4)' : '#FFF8E7',
                  border: isWin ? '4px solid var(--accent-green)' : '2px solid #E5B85A',
                  borderRadius: 12,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 56,
                  fontWeight: 700,
                  color: cell === 'X' ? 'var(--accent-blue)' : cell === 'O' ? 'var(--accent-pink)' : '#C5B5A2',
                  cursor: cell || busy || winner ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  boxShadow: isWin ? '0 4px 0 #3D8B47' : 'none',
                }}
              >
                {cell || ''}
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        You: <strong style={{ color: 'var(--accent-blue)' }}>X</strong> · AI: <strong style={{ color: 'var(--accent-pink)' }}>O</strong> · Tip: the center square is the strongest spot!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="tic-tac-toe"
          activityName="Tic Tac Toe"
          activityEmoji="⭕"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}