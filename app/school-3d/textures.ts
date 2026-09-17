'use client';

import * as THREE from 'three';

/**
 * Ghibli-style procedural CanvasTextures.
 *
 * Each function returns null during SSR (no `document`) — callers must wrap
 * the result in useMemo and gate on document existence the same way the
 * original CampusGround textures did.
 *
 * Palette target: warm earthy Miyazaki-pastoral. Sage greens, terracotta,
 * cream, dusty rose, golden amber. No neon, no saturated primaries.
 */

/** Thatched roof — warm browns with horizontal banding + brush streaks. */
export function makeThatchTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8B6843';
  g.fillRect(0, 0, 256, 256);
  // Horizontal thatch bands — slightly varying tones
  for (let y = 0; y < 256; y += 4) {
    const v = Math.sin(y * 0.7) * 6 + (Math.random() - 0.5) * 10;
    g.fillStyle = `rgb(${Math.round(139 + v)}, ${Math.round(104 + v * 0.85)}, ${Math.round(67 + v * 0.7)})`;
    g.fillRect(0, y, 256, 4);
  }
  // Darker shadow stripes between bands
  for (let y = 0; y < 256; y += 8) {
    g.fillStyle = 'rgba(62, 39, 22, 0.22)';
    g.fillRect(0, y + 3, 256, 1);
  }
  // Vertical brush streaks (hand-painted feel)
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(${100 + Math.random() * 30}, ${70 + Math.random() * 20}, ${40 + Math.random() * 15}, 0.28)`;
    const x = Math.random() * 256;
    g.fillRect(x, 0, 1 + Math.random() * 2, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cream wall — warm cream with subtle wood-plank lines + hand-painted noise. */
export function makeWallTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#EFE3D0';
  g.fillRect(0, 0, 256, 256);
  // Faint horizontal plank lines
  for (let y = 0; y < 256; y += 24) {
    g.fillStyle = 'rgba(180, 155, 120, 0.18)';
    g.fillRect(0, y, 256, 1);
    g.fillStyle = 'rgba(255, 245, 225, 0.25)';
    g.fillRect(0, y + 1, 256, 1);
  }
  // Subtle noise speckles for hand-painted feel
  for (let i = 0; i < 400; i++) {
    const a = 0.04 + Math.random() * 0.06;
    g.fillStyle = Math.random() > 0.5
      ? `rgba(180, 150, 110, ${a})`
      : `rgba(255, 250, 235, ${a})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  // Vertical wood-grain streaks (very subtle)
  for (let i = 0; i < 60; i++) {
    g.fillStyle = 'rgba(160, 130, 95, 0.06)';
    g.fillRect(Math.random() * 256, 0, 1, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Warm wood — for doors, fences, window frames, beams. */
export function makeWoodTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7A5235';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 256;
    const w = 1 + Math.random() * 3;
    const v = (Math.random() - 0.5) * 40;
    g.fillStyle = `rgba(${Math.round(122 + v)}, ${Math.round(82 + v * 0.8)}, ${Math.round(53 + v * 0.6)}, 0.5)`;
    g.fillRect(x, 0, w, 256);
  }
  // Knots
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const grad = g.createRadialGradient(x, y, 0, x, y, 8);
    grad.addColorStop(0, 'rgba(40, 25, 15, 0.7)');
    grad.addColorStop(1, 'rgba(40, 25, 15, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, 8, 0, Math.PI * 2);
    g.fill();
  }
  // Highlight streaks
  for (let i = 0; i < 40; i++) {
    g.fillStyle = 'rgba(220, 180, 130, 0.12)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1, 4 + Math.random() * 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Sage grass — softer than the original bright green. */
export function makeGrassTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7A9B6E';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = Math.random() > 0.5 ? '#5C7A52' : '#8FB07F';
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 1 + Math.random() * 2;
    g.fillRect(x, y, w, w);
  }
  for (let i = 0; i < 250; i++) {
    g.fillStyle = 'rgba(180, 200, 150, 0.55)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  // Warm autumn-leaf speckles
  for (let i = 0; i < 35; i++) {
    g.fillStyle = `rgba(${180 + Math.random() * 30}, ${120 + Math.random() * 30}, ${80 + Math.random() * 30}, 0.4)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(24, 24);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Earth/dirt path — replaces cobblestone with warm packed earth. */
export function makeDirtTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#A88E70';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    const v = (Math.random() - 0.5) * 30;
    g.fillStyle = `rgba(${Math.round(168 + v)}, ${Math.round(142 + v)}, ${Math.round(112 + v)}, 0.6)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // Tiny pebbles
  for (let i = 0; i < 24; i++) {
    g.fillStyle = 'rgba(80, 65, 50, 0.4)';
    g.beginPath();
    g.ellipse(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 2, 1 + Math.random(), 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Soft hill silhouette — distant background rolling hills. */
export function makeHillTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 100, 0, 256);
  grad.addColorStop(0, 'rgba(150, 175, 155, 0)');
  grad.addColorStop(0.35, 'rgba(140, 170, 145, 0.92)');
  grad.addColorStop(1, 'rgba(105, 135, 110, 1)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, 256);
  for (let x = 0; x <= 512; x += 4) {
    const y = 175
      + Math.sin(x * 0.018) * 32
      + Math.sin(x * 0.047) * 14
      + Math.sin(x * 0.131) * 6;
    g.lineTo(x, y);
  }
  g.lineTo(512, 256);
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Soft warm cloud — softer than the original bright white puffs. */
export function makeCloudTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 256, 128);
  const puffs = [
    [60, 70, 38], [100, 60, 42], [140, 70, 40], [180, 60, 36], [210, 75, 32],
    [85, 80, 28], [155, 80, 28], [125, 70, 35], [195, 70, 28],
  ];
  for (const [x, y, r] of puffs) {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 248, 230, 0.92)');
    grad.addColorStop(0.6, 'rgba(255, 240, 210, 0.65)');
    grad.addColorStop(1, 'rgba(255, 230, 190, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
