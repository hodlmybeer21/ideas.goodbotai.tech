// World dimensions
export const TILE_SIZE = 10;
export const WORLD_W = 100;  // tiles wide
export const WORLD_H = 70;   // tiles tall
export const VP_W = 80;      // viewport tiles wide
export const VP_H = 60;      // viewport tiles tall
export const WORLD_PIXEL_W = WORLD_W * TILE_SIZE; // 1000
export const WORLD_PIXEL_H = WORLD_H * TILE_SIZE; // 700

// Tile types
export const T_GRASS      = 0;
export const T_PATH       = 1;
export const T_WALL       = 2;
export const T_FLOOR      = 3;
export const T_DOOR       = 4;
export const T_WATER      = 5;
export const T_TREE       = 6;
export const T_FLOWER     = 7;
export const T_FENCE      = 8;
export const T_BENCH      = 9;
export const T_BOOKSHELF  = 10;
export const T_LABBENCH   = 11;
export const T_COUNTER    = 12;
export const T_STAIR      = 13;
export const T_WINDOW     = 14;
export const T_ROOF       = 15;
export const T_MURAL      = 16;
export const T_SIGN       = 17;
export const T_LAKE       = 18;
export const T_BRIDGE     = 19;
export const T_HEDGE      = 20;
export const T_STATUE     = 21;
export const T_FOUNTAIN   = 22;
export const T_POND       = 23;
export const T_ROCK       = 24;

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
  [T_LAKE]:      'LAKE',
  [T_BRIDGE]:    'BRIDGE',
  [T_HEDGE]:     'HEDGE',
  [T_STATUE]:    'STATUE',
  [T_FOUNTAIN]:  'FOUNTAIN',
  [T_POND]:      'POND',
  [T_ROCK]:      'ROCK',
};

// ─── Zones ────────────────────────────────────────────────────────────────
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
    name: 'GoodBot Plaza',
    x1: 28, y1: 17, x2: 72, y2: 22,
    color: '#F0E68C', emoji: '🏫',
    desc: 'The heart of campus! Central plaza connecting all buildings.',
  },
  {
    id: 'north_campus',
    name: 'North Campus',
    x1: 22, y1: 0, x2: 78, y2: 16,
    color: '#A8D5A2', emoji: '🏃',
    desc: 'Athletic fields, gym, and open green space.',
  },
  {
    id: 'west_campus',
    name: 'West Campus',
    x1: 0, y1: 18, x2: 24, y2: 48,
    color: '#C8A87B', emoji: '🎨',
    desc: 'Art Building, Library, and cozy tree-lined paths.',
  },
  {
    id: 'east_campus',
    name: 'East Campus',
    x1: 75, y1: 18, x2: 99, y2: 48,
    color: '#A8C8E8', emoji: '🔬',
    desc: 'Science Building and experimentation labs.',
  },
  {
    id: 'south_campus',
    name: 'South Campus',
    x1: 22, y1: 49, x2: 78, y2: 69,
    color: '#E8C8A8', emoji: '🍽️',
    desc: 'Cafeteria, Garden, and outdoor dining area.',
  },
  {
    id: 'lake',
    name: 'Crystal Lake',
    x1: 60, y1: 22, x2: 95, y2: 48,
    color: '#7EC8E8', emoji: '🌊',
    desc: 'A beautiful lake with bridges and walking paths.',
  },
  {
    id: 'forest',
    name: 'Whispering Woods',
    x1: 0, y1: 0, x2: 20, y2: 17,
    color: '#8FBC8F', emoji: '🌲',
    desc: 'A quiet forest trail with trees and wildlife.',
  },
];

export function getZone(tx: number, ty: number): Zone | null {
  return ZONES.find(z => tx >= z.x1 && tx <= z.x2 && ty >= z.y1 && ty <= z.y2) || null;
}

// ─── Buildings ──────────────────────────────────────────────────────────
export interface Building {
  id: string;
  name: string;
  emoji: string;
  x1: number; y1: number; x2: number; y2: number;
  iW: number; iH: number;
  doors: { tx: number; ty: number }[];
  exits: { tx: number; ty: number }[];
  activityId: string | null;
  desc: string;
}

