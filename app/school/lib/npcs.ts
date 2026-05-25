export interface NPC {
  id: string;
  name: string;
  emoji: string;
  color: string;
  hairColor: string;
  // Patrol route in WORLD coords (tile x,y)
  route: { tx: number; ty: number }[];
  dialogue: string[];
  zone?: string; // optional: restrict to zone
}

export const NPC_DEFS: NPC[] = [
  {
    id: 'rosa',
    name: 'Teacher Rosa',
    emoji: '👩‍🏫',
    color: '#FF9F9F',
    hairColor: '#2C1810',
    route: [{ tx: 50, ty: 35 }, { tx: 55, ty: 35 }, { tx: 60, ty: 35 }, { tx: 65, ty: 35 }, { tx: 55, ty: 35 }],
    dialogue: [
      "Welcome to GoodBot Campus! Have you visited the Art Building yet? 🎨",
      "Learning is an adventure! What subject do you like best?",
      "I heard Principal Bo is in the Main School today!",
    ],
  },
  {
    id: 'bo',
    name: 'Principal Bo',
    emoji: '👨‍💼',
    color: '#6B8DD6',
    hairColor: '#1A1A2E',
    route: [{ tx: 58, ty: 35 }, { tx: 66, ty: 35 }, { tx: 66, ty: 40 }, { tx: 50, ty: 40 }, { tx: 50, ty: 35 }],
    dialogue: [
      "Welcome, young explorer! This campus has so much to discover!",
      "The Gym is great for burning energy. Have you been to see Coach Ziggy?",
      "Our Art Building has the best murals in the whole county!",
    ],
  },
  {
    id: 'paintbot',
    name: 'Paint Bot',
    emoji: '🤖',
    color: '#DDA0DD',
    hairColor: '#888888',
    route: [{ tx: 5, ty: 35 }, { tx: 5, ty: 45 }, { tx: 10, ty: 45 }, { tx: 10, ty: 35 }],
    dialogue: [
      "BEEP BOOP! I am Paint Bot! I love colors more than anything!",
      "Primary colors are red, blue, and yellow. Try mixing them in Color Lab!",
      "The Art Building is my home. Come make something beautiful!",
    ],
  },
  {
    id: 'ziggy',
    name: 'Coach Ziggy',
    emoji: '🏃',
    color: '#FF6B6B',
    hairColor: '#D4A853',
    route: [{ tx: 50, ty: 28 }, { tx: 58, ty: 28 }, { tx: 66, ty: 28 }, { tx: 58, ty: 28 }],
    dialogue: [
      "Hey there, athlete! Ready to get moving? 🏀",
      "Sports are great for your body AND your brain!",
      "Check out the Gym activities — they're a ton of fun!",
    ],
  },
  {
    id: 'page',
    name: 'Ms. Page',
    emoji: '🦉',
    color: '#C8A87B',
    hairColor: '#8B6914',
    route: [{ tx: 10, ty: 35 }, { tx: 18, ty: 35 }, { tx: 18, ty: 42 }, { tx: 10, ty: 42 }],
    dialogue: [
      "Whoohoo! I love stories. Have you read anything good lately? 📖",
      "The Library has the best books and the coziest corners!",
      "Books take you anywhere — even to places that don't exist!",
    ],
  },
  {
    id: 'spark',
    name: 'Dr. Spark',
    emoji: '🧪',
    color: '#4ECDC4',
    hairColor: '#F5C5A3',
    route: [{ tx: 92, ty: 35 }, { tx: 98, ty: 35 }, { tx: 98, ty: 42 }, { tx: 92, ty: 42 }],
    dialogue: [
      "Greetings, young scientist! Today's experiment is going to be AMAZING!",
      "Science is all about asking questions and finding answers!",
      "Have you visited the Science Building yet? We have so much to explore!",
    ],
  },
];

// Initial NPC state (world pixel coords, tile coords, direction, frame, patrol waypoint)
export interface NPCState {
  id: string;
  x: number; y: number;       // pixel coords (center)
  tx: number; ty: number;    // tile coords
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
