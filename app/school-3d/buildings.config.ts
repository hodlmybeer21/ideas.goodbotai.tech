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
  roofStyle: 'gable' | 'flat' | 'dome' | 'peaked' | 'open' | 'pagoda';
  roofColor?: string;
  stations: Station[];
};

/**
 * Full campus layout — 12 buildings arranged in a downtown block pattern
 * (modeled on the Morgantown near Oglebay Hall reference). Buildings line
 * the streets on BOTH sides of each road:
 *   - North St (z=-12): artroom/auditorium on the outer (north) side,
 *     library/sciceng on the inner (south) side
 *   - South St (z=+12): office on the outer (south) side,
 *     mathroom/musicrm on the inner (north) side
 *   - West St (x=-11): gym/cafetria/nurse on the outer (west) side
 *   - East St (x=+11): playground on the outer (east) side
 *   - Far South St (z=+22): greenhouse on the outer (south) side
 *
 * Doors auto-orient toward the plaza, so all buildings face the central
 * road grid from their respective sides.
 *
 * Stations use the same activity ids as the existing /school game.js so the
 * StationPicker → ActivityModal handoff stays identical to the proven 2D path.
 */
export const BUILDINGS: Building[] = [
  // ── NORTH ROW OUTER (just north of North St at z=-12) ──────────────
  {
    id: 'artroom',
    label: 'Art Studio',
    sublabel: 'Creative Corner',
    color: '#F06292',
    position: [-22, 0, -18],
    size: [7, 5.5],
    roofStyle: 'pagoda',
    roofColor: '#EC407A',
    stations: [
      { id: 'colorlab',       name: 'Color Lab',      icon: '🎨', ready: true },
      { id: 'pixelcanvas_b',  name: 'Pixel Canvas',   icon: '🎮', ready: true },
      { id: 'drawingcanvas',  name: 'Magic Canvas',   icon: '🖌️', ready: true },
    ],
  },
  // ── NORTH ROW INNER (between Main St z=0 and North St z=-12) ─────
  {
    id: 'library',
    label: 'Library',
    sublabel: 'Story Hall',
    color: '#4FC3F7',
    position: [-9, 0, -7],
    size: [7, 5.5],
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
    position: [9, 0, -7],
    size: [7, 5.5],
    roofStyle: 'dome',
    roofColor: '#66BB6A',
    stations: [
      { id: 'plantcycle', name: 'Plant Life Cycle', icon: '🌱', ready: true },
      { id: 'soundlab',   name: 'Sound Lab',        icon: '🎵', ready: true },
      { id: 'mattermixer',name: 'Matter Mixer',     icon: '🧪', ready: true },
    ],
  },
  // ── NORTH ROW OUTER (NE corner) ─────────────────────────────
  {
    id: 'auditorium',
    label: 'Auditorium',
    sublabel: 'Stage',
    color: '#CE93D8',
    position: [22, 0, -18],
    size: [7, 5.5],
    roofStyle: 'peaked',
    roofColor: '#BA68C8',
    stations: [
      { id: 'animatch',        name: 'Animal Match',      icon: '🧩', ready: true },
      { id: 'characterraits',  name: 'Character Traits',  icon: '🎭', ready: true },
      { id: 'sentencefixer',   name: 'Sentence Fixer',    icon: '✏️', ready: true },
    ],
  },

  // ── WEST COLUMN OUTER (just west of West St at x=-11) ──────────
  {
    id: 'gym',
    label: 'Gymnasium',
    sublabel: 'Fitness',
    color: '#7E57C2',
    position: [-16, 0, -10],
    size: [7, 5.5],
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
    position: [-16, 0, 2],
    size: [7, 5.5],
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
    position: [-16, 0, 14],
    size: [6, 5],
    roofStyle: 'flat',
    roofColor: '#26A69A',
    stations: [
      { id: 'telltime', name: 'Tell Time', icon: '🕐', ready: true },
    ],
  },

  // ── SOUTH ROW OUTER (just south of South St at z=+12) ──────────
  {
    id: 'office',
    label: 'Main Office',
    sublabel: 'HQ',
    color: '#A1887F',
    position: [-13, 0, 16],
    size: [6, 5],
    roofStyle: 'peaked',
    roofColor: '#8D6E63',
    stations: [
      { id: 'codebots',         name: 'CodeBots',          icon: '🤖', ready: true },
      { id: 'istherobotright',  name: 'Is the Robot Right?', icon: '🤖', ready: true },
    ],
  },
  // ── SOUTH ROW INNER (between Main St z=0 and South St z=+12) ─────
  {
    id: 'mathroom',
    label: 'Math Den',
    sublabel: 'Numbers',
    color: '#FFD54F',
    position: [-4, 0, 7],
    size: [6, 5],
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
    position: [5, 0, 7],
    size: [6, 5],
    roofStyle: 'gable',
    roofColor: '#FF7043',
    stations: [
      { id: 'syllable_b', name: 'Syllable Scooper', icon: '🔤', ready: true },
      { id: 'madlibs',    name: 'Mad Libs',         icon: '📝', ready: true },
      { id: 'beatcomposer', name: 'Beat Composer',  icon: '🎵', ready: true },
    ],
  },

  // ── EAST single (just east of East St at x=+11) ─────────────
  {
    id: 'playground',
    label: 'Playground',
    sublabel: 'Outdoor Fun',
    color: '#64B5F6',
    position: [16, 0, 12],
    size: [8, 7],
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
    position: [-6, 0, 27],
    size: [10, 4],
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
