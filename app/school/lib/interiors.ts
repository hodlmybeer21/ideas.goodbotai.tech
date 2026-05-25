import { T_WALL, T_FLOOR, T_DOOR, T_BENCH, T_BOOKSHELF, T_LABBENCH, T_COUNTER, T_STAIR, T_PATH, T_GRASS, T_WINDOW, T_SIGN, T_POND, T_WATER } from './worldData';

export interface InteriorDef {
  id: string;
  tiles: number[][];
  exitTile: { tx: number; ty: number };
  // Optional: multiple activity triggers per building
  activities?: { tx: number; ty: number; activityId: string }[];
}

function buildInterior(w: number, h: number, builder: (x: number, y: number) => number): number[][] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => builder(x, y))
  );
}

// ─── ACTIVITY TILE IDs ──────────────────────────────────────────────────
const A_PIXELSTUDIO = 20;
const A_COLORLAB    = 21;
const A_STATEMAP    = 22;
const A_READALONG   = 23;
const A_SYLLABLE    = 24;
const A_MATHLAB     = 25;
const A_ANIMALMATCH = 26;
const A_TRUEFALSE   = 27;
const A_SENTENCE    = 28;
const A_TELLTIME    = 29;
const A_STORY       = 30;
const A_MADLIBS     = 31;
const A_SOUNDBOARD  = 32;
const A_COINCOUNT   = 33;
const A_BOSSYR      = 34;

// ────────────────────────────────────────────────────────────────────────
// MAIN SCHOOL — 21 wide × 15 tall
// Two entrances, grand hallway, 4 classrooms
// ────────────────────────────────────────────────────────────────────────
const MS_IW = 21, MS_IH = 15;
const MAIN_SCHOOL_TILES = buildInterior(MS_IW, MS_IH, (x, y) => {
  if (y === 0 || y === MS_IH - 1) return T_WALL;
  if (x === 0 || x === MS_IW - 1) return T_WALL;
  // Grand hallway floor (center)
  if (x >= 4 && x <= 16 && y >= 7 && y <= 13) return T_FLOOR;
  // Classroom 1 (left wing, top)
  if (x >= 1 && x <= 6 && y >= 1 && y <= 5) return T_FLOOR;
  // Classroom 2 (right wing, top)
  if (x >= 14 && x <= 19 && y >= 1 && y <= 5) return T_FLOOR;
  // Classroom 3 (left wing, bottom)
  if (x >= 1 && x <= 6 && y >= 9 && y <= 13) return T_FLOOR;
  // Classroom 4 (right wing, bottom)
  if (x >= 14 && x <= 19 && y >= 9 && y <= 13) return T_FLOOR;
  // Doors on south wall
  if (y === MS_IH - 1 && x === 8) return T_DOOR;  // left entrance
  if (y === MS_IH - 1 && x === 12) return T_DOOR; // right entrance
  // Classroom interior doors
  if (y === 6 && x >= 1 && x <= 6) return T_DOOR; // Class 1 door
  if (y === 6 && x >= 14 && x <= 19) return T_DOOR; // Class 2 door
  if (y === 8 && x >= 1 && x <= 6) return T_DOOR; // Class 3 door
  if (y === 8 && x >= 14 && x <= 19) return T_DOOR; // Class 4 door
  return T_GRASS;
});

// Activity tiles inside classrooms
MAIN_SCHOOL_TILES[3][3]  = A_STATEMAP;    // Classroom 1 — State Finder
MAIN_SCHOOL_TILES[11][3] = A_MADLIBS;     // Classroom 3 — Mad Libs
MAIN_SCHOOL_TILES[3][16] = A_STORY;       // Classroom 2 — Story Machine
MAIN_SCHOOL_TILES[11][16] = A_BOSSYR;     // Classroom 4 — Bossy R Racer

