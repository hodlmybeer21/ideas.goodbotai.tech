'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Color mixing (RYB model — paint/pigment, how kids learn it) ───────────
const PRIMARY_COLORS = [
  { id: 'red',    name: 'Red',    hex: '#FF3B3B', label: 'Red',    css: '#FF3B3B' },
  { id: 'yellow', name: 'Yellow', hex: '#FFD700', label: 'Yellow', css: '#FFD700' },
  { id: 'blue',   name: 'Blue',   hex: '#3B82F6', label: 'Blue',   css: '#3B82F6' },
];

type ColorId = 'red' | 'yellow' | 'blue';

interface Recipe {
  red: number;
  yellow: number;
  blue: number;
}

interface MixResult {
  color: string;
  name: string;
  emoji: string;
}

// RYB mixing table — maps drops to result
function mixColors(recipe: Recipe): MixResult {
  const { red, yellow, blue } = recipe;
  const total = red + yellow + blue;

  // All empty
  if (total === 0) return { color: '#FFFFFF', name: 'Empty!', emoji: '🧪' };

  // Pure primaries
  if (red === 1 && yellow === 0 && blue === 0) return { color: '#FF3B3B', name: 'Red', emoji: '❤️' };
  if (red === 0 && yellow === 1 && blue === 0) return { color: '#FFD700', name: 'Yellow', emoji: '💛' };
  if (red === 0 && yellow === 0 && blue === 1) return { color: '#3B82F6', name: 'Blue', emoji: '💙' };

  // Two-color mixes
  if (red === 1 && yellow === 1 && blue === 0) return { color: '#FF8C00', name: 'Orange', emoji: '🍊' };
  if (red === 1 && yellow === 0 && blue === 1) return { color: '#8B5CF6', name: 'Purple', emoji: '💜' };
  if (red === 0 && yellow === 1 && blue === 1) return { color: '#22C55E', name: 'Green', emoji: '💚' };

  // All three
  if (red >= 1 && yellow >= 1 && blue >= 1) return { color: '#6B4C3B', name: 'Brown', emoji: '🤎' };

  // Intensity variants
  if (red >= 2 && yellow >= 1 && blue === 0) return { color: '#CC5500', name: 'Dark Orange', emoji: '🍊' };
  if (red >= 1 && yellow >= 2 && blue === 0) return { color: '#E6B800', name: 'Bright Yellow', emoji: '🌟' };
  if (red === 0 && yellow >= 2 && blue >= 1) return { color: '#2E8B57', name: 'Teal', emoji: '🌊' };
  if (red >= 1 && yellow === 0 && blue >= 2) return { color: '#4B0082', name: 'Indigo', emoji: '💙' };
  if (red >= 2 && yellow === 0 && blue >= 1) return { color: '#7B2D8B', name: 'Dark Purple', emoji: '💜' };
  if (red >= 1 && yellow >= 1 && blue >= 2) return { color: '#4A5568', name: 'Dark Green-Gray', emoji: '🪨' };
  if (red >= 2 && yellow >= 2 && blue === 0) return { color: '#FF6600', name: 'Amber', emoji: '🍯' };
  if (red >= 2 && yellow >= 1 && blue >= 1) return { color: '#7B3F00', name: 'Dark Brown', emoji: '🟤' };
  if (red >= 1 && yellow >= 2 && blue >= 1) return { color: '#4A7C59', name: 'Olive', emoji: '🫒' };
  if (red >= 1 && yellow >= 1 && blue >= 1 && red <= 2 && yellow <= 2 && blue <= 2) return { color: '#8B6914', name: 'Olive Brown', emoji: '🟤' };

  // Default brown for anything more complex
  return { color: '#8B4513', name: 'Brown', emoji: '🤎' };
}

function recipeKey(r: Recipe): string {
  return `${r.red},${r.yellow},${r.blue}`;
}

function recipeFromKey(k: string): Recipe {
  const [red, yellow, blue] = k.split(',').map(Number);
  return { red, yellow, blue };
}

const COLOR_RECIPES: Record<string, { name: string; emoji: string }> = {
  '0,0,0': { name: 'Empty', emoji: '🧪' },
  '1,0,0': { name: 'Red', emoji: '❤️' },
  '0,1,0': { name: 'Yellow', emoji: '💛' },
  '0,0,1': { name: 'Blue', emoji: '💙' },
  '1,1,0': { name: 'Orange', emoji: '🍊' },
  '1,0,1': { name: 'Purple', emoji: '💜' },
  '0,1,1': { name: 'Green', emoji: '💚' },
  '1,1,1': { name: 'Brown', emoji: '🤎' },
};

