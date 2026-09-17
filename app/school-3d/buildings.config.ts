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
  color: string;          // trim/door accent color (warm Ghibli pastels)
  wallColor?: string;      // override cream
  position: [number, number, number];   // x, y, z
  size: [number, number];                // width, depth
  roofStyle: 'gable' | 'flat' | 'dome' | 'peaked' | 'open' | 'pagoda';
  roofColor?: string;
  stations: Station[];
};

/**
 * Full campus layout — 12 buildings arranged around a central courtyard.
 *
 * Ghibli pastel palette (replaces the bright candy primaries):
 *   - dusty rose / mauve / sage / lavender / warm sand / golden wheat / terracotta
 *   - cream walls (`#EFE3D0`) shared across all buildings
 *   - thatched roof tints: deep brown `#5C4128` – `#7B4F36`
 *
 * Positions / sizes / stations / IDs are unchanged so the rest of the
 * gameplay wiring keeps working.
 */
export const BUILDINGS: Building[] = [
  // ── NORTH ROW (z = -20) ─────────────────────────────────────────
  {
    id: 'artroom',
    label: 'Art Studio',
    sublabel: 'Creative Corner',
    color: '#C99B96',            // dusty rose
    wallColor: '#EFE3D0',
    roofColor: '#6B4631',
    position: [-22, 0, -20],
    size: [7, 5.5],
    roofStyle: 'pagoda',
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
    color: '#9DB6C9',            // dusty sky blue
    wallColor: '#F0E6D2',
    roofColor: '#8B5A3C',
    position: [-9, 0, -20],
    size: [7, 5.5],
    roofStyle: 'gable',
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
    color: '#8FA77E',            // sage green
    wallColor: '#EFE3D0',
    roofColor: '#5E4A35',
    position: [9, 0, -20],
    size: [7, 5.5],
    roofStyle: 'dome',
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
    color: '#B89AAD',            // mauve
    wallColor: '#F0E6D2',
    roofColor: '#7B4F36',
    position: [22, 0, -20],
    size: [7, 5.5],
    roofStyle: 'peaked',
    stations: [
      { id: 'animatch',        name: 'Animal Match',      icon: '🧩', ready: true },
      { id: 'characterraits',  name: 'Character Traits',  icon: '🎭', ready: true },
      { id: 'sentencefixer',   name: 'Sentence Fixer',    icon: '✏️', ready: true },
    ],
  },

  // ── UPPER MID (z = -10) ────────────────────────────────────────
  {
    id: 'gym',
    label: 'Gymnasium',
    sublabel: 'Fitness',
    color: '#9D8AB8',            // lavender
    wallColor: '#EFE3D0',
    roofColor: '#5E4A35',
    position: [-22, 0, -10],
    size: [7, 5.5],
    roofStyle: 'dome',
    stations: [
      { id: 'bossyr',   name: 'Bossy R Racer', icon: '🏎️', ready: true },
      { id: 'mathrace', name: 'Math Race',     icon: '🏃', ready: false },
    ],
  },

  // ── LOWER MID (z = 0, near courtyard) ──────────────────────────
  {
    id: 'cafetria',
    label: 'Cafeteria',
    sublabel: 'Healthy Fun',
    color: '#D9B082',            // warm sand
    wallColor: '#F0E6D2',
    roofColor: '#7B4F36',
    position: [-22, 0, 2],
    size: [7, 5.5],
    roofStyle: 'flat',
    stations: [
      { id: 'equalparts',    name: 'Equal Parts',    icon: '🔴', ready: true },
      { id: 'coinchallenge', name: 'Coin Challenge', icon: '🪙', ready: true },
    ],
  },

  // ── SOUTH ROW (z = 14) ─────────────────────────────────────────
  {
    id: 'nurse',
    label: "Nurse's Office",
    sublabel: 'Health Hub',
    color: '#A0B8A6',            // soft mint
    wallColor: '#EFE3D0',
    roofColor: '#6B5840',
    position: [-22, 0, 14],
    size: [6, 5],
    roofStyle: 'flat',
    stations: [
      { id: 'telltime', name: 'Tell Time', icon: '🕐', ready: true },
    ],
  },
  {
    id: 'office',
    label: 'Main Office',
    sublabel: 'HQ',
    color: '#A89177',            // warm wood
    wallColor: '#EFE3D0',
    roofColor: '#5C4128',
    position: [-13, 0, 14],
    size: [6, 5],
    roofStyle: 'peaked',
    stations: [
      { id: 'codebots',         name: 'CodeBots',          icon: '🤖', ready: true },
      { id: 'istherobotright',  name: 'Is the Robot Right?', icon: '🤖', ready: true },
    ],
  },
  {
    id: 'mathroom',
    label: 'Math Den',
    sublabel: 'Numbers',
    color: '#D8B26E',            // golden wheat
    wallColor: '#F0E6D2',
    roofColor: '#7B4F36',
    position: [-4, 0, 14],
    size: [6, 5],
    roofStyle: 'gable',
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
    color: '#C99979',            // dusty terracotta
    wallColor: '#EFE3D0',
    roofColor: '#5C4128',
    position: [5, 0, 14],
    size: [6, 5],
    roofStyle: 'gable',
    stations: [
      { id: 'syllable_b', name: 'Syllable Scooper', icon: '🔤', ready: true },
      { id: 'madlibs',    name: 'Mad Libs',         icon: '📝', ready: true },
      { id: 'beatcomposer', name: 'Beat Composer',  icon: '🎵', ready: true },
    ],
  },
  {
    id: 'playground',
    label: 'Playground',
    sublabel: 'Outdoor Fun',
    color: '#9DAA8B',            // moss
    wallColor: '#F0E6D2',
    roofColor: '#5E4A35',
    position: [18, 0, 12],
    size: [8, 7],
    roofStyle: 'open',
    stations: [
      { id: 'statefinder',  name: 'State Finder',     icon: '🗺️', ready: true },
      { id: 'truefalse',    name: 'True or False',    icon: '✅', ready: true },
      { id: 'vocabventure', name: 'Vocab Venture',    icon: '🎯', ready: false },
    ],
  },

  // ── FAR SOUTH (z = 24) ─────────────────────────────────────────
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    sublabel: 'Nature Walk',
    color: '#A4B58A',
    wallColor: '#EFE3D0',
    roofColor: '#7B4F36',
    position: [-12, 0, 24],
    size: [10, 4],
    roofStyle: 'peaked',
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
