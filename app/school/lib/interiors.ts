import { T_WALL, T_FLOOR, T_DOOR, T_BENCH, T_BOOKSHELF, T_LABBENCH, T_COUNTER, T_STAIR, T_PATH, T_GRASS, T_WINDOW, T_FLOWER } from './worldData';

export interface InteriorDef {
  id: string;
  tiles: number[][];
  exitTile: { tx: number; ty: number };
  activityTiles?: { tx: number; ty: number; activityId: string }[];
}

function buildInterior(w: number, h: number, builder: (x: number, y: number, w: number, h: number) => number): number[][] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => builder(x, y, w, h))
  );
}

// ─── Main School ──────────────────────────────────────────────────────────
// 20 wide × 18 tall — 4 rooms + hallway
const MAIN_IW = 20, MAIN_IH = 18;
const MAIN_SCHOOL_TILES = buildInterior(MAIN_IW, MAIN_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Entrance hallway at bottom (col 9-11, row h-2)
  if (y === h - 2 && x >= 8 && x <= 11) return T_FLOOR;
  // Main N-S hallway
  if (x >= 8 && x <= 11 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Classroom 1 — top left (cols 1-7, rows 1-6)
  if (x >= 1 && x <= 7 && y >= 1 && y <= 6) return T_FLOOR;
  // Classroom 2 — top right (cols 13-19, rows 1-6)
  if (x >= 13 && x <= w - 2 && y >= 1 && y <= 6) return T_FLOOR;
  // Classroom 3 — bottom left (cols 1-7, rows 8-12)
  if (x >= 1 && x <= 7 && y >= 8 && y <= 12) return T_FLOOR;
  // Classroom 4 — bottom right (cols 13-19, rows 8-12)
  if (x >= 13 && x <= w - 2 && y >= 8 && y <= 12) return T_FLOOR;
  // Activity tiles (star tiles)
  // Classroom 1 → State Finder
  if (x === 4 && y === 4) return 20;
  // Classroom 2 → Story Machine
  if (x === 15 && y === 4) return 21;
  // Classroom 3 → Mad Libs
  if (x === 4 && y === 10) return 22;
  // Classroom 4 → Bossy R Racer
  if (x === 15 && y === 10) return 23;
  // Exit door at south wall, center of hallway
  if (y === h - 1 && x >= 9 && x <= 10) return T_DOOR;
  return T_GRASS;
});

export const MAIN_SCHOOL_INTERIOR: InteriorDef = {
  id: 'main_school',
  tiles: MAIN_SCHOOL_TILES,
  exitTile: { tx: 9, ty: MAIN_IH - 1 },
  activityTiles: [
    { tx: 4, ty: 4, activityId: 'statefinder' },
    { tx: 15, ty: 4, activityId: 'storymachine' },
    { tx: 4, ty: 10, activityId: 'madlibs' },
    { tx: 15, ty: 10, activityId: 'bossyrracer' },
  ],
};

// ─── Art Building ────────────────────────────────────────────────────────
// 22 wide × 16 tall — open studio + gallery walls
const ART_IW = 22, ART_IH = 16;
const ART_BUILDING_TILES = buildInterior(ART_IW, ART_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Open floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Display easels / art racks (decorative benches)
  if (y === 4 && x >= 3 && x <= 5) return T_BENCH;
  if (y === 4 && x >= 16 && x <= 18) return T_BENCH;
  if (y === 10 && x >= 3 && x <= 5) return T_BENCH;
  if (y === 10 && x >= 16 && x <= 18) return T_BENCH;
  // Activity tiles — Pixel Canvas (left), Color Lab (right)
  if (x === 4 && y === 7) return 20;
  if (x === 17 && y === 7) return 21;
  // Exit door at south wall
  if (y === h - 1 && x >= 10 && x <= 11) return T_DOOR;
  return T_GRASS;
});

export const ART_BUILDING_INTERIOR: InteriorDef = {
  id: 'art_building',
  tiles: ART_BUILDING_TILES,
  exitTile: { tx: 10, ty: ART_IH - 1 },
  activityTiles: [
    { tx: 4, ty: 7, activityId: 'pixelstudio' },
    { tx: 17, ty: 7, activityId: 'colorlab' },
  ],
};