export const MAIN_SCHOOL_INTERIOR: InteriorDef = {
  id: 'main_school',
  tiles: MAIN_SCHOOL_TILES,
  exitTile: { tx: 8, ty: MS_IH - 1 },
  activities: [
    { tx: 3,  ty: 3,  activityId: 'statefinder' },
    { tx: 3,  ty: 11, activityId: 'madlibs' },
    { tx: 16, ty: 3,  activityId: 'storymachine' },
    { tx: 16, ty: 11, activityId: 'bossyr' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// ART BUILDING — 19 wide × 16 tall
// Open studio with activity stations
// ────────────────────────────────────────────────────────────────────────
const ART_IW = 19, ART_IH = 16;
const ART_BUILDING_TILES = buildInterior(ART_IW, ART_IH, (x, y) => {
  if (y === 0 || y === ART_IH - 1) return T_WALL;
  if (x === 0 || x === ART_IW - 1) return T_WALL;
  // Open studio floor
  if (x >= 1 && x <= ART_IW - 2 && y >= 1 && y <= ART_IH - 2) return T_FLOOR;
  // Paint supply shelves along walls
  if (y === 2 && (x <= 3 || x >= ART_IW - 4)) return T_BOOKSHELF;
  if (y === 3 && (x <= 3 || x >= ART_IW - 4)) return T_BOOKSHELF;
  // Display easels (decorative benches repurposed)
  if (y === 7 && (x === 3 || x === 15)) return T_BENCH;
  if (y === 10 && (x === 3 || x === 15)) return T_BENCH;
  // Exit door south
  if (y === ART_IH - 1 && x === 9) return T_DOOR;
  return T_GRASS;
});

ART_BUILDING_TILES[4][4]  = A_PIXELSTUDIO; // Pixel Canvas station
ART_BUILDING_TILES[4][14] = A_COLORLAB;     // Color Lab station
ART_BUILDING_TILES[10][4] = A_PIXELSTUDIO; // Second pixel station
ART_BUILDING_TILES[10][14] = A_COLORLAB;   // Second color station

export const ART_BUILDING_INTERIOR: InteriorDef = {
  id: 'art_building',
  tiles: ART_BUILDING_TILES,
  exitTile: { tx: 9, ty: ART_IH - 1 },
  activities: [
    { tx: 4,  ty: 4,  activityId: 'pixelstudio' },
    { tx: 14, ty: 4,  activityId: 'colorlab' },
    { tx: 4,  ty: 10, activityId: 'pixelstudio' },
    { tx: 14, ty: 10, activityId: 'colorlab' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// GYM — 25 wide × 14 tall
// Basketball court, bleachers, activity corner
// ────────────────────────────────────────────────────────────────────────
const GYM_IW = 25, GYM_IH = 14;
const GYM_TILES = buildInterior(GYM_IW, GYM_IH, (x, y) => {
  if (y === 0 || y === GYM_IH - 1) return T_WALL;
  if (x === 0 || x === GYM_IW - 1) return T_WALL;
  // Court floor
  if (x >= 1 && x <= GYM_IW - 2 && y >= 1 && y <= GYM_IH - 2) return T_FLOOR;
  // Court lines — center circle
  const cx = Math.floor(GYM_IW / 2), cy = Math.floor(GYM_IH / 2);
  const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (distFromCenter >= 2.4 && distFromCenter <= 2.7) return T_PATH;
  // Half court line
  if (y === cy && x >= 2 && x <= GYM_IW - 3) return T_PATH;
  // Three-point arcs (decorative)
  if (y >= 2 && y <= 5 && (x === 3 || x === GYM_IW - 4)) return T_PATH;
  if (y >= 2 && y <= 5 && (x === 4 || x === GYM_IW - 5)) return T_PATH;
  // Bleachers (top of gym)
  if (y === 2 && x >= 2 && x <= 7) return T_BENCH;
  if (y === 2 && x >= 17 && x <= 22) return T_BENCH;
  // Exit doors (south wall)
  if (y === GYM_IH - 1 && x === 9) return T_DOOR;
  if (y === GYM_IH - 1 && x === 15) return T_DOOR;
  return T_GRASS;
});

GYM_TILES[7][12] = A_MATHLAB;   // Math Lab corner
GYM_TILES[5][5]  = A_SOUNDBOARD; // Sound Lab — drum kit

export const GYM_INTERIOR: InteriorDef = {
  id: 'gym',
  tiles: GYM_TILES,
  exitTile: { tx: 9, ty: GYM_IH - 1 },
  activities: [
    { tx: 12, ty: 7,  activityId: 'mathlab' },
    { tx: 5,  ty: 5,  activityId: 'soundlab' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// LIBRARY — 19 wide × 17 tall
// Tall bookshelves, reading nooks, cozy corners
// ────────────────────────────────────────────────────────────────────────
const LIB_IW = 19, LIB_IH = 17;
const LIBRARY_TILES = buildInterior(LIB_IW, LIB_IH, (x, y) => {
  if (y === 0 || y === LIB_IH - 1) return T_WALL;
  if (x === 0 || x === LIB_IW - 1) return T_WALL;
  // Main reading floor
  if (x >= 1 && x <= LIB_IW - 2 && y >= 1 && y <= LIB_IH - 2) return T_FLOOR;
  // Central bookshelves (2 rows of shelves)
  if (y === 5 && x >= 3 && x <= 15) return T_BOOKSHELF;
  if (y === 6 && x >= 3 && x <= 15) return T_BOOKSHELF;
  if (y === 10 && x >= 3 && x <= 15) return T_BOOKSHELF;
  if (y === 11 && x >= 3 && x <= 15) return T_BOOKSHELF;
  // Side reading nooks
  if (x <= 2 && (y === 3 || y === 8 || y === 13)) return T_BENCH;
  if (x >= LIB_IW - 3 && (y === 3 || y === 8 || y === 13)) return T_BENCH;
  // Exit door south
  if (y === LIB_IH - 1 && x === 9) return T_DOOR;
  // Owl librarian nook (northeast corner)
  // Study tables in open areas
  if (y === 3 && x >= 8 && x <= 10) return T_COUNTER;
  if (y === 13 && x >= 8 && x <= 10) return T_COUNTER;
  return T_GRASS;
});

LIBRARY_TILES[2][4]  = A_READALONG;  // Left reading nook
LIBRARY_TILES[2][14] = A_SYLLABLE;   // Right reading nook
LIBRARY_TILES[8][4]  = A_READALONG;  // Center-left study
LIBRARY_TILES[8][14] = A_SYLLABLE;   // Center-right study

export const LIBRARY_INTERIOR: InteriorDef = {
  id: 'library',
  tiles: LIBRARY_TILES,
  exitTile: { tx: 9, ty: LIB_IH - 1 },
  activities: [
    { tx: 4,  ty: 2,  activityId: 'readalong' },
    { tx: 14, ty: 2,  activityId: 'syllable' },
    { tx: 4,  ty: 8,  activityId: 'readalong' },
    { tx: 14, ty: 8,  activityId: 'syllable' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// SCIENCE BUILDING — 20 wide × 16 tall
// Lab benches, experiment stations, bubbling tanks
// ────────────────────────────────────────────────────────────────────────
const SCI_IW = 20, SCI_IH = 16;
const SCIENCE_TILES = buildInterior(SCI_IW, SCI_IH, (x, y) => {
  if (y === 0 || y === SCI_IH - 1) return T_WALL;
  if (x === 0 || x === SCI_IW - 1) return T_WALL;
  // Lab floor
  if (x >= 1 && x <= SCI_IW - 2 && y >= 1 && y <= SCI_IH - 2) return T_FLOOR;
  // Lab benches (left row)
  if (y === 4 && x >= 2 && x <= 8)  return T_LABBENCH;
  if (y === 5 && x >= 2 && x <= 8)  return T_LABBENCH;
  // Lab benches (right row)
  if (y === 4 && x >= 11 && x <= 17) return T_LABBENCH;
  if (y === 5 && x >= 11 && x <= 17) return T_LABBENCH;
  // Central experiment table
  if (y === 9 && x >= 7 && x <= 12) return T_COUNTER;
  if (y === 10 && x >= 7 && x <= 12) return T_COUNTER;
  // Storage cabinets on walls
  if (y === 2 && (x <= 3 || x >= SCI_IW - 4)) return T_LABBENCH;
  // Exit door south
  if (y === SCI_IH - 1 && x === 9) return T_DOOR;
  // Safety signage
  if (y === 1 && x === 5)  return T_SIGN;
  if (y === 1 && x === 14) return T_SIGN;
  return T_GRASS;
});

SCIENCE_TILES[3][4]  = A_ANIMALMATCH; // Left bench — Animal Match
SCIENCE_TILES[3][15] = A_TRUEFALSE;   // Right bench — True/False
SCIENCE_TILES[9][9]  = A_ANIMALMATCH; // Center table — Animal Match
SCIENCE_TILES[12][4] = A_TRUEFALSE;   // Lower bench — True/False

export const SCIENCE_BUILDING_INTERIOR: InteriorDef = {
  id: 'science_building',
  tiles: SCIENCE_TILES,
  exitTile: { tx: 9, ty: SCI_IH - 1 },
  activities: [
    { tx: 4,  ty: 3,  activityId: 'animalmatch' },
    { tx: 15, ty: 3,  activityId: 'truefalse' },
    { tx: 9,  ty: 9,  activityId: 'animalmatch' },
    { tx: 4,  ty: 12, activityId: 'truefalse' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// CAFETERIA — 24 wide × 15 tall
// Serving line, dining tables, activity corner
// ────────────────────────────────────────────────────────────────────────
const CAF_IW = 24, CAF_IH = 15;
const CAFETERIA_TILES = buildInterior(CAF_IW, CAF_IH, (x, y) => {
  if (y === 0 || y === CAF_IH - 1) return T_WALL;
  if (x === 0 || x === CAF_IW - 1) return T_WALL;
  // Dining floor
  if (x >= 1 && x <= CAF_IW - 2 && y >= 1 && y <= CAF_IH - 2) return T_FLOOR;
  // Serving counter (top wall)
  if (y === 2 && x >= 2 && x <= 10) return T_COUNTER;
  if (y === 3 && x >= 2 && x <= 10) return T_COUNTER;
  // Menu board
  if (y === 1 && x === 6) return T_SIGN;
  // Dining tables
  if (y === 6 && x >= 4 && x <= 8)  return T_BENCH;
  if (y === 6 && x >= 12 && x <= 16) return T_BENCH;
  if (y === 9 && x >= 4 && x <= 8)  return T_BENCH;
  if (y === 9 && x >= 12 && x <= 16) return T_BENCH;
  if (y === 12 && x >= 4 && x <= 8)  return T_BENCH;
  if (y === 12 && x >= 12 && x <= 16) return T_BENCH;
  // Exit doors south
  if (y === CAF_IH - 1 && x === 8)  return T_DOOR;
  if (y === CAF_IH - 1 && x === 15) return T_DOOR;
  return T_GRASS;
});

CAFETERIA_TILES[5][10] = A_SENTENCE;   // Near serving line — Sentence Builder
CAFETERIA_TILES[10][10] = A_TELLTIME;  // Center dining — Tell Time

export const CAFETERIA_INTERIOR: InteriorDef = {
  id: 'cafeteria',
  tiles: CAFETERIA_TILES,
  exitTile: { tx: 8, ty: CAF_IH - 1 },
  activities: [
    { tx: 10, ty: 5,  activityId: 'sentencebuilder' },
    { tx: 10, ty: 10, activityId: 'telltime' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// GARDEN — 19 wide × 15 tall
// Greenhouse interior with plant stations
// ────────────────────────────────────────────────────────────────────────
const GAR_IW = 19, GAR_IH = 15;
const GARDEN_TILES = buildInterior(GAR_IW, GAR_IH, (x, y) => {
  if (y === 0 || y === GAR_IH - 1) return T_WALL;
  if (x === 0 || x === GAR_IW - 1) return T_WALL;
  // Greenhouse floor (stone/path)
  if (x >= 1 && x <= GAR_IW - 2 && y >= 1 && y <= GAR_IH - 2) return T_FLOOR;
  // Raised plant beds
  if (y === 4 && x >= 3 && x <= 8)  return T_LABBENCH;
  if (y === 4 && x >= 10 && x <= 15) return T_LABBENCH;
  if (y === 8 && x >= 3 && x <= 8)  return T_LABBENCH;
  if (y === 8 && x >= 10 && x <= 15) return T_LABBENCH;
  // Watering station
  if (y === 12 && x >= 8 && x <= 10) return T_COUNTER;
  // Seed display
  if (y === 1 && x === 9) return T_SIGN;
  // Garden benches
  if (y === 6 && (x === 3 || x === 15)) return T_BENCH;
  // Exit door south
  if (y === GAR_IH - 1 && x === 9) return T_DOOR;
  return T_GRASS;
});

// Garden has no interior activities — it's outdoor exploration
// Activity is triggered by walking near the pond in the exterior map
// But we include a tile for Tell Time near the greenhouse table
GARDEN_TILES[6][9] = A_TELLTIME; // Garden bench — Tell Time

export const GARDEN_INTERIOR: InteriorDef = {
  id: 'garden',
  tiles: GARDEN_TILES,
  exitTile: { tx: 9, ty: GAR_IH - 1 },
  activities: [
    { tx: 9,  ty: 6,  activityId: 'telltime' },
  ],
};

// ────────────────────────────────────────────────────────────────────────
// INTERIOR REGISTRY
// ────────────────────────────────────────────────────────────────────────
export const INTERIORS: Record<string, InteriorDef> = {
  main_school:       MAIN_SCHOOL_INTERIOR,
  art_building:       ART_BUILDING_INTERIOR,
  gym:                GYM_INTERIOR,
  library:            LIBRARY_INTERIOR,
  science_building:   SCIENCE_BUILDING_INTERIOR,
  cafeteria:          CAFETERIA_INTERIOR,
  garden:             GARDEN_INTERIOR,
};