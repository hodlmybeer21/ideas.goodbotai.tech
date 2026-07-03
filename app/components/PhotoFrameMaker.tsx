'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Photo Frame Maker — kids draw a picture, name it, pick a decorative frame
// style, and save it to a personal gallery. Built on the same canvas engine
// as Magic Canvas; adds persistence (localStorage), naming, and 6 frame styles.
// Directly resolves the high-priority dashboard suggestion
// ("Add a 'Save & Name It' feature to drawing...") and gives Magic Canvas
// a reason to live inside the school campus's Art Studio.

const COLORS = [
  '#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77',
  '#C084FC', '#FF9F43', '#F87171', '#000000',
  '#FFFFFF', '#8B5CF6', '#06B6D4', '#84CC16',
];

// 6 frame styles. Each has a name, emoji, the per-corner + side bg gradient,
// a mat color (behind the photo), and an outer border color. The frame is
// drawn around the canvas in the gallery / save preview.
type FrameId = 'wood' | 'rainbow' | 'gold' | 'sparkle' | 'heart' | 'nature';

interface FrameStyle {
  id: FrameId;
  name: string;
  emoji: string;
  // CSS background applied to the "frame" element surrounding the canvas preview
  border: string; // thick outer border color
  bg: string;     // background fill (the "frame surface")
  mat: string;    // mat color between photo and frame
  // A tiny preview swatch (for the picker)
  swatch: string;
}

const FRAMES: FrameStyle[] = [
  { id: 'wood',    name: 'Classic Wood', emoji: '🪵', border: '#6B3410', bg: 'linear-gradient(135deg, #8B5A2B, #B07A4A)',     mat: '#3E2010', swatch: '#8B5A2B' },
  { id: 'rainbow', name: 'Rainbow',      emoji: '🌈', border: '#FF6B9D', bg: 'linear-gradient(135deg, #FF6B9D, #FFD93D, #6BCBFF, #6BCB77, #C084FC)', mat: '#FFFFFF', swatch: 'linear-gradient(90deg,#FF6B9D,#FFD93D,#6BCBFF,#6BCB77,#C084FC)' },
  { id: 'gold',    name: 'Gold Sparkle', emoji: '✨', border: '#B8860B', bg: 'linear-gradient(135deg, #FFD700, #FFA500)',     mat: '#2D1B00', swatch: '#FFD700' },
  { id: 'sparkle', name: 'Glitter',      emoji: '🎀', border: '#FF1493', bg: 'linear-gradient(135deg, #FF69B4, #DA70D6)',     mat: '#FFFFFF', swatch: '#FF69B4' },
  { id: 'heart',   name: 'Hearts',       emoji: '💖', border: '#C2185B', bg: 'linear-gradient(135deg, #FF6B9D, #FFC1CC)',     mat: '#FFE4EC', swatch: '#FF6B9D' },
  { id: 'nature',  name: 'Garden',       emoji: '🌿', border: '#2E7D32', bg: 'linear-gradient(135deg, #6BCB77, #2E7D32)',     mat: '#F1F8E9', swatch: '#6BCB77' },
];

const BG_COLORS = [
  { id: 'white',   label: 'White',   color: '#FFFFFF' },
  { id: 'cream',   label: 'Cream',   color: '#FFF8E7' },
  { id: 'sky',     label: 'Sky',     color: '#DBF0FF' },
  { id: 'mint',    label: 'Mint',    color: '#DFF5E1' },
  { id: 'pink',    label: 'Pink',    color: '#FFE4EC' },
  { id: 'lemon',   label: 'Lemon',   color: '#FFF6BF' },
];

const STORAGE_KEY = 'photoframemaker_gallery_v1';
const BEST_COUNT_KEY = 'photoframemaker_best_count';

interface SavedDrawing {
  id: string;
  name: string;
  // PNG dataURL of the original drawing (square-ish, 760x500)
  png: string;
  // Frame + bg chosen at save time
  frameId: FrameId;
  bgColor: string;
  // Created at (ms)
  createdAt: number;
}

