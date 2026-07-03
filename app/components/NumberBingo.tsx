'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import RatingModal from './RatingModal';

// Number Bingo — kids get a 5×5 card with random numbers 1–30 and a free
// center space. A caller pulls numbers one at a time; the kid taps matching
// squares on their card to mark them. First to complete a pattern (line, X,
// or full card) wins. Builds number recognition, listening comprehension,
// and short-term memory at the same time. For ages 4-7.

type WinPattern = 'line' | 'X' | 'full';

interface BingoCard {
  // 25 squares: 0..24, center (index 12) is auto-marked (FREE)
  squares: (number | null)[]; // null = free/center
  marked: boolean[];          // length 25
}

const STORAGE_BEST_KEY = 'numberbingo_best';
const STORAGE_RECENT_KEY = 'numberbingo_recent';

const PATTERN_LABELS: Record<WinPattern, string> = {
  line: 'Any Line',
  X:    'Diagonal X',
  full: 'Blackout (Full Card)',
};

const PATTERN_LINES: number[][] = [
  // 12 lines (rows + cols + 2 diagonals)
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
  [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
  [0,6,12,18,24],[4,8,12,16,20],
];

// --- Audio ---
let _ctx: AudioContext | null = null;
function ctxA(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function callPop() {
  try {
    const c = ctxA();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 600;
    g.gain.setValueAtTime(0.14, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function dabSound() {
  try {
    const c = ctxA();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    o.start(c.currentTime); o.stop(c.currentTime + 0.2);
  } catch {}
}
function bingoSound() {
  try {
    const c = ctxA();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.2, c.currentTime + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.09 + 0.3);
      o.start(c.currentTime + i * 0.09); o.stop(c.currentTime + i * 0.09 + 0.32);
    });
  } catch {}
}
function fanfare() {
  try {
    const c = ctxA();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3);
      o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.32);
    });
  } catch {}
}

// Build a 5×5 card with random unique numbers 1..30 (24 of them)
// plus a null FREE center at index 12.
function makeCard(): BingoCard {
  const pool = Array.from({ length: 30 }, (_, i) => i + 1);
  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, 24);
  const squares: (number | null)[] = new Array(25).fill(null);
  // Place 24 numbers into 24 slots, skipping the center
  let pi = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) continue;
    squares[i] = chosen[pi++];
  }
  const marked = new Array(25).fill(false);
  marked[12] = true; // center is always marked (FREE)
  return { squares, marked };
}

// Pick a new call from 1..30 that hasn't been called yet.
function nextCall(called: Set<number>): number | null {
  const remaining: number[] = [];
  for (let n = 1; n <= 30; n++) {
    if (!called.has(n)) remaining.push(n);
  }
  if (remaining.length === 0) return null;
  const idx = Math.floor(Math.random() * remaining.length);
  return remaining[idx];
}

// Check which pattern (if any) the card currently completes. Returns the
// pattern with the smallest number of marks needed (so 'line' wins over X over full).
function checkWin(marked: boolean[], required: WinPattern): boolean {
  if (required === 'full') return marked.every(Boolean);
  if (required === 'X') {
    // both diagonals
    const d1 = [0,6,12,18,24].every(i => marked[i]);
    const d2 = [4,8,12,16,20].every(i => marked[i]);
    return d1 && d2;
  }
  // required === 'line': any one line complete
  return PATTERN_LINES.some(line => line.every(i => marked[i]));
}