// ─── Gym ─────────────────────────────────────────────────────────────────
// 24 wide × 16 tall — basketball court + bleachers
const GYM_IW = 24, GYM_IH = 16;
const GYM_TILES = buildInterior(GYM_IW, GYM_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Court floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Court lines — center circle
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
  if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 3 && y >= cy - 2 && y <= cy + 2) return T_PATH;
  // Half court line
  if (x === cx && y >= 1 && y <= h - 2) return T_PATH;
  // Three-point arcs (simplified as lines)
  if (y === 3 && x >= 4 && x <= 9) return T_PATH;
  if (y === 3 && x >= w - 10 && x <= w - 5) return T_PATH;
  // Benches
  if (y === 4 && (x === 2 || x === 3)) return T_BENCH;
  if (y === 4 && (x === w - 4 || x === w - 5)) return T_BENCH;
  if (y === h - 5 && (x === 2 || x === 3)) return T_BENCH;
  if (y === h - 5 && (x === w - 4 || x === w - 5)) return T_BENCH;
  // Activity tiles — Math Lab (left side), Sound Lab (right side)
  if (x === 4 && y === 8) return 20;
  if (x === w - 5 && y === 8) return 21;
  // Exit doors at south
  if (y === h - 1 && x >= 8 && x <= 10) return T_DOOR;
  if (y === h - 1 && x >= 13 && x <= 15) return T_DOOR;
  return T_GRASS;
});

export const GYM_INTERIOR: InteriorDef = {
  id: 'gym',
  tiles: GYM_TILES,
  exitTile: { tx: 9, ty: GYM_IH - 1 },
  activityTiles: [
    { tx: 4, ty: 8, activityId: 'mathlab' },
    { tx: GYM_IW - 5, ty: 8, activityId: 'soundlab' },
  ],
};

// ─── Library ─────────────────────────────────────────────────────────────
// 20 wide × 18 tall — rows of bookshelves + reading nooks
const LIB_IW = 20, LIB_IH = 18;
const LIBRARY_TILES = buildInterior(LIB_IW, LIB_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Main reading floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Bookshelf rows
  if (y === 5 && x >= 2 && x <= w - 3) return T_BOOKSHELF;
  if (y === 6 && x >= 2 && x <= w - 3) return T_BOOKSHELF;
  if (y === 11 && x >= 2 && x <= w - 3) return T_BOOKSHELF;
  if (y === 12 && x >= 2 && x <= w - 3) return T_BOOKSHELF;
  // Reading benches
  if (y === 4 && (x === 3 || x === 4)) return T_BENCH;
  if (y === 4 && (x === w - 5 || x === w - 6)) return T_BENCH;
  if (y === 14 && (x === 3 || x === 4)) return T_BENCH;
  if (y === 14 && (x === w - 5 || x === w - 6)) return T_BENCH;
  // Activity tiles — Read Along (left), Syllable Scooper (right)
  if (x === 3 && y === 8) return 20;
  if (x === w - 4 && y === 8) return 21;
  // Exit door
  if (y === h - 1 && x >= 9 && x <= 10) return T_DOOR;
  return T_GRASS;
});

export const LIBRARY_INTERIOR: InteriorDef = {
  id: 'library',
  tiles: LIBRARY_TILES,
  exitTile: { tx: 9, ty: LIB_IH - 1 },
  activityTiles: [
    { tx: 3, ty: 8, activityId: 'readalong' },
    { tx: LIB_IW - 4, ty: 8, activityId: 'syllablescooper' },
  ],
};

// ─── Science Building ────────────────────────────────────────────────────
// 22 wide × 16 tall — lab benches + demo area
const SCI_IW = 22, SCI_IH = 16;
const SCIENCE_TILES = buildInterior(SCI_IW, SCI_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Lab floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Lab benches (left row)
  if (y === 4 && x >= 2 && x <= 8) return T_LABBENCH;
  if (y === 5 && x >= 2 && x <= 8) return T_LABBENCH;
  // Lab benches (right row)
  if (y === 4 && x >= 13 && x <= w - 3) return T_LABBENCH;
  if (y === 5 && x >= 13 && x <= w - 3) return T_LABBENCH;
  // Demo table in center
  if (x >= 9 && x <= 12 && y >= 7 && y <= 9) return T_COUNTER;
  // Activity tiles — Animal Match (left), True/False (right)
  if (x === 4 && y === 10) return 20;
  if (x === w - 5 && y === 10) return 21;
  // Exit door
  if (y === h - 1 && x >= 10 && x <= 11) return T_DOOR;
  return T_GRASS;
});

