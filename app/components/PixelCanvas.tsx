'use client';

import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type GridSize = 8 | 12 | 16 | 20;
type PaletteId = 'rainbow' | 'nature' | 'ocean' | 'warm';
type TemplateId = 'blank' | 'heart' | 'star' | 'rocket' | 'house' | 'tree' | 'smile' | 'fish' | 'butterfly';

interface Palette {
  name: string;
  colors: string[];
}

interface Template {
  id: TemplateId;
  name: string;
  cells: (size: number) => [number, number][];
}

// ── Palettes ──────────────────────────────────────────────────────────────────

const PALETTES: Record<PaletteId, Palette> = {
  rainbow: {
    name: '🌈 Rainbow',
    colors: ['#FF0000', '#FF8C00', '#FFD700', '#32CD32', '#1E90FF', '#8B00FF', '#FF69B4', '#FFFFFF', '#111111'],
  },
  nature: {
    name: '🌿 Nature',
    colors: ['#1B5E20', '#4CAF50', '#87CEEB', '#8B4513', '#D2B48C', '#FFFFFF', '#111111'],
  },
  ocean: {
    name: '🌊 Ocean',
    colors: ['#0D47A1', '#1976D2', '#64B5F6', '#00838F', '#FFFFFF', '#F5DEB3', '#1B5E20', '#8B00FF'],
  },
  warm: {
    name: '🔥 Warm',
    colors: ['#FF0000', '#FF8C00', '#FFD700', '#FF69B4', '#8B00FF', '#FFFFFF', '#111111'],
  },
};

const PALETTE_ORDER: PaletteId[] = ['rainbow', 'nature', 'ocean', 'warm'];

