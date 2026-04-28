import { WORLD_PIXEL_W, WORLD_PIXEL_H, VP_W, VP_H, TILE_SIZE } from './worldData';

// Camera offset in pixels (top-left of viewport in world coords)
export interface Camera {
  x: number; // pixels
  y: number; // pixels
}

export function makeCamera(): Camera {
  return { x: 0, y: 0 };
}

// Lerp camera toward player position (player center in world pixels)
export function cameraUpdate(cam: Camera, px: number, py: number, lerp = 0.08) {
  // Target: center player in viewport
  const targetX = px - VP_W * TILE_SIZE / 2;
  const targetY = py - VP_H * TILE_SIZE / 2;

  cam.x += (targetX - cam.x) * lerp;
  cam.y += (targetY - cam.y) * lerp;

  // Clamp to world bounds
  const maxX = WORLD_PIXEL_W - VP_W * TILE_SIZE;
  const maxY = WORLD_PIXEL_H - VP_H * TILE_SIZE;
  cam.x = Math.max(0, Math.min(maxX, cam.x));
  cam.y = Math.max(0, Math.min(maxY, cam.y));
}

// Convert viewport pixel to world pixel
export function viewToWorld(vx: number, vy: number, cam: Camera): { wx: number; wy: number } {
  return { wx: vx + cam.x, wy: vy + cam.y };
}

// Convert viewport pixel to world tile coords
export function viewToTile(vx: number, vy: number, cam: Camera): { tx: number; ty: number } {
  const { wx, wy } = viewToWorld(vx, vy, cam);
  return { tx: Math.floor(wx / TILE_SIZE), ty: Math.floor(wy / TILE_SIZE) };
}

// Check if a world tile is visible in the viewport
export function tileVisible(
  tx: number, ty: number,
  camX: number, camY: number
): boolean {
  const wx = tx * TILE_SIZE - camX;
  const wy = ty * TILE_SIZE - camY;
  return wx >= -TILE_SIZE && wx < VP_W * TILE_SIZE + TILE_SIZE &&
         wy >= -TILE_SIZE && wy < VP_H * TILE_SIZE + TILE_SIZE;
}