// --- Audio (synth, no asset deps) ---
let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function saveSound() {
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

// --- Frame renderer: draws a frame + bg + mat around an existing PNG dataURL,
// producing a new "framed" dataURL. Used in save preview and gallery view. ---
async function renderFramedImage(
  pngDataUrl: string,
  frame: FrameStyle,
  bgColor: string,
  name: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const FW = 900; // frame outer width
      const FH = 640; // frame outer height (matches 760x500 + mat + frame)
      const FRAME = 36; // frame thickness on each side
      const MAT = 24;   // mat thickness on each side (inside frame)
      const c = document.createElement('canvas');
      c.width = FW; c.height = FH;
      const cx = c.getContext('2d');
      if (!cx) return reject(new Error('no ctx'));

      // 1) Outer frame background — flat color fallback, gradient if provided
      // (Canvas2D can't easily do CSS gradients, so we paint a flat color
      // approximation based on the frame border color.)
      cx.fillStyle = frame.border;
      cx.fillRect(0, 0, FW, FH);

      // 2) Inner frame surface (use border color tinted slightly lighter for the
      //    frame body — keeps it readable as a frame even without gradients).
      cx.fillStyle = frame.swatch.startsWith('linear') ? frame.border : frame.swatch;
      cx.fillRect(FRAME / 2, FRAME / 2, FW - FRAME, FH - FRAME - 60);

      // 3) Mat
      cx.fillStyle = frame.mat;
      cx.fillRect(FRAME, FRAME, FW - FRAME * 2, FH - FRAME * 2 - 60);

      // 4) Photo (preserve aspect ratio by fitting inside the mat area)
      const photoX = FRAME + MAT;
      const photoY = FRAME + MAT;
      const photoW = FW - (FRAME + MAT) * 2;
      const photoH = FH - (FRAME + MAT) * 2 - 60;
      cx.fillStyle = bgColor;
      cx.fillRect(photoX, photoY, photoW, photoH);

      // Draw the drawing fitted inside (cover behavior)
      const iw = img.width, ih = img.height;
      const scale = Math.max(photoW / iw, photoH / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = photoX + (photoW - dw) / 2;
      const dy = photoY + (photoH - dh) / 2;
      cx.drawImage(img, dx, dy, dw, dh);

      // 5) Name plate at the bottom (inside the frame, like an engraving plate)
      const plateY = FH - 60;
      const plateH = 50;
      cx.fillStyle = frame.mat;
      cx.fillRect(FRAME, plateY, FW - FRAME * 2, plateH);
      cx.fillStyle = frame.border;
      cx.font = 'bold 24px Fredoka, sans-serif';
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(name || 'Untitled', FW / 2, plateY + plateH / 2);

      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('img load failed'));
    img.src = pngDataUrl;
  });
}

// =========================================================================
//                            MAIN COMPONENT
// =========================================================================
export default function PhotoFrameMaker({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'draw' | 'gallery' | 'win'>('menu');
  const [gallery, setGallery] = useState<SavedDrawing[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  // Load gallery from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setGallery(parsed);
      }
    } catch {}
  }, []);

  // Persist gallery on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery));
      // Track best count for the menu display
      const prev = parseInt(localStorage.getItem(BEST_COUNT_KEY) || '0', 10) || 0;
      if (gallery.length > prev) localStorage.setItem(BEST_COUNT_KEY, String(gallery.length));
    } catch {}
  }, [gallery]);

  // ── MENU ──────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🖼️ Photo Frame Maker</h1>
        <p style={{ color: 'var(--text-medium)', fontSize: 16, marginBottom: 24 }}>
          Draw a picture, give it a name, pick a fancy frame, and save it to your own gallery!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => setScreen('draw')}
            style={{ fontSize: 19, padding: '18px 22px' }}
          >
            🎨 Make a New Drawing
          </button>
          <button
            className="btn btn-blue"
            onClick={() => setScreen('gallery')}
            style={{ fontSize: 19, padding: '18px 22px' }}
          >
            🖼️ Open My Gallery ({gallery.length})
          </button>
        </div>

        {gallery.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text-medium)', marginBottom: 10 }}>
              🏆 Pictures saved: <strong>{gallery.length}</strong>
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 10,
              maxWidth: 560,
              margin: '0 auto',
            }}>
              {gallery.slice(0, 6).map(d => (
                <div key={d.id} style={{
                  background: 'white', borderRadius: 10, padding: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                }}>
                  <img
                    src={d.png}
                    alt={d.name}
                    style={{
                      width: '100%', height: 70, objectFit: 'cover',
                      borderRadius: 6, background: '#fafafa',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-medium)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ marginTop: 28, fontSize: 13, color: 'var(--text-medium)' }}>
          Six frame styles to choose from: 🪵 🌈 ✨ 🎀 💖 🌿
        </p>
      </div>
    );
  }

  // ── GALLERY ───────────────────────────────────────────────────────────
  if (screen === 'gallery') {
    return (
      <GalleryScreen
        gallery={gallery}
        onBack={() => setScreen('menu')}
        onDelete={(id) => setGallery(g => g.filter(d => d.id !== id))}
        onNew={() => setScreen('draw')}
        kidName={kidName}
        onShowRating={() => setShowRating(true)}
      />
    );
  }

  // ── DRAW + SAVE FLOW ──────────────────────────────────────────────────
  if (screen === 'draw') {
    return (
      <DrawAndSave
        onBack={() => setScreen('menu')}
        onSaved={() => {
          setScreen('win');
          fanfare();
        }}
        kidName={kidName}
        onShowRating={() => setShowRating(true)}
        rated={rated}
        setRated={setRated}
        onGalleryUpdate={setGallery}
        gallery={gallery}
      />
    );
  }

  // ── WIN (after first save) ────────────────────────────────────────────
  if (screen === 'win') {
    return (
      <>
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={() => setScreen('menu')} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 32 }}>🖼️🌟</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>
            Saved to your gallery!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Your gallery now has <strong>{gallery.length}</strong> picture{gallery.length === 1 ? '' : 's'}.
          </p>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 24, fontSize: 18, padding: '16px 32px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => setScreen('draw')} style={{ fontSize: 16, padding: '14px 24px' }}>
              🎨 Make Another
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('gallery')} style={{ fontSize: 16, padding: '14px 24px' }}>
              🖼️ Open Gallery
            </button>
            <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="photo-frame-maker"
            activityName="Photo Frame Maker"
            activityEmoji="🖼️"
            kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  return null;
}

