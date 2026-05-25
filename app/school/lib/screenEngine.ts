// app/school/lib/screenEngine.ts
// Phase 1: Screen-locked camera + transitions for Zelda/Pokémon-style exploration

import { TILE_SIZE, WORLD_W, WORLD_H, VP_W, VP_H, WORLD_PIXEL_W, WORLD_PIXEL_H } from './worldData';

// How many screens deep/wide the world is
export const SCREEN_COLS = Math.ceil(WORLD_W / VP_W); // 10
export const SCREEN_ROWS = Math.ceil(WORLD_H / VP_H); // ~8

// Screen in screen coords (0-indexed)
export interface ScreenCoord {
  col: number; // 0..SCREEN_COLS-1
  row: number; // 0..SCREEN_ROWS-1
}

// Pixel top-left of a screen in world coords
export function screenOrigin(col: number, row: number): { x: number; y: number } {
  return {
    x: col * VP_W * TILE_SIZE,
    y: row * VP_H * TILE_SIZE,
  };
}

// Convert player pixel position → current screen coord
export function playerScreen(px: number, py: number): ScreenCoord {
  return {
    col: Math.floor(px / (VP_W * TILE_SIZE)),
    row: Math.floor(py / (VP_H * TILE_SIZE)),
  };
}

// Transition state
export type TransitionPhase = 'none' | 'fadingOut' | 'fadingIn';

export interface TransitionState {
  phase: TransitionPhase;
  progress: number; // 0→1
  targetScreen: ScreenCoord;
  callback: (() => void) | null;
  _startTime?: number;
}

// Fade constants (milliseconds)
export const FADE_DURATION = 200; // ms per half

export function updateTransition(ts: number, trans: TransitionState): boolean {
  // Returns true when transition is complete and callback has fired
  if (trans.phase === 'none') return false;

  const elapsed = ts - (trans as any)._startTime;
  const duration = FADE_DURATION;

  if (trans.phase === 'fadingOut') {
    trans.progress = Math.min(1, elapsed / duration);
    if (trans.progress >= 1) {
      trans.phase = 'fadingIn';
      (trans as any)._startTime = ts;
      trans.progress = 1;
      if (trans.callback) trans.callback();
    }
  } else if (trans.phase === 'fadingIn') {
    trans.progress = 1 - Math.min(1, elapsed / duration);
    if (trans.progress <= 0) {
      trans.phase = 'none';
      trans.progress = 0;
      return true;
    }
  }
  return false;
}

export function startTransition(target: ScreenCoord, callback: () => void): TransitionState {
  return {
    phase: 'fadingOut',
    progress: 0,
    targetScreen: target,
    callback,
    _startTime: performance.now(),
  };
}

// Check if player is at screen edge and which direction
export function screenEdgeDirection(
  px: number, py: number
): 'left' | 'right' | 'up' | 'down' | null {
  const { col, row } = playerScreen(px, py);
  const screenX = col * VP_W * TILE_SIZE;
  const screenY = row * VP_H * TILE_SIZE;
  const edgeMargin = TILE_SIZE; // snap when within 1 tile of edge

  const relX = px - screenX;
  const relY = py - screenY;

  // Left edge → screen left
  if (relX < edgeMargin && col > 0) return 'left';
  // Right edge → screen right
  if (relX > VP_W * TILE_SIZE - edgeMargin && col < SCREEN_COLS - 1) return 'right';
  // Top edge → screen up
  if (relY < edgeMargin && row > 0) return 'up';
  // Bottom edge → screen down
  if (relY > VP_H * TILE_SIZE - edgeMargin && row < SCREEN_ROWS - 1) return 'down';

  return null;
}

// Snap player to the entry position in the new screen (center, offset from edge)
export function snapPlayerToNewScreen(
  px: number, py: number, dir: 'left' | 'right' | 'up' | 'down'
): { px: number; py: number; screenCol: number; screenRow: number } {
  const cur = playerScreen(px, py);
  let newCol = cur.col;
  let newRow = cur.row;

  if (dir === 'left') newCol -= 1;
  if (dir === 'right') newCol += 1;
  if (dir === 'up') newRow -= 1;
  if (dir === 'down') newRow += 1;

  // Clamp
  newCol = Math.max(0, Math.min(SCREEN_COLS - 1, newCol));
  newRow = Math.max(0, Math.min(SCREEN_ROWS - 1, newRow));

  const originX = newCol * VP_W * TILE_SIZE;
  const originY = newRow * VP_H * TILE_SIZE;

  // Place player at opposite edge of new screen (entry position)
  let snapX: number, snapY: number;
  if (dir === 'left') { snapX = originX + VP_W * TILE_SIZE - TILE_SIZE * 3; snapY = py; }
  else if (dir === 'right') { snapX = originX + TILE_SIZE * 3; snapY = py; }
  else if (dir === 'up') { snapX = px; snapY = originY + VP_H * TILE_SIZE - TILE_SIZE * 3; }
  else { snapX = px; snapY = originY + TILE_SIZE * 3; }

  // Clamp player pixel position to world bounds
  snapX = Math.max(TILE_SIZE, Math.min(WORLD_PIXEL_W - TILE_SIZE, snapX));
  snapY = Math.max(TILE_SIZE, Math.min(WORLD_PIXEL_H - TILE_SIZE, snapY));

  return { px: snapX, py: snapY, screenCol: newCol, screenRow: newRow };
}