export interface NPC {
  id: string;
  name: string;
  emoji: string;
  color: string;
  hairColor: string;
  // Patrol route in WORLD coords (tile x,y)
  route: { tx: number; ty: number }[];
  dialogue: string[];
  zone?: string;
}

export const NPC_DEFS: NPC[] = [
  // ── PLAZA NPCs ────────────────────────────────────────────────────────
  {
    id: 'rosa',
    name: 'Teacher Rosa',
    emoji: '👩‍🏫',
    color: '#FF9F9F',
    hairColor: '#2C1810',
    route: [{ tx: 35, ty: 19 }, { tx: 40, ty: 19 }, { tx: 45, ty: 19 }, { tx: 40, ty: 19 }],
    dialogue: [
      "Welcome to GoodBot Campus! Have you visited the Art Building yet? 🎨",
      "Learning is an adventure! What subject do you like best?",
      "The Library is great for reading — have you met Ms. Page?",
    ],
    zone: 'plaza',
  },
  {
    id: 'bo',
    name: 'Principal Bo',
    emoji: '👨‍💼',
    color: '#6B8DD6',
    hairColor: '#1A1A2E',
    route: [{ tx: 42, ty: 19 }, { tx: 48, ty: 19 }, { tx: 48, ty: 21 }, { tx: 42, ty: 21 }],
    dialogue: [
      "Welcome, young explorer! This campus has so much to discover!",
      "The Gym is great for burning energy. Have you been to see Coach Ziggy?",
      "Our Art Building has the best murals in the whole county!",
    ],
    zone: 'plaza',
  },
  // ── NORTH CAMPUS / GYM NPC ───────────────────────────────────────────
  {
    id: 'ziggy',
    name: 'Coach Ziggy',
    emoji: '🏃',
    color: '#FF6B6B',
    hairColor: '#D4A853',
    route: [{ tx: 28, ty: 13 }, { tx: 34, ty: 13 }, { tx: 40, ty: 13 }, { tx: 34, ty: 13 }],
    dialogue: [
      "Hey there, athlete! Ready to get moving? 🏀",
      "Sports are great for your body AND your brain!",
      "Check out the Gym activities — they're a ton of fun!",
    ],
    zone: 'north_campus',
  },
  // ── WEST CAMPUS / ART BUILDING NPC ──────────────────────────────────
  {
    id: 'paintbot',
    name: 'Paint Bot',
    emoji: '🤖',
    color: '#DDA0DD',
    hairColor: '#888888',
    route: [{ tx: 5, ty: 18 }, { tx: 5, ty: 23 }, { tx: 10, ty: 23 }, { tx: 10, ty: 18 }],
    dialogue: [
      "BEEP BOOP! I am Paint Bot! I love colors more than anything!",
      "Primary colors are red, blue, and yellow. Try mixing them in Color Lab!",
      "The Art Building is my home. Come make something beautiful!",
    ],
    zone: 'west_campus',
  },
  // ── WEST CAMPUS / LIBRARY NPC ───────────────────────────────────────
  {
    id: 'page',
    name: 'Ms. Page',
    emoji: '🦉',
    color: '#C8A87B',
    hairColor: '#8B6914',
    route: [{ tx: 10, ty: 18 }, { tx: 16, ty: 18 }, { tx: 16, ty: 22 }, { tx: 10, ty: 22 }],
    dialogue: [
      "Whoohoo! I love stories. Have you read anything good lately? 📖",
      "The Library has the best books and the coziest corners!",
      "Books take you anywhere — even to places that don't exist!",
    ],
    zone: 'west_campus',
  },
  // ── EAST CAMPUS / SCIENCE BUILDING NPC ─────────────────────────────
  {
    id: 'spark',
    name: 'Dr. Spark',
    emoji: '🧪',
    color: '#4ECDC4',
    hairColor: '#F5C5A3',
    route: [{ tx: 85, ty: 18 }, { tx: 90, ty: 18 }, { tx: 90, ty: 23 }, { tx: 85, ty: 23 }],
    dialogue: [
      "Greetings, young scientist! Today's experiment is going to be AMAZING!",
      "Science is all about asking questions and finding answers!",
      "Have you visited the Science Building yet? We have so much to explore!",
    ],
    zone: 'east_campus',
  },
  // ── SOUTH CAMPUS / CAFETERIA NPC ────────────────────────────────────
  {
    id: 'ramon',
    name: 'Chef Ramon',
    emoji: '👨‍🍳',
    color: '#FF9F43',
    hairColor: '#1A1A2E',
    route: [{ tx: 40, ty: 52 }, { tx: 47, ty: 52 }, { tx: 47, ty: 56 }, { tx: 40, ty: 56 }],
    dialogue: [
      "Hola, amigo! Want to learn about healthy eating? 🍎",
      "The Cafeteria serves the best meals on campus — and we're learning about nutrition too!",
      "Come sit, eat, and have fun with the Tell Time activity!",
    ],
    zone: 'south_campus',
  },
  // ── SOUTH CAMPUS / GARDEN NPC ───────────────────────────────────────
  {
    id: 'fern',
    name: 'Gardener Fern',
    emoji: '🌿',
    color: '#6BCB77',
    hairColor: '#2D7A2D',
    route: [{ tx: 67, ty: 53 }, { tx: 73, ty: 53 }, { tx: 73, ty: 57 }, { tx: 67, ty: 57 }],
    dialogue: [
      "Hello, little one! Want to learn about how plants grow? 🌻",
      "The Garden is my favorite place. Flowers, vegetables, and bees!",
      "Walk by the pond and see what you can discover!",
    ],
    zone: 'south_campus',
  },
  // ── LAKE NPC ───────────────────────────────────────────────────────
  {
    id: 'captain',
    name: 'Captain Gill',
    emoji: '🐟',
    color: '#3A9FD4',
    hairColor: '#888888',
    route: [{ tx: 67, ty: 30 }, { tx: 67, ty: 34 }, { tx: 71, ty: 34 }, { tx: 71, ty: 30 }],
    dialogue: [
      "Glub glub! Welcome to Crystal Lake! 🐟",
      "The bridges here are fun to cross — have you explored both sides?",
      "Check out the docks for fishing spots and fun signs!",
    ],
    zone: 'lake',
  },
  // ── FOREST / WHISPERING WOODS NPC ───────────────────────────────────
  {
    id: 'owl',
    name: 'Whisper Owl',
    emoji: '🦉',
    color: '#8FBC8F',
    hairColor: '#5C4033',
    route: [{ tx: 9, ty: 4 }, { tx: 12, ty: 4 }, { tx: 12, ty: 8 }, { tx: 9, ty: 8 }],
    dialogue: [
      "Who-who goes there? Welcome to Whispering Woods! 🌲",
      "This forest is quiet and full of secrets. Listen to the leaves!",
      "From here you can reach the Library and the Gym!",
    ],
    zone: 'forest',
  },
];

export interface NPCState {
  id: string;
  x: number; y: number;
  tx: number; ty: number;
  dir: string;
  frame: number;
  wp: number;
}

export function makeNPCState(def: NPC): NPCState {
  const start = def.route[0];
  return {
    id: def.id,
    x: start.tx * 10 + 5,
    y: start.ty * 10 + 5,
    tx: start.tx,
    ty: start.ty,
    dir: 'S',
    frame: 0,
    wp: 0,
  };
}