'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Kind Word Bingo — one card shared between Player 1 and Player 2. A scenario
// is drawn; both players scan their card for a kindness square that fits;
// first to call "Bingo!" (or to mark a row/col/diagonal) wins the round.
// Hot-seat only (no internet, no accounts — pass the iPad).
// Sizes: 3x3 (easy), 4x4 (medium), 5x5 (hard) — like NumberBingo's grade.

type Difficulty = 0 | 1 | 2;

const KINDNESS = [
  'Share your snack',
  'Help pick up books',
  'Say something kind',
  'Listen to a friend',
  'Ask a new kid to play',
  'Invite someone to sit',
  'Give a compliment',
  'Say thank you',
  'Cheer for someone',
  'Tell an adult if someone is hurt',
  'Take turns fairly',
  'Comfort a friend',
  'Help with a chore',
  'Lend a pencil',
  'Smile at a stranger',
  'Use kind words',
  'Stand up for someone',
  'Wait your turn',
  'Solve a problem with words',
  'Keep a promise',
  'Speak up politely',
  'Use a quiet voice',
  'Hold the door',
  'Clean up your mess',
  'Walk away from a fight',
  'Forgive a friend',
  'Apologize when wrong',
  'Ask how someone feels',
  'Tell the truth',
  'Try again after a mistake',
  'Be patient',
  'Include everyone',
];

interface CellMark { [squareIdx: number]: boolean; }

interface Round {
  scenarios: { scenario: string; matchingKindnessIdx: number }[];
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRound(d: Difficulty): Round {
  // Each round has 3-4 scenarios; matching kindness squares will be on different cells of the card
  const count = d === 0 ? 3 : d === 1 ? 4 : 5;
  const usedIdx = new Set<number>();
  while (usedIdx.size < count) usedIdx.add(Math.floor(Math.random() * KINDNESS.length));
  const usedList = Array.from(usedIdx);
  const scenarios = usedList.map(ki => ({
    matchingKindnessIdx: ki,
    scenario: SCENARIO_FOR_KINDNESS[ki] || 'Be kind!',
  }));
  // Shuffle scenarios so order is varied
  return { scenarios: shuffled(scenarios) };
}

const SCENARIO_FOR_KINDNESS: Record<number, string> = {
  0: 'Someone forgot their snack',
  1: 'A friend dropped their books',
  2: 'A friend looks sad',
  3: 'A friend is talking about their day',
  4: 'You see a kid alone at recess',
  5: 'A new kid does not know where to sit',
  6: 'Your friend shows their art',
  7: 'Your teacher helps you with something hard',
  8: 'Your team is competing in a game',
  9: 'Someone falls and gets hurt',
  10: 'Two kids want the same toy',
  11: 'Your friend looks sad',
  12: 'A grown-up is carrying a lot of bags',
  13: 'A friend does not have anything to write with',
  14: 'A new kid walks into the classroom',
  15: 'A friend is being mean',
  16: 'You see someone being teased',
  17: 'You want to go first in a game',
  18: 'Two kids are arguing',
  19: 'Your friend asks you to keep a secret',
  20: 'A grown-up asks you to wait',
  21: 'Your sibling is sleeping',
  22: 'You walk in with your hands full',
  23: 'You just made a mess',
  24: 'A friend says something mean',
  25: 'Your friend forgot something at home',
  26: 'You bumped into someone',
  27: 'You notice a friend seems quiet',
  28: 'A grown-up asks you a question',
  29: 'You did not get something right',
  30: 'A friend is taking a long time',
  31: 'Some kids are playing and one is left out',
};

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function ding() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function winChime() {
  try {
    const c = ctx();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.3);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.32);
    });
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    color: colors[i % colors.length], delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color, animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