// =========================================================================
//                          DRAWING + SAVE
// =========================================================================
interface DrawProps {
  onBack: () => void;
  onSaved: () => void;
  kidName: string;
  onShowRating: () => void;
  rated: boolean;
  setRated: (b: boolean) => void;
  onGalleryUpdate: (g: SavedDrawing[]) => void;
  gallery: SavedDrawing[];
}

function DrawAndSave({ onBack, onSaved, kidName, rated, setRated, onGalleryUpdate, gallery }: DrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF6B9D');
  const [brushSize, setBrushSize] = useState(8);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveFrame, setSaveFrame] = useState<FrameId>('wood');
  const [saveBg, setSaveBg] = useState<string>('#FFFFFF');
  const [saveError, setSaveError] = useState<string>('');
  // The raw drawing dataURL captured when the modal opens. Stays constant
  // for the lifetime of the modal so the live preview re-renders the SAME
  // raw drawing each time the kid picks a different frame/bg/name (without
  // compounding frames).
  const rawDrawingRef = useRef<string | null>(null);
  const [previewPng, setPreviewPng] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    } else if (historyIndex === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistoryIndex(-1);
    }
  };

  const clearCanvas = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear the canvas? You\'ll lose your drawing.')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Initialize canvas with white bg + first history snapshot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  // Open the save modal and capture the raw drawing for re-framing.
  const openSaveModal = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const png = canvas.toDataURL('image/png');
    rawDrawingRef.current = png;
    setShowSaveModal(true);
    setPreviewPng(png); // shown while the first framed render is in flight
    setSaveName('');
    setSaveError('');
  };

  // Render a fresh "framed" preview from the RAW drawing whenever name/frame/bg changes.
  // (Reading from rawDrawingRef ensures we don't compound frames on subsequent edits.)
  useEffect(() => {
    if (!showSaveModal) return;
    const raw = rawDrawingRef.current;
    if (!raw) return;
    let cancelled = false;
    setPreviewLoading(true);
    const frame = FRAMES.find(f => f.id === saveFrame) || FRAMES[0];
    renderFramedImage(raw, frame, saveBg, saveName || 'Untitled')
      .then(framed => { if (!cancelled) { setPreviewPng(framed); setPreviewLoading(false); } })
      .catch(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [saveFrame, saveBg, saveName, showSaveModal]);

  // Actually save into the gallery — re-renders the framed version with the
  // final name using the LIVE canvas (not the possibly-re-framed previewPng),
  // so the gallery stores the correctly-framed image, not a stale one.
  const handleSave = async () => {
    setSaveError('');
    if (!saveName.trim()) {
      setSaveError('Please give your picture a name!');
      return;
    }
    if (saveName.trim().length > 30) {
      setSaveError('Name too long — try 30 letters or less.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawPng = canvas.toDataURL('image/png');
    const frame = FRAMES.find(f => f.id === saveFrame) || FRAMES[0];
    try {
      const framedPng = await renderFramedImage(rawPng, frame, saveBg, saveName.trim());
      const newDrawing: SavedDrawing = {
        id: `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: saveName.trim(),
        png: framedPng,
        frameId: saveFrame,
        bgColor: saveBg,
        createdAt: Date.now(),
      };
      onGalleryUpdate([newDrawing, ...gallery]);
      saveSound();
      setShowSaveModal(false);
      onSaved();
    } catch {
      setSaveError('Could not save. Please try again.');
    }
  };

  return (
    <div className="canvas-page slide-up">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title">🎨 Make a Picture</h1>

      <div className="canvas-toolbar">
        {COLORS.map(c => (
          <button
            key={c}
            className={`color-dot ${color === c ? 'selected' : ''}`}
            style={{ background: c, outline: c === '#FFFFFF' ? '2px solid #ddd' : 'none' }}
            onClick={() => setColor(c)}
          />
        ))}

        <div className="brush-size">
          <span style={{ fontSize: 14 }}>🖌</span>
          <input
            type="range"
            min={2}
            max={40}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
          />
          <span style={{ fontSize: 14, minWidth: 24 }}>{brushSize}</span>
        </div>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={760}
          height={500}
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

      <div className="canvas-actions">
        <button className="btn btn-secondary" onClick={undo}>↩ Undo</button>
        <button className="btn btn-orange" onClick={clearCanvas}>🗑 Clear</button>
        <button className="btn btn-primary" onClick={openSaveModal}>🖼️ Save to Gallery</button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        When you love your picture, tap <strong>Save to Gallery</strong> to name it and pick a frame!
      </p>

      {gallery.length > 0 && gallery.length % 3 === 0 && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button onClick={() => setShowRating(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
            ⭐ Rate Photo Frame Maker
          </button>
        </div>
      )}

      {showSaveModal && (
        <SaveModal
          saveName={saveName}
          setSaveName={setSaveName}
          saveFrame={saveFrame}
          setSaveFrame={setSaveFrame}
          saveBg={saveBg}
          setSaveBg={setSaveBg}
          previewPng={previewPng}
          previewLoading={previewLoading}
          error={saveError}
          onSave={handleSave}
          onCancel={() => setShowSaveModal(false)}
        />
      )}

      {showRating && !rated && (
        <RatingModal
          activity="photo-frame-maker"
          activityName="Photo Frame Maker"
          activityEmoji="🖼️"
          kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}

// =========================================================================
//                              SAVE MODAL
// =========================================================================
function SaveModal(props: {
  saveName: string;
  setSaveName: (s: string) => void;
  saveFrame: FrameId;
  setSaveFrame: (f: FrameId) => void;
  saveBg: string;
  setSaveBg: (s: string) => void;
  previewPng: string | null;
  previewLoading: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const {
    saveName, setSaveName, saveFrame, setSaveFrame, saveBg, setSaveBg,
    previewPng, previewLoading, error, onSave, onCancel,
  } = props;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16, overflowY: 'auto',
    }}>
      <div style={{
        background: 'white', borderRadius: 22, padding: 24, maxWidth: 720, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '95vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-pink)', margin: 0, marginBottom: 4 }}>
          🖼️ Save to Gallery
        </h2>
        <p style={{ color: 'var(--text-medium)', fontSize: 14, margin: 0, marginBottom: 18 }}>
          Name your picture and pick a frame style!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
          {/* Left: live preview of the framed picture */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-medium)', marginBottom: 6 }}>Preview</p>
            <div style={{
              border: '2px dashed #E5E0D8',
              borderRadius: 14,
              padding: 14,
              background: '#FAFAFA',
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {previewPng ? (
                <img
                  src={previewPng}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 280,
                    borderRadius: 8,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'opacity 0.2s',
                    opacity: previewLoading ? 0.55 : 1,
                  }}
                />
              ) : (
                <p style={{ color: 'var(--text-medium)', fontSize: 13 }}>Loading…</p>
              )}
            </div>
          </div>

          {/* Right: name + frame + bg controls */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-medium)', display: 'block', marginBottom: 6 }}>
              ✏️ Name your picture
            </label>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value.slice(0, 30))}
              placeholder="e.g. My Puppy, Rainbow House..."
              maxLength={30}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 16,
                borderRadius: 10,
                border: '2px solid #E5E0D8',
                outline: 'none',
                fontFamily: 'Fredoka, sans-serif',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-medium)', marginTop: 4, marginBottom: 16 }}>
              {saveName.length}/30 characters
            </p>

            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-medium)', display: 'block', marginBottom: 6 }}>
              🪵 Frame style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {FRAMES.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSaveFrame(f.id)}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: saveFrame === f.id ? '3px solid var(--accent-pink)' : '2px solid #E5E0D8',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'transform 0.1s',
                    transform: saveFrame === f.id ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <div style={{
                    height: 24,
                    background: f.swatch,
                    borderRadius: 4,
                    marginBottom: 4,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--text-medium)', lineHeight: 1.2 }}>
                    {f.emoji} {f.name}
                  </div>
                </button>
              ))}
            </div>

            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-medium)', display: 'block', marginBottom: 6 }}>
              🎨 Background
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {BG_COLORS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSaveBg(b.color)}
                  title={b.label}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 8,
                    background: b.color,
                    border: saveBg === b.color ? '3px solid var(--accent-pink)' : '2px solid #E5E0D8',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: 'var(--accent-pink)', fontSize: 13, fontWeight: 600, marginTop: 4, marginBottom: 8 }}>
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ fontSize: 16, padding: '12px 22px' }}
          >
            ← Keep Drawing
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            style={{ fontSize: 16, padding: '12px 22px' }}
          >
            💾 Save!
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
//                              GALLERY SCREEN
// =========================================================================
interface GalleryProps {
  gallery: SavedDrawing[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  kidName: string;
  onShowRating: () => void;
}

function GalleryScreen({ gallery, onBack, onDelete, onNew, kidName, onShowRating }: GalleryProps) {
  const [viewItem, setViewItem] = useState<SavedDrawing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  if (gallery.length === 0) {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🖼️ My Gallery</h1>
        <div style={{ fontSize: 80, marginTop: 24 }}>🎨</div>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 12 }}>
          Your gallery is empty — go make your first framed picture!
        </p>
        <button
          className="btn btn-primary"
          onClick={onNew}
          style={{ fontSize: 18, padding: '16px 28px', marginTop: 20 }}
        >
          🎨 Make a Drawing
        </button>
      </div>
    );
  }

  return (
    <div className="canvas-page slide-up">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title">🖼️ My Gallery</h1>
      <p style={{ color: 'var(--text-medium)', fontSize: 14, marginBottom: 18 }}>
        {gallery.length} picture{gallery.length === 1 ? '' : 's'} saved · tap one to view it bigger
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 14,
      }}>
        {gallery.map(d => (
          <div key={d.id} style={{
            background: 'white',
            borderRadius: 14,
            padding: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            textAlign: 'center',
            position: 'relative',
          }}>
            <button
              onClick={() => setViewItem(d)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '100%',
              }}
              aria-label={`View ${d.name}`}
            >
              <img
                src={d.png}
                alt={d.name}
                style={{
                  width: '100%',
                  height: 130,
                  objectFit: 'cover',
                  borderRadius: 8,
                  background: '#fafafa',
                  display: 'block',
                }}
              />
              <p style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-medium)',
                marginTop: 6,
                marginBottom: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {d.name}
              </p>
            </button>
            <button
              onClick={() => setConfirmDelete(d.id)}
              aria-label={`Delete ${d.name}`}
              style={{
                position: 'absolute',
                top: 4, right: 4,
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: 26, height: 26,
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--accent-pink)',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={onNew}
          style={{ fontSize: 16, padding: '14px 22px' }}
        >
          ➕ Make Another
        </button>
        {gallery.length >= 3 && !rated && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowRating(true)}
            style={{ fontSize: 16, padding: '14px 22px' }}
          >
            ⭐ Rate this game
          </button>
        )}
      </div>

      {/* View-large modal */}
      {viewItem && (
        <div
          onClick={() => setViewItem(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16, cursor: 'pointer',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh', textAlign: 'center', cursor: 'default' }}>
            <img
              src={viewItem.png}
              alt={viewItem.name}
              style={{
                maxWidth: '95vw', maxHeight: '80vh',
                borderRadius: 10,
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                background: 'white',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = viewItem.png;
                  a.download = `${viewItem.name.replace(/[^a-z0-9_-]+/gi, '_') || 'drawing'}.png`;
                  a.click();
                }}
                style={{ fontSize: 15, padding: '10px 18px' }}
              >
                ⬇️ Download
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setViewItem(null)}
                style={{ fontSize: 15, padding: '10px 18px' }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm-delete modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 18, padding: 22, maxWidth: 360, width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 0 }}>
              Delete this picture?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-medium)', margin: '8px 0 16px' }}>
              You can't get it back once it's gone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(null)}
                style={{ fontSize: 14, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-orange"
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                style={{ fontSize: 14, padding: '10px 18px' }}
              >
                🗑 Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="photo-frame-maker"
          activityName="Photo Frame Maker"
          activityEmoji="🖼️"
          kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}