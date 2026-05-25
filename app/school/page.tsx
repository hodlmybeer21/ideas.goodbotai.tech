'use client';

import { useEffect, useRef, useState } from 'react';
import {
  TILE_SIZE, WORLD_W, WORLD_H, VP_W, VP_H,
  buildWorld, getBuildingDoor, BUILDINGS, getZone,
} from './lib/worldData';
import { INTERIORS } from './lib/interiors';
import { NPC_DEFS, makeNPCState, type NPCState } from './lib/npcs';
import { drawTile } from './lib/renderer';
import { cameraUpdate, viewToTile } from './lib/camera';
import PixelCanvas from '../components/PixelCanvas';
import StateFinder from '../components/StateFinder';
import ColorLab from '../components/ColorLab';
import MathLab from '../components/MathLab';
import AnimalMatch from '../components/AnimalMatch';
import ReadAlong from '../components/ReadAlong';
import SyllableScooper from '../components/SyllableScooper';
import TrueFalse from '../components/TrueFalse';
import SentenceBuilder from '../components/SentenceBuilder';
import TellTime from '../components/TellTime';
import StoryMachine from '../components/StoryMachine';
import MadLibs from '../components/MadLibs';
import CharacterTraits from '../components/CharacterTraits';
import SoundLab from '../components/SoundLab';

const STEP = 2;
const NPC_COLORS = ['#FF6B6B', '#4ECDC4', '#DDA0DD', '#FF9F43', '#6B8DD6', '#4ECDC4'];
const HAIR_COLORS = ['#2C1810', '#8B4513', '#1A1A2E', '#D4A853', '#F5C5A3', '#888888'];



// ─── Sprite — Pokémon GBC overworld style ───────────────────────────────────
function drawSprite(c: CanvasRenderingContext2D, sx: number, sy: number, col: string, hair: string, dir: string, frame: number) {
  const S = TILE_SIZE;
  const bx = Math.round(sx - S / 2), by = Math.round(sy - S / 2);

  // Ground shadow
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.ellipse(sx, by + S - 1, 5, 2, 0, 0, Math.PI * 2); c.fill();

  const walk = frame % 2;
  const legOff = walk === 1 ? 1 : 0;

  // Legs (dark pants)
  c.fillStyle = '#28346C';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx + 2, by + 8, 3, 4 + legOff);
    c.fillRect(bx + S - 5, by + 8, 3, 4 + (1 - legOff));
  } else {
    c.fillRect(bx + 3, by + 8, 3, 4 + legOff);
    c.fillRect(bx + 3, by + 8, 3, 4 + (1 - legOff));
  }

  // Shoes
  c.fillStyle = '#3A2010';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx + 1, by + S - 2, 4, 2);
    c.fillRect(bx + S - 5, by + S - 2, 4, 2);
  }

  // Body (colored shirt)
  c.fillStyle = col;
  c.fillRect(bx + 2, by + 5, S - 4, 5);
  // Body shading
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(bx + 2, by + 8, S - 4, 2);

  // Arms
  const armOff = walk === 1 ? 1 : 0;
  c.fillStyle = '#F0C8A0';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx, by + 5, 2, 4 - armOff);
    c.fillRect(bx + S - 2, by + 5, 2, 4 + armOff);
  } else {
    // Arms out to sides when walking
    c.fillStyle = col;
    c.fillRect(bx, by + 5, 2, 4); c.fillRect(bx + S - 2, by + 5, 2, 4);
    c.fillStyle = '#F0C8A0';
    if (dir === 'E') {
      c.fillRect(bx + S - 2, by + 5, 3, 3);
      c.fillRect(bx, by + 5, 2, 4 - armOff);
    } else {
      c.fillRect(bx - 1, by + 5, 3, 3);
      c.fillRect(bx + S - 2, by + 5, 2, 4 - armOff);
    }
  }

  // Neck
  c.fillStyle = '#F0C8A0';
  c.fillRect(bx + S / 2 - 1, by + 4, 2, 2);

  // Head (skin)
  c.fillStyle = '#F0C8A0';
  c.fillRect(bx + 2, by + 1, S - 4, 4);
  c.fillRect(bx + 1, by + 2, S - 2, 3);

  // Hair
  c.fillStyle = hair;
  if (dir === 'N') {
    // Back of head — full coverage
    c.fillRect(bx + 1, by, S - 2, 3);
    c.fillRect(bx + 2, by + 1, S - 4, 2);
  } else if (dir === 'S') {
    c.fillRect(bx + 1, by, S - 2, 2); // bangs
    c.fillRect(bx + 1, by + 1, 2, 2); // left side
    c.fillRect(bx + S - 3, by + 1, 2, 2); // right side
  } else {
    c.fillRect(bx + 1, by, S - 2, 3);
    if (dir === 'E') {
      c.fillRect(bx + S - 3, by + 1, 2, 2); // hair sweeps right
    } else {
      c.fillRect(bx + 1, by + 1, 2, 2); // hair sweeps left
    }
  }

  // Eyes (front view = both, side = one)
  c.fillStyle = '#1A1020';
  if (dir === 'S') {
    c.fillRect(bx + 3, by + 3, 2, 2);
    c.fillRect(bx + S - 5, by + 3, 2, 2);
    // Eye shine
    c.fillStyle = '#FFFFFF';
    c.fillRect(bx + 3, by + 3, 1, 1);
    c.fillRect(bx + S - 5, by + 3, 1, 1);
  } else if (dir === 'N') {
    // No eyes visible from back
  } else {
    // Side profile — one eye
    const eyeX = dir === 'E' ? bx + 5 : bx + S - 7;
    c.fillStyle = '#1A1020';
    c.fillRect(eyeX, by + 3, 2, 2);
    c.fillStyle = '#FFFFFF';
    c.fillRect(eyeX, by + 3, 1, 1);
  }
}

