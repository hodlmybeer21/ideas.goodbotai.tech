'use client';

export type Station = {
  id: string;       // matches activity id used by the existing ActivityBridge
  name: string;
  icon: string;
  ready: boolean;   // false = "Coming soon" placeholder
};

export type Building = {
  id: string;
  label: string;
  sublabel: string;
  color: string;          // trim/door accent color
  wallColor?: string;      // override cream
  position: [number, number, number];   // x, y, z
  size: [number, number];                // width, depth
  height?: number;        // number of floors (default 1 = single story, 2 = two-story, etc.)
  roofStyle: 'gable' | 'flat' | 'dome' | 'peaked' | 'open' | 'pagoda';
  roofColor?: string;
  stations: Station[];
};

/**
 * Full campus layout — 12 buildings spread out as a proper downtown college
 * (modeled on the Morgantown near Oglebay Hall reference). Buildings are
 * spaced well apart with wide green quads between streets. All 12 buildings
 * line the OUTER side of the 4-road grid:
 *   - North row (z=-20): artroom / library / sciceng / auditorium spread
 *     across x from -28 to +28, with ~10 units of green space between each
 *   - West column (x=-20): gym / cafetria / nurse spread along z from
 *     -12 to +14, with ~12 units of green space between each
 *   - South row (z=+20): office / mathroom / musicrm spread across x
 *     from -14 to +14, with ~14 units between each
 *   - East single (x=+22): playground
 *   - Far South (z=+28): greenhouse
 * The "inner" blocks (between Main St and North/South St, between West/East
 * Side St) are open green quads with trees, paths, and the central plaza
 * / clock tower / entrance arch / lake / stadium.
 *
 * Buildings with `height: 2` are multi-story (taller walls + door + roof);
 * those with columns (library, office, auditorium) get decorative columned
 * porticos on their front face, matching the reference image.
 *
 * Doors auto-orient toward the plaza, so all buildings face the central
 * road grid from their respective sides.
 *
 * Stations use the same activity ids as the existing /school game.js so the
 * StationPicker → ActivityModal handoff stays identical to the proven 2D path.
 */