// =============================================================================
export default function NumberBingo({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'win'>('menu');
  const [requiredPattern, setRequiredPattern] = useState<WinPattern>('line');
  const [card, setCard] = useState<BingoCard | null>(null);
  const [called, setCalled] = useState<Set<number>>(new Set());
  const [currentCall, setCurrentCall] = useState<number | null>(null);
  const [autoCaller, setAutoCaller] = useState(true);
  const [bingoCount, setBingoCount] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [bestCount, setBestCount] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [bingoFlash, setBingoFlash] = useState(false);
  const [matchedSquares, setMatchedSquares] = useState<Set<number>>(new Set());

  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load best
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEST_KEY);
      if (saved) setBestCount(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // ── MENU ──────────────────────────────────────────────────────────────────
  const startGame = useCallback((pattern: WinPattern) => {
    setRequiredPattern(pattern);
    setCard(makeCard());
    setCalled(new Set());
    setCurrentCall(null);
    setBingoCount(0);
    setRoundsPlayed(0);
    setMatchedSquares(new Set());
    setFeedback(null);
    setScreen('game');
  }, []);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🎯 Number Bingo</h1>
        <p style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24 }}>
          Listen for the called number, then <strong>tap it on your card</strong>! First to fill a line
          (or X, or the whole card) calls <strong>BINGO!</strong>
        </p>

        <p style={{ fontSize: 13, color: 'var(--text-medium)', marginBottom: 8, fontWeight: 700 }}>
          Pick how you want to win:
        </p>
        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto' }}>
          <button className="btn btn-green" onClick={() => startGame('line')} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · Any Line (row, column, or diagonal)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame('X')} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · Diagonal X (both diagonals)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame('full')} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · Blackout (every square)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestCount > 0 && (
          <p style={{ marginTop: 22, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Most BINGOs in a session: <strong>{bestCount}</strong>
          </p>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-medium)' }}>
          Tip: turn on <strong>Auto-caller</strong> to let the game call numbers for you.
        </p>
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────────────
  return (
    <GameBoard
      card={card}
      setCard={setCard}
      called={called}
      setCalled={setCalled}
      currentCall={currentCall}
      setCurrentCall={setCurrentCall}
      autoCaller={autoCaller}
      setAutoCaller={setAutoCaller}
      bingoCount={bingoCount}
      setBingoCount={setBingoCount}
      roundsPlayed={roundsPlayed}
      setRoundsPlayed={setRoundsPlayed}
      bestCount={bestCount}
      setBestCount={setBestCount}
      feedback={feedback}
      setFeedback={setFeedback}
      requiredPattern={requiredPattern}
      bingoFlash={bingoFlash}
      setBingoFlash={setBingoFlash}
      matchedSquares={matchedSquares}
      setMatchedSquares={setMatchedSquares}
      setScreen={setScreen}
      onBack={onBack}
      autoTimerRef={autoTimerRef}
      onWin={() => { setScreen('win'); fanfare(); }}
      showRating={showRating && !rated}
      setShowRating={setShowRating}
      setRated={setRated}
      kidName={kidName}
    />
  );
}

// =============================================================================
interface BoardProps {
  card: BingoCard | null;
  setCard: (c: BingoCard) => void;
  called: Set<number>;
  setCalled: (s: Set<number>) => void;
  currentCall: number | null;
  setCurrentCall: (n: number | null) => void;
  autoCaller: boolean;
  setAutoCaller: (b: boolean) => void;
  bingoCount: number;
  setBingoCount: (n: number | ((n: number) => number)) => void;
  roundsPlayed: number;
  setRoundsPlayed: (n: number | ((n: number) => number)) => void;
  bestCount: number;
  setBestCount: (n: number) => void;
  feedback: { kind: 'good' | 'bad'; text: string } | null;
  setFeedback: (f: { kind: 'good' | 'bad'; text: string } | null) => void;
  requiredPattern: WinPattern;
  bingoFlash: boolean;
  setBingoFlash: (b: boolean) => void;
  matchedSquares: Set<number>;
  setMatchedSquares: React.Dispatch<React.SetStateAction<Set<number>>>;
  setScreen: (s: 'menu' | 'game' | 'win') => void;
  onBack: () => void;
  onWin: () => void;
  autoTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  showRating: boolean;
  setShowRating: (b: boolean) => void;
  setRated: (b: boolean) => void;
  kidName: string;
}

function GameBoard(props: BoardProps) {
  const {
    card, setCard, called, setCalled, currentCall, setCurrentCall,
    autoCaller, setAutoCaller,
    bingoCount, setBingoCount, roundsPlayed, setRoundsPlayed,
    bestCount, setBestCount,
    feedback, setFeedback,
    requiredPattern, bingoFlash, setBingoFlash,
    matchedSquares, setMatchedSquares,
    setScreen, onBack, onWin,
    autoTimerRef,
    showRating, setShowRating, setRated,
  } = props;

  // Perform a single call (manual "Call Next" button or auto-call timer).
  const doCall = useCallback(() => {
    if (called.size >= 30) return; // all numbers called
    const n = nextCall(called);
    if (n === null) return;
    setCurrentCall(n);
    setCalled(new Set([...called, n]));
    callPop();
    // Highlight any matching squares briefly (so the kid sees the call visually too)
    if (card) {
      const hits = new Set<number>();
      card.squares.forEach((v, idx) => {
        if (v === n) hits.add(idx);
      });
      setMatchedSquares(hits);
      setTimeout(() => {
        // Only clear if those are still the current matched (don't clobber a newer call)
        setMatchedSquares(prev => {
          const prevArr = Array.from(prev) as number[];
          const hitArr = Array.from(hits) as number[];
          if (prevArr.length === hitArr.length && prevArr.every(i => hits.has(i))) return new Set<number>();
          return prev;
        });
      }, 1500);
    }
  }, [called, card, setCalled, setCurrentCall, setMatchedSquares]);

  // Auto-caller interval (3-second cadence)
  useEffect(() => {
    if (!autoCaller) return;
    autoTimerRef.current = setInterval(() => {
      doCall();
    }, 3000);
    return () => {
      if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
    };
  }, [autoCaller, doCall, autoTimerRef]);

  // Tap on a square: if it's been called, mark it and check win.
  const tapSquare = (idx: number) => {
    if (!card) return;
    if (card.marked[idx]) return;
    const val = card.squares[idx];
    if (val === null) return; // center is already marked; never reached
    if (!called.has(val)) {
      setFeedback({ kind: 'bad', text: `${val} hasn't been called yet! Wait for the caller.` });
      setTimeout(() => setFeedback(null), 1400);
      return;
    }
    dabSound();
    const newMarked = [...card.marked];
    newMarked[idx] = true;
    const newCard = { ...card, marked: newMarked };
    setCard(newCard);
    if (checkWin(newMarked, requiredPattern)) {
      bingoSound();
      setBingoFlash(true);
      const newCount = (typeof bingoCount === 'number' ? bingoCount : 0) + 1;
      setBingoCount(newCount);
      const newBest = Math.max(bestCount, newCount);
      setBestCount(newBest);
      try { localStorage.setItem(STORAGE_BEST_KEY, String(newBest)); } catch {}
      setFeedback({ kind: 'good', text: `🎯 BINGO! You got a ${PATTERN_LABELS[requiredPattern]}!` });
      // After 2 seconds, generate a new round
      setTimeout(() => {
        setBingoFlash(false);
        setRoundsPlayed(curr => {
          const next = (typeof curr === 'number' ? curr : 0) + 1;
          // Cap at 8 rounds per session; then go to win screen.
          if (next >= 8) onWin();
          else {
            setCard(makeCard());
            setCalled(new Set());
            setCurrentCall(null);
            setMatchedSquares(new Set());
            setFeedback(null);
          }
          return next;
        });
      }, 2200);
    }
  };

  if (!card) return null;

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={() => { setScreen('menu'); }}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 4 }}>🎯 Number Bingo</h1>

      {/* Top stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--text-medium)' }}>
          <span><strong style={{ color: 'var(--accent-purple)' }}>{PATTERN_LABELS[requiredPattern]}</strong></span>
          <span>·</span>
          <span>🎯 BINGOs <strong style={{ color: 'var(--accent-pink)' }}>{bingoCount}</strong></span>
          <span>·</span>
          <span>🏆 Best <strong>{bestCount}</strong></span>
          <span>·</span>
          <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{(typeof roundsPlayed === 'number' ? roundsPlayed : 0) + 1}</strong></span>
        </div>
      </div>

      {/* Caller readout */}
      <div style={{
        background: bingoFlash ? 'var(--accent-pink)' : 'var(--accent-purple)',
        color: 'white',
        padding: '18px 20px',
        borderRadius: 18,
        marginBottom: 14,
        textAlign: 'center',
        boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: 0.8, marginBottom: 4 }}>
          📢 LATEST CALL
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
          {currentCall !== null ? currentCall : '—'}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {called.size}/30 numbers called
        </div>
      </div>

      {/* Caller controls */}
      <div className="canvas-actions">
        <button
          className="btn btn-blue"
          onClick={doCall}
          disabled={called.size >= 30}
          style={{ opacity: called.size >= 30 ? 0.5 : 1 }}
        >
          📢 Call Next
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setAutoCaller(!autoCaller)}
          style={{ opacity: autoCaller ? 1 : 0.85 }}
        >
          {autoCaller ? '⏸ Pause Caller' : '▶ Auto-caller'}
        </button>
      </div>

      {/* Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        marginTop: 18,
        marginBottom: 12,
      }}>
        {card.squares.map((val, i) => {
          const isCenter = i === 12;
          const isMarked = card.marked[i];
          const isMatchedThisCall = matchedSquares.has(i);
          return (
            <button
              key={i}
              onClick={() => tapSquare(i)}
              style={{
                aspectRatio: '1 / 1',
                fontSize: 22,
                fontWeight: 800,
                borderRadius: 12,
                border: '2px solid ' + (isMatchedThisCall ? 'var(--accent-orange)' : '#E5E0D8'),
                background: isCenter ? 'var(--accent-yellow)'
                  : isMarked ? 'var(--accent-green)'
                  : isMatchedThisCall ? '#FFE4D6'
                  : 'white',
                color: isCenter ? 'var(--accent-pink)' : (isMarked ? 'white' : 'var(--text-dark)'),
                cursor: isMarked ? 'default' : 'pointer',
                boxShadow: '0 2px 0 rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Fredoka, sans-serif',
                transition: 'transform 0.1s, background 0.2s, border-color 0.2s',
                transform: isMatchedThisCall ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {isCenter ? '★' : val}
            </button>
          );
        })}
      </div>

      {/* Called-so-far strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center',
        padding: 10, background: '#FAFAFA', borderRadius: 10, marginTop: 6,
        minHeight: 36, maxHeight: 64, overflowY: 'auto',
      }}>
        {Array.from(called).sort((a, b) => a - b).map(n => (
          <span key={n} style={{
            display: 'inline-block', padding: '2px 8px',
            background: n === currentCall ? 'var(--accent-pink)' : 'var(--accent-purple)',
            color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700,
          }}>
            {n}
          </span>
        ))}
      </div>

      {feedback && (
        <div
          style={{
            marginTop: 14, padding: '12px 18px', borderRadius: 14, textAlign: 'center',
            fontWeight: 700, fontSize: 17,
            background: feedback.kind === 'good' ? 'var(--accent-green)' : 'var(--accent-pink)',
            color: 'white', boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            animation: 'pop 0.35s ease',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap a square on your card if it matches the called number. Get a {PATTERN_LABELS[requiredPattern]} to call BINGO!
      </p>

      {showRating && (
        <RatingModal
          activity="number-bingo"
          activityName="Number Bingo"
          activityEmoji="🎯"
          kidName={props.kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