// ─── Container definitions ───────────────────────────────────────────────────
const CONTAINERS = [
  { id: 'tube',   name: 'Test Tube',   maxDrops: 3,  width: 52,  height: 140, emoji: '🧪', fillStart: 0.65 },
  { id: 'beaker', name: 'Beaker',      maxDrops: 6,  width: 80,  height: 160, emoji: '🧋', fillStart: 0.60 },
  { id: 'flask',  name: 'Flask',       maxDrops: 10, width: 110, height: 180, emoji: '⚗️', fillStart: 0.55 },
];

// ─── Beaker / container component ───────────────────────────────────────────
interface BeakerProps {
  container: typeof CONTAINERS[0];
  recipe: Recipe;
  selectedColor: ColorId | null;
  onDrop: (color: ColorId) => void;
  isPouring: boolean;
  pouringColor: ColorId | null;
}

function Beaker({ container, recipe, selectedColor, onDrop, isPouring, pouringColor }: BeakerProps) {
  const total = recipe.red + recipe.yellow + recipe.blue;
  const fillPct = Math.min(total / container.maxDrops, 1);
  const mixed = mixColors(recipe);
  const isFull = total >= container.maxDrops;
  const canAdd = selectedColor !== null && !isFull;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {/* Container name + drop counter */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
        {container.emoji} {container.name}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
        {total} / {container.maxDrops} drops
      </div>

      {/* Beaker SVG */}
      <svg width={container.width + 16} height={container.height + 24} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
        {/* Liquid fill */}
        {fillPct > 0 && (
          <defs>
            <linearGradient id={`grad-${container.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mixed.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={mixed.color} stopOpacity="0.75" />
            </linearGradient>
            <filter id={`glow-${container.id}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        )}
        {/* Pouring drip animation */}
        {isPouring && pouringColor && (
          <ellipse
            cx={container.width / 2 + 8}
            cy={8}
            rx={6}
            ry={6}
            fill={pouringColor === 'red' ? '#FF3B3B' : pouringColor === 'yellow' ? '#FFD700' : '#3B82F6'}
            opacity={0.9}
          >
            <animate attributeName="cy" from={8} to={container.height * container.fillStart * fillPct + 20} dur="0.5s" fill="freeze" />
            <animate attributeName="opacity" from={0.9} to={0.3} dur="0.5s" fill="freeze" />
          </ellipse>
        )}
        {/* Bubbles when filling */}
        {fillPct > 0 && Array.from({ length: Math.min(total, 4) }).map((_, i) => (
          <circle key={i} r={2 + Math.random() * 3} fill="rgba(255,255,255,0.3)">
            <animate attributeName="cy" values={`${container.height * 0.8};${container.height * 0.3}`} dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${container.width / 2 + 8 - 10 + i * 6};${container.width / 2 + 8 + 5 - i * 4}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Glass body outline */}
        <rect
          x={8}
          y={20}
          width={container.width}
          height={container.height}
          rx={container.id === 'flask' ? 20 : 8}
          ry={container.id === 'flask' ? 20 : 8}
          fill={fillPct > 0 ? `url(#grad-${container.id})` : 'rgba(255,255,255,0.12)'}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={2}
          style={{ filter: fillPct > 0 ? `url(#glow-${container.id})` : 'none' }}
        />
        {/* Glass shine */}
        <rect x={10} y={22} width={8} height={container.height * 0.6} rx={4}
          fill="rgba(255,255,255,0.15)" />
        {/* Fill level line */}
        {fillPct > 0 && (
          <rect
            x={8}
            y={20 + container.height * (1 - fillPct * 0.85)}
            width={container.width}
            height={container.height * fillPct * 0.85}
            rx={container.id === 'flask' ? 20 : 8}
            ry={container.id === 'flask' ? 20 : 8}
            fill={mixed.color}
            opacity={0.85}
          />
        )}
        {/* Max fill line */}
        <line x1={6} y1={20 + container.height * (1 - 0.85)} x2={8} y2={20 + container.height * (1 - 0.85)} stroke="rgba(255,200,100,0.6)" strokeWidth={1.5} />
        {/* Measurement marks */}
        {Array.from({ length: Math.floor(container.maxDrops / 2) + 1 }).map((_, i) => (
          <g key={i}>
            <line
              x1={6} y1={20 + container.height - (i * container.height / (Math.floor(container.maxDrops / 2) + 1))}
              x2={12} y2={20 + container.height - (i * container.height / (Math.floor(container.maxDrops / 2) + 1))}
              stroke="rgba(255,255,255,0.3)" strokeWidth={1}
            />
          </g>
        ))}
        {/* Result color blob at top of liquid */}
        {fillPct > 0 && (
          <ellipse
            cx={container.width / 2 + 8}
            cy={20 + container.height * (1 - fillPct * 0.85) + 4}
            rx={container.width / 2 - 4}
            ry={8}
            fill={mixed.color}
            opacity={0.9}
          >
            <animate attributeName="ry" values="8;6;8" dur="2s" repeatCount="indefinite" />
          </ellipse>
        )}
      </svg>

      {/* Add button */}
      <button
        onClick={() => canAdd && onDrop(selectedColor!)}
        disabled={!canAdd}
        style={{
          padding: '8px 20px',
          borderRadius: '20px',
          border: canAdd ? `2px solid ${selectedColor === 'red' ? '#FF3B3B' : selectedColor === 'yellow' ? '#FFD700' : '#3B82F6'}` : '2px solid rgba(255,255,255,0.2)',
          background: canAdd ? (selectedColor === 'red' ? 'rgba(255,59,59,0.2)' : selectedColor === 'yellow' ? 'rgba(255,215,0,0.2)' : 'rgba(59,130,246,0.2)') : 'rgba(255,255,255,0.05)',
          color: canAdd ? '#fff' : 'rgba(255,255,255,0.3)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: canAdd ? 'pointer' : 'not-allowed',
          fontFamily: 'Fredoka, system-ui, sans-serif',
          boxShadow: canAdd ? `0 0 12px ${selectedColor === 'red' ? '#FF3B3B55' : selectedColor === 'yellow' ? '#FFD70055' : '#3B82F655'}` : 'none',
          transition: 'all 0.2s',
          minWidth: '100px',
        }}
      >
        {isFull ? '✨ Full!' : canAdd ? `+ ${selectedColor!.charAt(0).toUpperCase() + selectedColor!.slice(1)}` : '...'}
      </button>

      {/* Mix result */}
      {total > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '12px',
          padding: '8px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', marginBottom: '2px' }}>{mixed.emoji}</div>
          <div style={{ color: mixed.color, fontSize: '14px', fontWeight: 700 }}>{mixed.name}</div>
        </div>
      )}
    </div>
  );
}

