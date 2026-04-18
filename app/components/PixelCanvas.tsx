'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type GridSize = 8 | 12 | 16 | 20;
type PaletteId = 'rainbow' | 'nature' | 'ocean' | 'warm';
type TemplateId = 'blank' | 'heart' | 'star' | 'rocket' | 'house' | 'tree' | 'smile' | 'fish' | 'butterfly';

interface Palette { name: string; colors: string[]; }
interface Template { id: TemplateId; name: string; cells: (size: number) => Set<string>; }

const PALETTES: Record<PaletteId, Palette> = {
  rainbow: { name: '🌈 Rainbow', colors: ['#FF0000','#FF8C00','#FFD700','#32CD32','#1E90FF','#8B00FF','#FF69B4','#FFFFFF','#111111'] },
  nature:  { name: '🌿 Nature',  colors: ['#1B5E20','#4CAF50','#87CEEB','#8B4513','#D2B48C','#FFFFFF','#111111'] },
  ocean:   { name: '🌊 Ocean',   colors: ['#0D47A1','#1976D2','#64B5F6','#00838F','#FFFFFF','#F5DEB3','#1B5E20','#8B00FF'] },
  warm:    { name: '🔥 Warm',    colors: ['#FF0000','#FF8C00','#FFD700','#FF69B4','#8B00FF','#FFFFFF','#111111'] },
};
const PALETTE_ORDER: PaletteId[] = ['rainbow','nature','ocean','warm'];

// Scale 16×16 coords to target size using floor
function sc(r: number, c: number, sz: number): string {
  return `${Math.floor((r / 16) * sz)},${Math.floor((c / 16) * sz)}`;
}
function buildSet(pairs: [number, number][], sz: number): Set<string> {
  return new Set(pairs.map(([r, c]) => sc(r, c, sz)));
}

// ── Templates ────────────────────────────────────────────────────────────────
const heartCells = (sz: number): Set<string> => buildSet([
  [1,4],[1,5],[1,6],[1,7],[1,8],[1,9],[1,10],[1,11],
  [2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],[2,12],[2,13],
  [3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],[3,13],[3,14],
  [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],[4,14],[4,15],
  [5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],[5,15],
  [6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],
  [8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],
  [9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],
  [10,5],[10,6],[10,7],[10,8],[10,9],[10,10],
  [11,6],[11,7],[11,8],[11,9],
  [12,7],[12,8],
  [13,7],[13,8],
], sz);