export const SCIENCE_INTERIOR: InteriorDef = {
  id: 'science_building',
  tiles: SCIENCE_TILES,
  exitTile: { tx: 10, ty: SCI_IH - 1 },
  activityTiles: [
    { tx: 4, ty: 10, activityId: 'animalmatch' },
    { tx: SCI_IW - 5, ty: 10, activityId: 'truefalse' },
  ],
};

// ─── Cafeteria ────────────────────────────────────────────────────────────
// 24 wide × 16 tall — serving line + tables
const CAF_IW = 24, CAF_IH = 16;
const CAFETERIA_TILES = buildInterior(CAF_IW, CAF_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Main floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Serving counter along top
  if (y === 3 && x >= 4 && x <= w - 5) return T_COUNTER;
  // Tables (6 grouped seating)
  const tables = [[3,8],[8,8],[13,8],[3,12],[8,12],[13,12]];
  for (const [tx, ty] of tables) {
    if (y === ty && x >= tx && x <= tx + 3) return T_BENCH;
  }
  // Activity tiles — Sentence Builder (left), Tell Time (right)
  if (x === 5 && y === 10) return 20;
  if (x === w - 6 && y === 10) return 21;
  // Exit door
  if (y === h - 1 && x >= 11 && x <= 12) return T_DOOR;
  return T_GRASS;
});

export const CAFETERIA_INTERIOR: InteriorDef = {
  id: 'cafeteria',
  tiles: CAFETERIA_TILES,
  exitTile: { tx: 11, ty: CAF_IH - 1 },
  activityTiles: [
    { tx: 5, ty: 10, activityId: 'sentencebuilder' },
    { tx: CAF_IW - 6, ty: 10, activityId: 'telltime' },
  ],
};

// ─── Garden ───────────────────────────────────────────────────────────────
// 20 wide × 16 tall — plant beds + working tables
const GAR_IW = 20, GAR_IH = 16;
const GARDEN_TILES = buildInterior(GAR_IW, GAR_IH, (x, y, w, h) => {
  if (y === 0 || y === h - 1) return T_WALL;
  if (x === 0 || x === w - 1) return T_WALL;
  // Stone path floor
  if (x >= 1 && x <= w - 2 && y >= 1 && y <= h - 2) return T_FLOOR;
  // Garden beds (top area)
  if (y === 4 && x >= 2 && x <= 7) return T_FLOWER;
  if (y === 4 && x >= 12 && x <= 17) return T_FLOWER;
  if (y === 5 && x >= 2 && x <= 7) return T_FLOWER;
  if (y === 5 && x >= 12 && x <= 17) return T_FLOWER;
  // Working tables
  if (y === 9 && x >= 3 && x <= 7) return T_BENCH;
  if (y === 9 && x >= 12 && x <= 16) return T_BENCH;
  // Activity tile — Tell Time (center)
  if (x === 9 && y === 11) return 20;
  // Exit door
  if (y === h - 1 && x >= 9 && x <= 10) return T_DOOR;
  return T_GRASS;
});

export const GARDEN_INTERIOR: InteriorDef = {
  id: 'garden',
  tiles: GARDEN_TILES,
  exitTile: { tx: 9, ty: GAR_IH - 1 },
  activityTiles: [
    { tx: 9, ty: 11, activityId: 'telltime' },
  ],
};

export const INTERIORS: Record<string, InteriorDef> = {
  main_school: MAIN_SCHOOL_INTERIOR,
  art_building: ART_BUILDING_INTERIOR,
  gym: GYM_INTERIOR,
  library: LIBRARY_INTERIOR,
  science_building: SCIENCE_INTERIOR,
  cafeteria: CAFETERIA_INTERIOR,
  garden: GARDEN_INTERIOR,
};
