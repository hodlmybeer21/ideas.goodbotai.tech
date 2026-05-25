// World dimensions
export const TILE_SIZE = 10;
export const WORLD_W = 200;  // tiles wide
export const WORLD_H = 100; // tiles tall
export const VP_W = 20;     // viewport tiles wide (fills phone screen)
export const VP_H = 14;     // viewport tiles tall (fills phone screen)
export const WORLD_PIXEL_W = WORLD_W * TILE_SIZE; // 2000
export const WORLD_PIXEL_H = WORLD_H * TILE_SIZE; // 1000

// Tile types
export const T_GRASS   = 0;
export const T_PATH    = 1;
export const T_WALL    = 2;
export const T_FLOOR   = 3;
export const T_DOOR    = 4;
export const T_WATER   = 5;
export const T_TREE    = 6;
export const T_FLOWER  = 7;
export const T_FENCE    = 8;
export const T_BENCH    = 9;
export const T_BOOKSHELF = 10;
export const T_LABBENCH = 11;
export const T_COUNTER  = 12;
export const T_STAIR    = 13;
export const T_WINDOW   = 14;
export const T_ROOF     = 15;
export const T_MURAL    = 16;
export const T_SIGN     = 17;

// Tile names for debugging
export const TILE_NAMES: Record<number, string> = {
  [T_GRASS]:     'GRASS',
  [T_PATH]:      'PATH',
  [T_WALL]:      'WALL',
  [T_FLOOR]:     'FLOOR',
  [T_DOOR]:      'DOOR',
  [T_WATER]:     'WATER',
  [T_TREE]:      'TREE',
  [T_FLOWER]:    'FLOWER',
  [T_FENCE]:     'FENCE',
  [T_BENCH]:     'BENCH',
  [T_BOOKSHELF]: 'BOOKSHELF',
  [T_LABBENCH]:  'LABBENCH',
  [T_COUNTER]:   'COUNTER',
  [T_STAIR]:     'STAIR',
  [T_WINDOW]:    'WINDOW',
  [T_ROOF]:      'ROOF',
  [T_MURAL]:     'MURAL',
  [T_SIGN]:      'SIGN',
};

// Zones
export interface Zone {
  id: string;
  name: string;
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  emoji: string;
  desc: string;
}

export const ZONES: Zone[] = [
  {
    id: 'plaza',
    name: 'GoodBot Campus',
    x1: 0, y1: 0, x2: WORLD_W - 1, y2: WORLD_H - 1,
    color: '#F0F0F0', emoji: '🏫',
    desc: 'Welcome to GoodBot Campus! Explore the buildings.',
  },
];

export function getZone(tx: number, ty: number): Zone | null {
  return ZONES.find(z => tx >= z.x1 && tx <= z.x2 && ty >= z.y1 && ty <= z.y2) || null;
}

// Buildings (interior zones)
export interface Building {
  id: string;
  name: string;
  emoji: string;
  x1: number; y1: number; x2: number; y2: number;
  // Interior map dims (local coords)
  iW: number; iH: number;
  // Door tile positions (world coords) that trigger entry
  doors: { tx: number; ty: number }[];
  exits: { tx: number; ty: number }[]; // inside building, exit door tile
  activityId: string | null;
  desc: string;
}

