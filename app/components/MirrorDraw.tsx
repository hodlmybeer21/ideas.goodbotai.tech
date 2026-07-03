'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Mirror Draw — kids draw on the LEFT half of the canvas and every stroke is
// instantly mirrored onto the RIGHT half (vertical axis of symmetry between
// them). Builds spatial reasoning + bilateral symmetry awareness for ages 4-7.
//
// 3 modes:
//  1) Free Mirror      — pure free draw, just enjoy the symmetric reflection.
//  2) Trace the Shape  — a faded outline sits on the right side; mirror left
//                        strokes to fill it in. Score ≥ 70 = match!
//  3) Connect-the-Dots — numbered dots on the right; mirror strokes from the
//                        left to connect them in order.

type Mode = 'free' | 'trace' | 'dots';

const COLORS = [
  '#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77',
  '#C084FC', '#FF9F43', '#F87171', '#000000',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F472B6',
];

const STORAGE_BEST_KEY = 'mirrordraw_best_score';

const CANVAS_W = 760;
const CANVAS_H = 480;
const AXIS_X = CANVAS_W / 2;

// Mirrors an x in canvas pixel space across the vertical axis.
function mirrorX(x: number) { return AXIS_X * 2 - x; }

// --- Audio ---
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function tick() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    o.start(c.currentTime); o.stop(c.currentTime + 0.05);
  } catch {}
}
function matchSound() {
  try {
    const c = ctx();
    [523, 659, 784].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.22);
      o.start(c.currentTime + i * 0.06); o.stop(c.currentTime + i * 0.06 + 0.24);
    });
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
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

// --- Shape & dot-set generators for guided modes ---
type Pt = { x: number; y: number };

// Returns a sampled list of points along a parametric shape on the RIGHT side.
// The kid's left-side mirror will paint over this area.
function sampleShape(level: number): Pt[] {
  const cx = AXIS_X, cy = CANVAS_H / 2;
  const pts: Pt[] = [];
  if (level === 0) {
    // Circle
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * Math.PI * 2;
      pts.push({ x: cx + 140 * Math.cos(t), y: cy + 140 * Math.sin(t) });
    }
  } else if (level === 1) {
    // Heart
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push({ x: cx + hx * 8, y: cy + hy * 8 });
    }
  } else {
    // Star (5-point)
    const spikes = 5;
    const outer = 150, inner = 70;
    for (let i = 0; i <= spikes * 2; i++) {
      const t = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? outer : inner;
      pts.push({ x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t) });
    }
  }
  return pts;
}

function sampleDots(level: number): Pt[] {
  const cx = AXIS_X, cy = CANVAS_H / 2;
  const sets: Pt[][] = [
    // Easy: pentagon
    Array.from({ length: 5 }, (_, i) => {
      const t = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      return { x: cx + 150 * Math.cos(t), y: cy + 150 * Math.sin(t) };
    }),
    // Medium: house-ish
    [
      { x: cx + 0,    y: cy - 150 },
      { x: cx + 140,  y: cy - 50 },
      { x: cx + 110,  y: cy + 110 },
      { x: cx - 110,  y: cy + 110 },
      { x: cx - 140,  y: cy - 50 },
    ],
    // Hard: zigzag
    [
      { x: cx - 30,   y: cy - 140 },
      { x: cx + 140,  y: cy - 70 },
      { x: cx + 90,   y: cy + 100 },
      { x: cx - 60,   y: cy + 130 },
      { x: cx - 150,  y: cy + 30 },
    ],
  ];
  return sets[Math.min(2, Math.max(0, level))];
}