// ── Template coordinate generators ──────────────────────────────────────────
// Each returns array of [row, col] relative to grid size (0-indexed, floats OK)

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    cells: () => [],
  },
  {
    id: 'heart',
    name: '❤️ Heart',
    cells: (size: number) => {
      // Heart shape in a proportional way
      const f = size / 16;
      const base: [number, number][] = [
        [2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
        [3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],
        [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],
        [5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],
        [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],
        [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],
        [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],
        [9,1],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],
        [10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],
        [11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],
        [12,4],[12,5],[12,6],[12,7],
        [13,5],[13,6],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'star',
    name: '⭐ Star',
    cells: (size: number) => {
      const f = size / 16;
      // 5-pointed star
      const base: [number, number][] = [
        // Top point
        [0,7],[0,8],
        [1,6],[1,7],[1,8],[1,9],
        [2,5],[2,6],[2,7],[2,8],[2,9],[2,10],
        [3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],
        [4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],
        // Left arm
        [5,2],[5,3],[5,4],[5,11],[5,12],[5,13],
        [6,1],[6,2],[6,13],[6,14],
        [7,0],[7,1],[7,14],[7,15],
        // Inner body
        [8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],
        [9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],
        [10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],
        [11,5],[11,6],[11,7],[11,8],[11,9],[11,10],
        [12,6],[12,7],[12,8],[12,9],
        [13,7],[13,8],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'rocket',
    name: '🚀 Rocket',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Nose cone
        [0,7],[0,8],
        [1,7],[1,8],
        [2,7],[2,8],
        [3,6],[3,7],[3,8],[3,9],
        [4,6],[4,7],[4,8],[4,9],
        // Body
        [5,6],[5,7],[5,8],[5,9],
        [6,5],[6,6],[6,7],[6,8],[6,9],[6,10],
        [7,5],[7,6],[7,7],[7,8],[7,9],[7,10],
        [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],
        [9,5],[9,6],[9,7],[9,8],[9,9],[9,10],
        [10,5],[10,6],[10,7],[10,8],[10,9],[10,10],
        // Fins and engine
        [11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],
        [12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
        [13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],
        [14,4],[14,5],[14,6],[14,7],[14,8],[14,9],[14,10],[14,11],
        [15,5],[15,6],[15,7],[15,8],[15,9],[15,10],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'house',
    name: '🏠 House',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Roof
        [0,6],[0,7],[0,8],[0,9],
        [1,5],[1,6],[1,7],[1,8],[1,9],[1,10],
        [2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
        [3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],
        // Walls
        [4,3],[4,4],[4,11],[4,12],
        [5,3],[5,4],[5,11],[5,12],
        [6,3],[6,4],[6,11],[6,12],
        [7,3],[7,4],[7,11],[7,12],
        [8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],
        [9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],
        [10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],
        [11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],[11,12],
        // Door
        [12,7],[12,8],
        [13,7],[13,8],
        [14,7],[14,8],
        [15,7],[15,8],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'tree',
    name: '🌲 Tree',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Top
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
        // Trunk
        [11,7],[11,8],
        [12,7],[12,8],
        [13,7],[13,8],
        [14,7],[14,8],
        [15,7],[15,8],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'smile',
    name: '😊 Smile',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Head outline
        [2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
        [3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],
        [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],
        [5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],
        [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],
        [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],
        [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],
        [9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],[9,15],
        [10,0],[10,1],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],[10,14],[10,15],
        [11,1],[11,2],[11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],[11,12],[11,13],[11,14],
        [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],
        [13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],
        // Eyes
        [5,5],[5,6],[6,5],[6,6],
        [5,9],[5,10],[6,9],[6,10],
        // Mouth
        [9,6],[9,7],[9,8],[9,9],
        [10,5],[10,10],
        [11,6],[11,7],[11,8],[11,9],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'fish',
    name: '🐟 Fish',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Tail
        [3,0],[3,1],
        [4,0],[4,1],
        [5,0],[5,1],
        [6,0],[6,1],
        [7,0],[7,1],
        [8,0],[8,1],
        [9,0],[9,1],
        [10,0],[10,1],
        [11,0],[11,1],
        [12,0],[12,1],
        // Body
        [3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],
        [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],
        [5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],
        [6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],
        [7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],
        [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],
        [9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],
        [10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],
        [11,2],[11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],
        [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],
        // Fin
        [5,5],[5,6],
        [6,4],[6,5],[6,6],[6,7],
        [7,5],[7,6],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
  {
    id: 'butterfly',
    name: '🦋 Butterfly',
    cells: (size: number) => {
      const f = size / 16;
      const base: [number, number][] = [
        // Body
        [2,7],[2,8],
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
        [13,7],[13,8],
        // Left wings upper
        [2,5],[2,6],[3,4],[3,5],[4,3],[4,4],[4,5],[5,2],[5,3],[5,4],[6,1],[6,2],[6,3],[6,4],[6,5],[7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[9,1],[9,2],[9,3],[9,4],[9,5],[10,2],[10,3],[10,4],[10,5],[11,3],[11,4],[11,5],[11,6],[12,4],[12,5],[12,6],[13,5],[13,6],
        // Right wings upper
        [2,9],[2,10],[3,10],[3,11],[4,10],[4,11],[4,12],[5,11],[5,12],[5,13],[6,11],[6,12],[6,13],[6,14],[6,15],[7,11],[7,12],[7,13],[7,14],[7,15],[8,11],[8,12],[8,13],[8,14],[8,15],[9,11],[9,12],[9,13],[9,14],[10,11],[10,12],[10,13],[11,11],[11,12],[11,13],[12,11],[12,12],[12,13],
        // Left wings lower
        [8,3],[8,4],[9,2],[9,3],[9,4],[10,2],[10,3],[10,4],[11,3],[11,4],[11,5],[12,4],[12,5],[12,6],[13,5],[13,6],
        // Right wings lower
        [8,11],[8,12],[9,11],[9,12],[9,13],[10,11],[10,12],[10,13],[11,11],[11,12],[11,13],[12,11],[12,12],[12,13],
      ];
      return base.map(([r, c]) => [Math.round(r * f), Math.round(c * f)]);
    },
  },
];

// ── Celebration Confetti ──────────────────────────────────────────────────────

function Celebration() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43', '#FF0000', '#8B00FF'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.5}s`,
    size: Math.random() * 10 + 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
            borderRadius: 2,
            animation: `confettiFall ${2 + Math.random()}s ease-in forwards`,
            animationDelay: p.delay,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 48,
        fontFamily: 'Fredoka, sans-serif',
        fontWeight: 700,
        color: '#FF6B9D',
        textShadow: '2px 2px 0 #FFD93D, 4px 4px 0 rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
        animation: 'masterpieceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        Masterpiece! 🖼️
      </div>
      <style>{`
        @keyframes masterpieceIn {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface PixelCanvasProps {
  onBack: () => void;
  kidName: string;
}

export default function PixelCanvas({ onBack, kidName }: PixelCanvasProps) {
  const [paletteId, setPaletteId] = useState<PaletteId>('rainbow');
  const [gridSize, setGridSize] = useState<GridSize>(16);
  const [templateId, setTemplateId] = useState<TemplateId>('blank');
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000');
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const palette = PALETTES[paletteId];

  // Build current template cells
  const template = TEMPLATES.find(t => t.id === templateId)!;
  const templateCells = new Set(
    template.cells(gridSize).map(([r, c]) => `${r},${c}`)
  );

  // Compute fill percentage for template
  const getTemplateFillPercent = useCallback(() => {
    if (templateId === 'blank' || templateCells.size === 0) return 0;
    let filled = 0;
    templateCells.forEach(key => {
      if (grid[key]) filled++;
    });
    return filled / templateCells.size;
  }, [grid, templateCells, templateId]);

  // Handle cell tap
  const handleCellTap = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    setGrid(prev => {
      const next = { ...prev };
      if (next[key] === selectedColor) {
        // Toggle off
        delete next[key];
      } else if (next[key] && next[key] !== selectedColor) {
        // Swap color
        next[key] = selectedColor;
      } else {
        // Fill
        next[key] = selectedColor;
      }
      return next;
    });
  }, [selectedColor]);

  // Apply template to grid
  const applyTemplate = useCallback((tId: TemplateId) => {
    setTemplateId(tId);
    setGrid({});
    setShowCelebration(false);
    // Preset template cell colors to white-ish hint
    const t = TEMPLATES.find(t => t.id === tId)!;
    const cells = t.cells(gridSize);
    const hintGrid: Record<string, string> = {};
    if (tId !== 'blank') {
      cells.forEach(([r, c]) => {
        hintGrid[`${r},${c}`] = 'hint';
      });
    }
    setGrid(hintGrid);
  }, [gridSize]);

  // Clear
  const handleClear = useCallback(() => {
    const filledCount = Object.keys(grid).filter(k => grid[k] && grid[k] !== 'hint').length;
    const totalCells = gridSize * gridSize;
    if (filledCount / totalCells > 0.5) {
      setShowClearConfirm(true);
    } else {
      applyTemplate(templateId);
    }
  }, [grid, gridSize, templateId, applyTemplate]);

  const confirmClear = useCallback(() => {
    setShowClearConfirm(false);
    applyTemplate(templateId);
  }, [templateId, applyTemplate]);

  // Change grid size
  const handleGridSizeChange = useCallback((size: GridSize) => {
    setGridSize(size);
    applyTemplate(templateId);
  }, [templateId, applyTemplate]);

  // Check for celebration after grid change
  useEffect(() => {
    if (templateId !== 'blank' && templateCells.size > 0) {
      const fillPct = getTemplateFillPercent();
      if (fillPct >= 0.8) {
        setCelebrationKey(k => k + 1);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3500);
      }
    }
  }, [grid, templateId, templateCells.size, getTemplateFillPercent]);

  // Is a cell a template hint (not yet colored)?
  const isHint = useCallback((key: string) => {
    return grid[key] === 'hint';
  }, [grid]);

  // Rendered cell color
  const getCellColor = useCallback((key: string) => {
    const val = grid[key];
    if (!val) return 'transparent';
    if (val === 'hint') return 'transparent';
    return val;
  }, [grid]);

  const gridWidth = `calc(100vw - 32px)`;
  const cellSize = `calc((100vw - 32px) / ${gridSize})`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Fredoka, sans-serif',
      paddingBottom: 100,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'white',
        borderBottom: '2px solid #F0E8E0',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 12,
            fontFamily: 'Fredoka, sans-serif',
          }}
        >
          ← Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-pink)', margin: 0 }}>
          Pixel Studio
        </h2>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '10px 16px',
        overflowX: 'auto',
        background: 'white',
        borderBottom: '2px solid #F0E8E0',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {/* Palette switcher */}
        <button
          onClick={() => {
            const idx = PALETTE_ORDER.indexOf(paletteId);
            setPaletteId(PALETTE_ORDER[(idx + 1) % PALETTE_ORDER.length]);
            setSelectedColor(PALETTES[PALETTE_ORDER[(idx + 1) % PALETTE_ORDER.length]].colors[0]);
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '2.5px solid var(--accent-pink)',
            background: 'white',
            color: 'var(--accent-pink)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Fredoka, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {palette.name}
        </button>

        {/* Grid size */}
        {([8, 12, 16, 20] as GridSize[]).map(size => (
          <button
            key={size}
            onClick={() => handleGridSizeChange(size)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: `2.5px solid ${gridSize === size ? 'var(--accent-blue)' : '#E0E0E0'}`,
              background: gridSize === size ? 'var(--accent-blue)' : 'white',
              color: gridSize === size ? 'white' : 'var(--text-medium)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {size}×{size}
          </button>
        ))}

        {/* Template */}
        <select
          value={templateId}
          onChange={e => applyTemplate(e.target.value as TemplateId)}
          style={{
            padding: '6px 12px',
            borderRadius: 20,
            border: '2.5px solid var(--accent-purple)',
            background: 'white',
            color: 'var(--accent-purple)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Fredoka, sans-serif',
          }}
        >
          {TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Clear */}
        <button
          onClick={handleClear}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '2.5px solid #FF6B6B',
            background: 'white',
            color: '#FF6B6B',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Fredoka, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Fill progress (for templates) */}
      {templateId !== 'blank' && (
        <div style={{
          padding: '6px 16px',
          background: '#FFF8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>
            {template.name}:
          </span>
          <div style={{ flex: 1, height: 8, background: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${getTemplateFillPercent() * 100}%`,
              background: getTemplateFillPercent() >= 0.8 ? 'var(--accent-green)' : 'var(--accent-blue)',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>
            {Math.round(getTemplateFillPercent() * 100)}%
          </span>
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '16px',
        flex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize})`,
          width: gridWidth,
          height: gridWidth,
          border: '3px solid #2D1B00',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {Array.from({ length: gridSize * gridSize }, (_, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const key = `${row},${col}`;
            const color = getCellColor(key);
            const hint = isHint(key);
            const isTemplateCell = templateCells.has(key);

            return (
              <div
                key={key}
                onClick={() => handleCellTap(row, col)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: color,
                  border: isTemplateCell && !hint
                    ? 'none'
                    : isTemplateCell && hint
                    ? '1.5px dashed rgba(100,100,100,0.35)'
                    : '0.5px solid #F0E8E0',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'background 0.08s ease',
                  borderRadius: hint ? 2 : 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '2px solid #F0E8E0',
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 50,
      }}>
        {/* Current color swatch */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: selectedColor,
          border: '3px solid #2D1B00',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }} />
        {/* Palette colors */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flex: 1,
          paddingTop: 4,
          paddingBottom: 4,
        }}>
          {palette.colors.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: color,
                border: selectedColor === color ? '3.5px solid #2D1B00' : '2.5px solid rgba(150,150,150,0.3)',
                flexShrink: 0,
                cursor: 'pointer',
                outline: selectedColor === color ? '2px solid var(--accent-yellow)' : 'none',
                outlineOffset: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'transform 0.1s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: 24,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 28,
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
              Clear Canvas?
            </h3>
            <p style={{ fontSize: 15, color: 'var(--text-medium)', marginBottom: 20 }}>
              You have lots of color on your canvas! Are you sure you want to clear it?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 16,
                  border: '2px solid #E0E0E0',
                  background: 'white',
                  color: 'var(--text-medium)',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontFamily: 'Fredoka, sans-serif',
                }}
              >
                Keep it!
              </button>
              <button
                onClick={confirmClear}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 16,
                  border: '2px solid #FF6B6B',
                  background: '#FF6B6B',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  fontFamily: 'Fredoka, sans-serif',
                }}
              >
                Clear it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebration && <Celebration key={celebrationKey} />}
    </div>
  );
}