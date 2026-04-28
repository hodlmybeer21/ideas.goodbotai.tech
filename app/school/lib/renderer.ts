import {
  T_GRASS, T_PATH, T_WALL, T_FLOOR, T_DOOR, T_WATER, T_TREE,
  T_FLOWER, T_FENCE, T_BENCH, T_BOOKSHELF, T_LABBENCH, T_COUNTER,
  T_STAIR, T_WINDOW, T_MURAL, T_SIGN, TILE_SIZE,
} from './worldData';

const S = TILE_SIZE;

// ─── Tile Drawers — Pokémon GBC Style ───────────────────────────────────────

export function drawGrass(c: CanvasRenderingContext2D, wx: number, wy: number, t: number) {
  // Pokémon-style animated grass: two-tone checkerboard shimmer
  const shimmer = Math.floor(t / 400) % 2;
  c.fillStyle = shimmer === 0 ? '#50A018' : '#48A016';
  c.fillRect(wx, wy, S, S);
  // Dark patches for texture
  c.fillStyle = shimmer === 0 ? '#409014' : '#48A818';
  const offsets = [[2,2],[7,6],[4,10],[9,4],[1,8]];
  offsets.forEach(([dx, dy]) => {
    c.fillRect(wx + dx, wy + dy, 2, 2);
  });
}

export function drawPath(c: CanvasRenderingContext2D, wx: number, wy: number) {
  // Brown dirt/brick path — Pokémon overworld style
  c.fillStyle = '#C8A86C'; c.fillRect(wx, wy, S, S);
  // Brick grid
  const row = Math.floor(wy / S);
  const brickOffset = row % 2 === 0 ? 0 : S / 2;
  c.fillStyle = '#B09058';
  // Horizontal mortar lines
  c.fillRect(wx, wy + S - 1, S, 1);
  // Vertical mortar (staggered)
  const vx1 = Math.floor((wx / S + brickOffset) * 2) % 2 === 0 ? wx + S / 2 : wx;
  c.fillRect(vx1, wy, 1, S - 1);
  // Highlight top edge
  c.fillStyle = '#D8BC80';
  c.fillRect(wx, wy, S, 1);
}

export function drawWall(c: CanvasRenderingContext2D, wx: number, wy: number, isWindow = false) {
  // Brick wall with mortar lines (Pokémon building style)
  c.fillStyle = '#B87C38'; c.fillRect(wx, wy, S, S);
  // Brick rows (mortar lines)
  c.fillStyle = '#906028';
  c.fillRect(wx, wy + 2, S, 1);
  c.fillRect(wx, wy + 6, S, 1);
  // Vertical mortar staggered by row
  const row = Math.floor(wy / S);
  const stagger = row % 2 === 0 ? 0 : S / 2;
  c.fillStyle = '#906028';
  c.fillRect(wx + ((S / 2 + stagger) % S), wy, 1, 2);
  c.fillRect(wx + ((stagger) % S), wy + 3, 1, 3);
  c.fillRect(wx + ((S / 2 + stagger) % S), wy + 7, 1, 2);
  // Dark bottom edge for depth
  c.fillStyle = '#985A1A';
  c.fillRect(wx, wy + S - 1, S, 1);
  // Window
  if (isWindow) {
    c.fillStyle = '#A8D8F0';
    c.fillRect(wx + 2, wy + 2, S - 4, S - 4);
    c.fillStyle = '#88B8D0';
    c.fillRect(wx + 2, wy + 2, S - 4, 1); // top
    c.fillRect(wx + S / 2, wy + 2, 1, S - 4); // divider
  }
}

export function drawFloor(c: CanvasRenderingContext2D, wx: number, wy: number) {
  // Indoor floor — warm beige
  c.fillStyle = '#E0D8C0'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#D0C8B0';
  c.fillRect(wx, wy + S - 1, S, 1);
  c.fillRect(wx + S - 1, wy, 1, S);
  // Subtle grid
  c.fillStyle = 'rgba(0,0,0,0.04)';
  c.fillRect(wx + S / 2, wy, 1, S);
  c.fillRect(wx, wy + S / 2, S, 1);
}

export function drawDoor(c: CanvasRenderingContext2D, wx: number, wy: number) {
  // Wooden door with frame
  c.fillStyle = '#5C3A1A'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#7A5030'; c.fillRect(wx + 1, wy + 1, S - 2, S - 2);
  // Door panels
  c.fillStyle = '#6A4020';
  c.fillRect(wx + 2, wy + 2, S / 2 - 2, S / 2 - 1);
  c.fillRect(wx + S / 2 + 1, wy + 2, S / 2 - 3, S / 2 - 1);
  c.fillRect(wx + 2, wy + S / 2 + 1, S / 2 - 2, S / 2 - 2);
  c.fillRect(wx + S / 2 + 1, wy + S / 2 + 1, S / 2 - 3, S / 2 - 2);
  // Doorknob
  c.fillStyle = '#DAA520';
  c.beginPath(); c.arc(wx + S - 4, wy + S / 2, 1.5, 0, Math.PI * 2); c.fill();
}

