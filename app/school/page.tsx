'use client';

import { useEffect, useRef, useState } from 'react';
import PixelCanvas from '../components/PixelCanvas';
import StateFinder from '../components/StateFinder';

const T=32, GW=30, GH=24, CW=GW*T, CH=GH*T;
const GRASS=0,PATH=1,WALL=2,FLOOR=3,DOOR=4,WATER=5,TREE=6,FLOWER=7,FENCE=8;
const PCOLORS=['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FF9F43','#DDA0DD','#F472B6'];
const HCOLS=['#4A3728','#8B4513','#2C1810','#D4A853','#1A1A2E'];
const STEP=3;

const NPC_GREETINGS=[
  "Hey! Have you been to the Art Room yet? \U0001f3a8",
  "The Gym is so fun! I love playing there! \U0001f3c0",
  "I'm trying to learn all 50 states... so hard! \U0001f5fa",
  "Hey friend! Have you checked out the Library? \U0001f4da",
  "I heard there's a secret room somewhere... \U0001f440",
  "Hi! I love this school! What grade are you in? \u2b50",
  "The science experiments are so cool! \U0001f52c",
];

function buildMap(): number[][] {
  const m: number[][]=Array.from({length:GH},()=>new Array(GW).fill(GRASS));
  // Boundary fences
  for(let x=0;x<GW;x++){ m[0][x]=FENCE; m[GH-1][x]=FENCE; }
  for(let y=0;y<GH;y++){ m[y][0]=FENCE; m[y][GW-1]=FENCE; }
  // Main building cols 8-21 rows 3-6
  for(let y=3;y<=6;y++) for(let x=8;x<=21;x++) m[y][x]=WALL;
  for(let y=4;y<=5;y++) for(let x=9;x<=20;x++) m[y][x]=FLOOR;
  m[3][10]=DOOR; m[3][14]=DOOR; m[3][17]=DOOR; m[3][20]=DOOR; // north face doors
  // Main quad path row 7
  for(let x=0;x<GW;x++) m[7][x]=PATH;
  // Path north to main building (cols 14-17, rows 4-7)
  for(let y=4;y<=7;y++) for(let x=14;x<=17;x++) m[y][x]=PATH;
  // Art building west (cols 1-6, rows 11-13)
  for(let y=11;y<=13;y++) for(let x=1;x<=6;x++) m[y][x]=WALL;
  for(let y=12;y<=12;y++) for(let x=2;x<=5;x++) m[y][x]=FLOOR;
  m[11][3]=DOOR;
  // West path (row 10, cols 1-6)
  for(let x=1;x<=6;x++) m[10][x]=PATH;
  // Gym east (cols 24-29, rows 11-13)
  for(let y=11;y<=13;y++) for(let x=24;x<=29;x++) m[y][x]=WALL;
  for(let y=12;y<=12;y++) for(let x=25;x<=28;x++) m[y][x]=FLOOR;
  for(let x=25;x<=27;x++) m[11][x]=DOOR;
  // East path (row 10, cols 24-29)
  for(let x=24;x<=29;x++) m[10][x]=PATH;
  // South connecting path row 15
  for(let x=0;x<GW;x++) m[15][x]=PATH;
  // South path extension rows 16-17
  for(let x=0;x<GW;x++){ m[16][x]=PATH; m[17][x]=PATH; }
  // Pond rows 19-20
  for(let y=19;y<=20;y++) for(let x=10;x<=18;x++) m[y][x]=WATER;
  // Trees scattered
  [[2,3],[4,2],[2,26],[4,27],[9,2],[9,27],[16,3],[16,26],[18,2],[18,27],[22,5],[22,24]].forEach(([y,x])=>{ if(y<GH&&x<GW) m[y][x]=TREE; });
  // Flowers
  [[2,8],[2,15],[2,22],[9,8],[9,22],[16,8],[16,22],[18,10],[18,20],[21,12],[21,18]].forEach(([y,x])=>{ if(y<GH&&x<GW) m[y][x]=FLOWER; });
  return m;
}

