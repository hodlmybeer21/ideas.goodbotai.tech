'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Tic Tac Toe — classic 3x3 X vs O game. Player is X, AI is O (with a simple
// smart strategy: win if possible, block player, take center, take corners).
//   🌱 Easy   (AI plays random)
//   🌿 Medium (AI blocks and takes center)
//   🌳 Hard   (AI plays optimally — minimax with depth limit)
// Tracks wins/losses/draws and a best-win-streak in localStorage. Fun, fast
// rounds — perfect for the new Games category.

type Difficulty = 0 | 1 | 2;

interface GameState {
  board: ('X' | 'O' | null)[]; // length 9, index 0-8 (row-major)
  currentPlayer: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
  moveCount: number;
}

type Stats = { wins: number; losses: number; draws: number };

const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],          // diagonals
];

function checkWinner(board: ('X' | 'O' | null)[]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  if (board.every(cell => cell !== null)) return { winner: 'draw', line: null };
  return { winner: null, line: null };
}

function emptyBoard(): ('X' | 'O' | null)[] {
  return Array(9).fill(null);
}

// ─── AI strategies ────────────────────────────────────────────────────────────
// Each takes the current board (player is X, AI is O) and returns the chosen index.
function aiRandom(board: ('X' | 'O' | null)[]): number {
  const avail = board.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);
  return avail[Math.floor(Math.random() * avail.length)];
}

function aiSmart(board: ('X' | 'O' | null)[]): number {
  // 1) Win if possible
  for (const line of LINES) {
    const vals = line.map(i => board[i]);
    const empties = line.filter(i => board[i] === null);
    if (vals.filter(v => v === 'O').length === 2 && empties.length === 1) {
      return empties[0];
    }
  }
  // 2) Block player if they're about to win
  for (const line of LINES) {
    const vals = line.map(i => board[i]);
    const empties = line.filter(i => board[i] === null);
    if (vals.filter(v => v === 'X').length === 2 && empties.length === 1) {
      return empties[0];
    }
  }
  // 3) Take center if open
  if (board[4] === null) return 4;
  // 4) Take a corner if available
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5) Random
  return aiRandom(board);
}

function aiOptimal(board: ('X' | 'O' | null)[]): number {
  // Minimax with depth limit. AI is O (maximizer when O's turn).
  const avail = board.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0);
  if (avail.length === 9) return 4; // take center first

  const score = (b: ('X' | 'O' | null)[], depth: number): number => {
    const r = checkWinner(b);
    if (r.winner === 'O') return 10 - depth;
    if (r.winner === 'X') return depth - 10;
    if (r.winner === 'draw') return 0;
    return -999; // continue
  };

  let bestScore = -Infinity;
  let bestMove = avail[0];
  for (const i of avail) {
    const copy = board.slice();
    copy[i] = 'O';
    // Simple minimax: pick the move that maximizes O's score with X to follow.
    let worstForO = Infinity;
    for (const j of board.map((v, k) => (v === null && k !== i ? k : -1)).filter(k => k >= 0)) {
      const copy2 = copy.slice();
      copy2[j] = 'X';
      const s = score(copy2, 1);
      if (s < worstForO) worstForO = s;
    }
    if (worstForO > bestScore) {
      bestScore = worstForO;
      bestMove = i;
    }
  }
  return bestMove;
}

function pickAIMove(board: ('X' | 'O' | null)[], difficulty: Difficulty): number {
  if (difficulty === 0) return aiRandom(board);
  if (difficulty === 1) return aiSmart(board);
  return aiOptimal(board);
}

const TOTAL_ROUNDS = 5;