export function drawWater(c: CanvasRenderingContext2D, wx: number, wy: number, t: number) {
  // Animated water — Pokémon pond style
  c.fillStyle = '#3898D8'; c.fillRect(wx, wy, S, S);
  // Animated wave lines
  const phase = (t * 0.004 + wx * 0.15) % (Math.PI * 2);
  const waveY = Math.sin(phase) * 1.5;
  c.strokeStyle = '#60B8F0'; c.lineWidth = 1;
  c.beginPath();
  c.moveTo(wx, wy + 4 + waveY);
  c.quadraticCurveTo(wx + S / 2, wy + 2 + waveY, wx + S, wy + 4 + waveY);
  c.stroke();
  const waveY2 = Math.sin(phase + 1) * 1.5;
  c.beginPath();
  c.moveTo(wx, wy + 8 + waveY2);
  c.quadraticCurveTo(wx + S / 2, wy + 6 + waveY2, wx + S, wy + 8 + waveY2);
  c.stroke();
}

export function drawTree(c: CanvasRenderingContext2D, wx: number, wy: number) {
  // Pokémon-style rounded bush/tree
  // Trunk
  c.fillStyle = '#6B3A1A'; c.fillRect(wx + S / 2 - 2, wy + S - 5, 4, 5);
  // Shadow under foliage
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.beginPath(); c.ellipse(wx + S / 2, wy + S - 4, 4, 2, 0, 0, Math.PI * 2); c.fill();
  // Foliage layers (dark → mid → light for depth)
  c.fillStyle = '#206010';
  c.beginPath();
  c.arc(wx + S / 2, wy + S / 2 - 1, S / 2 + 1, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#38A020';
  c.beginPath();
  c.arc(wx + S / 2 - 1, wy + S / 2 - 2, S / 2 - 1, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#50C030';
  c.beginPath();
  c.arc(wx + S / 2 - 2, wy + S / 2 - 3, S / 2 - 3, 0, Math.PI * 2);
  c.fill();
  // Highlight
  c.fillStyle = 'rgba(255,255,255,0.2)';
  c.beginPath();
  c.arc(wx + S / 2 - 2, wy + S / 2 - 4, 2, 0, Math.PI * 2);
  c.fill();
}

export function drawFlower(c: CanvasRenderingContext2D, wx: number, wy: number, seed: number) {
  // Grass base
  const shimmer = 0;
  c.fillStyle = '#50A018'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#409014';
  [[2,3],[6,5],[3,9]].forEach(([dx, dy]) => c.fillRect(wx + dx, wy + dy, 2, 2));
  // Stem
  c.fillStyle = '#308018';
  c.fillRect(wx + S / 2 - 0.5, wy + 5, 1, 4);
  // Petals
  const cols = ['#F060D0', '#FFD040', '#FFFFFF', '#FF6868', '#D878F8'];
  c.fillStyle = cols[seed % cols.length];
  const fx = wx + S / 2, fy = wy + 4;
  [[0,-2],[2,0],[0,2],[-2,0]].forEach(([dx, dy]) =>
    c.fillRect(fx + dx - 1, fy + dy - 1, 2, 2)
  );
  // Center
  c.fillStyle = '#FFD700';
  c.fillRect(fx - 1, fy - 1, 2, 2);
}

export function drawFence(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#D8C8A0'; c.fillRect(wx, wy, S, S);
  // Fence rails
  c.fillStyle = '#A89060';
  c.fillRect(wx, wy + 2, S, 2);
  c.fillRect(wx, wy + 7, S, 2);
  // Posts
  c.fillStyle = '#907840';
  for (let i = 0; i < 3; i++) c.fillRect(wx + 1 + i * 3, wy + 1, 2, S - 2);
  // Ground
  c.fillStyle = '#50A018';
  c.fillRect(wx, wy + S - 2, S, 2);
}

export function drawRoof(c: CanvasRenderingContext2D, wx: number, wy: number) {
  // Red/terracotta roof tile
  c.fillStyle = '#C03838'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#A02828';
  c.fillRect(wx, wy + S - 1, S, 1);
  c.fillRect(wx, wy + 4, S, 1);
  // Shine
  c.fillStyle = '#D84848';
  c.fillRect(wx + 1, wy + 1, S - 2, 1);
}

export function drawMural(c: CanvasRenderingContext2D, wx: number, wy: number) {
  const colors = ['#F060D0', '#60A8F0', '#FFD040', '#60D880', '#F08040'];
  const col = colors[Math.floor(wx / S + wy / S) % colors.length];
  c.fillStyle = '#E8D8B8'; c.fillRect(wx, wy, S, S);
  c.fillStyle = col; c.fillRect(wx + 1, wy + 1, S - 2, S - 2);
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(wx + 1, wy + 1, S - 2, 2);
}

export function drawSign(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#8B6914'; c.fillRect(wx + 2, wy + 3, S - 4, S - 5);
  c.fillStyle = '#D4A86A'; c.fillRect(wx + 3, wy + 4, S - 6, S - 8);
  c.fillStyle = '#6B4914';
  c.fillRect(wx + S / 2 - 1, wy + S - 4, 2, 4);
}

// Interior tiles
export function drawInteriorWall(c: CanvasRenderingContext2D, wx: number, wy: number) {
  drawWall(c, wx, wy);
}

export function drawBench(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#A07840'; c.fillRect(wx, wy + 3, S, 4);
  c.fillStyle = '#805820'; c.fillRect(wx, wy + 1, S, 2); // back
  c.fillStyle = '#603010'; // legs
  c.fillRect(wx + 1, wy + 7, 2, 3); c.fillRect(wx + S - 3, wy + 7, 2, 3);
}

export function drawBookshelf(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#8B6914'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#6B4914';
  c.fillRect(wx, wy + 2, S, 1); c.fillRect(wx, wy + 5, S, 1); c.fillRect(wx, wy + 8, S, 1);
  // Book spines
  c.fillStyle = '#E04040'; c.fillRect(wx + 1, wy + 1, 2, 1);
  c.fillStyle = '#4080E0'; c.fillRect(wx + 4, wy + 1, 2, 1);
  c.fillStyle = '#40A040'; c.fillRect(wx + 7, wy + 1, 2, 1);
  c.fillStyle = '#E0C040'; c.fillRect(wx + 1, wy + 4, 2, 1);
  c.fillStyle = '#C060E0'; c.fillRect(wx + 4, wy + 4, 2, 1);
}

export function drawLabbench(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#B8C8D0'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#98A8B8'; c.fillRect(wx, wy + S - 2, S, 2);
  // Flask
  c.fillStyle = '#60C080'; c.fillRect(wx + 3, wy + 2, 4, 3);
  c.fillStyle = '#40A060'; c.fillRect(wx + 4, wy + 1, 2, 1);
}

export function drawCounter(c: CanvasRenderingContext2D, wx: number, wy: number) {
  c.fillStyle = '#C8A878'; c.fillRect(wx, wy, S, S);
  c.fillStyle = '#A88858'; c.fillRect(wx, wy + S - 2, S, 2);
  c.fillStyle = '#E8C898'; c.fillRect(wx, wy, S, 1);
}

// Activity trigger tile
function drawActivityTile(c: CanvasRenderingContext2D, wx: number, wy: number) {
  drawFloor(c, wx, wy);
  // Glowing star
  c.fillStyle = '#FFE066'; c.beginPath();
  c.arc(wx + S / 2, wy + S / 2, 3.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#FFF8A0';
  c.beginPath(); c.arc(wx + S / 2 - 1, wy + S / 2 - 1, 1.5, 0, Math.PI * 2); c.fill();
}

// ─── Main Tile Renderer ──────────────────────────────────────────────────────
export function drawTile(c: CanvasRenderingContext2D, tileType: number, wx: number, wy: number, t = 0) {
  switch (tileType) {
    case T_GRASS:     drawGrass(c, wx, wy, t); break;
    case T_PATH:      drawPath(c, wx, wy); break;
    case T_WALL:      drawWall(c, wx, wy); break;
    case T_FLOOR:     drawFloor(c, wx, wy); break;
    case T_DOOR:      drawDoor(c, wx, wy); break;
    case T_WATER:     drawWater(c, wx, wy, t); break;
    case T_TREE:      drawTree(c, wx, wy); break;
    case T_FLOWER:    drawFlower(c, wx, wy, wx + wy); break;
    case T_FENCE:     drawFence(c, wx, wy); break;
    case T_BENCH:     drawBench(c, wx, wy); break;
    case T_BOOKSHELF: drawBookshelf(c, wx, wy); break;
    case T_LABBENCH:  drawLabbench(c, wx, wy); break;
    case T_COUNTER:   drawCounter(c, wx, wy); break;
    case T_STAIR:
    case 20:
    case 21:          drawActivityTile(c, wx, wy); break;
    case T_MURAL:     drawMural(c, wx, wy); break;
    case T_SIGN:      drawSign(c, wx, wy); break;
    case T_WINDOW:
      c.fillStyle = '#A8D8F0'; c.fillRect(wx, wy, S, S);
      c.fillStyle = '#88B8D0';
      c.fillRect(wx, wy, S, 1); c.fillRect(wx, wy + S / 2, S, 1);
      c.fillRect(wx, wy, 1, S); c.fillRect(wx + S / 2, wy, 1, S);
      break;
    default:          drawGrass(c, wx, wy, t); break;
  }
}