// ─── Recipe book ────────────────────────────────────────────────────────────
function RecipeBook({ discoveries, onReset }: { discoveries: Set<string>; onReset: () => void }) {
  const allRecipes = Object.entries(COLOR_RECIPES).filter(([k]) => k !== '0,0,0');
  const totalRecipes = allRecipes.length;
  const foundCount = allRecipes.filter(([k]) => discoveries.has(k)).length;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      borderRadius: '16px',
      padding: '16px',
      minWidth: '200px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFD700', marginBottom: '8px', textAlign: 'center' }}>
        📖 Color Book — {foundCount} / {totalRecipes} discovered
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '220px', justifyContent: 'center' }}>
        {allRecipes.map(([k, v]) => {
          const found = discoveries.has(k);
          const r = recipeFromKey(k);
          const color = mixColors(r);
          return (
            <div key={k} style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: found ? color.color : 'rgba(255,255,255,0.1)',
              border: found ? `2px solid ${color.color}` : '2px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              opacity: found ? 1 : 0.35,
              boxShadow: found ? `0 0 6px ${color.color}55` : 'none',
              cursor: 'default',
              position: 'relative',
            }}
              title={found ? `${color.emoji} ${color.name}` : '???'}
            >
              {found ? color.emoji : '❓'}
            </div>
          );
        })}
      </div>
      <button onClick={onReset} style={{
        marginTop: '10px',
        width: '100%',
        padding: '6px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '11px',
        cursor: 'pointer',
        fontFamily: 'Fredoka, system-ui, sans-serif',
      }}>
        🔄 Reset Mixes
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
interface ColorLabProps {
  onBack?: () => void;
}