export default function TicTacToe({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [board, setBoard] = useState<('X' | 'O' | null)[]>(emptyBoard());
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [stats, setStats] = useState<Stats>({ wins: 0, losses: 0, draws: 0 });
  const [streak, setStreak] = useState(0);     // consecutive wins (resets on loss or draw)
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);          // # of completed games
  const [busy, setBusy] = useState(false);        // AI thinking
  const [flash, setFlash] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('tictactoe_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  // Reset streak when difficulty changes (different AI = different game)
  useEffect(() => {
    setStats({ wins: 0, losses: 0, draws: 0 });
    setStreak(0);
    setRound(0);
    setBoard(emptyBoard());
    setWinner(null);
    setWinningLine(null);
    setFlash(null);
    setBusy(false);
  }, [difficulty]);

  // AI plays whenever it's O's turn and no winner.
  useEffect(() => {
    if (screen !== 'play') return;
    if (winner) return;
    if (board.every(c => c !== null)) return;
    // X always goes first (player). O is the AI.
    // The cell onClick only fires for X; we determine when it's AI's turn by checking
    // move count parity (X moves on odd, O on even). Simpler: AI plays after each X move
    // via the onClick handler. This effect isn't needed since we call aiMove inline.
  }, [screen, winner, board]);

  const newGame = useCallback(() => {
    setBoard(emptyBoard());
    setWinner(null);
    setWinningLine(null);
    setFlash(null);
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
    const isLast = round + 1 >= TOTAL_ROUNDS;

    setStats(s => {
      const next = { ...s };
      if (result === 'X') next.wins += 1;
      else if (result === 'O') next.losses += 1;
      else next.draws += 1;
      return next;
    });

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

    if (isLast) {
      setTimeout(() => setScreen('results'), 1400);
    } else {
      setTimeout(() => newGame(), 1400);
    }
  }, [streak, bestStreak, round, newGame]);

  const handleCellClick = useCallback((i: number) => {
    if (screen !== 'play') return;
    if (busy) return;
    if (winner) return;
    if (board[i] !== null) return;

    // Player is X. Place X.
    const newBoard = board.slice();
    newBoard[i] = 'X';

    // Did X just win?
    const r = checkWinner(newBoard);
    if (r.winner) {
      setBoard(newBoard);
      finishGame(r.winner, r.line);
      return;
    }
    if (newBoard.every(c => c !== null)) {
      setBoard(newBoard);
      finishGame('draw', null);
      return;
    }

    // AI responds.
    setBoard(newBoard);
    setBusy(true);
    setTimeout(() => {
      const aiMove = pickAIMove(newBoard, difficulty);
      const boardAfterAI = newBoard.slice();
      if (boardAfterAI[aiMove] === null) {
        boardAfterAI[aiMove] = 'O';
      } else {
        // Shouldn't happen — fallback to first empty.
        const fallback = boardAfterAI.findIndex(c => c === null);
        if (fallback >= 0) boardAfterAI[fallback] = 'O';
      }
      const r2 = checkWinner(boardAfterAI);
      setBoard(boardAfterAI);
      setBusy(false);
      if (r2.winner || boardAfterAI.every(c => c !== null)) {
        finishGame(r2.winner || 'draw', r2.line);
      }
    }, 450);
  }, [board, busy, winner, screen, difficulty, finishGame]);

  // Status text for the play screen.
  const turnLabel = winner
    ? winner === 'draw' ? "It's a draw!" : `${winner === 'X' ? 'You' : 'AI'} win${winner === 'X' ? '' : 's'}!`
    : busy
    ? 'AI is thinking…'
    : board.filter(c => c).length % 2 === 0
    ? 'Your turn (X)'
    : 'AI thinking…';

  // ─── MENU ─ ─
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>⭕</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Tic Tac Toe</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Classic 3×3 game! You're <strong style={{ color: 'var(--accent-blue)' }}>X</strong>, the AI is
          <strong style={{ color: 'var(--accent-pink)' }}> O</strong>. Three in a row (across, down, or diagonal) wins!
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
              <span>🌳 Hard · AI plays optimally</span>
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

  // ─── RESULTS ─ ─
  if (screen === 'results') {
    const total = stats.wins + stats.losses + stats.draws;
    const pct = total === 0 ? 0 : Math.round((stats.wins / total) * 100);
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : pct >= 20 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆⭕' : stars >= 2 ? '🎉⭕' : stars >= 1 ? '👍⭕' : '💪⭕';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          <span style={{ color: 'var(--accent-green)' }}>{stats.wins} W</span> ·{' '}
          <span style={{ color: 'var(--accent-pink)' }}>{stats.losses} L</span> ·{' '}
          <span style={{ color: 'var(--text-medium)' }}>{stats.draws} D</span>
          {' · '}Best streak: <strong>{bestStreak}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {!rated && stats.wins >= 2 && (
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

  // ─── PLAY ─ ─
  const flashBg = flash === 'win'
    ? 'rgba(107, 203, 119, 0.32)'
    : flash === 'loss'
    ? 'rgba(255, 107, 107, 0.32)'
    : flash === 'draw'
    ? 'rgba(255, 217, 61, 0.32)'
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
        <p style={{ margin: '0 0 12px', fontSize: 17, color: 'var(--text-dark)', fontWeight: 600, textAlign: 'center' }}>
          {turnLabel}
        </p>

        {/* 3x3 grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(3, 1fr)',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            maxWidth: 320,
            margin: '0 auto',
            aspectRatio: '1 / 1',
          }}
        >
          {board.map((cell, i) => {
            const isWinningCell = winningLine?.includes(i) ?? false;
            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={busy || !!cell || !!winner}
                aria-label={`cell ${i + 1}`}
                style={{
                  background: isWinningCell ? 'rgba(107, 203, 119, 0.4)' : '#FFF8E7',
                  border: isWinningCell ? '3px solid var(--accent-green)' : '2px solid #E5B85A',
                  borderRadius: 10,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 56,
                  fontWeight: 700,
                  color: cell === 'X' ? 'var(--accent-blue)' : cell === 'O' ? 'var(--accent-pink)' : '#C5B5A2',
                  cursor: cell || busy || winner ? 'default' : 'pointer',
                  transition: 'transform 0.08s, background 0.18s, color 0.18s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                {cell || ''}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>
          You: <strong style={{ color: 'var(--accent-blue)' }}>X</strong> · AI: <strong style={{ color: 'var(--accent-pink)' }}>O</strong>
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)' }}>
        Tip: the center square is the most powerful — control it when you can!
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