const ROOMS=[
  {id:'art',    name:'Art Room',     color:'#FFF8DC',emoji:'\U0001f3a8',desc:'Color your world! Make pixel art and drawings.',  x1:1, y1:11,x2:6,y2:13, activityId:'pixelstudio' as const},
  {id:'gym',    name:'Gym',          color:'#DEB887',emoji:'\U0001f3c0',desc:'Run, jump, and play! Keeping active is fun.',     x1:24,y1:11,x2:29,y2:13, activityId:null},
  {id:'main',   name:'Main Hall',    color:'#F0F0F0',emoji:'\U0001f3eb',desc:'The heart of GoodBot School!',                 x1:9, y1:4, x2:20,y2:5, activityId:null},
  {id:'class1', name:'Classroom 1',  color:'#E6F0FF',emoji:'\U0001f4d6',desc:'Learn and discover new things!',               x1:11,y1:4, x2:13,y2:5, activityId:'statefinder' as const},
  {id:'class2', name:'Classroom 2',  color:'#E8FFE8',emoji:'\U0001f52c',desc:'Experiments and discoveries await!',            x1:15,y1:4, x2:16,y2:5, activityId:null},
  {id:'class3', name:'Classroom 3',  color:'#FFF0E6',emoji:'\U0001f3b5',desc:'Make music and noise!',                      x1:18,y1:4, x2:19,y2:5, activityId:null},
];

function getRoom(tx:number,ty:number): typeof ROOMS[0]|null {
  return ROOMS.find(r=>tx>=r.x1&&tx<=r.x2&&ty>=r.y1&&ty<=r.y2)||null;
}

// ─── Tile Drawers ─────────────────────────────────────────────────────────────
function dGrass(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  c.fillStyle='#7EC850'; c.fillRect(x,y,s,s);
  const dots=[[3,5],[7,3],[12,9],[20,4],[25,11],[6,20],[15,17],[27,7],[9,25],[22,22]];
  c.fillStyle='#5DAE3A';
  dots.forEach(([dx,dy])=>{ if(dx<s&&dy<s) c.fillRect(x+dx,y+dy,2,2); });
}

function dPath(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  c.fillStyle='#D4B896'; c.fillRect(x,y,s,s);
  c.fillStyle='#B89A70'; c.fillRect(x,y,s,1); c.fillRect(x,y,1,s);
  c.fillStyle='#C4A882';
  [[6,6],[16,6],[26,6],[6,18],[16,18],[26,18]].forEach(([dx,dy])=>c.fillRect(x+dx,y+dy,2,2));
}

function dWall(c:CanvasRenderingContext2D,x:number,y:number,s:number,win?:boolean){
  c.fillStyle='#C05A3A'; c.fillRect(x,y,s,s);
  c.fillStyle='#A04530';
  for(let r=0;r<4;r++){
    c.fillRect(x,y+r*8,s,2);
    const off=(r%2)*8;
    for(let c2=0;c2<4;c2++) c.fillRect(x+c2*8+off,y+r*8+2,2,6);
  }
  if(win){ c.fillStyle='#87CEEB'; c.fillRect(x+s*5/16,y+s/4,s*3/8,s*3/8); }
}

function dFloor(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  for(let gy=0;gy<4;gy++) for(let gx=0;gx<4;gx++){
    c.fillStyle=(gx+gy)%2===0?'#E8E8E8':'#D0D0D0';
    c.fillRect(x+gx*8,y+gy*8,8,8);
  }
}

function dDoor(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  c.fillStyle='#5C3A1A'; c.fillRect(x+2,y,s-4,s-2);
  c.fillStyle='#8B5A2B'; c.fillRect(x+5,y+3,s-10,s-6);
  c.fillStyle='#DAA520'; c.fillRect(x+s-12,y+s/2,3,3);
}