export const BUILDINGS: Building[] = [
  // ── Main School (center) ──────────────────────────────────────────────
  {
    id: 'main_school',
    name: 'Main School',
    emoji: '🏫',
    x1: 32, y1: 18, x2: 52, y2: 32,
    iW: 21, iH: 15,
    doors: [{ tx: 39, ty: 18 }, { tx: 44, ty: 18 }],
    exits: [{ tx: 10, ty: 12 }],
    activityId: null,
    desc: 'The heart of GoodBot Campus! Classrooms and learning await.',
  },
  // ── Art Building (west) ────────────────────────────────────────────────
  {
    id: 'art_building',
    name: 'Art Building',
    emoji: '🎨',
    x1: 2, y1: 20, x2: 20, y2: 35,
    iW: 19, iH: 16,
    doors: [{ tx: 9, ty: 20 }],
    exits: [{ tx: 9, ty: 14 }],
    activityId: null,
    desc: 'Color, creativity, and messy fun!',
  },
  // ── Gym (north) ────────────────────────────────────────────────────────
  {
    id: 'gym',
    name: 'Gymnasium',
    emoji: '🏀',
    x1: 22, y1: 2, x2: 46, y2: 15,
    iW: 25, iH: 14,
    doors: [{ tx: 30, ty: 15 }, { tx: 38, ty: 15 }],
    exits: [{ tx: 12, ty: 12 }],
    activityId: null,
    desc: 'Run, jump, and play! Keeping active is fun.',
  },
  // ── Library (northwest) ────────────────────────────────────────────────
  {
    id: 'library',
    name: 'Library',
    emoji: '📚',
    x1: 2, y1: 2, x2: 20, y2: 18,
    iW: 19, iH: 17,
    doors: [{ tx: 9, ty: 18 }],
    exits: [{ tx: 9, ty: 15 }],
    activityId: null,
    desc: 'Quiet corners, tall shelves, and endless stories.',
  },
  // ── Science Building (east) ─────────────────────────────────────────────
  {
    id: 'science_building',
    name: 'Science Building',
    emoji: '🔬',
    x1: 78, y1: 20, x2: 97, y2: 35,
    iW: 20, iH: 16,
    doors: [{ tx: 87, ty: 20 }],
    exits: [{ tx: 9, ty: 14 }],
    activityId: null,
    desc: 'Experiments, discoveries, and big ideas.',
  },
  // ── Cafeteria (south) ─────────────────────────────────────────────────
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    emoji: '🍽️',
    x1: 32, y1: 50, x2: 55, y2: 64,
    iW: 24, iH: 15,
    doors: [{ tx: 40, ty: 50 }, { tx: 47, ty: 50 }],
    exits: [{ tx: 11, ty: 13 }],
    activityId: null,
    desc: 'Good food, good friends, and learning about nutrition!',
  },
  // ── Garden (southeast) ────────────────────────────────────────────────
  {
    id: 'garden',
    name: 'Garden',
    emoji: '🌻',
    x1: 62, y1: 50, x2: 80, y2: 64,
    iW: 19, iH: 15,
    doors: [{ tx: 70, ty: 50 }],
    exits: [{ tx: 9, ty: 13 }],
    activityId: null,
    desc: 'Flowers, vegetables, and the sound of bees buzzing.',
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

// ─── World Map Builder ─────────────────────────────────────────────────────
export function buildWorld(): number[][] {
  const W = WORLD_W, H = WORLD_H;
  const m: number[][] = Array.from({ length: H }, () => new Array(W).fill(T_GRASS));

  function fill(x1: number, y1: number, x2: number, y2: number, tile: number) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
      if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = tile;
    }
  }

  // ════════════════════════════════════════════════════════════
  // PATHS — campus walkways
  // ════════════════════════════════════════════════════════════

  // Main east-west spine path (central campus)
  fill(0, 18, W - 1, 18, T_PATH);
  fill(0, 19, W - 1, 19, T_PATH);

  // North-south path through plaza
  fill(38, 17, 46, 22, T_PATH);

  // West campus path (north-south)
  fill(9, 18, 11, 48, T_PATH);
  fill(11, 48, 20, 49, T_PATH); // connector to south

  // East campus path
  fill(86, 18, 88, 48, T_PATH);
  fill(78, 48, 88, 49, T_PATH);

  // South campus paths
  fill(22, 49, 78, 49, T_PATH);
  fill(38, 49, 40, 64, T_PATH);
  fill(55, 49, 57, 64, T_PATH);

  // Gym entrance path (north campus)
  fill(25, 15, 43, 15, T_PATH);
  fill(30, 15, 30, 17, T_PATH);
  fill(38, 15, 38, 17, T_PATH);

  // Lake paths (north campus connecting to east)
  fill(60, 22, 95, 22, T_PATH);
  fill(60, 22, 60, 48, T_PATH);

  // Forest trail
  fill(15, 1, 15, 17, T_PATH);
  fill(0, 10, 15, 10, T_PATH);

  // ════════════════════════════════════════════════════════════
  // FOREST / WHISPERING WOODS (northwest corner)
  // ════════════════════════════════════════════════════════════
  // Trees forming forest
  for (let x = 0; x <= 20; x++) {
    for (let y = 0; y <= 17; y++) {
      if (x === 0 || x === 20 || y === 0 || y === 17) m[y][x] = T_TREE;
    }
  }
  // Interior forest trees
  const forestTrees: [number, number][] = [
    [2,2],[4,3],[6,2],[8,4],[3,7],[7,5],[11,3],[13,6],
    [2,12],[5,10],[9,9],[14,12],[4,15],[12,15],
    [15,5],[16,8],[17,3],[18,7],[19,10],
    [3,4],[8,14],[14,4],[6,8],
  ];
  forestTrees.forEach(([y,x]) => { if (m[y][x] === T_GRASS) m[y][x] = T_TREE; });
  // Flowers in forest
  const forestFlowers: [number, number][] = [
    [4,6],[7,4],[10,6],[13,8],[3,10],[9,12],[11,5],[5,14],
  ];
  forestFlowers.forEach(([y,x]) => { if (m[y][x] === T_GRASS) m[y][x] = T_FLOWER; });

  // ════════════════════════════════════════════════════════════
  // GYM BUILDING (north campus)
  // ════════════════════════════════════════════════════════════
  fill(22, 2, 46, 2, T_WALL);   // south face (entry)
  fill(22, 3, 22, 15, T_WALL);  // west wall
  fill(46, 3, 46, 15, T_WALL);  // east wall
  fill(22, 15, 46, 15, T_WALL); // north face
  // Gym windows
  for (let x = 23; x <= 45; x += 4) m[15][x] = T_WINDOW;
  for (let x = 24; x <= 44; x += 4) m[2][x] = T_WINDOW;
  // Gym doors
  m[15][30] = T_DOOR;
  m[15][38] = T_DOOR;
  // Gym sign area
  m[3][33] = T_SIGN;
  m[3][34] = T_SIGN;
  // Bleachers visible
  for (let x = 24; x <= 28; x++) m[4][x] = T_BENCH;
  for (let x = 40; x <= 44; x++) m[4][x] = T_BENCH;

  // ════════════════════════════════════════════════════════════
  // LIBRARY (northwest, between forest and west campus)
  // ════════════════════════════════════════════════════════════
  fill(2, 2, 20, 2, T_WALL);    // south face (entry)
  fill(2, 3, 2, 18, T_WALL);    // west wall
  fill(20, 3, 20, 18, T_WALL);  // east wall
  fill(2, 18, 20, 18, T_WALL);  // north face
  // Library windows
  for (let x = 3; x <= 19; x += 3) m[18][x] = T_WINDOW;
  // Library door
  m[18][9] = T_DOOR;
  // Book drop box
  m[19][10] = T_SIGN;

  // ════════════════════════════════════════════════════════════
  // MAIN SCHOOL (center)
  // ════════════════════════════════════════════════════════════
  fill(32, 18, 52, 18, T_WALL);   // south face (entry)
  fill(32, 19, 32, 32, T_WALL);   // west wall
  fill(52, 19, 52, 32, T_WALL);   // east wall
  fill(32, 32, 52, 32, T_WALL);   // north face
  // School windows (south wall)
  for (let x = 33; x <= 51; x += 3) {
    if (x !== 39 && x !== 44) m[18][x] = T_WINDOW;
  }
  // School windows (north wall)
  for (let x = 33; x <= 51; x += 3) {
    if (x !== 40 && x !== 45) m[32][x] = T_WINDOW;
  }
  // School doors
  m[18][39] = T_DOOR;
  m[18][44] = T_DOOR;
  // School sign
  m[19][41] = T_SIGN;
  m[19][42] = T_SIGN;
  // School roof decoration
  for (let x = 33; x <= 51; x++) m[33][x] = T_ROOF;

  // ════════════════════════════════════════════════════════════
  // ART BUILDING (west campus)
  // ════════════════════════════════════════════════════════════
  fill(2, 20, 20, 20, T_WALL);   // south face (entry)
  fill(2, 21, 2, 35, T_WALL);    // west wall
  fill(20, 21, 20, 35, T_WALL);  // east wall
  fill(2, 35, 20, 35, T_WALL);   // north face
  // Art murals on exterior walls
  for (let x = 3; x <= 19; x += 5) m[21][x] = T_MURAL;
  for (let x = 4; x <= 18; x += 5) m[34][x] = T_MURAL;
  // Art windows
  for (let x = 3; x <= 19; x += 4) m[20][x] = T_WINDOW;
  // Art door
  m[20][9] = T_DOOR;
  // Paint splatter decorations (flowers near art building)
  for (let y = 23; y <= 33; y += 3) {
    m[y][4] = T_FLOWER;
    m[y][18] = T_FLOWER;
  }

  // ════════════════════════════════════════════════════════════
  // SCIENCE BUILDING (east campus)
  // ════════════════════════════════════════════════════════════
  fill(78, 20, 97, 20, T_WALL);   // south face (entry)
  fill(78, 21, 78, 35, T_WALL);   // west wall
  fill(97, 21, 97, 35, T_WALL);   // east wall
  fill(78, 35, 97, 35, T_WALL);   // north face
  // Science windows
  for (let x = 79; x <= 96; x += 4) m[20][x] = T_WINDOW;
  // Science door
  m[20][87] = T_DOOR;
  // Lab benches visible outside
  for (let x = 79; x <= 82; x++) m[21][x] = T_LABBENCH;
  for (let x = 93; x <= 96; x++) m[21][x] = T_LABBENCH;
  // Science sign
  m[36][86] = T_SIGN;
  m[36][87] = T_SIGN;

  // ════════════════════════════════════════════════════════════
  // CAFETERIA (south campus)
  // ════════════════════════════════════════════════════════════
  fill(32, 50, 55, 50, T_WALL);   // south face (entry)
  fill(32, 51, 32, 64, T_WALL);   // west wall
  fill(55, 51, 55, 64, T_WALL);   // east wall
  fill(32, 64, 55, 64, T_WALL);   // north face
  // Cafeteria windows
  for (let x = 33; x <= 54; x += 4) m[50][x] = T_WINDOW;
  // Cafeteria doors
  m[50][40] = T_DOOR;
  m[50][47] = T_DOOR;
  // Awning decorations
  for (let x = 39; x <= 48; x++) m[51][x] = T_ROOF;
  // Outdoor tables
  m[53][35] = T_BENCH;
  m[53][52] = T_BENCH;

  // ════════════════════════════════════════════════════════════
  // GARDEN (southeast)
  // ════════════════════════════════════════════════════════════
  // Garden has low hedge borders instead of walls
  fill(62, 50, 80, 50, T_HEDGE);
  fill(62, 51, 62, 64, T_HEDGE);
  fill(80, 51, 80, 64, T_HEDGE);
  fill(62, 64, 80, 64, T_HEDGE);
  // Garden path
  fill(63, 53, 79, 53, T_PATH);
  fill(70, 50, 70, 63, T_PATH);
  // Garden pond
  for (let y = 55; y <= 60; y++) {
    for (let x = 65; x <= 72; x++) {
      if (y === 55 || y === 60 || x === 65 || x === 72) m[y][x] = T_POND;
      else m[y][x] = T_WATER;
    }
  }
  // Garden flowers
  const gardenFlowers: [number, number][] = [
    [52,64],[52,66],[52,68],
    [78,52],[79,54],[80,56],
    [63,56],[65,56],[67,56],
    [73,58],[75,60],[77,62],
  ];
  gardenFlowers.forEach(([y,x]) => { if (m[y][x] === T_GRASS) m[y][x] = T_FLOWER; });
  // Garden benches
  m[54][66] = T_BENCH;
  m[58][71] = T_BENCH;
  // Garden statues
  m[53][74] = T_STATUE;
  // Garden fountain
  m[57][77] = T_FOUNTAIN;
  // Garden hedge entrance
  m[50][70] = T_DOOR;
  m[50][71] = T_DOOR;

  // ════════════════════════════════════════════════════════════
  // CRYSTAL LAKE (east side)
  // ════════════════════════════════════════════════════════════
  // Lake water
  for (let y = 24; y <= 46; y++) {
    for (let x = 62; y <= 94; x++) {
      if (y === 24 || y === 46 || x === 62 || x === 94) m[y][x] = T_LAKE;
      else m[y][x] = T_WATER;
    }
  }
  // Lake bridges
  fill(62, 34, 62, 36, T_BRIDGE);
  fill(75, 24, 77, 24, T_BRIDGE);
  fill(70, 46, 72, 46, T_BRIDGE);
  // Lake shore flowers
  for (let x = 63; x <= 93; x += 3) {
    if (m[23][x] === T_GRASS) m[23][x] = T_FLOWER;
    if (m[47][x] === T_GRASS) m[47][x] = T_FLOWER;
  }
  // Lake trees along edges
  for (let y = 25; y <= 45; y += 4) {
    if (m[y][61] === T_GRASS) m[y][61] = T_TREE;
    if (m[y][95] === T_GRASS) m[y][95] = T_TREE;
  }
  // Lake dock
  fill(68, 28, 68, 32, T_PATH);
  // Lake fishing spot
  m[30][66] = T_SIGN;

  // ════════════════════════════════════════════════════════════
  // CENTRAL PLAZA
  // ════════════════════════════════════════════════════════════
  // Plaza fountain (center of campus)
  for (let y = 20; y <= 21; y++) {
    for (let x = 40; x <= 43; x++) {
      if (y === 20 || y === 21 || x === 40 || x === 43) m[y][x] = T_FOUNTAIN;
      else m[y][x] = T_FLOOR;
    }
  }
  // Plaza benches
  m[21][36] = T_BENCH;
  m[21][47] = T_BENCH;
  m[17][41] = T_BENCH;
  // Plaza flowers
  for (let x = 33; x <= 50; x += 4) {
    if (m[17][x] === T_GRASS) m[17][x] = T_FLOWER;
  }

  // ════════════════════════════════════════════════════════════
  // NORTH CAMPUS ATHLETIC FIELDS
  // ════════════════════════════════════════════════════════════
  // Running track (path around field)
  fill(47, 4, 78, 4, T_PATH);
  fill(78, 4, 78, 14, T_PATH);
  fill(47, 14, 78, 14, T_PATH);
  fill(47, 4, 47, 14, T_PATH);
  // Field inside track
  for (let y = 5; y <= 13; y++) {
    for (let x = 48; x <= 77; x++) {
      if (m[y][x] === T_GRASS) m[y][x] = T_FLOWER; // grass
    }
  }
  // Field markers
  m[9][62] = T_SIGN;
  m[9][63] = T_SIGN;

  // ════════════════════════════════════════════════════════════
  // DECORATIVE TREES (scattered around campus)
  // ════════════════════════════════════════════════════════════
  const trees: [number, number][] = [
    // North campus trees
    [0,25],[1,26],[W-1,25],[W-2,26],
    [0,30],[W-1,30],
    [0,35],[W-1,35],
    [0,40],[W-1,40],
    [0,45],[W-1,45],
    // West campus trees
    [0,48],[1,49],[2,50],
    [21,25],[22,26],[23,27],
    [21,36],[22,37],
    // East campus trees
    [W-1,48],[W-2,49],[W-3,50],
    [75,36],[76,37],
    [75,25],[76,24],
    // South campus trees
    [22,65],[23,66],[W-1,65],[W-2,66],
    [21,55],[W-3,55],
    // Lake area trees
    [59,30],[59,40],
    [96,30],[96,40],
    [63,23],[94,23],
    [63,47],[94,47],
  ];
  trees.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W && m[y][x] === T_GRASS) m[y][x] = T_TREE; });

  // ════════════════════════════════════════════════════════════
  // FLOWERS (scattered around campus)
  // ════════════════════════════════════════════════════════════
  const flowers: [number, number][] = [
    [17,2],[17,5],[17,10],[17,15],
    [6,18],[10,18],[14,18],
    [24,17],[29,17],[33,17],[45,17],[50,17],
    [60,17],[65,17],[70,17],[75,17],
    [17,24],[17,30],[17,36],[17,42],
    [18,48],[24,48],[30,48],[50,48],[60,48],
    [24,65],[30,65],[55,65],[60,65],
    [2,50],[5,52],[10,55],[15,58],
    [85,52],[88,55],[92,58],[95,60],
  ];
  flowers.forEach(([y, x]) => { if (y >= 0 && y < H && x >= 0 && x < W && m[y][x] === T_GRASS) m[y][x] = T_FLOWER; });

  // ════════════════════════════════════════════════════════════
  // FENCE BORDERS
  // ════════════════════════════════════════════════════════════
  for (let x = 0; x < W; x++) { if (m[0][x] === T_GRASS) m[0][x] = T_FENCE; }
  for (let x = 0; x < W; x++) { if (m[H-1][x] === T_GRASS) m[H-1][x] = T_FENCE; }
  for (let y = 0; y < H; y++) { if (m[y][0] === T_GRASS) m[y][0] = T_FENCE; }
  for (let y = 0; y < H; y++) { if (m[y][W-1] === T_GRASS) m[y][W-1] = T_FENCE; }

  return m;
}