// sprites.ts — Programmatic pixel art sprites (crisp, no AI needed)
// For AI-generated sprites, see: memory/skills/sprite-pipeline/SKILL.md

export interface SpriteSheet {
  img: HTMLImageElement;
  frameW: number;
  frameH: number;
  frames: number;
}

// Load a sprite sheet from a path (AI-generated assets use this)
export function loadSpriteSheet(src: string, frameW: number, frameH: number, frames: number): Promise<SpriteSheet> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, frameW, frameH, frames });
    img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`));
    img.src = src;
  });
}

// Draw one frame from a horizontal sprite strip onto the game canvas
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  frame: number,
  dx: number, dy: number,
  scale = 1
) {
  const { img, frameW, frameH } = sheet;
  const safeFrame = frame % sheet.frames;
  ctx.drawImage(img, safeFrame * frameW, 0, frameW, frameH, dx, dy, frameW * scale, frameH * scale);
}

// -------------------------------------------------------------------
// Programmatic pixel art sprites (built from code, always crisp)
// Palette: R=red, B=blue, G=green, Y=yellow, W=white, N=black, M=magenta( transparen)
//
// Each sprite is a 2D array of color characters. Scale factor = 4 for 10x10→40x40
// -------------------------------------------------------------------

type PixelColor = 'M' | 'R' | 'B' | 'G' | 'Y' | 'W' | 'N' | 'O' | 'P' | 'T'; // M=magenta/transparent
type SpriteData = PixelColor[][];

const SCALE = 4; // 10px native × 4 = 40px rendered

const PALETTE: Record<PixelColor, string> = {
  M: 'transparent',
  R: '#e74c3c', B: '#3498db', G: '#2ecc71', Y: '#f1c40f',
  W: '#ecf0f1', N: '#2c3e50', O: '#e67e22', P: '#9b59b6',
  T: '#95a5a6',
};

// Build a sprite sheet as a data URL (horizontal strip, frames side-by-side)
function buildSpriteSheetURL(spriteDataList: SpriteData[], frameW: number, frameH: number): string {
  const totalFrames = spriteDataList.length;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * SCALE * totalFrames;
  canvas.height = frameH * SCALE;
  const ctx = canvas.getContext('2d')!;

  spriteDataList.forEach((sprite, i) => {
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        const color = PALETTE[sprite[row][col] as PixelColor];
        if (color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          i * frameW * SCALE + col * SCALE,
          row * SCALE,
          SCALE,
          SCALE
        );
      }
    }
  });

  return canvas.toDataURL('image/png');
}

// -------------------------------------------------------------------
// SPRITE DEFINITIONS (all facing forward, 10×10 native pixels)
// -------------------------------------------------------------------

// Player boy: red shirt, blue jeans, brown hair
const PLAYER_WALK: SpriteData[] = [
  // Frame 0: neutral
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','R','R','R','R','R','R','R','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','M','B','B','M','B','B','M','M','M'],
  ],
  // Frame 1: right step
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','R','R','R','R','R','R','R','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','M','M','B','B','M','B','M','M','M'],  // right step: left leg forward
  ],
  // Frame 2: neutral (same as 0)
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','R','R','R','R','R','R','R','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','M','B','B','M','B','B','M','M','M'],
  ],
  // Frame 3: left step
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','R','R','R','R','R','R','R','M','M'],
    ['M','M','R','R','R','R','R','M','M','M'],
    ['M','M','B','M','B','B','M','B','M','M'],  // left step: right leg forward
  ],
];

// NPC Girl: purple dress, blonde hair
const NPC_GIRL: SpriteData[] = [
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','P','P','P','P','P','P','P','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','M','P','P','M','P','P','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','P','P','P','P','P','P','P','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','M','M','P','P','M','P','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','P','P','P','P','P','P','P','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','M','P','P','M','P','P','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','Y','W','N','W','Y','M','M','M'],
    ['M','M','Y','W','W','W','Y','M','M','M'],
    ['M','M','M','Y','Y','Y','M','M','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','P','P','P','P','P','P','P','M','M'],
    ['M','M','P','P','P','P','P','M','M','M'],
    ['M','M','P','M','P','P','M','P','M','M'],
  ],
];

// NPC Teacher: green dress, glasses
const NPC_TEACHER: SpriteData[] = [
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],  // gray hair
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','T','N','W','N','T','M','M','M'],  // glasses + eyes
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],  // green dress
    ['M','G','G','G','G','G','G','G','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','M','G','G','M','G','G','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','T','N','W','N','T','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','G','G','G','G','G','G','G','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','M','M','G','G','M','G','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','T','N','W','N','T','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','G','G','G','G','G','G','G','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','M','G','G','M','G','G','M','M','M'],
  ],
  [
    ['M','M','M','M','M','M','M','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','T','N','W','N','T','M','M','M'],
    ['M','M','T','W','W','W','T','M','M','M'],
    ['M','M','M','T','T','T','M','M','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','G','G','G','G','G','G','G','M','M'],
    ['M','M','G','G','G','G','G','M','M','M'],
    ['M','M','G','M','G','G','M','G','M','M'],
  ],
];

// Export sprite data + builder
export const SPRITES = {
  player: { frames: PLAYER_WALK, frameW: 10, frameH: 10 },
  npcGirl: { frames: NPC_GIRL, frameW: 10, frameH: 10 },
  npcTeacher: { frames: NPC_TEACHER, frameW: 10, frameH: 10 },
} as const;

export type SpriteKey = keyof typeof SPRITES;

// Build all sprite sheet data URLs (call once on game init)
export function buildSpriteSheets(): Record<SpriteKey, string> {
  return Object.fromEntries(
    Object.entries(SPRITES).map(([key, val]) => [key, buildSpriteSheetURL(val.frames, val.frameW, val.frameH)])
  ) as Record<SpriteKey, string>;
}
