// World dimensions
export const TILE_SIZE = 10;
export const WORLD_W = 120;  // tiles (doubled from 60)
export const WORLD_H = 80;   // tiles (doubled from 50)
export const VP_W = 120;     // viewport tiles wide (10 more per side)
export const VP_H = 80;     // viewport tiles tall (10 more per side)
export const WORLD_PIXEL_W = WORLD_W * TILE_SIZE; // 1200
export const WORLD_PIXEL_H = WORLD_H * TILE_SIZE; // 800

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
  {
    id: 'main_school',
    name: 'Main School',
    emoji: '🏫',
    x1: 44, y1: 40, x2: 76, y2: 58,
    iW: 17, iH: 11,
    doors: [{ tx: 56, ty: 40 }, { tx: 60, ty: 40 }, { tx: 66, ty: 40 }, { tx: 71, ty: 40 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'The heart of GoodBot Campus! Classrooms and learning await.',
  },
  {
    id: 'art_building',
    name: 'Art Building',
    emoji: '🎨',
    x1: 2, y1: 40, x2: 35, y2: 58,
    iW: 17, iH: 11,
    doors: [{ tx: 15, ty: 40 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'Color, creativity, and messy fun!',
  },
  {
    id: 'gym',
    name: 'Gymnasium',
    emoji: '🏀',
    x1: 44, y1: 5, x2: 76, y2: 28,
    iW: 17, iH: 13,
    doors: [{ tx: 56, ty: 28 }, { tx: 66, ty: 28 }],
    exits: [{ tx: 7, ty: 10 }],
    activityId: null,
    desc: 'Run, jump, and play! Keeping active is fun.',
  },
  {
    id: 'library',
    name: 'Library',
    emoji: '📚',
    x1: 2, y1: 10, x2: 35, y2: 25,
    iW: 17, iH: 11,
    doors: [{ tx: 15, ty: 25 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'Books, stories, and quiet corners for curious minds.',
  },
  {
    id: 'science_building',
    name: 'Science Lab',
    emoji: '🔬',
    x1: 85, y1: 10, x2: 118, y2: 25,
    iW: 17, iH: 11,
    doors: [{ tx: 95, ty: 25 }],
    exits: [{ tx: 7, ty: 8 }],
    activityId: null,
    desc: 'Experiments and discoveries for young scientists!',
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

  // ─── Extended Plaza / Paths ──────────────────────────────────────────────
  // Main horizontal path (runs east-west across middle)
  fill(0, 35, W - 1, 35, T_PATH);
  // Wide plaza area around center
  fill(40, 33, 80, 37, T_PATH);
  // Vertical path north (through school entrance)
  fill(56, 35, 64, 40, T_PATH);
  // West path (north-south to art building)
  fill(15, 35, 18, 42, T_PATH);
  // East path
  fill(88, 35, 92, 42, T_PATH);
  // South connecting path
  fill(40, 55, 80, 57, T_PATH);
  // Extended north path
  fill(55, 8, 65, 35, T_PATH);
  // West extension
  fill(0, 30, 15, 40, T_PATH);
  // East extension
  fill(92, 30, W - 1, 40, T_PATH);

  // ─── Main School Building (exterior wall) ───────────────────────────────
  fill(44, 40, 76, 40, T_WALL); // south face (entry)
  fill(44, 41, 44, 58, T_WALL); // west wall
  fill(76, 41, 76, 58, T_WALL); // east wall
  fill(44, 58, 76, 58, T_WALL); // north face
  // Windows on school walls
  for (let x = 45; x <= 75; x += 4) {
    if (x !== 56 && x !== 60 && x !== 66 && x !== 71) {
      m[40][x] = T_WINDOW;
      m[58][x] = T_WINDOW;
    }
  }
  // School doors
  m[40][56] = T_DOOR;
  m[40][60] = T_DOOR;
  m[40][66] = T_DOOR;
  m[40][71] = T_DOOR;

  // ─── Art Building ──────────────────────────────────────────────────────
  fill(2, 40, 35, 40, T_WALL);
  fill(2, 41, 2, 58, T_WALL);
  fill(35, 41, 35, 58, T_WALL);
  fill(2, 58, 35, 58, T_WALL);
  // Murals on art building exterior
  for (let x = 4; x <= 33; x += 5) m[41][x] = T_MURAL;
  for (let x = 5; x <= 32; x += 5) m[57][x] = T_MURAL;
  // Art door
  m[40][15] = T_DOOR;

  // ─── Gym Building ───────────────────────────────────────────────────────
  fill(44, 5, 76, 5, T_WALL);   // south face (entry)
  fill(44, 6, 44, 28, T_WALL);  // west wall
  fill(76, 6, 76, 28, T_WALL);  // east wall
  fill(44, 28, 76, 28, T_WALL); // north face
  // Gym windows
  for (let x = 45; x <= 75; x += 5) m[28][x] = T_WINDOW;
  // Gym doors
  m[28][56] = T_DOOR;
  m[28][66] = T_DOOR;

  // ─── Library Building (new - west side) ─────────────────────────────────
  fill(2, 10, 35, 10, T_WALL);
  fill(2, 11, 2, 25, T_WALL);
  fill(35, 11, 35, 25, T_WALL);
  fill(2, 25, 35, 25, T_WALL);
  for (let x = 4; x <= 33; x += 6) m[11][x] = T_WINDOW;
  m[25][15] = T_DOOR;
  // Library books exterior
  for (let x = 5; x <= 30; x += 4) m[24][x] = T_BOOKSHELF;

  // ─── Science Building (new - east side) ─────────────────────────────────
  fill(85, 10, 118, 10, T_WALL);
  fill(85, 11, 85, 25, T_WALL);
  fill(118, 11, 118, 25, T_WALL);
  fill(85, 25, 118, 25, T_WALL);
  for (let x = 86; x <= 116; x += 6) m[11][x] = T_WINDOW;
  m[25][95] = T_DOOR;
  // Science lab benches exterior
  for (let x = 88; x <= 114; x += 5) m[24][x] = T_LABBENCH;

  // ─── Outdoor benches ───────────────────────────────────────────────────
  m[30][34] = T_BENCH;
  m[32][34] = T_BENCH;
  m[68][34] = T_BENCH;
  m[70][34] = T_BENCH;
  m[15][30] = T_BENCH;
  m[95][30] = T_BENCH;
  m[30][57] = T_BENCH;
  m[70][57] = T_BENCH;

  // ─── Decorative signs ──────────────────────────────────────────────────
  m[20][34] = T_SIGN;
  m[80][34] = T_SIGN;
  m[50][5] = T_SIGN;
  m[50][60] = T_SIGN;

  // ─── Pond / Water Feature ──────────────────────────────────────────────
  // Small pond in the south area
  fill(10, 65, 18, 70, T_WATER);
  fill(11, 64, 17, 65, T_WATER);
  fill(12, 66, 14, 69, T_WATER);
  // Path to pond
  fill(14, 57, 16, 64, T_PATH);

  // ─── Trees (extended) ─────────────────────────────────────────────────
  const trees: [number, number][] = [
    // Border trees - north
    [0,0],[1,0],[2,0],[3,0],[W-4,0],[W-3,0],[W-2,0],[W-1,0],
    [0,1],[W-1,1],[0,2],[W-1,2],
    // Border trees - south
    [0,H-1],[1,H-1],[2,H-1],[3,H-1],[W-4,H-1],[W-3,H-1],[W-2,H-1],[W-1,H-1],
    [0,H-2],[W-1,H-2],[0,H-3],[W-1,H-3],
    // Border trees - west
    [0,10],[0,11],[0,12],[0,H-4],[0,H-5],
    // Border trees - east
    [W-1,10],[W-1,11],[W-1,12],[W-1,H-4],[W-1,H-5],
    // Scattered trees
    [25,8],[26,9],[27,8],
    [90,8],[91,9],[92,8],
    [5,20],[7,22],[9,21],
    [110,20],[112,22],[114,21],
    [5,50],[7,52],[9,51],
    [110,50],[112,52],[114,51],
    [25,62],[27,64],[29,63],
    [90,62],[92,64],[94,63],
    [45,70],[50,72],[55,70],[60,73],[65,71],[70,70],
    [15,70],[20,75],[25,78],
    [95,70],[100,75],[105,78],
    // Trees near buildings
    [40,39],[41,39],
    [79,39],[80,39],
    [1,39],[36,39],
    [84,39],[119,39],
    // Trees near paths
    [38,35],[38,33],
    [82,35],[82,33],
  ];
  trees.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = T_TREE; });

  // ─── Flowers (extended) ────────────────────────────────────────────────
  const flowers: [number, number][] = [
    // Near buildings
    [42,10],[42,20],[42,30],
    [78,10],[78,20],[78,30],
    [10,35],[20,35],[30,35],
    [90,35],[100,35],[110,35],
    // Plaza flowers
    [45,32],[50,32],[55,32],[60,32],[65,32],[70,32],[75,32],
    [45,38],[50,38],[55,38],[60,38],[65,38],[70,38],[75,38],
    // Path side flowers
    [5,33],[5,37],[8,33],[8,37],
    [95,33],[95,37],[98,33],[98,37],
    [55,6],[60,6],[65,6],
    [55,42],[65,42],
    // South area flowers
    [25,55],[30,55],[35,55],
    [85,55],[90,55],[95,55],
    [5,60],[10,62],[15,64],
    [105,60],[110,62],[115,64],
    // Around pond
    [8,63],[12,63],[20,68],[22,66],
    // Extended area
    [3,15],[5,18],[8,22],[3,28],
    [117,15],[115,18],[112,22],[117,28],
    [50,75],[55,77],[60,75],[65,77],[70,75],
    [3,70],[5,73],[8,76],
    [117,70],[115,73],[112,76],
  ];
  flowers.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = T_FLOWER; });

  // ─── Fence borders (only where grass) ──────────────────────────────────
  // North border
  for (let x = 4; x < W - 4; x++) { if (m[3][x] === T_GRASS) m[3][x] = T_FENCE; }
  // South border
  for (let x = 4; x < W - 4; x++) { if (m[H-3][x] === T_GRASS) m[H-3][x] = T_FENCE; }
  // West border
  for (let y = 4; y < H - 4; y++) { if (m[y][3] === T_GRASS) m[y][3] = T_FENCE; }
  // East border
  for (let y = 4; y < H - 4; y++) { if (m[y][W-4] === T_GRASS) m[y][W-4] = T_FENCE; }

  // ─── Courtyard garden between buildings ─────────────────────────────────
  fill(42, 42, 78, 50, T_GRASS);
  // Garden path
  fill(58, 42, 62, 50, T_PATH);
  // Garden flowers
  for (let x = 44; x <= 56; x += 3) for (let y = 43; y <= 49; y += 3) {
    if (m[y][x] === T_GRASS) m[y][x] = T_FLOWER;
  }
  for (let x = 64; x <= 76; x += 3) for (let y = 43; y <= 49; y += 3) {
    if (m[y][x] === T_GRASS) m[y][x] = T_FLOWER;
  }
  // Garden benches
  m[46][46] = T_BENCH;
  m[74][46] = T_BENCH;
  m[46][48] = T_BENCH;
  m[74][48] = T_BENCH;

  return m;
}