export default function KindWordBingo({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'win'>('menu');
  const [mode, setMode] = useState<'solo' | 'duo'>('solo');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [size, setSize] = useState(3);
  const [round, setRound] = useState<Round | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [card, setCard] = useState<string[]>([]); // size*size cells of KINDNESS strings
  // Player 1 marks
  const [marks1, setMarks1] = useState<CellMark>({});
  // Player 2 marks (only in duo)
  const [marks2, setMarks2] = useState<CellMark>({});
  // Mini-meta state
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  const findCellIdx = (label: string): number => card.findIndex(k => k === label);

  const startGame = (d: Difficulty, m: 'solo' | 'duo') => {
    setDifficulty(d);
    setSize(d === 0 ? 3 : d === 1 ? 4 : 5);
    setMode(m);
    const r = makeRound(d);
    setRound(r);
    setRoundIdx(0);
    setP1Score(0);
    setP2Score(0);
    setMarks1({});
    setMarks2({});
    // Build a card of size*size unique kindness labels that includes the matching ones
    const needed = new Set(r.scenarios.map(s => s.matchingKindnessIdx));
    const cardIdxSet = new Set(needed);
    while (cardIdxSet.size < size * size) {
      const i = Math.floor(Math.random() * KINDNESS.length);
      if (!cardIdxSet.has(i)) cardIdxSet.add(i);
    }
    setCard(shuffled(Array.from(cardIdxSet)).map(i => KINDNESS[i]));
    setScreen('play');
  };

  // Mark a cell for the active player (solo = always P1; duo = alternating taps)
  const markCell = (cellIdx: number, player: 1 | 2) => {
    if (!round || roundIdx >= round.scenarios.length) return;
    const expected = KINDNESS[round.scenarios[roundIdx].matchingKindnessIdx];
    const expectedCellIdx = findCellIdx(expected);
    if (cellIdx === expectedCellIdx) {
      ding();
      if (player === 1) {
        setMarks1(prev => ({ ...prev, [cellIdx]: true }));
        setP1Score(s => s + 1);
      } else {
        setMarks2(prev => ({ ...prev, [cellIdx]: true }));
        setP2Score(s => s + 1);
      }
      // Advance to next scenario or win
      setTimeout(() => {
        if (roundIdx + 1 >= round.scenarios.length) {
          winChime();
          setScreen('win');
        } else {
          setRoundIdx(i => i + 1);
        }
      }, 800);
    } else {
      // wrong — shake; skip to next scenario
      if (player === 1) setMarks1(prev => ({ ...prev, [cellIdx]: false }));
      if (player === 2) setMarks2(prev => ({ ...prev, [cellIdx]: false }));
      // Just advance the round (no score)
      setTimeout(() => {
        if (roundIdx + 1 >= round.scenarios.length) {
          setScreen('win');
        } else {
          setRoundIdx(i => i + 1);
        }
      }, 700);
    }
  };

  // Check if current player's marks hit a win (row/col/diagonal)
  useEffect(() => {
    if (!round || screen !== 'play') return;
    const checkWin = (marks: CellMark) => {
      // row
      for (let r = 0; r < size; r++) {
        let ok = true;
        for (let c = 0; c < size; c++) if (!marks[r * size + c]) { ok = false; break; }
        if (ok) return true;
      }
      // col
      for (let c = 0; c < size; c++) {
        let ok = true;
        for (let r = 0; r < size; r++) if (!marks[r * size + c]) { ok = false; break; }
        if (ok) return true;
      }
      // diagonal
      let ok = true;
      for (let i = 0; i < size; i++) if (!marks[i * size + i]) { ok = false; break; }
      if (ok) return true;
      ok = true;
      for (let i = 0; i < size; i++) if (!marks[i * size + (size - 1 - i)]) { ok = false; break; }
      return ok;
    };
    if (checkWin(marks1)) {
      winChime();
      setTimeout(() => setScreen('win'), 600);
    } else if (checkWin(marks2)) {
      winChime();
      setTimeout(() => setScreen('win'), 600);
    }
  }, [marks1, marks2, round, size, screen]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>💬</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Kind Word Bingo</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 18px' }}>
          Read the situation. Find the kindness on your card. Mark it. First to a row, column, or diagonal wins!
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          👫 Solo uses one card. 🎲 2-Player shares one card with a friend — pass the iPad.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a mode & size:</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={mode === 'solo' ? 'btn btn-green' : 'btn'} onClick={() => setMode('solo')}
              style={{ flex: 1, fontSize: 14, padding: '10px 14px', opacity: mode === 'solo' ? 1 : 0.7 }}>👫 Solo</button>
            <button className={mode === 'duo' ? 'btn btn-blue' : 'btn'} onClick={() => setMode('duo')}
              style={{ flex: 1, fontSize: 14, padding: '10px 14px', opacity: mode === 'duo' ? 1 : 0.7 }}>🎲 2-Player</button>
          </div>
          <button className="btn btn-green" onClick={() => startGame(0, mode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 3x3 card</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1, mode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 4x4 card</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2, mode)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · 5x5 card</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'win') {
    const winner = mode === 'duo' && p1Score !== p2Score ? (p1Score > p2Score ? 1 : 2) : null;
    return (
      <>
        <Confetti active />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>🎉💬</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
            {mode === 'duo' && winner ? `Player ${winner} wins!` : 'Bingo!'}
          </h1>
          {mode === 'duo' ? (
            <p style={{ fontSize: 20, color: 'var(--text-medium)', marginTop: 8 }}>
              Player 1: <strong>{p1Score}</strong> · Player 2: <strong>{p2Score}</strong>
            </p>
          ) : (
            <p style={{ fontSize: 20, color: 'var(--text-medium)', marginTop: 8 }}>
              You marked <strong>{p1Score}</strong> kindness squares!
            </p>
          )}

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 16, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty, mode)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 New Card</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Menu</button>
            <button className="btn btn-purple" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="kind-word-bingo" activityName="Kind Word Bingo" activityEmoji="💬" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  // PLAY screen
  const currentScenario = round && round.scenarios[roundIdx];
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>💬 Kind Word Bingo</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, color: 'var(--text-medium)', flexWrap: 'wrap', fontSize: 14 }}>
        {mode === 'duo' ? (
          <>
            <span>🟦 P1: <strong style={{ color: 'var(--accent-blue)' }}>{p1Score}</strong></span>
            <span>·</span>
            <span>🟪 P2: <strong style={{ color: 'var(--accent-purple)' }}>{p2Score}</strong></span>
          </>
        ) : (
          <span>Marked: <strong style={{ color: 'var(--accent-pink)' }}>{p1Score}</strong></span>
        )}
        <span>·</span>
        <span>Round <strong>{roundIdx + 1}</strong>/{round?.scenarios.length || 0}</span>
      </div>

      {currentScenario && (
        <div style={{
          background: 'white',
          border: '3px solid var(--accent-purple)',
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 18,
          boxShadow: 'var(--shadow)',
          maxWidth: 560, margin: '0 auto 18px',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-medium)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
            Pick a kindness that fits
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', margin: 0, lineHeight: 1.4 }}>
            {currentScenario.scenario}
          </p>
          {mode === 'duo' && (
            <p style={{ fontSize: 13, color: 'var(--text-medium)', marginTop: 10, fontStyle: 'italic' }}>
              🟦 = Player 1 marks · 🟪 = Player 2 marks · Tap your color on the right square!
            </p>
          )}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: 8,
        maxWidth: 540, margin: '0 auto',
      }}>
        {card.map((label, cellIdx) => {
          const m1 = marks1[cellIdx];
          const m2 = marks2[cellIdx];
          return (
            <button key={cellIdx} onClick={() => markCell(cellIdx, 1)} onContextMenu={(e) => { e.preventDefault(); markCell(cellIdx, 2); }}
              style={{
                position: 'relative',
                aspectRatio: '1',
                background: 'white',
                border: '3px solid #E5E0D8',
                borderRadius: 10,
                padding: 6,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-dark)',
                fontFamily: 'Fredoka, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 3px 0 #C5B5A2',
                lineHeight: 1.2,
              }}>
              {label}
              {m1 && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 14 }}>🟦</span>}
              {m2 && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 14 }}>🟪</span>}
            </button>
          );
        })}
      </div>

      {mode === 'duo' && (
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
          💡 Pass the iPad — each player taps their own square. Long-press for Player 2.
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-medium)' }}>
        Get a row, column, or diagonal marked to win!
      </p>

      {showRating && !rated && (
        <RatingModal activity="kind-word-bingo" activityName="Kind Word Bingo" activityEmoji="💬" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
