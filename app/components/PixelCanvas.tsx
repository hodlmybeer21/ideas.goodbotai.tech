'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

type GridSize = 8 | 12 | 16 | 20;
type PaletteId = 'rainbow' | 'nature' | 'ocean' | 'warm';

interface Palette { name: string; colors: string[]; }

const PALETTES: Record<PaletteId, Palette> = {
  rainbow: { name: '🌈 Rainbow', colors: ['#FF0000','#FF8C00','#FFD700','#32CD32','#1E90FF','#8B00FF','#FF69B4','#FFFFFF','#111111'] },
  nature:  { name: '🌿 Nature',  colors: ['#1B5E20','#4CAF50','#87CEEB','#8B4513','#D2B48C','#FFFFFF','#111111'] },
  ocean:   { name: '🌊 Ocean',   colors: ['#0D47A1','#1976D2','#64B5F6','#00838F','#FFFFFF','#F5DEB3','#1B5E20','#8B00FF'] },
  warm:    { name: '🔥 Warm',    colors: ['#FF0000','#FF8C00','#FFD700','#FF69B4','#8B00FF','#FFFFFF','#111111'] },
};
const PALETTE_ORDER: PaletteId[] = ['rainbow','nature','ocean','warm'];

interface PixelCanvasProps { onBack: () => void; kidName?: string; }

export default function PixelCanvas({ onBack }: PixelCanvasProps) {
  const [paletteId, setPaletteId]       = useState<PaletteId>('rainbow');
  const [gridSize, setGridSize]         = useState<GridSize>(16);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [grid, setGrid]                 = useState<Record<string, string>>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const palette = PALETTES[paletteId];
  const gridWidth = `calc(100vw - 32px)`;
  const cellSize  = `calc((100vw - 32px) / ${gridSize})`;

  const handleCellTap = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    setGrid(prev => {
      const next = { ...prev };
      if (next[key] === selectedColor) {
        delete next[key];
      } else {
        next[key] = selectedColor;
      }
      return next;
    });
  }, [selectedColor]);

  const handleClear = useCallback(() => {
    const filled = Object.keys(grid).length;
    if (filled > (gridSize * gridSize) * 0.5) {
      setShowClearConfirm(true);
    } else {
      setGrid({});
    }
  }, [grid, gridSize]);

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAFA',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Fredoka, sans-serif',
      paddingBottom: 110,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'white',
        borderBottom: '2px solid #F0E8E0',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontSize: 20,
          cursor: 'pointer', padding: '4px 8px', borderRadius: 12,
        }}>
          ← Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#EC4899', margin: 0 }}>
          Pixel Studio
        </h2>
        <div style={{ width: 60 }} />
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 16px',
        overflowX: 'auto', background: 'white',
        borderBottom: '2px solid #F0E8E0',
        scrollbarWidth: 'none', flexWrap: 'wrap',
      }}>
        {/* Palette cycler */}
        <button
          onClick={() => {
            const idx = PALETTE_ORDER.indexOf(paletteId);
            const next = PALETTE_ORDER[(idx + 1) % PALETTE_ORDER.length];
            setPaletteId(next);
            setSelectedColor(PALETTES[next].colors[0]);
          }}
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: '2.5px solid #EC4899', background: 'white',
            color: '#EC4899', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {palette.name}
        </button>

        {/* Grid sizes */}
        {([8, 12, 16, 20] as GridSize[]).map(sz => (
          <button
            key={sz}
            onClick={() => { setGridSize(sz); setGrid({}); }}
            style={{
              padding: '6px 12px', borderRadius: 20,
              border: `2.5px solid ${gridSize === sz ? '#3B82F6' : '#E0E0E0'}`,
              background: gridSize === sz ? '#3B82F6' : 'white',
              color: gridSize === sz ? 'white' : '#6B7280',
              fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {sz}×{sz}
          </button>
        ))}

        {/* Clear */}
        <button
          onClick={handleClear}
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: '2.5px solid #EF4444', background: 'white',
            color: '#EF4444', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: 16, flex: 1, alignItems: 'flex-start',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize})`,
          width: gridWidth, height: gridWidth,
          border: '3px solid #1F2937',
          borderRadius: 10,
          overflow: 'hidden',
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        }}>
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const key = `${row},${col}`;
            const color = grid[key];

            return (
              <div
                key={key}
                onClick={() => handleCellTap(row, col)}
                style={{
                  width: cellSize, height: cellSize,
                  background: color || 'transparent',
                  border: '0.5px solid #F0F0F0',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'background 0.07s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '2px solid #F0E8E0',
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', gap: 12, zIndex: 50,
      }}>
        {/* Current color swatch */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: selectedColor, border: '3px solid #1F2937',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }} />
        {/* Palette colors */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', flex: 1,
          scrollbarWidth: 'none', paddingTop: 4, paddingBottom: 4,
        }}>
          {palette.colors.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: color,
                border: selectedColor === color
                  ? '3.5px solid #1F2937'
                  : '2.5px solid rgba(150,150,150,0.25)',
                outline: selectedColor === color ? '2.5px solid #FBBF24' : 'none',
                outlineOffset: 2, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.1s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Clear Confirm */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: 28,
            maxWidth: 320, width: '100%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Clear Canvas?
            </h3>
            <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20 }}>
              You have lots of color! Are you sure you want to clear it?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 16,
                  border: '2px solid #E5E7EB', background: 'white',
                  color: '#6B7280', fontWeight: 600, fontSize: 16,
                  cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                }}
              >
                Keep it!
              </button>
              <button
                onClick={() => { setShowClearConfirm(false); setGrid({}); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 16,
                  border: '2px solid #EF4444', background: '#EF4444',
                  color: 'white', fontWeight: 600, fontSize: 16,
                  cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
                }}
              >
                Clear it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