const starCells = (sz: number): Set<string> => buildSet([
  [1,7],[1,8],
  [2,5],[2,6],[2,7],[2,8],[2,9],
  [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],
  [4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],
  [5,2],[5,3],[5,4],[5,11],[5,12],[5,13],
  [6,1],[6,2],[6,13],[6,14],
  [7,0],[7,1],[7,14],[7,15],
  [8,6],[8,7],[8,8],[8,9],
  [9,0],[9,1],[9,14],[9,15],
  [10,1],[10,2],[10,13],[10,14],
  [11,2],[11,3],[11,4],[11,11],[11,12],[11,13],
  [12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
  [13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],
  [14,5],[14,6],[14,7],[14,8],[14,9],[14,10],
  [15,7],[15,8],
], sz);

const rocketCells = (sz: number): Set<string> => buildSet([
  [0,7],[0,8],
  [1,7],[1,8],
  [2,6],[2,7],[2,8],[2,9],
  [3,6],[3,7],[3,8],[3,9],
  [4,6],[4,7],[4,8],[4,9],
  [5,5],[5,6],[5,7],[5,8],[5,9],[5,10],
  [6,5],[6,6],[6,7],[6,8],[6,9],[6,10],
  [7,5],[7,6],[7,7],[7,8],[7,9],[7,10],
  [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],
  [9,5],[9,6],[9,7],[9,8],[9,9],[9,10],
  [10,5],[10,6],[10,7],[10,8],[10,9],[10,10],
  [11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],
  [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
  [13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],
  [14,5],[14,6],[14,7],[14,8],[14,9],[14,10],
  [15,6],[15,7],[15,8],[15,9],
], sz);

const houseCells = (sz: number): Set<string> => buildSet([
  [0,7],[0,8],
  [1,6],[1,7],[1,8],[1,9],
  [2,5],[2,6],[2,7],[2,8],[2,9],[2,10],
  [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],
  [4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],
  [5,4],[5,5],[5,10],[5,11],
  [6,4],[6,5],[6,10],[6,11],
  [7,4],[7,5],[7,10],[7,11],
  [8,4],[8,5],[8,10],[8,11],
  [9,4],[9,5],[9,10],[9,11],
  [10,4],[10,5],[10,10],[10,11],
  [11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],
  [12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
  [13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],
  [14,7],[14,8],
  [15,7],[15,8],
], sz);

const treeCells = (sz: number): Set<string> => buildSet([
  [0,7],[0,8],
  [1,6],[1,7],[1,8],[1,9],
  [2,5],[2,6],[2,7],[2,8],[2,9],[2,10],
  [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],
  [4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],
  [5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],
  [6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],
  [7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],
  [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],
  [9,5],[9,6],[9,7],[9,8],[9,9],[9,10],
  [10,6],[10,7],[10,8],[10,9],
  [11,7],[11,8],
  [12,7],[12,8],
  [13,7],[13,8],
  [14,7],[14,8],
  [15,7],[15,8],
], sz);

const smileCells = (sz: number): Set<string> => buildSet([
  [2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
  [3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],
  [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],
  [5,2],[5,12],
  [6,2],[6,12],
  [7,2],[7,12],
  [8,2],[8,12],
  [9,2],[9,12],
  [10,2],[10,12],
  [11,2],[11,12],
  [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],
  [13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],
  [5,5],[5,6],[5,7],
  [5,8],[5,9],[5,10],
  [9,5],[9,6],[9,7],
  [9,8],[9,9],[9,10],
  [10,6],[10,7],[10,8],[10,9],
], sz);

const fishCells = (sz: number): Set<string> => buildSet([
  [4,0],[4,1],
  [5,0],[5,1],
  [6,0],[6,1],
  [7,0],[7,1],
  [8,0],[8,1],
  [9,0],[9,1],
  [10,0],[10,1],
  [11,0],[11,1],
  [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],
  [5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],
  [6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],
  [7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],
  [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],
  [9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],
  [10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],
  [11,2],[11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],
  [5,6],[5,7],[6,6],[6,7],[7,5],[7,6],
  [9,6],[9,7],[10,6],[10,7],
  [5,10],[5,11],
], sz);

const butterflyCells = (sz: number): Set<string> => buildSet([
  [3,7],[3,8],
  [4,7],[4,8],
  [5,7],[5,8],
  [6,7],[6,8],
  [7,7],[7,8],
  [8,7],[8,8],
  [9,7],[9,8],
  [10,7],[10,8],
  [11,7],[11,8],
  [12,7],[12,8],
  [2,5],[2,6],[3,4],[3,5],[4,3],[4,4],[5,2],[5,3],[5,4],[6,1],[6,2],[6,3],[7,0],[7,1],[7,2],
  [2,9],[2,10],[3,10],[3,11],[4,11],[4,12],[5,11],[5,12],[5,13],[6,12],[6,13],[6,14],[7,13],[7,14],[7,15],
  [8,4],[8,5],[9,3],[9,4],[9,5],[10,3],[10,4],[10,5],[11,4],[11,5],
  [8,10],[8,11],[9,10],[9,11],[9,12],[10,10],[10,11],[10,12],[11,10],[11,11],
  [2,6],[2,7],[1,5],[1,8],
], sz);

const TEMPLATES: Template[] = [
  { id: 'blank',     name: 'Blank Canvas', cells: () => new Set() },
  { id: 'heart',     name: '❤️ Heart',     cells: heartCells },
  { id: 'star',      name: '⭐ Star',       cells: starCells },
  { id: 'rocket',    name: '🚀 Rocket',    cells: rocketCells },
  { id: 'house',     name: '🏠 House',      cells: houseCells },
  { id: 'tree',      name: '🌲 Tree',       cells: treeCells },
  { id: 'smile',     name: '😊 Smile',      cells: smileCells },
  { id: 'fish',      name: '🐟 Fish',       cells: fishCells },
  { id: 'butterfly', name: '🦋 Butterfly',  cells: butterflyCells },
];

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const PIECES = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${(i * 19 + 7) % 97}%`,
    color: ['#FF6B9D','#FFD93D','#6BCBFF','#6BCB77','#C084FC','#FF9F43'][i % 6],
    delay: `${(i * 0.09) % 1.8}s`,
    size: 7 + (i % 4) * 2.5,
  }));
  return (
    <>
      <style>{`
        @keyframes confettiDrop {
          0%   { transform: translateY(-5px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80vh) rotate(600deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 8 }}>
        {PIECES.map(p => (
          <div key={p.id} style={{
            position: 'absolute', top: -10,
            left: p.left, width: p.size, height: p.size * 1.5,
            background: p.color, borderRadius: 2,
            animation: `confettiDrop 2.2s ease-in ${p.delay} forwards`,
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          fontSize: 40, fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700, color: '#FF6B9D',
          textShadow: '2px 2px 0 #FFD93D',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          Masterpiece! 🖼️
        </div>
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PixelCanvasProps { onBack: () => void; kidName?: string; }

export default function PixelCanvas({ onBack }: PixelCanvasProps) {
  const [paletteId, setPaletteId]       = useState<PaletteId>('rainbow');
  const [gridSize, setGridSize]         = useState<GridSize>(16);
  const [templateId, setTemplateId]     = useState<TemplateId>('blank');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [grid, setGrid]                 = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const palette  = PALETTES[paletteId];
  const template = TEMPLATES.find(t => t.id === templateId)!;
  const templateCells = template.cells(gridSize);

  const getFillPercent = useCallback(() => {
    if (templateId === 'blank' || templateCells.size === 0) return 0;
    let filled = 0;
    templateCells.forEach(k => { if (grid[k]) filled++; });
    return filled / templateCells.size;
  }, [grid, templateCells, templateId]);

  const applyTemplate = useCallback((tId: TemplateId) => {
    setTemplateId(tId);
    setShowCelebration(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    const cells = TEMPLATES.find(t => t.id === tId)!.cells(gridSize);
    const g: Record<string, string> = {};
    if (tId !== 'blank') cells.forEach(k => { g[k] = '__hint__'; });
    setGrid(g);
  }, [gridSize]);

  const handleGridSizeChange = useCallback((sz: GridSize) => {
    setGridSize(sz);
    applyTemplate(templateId);
  }, [templateId, applyTemplate]);

  const handleCellTap = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    if (templateId !== 'blank' && !templateCells.has(key)) return;
    setGrid(prev => {
      const next = { ...prev };
      if (next[key] === selectedColor) { delete next[key]; }
      else { next[key] = selectedColor; }
      return next;
    });
  }, [selectedColor, templateCells, templateId]);

  const handleClear = useCallback(() => {
    const filled = Object.keys(grid).filter(k => grid[k] && grid[k] !== '__hint__').length;
    if (filled > (gridSize * gridSize) * 0.5) { setShowClearConfirm(true); }
    else { applyTemplate(templateId); }
  }, [grid, gridSize, templateId, applyTemplate]);

  useEffect(() => {
    if (templateId === 'blank') return;
    const pct = getFillPercent();
    if (pct >= 0.8 && !showCelebration) {
      setShowCelebration(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowCelebration(false), 3200);
    }
  }, [grid, templateId]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const gridWidth = `calc(100vw - 32px)`;
  const cellSize  = `calc((100vw - 32px) / ${gridSize})`;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', fontFamily: 'Fredoka, sans-serif', paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', borderBottom: '2px solid #F0E8E0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px', borderRadius: 12 }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#EC4899', margin: 0 }}>Pixel Studio</h2>
        <div style={{ width: 60 }} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', background: 'white', borderBottom: '2px solid #F0E8E0', scrollbarWidth: 'none', flexWrap: 'wrap' }}>
        <button onClick={() => { const idx = PALETTE_ORDER.indexOf(paletteId); const next = PALETTE_ORDER[(idx + 1) % PALETTE_ORDER.length]; setPaletteId(next); setSelectedColor(PALETTES[next].colors[0]); }}
          style={{ padding: '6px 12px', borderRadius: 20, border: '2.5px solid #EC4899', background: 'white', color: '#EC4899', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif', whiteSpace: 'nowrap' }}>
          {palette.name}
        </button>
        {([8, 12, 16, 20] as GridSize[]).map(sz => (
          <button key={sz} onClick={() => handleGridSizeChange(sz)} style={{
            padding: '6px 11px', borderRadius: 20,
            border: `2.5px solid ${gridSize === sz ? '#3B82F6' : '#E0E0E0'}`,
            background: gridSize === sz ? '#3B82F6' : 'white',
            color: gridSize === sz ? 'white' : '#6B7280',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif', whiteSpace: 'nowrap',
          }}>{sz}×{sz}</button>
        ))}
        <select value={templateId} onChange={e => applyTemplate(e.target.value as TemplateId)}
          style={{ padding: '6px 10px', borderRadius: 20, border: '2.5px solid #8B5CF6', background: 'white', color: '#8B5CF6', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif' }}>
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={handleClear} style={{ padding: '6px 12px', borderRadius: 20, border: '2.5px solid #EF4444', background: 'white', color: '#EF4444', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif', whiteSpace: 'nowrap' }}>
          🗑️ Clear
        </button>
      </div>

      {/* Progress */}
      {templateId !== 'blank' && (
        <div style={{ padding: '6px 16px', background: '#FFF8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{template.name}:</span>
          <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${getFillPercent() * 100}%`, background: getFillPercent() >= 0.8 ? '#22C55E' : '#3B82F6', borderRadius: 4, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{Math.round(getFillPercent() * 100)}%</span>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16, flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize})`,
          width: gridWidth, height: gridWidth,
          border: '3px solid #1F2937', borderRadius: 10,
          overflow: 'hidden', background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          position: 'relative',
        }}>
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const key = `${row},${col}`;
            const val = grid[key];
            const isHint = val === '__hint__';
            const isTmpl = templateCells.has(key);
            const filled = val && val !== '__hint__';

            return (
              <div key={key} onClick={() => handleCellTap(row, col)} style={{
                width: cellSize, height: cellSize,
                background: filled ? val : 'transparent',
                border: isTmpl && isHint ? '1.5px dashed rgba(140,140,140,0.35)' : '0.5px solid #F0F0F0',
                boxSizing: 'border-box',
                cursor: (isTmpl || templateId === 'blank') ? 'pointer' : 'default',
                transition: 'background 0.07s ease',
              }} />
            );
          })}
          {showCelebration && <Confetti />}
        </div>
      </div>

      {/* Color Picker */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid #F0E8E0', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 12, zIndex: 50 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: selectedColor, border: '3px solid #1F2937', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', paddingTop: 4, paddingBottom: 4 }}>
          {palette.colors.map(color => (
            <button key={color} onClick={() => setSelectedColor(color)} style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: color,
              border: selectedColor === color ? '3.5px solid #1F2937' : '2.5px solid rgba(150,150,150,0.25)',
              outline: selectedColor === color ? '2.5px solid #FBBF24' : 'none',
              outlineOffset: 2, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'transform 0.1s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 28, maxWidth: 320, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Clear Canvas?</h3>
            <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>You have lots of color! Are you sure you want to clear it?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 16, border: '2px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: 16, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif' }}>Keep it!</button>
              <button onClick={() => { setShowClearConfirm(false); applyTemplate(templateId); }} style={{ flex: 1, padding: '12px', borderRadius: 16, border: '2px solid #EF4444', background: '#EF4444', color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer', fontFamily: 'Fredoka, sans-serif' }}>Clear it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