export const BUILDINGS: Building[] = [
  // ── West Cluster (x: 5–25) ──────────────────────────────────────────────
  {
    id: 'main_school',
    name: 'Main School',
    emoji: '🏫',
    x1: 5, y1: 35, x2: 22, y2: 50,
    iW: 17, iH: 15,
    doors: [{ tx: 10, ty: 35 }, { tx: 14, ty: 35 }, { tx: 18, ty: 35 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'The heart of GoodBot Campus!',
  },
  {
    id: 'art_building',
    name: 'Art Building',
    emoji: '🎨',
    x1: 5, y1: 55, x2: 22, y2: 68,
    iW: 17, iH: 13,
    doors: [{ tx: 13, ty: 55 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'Color, creativity, and messy fun!',
  },
  // ── East Cluster (x: 110–130) ─────────────────────────────────────────────
  {
    id: 'gym',
    name: 'Gymnasium',
    emoji: '🏀',
    x1: 110, y1: 5, x2: 130, y2: 20,
    iW: 20, iH: 15,
    doors: [{ tx: 116, ty: 20 }, { tx: 123, ty: 20 }],
    exits: [{ tx: 9, ty: 10 }],
    activityId: null,
    desc: 'Run, jump, and play!',
  },
  {
    id: 'library',
    name: 'Library',
    emoji: '📚',
    x1: 110, y1: 35, x2: 130, y2: 50,
    iW: 20, iH: 15,
    doors: [{ tx: 118, ty: 50 }],
    exits: [{ tx: 9, ty: 8 }],
    activityId: null,
    desc: 'Books, stories, and quiet corners.',
  },
  {
    id: 'science_building',
    name: 'Science Lab',
    emoji: '🔬',
    x1: 110, y1: 55, x2: 130, y2: 70,
    iW: 20, iH: 15,
    doors: [{ tx: 118, ty: 55 }],
    exits: [{ tx: 9, ty: 8 }],
    activityId: null,
    desc: 'Experiments and discoveries!',
  },
];

export function getBuildingAt(tx: number, ty: number): Building | null {
  return BUILDINGS.find(b => tx >= b.x1 && tx <= b.x2 && ty >= b.y1 && ty <= b.y2) || null;
}

export function getBuildingDoor(tx: number, ty: number): Building | null {
  for (const b of BUILDINGS) {
    for (const d of b.doors) {
      if (d.tx === tx && d.ty === ty) return b;
    }
  }
  return null;
}

// ─── World Map Builder ───────────────────────────────────────────────────────
export function buildWorld(): number[][] {
  const W = WORLD_W, H = WORLD_H;
  const m: number[][] = Array.from({ length: H }, () => new Array(W).fill(T_GRASS));

  function fill(x1: number, y1: number, x2: number, y2: number, tile: number) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
      if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = tile;
    }
  }

  function rect(x1: number, y1: number, x2: number, y2: number, tile: number) {
    fill(x1, y1, x2, y2, tile);
  }

  // ─── Plaza / Paths ──────────────────────────────────────────────────────
  // Main horizontal path (runs east-west across middle)
  fill(0, 16, W - 1, 16, T_PATH);
  // Vertical path north (through school entrance)
  fill(28, 16, 32, 18, T_PATH);
  // West path (north-south to art building)
  fill(8, 16, 10, 18, T_PATH);
  // East path
  fill(41, 16, 43, 18, T_PATH);
  // South connecting path
  fill(22, 30, 38, 32, T_PATH);
  // Wide plaza area
  fill(18, 15, 42, 17, T_PATH);

  // ─── Main School Building (exterior wall) ───────────────────────────────
  fill(22, 18, 38, 18, T_WALL); // south face (entry)
  fill(22, 19, 22, 28, T_WALL); // west wall
  fill(38, 19, 38, 28, T_WALL); // east wall
  fill(22, 28, 38, 28, T_WALL); // north face
  // Windows on school walls
  for (let x = 23; x <= 37; x += 3) {
    if (x !== 28 && x !== 31 && x !== 35) {
      m[18][x] = T_WINDOW;
      m[28][x] = T_WINDOW;
    }
  }
  // School doors
  m[18][28] = T_DOOR;
  m[18][31] = T_DOOR;
  m[18][35] = T_DOOR;

  // ─── Art Building ──────────────────────────────────────────────────────
  fill(2, 18, 18, 18, T_WALL);
  fill(2, 19, 2, 28, T_WALL);
  fill(18, 19, 18, 28, T_WALL);
  fill(2, 28, 18, 28, T_WALL);
  // Murals on art building exterior
  for (let x = 3; x <= 17; x += 4) m[19][x] = T_MURAL;
  for (let x = 4; x <= 16; x += 4) m[27][x] = T_MURAL;
  // Art door
  m[18][8] = T_DOOR;

  // ─── Gym Building ───────────────────────────────────────────────────────
  fill(22, 2, 38, 2, T_WALL);   // south face (entry)
  fill(22, 3, 22, 14, T_WALL);  // west wall
  fill(38, 3, 38, 14, T_WALL);  // east wall
  fill(22, 14, 38, 14, T_WALL); // north face
  // Gym windows
  for (let x = 23; x <= 37; x += 4) m[14][x] = T_WINDOW;
  // Gym doors
  m[14][28] = T_DOOR;
  m[14][33] = T_DOOR;

  // ─── Outdoor benches ───────────────────────────────────────────────────
  m[30][15] = T_BENCH;
  m[32][15] = T_BENCH;
  m[14][22] = T_BENCH;
  m[14][24] = T_BENCH;

  // ─── Decorative signs ──────────────────────────────────────────────────
  m[16][15] = T_SIGN;
  m[32][22] = T_SIGN;

  // ─── Trees ─────────────────────────────────────────────────────────────
  const trees: [number, number][] = [
    [0,0],[1,0],[W-1,0],[W-2,0],
    [0,1],[W-1,1],
    [0,15],[1,15],[W-1,15],[W-2,15],
    [0,17],[1,17],[W-1,17],[W-2,17],
    [0,29],[1,29],[W-1,29],[W-2,29],
    [0,30],[1,30],[W-1,30],[W-2,30],
    [0,49],[1,49],[W-1,49],[W-2,49],
    [15,0],[15,1],[15,2],[15,3],
    [45,0],[45,1],[45,2],[45,3],
    [50,10],[51,11],[52,12],
    [50,15],[52,15],
    [15,40],[16,41],[17,42],
    [45,40],[46,41],[47,42],
    [10,35],[11,36],[12,37],
    [48,35],[49,36],[50,37],
    [5,43],[6,44],[7,45],
    [52,43],[53,44],[54,45],
  ];
  trees.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = T_TREE; });

  // ─── Flowers ───────────────────────────────────────────────────────────
  const flowers: [number, number][] = [
    [14,5],[14,15],[14,25],[14,35],[14,45],[14,55],
    [17,5],[17,25],[17,45],[17,55],
    [20,3],[20,47],
    [25,1],[33,1],[40,1],
    [29,16],[30,16],[31,16],[32,16],
    [35,16],[36,16],[37,16],[38,16],
    [43,5],[43,15],[43,25],[43,35],
    [47,8],[47,12],[47,16],
    [3,30],[5,32],[10,33],[15,34],
    [45,34],[50,33],[55,32],[57,30],
    [20,48],[40,48],
  ];
  flowers.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = T_FLOWER; });

  // ─── Fence borders ─────────────────────────────────────────────────────
  // North border
  for (let x = 0; x < W; x++) { if (m[0][x] === T_GRASS) m[0][x] = T_FENCE; }
  // South border
  for (let x = 0; x < W; x++) { if (m[H-1][x] === T_GRASS) m[H-1][x] = T_FENCE; }
  // West border
  for (let y = 0; y < H; y++) { if (m[y][0] === T_GRASS) m[y][0] = T_FENCE; }
  // East border
  for (let y = 0; y < H; y++) { if (m[y][W-1] === T_GRASS) m[y][W-1] = T_FENCE; }

  return m;
}