function dWater(c:CanvasRenderingContext2D,x:number,y:number,s:number,t:number){
  c.fillStyle='#4A90D9'; c.fillRect(x,y,s,s);
  c.strokeStyle='#6AABEF'; c.lineWidth=1.5;
  const o=Math.sin(t*0.002+x*0.1)*3;
  [[8,12],[6,22]].forEach(([oy,alpha])=>{
    c.beginPath(); c.moveTo(x,y+oy+o*0.6); c.quadraticCurveTo(x+s/2,y+oy-3+o*0.6,x+s,y+oy+o*0.6); c.stroke();
  });
}

function dTree(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  c.fillStyle='#6B4423'; c.fillRect(x+s/2-2,y+s-8,5,8);
  c.fillStyle='#2D8B37';
  c.beginPath(); c.moveTo(x+s/2,y+4); c.lineTo(x+s-2,y+s-8); c.lineTo(x+2,y+s-8); c.closePath(); c.fill();
  c.fillStyle='#3BAA45';
  c.beginPath(); c.moveTo(x+s/2,y); c.lineTo(x+s-3,y+12); c.lineTo(x+3,y+12); c.closePath(); c.fill();
}

function dFlower(c:CanvasRenderingContext2D,x:number,y:number,s:number,seed:number){
  dGrass(c,x,y,s);
  const rng=(n:number)=>{const v=Math.abs(Math.sin(seed*9301+n*49297+97)%1);return v;};
  const cols=['#FF69B4','#FFD700','#FFFFFF','#FF6B6B','#DDA0DD'];
  for(let i=0;i<4;i++){ c.fillStyle=cols[Math.floor(rng(i)*5)]; c.fillRect(x+Math.floor(rng(i+10)*s),y+Math.floor(rng(i+20)*s),3,3); }
}

function dFence(c:CanvasRenderingContext2D,x:number,y:number,s:number){
  c.fillStyle='#F0F0F0'; c.fillRect(x,y,s,s);
  c.fillStyle='#D0D0D0';
  c.fillRect(x,y+7,s,3); c.fillRect(x,y+19,s,3);
  for(let i=0;i<4;i++) c.fillRect(x+i*8+1,y+4,4,s-8);
}

// ─── Sprite ─────────────────────────────────────────────────────────────────
function drawSprite(c:CanvasRenderingContext2D,sx:number,sy:number,col:string,hair:string,dir:string,frame:number){
  const bx=Math.round(sx-T/2), by=Math.round(sy-T/2);
  // shadow
  c.fillStyle='rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(sx,by+T-2,8,3,0,0,Math.PI*2); c.fill();
  // legs
  const lo=frame===1?2:0;
  c.fillStyle='#3A3A60';
  if(dir==='N'||dir==='S'){ c.fillRect(bx+5,by+T-10+lo,4,8); c.fillRect(bx+T-9,by+T-10+lo,4,8); }
  else { c.fillRect(bx+5,by+T-10,4,8-lo); c.fillRect(bx+T-9,by+T-10,4,8+lo); }
  // body
  c.fillStyle=col; c.fillRect(bx+4,by+12,T-8,14);
  // arms
  const ao=frame===1?1:0;
  c.fillStyle=col; c.fillRect(bx+1,by+13+ao,4,10); c.fillRect(bx+T-5,by+13-ao,4,10);
  // head
  c.fillStyle='#F5C5A3'; c.fillRect(bx+5,by+4,T-10,10); c.fillRect(bx+4,by+5,T-8,8);
  // hair
  c.fillStyle=hair;
  if(dir==='N'||dir==='S'){ c.fillRect(bx+4,by+2,T-8,5); c.fillRect(bx+3,by+4,T-6,4); }
  else { c.fillRect(bx+5,by+2,T-10,5); c.fillRect(bx+4,by+3,T-8,4); }
  // eyes
  c.fillStyle='#333';
  if(dir==='S'){ c.fillRect(bx+7,by+9,2,2); c.fillRect(bx+T-9,by+9,2,2); }
  else if(dir==='N'){ /* no eyes */ }
  else { c.fillRect(bx+8,by+9,2,2); c.fillRect(bx+12,by+9,2,2); }
}

