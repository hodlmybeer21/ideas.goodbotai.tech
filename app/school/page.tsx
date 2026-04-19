'use client';

import { useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const T = 32; // tile size
const GW = 30; // grid width
const GH = 24; // grid height
const CW = GW * T; // 960
const CH = GH * T; // 768

// Tile IDs
const GRASS=0; const PATH=1; const WALL=2; const FLOOR=3; const DOOR=4;
const WATER=5; const TREE=6; const FLOWER=7; const FENCE=8; const SIGN=9;

// Palette
const PAL = ['#7EC850','#5DAE3A','#D4B896','#B89A70','#C05A3A','#A04530',
              '#E8E8E8','#D0D0D0','#8B5A2B','#5C3A1A','#4A90D9','#6AABEF',
              '#6B4423','#2D8B37','#3BAA45','#4BC452','#F0F0F0','#D4A85A'];

// Player shirt colors
const PCOLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FF9F43','#DDA0DD','#F472B6'];

// ─── Map ─────────────────────────────────────────────────────────────────────
function buildMap(): number[][] {
  const m: number[][] = Array.from({length: GH}, () => new Array(GW).fill(GRASS));
  // Fence top row 0
  for(let x=0;x<GW;x++) m[0][x]=FENCE;
  // Fence bottom row 23
  for(let x=0;x<GW;x++) m[23][x]=FENCE;
  // Left/right fence
  for(let y=0;y<GH;y++) { m[y][0]=FENCE; m[y][GW-1]=FENCE; }

  // Main building (cols 8-21, rows 3-6)
  for(let y=3;y<=6;y++) for(let x=8;x<=21;x++) m[y][x]=WALL;
  // Main building interior floors (rows 4-5, cols 9-20)
  for(let y=4;y<=5;y++) for(let x=9;x<=20;x++) m[y][x]=FLOOR;
  // Main building windows on north wall (row 3)
  for(let x=9;x<=20;x++) if(x!==10&&x!==14&&x!==17&&x!==20) { /* window */ }
  // Main building doors on north face
  m[3][10]=DOOR; m[3][14]=DOOR; m[3][17]=DOOR; m[3][20]=DOOR;

  // Main quad path (row 7)
  for(let x=0;x<GW;x++) m[7][x]=PATH;
  // Path north to main building entrance (col 14-17, row 4-6)
  for(let y=4;y<=6;y++) for(let x=14;x<=17;x++) m[y][x]=PATH;

  // West art building (cols 1-6, rows 11-13)
  for(let y=11;y<=13;y++) for(let x=1;x<=6;x++) m[y][x]=WALL;
  for(let y=12;y<=12;y++) for(let x=2;x<=5;x++) m[y][x]=FLOOR;
  m[11][3]=DOOR;
  // West path to art building (row 10)
  for(let x=1;x<=6;x++) m[10][x]=PATH;

  // East gym (cols 24-29, rows 11-13)
  for(let y=11;y<=13;y++) for(let x=24;x<=29;x++) m[y][x]=WALL;
  for(let y=12;y<=12;y++) for(let x=25;x<=28;x++) m[y][x]=FLOOR;
  // Large gym opening at row 11
  for(let x=25;x<=27;x++) m[11][x]=DOOR;
  // East path to gym (row 10)
  for(let x=24;x<=29;x++) m[10][x]=PATH;

  // South connecting path (row 15)
  for(let x=0;x<GW;x++) m[15][x]=PATH;

  // Pond/water (rows 19-20, cols 10-18)
  for(let y=19;y<=20;y++) for(let x=10;x<=18;x++) m[y][x]=WATER;

  // Scattered trees
  const trees:[number,number][] = [
    [2,3],[4,2],[2,25],[4,27], // top corners
    [9,2],[9,27],[9,3],[9,25], // near buildings
    [16,3],[16,26],[18,2],[18,27], // lower area
    [22,5],[22,24],[21,15],[22,20],
  ];
  trees.forEach(([y,x])=>{ if(y<GH&&x<GW) m[y][x]=TREE; });

  // Flowers scattered on grass
  const flowers:[number,number][] = [
    [2,10],[2,15],[2,22],[2,5],[2,8],
    [9,8],[9,22],[9,10],[9,20],
    [16,8],[16,20],[16,12],[16,15],
    [18,10],[18,22],[21,10],[21,22],
  ];
  flowers.forEach(([y,x])=>{ if(y<GH&&x<GW&&m[y][x]===GRASS) m[y][x]=FLOWER; });

  return m;
}

// ─── Room definitions ─────────────────────────────────────────────────────────
const ROOMS = [
  {id:'art',      name:'Art Room',      color:'#FFF8DC',emoji:'🎨',desc:'Color your world! Make pixel art and drawings.',   bounds:{x1:1,y1:11,x2:6,y2:13}},
  {id:'gym',      name:'Gym',           color:'#DEB887',emoji:'🏀',desc:'Run, jump, and play! Keeping active is super fun.',  bounds:{x1:24,y1:11,x2:29,y2:13}},
  {id:'main',     name:'Main Hall',     color:'#F0F0F0',emoji:'🏫',desc:'The heart of GoodBot School!',                      bounds:{x1:9,y1:4,x2:20,y2:5}},
  {id:'class1',   name:'Classroom 1',   color:'#E6F0FF',emoji:'📖',desc:'Learn and discover new things!',                  bounds:{x1:11,y1:4,x2:13,y2:5}},
  {id:'class2',   name:'Classroom 2',   color:'#E8FFE8',emoji:'🔬',desc:'Experiments and discoveries await!',               bounds:{x1:15,y1:4,x2:16,y2:5}},
  {id:'class3',   name:'Classroom 3',   color:'#FFF0E6',emoji:'🎵',desc:'Make music and noise!',                           bounds:{x1:18,y1:4,x2:19,y2:5}},
];

function getRoom(tx:number,ty:number){
  return ROOMS.find(r=>tx>=r.bounds.x1&&tx<=r.bounds.x2&&ty>=r.bounds.y1&&ty<=r.bounds.y2)||null;
}

// ─── Tile Drawing ────────────────────────────────────────────────────────────
function drawGrass(c:CanvasRenderingContext2D,wx:number,wy:number,seed:number){
  c.fillStyle='#7EC850';
  c.fillRect(wx,wy,T,T);
  // Texture dots
  const rng=(n:number)=>{ let x=Math.sin(seed*9301+ n*49297+97)%1; return x<0?x+1:x; };
  c.fillStyle='#5DAE3A';
  for(let i=0;i<6;i++){
    const dx=Math.floor(rng(i*2)*T);
    const dy=Math.floor(rng(i*2+1)*T);
    c.fillRect(wx+dx,wy+dy,2,2);
  }
}

function drawPath(c:CanvasRenderingContext2D,wx:number,wy:number){
  c.fillStyle='#D4B896';
  c.fillRect(wx,wy,T,T);
  c.fillStyle='#B89A70';
  c.fillRect(wx,wy,T,1);
  c.fillRect(wx,wy,1,T);
  c.fillStyle='#C4A882';
  for(let i=0;i<4;i++){
    c.fillRect(wx+(i%2)*14+4,wy+Math.floor(i/2)*14+4,2,2);
  }
}

function drawWall(c:CanvasRenderingContext2D,wx:number,wy:number,isWindow:boolean){
  c.fillStyle='#C05A3A';
  c.fillRect(wx,wy,T,T);
  c.fillStyle='#A04530';
  for(let row=0;row<4;row++){
    c.fillRect(wx,wy+row*8, T,2);
    const offset=(row%2)*8;
    for(let col=0;col<4;col++){
      c.fillRect(wx+col*8+offset,wy+row*8+2, 2,6);
    }
  }
  if(isWindow){
    c.fillStyle='#87CEEB';
    c.fillRect(wx+10,wy+8,12,12);
    c.fillStyle='rgba(255,255,255,0.4)';
    c.fillRect(wx+10,wy+8,6,6);
  }
}

function drawFloor(c:CanvasRenderingContext2D,wx:number,wy:number){
  for(let gy=0;gy<4;gy++) for(let gx=0;gx<4;gx++){
    c.fillStyle=(gx+gy)%2===0?'#E8E8E8':'#D0D0D0';
    c.fillRect(wx+gx*8,wy+gy*8,8,8);
  }
}

function drawDoor(c:CanvasRenderingContext2D,wx:number,wy:number){
  // Frame
  c.fillStyle='#5C3A1A';
  c.fillRect(wx+2,wy,T-4,T-2);
  // Door panel
  c.fillStyle='#8B5A2B';
  c.fillRect(wx+5,wy+3,T-10,T-6);
  // Knob
  c.fillStyle='#DAA520';
  c.fillRect(wx+T-12,wy+T/2,3,3);
}

function drawWater(c:CanvasRenderingContext2D,wx:number,wy:number,t:number){
  c.fillStyle='#4A90D9';
  c.fillRect(wx,wy,T,T);
  c.strokeStyle='#6AABEF';
  c.lineWidth=1.5;
  const off=Math.sin(t*0.002+wx*0.1)*3;
  c.beginPath();
  c.moveTo(wx,wy+10+off);
  c.quadraticCurveTo(wx+T/2,wy+7+off,wx+T,wy+10+off);
  c.stroke();
  c.beginPath();
  c.moveTo(wx,wy+20+off*0.7);
  c.quadraticCurveTo(wx+T/2,wy+17+off*0.7,wx+T,wy+20+off*0.7);
  c.stroke();
}

function drawTree(c:CanvasRenderingContext2D,wx:number,wy:number){
  // Trunk
  c.fillStyle='#6B4423';
  c.fillRect(wx+T/2-3,wy+T-10,6,10);
  // Bottom layer
  c.fillStyle='#2D8B37';
  c.beginPath();
  c.moveTo(wx+T/2,wy+6);
  c.lineTo(wx+T-2,wy+T-10);
  c.lineTo(wx+2,wy+T-10);
  c.closePath();
  c.fill();
  // Middle layer
  c.fillStyle='#3BAA45';
  c.beginPath();
  c.moveTo(wx+T/2,wy);
  c.lineTo(wx+T-4,wy+10);
  c.lineTo(wx+4,wy+10);
  c.closePath();
  c.fill();
}

function drawFlower(c:CanvasRenderingContext2D,wx:number,wy:number,seed:number){
  drawGrass(c,wx,wy,seed);
  const rng=(n:number)=>Math.abs(Math.sin(seed*9301+n*49297+97))%1;
  const cols=['#FF69B4','#FFD700','#FFFFFF','#FF6B6B','#DDA0DD'];
  for(let i=0;i<4;i++){
    c.fillStyle=cols[Math.floor(rng(i)*cols.length)];
    c.fillRect(wx+4+i*6+(seed%3)*2,wy+4+(i*7)%20,3,3);
  }
}

function drawFence(c:CanvasRenderingContext2D,wx:number,wy:number){
  c.fillStyle='#F0F0F0';
  c.fillRect(wx,wy,T,T);
  c.fillStyle='#D0D0D0';
  // Horizontal rails
  c.fillRect(wx,wy+8, T,3);
  c.fillRect(wx,wy+20,T,3);
  // Vertical posts
  for(let i=0;i<4;i++){
    c.fillRect(wx+i*8+1,wy+4, 4,T-8);
  }
}

function drawSign(c:CanvasRenderingContext2D,wx:number,wy:number,text:string){
  c.fillStyle='#6B4423';
  c.fillRect(wx+T/2-2,wy+T/2,T/2,10);
  c.fillStyle='#D4A85A';
  c.fillRect(wx+4,wy+4,T-8,14);
  c.fillStyle='#333';
  c.font='bold 7px monospace';
  c.textAlign='center';
  c.fillText(text.substring(0,8),wx+T/2,wy+14);
}

// ─── Sprite Drawing ──────────────────────────────────────────────────────────
function drawSprite(
  c:CanvasRenderingContext2D,
  px:number, py:number, // pixel center position
  color:string,
  hairColor:string,
  dir:string, // N S E W
  frame:number, // 0 or 1
  alpha:number=1,
){
  c.save();
  c.globalAlpha=alpha;
  const s=2; // pixel scale
  const bx=Math.round(px-T/2);
  const by=Math.round(py-T/2);

  // Shadow
  c.fillStyle='rgba(0,0,0,0.15)';
  c.beginPath();
  c.ellipse(px,by+T-2,8,3,0,0,Math.PI*2);
  c.fill();

  // Legs (animated)
  const legOff=frame===1?2:0;
  c.fillStyle='#3A3A60';
  if(dir==='N'||dir==='S'){
    c.fillRect(bx+5,by+T-10+legOff,4,8);
    c.fillRect(bx+T-9,by+T-10+legOff,4,8);
  } else {
    c.fillRect(bx+5,by+T-10,4,8-legOff);
    c.fillRect(bx+T-9,by+T-10,4,8+legOff);
  }

  // Body
  c.fillStyle=color;
  c.fillRect(bx+4,by+12,T-8,14);

  // Arms
  const armOff=frame===1?1:0;
  c.fillStyle=color;
  c.fillRect(bx+1,by+13+armOff,4,10);
  c.fillRect(bx+T-5,by+13-armOff,4,10);

  // Head
  c.fillStyle='#F5C5A3';
  c.fillRect(bx+5,by+4,T-10,10);
  c.fillRect(bx+4,by+5,T-8,8);

  // Hair
  c.fillStyle=hairColor;
  if(dir==='N'||dir==='S'){
    c.fillRect(bx+4,by+2,T-8,5);
    c.fillRect(bx+3,by+4,T-6,4);
  } else {
    c.fillRect(bx+5,by+2,T-10,5);
    c.fillRect(bx+4,by+3,T-8,4);
  }

  // Eyes
  c.fillStyle='#333';
  if(dir==='S'){
    c.fillRect(bx+7,by+9,2,2);
    c.fillRect(bx+T-9,by+9,2,2);
  } else if(dir==='N'){
    // no eyes visible
  } else {
    c.fillRect(bx+8,by+9,2,2);
    c.fillRect(bx+12,by+9,2,2);
  }

  c.restore();
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SchoolGame() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const c = ctx;
    const W = CW, H = CH;
    const map = buildMap();

    // Camera
    let camX = 0, camY = 0;

    // Player
    const pColor = PCOLORS[Math.floor(Math.random()*PCOLORS.length)];
    const hColor = ['#4A3728','#8B4513','#2C1810','#D4A853','#1A1A2E'][Math.floor(Math.random()*5)];
    let px = 15*T + T/2, py = 7*T + T/2; // start on main path
    let ptx = 15, pty = 7; // tile position
    let pdir = 'S';
    let pFrame = 0;
    let pMoving = false;
    let pTargetX = px, pTargetY = py;
    let lastStep = 0;
    const STEP = 3;

    // Interior mode
    let inInterior = false;
    let intRoom: typeof ROOMS[0]|null = null;

    // NPCs
    const npcs = [
      {x:10*T+T/2, y:7*T+T/2, tx:10, ty:7, dir:'E', color:'#4ECDC4', hair:'#8B4513', frame:0, wait:0, wp:0,
       route:[{x:10,y:7},{x:20,y:7},{x:20,y:7},{x:10,y:7}]},
      {x:5*T+T/2,  y:10*T+T/2, tx:5, ty:10, dir:'S', color:'#FF9F43', hair:'#2C1810', frame:0, wait:0, wp:0,
       route:[{x:5,y:10},{x:5,y:7},{x:5,y:10}]},
      {x:25*T+T/2, y:15*T+T/2, tx:25, ty:15, dir:'W', color:'#DDA0DD', hair:'#1A1A2E', frame:0, wait:0, wp:0,
       route:[{x:25,y:15},{x:15,y:15},{x:25,y:15}]},
    ];
    let lastNpcUpdate = 0;

    // Input
    const keys: Set<string> = new Set();
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','e'].includes(e.key.toLowerCase()))
        e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Pre-render static tile textures to offscreen canvas
    const tileCache: (HTMLCanvasElement|null)[] = Array(10).fill(null);
    function getTileCanvas(id: number, t: number): HTMLCanvasElement {
      if (!tileCache[id]) {
        const oc = document.createElement('canvas');
        oc.width = T; oc.height = T;
        const cc = oc.getContext('2d')!;
        if(id===GRASS)  drawGrass(cc,0,0,0);
        else if(id===PATH)  drawPath(cc,0,0);
        else if(id===WALL) drawWall(cc,0,0,false);
        else if(id===FLOOR) drawFloor(cc,0,0);
        else if(id===DOOR)  drawDoor(cc,0,0);
        else if(id===WATER) drawWater(cc,0,0,t);
        else if(id===TREE)  drawTree(cc,0,0);
        else if(id===FLOWER) drawFlower(cc,0,0,0);
        else if(id===FENCE)  drawFence(cc,0,0);
        tileCache[id] = oc;
      }
      return tileCache[id]!;
    }

    function canWalk(tx: number, ty: number): boolean {
      if(tx<0||tx>=GW||ty<0||ty>=GH) return false;
      const t = map[ty][tx];
      return t!==WALL && t!==TREE && t!==FENCE && t!==WATER;
    }

    function getInteractDoor(): typeof ROOMS[0]|null {
      const dirs=[[0,-1],[0,1],[-1,0],[1,0],[0,0]];
      for(const [dx,dy] of dirs){
        const nx=ptx+dx, ny=pty+dy;
        if(nx<0||nx>=GW||ny<0||ny>=GH) continue;
        if(map[ny][nx]===DOOR) return getRoom(nx,ny);
      }
      return null;
    }

    function worldToScreen(wx:number,wy:number):[number,number] {
      return [wx - camX, wy - camY];
    }

    function clampCam(){
      camX = Math.max(0, Math.min(W-W, ptx*T - W/2 + T/2));
      camY = Math.max(0, Math.min(H-H, pty*T - H/2 + T/2));
      if(W > W) camX = Math.max(0, camX); // dummy
    }

    let animId: number;
    let lastTs = 0;

    function update(ts: number) {
      const dt = ts - lastTs;
      lastTs = ts;

      if(inInterior) return;

      // Player movement
      if(!pMoving){
        let dx=0,dy=0;
        if(keys.has('w')||keys.has('arrowup'))    {dy=-1;pdir='N';}
        else if(keys.has('s')||keys.has('arrowdown'))  {dy=1;pdir='S';}
        else if(keys.has('a')||keys.has('arrowleft'))  {dx=-1;pdir='W';}
        else if(keys.has('d')||keys.has('arrowright')) {dx=1;pdir='E';}
        if(dx||dy){
          const nx=ptx+dx, ny=pty+dy;
          if(canWalk(nx,ny)){
            ptx=nx; pty=ny;
            pTargetX=ptx*T+T/2; pTargetY=pty*T+T/2;
            pMoving=true;
            pFrame=(pFrame+1)%2;
          }
        }
      }

      if(pMoving){
        const dx=pTargetX-px, dy=pTargetY-py;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<STEP){
          px=pTargetX; py=pTargetY;
          pMoving=false;
        } else {
          px+=(dx/dist)*STEP;
          py+=(dy/dist)*STEP;
        }
      }

      // NPC movement
      if(ts-lastNpcUpdate>400){
        lastNpcUpdate=ts;
        for(const npc of npcs){
          npc.wait++;
          if(npc.wait>3){
            npc.wait=0;
            const next=npc.route[npc.wp];
            const ndx=next.x-npc.tx, ndy=next.y-npc.ty;
            if(ndx!==0||ndy!==0){
              npc.tx+=Math.sign(ndx); npc.ty+=Math.sign(ndy);
              npc.x=npc.tx*T+T/2; npc.y=npc.ty*T+T/2;
              npc.dir=ndx<0?'W':ndx>0?'E':ndy<0?'N':'S';
              npc.frame=(npc.frame+1)%2;
            }
            npc.wp=(npc.wp+1)%npc.route.length;
          }
        }
      }

      // E key — interact
      if(keys.has('e')){
        keys.delete('e');
        const door=getInteractDoor();
        if(door){
          inInterior=true;
          intRoom=door;
        }
      }

      // Camera
      const tpx=px-W/2, tpy=py-H/2;
      camX+=(tpx-camX)*0.12;
      camY+=(tpy-camY)*0.12;
      camX=Math.max(0,Math.min(W-W,camX));
      camY=Math.max(0,Math.min(H-H,camY));
    }

    function render(ts: number) {
      c.fillStyle='#5C8B3A';
      c.fillRect(0,0,W,H);

      // Tiles
      const startX=Math.max(0,Math.floor(camX/T));
      const startY=Math.max(0,Math.floor(camY/T));
      const endX=Math.min(GW,startX+Math.ceil(W/T)+2);
      const endY=Math.min(GH,startY+Math.ceil(H/T)+2);

      for(let ty=startY;ty<endY;ty++){
        for(let tx=startX;tx<endX;tx++){
          const t=map[ty][tx];
          const wx=tx*T-camX, wy=ty*T-camY;
          if(t===GRASS)   drawGrass(c,wx,wy,tx*100+ty);
          else if(t===PATH)   drawPath(c,wx,wy);
          else if(t===WALL)   drawWall(c,wx,wy,false);
          else if(t===FLOOR)  drawFloor(c,wx,wy);
          else if(t===DOOR)   drawDoor(c,wx,wy);
          else if(t===WATER)  drawWater(c,wx,wy,ts);
          else if(t===TREE)   drawTree(c,wx,wy);
          else if(t===FLOWER)  drawFlower(c,wx,wy,tx*17+ty);
          else if(t===FENCE)   drawFence(c,wx,wy);
        }
      }

      // NPCs (sorted by Y for depth)
      const entities=[...npcs].sort((a,b)=>a.y-b.y);
      for(const npc of entities){
        const [sx,sy]=worldToScreen(npc.x,npc.y);
        if(sx<-T||sx>W+T||sy<-T||sy>H+T) continue;
        drawSprite(c,sx,sy,npc.color,npc.hair,npc.dir,npc.frame,0.95);
      }

      // Player
      const [spx,spy]=worldToScreen(px,py);
      drawSprite(c,spx,spy,pColor,hColor,pdir,pFrame,1);

      // Door interaction prompt
      if(!inInterior){
        const door=getInteractDoor();
        if(door){
          c.fillStyle='rgba(0,0,0,0.7)';
          c.roundRect(W/2-90,H-80,180,28,8);
          c.fill();
          c.fillStyle='#FFE066';
          c.font='bold 12px sans-serif';
          c.textAlign='center';
          c.fillText(`Press E for ${door.emoji} ${door.name}`,W/2,H-62);
        }
      }

      // Interior overlay
      if(inInterior && intRoom){
        c.fillStyle='rgba(0,0,0,0.75)';
        c.fillRect(0,0,W,H);
        // Room box
        const bw=480,bh=340,bx=(W-bw)/2,by=(H-bh)/2;
        c.fillStyle=intRoom.color;
        c.strokeStyle='rgba(0,0,0,0.3)';
        c.lineWidth=4;
        c.roundRect(bx,by,bw,bh,20);
        c.fill();c.stroke();
        // Room emoji
        c.font='72px sans-serif';
        c.textAlign='center';
        c.fillText(intRoom.emoji,W/2,by+100);
        // Room name
        c.fillStyle='#222';
        c.font='bold 26px sans-serif';
        c.fillText(intRoom.name,W/2,by+150);
        // Description
        c.font='15px sans-serif';
        c.fillStyle='#555';
        const words=intRoom.desc.split(' ');
        let line='',ly=by+185;
        for(const w of words){
          const test=line+w+' ';
          if(c.measureText(test).width>bw-60){ c.fillText(line,W/2,ly); line=w+' '; ly+=22; }
          else line=test;
        }
        c.fillText(line,W/2,ly);
        // Coming soon
        c.fillStyle='#888';
        c.font='italic 13px sans-serif';
        c.fillText('✨ Activity coming soon!',W/2,ly+35);
        // Exit button
        c.fillStyle='rgba(0,0,0,0.12)';
        c.roundRect(W/2-70,by+bh-55,140,34,10);c.fill();
        c.fillStyle='#333';
        c.font='bold 14px sans-serif';
        c.fillText('← Back Outside (ESC)',W/2,by+bh-33);
      }

      // HUD
      c.fillStyle='rgba(0,0,0,0.55)';
      c.roundRect(10,10,200,30,8);c.fill();
      const room=getRoom(ptx,pty);
      c.fillStyle='#fff';
      c.font='bold 13px sans-serif';
      c.textAlign='left';
      c.fillText(room?`${room.emoji} ${room.name}`:'🏫 GoodBot School',18,30);

      // Controls
      c.fillStyle='rgba(0,0,0,0.45)';
      c.roundRect(10,H-34,200,24,6);c.fill();
      c.fillStyle='rgba(255,255,255,0.75)';
      c.font='11px sans-serif';
      c.fillText('WASD to move  ·  E to interact  ·  ESC interior',18,H-18);

      // Minimap
      const mw=100,mh=80,mx=W-mw-10,my=10;
      c.fillStyle='rgba(0,0,0,0.6)';
      c.roundRect(mx-2,my-2,mw+4,mh+4,6);c.fill();
      const sx=mw/GW, sy=mh/GH;
      for(let ty=0;ty<GH;ty++) for(let tx=0;tx<GW;tx++){
        const t=map[ty][tx];
        if(t===WALL||t===TREE) c.fillStyle='#5C4033';
        else if(t===PATH||t===DOOR) c.fillStyle='#B89A70';
        else if(t===WATER) c.fillStyle='#4A90D9';
        else if(t===FLOOR) c.fillStyle='#888';
        else continue;
        c.fillRect(mx+tx*sx,my+ty*sy,sx+0.5,sy+0.5);
      }
      // NPCs on minimap
      for(const npc of npcs){
        c.fillStyle=npc.color;
        c.beginPath();
        c.arc(mx+npc.tx*sx+sx/2,my+npc.ty*sy+sy/2,2,0,Math.PI*2);
        c.fill();
      }
      // Player dot
      c.fillStyle=pColor;
      c.beginPath();
      c.arc(mx+ptx*sx+sx/2,my+pty*sy+sy/2,3,0,Math.PI*2);
      c.fill();
    }

    function loop(ts: number) {
      update(ts);
      render(ts);
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    const handleEsc = (e: KeyboardEvent) => {
      if(e.key==='Escape'&&inInterior){ inInterior=false; intRoom=null; }
    };
    window.addEventListener('keydown',handleEsc);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',handleKeyDown);
      window.removeEventListener('keyup',handleKeyUp);
      window.removeEventListener('keydown',handleEsc);
    };
  }, []);

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#5C8B3A 0%,#3A6B2A 100%)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'16px 0', gap:'12px',
    }}>
      <div style={{
        color:'#fff', fontSize:'22px', fontWeight:700, fontFamily:'sans-serif',
        textShadow:'0 2px 8px rgba(0,0,0,0.4)', letterSpacing:'1px',
      }}>
        🏫 GoodBot School
      </div>
      <div style={{
        borderRadius:'12px', overflow:'hidden',
        boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        border:'3px solid rgba(255,255,255,0.2)',
      }}>
        <canvas ref={ref} width={CW} height={CH}
          style={{display:'block', maxWidth:'100vw', height:'auto'}} />
      </div>
    </div>
  );
}