// Computes how much of the guide's right-side path is painted over by the kid's
// mirror output. Returns 0..100.
function computeSymmetryScore(
  canvas: HTMLCanvasElement,
  targetPointsRight: Pt[],
): number {
  const cx = canvas.getContext('2d');
  if (!cx) return 0;
  const data = cx.getImageData(0, 0, canvas.width, canvas.height);
  const W = canvas.width;
  let matchedPixels = 0;
  for (let i = 0; i < targetPointsRight.length; i++) {
    const { x, y } = targetPointsRight[i];
    let paintedNearTarget = false;
    const radius = 18;
    for (let dx = -radius; dx <= radius && !paintedNearTarget; dx += 3) {
      for (let dy = -radius; dy <= radius && !paintedNearTarget; dy += 3) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px < 0 || py < 0 || px >= W || py >= canvas.height) continue;
        const idx = (py * W + px) * 4;
        const r = data.data[idx], g = data.data[idx + 1], b = data.data[idx + 2];
        if (r < 240 || g < 240 || b < 240) paintedNearTarget = true;
      }
    }
    if (paintedNearTarget) matchedPixels += 1;
  }
  if (targetPointsRight.length === 0) return 0;
  return Math.round((matchedPixels / targetPointsRight.length) * 100);
}

// =============================================================================
export default function MirrorDraw({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<'menu' | 'game' | 'win'>('menu');
  const [mode, setMode] = useState<Mode>('free');
  const [level, setLevel] = useState(1);
  const [color, setColor] = useState('#FF6B9D');
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [matched, setMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [roundsDone, setRoundsDone] = useState(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Reference path for guided modes (in CANVAS pixel space, on the right half)
  const guidePointsRef = useRef<Pt[]>([]);
  // Track the previous pointer position so we can draw a continuous line
  // segment on each move-event (both the kid's left side AND the mirrored right).
  const prevPosRef = useRef<Pt | null>(null);

  // Load best score from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEST_KEY);
      if (saved) setBestScore(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((m: Mode, lvl: number) => {
    setMode(m);
    setLevel(lvl);
    setMatched(false);
    setScore(0);
    setRoundsDone(0);
    setScreen('game');
  }, []);

  const nextRound = useCallback(() => {
    setMatched(false);
    setScore(0);
    setRoundsDone(n => n + 1);
  }, []);

  // ── MENU ─────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🪞 Mirror Draw</h1>
        <p style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24 }}>
          Draw on the <strong>left</strong> side — your strokes appear <strong>mirrored on the right!</strong>
          Build symmetric butterflies, hearts, stars, and more.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto' }}>
          <button className="btn btn-primary" onClick={() => startGame('free', 0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            🎨 Free Mirror — just draw anything and watch it mirror!
          </button>
          <button className="btn btn-blue" onClick={() => startGame('trace', 1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            ✨ Trace the Shape — fill in the outline by mirroring
          </button>
          <button className="btn btn-purple" onClick={() => startGame('dots', 1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            🔢 Connect-the-Dots — make symmetric dots-to-dot shapes
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 22, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best symmetry score: <strong>{bestScore}/100</strong>
          </p>
        )}
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-medium)' }}>
          Touch and drag on the canvas. The vertical dashed line is your mirror axis.
        </p>
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────────────
  return (
    <GameBoard
      mode={mode}
      level={level}
      setLevel={setLevel}
      color={color}
      setColor={setColor}
      brushSize={brushSize}
      setBrushSize={setBrushSize}
      canvasRef={canvasRef}
      isDrawing={isDrawing}
      setIsDrawing={setIsDrawing}
      matched={matched}
      setMatched={setMatched}
      score={score}
      setScore={setScore}
      roundsDone={roundsDone}
      setRoundsDone={setRoundsDone}
      feedback={feedback}
      setFeedback={setFeedback}
      bestScore={bestScore}
      setBestScore={setBestScore}
      guidePointsRef={guidePointsRef}
      prevPosRef={prevPosRef}
      nextRound={nextRound}
      onScreen={setScreen}
      onBack={onBack}
      showRating={showRating && !rated}
      setShowRating={setShowRating}
      setRated={setRated}
      kidName={kidName}
      onWin={() => { setScreen('win'); fanfare(); }}
    />
  );
}

// =============================================================================
interface BoardProps {
  mode: Mode;
  level: number;
  setLevel: (n: number | ((n: number) => number)) => void;
  color: string;
  setColor: (s: string) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isDrawing: boolean;
  setIsDrawing: (b: boolean) => void;
  matched: boolean;
  setMatched: (b: boolean) => void;
  score: number;
  setScore: (n: number | ((n: number) => number)) => void;
  roundsDone: number;
  setRoundsDone: (n: number | ((n: number) => number)) => void;
  feedback: { kind: 'good' | 'bad'; text: string } | null;
  setFeedback: (f: { kind: 'good' | 'bad'; text: string } | null) => void;
  bestScore: number;
  setBestScore: (n: number) => void;
  guidePointsRef: React.MutableRefObject<Pt[]>;
  prevPosRef: React.MutableRefObject<Pt | null>;
  nextRound: () => void;
  onScreen: (s: 'menu' | 'game' | 'win') => void;
  onBack: () => void;
  onWin: () => void;
  showRating: boolean;
  setShowRating: (b: boolean) => void;
  setRated: (b: boolean) => void;
  kidName: string;
}

function GameBoard(props: BoardProps) {
  const {
    mode, level, setLevel, color, setColor, brushSize, setBrushSize,
    canvasRef, isDrawing, setIsDrawing,
    matched, setMatched,
    score, setScore, roundsDone, setRoundsDone,
    feedback, setFeedback,
    bestScore, setBestScore,
    guidePointsRef, prevPosRef, nextRound,
    onScreen, onBack, onWin,
    showRating, setShowRating, setRated,
  } = props;

  // Clear canvas and optionally redraw the guide outline/dots on the right half.
  // Always paints the vertical mirror axis (dashed) so the kid can see it.
  const repaintCanvas = useCallback((withGuide: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mirror axis — vertical dashed pink line down the middle
    ctx.save();
    ctx.strokeStyle = '#FFB3D1';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(AXIS_X, 0);
    ctx.lineTo(AXIS_X, CANVAS_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tiny "MIRROR" label at top of axis
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪞 MIRROR', AXIS_X, 16);
    ctx.restore();

    if (!withGuide) return;

    const pts = guidePointsRef.current;
    if (pts.length === 0) return;
    ctx.save();
    if (mode === 'trace') {
      ctx.strokeStyle = '#D6D0C5';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    } else if (mode === 'dots') {
      ctx.font = 'bold 26px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#94A3B8';
      ctx.strokeStyle = '#BFC5CD';
      ctx.lineWidth = 4;
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(String(i + 1), p.x, p.y);
      });
    }
    ctx.restore();
  }, [canvasRef, guidePointsRef, mode]);

  // On mode/level change, regenerate guide points + repaint.
  useEffect(() => {
    if (mode === 'trace') {
      guidePointsRef.current = sampleShape(level);
    } else if (mode === 'dots') {
      guidePointsRef.current = sampleDots(level);
    } else {
      guidePointsRef.current = [];
    }
    prevPosRef.current = null;
    repaintCanvas(true);
  }, [mode, level, repaintCanvas, guidePointsRef, prevPosRef]);

  // ── POINTER HANDLERS ──────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: (e.touches[0].clientX - rect.left) * sx,
        y: (e.touches[0].clientY - rect.top) * sy,
      };
    }
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    // Lock to LEFT half only
    if (p.x > AXIS_X) { prevPosRef.current = null; return; }
    setIsDrawing(true);
    prevPosRef.current = p;
    // Paint a single starting dot on each side so the stroke has a clean origin
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mirrorX(p.x), p.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const p = getPos(e);
    if (!p) return;
    if (p.x > AXIS_X) return; // ignore right-side cursor (the mirror is rendered automatically)
    const prev = prevPosRef.current;
    prevPosRef.current = p;
    if (!prev) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left-side segment: prev → p
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // Right-side mirror segment: mirrorX(prev) → mirrorX(p)
    const mPrev = { x: mirrorX(prev.x), y: prev.y };
    const mP    = { x: mirrorX(p.x),    y: p.y };
    ctx.beginPath();
    ctx.moveTo(mPrev.x, mPrev.y);
    ctx.lineTo(mP.x, mP.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    prevPosRef.current = null;
    tick();
    if (mode === 'trace' || mode === 'dots') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pts = guidePointsRef.current;
      if (pts.length === 0) return;
      // Wait one rAF so the latest ink is on the bitmap before sampling.
      requestAnimationFrame(() => {
        if (!canvasRef.current) return;
        const s = computeSymmetryScore(canvasRef.current, pts);
        setScore(s);
        if (s >= 70 && !matched) {
          matchSound();
          setMatched(true);
          setFeedback({ kind: 'good', text: `🎯 Great symmetry! ${s}/100 — kept mirror in step!` });
          const newBest = Math.max(bestScore, s);
          setBestScore(newBest);
          try { localStorage.setItem(STORAGE_BEST_KEY, String(newBest)); } catch {}
          setTimeout(() => {
            setRoundsDone(curr => {
              const next = (typeof curr === 'function' ? (curr as any)() : curr) + 1;
              if (next >= 5) onWin();
              else nextRound();
              return next;
            });
            setFeedback(null);
          }, 1500);
        }
      });
    }
  };

  // ── ACTION BUTTONS ────────────────────────────────────────────────────────
  const totalRounds = 5;
  const modeLabel = mode === 'free' ? 'Free Mirror' : mode === 'trace' ? 'Trace the Shape' : 'Connect-the-Dots';
  const roundsValue = typeof roundsDone === 'number' ? roundsDone + 1 : 1;

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 900 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 4 }}>🪞 Mirror Draw</h1>

      {/* Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 14, color: 'var(--text-medium)' }}>
          <span>🪞 <strong style={{ color: 'var(--accent-purple)' }}>{modeLabel}</strong></span>
          {mode !== 'free' && <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>}
          {mode !== 'free' && <span>·</span>}
          {mode !== 'free' && <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{roundsValue}</strong>/{totalRounds}</span>}
          <span>·</span>
          <span>🏆 <strong>{bestScore}</strong></span>
        </div>
      </div>

      {/* Prompt banner */}
      <div style={{
        background: 'var(--accent-purple)', color: 'white', padding: '12px 18px',
        borderRadius: 14, fontWeight: 700, fontSize: 16, textAlign: 'center',
        boxShadow: '0 4px 0 rgba(0,0,0,0.08)', marginBottom: 14,
      }}>
        {mode === 'free'
          ? 'Draw on the left — see it mirror onto the right!'
          : 'Mirror each stroke from left to right. Score ≥ 70 to win the round.'}
      </div>

      {/* Toolbar */}
      <div className="canvas-toolbar">
        {COLORS.map(c => (
          <button
            key={c}
            className={`color-dot ${color === c ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
        <div className="brush-size">
          <span style={{ fontSize: 14 }}>🖌</span>
          <input
            type="range" min={2} max={40} value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
          />
          <span style={{ fontSize: 14, minWidth: 24 }}>{brushSize}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="drawing-canvas"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Mode-specific controls */}
      <div className="canvas-actions">
        {(mode === 'trace' || mode === 'dots') && (
          <>
            <button className="btn btn-blue" onClick={() => setLevel(l => Math.max(0, l - 1))} disabled={level === 0} style={{ opacity: level === 0 ? 0.4 : 1 }}>← Easier</button>
            <button className="btn btn-blue" onClick={() => setLevel(l => Math.min(2, l + 1))} disabled={level === 2} style={{ opacity: level === 2 ? 0.4 : 1 }}>Harder →</button>
          </>
        )}
        <button className="btn btn-orange" onClick={() => repaintCanvas(true)}>🗑 Clear</button>
        {mode !== 'free' && (
          <button className="btn btn-primary" onClick={() => { repaintCanvas(true); setScore(0); setMatched(false); }}>⏭ New Shape</button>
        )}
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-medium)' }}>
        {mode === 'free' && 'Touch the LEFT half and drag. The mirror follows every move.'}
        {mode === 'trace' && 'Trace inside the gray outline on the right by drawing on the left.'}
        {mode === 'dots' && 'Connect dots 1 → 2 → 3 → 4 → 5 by drawing on the left.'}
      </p>

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

      {showRating && (
        <RatingModal
          activity="mirror-draw"
          activityName="Mirror Draw"
          activityEmoji="🪞"
          kidName={props.kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
