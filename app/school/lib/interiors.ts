import { T_WALL, T_FLOOR, T_DOOR, T_BENCH, T_BOOKSHELF, T_LABBENCH, T_COUNTER, T_STAIR, T_PATH, T_GRASS, T_WINDOW } from './worldData';

export interface InteriorDef {
  id: string;
  tiles: number[][];
  // Exit door tile (local coords) → player will be placed at building door in world
  exitTile: { tx: number; ty: number };
  // Activity tile (local coords) — player walks here to trigger activity
  activityTile?: { tx: number; ty: number };
  activityId?: string | null;
}

function buildInterior(w: number, h: number, builder: (x: number, y: number) => number): number[][] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => builder(x, y))
  );
}

// ─── Main School Interior ──────────────────────────────────────────────────
// 17 wide × 11 tall
const MAIN_IW = 17, MAIN_IH = 11;
export const MAIN_SCHOOL_TILES = buildInterior(MAIN_IW, MAIN_IH, (x, y) => {
  // Walls
  if (y === 0 || y === MAIN_IH - 1) return T_WALL;
  if (x === 0 || x === MAIN_IW - 1) return T_WALL;
  // Lobby center (cols 6-10, rows 4-6)
  if (x >= 6 && x <= 10 && y >= 4 && y <= 6) return T_FLOOR;
  // Classroom 1 (left) — cols 1-5, rows 1-3
  if (x >= 1 && x <= 5 && y >= 1 && y <= 3) return T_FLOOR;
  // Classroom 2 (right of lobby) — cols 11-15, rows 1-3
  if (x >= 11 && x <= 15 && y >= 1 && y <= 3) return T_FLOOR;
  // Exit door (south wall, col 7)
  if (y === MAIN_IH - 1 && x === 7) return T_DOOR;
  // Activity in Classroom 1
  if (x === 3 && y === 2) return T_STAIR; // placeholder activity trigger
  return T_GRASS;
});

// Mark activity tiles
MAIN_SCHOOL_TILES[2][3] = 20; // special activity tile (State Finder in Class 1)

// Class 1 door (north wall of interior = south wall of building)
export const MAIN_SCHOOL_INTERIOR: InteriorDef = {
  id: 'main_school',
  tiles: MAIN_SCHOOL_TILES,
  exitTile: { tx: 7, ty: MAIN_IH - 1 },
  activityTile: { tx: 3, ty: 2 },
  activityId: 'statefinder',
};

// ─── Art Building Interior ────────────────────────────────────────────────
// 17 wide × 11 tall
const ART_IW = 17, ART_IH = 11;
export const ART_BUILDING_TILES = buildInterior(ART_IW, ART_IH, (x, y) => {
  if (y === 0 || y === ART_IH - 1) return T_WALL;
  if (x === 0 || x === ART_IW - 1) return T_WALL;
  // Open art studio floor
  if (x >= 1 && x <= ART_IW - 2 && y >= 1 && y <= ART_IH - 2) return T_FLOOR;
  // Activity area
  if (y === ART_IH - 1 && x === 7) return T_DOOR; // exit
  return T_GRASS;
});
ART_BUILDING_TILES[5][3] = 20; // Pixel Canvas activity
ART_BUILDING_TILES[5][8] = 21; // Color Lab activity

export const ART_BUILDING_INTERIOR: InteriorDef = {
  id: 'art_building',
  tiles: ART_BUILDING_TILES,
  exitTile: { tx: 7, ty: ART_IH - 1 },
  activityTile: { tx: 3, ty: 5 },
  activityId: 'pixelstudio',
};

// ─── Gym Interior ─────────────────────────────────────────────────────────
// 17 wide × 13 tall
const GYM_IW = 17, GYM_IH = 13;
export const GYM_TILES = buildInterior(GYM_IW, GYM_IH, (x, y) => {
  if (y === 0 || y === GYM_IH - 1) return T_WALL;
  if (x === 0 || x === GYM_IW - 1) return T_WALL;
  // Basketball court floor
  if (x >= 1 && x <= GYM_IW - 2 && y >= 1 && y <= GYM_IH - 2) return T_FLOOR;
  // Court lines (decorative)
  if (y === 6 && x >= 2 && x <= GYM_IW - 3) return T_PATH;
  if (x === 8 && y >= 1 && y <= GYM_IH - 2) return T_PATH;
  // Exit doors
  if (y === GYM_IH - 1 && (x === 7 || x === 9)) return T_DOOR;
  // Benches along sides
  if (y === 3 && (x === 2 || x === 3)) return T_BENCH;
  if (y === 3 && (x === 13 || x === 14)) return T_BENCH;
  if (y === GYM_IH - 3 && (x === 2 || x === 3)) return T_BENCH;
  if (y === GYM_IH - 3 && (x === 13 || x === 14)) return T_BENCH;
  return T_GRASS;
});
GYM_TILES[6][8] = 20; // Math Lab activity

export const GYM_INTERIOR: InteriorDef = {
  id: 'gym',
  tiles: GYM_TILES,
  exitTile: { tx: 7, ty: GYM_IH - 1 },
  activityTile: { tx: 8, ty: 6 },
  activityId: 'mathlab',
};

export const INTERIORS: Record<string, InteriorDef> = {
  main_school: MAIN_SCHOOL_INTERIOR,
  art_building: ART_BUILDING_INTERIOR,
  gym: GYM_INTERIOR,
};
