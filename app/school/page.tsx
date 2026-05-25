'use client';

import { useEffect, useRef, useState } from 'react';
import { TILE_SIZE, WORLD_W, WORLD_H, VP_W, VP_H, buildWorld, getBuildingDoor, BUILDINGS } from './lib/worldData';
import { INTERIORS } from './lib/interiors';
import { NPC_DEFS, makeNPCState, type NPCState } from './lib/npcs';
import { drawTile } from './lib/renderer';
import { playerScreen, screenEdgeDirection, snapPlayerToNewScreen, type TransitionState, startTransition, updateTransition, type ScreenCoord } from './lib/screenEngine';
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

const MOVE_SPEED = 2;

function drawSprite(c: CanvasRenderingContext2D, sx: number, sy: number, col: string, hair: string, dir: string, frame: number) {
  const S = TILE_SIZE;
  const bx = Math.round(sx - S / 2), by = Math.round(sy - S / 2);
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.ellipse(sx, by + S - 1, 5, 2, 0, 0, Math.PI * 2); c.fill();
  const walk = frame % 2;
  const legOff = walk === 1 ? 1 : 0;
  c.fillStyle = '#28346C';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx + 2, by + 8, 3, 4 + legOff);
    c.fillRect(bx + S - 5, by + 8, 3, 4 + (1 - legOff));
  } else {
    c.fillRect(bx + 3, by + 8, 3, 4 + legOff);
    c.fillRect(bx + 3, by + 8, 3, 4 + (1 - legOff));
  }
  c.fillStyle = '#3A2010';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx + 1, by + S - 2, 4, 2);
    c.fillRect(bx + S - 5, by + S - 2, 4, 2);
  }
  c.fillStyle = col;
  c.fillRect(bx + 2, by + 5, S - 4, 5);
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(bx + 2, by + 8, S - 4, 2);
  const armOff = walk === 1 ? 1 : 0;
  c.fillStyle = '#F0C8A0';
  if (dir === 'S' || dir === 'N') {
    c.fillRect(bx, by + 5, 2, 4 - armOff);
    c.fillRect(bx + S - 2, by + 5, 2, 4 + armOff);
  } else {
    c.fillStyle = col;
    c.fillRect(bx, by + 5, 2, 4); c.fillRect(bx + S - 2, by + 5, 2, 4);
    c.fillStyle = '#F0C8A0';
    if (dir === 'E') { c.fillRect(bx + S - 2, by + 5, 3, 3); c.fillRect(bx, by + 5, 2, 4 - armOff); }
    else { c.fillRect(bx - 1, by + 5, 3, 3); c.fillRect(bx + S - 2, by + 5, 2, 4 - armOff); }
  }
  c.fillStyle = '#F0C8A0';
  c.fillRect(bx + S / 2 - 1, by + 4, 2, 2);
  c.fillRect(bx + 2, by + 1, S - 4, 4);
  c.fillRect(bx + 1, by + 2, S - 2, 3);
  c.fillStyle = hair;
  if (dir === 'N') { c.fillRect(bx + 1, by, S - 2, 3); c.fillRect(bx + 2, by + 1, S - 4, 2); }
  else if (dir === 'S') { c.fillRect(bx + 1, by, S - 2, 2); c.fillRect(bx + 1, by + 1, 2, 2); c.fillRect(bx + S - 3, by + 1, 2, 2); }
  else { c.fillRect(bx + 1, by, S - 2, 3); if (dir === 'E') { c.fillRect(bx + S - 3, by + 1, 2, 2); } else { c.fillRect(bx + 1, by + 1, 2, 2); } }
  c.fillStyle = '#1A1020';
  if (dir === 'S') { c.fillRect(bx + 3, by + 3, 2, 2); c.fillRect(bx + S - 5, by + 3, 2, 2); c.fillStyle = '#FFFFFF'; c.fillRect(bx + 3, by + 3, 1, 1); c.fillRect(bx + S - 5, by + 3, 1, 1); }
  else if (dir === 'N') { /* no eyes from back */ }
  else { const eyeX = dir === 'E' ? bx + 5 : bx + S - 7; c.fillStyle = '#1A1020'; c.fillRect(eyeX, by + 3, 2, 2); c.fillStyle = '#FFFFFF'; c.fillRect(eyeX, by + 3, 1, 1); }
}

