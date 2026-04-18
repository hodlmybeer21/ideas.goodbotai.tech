'use client';

import { useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE_SIZE = 36;
const GRID_W = 24;
const GRID_H = 18;
const CANVAS_W = GRID_W * TILE_SIZE; // 864
const CANVAS_H = GRID_H * TILE_SIZE; // 648

// Tile IDs
const T_HALL  = 0;
const T_WALL  = 1;
const T_ART   = 2;
const T_GEO   = 3;
const T_MUSIC = 4;
const T_SCI   = 5;
const T_GYM   = 6;
const T_LIB   = 7;
const T_DOOR  = 8;
const T_LOC   = 9;

// Tile colors
const TILE_COLORS: Record<number, string> = {
  [T_HALL]:  '#D4D0C8',
  [T_WALL]:  '#5C4033',
  [T_ART]:   '#FFF8DC',
  [T_GEO]:   '#E6F0FF',
  [T_MUSIC]: '#FFFACD',
  [T_SCI]:   '#E8FFE8',
  [T_GYM]:   '#DEB887',
  [T_LIB]:   '#F5F5DC',
  [T_DOOR]:  '#8B4513',
  [T_LOC]:   '#778899',
};

const PLAYER_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'];

// ─── Map Data ─────────────────────────────────────────────────────────────────
function buildMap(): number[][] {
  const m: number[][] = [];
  for (let y = 0; y < GRID_H; y++) m.push(new Array(GRID_W).fill(T_WALL));

  // Row 1 & 2: top rooms
  for (let x = 1; x <= 6; x++) { m[1][x] = T_ART;   m[2][x] = T_ART; }
  for (let x = 8; x <= 14; x++) { m[1][x] = T_GEO;   m[2][x] = T_GEO; }
  for (let x = 16; x <= 22; x++) { m[1][x] = T_MUSIC; m[2][x] = T_MUSIC; }

  // Row 3: walls + doors
  for (let x = 1; x <= 6; x++) m[3][x] = T_ART;
  m[3][7] = T_DOOR;
  for (let x = 8; x <= 14; x++) m[3][x] = T_GEO;
  m[3][15] = T_DOOR;
  for (let x = 16; x <= 22; x++) m[3][x] = T_MUSIC;

  // Rows 4-5: room floors
  for (let x = 1; x <= 6; x++) { m[4][x] = T_ART;   m[5][x] = T_ART; }
  for (let x = 8; x <= 14; x++) { m[4][x] = T_GEO;   m[5][x] = T_GEO; }
  for (let x = 16; x <= 22; x++) { m[4][x] = T_MUSIC; m[5][x] = T_MUSIC; }

  // Row 6: walls + doors
  for (let x = 1; x <= 6; x++) m[6][x] = T_ART;
  m[6][7] = T_DOOR;
  for (let x = 8; x <= 14; x++) m[6][x] = T_GEO;
  m[6][15] = T_DOOR;
  for (let x = 16; x <= 22; x++) m[6][x] = T_MUSIC;

  // Rows 1-2: top rooms (art, geography, music) — full floors
  // (already set above: rows 1-6 for all three rooms)

  // Row 3: upper rooms — doors at col 7 (art↔hallway) and col 15 (geography↔hallway)
  for (let x = 1; x <= 6; x++) m[3][x] = T_ART;
  m[3][7] = T_DOOR;  // art-hallway door
  for (let x = 8; x <= 14; x++) m[3][x] = T_GEO;
  m[3][15] = T_DOOR; // geography-hallway door
  for (let x = 16; x <= 22; x++) m[3][x] = T_MUSIC;

  // Rows 4-5: room floors
  for (let x = 1; x <= 6; x++) { m[4][x] = T_ART; m[5][x] = T_ART; }
  for (let x = 8; x <= 14; x++) { m[4][x] = T_GEO; m[5][x] = T_GEO; }
  for (let x = 16; x <= 22; x++) { m[4][x] = T_MUSIC; m[5][x] = T_MUSIC; }

  // Row 6: upper rooms — doors at col 7 (art↔hallway) and col 15 (geography↔hallway)
  for (let x = 1; x <= 6; x++) m[6][x] = T_ART;
  m[6][7] = T_DOOR;
  for (let x = 8; x <= 14; x++) m[6][x] = T_GEO;
  m[6][15] = T_DOOR;
  for (let x = 16; x <= 22; x++) m[6][x] = T_MUSIC;

  // Row 7: hallway connecting upper and lower sections
  for (let x = 7; x <= 16; x++) m[7][x] = T_HALL;
  m[7][7]  = T_DOOR; // south door from art room
  m[7][15] = T_DOOR; // south door from geography room

  // Row 8: science lab, hallway, library — wide hallway down the middle
  for (let x = 1; x <= 6; x++) m[8][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[8][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[8][x] = T_LIB;

  // Row 9: same as row 8
  for (let x = 1; x <= 6; x++) m[9][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[9][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[9][x] = T_LIB;

  // Row 10: science lab, hallway, library
  for (let x = 1; x <= 6; x++) m[10][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[10][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[10][x] = T_LIB;

  // Row 11: science lab, hallway, library
  for (let x = 1; x <= 6; x++) m[11][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[11][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[11][x] = T_LIB;

  // Row 12: science lab, hallway, library
  for (let x = 1; x <= 6; x++) m[12][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[12][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[12][x] = T_LIB;

  // Row 13: science lab, hallway, library — door at col 7 to gym (south)
  for (let x = 1; x <= 6; x++) m[13][x] = T_SCI;
  for (let x = 7; x <= 16; x++) m[13][x] = T_HALL;
  for (let x = 17; x <= 22; x++) m[13][x] = T_LIB;

  // Row 14: gym (north section) + south entrance hall
  for (let x = 1; x <= 10; x++) m[14][x] = T_GYM;
  for (let x = 11; x <= 22; x++) m[14][x] = T_HALL;
  // gym south door at row 14, cols 11-12 — opens INTO entrance hall area
  m[14][11] = T_DOOR; m[14][12] = T_DOOR;

  // Row 15: gym floor + south entrance hall
  for (let x = 1; x <= 10; x++) m[15][x] = T_GYM;
  for (let x = 11; x <= 22; x++) m[15][x] = T_HALL;

  // Row 16: gym + entrance (ground floor)
  for (let x = 1; x <= 10; x++) m[16][x] = T_GYM;
  for (let x = 11; x <= 22; x++) m[16][x] = T_HALL;

  // Lockers along walls in the middle hallway (rows 8-12)
  for (let y = 8; y <= 12; y++) {
    m[y][7]  = T_LOC;  // left wall between science lab and hallway
    m[y][16] = T_LOC;  // right wall between hallway and library
  }
  // Lockers in upper hallway (rows 1-6) — only non-door rows
  for (let y = 1; y <= 6; y++) {
    if (y !== 3 && y !== 6) {
      m[y][7]  = T_LOC;
      m[y][15] = T_LOC;
    }
  }

  // Gym south wall doors (row 17 = map boundary, gym spans cols 1-10)
  m[17][4] = T_DOOR; m[17][5] = T_DOOR; m[17][6] = T_DOOR; m[17][7] = T_DOOR; m[17][8] = T_DOOR;

  return m;
}

// ─── Room Definitions ─────────────────────────────────────────────────────────
const ROOMS = [
  { id: 'art',      name: 'Art Room',        color: '#FFF8DC', emoji: '🎨', floor: T_ART,
    bounds: {x1:1,y1:1,x2:6,y2:6},
    desc: 'Color your world! Tap to fill pixels and create pictures.' },
  { id: 'geo',      name: 'Geography Room', color: '#E6F0FF', emoji: '🗺️', floor: T_GEO,
    bounds: {x1:8,y1:1,x2:14,y2:6},
    desc: 'Explore maps, discover continents, and learn about our amazing planet!' },
  { id: 'music',    name: 'Music Room',      color: '#FFFACD', emoji: '🎵', floor: T_MUSIC,
    bounds: {x1:16,y1:1,x2:22,y2:6},
    desc: 'Make rhythms, learn notes, and create your own songs!' },
  { id: 'science',  name: 'Science Lab',     color: '#E8FFE8', emoji: '🔬', floor: T_SCI,
    bounds: {x1:1,y1:8,x2:6,y2:13},
    desc: 'Mix, measure, and experiment! Science is all around you.' },
  { id: 'library',  name: 'Library',         color: '#F5F5DC', emoji: '📚', floor: T_LIB,
    bounds: {x1:17,y1:8,x2:22,y2:13},
    desc: 'Open a book and travel anywhere! Stories are waiting for you.' },
  { id: 'gym',      name: 'Gym',             color: '#DEB887', emoji: '🏀', floor: T_GYM,
    bounds: {x1:1,y1:14,x2:10,y2:16},
    desc: 'Run, jump, and play! Keeping active is super fun.' },
];

function getRoomAtTile(tx: number, ty: number) {
  return ROOMS.find(r => tx >= r.bounds.x1 && tx <= r.bounds.x2 && ty >= r.bounds.y1 && ty <= r.bounds.y2) || null;
}

function getCurrentRoom(tx: number, ty: number): string {
  const room = getRoomAtTile(tx, ty);
  return room ? room.name : 'Hallway';
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Player {
  tx: number;       // current tile x
  ty: number;       // current tile y
  px: number;       // pixel x (smooth render)
  py: number;       // pixel y
  color: string;
  moving: boolean;
  targetPx: number;
  targetPy: number;
  direction: string;
}

interface DoorPrompt {
  room: typeof ROOMS[number];
  x: number;
  y: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchoolGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const c = ctx; // non-null alias for nested functions
    const cvs = canvas; // non-null alias for nested functions

    const map = buildMap();
    const PLAYER_SPEED = 4;

    // Pick a random player color
    const playerColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

    // Player state
    const player: Player = {
      tx: 12, ty: 9,
      px: 12 * TILE_SIZE + TILE_SIZE / 2,
      py: 9 * TILE_SIZE + TILE_SIZE / 2,
      color: playerColor,
      moving: false,
      targetPx: 12 * TILE_SIZE + TILE_SIZE / 2,
      targetPy: 9 * TILE_SIZE + TILE_SIZE / 2,
      direction: 'S',
    };

    let modalOpen = false;
    let activeRoom: typeof ROOMS[number] | null = null;
    let doorPrompt: DoorPrompt | null = null;

    // Click-to-move queue
    let clickTarget: {tx:number,ty:number} | null = null;

    // ─── Drawing Helpers ───────────────────────────────────────────────────
    function drawTile(x: number, y: number, tileId: number) {
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      c.fillStyle = TILE_COLORS[tileId] || '#FF00FF';
      c.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Wall texture
      if (tileId === T_WALL) {
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
        c.fillStyle = 'rgba(255,255,255,0.08)';
        c.fillRect(px, py, TILE_SIZE, 2);
      }

      // Door frame detail
      if (tileId === T_DOOR) {
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.fillRect(px + 4, py + 2, TILE_SIZE - 8, 4);
        c.fillRect(px + 4, py + TILE_SIZE - 6, TILE_SIZE - 8, 4);
      }

      // Locker lines
      if (tileId === T_LOC) {
        c.fillStyle = 'rgba(0,0,0,0.1)';
        c.fillRect(px + TILE_SIZE / 2 - 1, py + 2, 2, TILE_SIZE - 4);
      }
    }

    function drawPlayer() {
      const { px, py, color } = player;
      const r = 14;

      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.beginPath();
      c.ellipse(px + 2, py + r + 2, r, r * 0.4, 0, 0, Math.PI * 2);
      c.fill();

      // Body
      c.fillStyle = color;
      c.beginPath();
      c.arc(px, py, r, 0, Math.PI * 2);
      c.fill();

      // Outline
      c.strokeStyle = 'rgba(0,0,0,0.3)';
      c.lineWidth = 2;
      c.stroke();

      // Eyes
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(px - 5, py - 3, 4, 0, Math.PI * 2);
      c.arc(px + 5, py - 3, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#333';
      c.beginPath();
      c.arc(px - 5, py - 3, 2, 0, Math.PI * 2);
      c.arc(px + 5, py - 3, 2, 0, Math.PI * 2);
      c.fill();

      // Smile
      c.strokeStyle = '#333';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(px, py + 2, 6, 0.2, Math.PI - 0.2);
      c.stroke();
    }

    function drawMinimap() {
      const mw = 80, mh = 60;
      const mx = CANVAS_W - mw - 10;
      const my = CANVAS_H - mh - 30;
      const sx = mw / GRID_W;
      const sy = mh / GRID_H;

      // BG
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.roundRect(mx - 2, my - 2, mw + 4, mh + 4, 6);
      c.fill();

      // Tiles
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const tile = map[y][x];
          if (tile === T_WALL) {
            c.fillStyle = '#5C4033';
          } else if (tile === T_DOOR) {
            c.fillStyle = '#8B4513';
          } else {
            c.fillStyle = 'rgba(255,255,255,0.15)';
          }
          c.fillRect(mx + x * sx, my + y * sy, sx + 0.5, sy + 0.5);
        }
      }

      // Player dot
      c.fillStyle = player.color;
      c.beginPath();
      c.arc(mx + player.tx * sx + sx / 2, my + player.ty * sy + sy / 2, 3, 0, Math.PI * 2);
      c.fill();
    }

    function drawCompass(dir: string) {
      const cx = CANVAS_W - 30;
      const cy = 30;
      const label = { N: '↑', S: '↓', E: '→', W: '←' }[dir] || '↓';

      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.beginPath();
      c.arc(cx, cy, 18, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#fff';
      c.font = 'bold 18px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, cx, cy);
    }

    function drawUI() {
      // Room label (top-left)
      const room = getRoomAtTile(player.tx, player.ty);
      const roomName = room ? room.name : 'Hallway';
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.roundRect(10, 10, 160, 32, 8);
      c.fill();
      c.fillStyle = '#fff';
      c.font = 'bold 14px sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(room ? `${room.emoji} ${roomName}` : `🏫 ${roomName}`, 20, 26);

      // Compass (top-right)
      drawCompass(player.direction);

      // Controls hint (bottom-left)
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.roundRect(10, CANVAS_H - 30, 190, 24, 6);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.font = '11px sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('WASD to move  ·  Click to walk', 18, CANVAS_H - 19);

      // Minimap
      drawMinimap();

      // Door prompt
      if (doorPrompt && !modalOpen) {
        const promptText = `Press E to enter ${doorPrompt.room.name}`;
        c.font = 'bold 13px sans-serif';
        const tw = c.measureText(promptText).width;
        const px = doorPrompt.x * TILE_SIZE + TILE_SIZE / 2;
        const py = doorPrompt.y * TILE_SIZE - 14;
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.roundRect(px - tw / 2 - 8, py - 10, tw + 16, 22, 6);
        c.fill();
        c.fillStyle = '#FFE066';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(promptText, px, py);
      }
    }

    function drawModal() {
      if (!modalOpen || !activeRoom) return;

      const mw = 360, mh = 280;
      const mx = (CANVAS_W - mw) / 2;
      const my = (CANVAS_H - mh) / 2;

      // Overlay
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Box
      c.fillStyle = activeRoom.color;
      c.strokeStyle = 'rgba(0,0,0,0.3)';
      c.lineWidth = 3;
      c.roundRect(mx, my, mw, mh, 16);
      c.fill();
      c.stroke();

      // Emoji
      c.font = '64px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(activeRoom.emoji, CANVAS_W / 2, my + 70);

      // Title
      c.fillStyle = '#333';
      c.font = 'bold 22px sans-serif';
      c.fillText(activeRoom.name, CANVAS_W / 2, my + 130);

      // Description
      c.fillStyle = '#555';
      c.font = '14px sans-serif';
      const words = activeRoom.desc.split(' ');
      let line = '', lineY = my + 160;
      for (const word of words) {
        const test = line + word + ' ';
        if (c.measureText(test).width > mw - 40) {
          c.fillText(line.trim(), CANVAS_W / 2, lineY);
          line = word + ' ';
          lineY += 20;
        } else {
          line = test;
        }
      }
      c.fillText(line.trim(), CANVAS_W / 2, lineY);

      // Coming soon
      c.fillStyle = '#888';
      c.font = 'italic 12px sans-serif';
      c.fillText('This activity is coming soon!', CANVAS_W / 2, lineY + 30);

      // Back button
      const bx = CANVAS_W / 2 - 60, by = my + mh - 45;
      c.fillStyle = 'rgba(0,0,0,0.15)';
      c.roundRect(bx, by, 120, 32, 8);
      c.fill();
      c.fillStyle = '#333';
      c.font = 'bold 13px sans-serif';
      c.fillText('← Back Outside', CANVAS_W / 2, by + 16);

      // Store button bounds for click detection
      (canvas as any).__modalBtn = { bx, by, bw: 120, bh: 32 };
    }

    function openModal(room: typeof ROOMS[number]) {
      modalOpen = true;
      activeRoom = room;
      player.moving = false;
      clickTarget = null;
    }

    function closeModal() {
      modalOpen = false;
      activeRoom = null;
    }

    // ─── Movement Logic ─────────────────────────────────────────────────────
    function canWalk(tx: number, ty: number): boolean {
      if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return false;
      const tile = map[ty][tx];
      return tile !== T_WALL && tile !== T_LOC;
    }

    function moveToward(tx: number, ty: number) {
      if (!canWalk(tx, ty)) return;
      player.tx = tx;
      player.ty = ty;
      player.targetPx = tx * TILE_SIZE + TILE_SIZE / 2;
      player.targetPy = ty * TILE_SIZE + TILE_SIZE / 2;
      player.moving = true;
    }

    function checkDoorPrompt() {
      const { tx, ty } = player;
      // Check adjacent tiles for door + room
      const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
      for (const [dx, dy] of dirs) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
        if (map[ny][nx] !== T_DOOR) continue;
        // Find which room this door belongs to
        for (const room of ROOMS) {
          // A door is adjacent to a room if one of the room bounds is adjacent
          if (
            (nx === room.bounds.x2 + 1 || nx === room.bounds.x1 - 1) &&
            ny >= room.bounds.y1 && ny <= room.bounds.y2
          ) {
            doorPrompt = { room, x: nx, y: ny };
            return;
          }
          if (
            (ny === room.bounds.y2 + 1 || ny === room.bounds.y1 - 1) &&
            nx >= room.bounds.x1 && nx <= room.bounds.x2
          ) {
            doorPrompt = { room, x: nx, y: ny };
            return;
          }
        }
      }
      doorPrompt = null;
    }

    function updatePlayer() {
      if (modalOpen) return;

      // If no target, try click-to-move
      if (!player.moving && clickTarget) {
        const { tx, ty } = clickTarget;
        if (tx === player.tx && ty === player.ty) {
          clickTarget = null;
        } else {
          // Move horizontally first, then vertically
          if (player.tx !== tx) {
            const dx = player.tx < tx ? 1 : -1;
            if (canWalk(player.tx + dx, player.ty)) {
              moveToward(player.tx + dx, player.ty);
            }
          } else if (player.ty !== ty) {
            const dy = player.ty < ty ? 1 : -1;
            if (canWalk(player.tx, player.ty + dy)) {
              moveToward(player.tx, player.ty + dy);
            }
          }
          if (player.tx === tx && player.ty === ty) clickTarget = null;
        }
      }

      // Smooth movement toward target
      if (player.moving) {
        const dx = player.targetPx - player.px;
        const dy = player.targetPy - player.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PLAYER_SPEED) {
          player.px = player.targetPx;
          player.py = player.targetPy;
          player.moving = false;
        } else {
          player.px += (dx / dist) * PLAYER_SPEED;
          player.py += (dy / dist) * PLAYER_SPEED;
        }
      }

      checkDoorPrompt();
    }

    // ─── Input Handling ─────────────────────────────────────────────────────
    const keys: Set<string> = new Set();
    let lastMoveTime = 0;
    const MOVE_DELAY = 160;

    function handleKeyDown(e: KeyboardEvent) {
      if (modalOpen) {
        if (e.key === 'Escape') closeModal();
        return;
      }
      keys.add(e.key.toLowerCase());
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keys.delete(e.key.toLowerCase());
    }

    function processKeys(now: number) {
      if (modalOpen || player.moving) return;
      if (now - lastMoveTime < MOVE_DELAY) return;

      let dx = 0, dy = 0;
      if (keys.has('arrowup')    || keys.has('w')) { dy = -1; player.direction = 'N'; }
      if (keys.has('arrowdown')  || keys.has('s')) { dy =  1; player.direction = 'S'; }
      if (keys.has('arrowleft')  || keys.has('a')) { dx = -1; player.direction = 'W'; }
      if (keys.has('arrowright') || keys.has('d')) { dx =  1; player.direction = 'E'; }

      if (dx !== 0 || dy !== 0) {
        const nx = player.tx + dx;
        const ny = player.ty + dy;
        if (canWalk(nx, ny)) {
          moveToward(nx, ny);
          lastMoveTime = now;
        }
      }
    }

    function handleClick(e: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (modalOpen) {
        // Check back button
        const btn = (canvas as any).__modalBtn;
        if (btn && mx >= btn.bx && mx <= btn.bx + btn.bw && my >= btn.by && my <= btn.by + btn.bh) {
          closeModal();
        }
        return;
      }

      const tx = Math.floor(mx / TILE_SIZE);
      const ty = Math.floor(my / TILE_SIZE);
      if (canWalk(tx, ty)) {
        clickTarget = { tx, ty };
      }
    }

    function handleKeyPress(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'e' && doorPrompt && !modalOpen) {
        openModal(doorPrompt.room);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keypress', handleKeyPress);
    cvs.addEventListener('click', handleClick);

    // ─── Game Loop ───────────────────────────────────────────────────────────
    let animId: number;
    function loop(ts: number) {
      processKeys(ts);
      updatePlayer();

      // Clear
      c.fillStyle = '#1a1a2e';
      c.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 1. Floor tiles
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          drawTile(x, y, map[y][x]);
        }
      }

      // 2. Player
      drawPlayer();

      // 3. UI
      if (!modalOpen) drawUI();

      // 4. Modal
      drawModal();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keypress', handleKeyPress);
      cvs.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      gap: '12px',
    }}>
      {/* Title Bar */}
      <div style={{
        color: '#fff',
        fontSize: '22px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        letterSpacing: '1px',
      }}>
        🏫 GoodBot School
      </div>

      {/* Canvas wrapper */}
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '3px solid rgba(255,255,255,0.2)',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
}