export default function ColorLab({ onBack }: ColorLabProps) {
  const [selectedColor, setSelectedColor] = useState<ColorId | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([
    { red: 0, yellow: 0, blue: 0 },
    { red: 0, yellow: 0, blue: 0 },
    { red: 0, yellow: 0, blue: 0 },
  ]);
  const [pouringIdx, setPouringIdx] = useState<number | null>(null);
  const [pouringColor, setPouringColor] = useState<ColorId | null>(null);
  const [justMixed, setJustMixed] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [discoveries, setDiscoveries] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const pourTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDrop(beakerIdx: number) {
    if (!selectedColor) return;
    const current = recipes[beakerIdx];
    const total = current.red + current.yellow + current.blue;
    const max = CONTAINERS[beakerIdx].maxDrops;
    if (total >= max) return;

    // Pour animation
    setPouringIdx(beakerIdx);
    setPouringColor(selectedColor);

    clearTimeout(pourTimeout.current!);
    pourTimeout.current = setTimeout(() => {
      setPouringIdx(null);
      setPouringColor(null);

      const updated = [...recipes];
      updated[beakerIdx] = { ...current, [selectedColor]: current[selectedColor] + 1 };
      setRecipes(updated);

      // Check if new discovery
      const key = recipeKey(updated[beakerIdx]);
      if (key !== '0,0,0' && !discoveries.has(key)) {
        setDiscoveries(d => new Set([...d, key]));
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2000);
      }

      setJustMixed(beakerIdx);
      setTimeout(() => setJustMixed(null), 600);
    }, 500);
  }

  function handleReset() {
    setRecipes([
      { red: 0, yellow: 0, blue: 0 },
      { red: 0, yellow: 0, blue: 0 },
      { red: 0, yellow: 0, blue: 0 },
    ]);
    setSelectedColor(null);
  }

  const totalDiscoveries = Object.keys(COLOR_RECIPES).filter(k => k !== '0,0,0').length;
  const foundDiscoveries = discoveries.size;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0033 0%, #0d1b3e 50%, #0a0a2e 100%)',
      fontFamily: 'Fredoka, system-ui, sans-serif',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      overflowX: 'hidden',
    }}>

      {/* Confetti overlay */}
      {confetti && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {['🎉', '⭐', '🌟', '✨', '💫'].map((e, i) => (
            <div key={i} style={{
              position: 'absolute',
              fontSize: '40px',
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animation: `confetti-drop 1.5s ease-out forwards`,
              animationDelay: `${i * 0.1}s`,
            }}>{e}</div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti-drop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(${Math.random() > 0.5 ? '360' : '-360'}deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px) rotate(-1deg); }
          40% { transform: translateX(4px) rotate(1deg); }
          60% { transform: translateX(-3px) rotate(-0.5deg); }
          80% { transform: translateX(3px) rotate(0.5deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '10px 20px',
        border: '1px solid rgba(255,255,255,0.15)',
        width: '100%', maxWidth: '600px',
      }}>
        <div style={{ fontSize: '28px' }}>🎨</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Color Lab</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Mix primary colors to discover new ones!</div>
        </div>
        {foundDiscoveries === totalDiscoveries && foundDiscoveries > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: '28px' }}>🏆</div>
        )}
      </div>

      {/* Color dispensers */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        gap: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', width: '100%', textAlign: 'center', marginBottom: '4px', fontWeight: 600 }}>
          Pick a color:
        </div>
        {PRIMARY_COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedColor(selectedColor === c.id ? null : c.id as ColorId)}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${c.hex}dd, ${c.hex})`,
              border: selectedColor === c.id ? '4px solid white' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '36px',
              boxShadow: selectedColor === c.id ? `0 0 24px ${c.hex}99, 0 0 48px ${c.hex}44` : `0 4px 16px ${c.hex}44`,
              transform: selectedColor === c.id ? 'scale(1.12)' : 'scale(1)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: selectedColor === c.id ? 'float 2s ease-in-out infinite' : 'none',
            }}
          >
            <span style={{ textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
              {c.id === 'red' ? '❤️' : c.id === 'yellow' ? '💛' : '💙'}
            </span>
          </button>
        ))}
      </div>

      {/* Hint toggle */}
      <button
        onClick={() => setShowHint(h => !h)}
        style={{
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: showHint ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
          color: showHint ? '#FFD700' : 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'Fredoka, system-ui, sans-serif',
        }}
      >
        💡 {showHint ? 'Hide Hint' : 'Need a hint?'}
      </button>

      {showHint && (
        <div style={{
          background: 'rgba(255,215,0,0.1)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '12px',
          padding: '10px 18px',
          fontSize: '12px',
          color: '#FFD700',
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          🧪 <b>Tip:</b> Red + Yellow = Orange! Yellow + Blue = Green! Red + Blue = Purple!
          Try mixing two drops of one color with one drop of another!
        </div>
      )}

      {/* Beakers row */}
      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        {CONTAINERS.map((container, i) => (
          <div key={container.id} style={{
            animation: justMixed === i ? 'shake 0.4s ease-out' : 'none',
          }}>
            <Beaker
              container={container}
              recipe={recipes[i]}
              selectedColor={selectedColor}
              onDrop={() => handleDrop(i)}
              isPouring={pouringIdx === i}
              pouringColor={pouringColor}
            />
          </div>
        ))}

        {/* Recipe book */}
        <RecipeBook discoveries={discoveries} onReset={handleReset} />
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'Fredoka, system-ui, sans-serif',
            marginTop: '8px',
          }}
        >
          ← Back to GoodBot Kids
        </button>
      )}
    </div>
  );
}