function ActivityView({ id, onBack }: { id: string; onBack: () => void }) {
  const acts: any = {
    pixelstudio: <PixelCanvas onBack={onBack} />, statefinder: <StateFinder onBack={onBack} />, colorlab: <ColorLab onBack={onBack} />,
    mathlab: <MathLab onBack={onBack} kidName="Explorer" />, animalmatch: <AnimalMatch onBack={onBack} kidName="Explorer" />,
    readalong: <ReadAlong onBack={onBack} kidName="Explorer" />, syllablescooper: <SyllableScooper />,
    telltime: <TellTime onBack={onBack} kidName="Explorer" />, sentencebuilder: <SentenceBuilder onBack={onBack} kidName="Explorer" />,
    storymachine: <StoryMachine kidName="Explorer" onBack={onBack} />, madlibs: <MadLibs onBack={onBack} kidName="Explorer" />,
    charactertraits: <CharacterTraits onBack={onBack} />, soundlab: <SoundLab onBack={onBack} kidName="Explorer" />,
    truefalse: <TrueFalse onBack={onBack} kidName="Explorer" />,
  };
  return <>{acts[id] || <div className="flex items-center justify-center h-screen text-white text-xl">Coming soon! 🎮</div>}</>;
}

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

export default function CampusGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [pCol, setPCol] = useState('#FF6B6B');
  const [hCol] = useState('#2C1810');
  const worldRef = useRef<number[][] | null>(null);
  const npcStatesRef = useRef<NPCState[]>([]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = VP_W * TILE_SIZE;
    const H = VP_H * TILE_SIZE;
    cv.width = W; cv.height = H;
    worldRef.current = buildWorld();
    npcStatesRef.current = NPC_DEFS.map(makeNPCState);

    let px = 30 * TILE_SIZE + TILE_SIZE / 2;
    let py = 17 * TILE_SIZE + TILE_SIZE / 2;
    let ptx = 30, pty = 17;
    let pdir: 'N' | 'S' | 'E' | 'W' = 'S';
    let pFrame = 0;
    let pMoving = false;
    let pTargetX = px, pTargetY = py;
    let curScreen: ScreenCoord = playerScreen(px, py);
    let camX = curScreen.col * VP_W * TILE_SIZE;
    let camY = curScreen.row * VP_H * TILE_SIZE;
    let trans: TransitionState = { phase: 'none', progress: 0, targetScreen: curScreen, callback: null };
    let mode: 'exterior' | 'interior' = 'exterior';
    let currentBid: string | null = null;
    let iptx = 7, ipty = 5;
    let ipx = 7 * TILE_SIZE + TILE_SIZE / 2;
    let ipy = 5 * TILE_SIZE + TILE_SIZE / 2;
    let ipMoving = false, ipTargetX = ipx, ipTargetY = ipy;
    let ipdir: 'N' | 'S' | 'E' | 'W' = 'S', ipFrame = 0;
    let interiorCamX = 0, interiorCamY = 0;
    let showDialogue = false, dialogueText = '';
    let talkableNPC: NPCState | null = null;

    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => { keys.add(e.key.toLowerCase()); if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e','q','escape',' '].includes(e.key.toLowerCase())) e.preventDefault(); };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    cv.tabIndex = 0; cv.style.outline = 'none'; cv.focus();
    cv.addEventListener('touchstart', () => cv.focus(), { passive: true });

    function canWalk(tx: number, ty: number): boolean {
      const world = worldRef.current!;
      if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return false;
      return world[ty][tx] !== 2 && world[ty][tx] !== 6 && world[ty][tx] !== 8;
    }
    function canWalkInterior(tx: number, ty: number, bid: string): boolean {
      const tiles = INTERIORS[bid]?.tiles;
      if (!tiles) return false;
      if (tx < 0 || tx >= tiles[0].length || ty < 0 || ty >= tiles.length) return false;
      return tiles[ty][tx] !== 2;
    }
    function nearExteriorDoor(): string | null {
      for (const [dx, dy] of [[0,0],[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]]) {
        const b = getBuildingDoor(ptx + dx, pty + dy);
        if (b) return b.id;
      }
      return null;
    }
    function nearInteriorExit(): boolean {
      if (!currentBid) return false;
      return INTERIORS[currentBid]?.tiles[ipty]?.[iptx] === 4;
    }
    function nearActivityTile(): string | null {
      if (!currentBid) return null;
      const interior = INTERIORS[currentBid];
      if (!interior?.activityTiles) return null;
      for (const at of interior.activityTiles) {
        if (at.tx === iptx && at.ty === ipty) return at.activityId;
      }
      return null;
    }
    function tryMove(dx: number, dy: number) {
      const nx = ptx + dx, ny = pty + dy;
      if (canWalk(nx, ny)) { ptx = nx; pty = ny; pTargetX = ptx * TILE_SIZE + TILE_SIZE / 2; pTargetY = pty * TILE_SIZE + TILE_SIZE / 2; pMoving = true; }
      if (dx > 0) pdir = 'E'; else if (dx < 0) pdir = 'W'; else if (dy > 0) pdir = 'S'; else if (dy < 0) pdir = 'N';
    }
    function tryMoveInterior(dx: number, dy: number) {
      const nx = iptx + dx, ny = ipty + dy;
      if (canWalkInterior(nx, ny, currentBid!)) {
        iptx = nx; ipty = ny; ipTargetX = iptx * TILE_SIZE + TILE_SIZE / 2; ipTargetY = ipty * TILE_SIZE + TILE_SIZE / 2; ipMoving = true;
        if (dx > 0) ipdir = 'E'; else if (dx < 0) ipdir = 'W'; else if (dy > 0) ipdir = 'S'; else if (dy < 0) ipdir = 'N';
      }
    }
    let lastNpc = 0;
    function updateNPCs(ts: number) {
      if (ts - lastNpc < 400) return; lastNpc = ts;
      for (const npc of npcStatesRef.current) {
        const def = NPC_DEFS.find(d => d.id === npc.id)!;
        const tgt = def.route[npc.wp];
        if (npc.tx === tgt.tx && npc.ty === tgt.ty) { npc.wp = (npc.wp + 1) % def.route.length; continue; }
        const dx = Math.sign(tgt.tx - npc.tx); const dy = Math.sign(tgt.ty - npc.ty);
        if (dx) { npc.tx += dx; npc.x = npc.tx * TILE_SIZE + TILE_SIZE / 2; npc.dir = dx > 0 ? 'E' : 'W'; }
        else if (dy) { npc.ty += dy; npc.y = npc.ty * TILE_SIZE + TILE_SIZE / 2; npc.dir = dy > 0 ? 'S' : 'N'; }
        npc.frame = (npc.frame + 1) % 2;
      }
    }
    function update(ts: number) {
      if (showDialogue || activityId) return;
      if (mode === 'exterior' && trans.phase === 'none') {
        if (!pMoving) {
          let dx = 0, dy = 0;
          if (keys.has('w') || keys.has('arrowup')) dy = -1;
          else if (keys.has('s') || keys.has('arrowdown')) dy = 1;
          else if (keys.has('a') || keys.has('arrowleft')) dx = -1;
          else if (keys.has('d') || keys.has('arrowright')) dx = 1;
          if (dx || dy) tryMove(dx, dy);
        }
        if (pMoving) {
          const dx = pTargetX - px, dy = pTargetY - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOVE_SPEED) {
            px = pTargetX; py = pTargetY; pMoving = false;
            px = ptx * TILE_SIZE + TILE_SIZE / 2; py = pty * TILE_SIZE + TILE_SIZE / 2;
            const newScreen = playerScreen(px, py);
            if (newScreen.col !== curScreen.col || newScreen.row !== curScreen.row) {
              const dir = screenEdgeDirection(px, py);
              if (dir) {
                const result = snapPlayerToNewScreen(px, py, dir);
                const targetScreen: ScreenCoord = { col: result.screenCol, row: result.screenRow };
                trans = startTransition(targetScreen, () => {
                  px = result.px; py = result.py;
                  ptx = Math.floor(px / TILE_SIZE); pty = Math.floor(py / TILE_SIZE);
                  curScreen = targetScreen;
                  camX = curScreen.col * VP_W * TILE_SIZE; camY = curScreen.row * VP_H * TILE_SIZE;
                });
              }
            }
          } else {
            px += (dx / dist) * MOVE_SPEED; py += (dy / dist) * MOVE_SPEED;
            pFrame = (pFrame + 0.15) % 2;
          }
        }
        const screenOX = curScreen.col * VP_W * TILE_SIZE;
        const screenOY = curScreen.row * VP_H * TILE_SIZE;
        const targetCamX = px - W / 2;
        const targetCamY = py - H / 2;
        camX += (targetCamX - camX) * 0.15;
        camY += (targetCamY - camY) * 0.15;
        camX = Math.max(screenOX, Math.min(screenOX + W, camX));
        camY = Math.max(screenOY, Math.min(screenOY + H, camY));
        if (keys.has('e')) { keys.delete('e');
          const bid = nearExteriorDoor();
          if (bid) {
            mode = 'interior'; currentBid = bid;
            const interior = INTERIORS[bid];
            iptx = interior.exitTile.tx; ipty = interior.exitTile.ty;
            ipx = iptx * TILE_SIZE + TILE_SIZE / 2; ipy = ipty * TILE_SIZE + TILE_SIZE / 2;
            ipMoving = false; ipdir = 'S'; interiorCamX = 0; interiorCamY = 0;
          }
        }
        if (keys.has('q') && talkableNPC) { keys.delete('q'); showDialogue = true; const def = NPC_DEFS.find(d => d.id === talkableNPC!.id)!; dialogueText = def.dialogue[Math.floor(Math.random() * def.dialogue.length)]; }
        if (keys.has('q') && showDialogue) { keys.delete('q'); showDialogue = false; }
        updateNPCs(ts);
        talkableNPC = null;
        for (const npc of npcStatesRef.current) { const dx = Math.abs(ptx - npc.tx), dy = Math.abs(pty - npc.ty); if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) { talkableNPC = npc; break; } }
      } else if (mode === 'interior' && trans.phase === 'none') {
        if (!ipMoving) {
          let dx = 0, dy = 0;
          if (keys.has('w') || keys.has('arrowup')) dy = -1;
          else if (keys.has('s') || keys.has('arrowdown')) dy = 1;
          else if (keys.has('a') || keys.has('arrowleft')) dx = -1;
          else if (keys.has('d') || keys.has('arrowright')) dx = 1;
          if (dx || dy) tryMoveInterior(dx, dy);
        }
        if (ipMoving) {
          const dx = ipTargetX - ipx, dy = ipTargetY - ipy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOVE_SPEED) { ipx = ipTargetX; ipy = ipTargetY; ipMoving = false; ipx = iptx * TILE_SIZE + TILE_SIZE / 2; ipy = ipty * TILE_SIZE + TILE_SIZE / 2; }
          else { ipx += (dx / dist) * MOVE_SPEED; ipy += (dy / dist) * MOVE_SPEED; ipFrame = (ipFrame + 0.15) % 2; }
        }
        const interior = INTERIORS[currentBid!];
        if (interior) {
          const iW = interior.tiles[0].length * TILE_SIZE;
          const iH = interior.tiles.length * TILE_SIZE;
          const targetCamX = Math.max(0, Math.min(ipx - W / 2, iW - W));
          const targetCamY = Math.max(0, Math.min(ipy - H / 2, iH - H));
          interiorCamX += (targetCamX - interiorCamX) * 0.15;
          interiorCamY += (targetCamY - interiorCamY) * 0.15;
        }
        if (keys.has('escape')) { keys.delete('escape'); if (nearInteriorExit()) { mode = 'exterior'; currentBid = null; px = ptx * TILE_SIZE + TILE_SIZE / 2; py = pty * TILE_SIZE + TILE_SIZE / 2; } }
        const actId = nearActivityTile(); if (actId) setActivityId(actId);
      } else if (trans.phase !== 'none') { const done = updateTransition(ts, trans); if (done) { trans.phase = 'none'; } }
    }
    function render(ts: number) {
      if (!ctx) return;
      const world = worldRef.current!;
      ctx.fillStyle = '#5a9e38'; ctx.fillRect(0, 0, W, H);
      if (mode === 'exterior') {
        const sx0 = Math.max(0, Math.floor(camX / TILE_SIZE));
        const sy0 = Math.max(0, Math.floor(camY / TILE_SIZE));
        const sx1 = Math.min(WORLD_W, Math.ceil((camX + W) / TILE_SIZE) + 1);
        const sy1 = Math.min(WORLD_H, Math.ceil((camY + H) / TILE_SIZE) + 1);
        for (let ty = sy0; ty < sy1; ty++) { for (let tx = sx0; tx < sx1; tx++) { if (ty < 0 || ty >= WORLD_H || tx < 0 || tx >= WORLD_W) continue; drawTile(ctx, world[ty][tx], tx * TILE_SIZE - camX, ty * TILE_SIZE - camY, ts); } }
        const sortedNPCs = [...npcStatesRef.current].sort((a, b) => a.y - b.y);
        for (const npc of sortedNPCs) {
          const vx = npc.x - camX, vy = npc.y - camY;
          if (vx < -TILE_SIZE || vx > W + TILE_SIZE || vy < -TILE_SIZE || vy > H + TILE_SIZE) continue;
          const def = NPC_DEFS.find(d => d.id === npc.id)!;
          drawSprite(ctx, vx, vy, def.color, def.hairColor, npc.dir, npc.frame);
        }
        drawSprite(ctx, px - camX, py - camY, pCol, hCol, pdir, Math.floor(pFrame));
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(10, 10, 180, 26, 8); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Fredoka,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Screen ' + (curScreen.col + 1) + ',' + (curScreen.row + 1), 18, 28);
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(10, H - 34, 280, 24, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '11px sans-serif';
        ctx.fillText('WASD/Arrows: Move  E: Enter  Q: Talk', 18, H - 18);
        if (talkableNPC && !showDialogue) {
          const nx = talkableNPC.x - camX, ny = talkableNPC.y - camY;
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(nx - 50, ny - 52, 100, 22, 6); ctx.fill();
          ctx.fillStyle = '#FFE066'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Q to Talk', nx, ny - 38);
        }
        const nearDoor = nearExteriorDoor();
        if (nearDoor) { const b = BUILDINGS.find(b => b.id === nearDoor)!; ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(W / 2 - 100, H - 80, 200, 28, 8); ctx.fill(); ctx.fillStyle = '#FFE066'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.emoji + ' ' + b.name + ' -- E to enter', W / 2, H - 62); }
        const mw = 80, mh = Math.round(80 * H / W);
        const mmX = W - mw - 8, mmY = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.roundRect(mmX - 2, mmY - 2, mw + 4, mh + 4, 6); ctx.fill();
        const mxs = mw / WORLD_W, mys = mh / WORLD_H;
        for (let ty = 0; ty < WORLD_H; ty++) { for (let tx = 0; tx < WORLD_W; tx++) { const t = world[ty][tx]; if (t === 2 || t === 6) ctx.fillStyle = '#5C4033'; else if (t === 1 || t === 4) ctx.fillStyle = '#B89A70'; else if (t === 5) ctx.fillStyle = '#4A90D9'; else continue; ctx.fillRect(mmX + tx * mxs, mmY + ty * mys, mxs + 0.5, mys + 0.5); } }
        ctx.strokeStyle = '#FFE066'; ctx.lineWidth = 1.5;
        ctx.strokeRect(mmX + curScreen.col * VP_W * mxs, mmY + curScreen.row * VP_H * mys, VP_W * mxs, VP_H * mys);
        ctx.fillStyle = pCol; ctx.beginPath(); ctx.arc(mmX + ptx * mxs + mxs / 2, mmY + pty * mys + mys / 2, 3, 0, Math.PI * 2); ctx.fill();
        if (trans.phase === 'fadingOut' || trans.phase === 'fadingIn') { ctx.fillStyle = 'rgba(0,0,0,' + trans.progress + ')'; ctx.fillRect(0, 0, W, H); }
        if (showDialogue) {
          ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.beginPath(); ctx.roundRect(16, H - 100, W - 32, 80, 12); ctx.fill();
          ctx.fillStyle = '#FFE066'; ctx.font = 'bold 13px Fredoka,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(talkableNPC ? NPC_DEFS.find(d => d.id === talkableNPC!.id)?.name || '' : '', W / 2, H - 80);
          ctx.fillStyle = '#fff'; ctx.font = '14px Fredoka,sans-serif';
          ctx.fillText(dialogueText, W / 2, H - 58);
          ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px sans-serif';
          ctx.fillText('Press Q to close', W / 2, H - 22);
        }
      } else if (mode === 'interior') {
        const interior = INTERIORS[currentBid!]; if (!interior) return;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
        const sx0 = Math.max(0, Math.floor(interiorCamX / TILE_SIZE));
        const sy0 = Math.max(0, Math.floor(interiorCamY / TILE_SIZE));
        const sx1 = Math.min(interior.tiles[0].length, Math.ceil((interiorCamX + W) / TILE_SIZE) + 1);
        const sy1 = Math.min(interior.tiles.length, Math.ceil((interiorCamY + H) / TILE_SIZE) + 1);
        for (let ty = sy0; ty < sy1; ty++) { for (let tx = sx0; tx < sx1; tx++) { const t = interior.tiles[ty]?.[tx] ?? 0; drawTile(ctx, t, tx * TILE_SIZE - interiorCamX, ty * TILE_SIZE - interiorCamY, ts); } }
        drawSprite(ctx, ipx - interiorCamX, ipy - interiorCamY, pCol, hCol, ipdir, Math.floor(ipFrame));
        const bld = BUILDINGS.find(b => b.id === currentBid);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.roundRect(10, 10, 200, 26, 8); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Fredoka,sans-serif'; ctx.textAlign = 'left';
        ctx.fillText((bld?.emoji || '') + ' ' + (bld?.name || ''), 18, 28);
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(10, H - 34, 240, 24, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '11px sans-serif';
        ctx.fillText('WASD: Move  ESC: Exit', 18, H - 18);
        const nearAct = nearActivityTile();
        if (nearAct) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(W / 2 - 120, H - 80, 240, 28, 8); ctx.fill(); ctx.fillStyle = '#FFE066'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Walk to star to start activity!', W / 2, H - 62); }
        const mw = 80, mh = Math.round(80 * H / W);
        const mmX = W - mw - 8, mmY = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.beginPath(); ctx.roundRect(mmX - 2, mmY - 2, mw + 4, mh + 4, 6); ctx.fill();
        const mxs = mw / interior.tiles[0].length, mys = mh / interior.tiles.length;
        for (let ty = 0; ty < interior.tiles.length; ty++) { for (let tx = 0; tx < interior.tiles[0].length; tx++) { const t = interior.tiles[ty][tx]; ctx.fillStyle = t === 2 ? '#5C4033' : t === 3 ? '#D0C8B0' : '#1a1a2e'; ctx.fillRect(mmX + tx * mxs, mmY + ty * mys, mxs + 0.5, mys + 0.5); } }
        for (let ty = 0; ty < interior.tiles.length; ty++) { for (let tx = 0; tx < interior.tiles[0].length; tx++) { const t = interior.tiles[ty][tx]; ctx.fillStyle = t === 2 ? '#5C4033' : t === 3 ? '#D0C8B0' : '#1a1a2e'; ctx.fillRect(mmX + tx * mxs, mmY + ty * mys, mxs + 0.5, mys + 0.5); } }
        ctx.fillStyle = pCol; ctx.beginPath(); ctx.arc(mmX + iptx * mxs + mxs / 2, mmY + ipty * mys + mys / 2, 3, 0, Math.PI * 2); ctx.fill();
        if (trans.phase === 'fadingOut' || trans.phase === 'fadingIn') { ctx.fillStyle = 'rgba(0,0,0,' + trans.progress + ')'; ctx.fillRect(0, 0, W, H); }
      }
    }

    let animId = 0;
    function loop(ts: number) { update(ts); render(ts); animId = requestAnimationFrame(loop); }

    function onClick(e: MouseEvent) { if (!cv) return; const rect = cv.getBoundingClientRect(); const mx = (e.clientX - rect.left) * (W / rect.width); const my = (e.clientY - rect.top) * (H / rect.height); if (showDialogue) { showDialogue = false; return; } clickMove(mx, my); }
    function clickMove(mx: number, my: number) {
      if (mode === 'exterior') {
        const tx = Math.floor((mx + camX) / TILE_SIZE), ty = Math.floor((my + camY) / TILE_SIZE);
        if (canWalk(tx, ty)) { ptx = tx; pty = ty; pTargetX = ptx * TILE_SIZE + TILE_SIZE / 2; pTargetY = pty * TILE_SIZE + TILE_SIZE / 2; pMoving = true; }
      } else {
        const tx = Math.floor((mx + interiorCamX) / TILE_SIZE), ty = Math.floor((my + interiorCamY) / TILE_SIZE);
        if (canWalkInterior(tx, ty, currentBid!)) { iptx = tx; ipty = ty; ipTargetX = iptx * TILE_SIZE + TILE_SIZE / 2; ipTargetY = ipty * TILE_SIZE + TILE_SIZE / 2; ipMoving = true; }
      }
    }
    cv.addEventListener('click', onClick);
    const onEsc = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; if (showDialogue) { showDialogue = false; return; } if (mode === 'interior' && nearInteriorExit()) { mode = 'exterior'; currentBid = null; px = ptx * TILE_SIZE + TILE_SIZE / 2; py = pty * TILE_SIZE + TILE_SIZE / 2; } };
    window.addEventListener('keydown', onEsc);

    animId = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(animId); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('keydown', onEsc); cv.removeEventListener('click', onClick); };
  }, []);

  return (
    <>
      {showIntro && <IntroScreen onEnter={() => setShowIntro(false)} pCol={pCol} setPCol={setPCol} hCol={hCol} />}
      {activityId ? <ActivityView id={activityId} onBack={() => { setActivityId(null); }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px' }}>
          <div style={{ color: '#fff', fontSize: '22px', fontWeight: 700, fontFamily: 'Fredoka, system-ui, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: '1px' }}>GoodBot Campus</div>
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '3px solid rgba(255,255,255,0.2)' }}>
            <canvas ref={canvasRef} width={VP_W * TILE_SIZE} height={VP_H * TILE_SIZE} tabIndex={0} style={{ display: 'block', maxWidth: '100vw', height: 'auto', outline: 'none', cursor: 'pointer', background: '#1a1a2e' }} />
          </div>
        </div>
      )}
    </>
  );
}