// ─── Activity Router ─────────────────────────────────────────────────────────
function ActivityView({ id, onBack }: { id: string; onBack: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acts: any = {
    pixelstudio: <PixelCanvas onBack={onBack} />,
    statefinder: <StateFinder onBack={onBack} />,
    colorlab: <ColorLab onBack={onBack} />,
    mathlab: <MathLab onBack={onBack} kidName="Explorer" />,
    animalmatch: <AnimalMatch onBack={onBack} kidName="Explorer" />,
    readalong: <ReadAlong onBack={onBack} kidName="Explorer" />,
    syllablescooper: <SyllableScooper />,
    telltime: <TellTime onBack={onBack} kidName="Explorer" />,
    sentencebuilder: <SentenceBuilder onBack={onBack} kidName="Explorer" />,
    storymachine: <StoryMachine kidName="Explorer" onBack={onBack} />,
    madlibs: <MadLibs onBack={onBack} kidName="Explorer" />,
    charactertraits: <CharacterTraits onBack={onBack} />,
    soundlab: <SoundLab onBack={onBack} kidName="Explorer" />,
    truefalse: <TrueFalse onBack={onBack} kidName="Explorer" />,
  };
  return <>{acts[id] || <div className="flex items-center justify-center h-screen text-white text-xl">Coming soon! 🎮</div>}</>;
}

// ─── Intro ───────────────────────────────────────────────────────────────────
function IntroScreen({ onEnter, pCol, setPCol, hCol }: { onEnter: () => void; pCol: string; setPCol: (c: string) => void; hCol: string }) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = previewRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    drawSprite(ctx, 32, 32, pCol, hCol, 'S', 0);
  }, [pCol, hCol]);
  const choices = [{ col: '#FF6B6B' }, { col: '#4ECDC4' }, { col: '#DDA0DD' }];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka, system-ui, sans-serif', zIndex: 999 }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏫</div>
      <div style={{ color: 'white', fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>GoodBot Campus</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px' }}>An open-world adventure</div>
      <canvas ref={previewRef} width={64} height={64} style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', marginBottom: '24px' }} />
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px' }}>Choose your color</div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {choices.map(ch => (
          <button key={ch.col} onClick={() => setPCol(ch.col)} style={{ width: '52px', height: '52px', borderRadius: '50%', background: ch.col, border: pCol === ch.col ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: pCol === ch.col ? `0 0 16px ${ch.col}` : 'none', transition: 'all 0.2s' }} />
        ))}
      </div>
      <button onClick={onEnter} style={{ background: 'linear-gradient(135deg,#4ECDC4,#45B7D1)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 48px', fontSize: '18px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(78,205,196,0.4)', fontFamily: 'inherit' }}>Explore Campus 🚀</button>
    </div>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export default function CampusGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [pCol, setPCol] = useState(NPC_COLORS[Math.floor(Math.random() * NPC_COLORS.length)]);
  const [hCol] = useState(HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]);
  const worldRef = useRef<number[][] | null>(null);
  const npcStatesRef = useRef<NPCState[]>([]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = VP_W * TILE_SIZE, H = VP_H * TILE_SIZE;

    worldRef.current = buildWorld();
    npcStatesRef.current = NPC_DEFS.map(makeNPCState);

    // ─── Player ────────────────────────────────────────────────────────────
    let px = 30 * TILE_SIZE + TILE_SIZE / 2, py = 17 * TILE_SIZE + TILE_SIZE / 2;
    let ptx = 30, pty = 17;
    let pdir = 'S', pFrame = 0;
    let pMoving = false;
    let pTargetX = px, pTargetY = py;
    const cam = { x: px - W / 2, y: py - H / 2 };

    // ─── Mode: exterior | interior ─────────────────────────────────────────
    let mode: 'exterior' | 'interior' = 'exterior';
    let currentBid: string | null = null;
    let iptx = 7, ipty = 5;
    let ipx = 7 * TILE_SIZE + TILE_SIZE / 2, ipy = 5 * TILE_SIZE + TILE_SIZE / 2;
    let ipMoving = false, ipTargetX = ipx, ipTargetY = ipy;
    let ipdir = 'S', ipFrame = 0;

    // ─── NPC / Dialogue ───────────────────────────────────────────────────
    let talkableNPC: NPCState | null = null;
    let showDialogue = false, dialogueText = '';
    let zoneName = 'GoodBot Campus', lastZoneUpdate = 0;

    // ─── Input ─────────────────────────────────────────────────────────────
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => { keys.add(e.key.toLowerCase()); if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','q','escape'].includes(e.key.toLowerCase())) e.preventDefault(); };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    cv.tabIndex = 0; cv.style.outline = 'none'; cv.focus();
    const onFocus = () => cv.focus();
    cv.addEventListener('click', onFocus); cv.addEventListener('touchstart', onFocus);

    // ─── Collision ─────────────────────────────────────────────────────────
    function canWalk(tx: number, ty: number): boolean {
      const world = worldRef.current!;
      if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return false;
      const t = world[ty][tx];
      return t !== 2 && t !== 6 && t !== 8;
    }
    function canWalkInterior(tx: number, ty: number, bid: string): boolean {
      const tiles = INTERIORS[bid]?.tiles; if (!tiles) return false;
      if (tx < 0 || tx >= tiles[0].length || ty < 0 || ty >= tiles.length) return false;
      const t = tiles[ty][tx];
      return t !== 2;
    }

    function nearExteriorDoor(): string | null {
      for (const [dx, dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]]) {
        const nx = ptx + dx, ny = pty + dy;
        const b = getBuildingDoor(nx, ny);
        if (b) return b.id;
      }
      return null;
    }
    function nearInteriorExit(): boolean {
      if (!currentBid) return false;
      const t = INTERIORS[currentBid]?.tiles[ipty]?.[iptx];
      return t === 4;
    }
    function nearActivityTile(): string | null {
      if (!currentBid) return null;
      const t = INTERIORS[currentBid]?.tiles[ipty]?.[iptx];
      if (t === 20) return INTERIORS[currentBid]?.activityId || 'pixelstudio';
      if (t === 21) return 'colorlab';
      return null;
    }

    // ─── Click-to-walk ────────────────────────────────────────────────────
    function clickMove(mx: number, my: number) {
      if (mode === 'interior') {
        const icamX = Math.max(0, Math.min(ipx - W / 2, (INTERIORS[currentBid!]?.tiles[0].length ?? 17) * TILE_SIZE - W));
        const icamY = Math.max(0, Math.min(ipy - H / 2, (INTERIORS[currentBid!]?.tiles.length ?? 11) * TILE_SIZE - H));
        const { tx, ty } = viewToTile(mx, my, { x: icamX, y: icamY });
        if (canWalkInterior(tx, ty, currentBid!)) {
          iptx = tx; ipty = ty;
          ipTargetX = tx * TILE_SIZE + TILE_SIZE / 2;
          ipTargetY = ty * TILE_SIZE + TILE_SIZE / 2;
          ipMoving = true;
        }
      } else {
        const { tx, ty } = viewToTile(mx, my, cam);
        if (canWalk(tx, ty)) {
          ptx = tx; pty = ty;
          pTargetX = tx * TILE_SIZE + TILE_SIZE / 2;
          pTargetY = ty * TILE_SIZE + TILE_SIZE / 2;
          pMoving = true;
        }
      }
    }

    const onClick = (e: MouseEvent) => {
      const rect = cv.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      if (showDialogue) { showDialogue = false; return; }
      clickMove(mx, my);
    };
    cv.addEventListener('click', onClick);

    // ─── ESC ──────────────────────────────────────────────────────────────
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showDialogue) { showDialogue = false; return; }
      if (mode === 'interior' && nearInteriorExit()) {
        mode = 'exterior'; currentBid = null;
        px = ptx * TILE_SIZE + TILE_SIZE / 2;
        py = pty * TILE_SIZE + TILE_SIZE / 2;
      }
    };
    window.addEventListener('keydown', onEsc);

    // ─── NPC Update ──────────────────────────────────────────────────────
    let lastNpc = 0;
    function updateNPCs(ts: number) {
      if (ts - lastNpc < 400) return;
      lastNpc = ts;
      for (const npc of npcStatesRef.current) {
        const def = NPC_DEFS.find(d => d.id === npc.id)!;
        const tgt = def.route[npc.wp];
        if (npc.tx === tgt.tx && npc.ty === tgt.ty) { npc.wp = (npc.wp + 1) % def.route.length; continue; }
        const dx = Math.sign(tgt.tx - npc.tx), dy = Math.sign(tgt.ty - npc.ty);
        if (dx) { npc.tx += dx; npc.x = npc.tx * TILE_SIZE + TILE_SIZE / 2; npc.dir = dx > 0 ? 'E' : 'W'; }
        else if (dy) { npc.ty += dy; npc.y = npc.ty * TILE_SIZE + TILE_SIZE / 2; npc.dir = dy > 0 ? 'S' : 'N'; }
        npc.frame = (npc.frame + 1) % 2;
      }
    }

    // ─── Render ───────────────────────────────────────────────────────────
    function render(ts: number) {
      if (!ctx) return;
      const world = worldRef.current!;

      // ── EXTERIOR ──────────────────────────────────────────────────────────
      if (mode === 'exterior') {
        ctx.fillStyle = '#6ABF40'; ctx.fillRect(0, 0, W, H);

        const sx0 = Math.max(0, Math.floor(cam.x / TILE_SIZE));
        const sy0 = Math.max(0, Math.floor(cam.y / TILE_SIZE));
        const sx1 = Math.min(WORLD_W, Math.ceil((cam.x + W) / TILE_SIZE) + 1);
        const sy1 = Math.min(WORLD_H, Math.ceil((cam.y + H) / TILE_SIZE) + 1);

        for (let ty = sy0; ty < sy1; ty++) {
          for (let tx = sx0; tx < sx1; tx++) {
            drawTile(ctx, world[ty][tx], tx * TILE_SIZE - cam.x, ty * TILE_SIZE - cam.y, ts);
          }
        }

        const sortedNPCs = [...npcStatesRef.current].sort((a, b) => a.y - b.y);
        for (const npc of sortedNPCs) {
          const vx = npc.x - cam.x, vy = npc.y - cam.y;
          if (vx < -TILE_SIZE || vx > W + TILE_SIZE || vy < -TILE_SIZE || vy > H + TILE_SIZE) continue;
          const def = NPC_DEFS.find(d => d.id === npc.id)!;
          drawSprite(ctx, vx, vy, def.color, def.hairColor, npc.dir, npc.frame);
        }

        drawSprite(ctx, px - cam.x, py - cam.y, pCol, hCol, pdir, pFrame);

        // Zone name
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(10, 10, 220, 28, 8); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(zoneName, 18, 29);

        // Controls
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(10, H - 34, 280, 24, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '11px sans-serif';
        ctx.fillText('WASD/Arrows:Move  E:Enter  Q:Talk  Click:Walk', 18, H - 18);

        // NPC talk prompt
        if (talkableNPC && !showDialogue) {
          const nx = talkableNPC.x - cam.x, ny = talkableNPC.y - cam.y;
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(nx - 50, ny - 52, 100, 22, 6); ctx.fill();
          ctx.fillStyle = '#FFE066'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Q to Talk', nx, ny - 38);
        }

        // Door prompt
        const nearDoor = nearExteriorDoor();
        if (nearDoor) {
          const b = BUILDINGS.find(b => b.id === nearDoor)!;
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, H - 80, 200, 28, 8); ctx.fill();
          ctx.fillStyle = '#FFE066'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`E for ${b.emoji} ${b.name}`, W / 2, H - 62);
        }

        // Minimap
        const mw = 100, mh = 83;
        const mmX = W - mw - 10, mmY = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.roundRect(mmX - 2, mmY - 2, mw + 4, mh + 4, 6); ctx.fill();
        const mxs = mw / WORLD_W, mys = mh / WORLD_H;
        for (let ty = 0; ty < WORLD_H; ty++) {
          for (let tx = 0; tx < WORLD_W; tx++) {
            const t = world[ty][tx];
            if (t === 2 || t === 6) ctx.fillStyle = '#5C4033';
            else if (t === 1 || t === 4) ctx.fillStyle = '#B89A70';
            else if (t === 5) ctx.fillStyle = '#4A90D9';
            else continue;
            ctx.fillRect(mmX + tx * mxs, mmY + ty * mys, mxs + 0.5, mys + 0.5);
          }
        }
        npcStatesRef.current.forEach(n => { ctx.fillStyle = '#FFEB3B'; ctx.beginPath(); ctx.arc(mmX + n.tx * mxs + mxs / 2, mmY + n.ty * mys + mys / 2, 2, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = pCol; ctx.beginPath(); ctx.arc(mmX + ptx * mxs + mxs / 2, mmY + pty * mys + mys / 2, 3, 0, Math.PI * 2); ctx.fill();

      } else {
        // ── INTERIOR ─────────────────────────────────────────────────────────
        const interior = INTERIORS[currentBid!]; if (!interior) return;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);

        const iW = interior.tiles[0].length * TILE_SIZE;
        const iH = interior.tiles.length * TILE_SIZE;
        const icamX = Math.max(0, Math.min(ipx - W / 2, iW - W));
        const icamY = Math.max(0, Math.min(ipy - H / 2, iH - H));

        const sx0 = Math.max(0, Math.floor(icamX / TILE_SIZE));
        const sy0 = Math.max(0, Math.floor(icamY / TILE_SIZE));
        const sx1 = Math.min(interior.tiles[0].length, Math.ceil((icamX + W) / TILE_SIZE) + 1);
        const sy1 = Math.min(interior.tiles.length, Math.ceil((icamY + H) / TILE_SIZE) + 1);

        for (let ty = sy0; ty < sy1; ty++) {
          for (let tx = sx0; tx < sx1; tx++) {
            const t = interior.tiles[ty]?.[tx] ?? 0;
            drawTile(ctx, t, tx * TILE_SIZE - icamX, ty * TILE_SIZE - icamY, ts);
          }
        }

        drawSprite(ctx, ipx - icamX, ipy - icamY, pCol, hCol, ipdir, ipFrame);

        const bld = BUILDINGS.find(b => b.id === currentBid);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(10, 10, 200, 28, 8); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`${bld?.emoji || ''} ${bld?.name || ''}`, 18, 29);

        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(10, H - 34, 230, 24, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '11px sans-serif';
        ctx.fillText('WASD:Move  ESC:Exit Building  Click:Walk', 18, H - 18);

        const nearAct = nearActivityTile();
        if (nearAct) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(W / 2 - 120, H - 80, 240, 28, 8); ctx.fill();
          ctx.fillStyle = '#FFE066'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Walk to ★ to start activity!', W / 2, H - 62);
        }

        // Interior minimap
        const mw = 80, mh = 66;
        const mmX = W - mw - 10, mmY = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.roundRect(mmX - 2, mmY - 2, mw + 4, mh + 4, 6); ctx.fill();
        const mxs = mw / interior.tiles[0].length, mys = mh / interior.tiles.length;
        for (let ty = 0; ty < interior.tiles.length; ty++) {
          for (let tx = 0; tx < interior.tiles[0].length; tx++) {
            const t = interior.tiles[ty][tx];
            if (t === 2) ctx.fillStyle = '#5C4033';
            else if (t === 3 || t === 0) ctx.fillStyle = '#888';
            else if (t === 4) ctx.fillStyle = '#B89A70';
            else continue;
            ctx.fillRect(mmX + tx * mxs, mmY + ty * mys, mxs + 0.5, mys + 0.5);
          }
        }
        ctx.fillStyle = pCol; ctx.beginPath(); ctx.arc(mmX + iptx * mxs + mxs / 2, mmY + ipty * mys + mys / 2, 3, 0, Math.PI * 2); ctx.fill();
      }

      // ── Dialogue ─────────────────────────────────────────────────────────
      if (showDialogue && talkableNPC) {
        const npc = talkableNPC as NPCState;
        const def = NPC_DEFS.find(d => d.id === npc.id)!;
        const bx = W / 2 - 160, by = H - 120;
        ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.beginPath(); ctx.roundRect(bx, by, 320, 80, 16); ctx.fill();
        ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(bx + 24, by - 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
        const words = dialogueText.split(' ');
        let line = '', ly = by + 28;
        for (const w of words) {
          const t2 = line + w + ' ';
          if (ctx.measureText(t2).width > 280) { ctx.fillText(line, bx + 20, ly); line = w + ' '; ly += 20; }
          else line = t2;
        }
        ctx.fillText(line, bx + 20, ly);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px sans-serif';
        ctx.fillText('(press Q to close)', bx + 160, by + 68);
      }
    }

    // ─── Update ────────────────────────────────────────────────────────────
    function update(ts: number) {
      if (ts - lastZoneUpdate > 500) {
        lastZoneUpdate = ts;
        zoneName = getZone(ptx, pty)?.name || 'GoodBot Campus';
      }

      if (mode === 'exterior') {
        // NPC proximity
        if (!pMoving && !showDialogue) {
          for (const npc of npcStatesRef.current) {
            const dx = Math.abs(npc.tx - ptx), dy = Math.abs(npc.ty - pty);
            if (dx <= 1 && dy <= 1 && dx + dy <= 1) { talkableNPC = npc; break; }
          }
          if (!talkableNPC) {
            const inRange = npcStatesRef.current.some(n => Math.abs(n.tx - ptx) <= 1 && Math.abs(n.ty - pty) <= 1);
            if (!inRange) talkableNPC = null;
          }
        }

        // Movement
        if (!pMoving) {
          let dx = 0, dy = 0;
          if (keys.has('w') || keys.has('arrowup')) { dy = -1; pdir = 'N'; }
          else if (keys.has('s') || keys.has('arrowdown')) { dy = 1; pdir = 'S'; }
          else if (keys.has('a') || keys.has('arrowleft')) { dx = -1; pdir = 'W'; }
          else if (keys.has('d') || keys.has('arrowright')) { dx = 1; pdir = 'E'; }
          if (dx || dy) {
            if (canWalk(ptx + dx, pty + dy)) {
              ptx += dx; pty += dy;
              pTargetX = ptx * TILE_SIZE + TILE_SIZE / 2;
              pTargetY = pty * TILE_SIZE + TILE_SIZE / 2;
              pMoving = true; pFrame = (pFrame + 1) % 2;
            }
          }
        }
        if (pMoving) {
          const dx = pTargetX - px, dy = pTargetY - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < STEP) { px = pTargetX; py = pTargetY; pMoving = false; }
          else { px += (dx / dist) * STEP; py += (dy / dist) * STEP; }
        }

        cameraUpdate(cam, px, py, 0.08);

        if (keys.has('e')) { keys.delete('e'); const bid = nearExteriorDoor(); if (bid) {
          mode = 'interior'; currentBid = bid;
          const interior = INTERIORS[bid];
          iptx = interior.exitTile.tx; ipty = interior.exitTile.ty;
          ipx = iptx * TILE_SIZE + TILE_SIZE / 2; ipy = ipty * TILE_SIZE + TILE_SIZE / 2;
          ipMoving = false; ipdir = 'S';
        }}
        if (keys.has('q') && talkableNPC) { keys.delete('q'); showDialogue = true;
          const def = NPC_DEFS.find(d => d.id === talkableNPC!.id)!;
          dialogueText = def.dialogue[Math.floor(Math.random() * def.dialogue.length)]; }
        if (keys.has('q') && showDialogue) { keys.delete('q'); showDialogue = false; }

        updateNPCs(ts);

      } else {
        // ── INTERIOR ───────────────────────────────────────────────────────
        if (!ipMoving) {
          let dx = 0, dy = 0;
          if (keys.has('w') || keys.has('arrowup')) { dy = -1; ipdir = 'N'; }
          else if (keys.has('s') || keys.has('arrowdown')) { dy = 1; ipdir = 'S'; }
          else if (keys.has('a') || keys.has('arrowleft')) { dx = -1; ipdir = 'W'; }
          else if (keys.has('d') || keys.has('arrowright')) { dx = 1; ipdir = 'E'; }
          if (dx || dy) {
            if (canWalkInterior(iptx + dx, ipty + dy, currentBid!)) {
              iptx += dx; ipty += dy;
              ipTargetX = iptx * TILE_SIZE + TILE_SIZE / 2;
              ipTargetY = ipty * TILE_SIZE + TILE_SIZE / 2;
              ipMoving = true; ipFrame = (ipFrame + 1) % 2;
            }
          }
        }
        if (ipMoving) {
          const dx = ipTargetX - ipx, dy = ipTargetY - ipy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < STEP) { ipx = ipTargetX; ipy = ipTargetY; ipMoving = false; }
          else { ipx += (dx / dist) * STEP; ipy += (dy / dist) * STEP; }
        }

        const actId = nearActivityTile();
        if (actId && !keys.has('keys_used')) { setActivityId(actId); }
      }
    }

    let animId = 0;
    function loop(ts: number) { update(ts); render(ts); animId = requestAnimationFrame(loop); }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onEsc);
      cv.removeEventListener('click', onClick); cv.removeEventListener('touchstart', onFocus);
    };
  }, []);

  return (
    <>
      {showIntro && <IntroScreen onEnter={() => setShowIntro(false)} pCol={pCol} setPCol={setPCol} hCol={hCol} />}
      {activityId ? (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <ActivityView id={activityId} onBack={() => { setActivityId(null); }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px' }}>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: 700, fontFamily: 'Fredoka, system-ui, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: '1px' }}>
            🏫 GoodBot Campus
          </div>
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '3px solid rgba(255,255,255,0.2)' }}>
            <canvas
              ref={canvasRef} width={VP_W * TILE_SIZE} height={VP_H * TILE_SIZE} tabIndex={0}
              style={{ display: 'block', maxWidth: '100vw', height: 'auto', outline: 'none', cursor: 'pointer', background: '#1a1a2e' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