// ─── IntroScreen ───────────────────────────────────────────────────────────────
function IntroScreen({ onEnter, pCol, setPCol, hCol }: {
  onEnter: () => void;
  pCol: string;
  setPCol: (c: string) => void;
  hCol: string;
}) {
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = previewRef.current;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, 64, 64);
    drawSprite(c, 32, 32, pCol, hCol, 'S', 0);
  }, [pCol, hCol]);

  const choices = [
    { col: '#FF6B6B' },
    { col: '#4ECDC4' },
    { col: '#DDA0DD' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka, system-ui, sans-serif',
      zIndex: 999,
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>\U0001f3eb</div>
      <div style={{ color: 'white', fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>GoodBot School</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '32px' }}>A top-down adventure</div>
      <canvas ref={previewRef} width={64} height={64}
        style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', marginBottom: '24px' }} />
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px' }}>Choose your color</div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {choices.map(ch => (
          <button key={ch.col} onClick={() => setPCol(ch.col)} style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: ch.col, border: pCol === ch.col ? '3px solid white' : '3px solid transparent',
            cursor: 'pointer', fontSize: '24px', boxShadow: pCol === ch.col ? `0 0 16px ${ch.col}` : 'none',
            transition: 'all 0.2s',
          }} />
        ))}
      </div>
      <button onClick={onEnter} style={{
        background: 'linear-gradient(135deg,#4ECDC4,#45B7D1)',
        color: 'white', border: 'none', borderRadius: '12px',
        padding: '14px 48px', fontSize: '18px', fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 4px 20px rgba(78,205,196,0.4)',
        fontFamily: 'inherit',
      }}>
        Enter School \U0001f680
      </button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchoolGame(){
  const ref = useRef<HTMLCanvasElement>(null);

  const [showIntro, setShowIntro] = useState(true);
  const [activityView, setActivityView] = useState<React.ReactNode>(null);
  const [pCol, setPCol] = useState(PCOLORS[Math.floor(Math.random()*PCOLORS.length)]);
  const [hCol] = useState(HCOLS[Math.floor(Math.random()*HCOLS.length)]);

  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext('2d'); if(!ctx) return;
    const c=ctx;
    const W=CW, H=CH;
    const map=buildMap();

    // Camera
    let camX=0, camY=0;

    // Player
    let px=15*T+T/2, py=7*T+T/2; // start on main path
    let ptx=15, pty=7;
    let pdir='S', pFrame=0;
    let pMoving=false, pTargetX=px, pTargetY=py;

    // Interior
    let inInterior=false, intRoom: typeof ROOMS[0]|null=null;

    // NPC dialogue
    let talkableNPC: {x:number,y:number,tx:number,ty:number,dir:string,col:string,hair:string,f:number,wp:number,route:{x:number,y:number}[]}|null=null;
    let talkDialogue='';
    let showDialogue=false;

    // NPCs with proper two-way patrol routes
    const npcs=[
      {x:10*T+T/2,y:7*T+T/2,tx:10,ty:7,dir:'E',col:'#4ECDC4',hair:'#8B4513',f:0,wp:0,route:[{x:10,y:7},{x:22,y:7},{x:10,y:7}]},
      {x:5*T+T/2, y:10*T+T/2,tx:5,ty:10,dir:'S',col:'#FF9F43',hair:'#2C1810',f:0,wp:0,route:[{x:5,y:10},{x:5,y:15},{x:5,y:10}]},
      {x:25*T+T/2,y:15*T+T/2,tx:25,ty:15,dir:'W',col:'#DDA0DD',hair:'#1A1A2E',f:0,wp:0,route:[{x:25,y:15},{x:5,y:15},{x:25,y:15}]},
    ];

    // Input
    const keys=new Set<string>();
    const onKeyDown=(e:KeyboardEvent)=>{ keys.add(e.key.toLowerCase()); if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(e.key.toLowerCase())) e.preventDefault(); };
    const onKeyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('keyup',onKeyUp);

    // Auto-focus canvas on mount and on click
    cv.tabIndex=0;
    cv.style.outline='none';
    cv.focus();
    const onFocus=()=>cv.focus();
    cv.addEventListener('click',onFocus);
    cv.addEventListener('touchstart',onFocus);

    function canWalk(tx:number,ty:number):boolean{
      if(tx<0||tx>=GW||ty<0||ty>=GH) return false;
      const t=map[ty][tx];
      return t!==WALL&&t!==TREE&&t!==FENCE&&t!==WATER;
    }

    function nearDoor(): typeof ROOMS[0]|null{
      const dirs=[[0,0],[0,-1],[0,1],[-1,0],[1,0]];
      for(const[dx,dy]of dirs){
        const nx=ptx+dx,ny=pty+dy;
        if(nx<0||nx>=GW||ny<0||ny>=GH) continue;
        if(map[ny][nx]===DOOR) return getRoom(nx,ny);
      }
      return null;
    }

    function clickMove(tx:number,ty:number){
      if(!canWalk(tx,ty)) return;
      ptx=tx; pty=ty;
      pTargetX=tx*T+T/2; pTargetY=ty*T+T/2;
      pMoving=true;
    }

    const onClick=(e:MouseEvent)=>{
      const rect=cv.getBoundingClientRect();
      const sx=W/rect.width, sy=H/rect.height;
      const mx=(e.clientX-rect.left)*sx, my=(e.clientY-rect.top)*sy;
      const worldX=mx+camX, worldY=my+camY;
      const tx=Math.floor(worldX/T), ty=Math.floor(worldY/T);

      if(inInterior && intRoom){
        const bw=480,bh=340,bx=(W-bw)/2,by=(H-bh)/2;
        const btnBX=W/2-80, btnBY=by+bh-55, btnW=160, btnH=34;
        if(mx>=btnBX&&mx<=btnBX+btnW&&my>=btnBY&&my<=btnBY+btnH){
          if(intRoom.activityId==='pixelstudio'){ setActivityView(<PixelCanvas onBack={()=>setActivityView(null)} />); }
          else if(intRoom.activityId==='statefinder'){ setActivityView(<StateFinder onBack={()=>setActivityView(null)} />); }
          return;
        }
        if(intRoom.activityId===null){
          const bbX=W/2-70, bbY=by+bh-55, bbW=140, bbH=34;
          if(mx>=bbX&&mx<=bbX+bbW&&my>=bbY&&my<=bbY+bbH){ inInterior=false; intRoom=null; return; }
        }
        return;
      }

      if(canWalk(tx,ty)) clickMove(tx,ty);
    };
    cv.addEventListener('click',onClick);

    let lastNpc=0, animId=0;

    function update(ts:number){
      if(inInterior) return;

      // NPC proximity
      if(!pMoving && !showDialogue){
        for(const n of npcs){
          const dx=Math.abs(n.tx-ptx), dy=Math.abs(n.ty-pty);
          if(dx<=1 && dy<=1 && dx+dy<=1){ talkableNPC=n; }
        }
      }
      if(!showDialogue && !talkableNPC) talkableNPC=null;

      // Movement keys
      if(!pMoving){
        let dx=0,dy=0;
        if(keys.has('w')||keys.has('arrowup'))    {dy=-1;pdir='N';}
        else if(keys.has('s')||keys.has('arrowdown'))  {dy=1;pdir='S';}
        else if(keys.has('a')||keys.has('arrowleft'))  {dx=-1;pdir='W';}
        else if(keys.has('d')||keys.has('arrowright')) {dx=1;pdir='E';}
        if(dx||dy){
          if(canWalk(ptx+dx,pty+dy)){ ptx+=dx; pty+=dy; pTargetX=ptx*T+T/2; pTargetY=pty*T+T/2; pMoving=true; pFrame=(pFrame+1)%2; }
        }
      }

      // Smooth move
      if(pMoving){
        const dx=pTargetX-px,dy=pTargetY-py;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<STEP){ px=pTargetX; py=pTargetY; pMoving=false; }
        else{ px+=(dx/dist)*STEP; py+=(dy/dist)*STEP; }
      }

      // E to enter room
      if(keys.has('e')){ keys.delete('e'); const d=nearDoor(); if(d){ inInterior=true; intRoom=d; } }

      // Q to talk
      if(keys.has('q') && talkableNPC){
        keys.delete('q');
        showDialogue=true;
        talkDialogue=NPC_GREETINGS[Math.floor(Math.random()*NPC_GREETINGS.length)];
      }

      // NPCs
      if(ts-lastNpc>350){
        lastNpc=ts;
        for(const n of npcs){
          const tgt=n.route[n.wp];
          if(n.tx===tgt.x&&n.ty===tgt.y){ n.wp=(n.wp+1)%n.route.length; continue; }
          const dx2=Math.sign(tgt.x-n.tx), dy2=Math.sign(tgt.y-n.ty);
          if(dx2){n.tx+=dx2;n.x=n.tx*T+T/2;n.dir=dx2>0?'E':'W';}
          else if(dy2){n.ty+=dy2;n.y=n.ty*T+T/2;n.dir=dy2>0?'S':'N';}
          n.f=(n.f+1)%2;
        }
      }

      // Camera — lerp toward player
      camX+=(px-W/2-camX)*0.1;
      camY+=(py-H/2-camY)*0.1;
      camX=Math.max(0,Math.min(W-W,camX));
      camY=Math.max(0,Math.min(H-H,camY));
    }

    function render(ts:number){
      // Background
      c.fillStyle='#5C8B3A'; c.fillRect(0,0,W,H);

      // Visible tile range
      const sx0=Math.max(0,Math.floor(camX/T));
      const sy0=Math.max(0,Math.floor(camY/T));
      const sx1=Math.min(GW,Math.ceil((camX+W)/T)+1);
      const sy1=Math.min(GH,Math.ceil((camY+H)/T)+1);

      for(let ty=sy0;ty<sy1;ty++) for(let tx=sx0;tx<sx1;tx++){
        const t=map[ty][tx];
        const wx=tx*T-camX, wy=ty*T-camY;
        if(t===GRASS)   dGrass(c,wx,wy,T);
        else if(t===PATH)   dPath(c,wx,wy,T);
        else if(t===WALL){
          const isWindow=(ty===3||ty===6)&&tx>=9&&tx<=20&&tx!==10&&tx!==14&&tx!==17&&tx!==20;
          dWall(c,wx,wy,T,isWindow);
        }
        else if(t===FLOOR) dFloor(c,wx,wy,T);
        else if(t===DOOR)   dDoor(c,wx,wy,T);
        else if(t===WATER)  dWater(c,wx,wy,T,ts);
        else if(t===TREE)   dTree(c,wx,wy,T);
        else if(t===FLOWER) dFlower(c,wx,wy,T,tx*17+ty);
        else if(t===FENCE)  dFence(c,wx,wy,T);
      }

      // NPCs then player (depth sort)
      const ents=[...npcs].sort((a,b)=>a.y-b.y);
      ents.forEach(n=>{
        const sxn=n.x-camX, syn=n.y-camY;
        if(sxn<-T||sxn>W+T||syn<-T||syn>H+T) return;
        drawSprite(c,sxn,syn,n.col,n.hair,n.dir,n.f);
      });
      drawSprite(c,px-camX,py-camY,pCol,hCol,pdir,pFrame);

      // NPC talk prompt
      if(talkableNPC && !showDialogue){
        const nx2=talkableNPC.x-camX, ny2=talkableNPC.y-camY;
        c.fillStyle='rgba(0,0,0,0.7)'; c.roundRect(nx2-50,ny2-50,100,22,6); c.fill();
        c.fillStyle='#FFE066'; c.font='bold 10px sans-serif'; c.textAlign='center';
        c.fillText('Q to Talk',nx2,ny2-36);
      }

      // Dialogue box
      if(showDialogue && talkableNPC){
        const bx2=W/2-160, by2=CH-130;
        c.fillStyle='rgba(0,0,0,0.85)'; c.roundRect(bx2,by2,320,80,16); c.fill();
        c.fillStyle=talkableNPC.col; c.beginPath(); c.arc(bx2+24,by2-8,10,0,Math.PI*2); c.fill();
        c.fillStyle='white'; c.font='14px sans-serif';
        const words2=talkDialogue.split(' ');
        let line2='',ly2=by2+28;
        for(const w of words2){
          const t2=line2+w+' ';
          if(c.measureText(t2).width>280){c.fillText(line2,bx2+20,ly2);line2=w+' ';ly2+=20;}
          else line2=t2;
        }
        c.fillText(line2,bx2+20,ly2);
        c.fillStyle='rgba(255,255,255,0.5)'; c.font='11px sans-serif'; c.fillText('(press Q to close)',bx2+160,by2+68);
      }

      // Door prompt
      if(!inInterior){
        const d=nearDoor();
        if(d){
          c.fillStyle='rgba(0,0,0,0.7)'; c.roundRect(W/2-100,H-80,200,28,8); c.fill();
          c.fillStyle='#FFE066'; c.font='bold 12px sans-serif'; c.textAlign='center';
          c.fillText(`E for ${d.emoji} ${d.name}`,W/2,H-62);
        }
      }

      // Interior overlay
      if(inInterior&&intRoom){
        c.fillStyle='rgba(0,0,0,0.78)'; c.fillRect(0,0,W,H);
        const bw=480,bh=340,bx=(W-bw)/2,by=(H-bh)/2;
        c.fillStyle=intRoom.color; c.strokeStyle='rgba(0,0,0,0.3)'; c.lineWidth=4;
        c.roundRect(bx,by,bw,bh,20); c.fill(); c.stroke();
        c.font='72px sans-serif'; c.textAlign='center'; c.fillText(intRoom.emoji,W/2,by+100);
        c.fillStyle='#222'; c.font='bold 26px sans-serif'; c.fillText(intRoom.name,W/2,by+150);
        c.font='15px sans-serif'; c.fillStyle='#555';
        let line='',ly=by+185;
        for(const w of intRoom.desc.split(' ')){
          const t=line+w+' ';
          if(c.measureText(t).width>bw-60){c.fillText(line,W/2,ly);line=w+' ';ly+=22;}
          else line=t;
        }
        c.fillText(line,W/2,ly);

        if(intRoom.activityId==='pixelstudio' || intRoom.activityId==='statefinder'){
          c.fillStyle='rgba(78,205,196,0.9)'; c.roundRect(W/2-80,by+bh-55,160,34,10); c.fill();
          c.fillStyle='white'; c.font='bold 14px sans-serif'; c.fillText('\u25b6 Launch Activity!',W/2,by+bh-33);
        } else {
          c.fillStyle='rgba(0,0,0,0.12)'; c.roundRect(W/2-70,by+bh-55,140,34,10); c.fill();
          c.fillStyle='#333'; c.font='bold 14px sans-serif'; c.fillText('\u2190 Back Outside (ESC)',W/2,by+bh-33);
        }
      }

      // HUD — room name
      c.fillStyle='rgba(0,0,0,0.55)'; c.roundRect(10,10,210,30,8); c.fill();
      const room=getRoom(ptx,pty);
      c.fillStyle='#fff'; c.font='bold 13px sans-serif'; c.textAlign='left';
      c.fillText(room?`${room.emoji} ${room.name}`:'🏫 GoodBot School',18,30);

      // Controls
      const showQTip=!!(talkableNPC&&!showDialogue);
      c.fillStyle='rgba(0,0,0,0.45)'; c.roundRect(10,H-34,showQTip?290:230,24,6); c.fill();
      c.fillStyle='rgba(255,255,255,0.75)'; c.font='11px sans-serif';
      c.fillText(showQTip?'WASD/Arrows move \u00b7 E interact \u00b7 Q talk \u00b7 Click to walk \u00b7 ESC exit':'WASD/Arrows move \u00b7 E interact \u00b7 Click to walk \u00b7 ESC exit',18,H-18);

      // Minimap
      const mw=110,mh=88,mx=W-mw-10,my=10;
      c.fillStyle='rgba(0,0,0,0.6)'; c.roundRect(mx-2,my-2,mw+4,mh+4,6); c.fill();
      const mxs=mw/GW,mys=mh/GH;
      for(let ty=0;ty<GH;ty++) for(let tx=0;tx<GW;tx++){
        const t=map[ty][tx];
        if(t===WALL||t===TREE) c.fillStyle='#5C4033';
        else if(t===PATH||t===DOOR) c.fillStyle='#B89A70';
        else if(t===WATER) c.fillStyle='#4A90D9';
        else if(t===FLOOR) c.fillStyle='#888';
        else continue;
        c.fillRect(mx+tx*mxs,my+ty*mys,mxs+0.5,mys+0.5);
      }
      npcs.forEach(n=>{ c.fillStyle=n.col; c.beginPath(); c.arc(mx+n.tx*mxs+mxs/2,my+n.ty*mys+mys/2,2,0,Math.PI*2); c.fill(); });
      c.fillStyle=pCol; c.beginPath(); c.arc(mx+ptx*mxs+mxs/2,my+pty*mys+mys/2,3,0,Math.PI*2); c.fill();
    }

    function loop(ts:number){ update(ts); render(ts); animId=requestAnimationFrame(loop); }
    animId=requestAnimationFrame(loop);

    const onEsc=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){
        if(showDialogue){ showDialogue=false; talkableNPC=null; }
        else if(inInterior){ inInterior=false; intRoom=null; }
      }
    };
    window.addEventListener('keydown',onEsc);

    return()=>{
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown',onKeyDown);
      window.removeEventListener('keyup',onKeyUp);
      window.removeEventListener('keydown',onEsc);
      cv.removeEventListener('click',onClick);
      cv.removeEventListener('touchstart',onFocus);
    };
  },[]);

  return(
    <>
      {showIntro && (
        <IntroScreen onEnter={()=>setShowIntro(false)} pCol={pCol} setPCol={setPCol} hCol={hCol} />
      )}
      {activityView ? (
        <div style={{width:'100vw',height:'100vh',overflow:'hidden'}}>
          {activityView}
        </div>
      ) : (
        <>
          <div style={{color:'#fff',fontSize:'22px',fontWeight:700,fontFamily:'sans-serif',textShadow:'0 2px 8px rgba(0,0,0,0.4)',letterSpacing:'1px',textAlign:'center',padding:'16px 0'}}>
            \U0001f3eb GoodBot School
          </div>
          <div style={{borderRadius:'12px',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',border:'3px solid rgba(255,255,255,0.2)'}}>
            <canvas ref={ref} width={CW} height={CH} tabIndex={0}
              style={{display:'block',maxWidth:'100vw',height:'auto',outline:'none',cursor:'pointer'}} />
          </div>
        </>
      )}
    </>
  );
}