export const BUILDINGS: Building[] = [
  // ── NORTH row (outer, z=-20, 4 buildings spread across x) ──────────────
  {
    id: 'artroom',
    label: 'Art Studio',
    sublabel: 'Creative Corner',
    color: '#F06292',
    position: [-28, 0, -20],
    size: [7, 5.5],
    height: 1,
    roofStyle: 'pagoda',
    roofColor: '#EC407A',
    stations: [
      { id: 'colorlab',       name: 'Color Lab',      icon: '🎨', ready: true },
      { id: 'pixelcanvas_b',  name: 'Pixel Canvas',   icon: '🎮', ready: true },
      { id: 'drawingcanvas',  name: 'Magic Canvas',   icon: '🖌️', ready: true },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    sublabel: 'Story Hall',
    color: '#4FC3F7',
    position: [-10, 0, -20],
    size: [7, 5.5],
    height: 2,                  // ← multi-story with columned portico (downtown library look)
    roofStyle: 'gable',
    roofColor: '#5D4037',
    stations: [
      { id: 'storymachine', name: 'Story Machine', icon: '📖', ready: true },
      { id: 'readalong',    name: 'Read Along',    icon: '📖', ready: true },
      { id: 'storyqa',      name: 'Story Q&A',     icon: '📚', ready: true },
    ],
  },
  {
    id: 'sciceng',
    label: 'Science Lab',
    sublabel: 'Experiments',
    color: '#81C784',
    position: [10, 0, -20],
    size: [7, 5.5],
    height: 1,
    roofStyle: 'dome',
    roofColor: '#66BB6A',
    stations: [
      { id: 'plantcycle', name: 'Plant Life Cycle', icon: '🌱', ready: true },
      { id: 'soundlab',   name: 'Sound Lab',        icon: '🎵', ready: true },
      { id: 'mattermixer',name: 'Matter Mixer',     icon: '🧪', ready: true },
    ],
  },
  {
    id: 'auditorium',
    label: 'Auditorium',
    sublabel: 'Stage',
    color: '#CE93D8',
    position: [28, 0, -20],
    size: [7, 5.5],
    height: 2,                  // ← multi-story (grand theater building)
    roofStyle: 'peaked',
    roofColor: '#BA68C8',
    stations: [
      { id: 'animatch',        name: 'Animal Match',      icon: '🧩', ready: true },
      { id: 'characterraits',  name: 'Character Traits',  icon: '🎭', ready: true },
      { id: 'sentencefixer',   name: 'Sentence Fixer',    icon: '✏️', ready: true },
    ],
  },

  // ── WEST column (x=-20, 3 buildings spread along z) ──────────
  {
    id: 'gym',
    label: 'Gymnasium',
    sublabel: 'Fitness',
    color: '#7E57C2',
    position: [-20, 0, -12],
    size: [7, 5.5],
    height: 1,
    roofStyle: 'dome',
    roofColor: '#5E35B1',
    stations: [
      { id: 'bossyr',   name: 'Bossy R Racer', icon: '🏎️', ready: true },
      { id: 'mathrace', name: 'Math Race',     icon: '🏃', ready: false },
    ],
  },
  {
    id: 'cafetria',
    label: 'Cafeteria',
    sublabel: 'Healthy Fun',
    color: '#FFB74D',
    position: [-20, 0, 2],
    size: [7, 5.5],
    height: 1,
    roofStyle: 'flat',
    roofColor: '#FFA726',
    stations: [
      { id: 'equalparts',    name: 'Equal Parts',    icon: '🔴', ready: true },
      { id: 'coinchallenge', name: 'Coin Challenge', icon: '🪙', ready: true },
    ],
  },
  {
    id: 'nurse',
    label: "Nurse's Office",
    sublabel: 'Health Hub',
    color: '#4DB6AC',
    position: [-20, 0, 14],
    size: [6, 5],
    height: 1,
    roofStyle: 'flat',
    roofColor: '#26A69A',
    stations: [
      { id: 'telltime', name: 'Tell Time', icon: '🕐', ready: true },
    ],
  },

  // ── SOUTH row (outer, z=+20, 3 buildings spread along x) ─────────────
  {
    id: 'office',
    label: 'Main Office',
    sublabel: 'HQ',
    color: '#A1887F',
    position: [-14, 0, 20],
    size: [6, 5],
    height: 2,                  // ← multi-story (campus HQ with columned portico)
    roofStyle: 'peaked',
    roofColor: '#8D6E63',
    stations: [
      { id: 'codebots',         name: 'CodeBots',          icon: '🤖', ready: true },
      { id: 'istherobotright',  name: 'Is the Robot Right?', icon: '🤖', ready: true },
    ],
  },
  {
    id: 'mathroom',
    label: 'Math Den',
    sublabel: 'Numbers',
    color: '#FFD54F',
    position: [0, 0, 20],
    size: [6, 5],
    height: 1,
    roofStyle: 'gable',
    roofColor: '#FFB300',
    stations: [
      { id: 'mathlab',          name: 'Math Lab',          icon: '🧮', ready: true },
      { id: 'tensonesexplorer', name: 'Tens & Ones',       icon: '🔢', ready: true },
      { id: 'placevaluepirates',name: 'Place Value Pirates',icon: '🏴‍☠️', ready: true },
    ],
  },
  {
    id: 'musicrm',
    label: 'Music Room',
    sublabel: 'Sounds',
    color: '#FF8A65',
    position: [14, 0, 20],
    size: [6, 5],
    height: 1,
    roofStyle: 'gable',
    roofColor: '#FF7043',
    stations: [
      { id: 'syllable_b', name: 'Syllable Scooper', icon: '🔤', ready: true },
      { id: 'madlibs',    name: 'Mad Libs',         icon: '📝', ready: true },
      { id: 'beatcomposer', name: 'Beat Composer',  icon: '🎵', ready: true },
    ],
  },

  // ── EAST single (x=+22, between East St x=11 and outer edge) ───────────
  {
    id: 'playground',
    label: 'Playground',
    sublabel: 'Outdoor Fun',
    color: '#64B5F6',
    position: [22, 0, 8],
    size: [8, 7],
    height: 1,
    roofStyle: 'open',
    stations: [
      { id: 'statefinder',  name: 'State Finder',     icon: '🗺️', ready: true },
      { id: 'truefalse',    name: 'True or False',    icon: '✅', ready: true },
      { id: 'vocabventure', name: 'Vocab Venture',    icon: '🎯', ready: false },
    ],
  },

  // ── FAR SOUTH (south of Far South Road at z=+22) ────────────
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    sublabel: 'Nature Walk',
    color: '#AED581',
    position: [-4, 0, 28],
    size: [10, 4],
    height: 1,
    roofStyle: 'peaked',
    roofColor: '#7CB342',
    stations: [
      { id: 'basewordsorter', name: 'Baseword Sorter', icon: '🔗', ready: true },
      { id: 'pluralbuilder',  name: 'Plural Builder',  icon: '🔠', ready: true },
      { id: 'plantcycle',     name: 'Plant Life Cycle',icon: '🌱', ready: true },
    ],
  },
];

/**
 * paths — pairs of [from building id | 'courtyard', to ...] that should
 * get a stone path drawn between them.
 */
export const PATHS: Array<[[number, number, number], [number, number, number]]> = [
  // Spokes from courtyard to each building
];

export const COURTYARD_CENTER: [number, number, number] = [0, 0, 0];
