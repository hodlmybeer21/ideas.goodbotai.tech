/* CAMPUS GAME v2 DEBUG */
/* CAMPUS GAME vPhase2_DEBUG - XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */
// Phaser 3 game for GoodBot Kids School Explorer
// Phase 2: Doors + NPCs + Building Panel + Mini-map
(() => {
  var MAP_W = 2000, MAP_H = 1600;
  var C = {
    sky:0x87CEEB, grass:0x7CB342, pathway:0xD4C4A8,
    artroom:0xF06292, library:0x4FC3F7, sciceng:0x81C784,
    gym:0x7E57C2, mathroom:0xFFD54F, musicrm:0xFF8A65,
    nurse:0x4DB6AC, office:0xA1887F, cafetria:0xFFB74D,
    playground:0x64B5F6, greenhouse:0xAED581, auditorum:0xCE93D8,
    wall:0x4E342E, roof:0x795548, window:0xB3E5FC, door:0x8D6E63,
  };

  // BUILDINGS vB - campus game loaded
  var BUILDINGS = [
    { key:'artroom',    label:'Art Studio',        sublabel:'🎨 Creative Corner',  x:80,   y:60,  w:340, h:280, roofOffY:32, trimColor:C.artroom,    doorSide:'front', stations:[{id:'colorlab',sx:220,sy:200},{id:'pixelcanvas_b',sx:320,sy:200},{id:'drawingcanvas',sx:150,sy:290},{id:'photoframe',sx:280,sy:290},{id:'mirrordraw',sx:370,sy:290}] },
    { key:'library',    label:'Library',            sublabel:'📚 Story Hall',      x:470,  y:60,  w:360, h:280, roofOffY:32, trimColor:C.library,    doorSide:'front', stations:[{id:'storymachine',sx:530,sy:200},{id:'readalong',sx:630,sy:200},{id:'storyqa',sx:720,sy:290}] },
    { key:'sciceng',   label:'Science Lab',         sublabel:'🔬 Experiments',     x:1480, y:60,  w:340, h:260, roofOffY:32, trimColor:C.sciceng,    doorSide:'left',   stations:[{id:'plantcycle',sx:1580,sy:200},{id:'soundlab',sx:1680,sy:200}] },
    { key:'auditorum', label:'Auditorium',          sublabel:'🎭 Stage',            x:1480, y:370, w:340, h:300, roofOffY:36, trimColor:C.auditorum, doorSide:'left',   stations:[{id:'animatch',sx:1580,sy:490},{id:'characterraits',sx:1680,sy:490},{id:'sentencefixer',sx:1600,sy:590}] },
    { key:'gym',       label:'Gymnasium',           sublabel:'🏃 Fitness',         x:80,   y:400, w:350, h:300, roofOffY:36, trimColor:C.gym,        doorSide:'right',  stations:[{id:'bossyr',sx:200,sy:530},{id:'bunnyhop',sx:310,sy:530}] },
    { key:'cafetria',  label:'Cafeteria',           sublabel:'🍎 Healthy Fun',    x:80,   y:750, w:350, h:280, roofOffY:32, trimColor:C.cafetria,  doorSide:'right',  stations:[{id:'equalparts',sx:200,sy:870},{id:'coinchallenge',sx:310,sy:870}] },
    { key:'nurse',     label:"Nurse's Office",     sublabel:'🩺 Health Hub',      x:80,   y:1100,w:280, h:240, roofOffY:28, trimColor:C.nurse,      doorSide:'front',  stations:[{id:'telltime',sx:190,sy:1220}] },
    { key:'office',    label:'Main Office',         sublabel:'🏢 HQ',              x:420,  y:1100,w:300, h:240, roofOffY:28, trimColor:C.office,     doorSide:'front',  stations:[{id:'codebots',sx:530,sy:1220},{id:'istherobotright',sx:620,sy:1220}] },
    { key:'mathroom',  label:'Math Den',            sublabel:'🧮 Numbers',         x:790,  y:1100,w:300, h:240, roofOffY:28, trimColor:C.mathroom,   doorSide:'front', stations:[{id:'mathlab',sx:860,sy:1220},{id:'tensonesexplorer',sx:960,sy:1220},{id:'numberbingo',sx:1030,sy:1220}] },
    { key:'musicrm',   label:'Music Room',          sublabel:'🎵 Sounds',         x:1160, y:1100,w:290, h:240, roofOffY:28, trimColor:C.musicrm,    doorSide:'front',  stations:[{id:'syllable_b',sx:1180,sy:1220},{id:'madlibs',sx:1290,sy:1220}] },
    { key:'playground',label:'Playground',          sublabel:'🌤️ Outdoor Fun',    x:1520, y:1050,w:380, h:200, roofOffY:0,  trimColor:C.playground,doorSide:'none',   stations:[{id:'statefinder',sx:1580,sy:1130},{id:'truefalse',sx:1710,sy:1130},{id:'bugcatcher',sx:1840,sy:1130}] },
    { key:'greenhouse',label:'Greenhouse Garden',   sublabel:'🌱 Nature Walk',    x:80,   y:1400,w:680, h:160, roofOffY:24, trimColor:C.greenhouse, doorSide:'front', stations:[{id:'basewordsorter',sx:280,sy:1480},{id:'pluralbuilder',sx:540,sy:1480}] },
    { key:'courtyard',x:500, y:400, w:840, h:480, roofOffY:0, trimColor:C.grass, label:'', sublabel:'', doorSide:'none', stations:[], isCourtyard:true },
  ];

  var ACTIVITIES = {
    colorlab:{name:'Color Lab',icon:'🎨',component:'colorlab'},pixelcanvas_b:{name:'Pixel Canvas',icon:'🎮',component:'pixelcanvas_b'},mathlab:{name:'Math Lab',icon:'🔢',component:'mathlab'},syllable_b:{name:'Syllable Scooper',icon:'🔤',component:'syllable_b'},madlibs:{name:'Mad Libs',icon:'📝',component:'madlibs'},readalong:{name:'Read Along',icon:'🎵',component:'readalong'},animatch:{name:'Animal Match',icon:'🧩',component:'animatch'},storymachine:{name:'Story Machine',icon:'📖',component:'storymachine'},sentencefixer:{name:'Sentence Fixer',icon:'✏️',component:'sentencefixer'},basewordsorter:{name:'Baseword Sorter',icon:'🔗',component:'basewordsorter'},pluralbuilder:{name:'Plural Builder',icon:'🔠',component:'pluralbuilder'},characterraits:{name:'Character Traits',icon:'🎭',component:'characterraits'},storyqa:{name:'Story Q&A',icon:'❓',component:'storyqa'},equalparts:{name:'Equal Parts',icon:'🔴',component:'equalparts'},tensonesexplorer:{name:'Tens & Ones',icon:'🔢',component:'tensonesexplorer'},coinchallenge:{name:'Coin Challenge',icon:'🪙',component:'coinchallenge'},telltime:{name:'Tell Time',icon:'🕐',component:'telltime'},codebots:{name:'CodeBots',icon:'🤖',component:'codebots'},bossyr:{name:'Bossy R Racer',icon:'🏎️',component:'bossyr'},soundlab:{name:'Sound Lab',icon:'🎵',component:'soundlab'},plantcycle:{name:'Plant Life Cycle',icon:'🌱',component:'plantcycle'},statefinder:{name:'State Finder',icon:'🗺️',component:'statefinder'},truefalse:{name:'True or False',icon:'✅',component:'truefalse'},istherobotright:{name:'Robot Checker',icon:'🤖',component:'istherobotright'},drawingcanvas:{name:'Magic Canvas',icon:'🖌️',component:'drawingcanvas'},wordsearch:{name:'Word Search',icon:'🔍',component:'wordsearch'},vocabventure:{name:'Vocab Venture',icon:'🎯',component:'vocabventure'},bugcatcher:{name:'Bug Catcher',icon:'🐛',component:'bugcatcher'},bunnyhop:{name:'Bunny Hop Counting',icon:'🐰',component:'bunnyhop'},photoframe:{name:'Photo Frame Maker',icon:'🖼️',component:'photoframe'},mirrordraw:{name:'Mirror Draw',icon:'🪞',component:'mirrordraw'},numberbingo:{name:'Number Bingo',icon:'🎯',component:'numberbingo'},mathrace:{name:'Math Race',icon:'🏃',component:'mathrace'},readingrace:{name:'Reading Race',icon:'📚',component:'readingrace'},
  };

  var DOORS = [
    { bx:'artroom',    dx:250,  dy:340 },
    { bx:'library',   dx:650,  dy:340 },
    { bx:'sciceng',   dx:1480, dy:320 },
    { bx:'auditorum', dx:1480, dy:670 },
    { bx:'gym',       dx:430,  dy:700 },
    { bx:'cafetria',  dx:430,  dy:1030 },
    { bx:'nurse',     dx:220,  dy:1340 },
    { bx:'office',    dx:570,  dy:1340 },
    { bx:'mathroom',  dx:940,  dy:1340 },
    { bx:'musicrm',   dx:1305, dy:1340 },
    { bx:'greenhouse',dx:420,  dy:1560 },
  ];

  var NPCS = [
    { id:'bellabot',  x:920,  y:580, color:0x6BCBFF, name:'Bellabot',  icon:'🤖', message:"Hi! I'm Bellabot! Pick a building and press E near a door to go inside!",  bounce:true  },
    { id:'bookbot',  x:870,  y:530, color:0xC084FC, name:'Book Bot',  icon:'📖', message:"Story Machine is in the Library! Great for reading!",                     bounce:false },
    { id:'mathbot',  x:990,  y:670, color:0xFFD54F, name:'Math Bot',  icon:'🧮', message:"Math Lab is in the Math Den! Try some number activities!",                  bounce:false },
  ];

  function getProgress(){try{return JSON.parse(localStorage.getItem('goodbot_progress')||'{}')}catch{return{}}}
  function saveProgress(p){localStorage.setItem('goodbot_progress',JSON.stringify(p))}

  function makeCourtyardTexture(scene){
    var W=840,H=480,ox=-W/2,oy=-H/2,g=scene.make.graphics({add:false});
    g.fillStyle(C.grass,1); g.fillRect(ox,oy,W,H);
    g.fillStyle(0x689F38,0.18); for(var i=0;i<55;i++) g.fillCircle(Math.random()*W,Math.random()*H,3+Math.random()*4);
    g.fillStyle(C.pathway,1); g.fillRect(0,H/2-20,W,40); g.fillRect(W/2-20,0,40,H);
    g.fillStyle(C.pathway,0.85); g.fillCircle(W/2,H/2,70);
    g.lineStyle(3,0xBCAAA4,0.4); g.strokeCircle(W/2,H/2,70);
    var fc=[[60,60],[W-60,60],[60,H-60],[W-60,H-60]];
    fc.forEach(function(a){g.fillStyle(0xF48FB1,0.55);g.fillCircle(a[0],a[1],26);g.fillStyle(0xFFF176,0.55);g.fillCircle(a[0]+16,a[1]+10,16);});
    g.fillStyle(0x8D6E63,0.85); g.fillRoundedRect(110,H/2-22,56,16,4); g.fillRoundedRect(W-166,H/2-22,56,16,4);
    g.generateTexture('courtyard',W,H); g.destroy();
  }

  function makeBuildingTexture(scene,b){
    var key=b.key,x=b.x,y=b.y,w=b.w,h=b.h,roofOffY=b.roofOffY,trimColor=b.trimColor;
    var totalH=h+roofOffY;
    // Offset drawing so building centers within the sprite (sprite pos = b.x+b.w/2+20, b.y+b.h/2+roofOffY+10)
    var ox=-(w/2+20), oy=-(h/2+roofOffY+10);
    x+=ox; y+=oy;
    var g=scene.make.graphics({add:false});
    g.fillStyle(0,0.10); g.fillRoundedRect(x+8,y+roofOffY+8,w,h,8);
    g.fillStyle(trimColor,0.45); g.fillRoundedRect(x,y+roofOffY,w,h,6);
    g.fillStyle(trimColor,0.35); g.fillRect(x+4,y+roofOffY,w-8,h-4);
    g.fillStyle(0x4E342E,1); g.beginPath(); var rT=16; g.moveTo(x+rT,y+roofOffY); g.lineTo(x+w-rT,y+roofOffY); g.lineTo(x+w,y+totalH); g.lineTo(x,y+totalH); g.closePath(); g.fillPath();
    g.lineStyle(3,0x3E2723,0.35); g.beginPath(); g.moveTo(x+rT,y+roofOffY); g.lineTo(x+w-rT,y+roofOffY); g.strokePath();
    if(b.key!=='playground'){g.fillStyle(0x795548,1); g.fillRect(x+w-56,y+roofOffY-18,18,22);}
    var winW=42,winH=34,winY=y+roofOffY+22;
    [x+16,x+w-16-winW].forEach(function(wx){g.fillStyle(0x5D4037,1); g.fillRect(wx-4,winY-4,winW+8,winH+8); g.fillStyle(C.window,0.88); g.fillRect(wx,winY,winW,winH); g.lineStyle(2,0x81D4FA,0.65); g.strokeRect(wx,winY,winW,winH);});
    var dW=30,dH=52,dX=b.doorSide==='front'?x+w/2-dW/2:b.doorSide==='right'?x+w-dW-10:b.doorSide==='left'?x+10:x+w/2-dW/2;
    var dY=y+roofOffY+h-dH-8;
    g.fillStyle(C.door,1); g.fillRoundedRect(dX,dY,dW,dH,4);
    g.fillStyle(0xB3E5FC,0.6); g.fillRoundedRect(dX+5,dY+5,dW-10,dH/2-5,3);
    g.fillStyle(trimColor,0.8); g.fillRoundedRect(dX-8,dY-14,46,14,4);
    g.fillStyle(C.door,1); g.fillRoundedRect(dX-6,dY-12,42,10,3);
    g.fillStyle(trimColor,0.8); g.fillRect(x+6,y+roofOffY+h-6,w-12,6);
    g.generateTexture('bldg_'+key,w+40,totalH+20); g.destroy();
  }

  function makeStationTexture(scene,id,completed){
    var S=88,ox=-S/2,oy=-S/2,g=scene.make.graphics({add:false});
    var pC=completed?0x4CAF50:0xFFD54F,iC=completed?0x66BB6A:0xFFFFFF,rC=completed?0x2E7D32:0xE65100;
    g.fillStyle(pC,0.16); g.fillCircle(S/2,S/2,S/2);
    g.fillStyle(pC,0.12); g.fillCircle(S/2,S/2,S/2-8);
    g.fillStyle(iC,1); g.fillCircle(S/2,S/2,S/2-16);
    g.lineStyle(5,rC,1); g.strokeCircle(S/2,S/2,S/2-16);
    g.generateTexture('station_'+id,S,S); g.destroy();
  }

  function makeDoorTexture(scene){
    var W=80,H=80,ox=-W/2,oy=-H/2,g=scene.make.graphics({add:false});
    g.fillStyle(0xFFD54F,0.30); g.fillRoundedRect(ox,oy,W,H,10);
    g.fillStyle(0xFFD54F,0.18); g.fillRoundedRect(ox+4,oy+4,W-8,H-8,8);
    g.lineStyle(3,0xE65100,0.7); g.strokeRoundedRect(ox+2,oy+2,W-4,H-4,9);
    g.generateTexture('door_trigger',W,H); g.destroy();
  }

  function makePlayerTexture(scene,colorHex){
    var S=52,g=scene.make.graphics({add:false});
    g.fillStyle(0,0.12); g.fillEllipse(S/2+2,S-6,S-12,S/5);
    g.fillStyle(colorHex,1); g.fillCircle(S/2,S/2,S/2-4);
    g.fillStyle(0xFFFFFF,1); g.fillCircle(S/2-10,S/2-4,9); g.fillCircle(S/2+10,S/2-4,9);
    g.fillStyle(0x1A237E,1); g.fillCircle(S/2-8,S/2-3,5); g.fillCircle(S/2+12,S/2-3,5);
    g.lineStyle(3,0x1A237E,1); g.beginPath(); g.arc(S/2,S/2+2,12,0.3,Math.PI-0.3); g.strokePath();
    g.generateTexture('player',S,S); g.destroy();
  }

  function makeWalkTextures(scene,colorHex){
    var S=52,keys=[],de=[{ex:-10,ey:-4},{ex:-8,ey:-6},{ex:-14,ey:-4},{ex:-2,ey:-4}];
    for(var d=0;d<4;d++){for(var f=0;f<2;f++){
      var key='w'+d+'_'+f,bob=f===0?-2:2,g=scene.make.graphics({add:false});
      g.fillStyle(0,0.10); g.fillEllipse(S/2+2,S-4,S-14,S/5);
      g.fillStyle(colorHex,1); g.fillCircle(S/2,S/2+bob,S/2-4);
      g.fillStyle(0xFFFFFF,1); g.fillCircle(S/2+de[d].ex,S/2+de[d].ey+bob,8); g.fillCircle(S/2+de[d].ex+20,S/2+de[d].ey+bob,8);
      g.fillStyle(0x1A237E,1); g.fillCircle(S/2+de[d].ex+2,S/2+de[d].ey+bob+1,4); g.fillCircle(S/2+de[d].ex+22,S/2+de[d].ey+bob+1,4);
      g.lineStyle(2.5,0x1A237E,1); g.beginPath(); g.arc(S/2,S/2+2+bob,10,0.3,Math.PI-0.3); g.strokePath();
      if(f===1){g.fillStyle(colorHex,0.55); g.fillCircle(S/2-10,S-10,6); g.fillCircle(S/2+10,S-10,6);}
      g.generateTexture(key,S,S); g.destroy(); keys.push(key);
    }}return keys;
  }

  function makeNPCTexture(scene,color,npcId){
    var S=56,g=scene.make.graphics({add:false});
    g.fillStyle(color,1); g.fillCircle(S/2,S/2,S/2-4);
    g.fillStyle(0xFFFFFF,1); g.fillCircle(S/2-8,S/2-4,7); g.fillCircle(S/2+8,S/2-4,7);
    g.fillStyle(0x1A237E,1); g.fillCircle(S/2-6,S/2-3,4); g.fillCircle(S/2+10,S/2-3,4);
    g.lineStyle(3,0x1A237E,1); g.beginPath(); g.arc(S/2,S/2+2,10,0.3,Math.PI-0.3); g.strokePath();
    g.lineStyle(3,color,0.7); g.beginPath(); g.moveTo(S/2,S/2-22); g.lineTo(S/2,S/2-30); g.strokePath();
    g.fillStyle(color,0.8); g.fillCircle(S/2,S/2-33,5);
    g.generateTexture('npc_'+npcId,S,S); g.destroy();
  }

  function makeDpadTextures(scene){
    var size=64,bg=scene.make.graphics({x:0,y:0,add:false});
    bg.fillStyle(0xFFFFFF,0.9); bg.fillRoundedRect(0,0,size,size,14);
    bg.lineStyle(3,0xFFD93D,1); bg.strokeRoundedRect(0,0,size,size,14);
    bg.generateTexture('dpad_bg',size,size); bg.destroy();
    [{key:'dpad_up',dx:0,dy:-68},{key:'dpad_down',dx:0,dy:68},{key:'dpad_left',dx:-68,dy:0},{key:'dpad_right',dx:68,dy:0}].forEach(function(o){
      var ag=scene.make.graphics({x:0,y:0,add:false});
      ag.fillStyle(0x5C4033,0.88); ag.beginPath();
      ag.moveTo(32+Math.sin(Math.atan2(o.dy,o.dx))*18,32-Math.cos(Math.atan2(o.dy,o.dx))*18);
      ag.lineTo(32+Math.sin(Math.atan2(o.dy,o.dx)+2.5)*20,32-Math.cos(Math.atan2(o.dy,o.dx)+2.5)*20);
      ag.lineTo(32+Math.sin(Math.atan2(o.dy,o.dx)-2.5)*20,32-Math.cos(Math.atan2(o.dy,o.dx)-2.5)*20);
      ag.closePath(); ag.fill(); ag.generateTexture(o.key,size,size); ag.destroy();
    });
  }

  function makeBubbleTexture(scene){
    var g=scene.make.graphics({add:false});
    g.fillStyle(0xFFFFFF,0.97); g.fillRoundedRect(0,0,240,80,16);
    g.fillStyle(0xF2F2F2,0.5); g.fillRoundedRect(0,0,240,74,16);
    g.lineStyle(3,0xFFD93D,0.6); g.strokeRoundedRect(0,0,240,80,16);
    g.generateTexture('bubble',240,80); g.destroy();
  }

  function makePanelTexture(scene){
    var g=scene.make.graphics({add:false});
    g.fillStyle(0x2D1B00,0.95); g.fillRoundedRect(0,0,300,260,20);
    g.lineStyle(3,0xFFD93D,1); g.strokeRoundedRect(0,0,300,260,20);
    g.generateTexture('panel',300,260); g.destroy();
  }

  // Main Scene class
  var SchoolScene = function(){};
  SchoolScene.prototype = Object.create(Phaser.Scene.prototype);
  SchoolScene.prototype.constructor = SchoolScene;

  SchoolScene.prototype.create = function(){
    var self = this;
    try {
    var playerColor = sessionStorage.getItem('school_player_color') || '#FF6B9D';
    var colorHex = parseInt(playerColor.replace('#','0x'));
    this.progress = getProgress();
    this.moveSpeed = 195; this.walkTimer = 0; this.walkFrame = 0; this.playerDir = 0;
    this.isMoving = false; this.cooldown = 0; this.panelActive = false;
    this.bubbleNPC = null; this.bubbleVisible = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:Phaser.Input.Keyboard.KeyCodes.W, down:Phaser.Input.Keyboard.KeyCodes.S,
      left:Phaser.Input.Keyboard.KeyCodes.A, right:Phaser.Input.Keyboard.KeyCodes.D
    });
    this._eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    makeCourtyardTexture(this);
BUILDINGS.forEach(function(b){ if(!b.isCourtyard) makeBuildingTexture(this, b); }, this);
    NPCS.forEach(function(n){ makeNPCTexture(this, n.color, n.id); }, this);
    makeDoorTexture(this); makeDpadTextures(this);
    console.error('CAMPUS: generate textures step 1');
    makeBubbleTexture(this); makePanelTexture(this);
    console.error('CAMPUS: generate textures step 2');
    var walkKeys = makeWalkTextures(this, colorHex); walkKeys.push('player');
    this.walkAtlas = walkKeys;
    makePlayerTexture(this, colorHex);

    console.error('CAMPUS: adding background rects');
    this.add.rectangle(MAP_W/2, MAP_H/2, MAP_W, MAP_H, C.sky).setDepth(-10);
    this.add.rectangle(MAP_W/2, MAP_H/2, MAP_W, MAP_H, 0x6AAF20).setDepth(-9);

    var P = this.add.graphics();
    P.fillStyle(C.pathway, 1);
    P.fillRect(230,350,230,60); P.fillRect(620,350,130,60);
    P.fillRect(1290,530,210,60);
    P.fillRect(190,1020,210,50); P.fillRect(550,1020,160,50); P.fillRect(920,1020,160,50); P.fillRect(1290,1020,230,50); P.fillRect(1690,1020,240,60);
    P.fillRect(370,630,150,160); P.fillRect(370,870,150,180);
    P.fillRect(370,1340,100,60);
    P.fillRect(500,618,840,44); P.fillRect(896,400,48,480);
    P.setDepth(0);
    console.error('CAMPUS: courtyard sprite added');
    this.add.sprite(920, 640, 'courtyard').setDepth(1);

    console.error('CAMPUS: about to create wall group and buildings');
    this.wallGroup = this.physics.add.staticGroup();
    BUILDINGS.forEach(function(b){
      if(b.isCourtyard) return;
      var cx = b.x + b.w/2 + 20, cy = b.y + b.h/2 + b.roofOffY + 10;
      console.error('CAMPUS: adding building sprite', b.key, 'at', cx, cy);
      this.add.sprite(cx, cy, 'bldg_'+b.key).setDepth(2);
      this.add.text(cx, b.y+b.roofOffY-18, b.label, {fontSize:'14px',fontFamily:'Fredoka,sans-serif',color:'#FFFFFF',fontStyle:'bold',stroke:'#2D1B00',strokeThickness:4}).setOrigin(0.5,1).setDepth(4);
      this
      this.add.text(cx, b.y+b.roofOffY, b.sublabel, {fontSize:'11px',fontFamily:'Fredoka,sans-serif',color:'#2D1B00',fontStyle:'bold',stroke:'#FFFFFF',strokeThickness:3}).setOrigin(0.5,0).setDepth(4);
      var wall = this.add.rectangle(cx, cy, b.w+30, b.h+10);
      this.physics.add.existing(wall, true); this.wallGroup.add(wall);
    }, this);

    this.doorGroup = this.physics.add.staticGroup();
    DOORS.forEach(function(d){
      self.add.sprite(d.dx, d.dy, 'door_trigger').setDepth(3);
      var hit = self.add.circle(d.dx, d.dy, 40);
      self.physics.add.existing(hit, true); hit.setData('bkey', d.bx);
      self.doorGroup.add(hit);
    });

    this.stationGroup = this.physics.add.staticGroup();
    BUILDINGS.forEach(function(b){
      b.stations.forEach(function(s){
        var act = ACTIVITIES[s.id]; if(!act) return;
        var comp = !!self.progress[s.id];
        makeStationTexture(self, s.id, comp);
        var spr = self.add.sprite(s.sx, s.sy, 'station_'+s.id).setDepth(3);
        spr.setInteractive();
        self.add.text(s.sx, s.sy-14, act.icon, {fontSize:'26px'}).setOrigin(0.5,1).setDepth(5);
        self.add.text(s.sx, s.sy+38, act.name, {fontSize:'10px',fontFamily:'Fredoka,sans-serif',color:'#2D1B00',wordWrap:{width:82},stroke:'#FFFFFF',strokeThickness:2}).setOrigin(0.5,0).setDepth(5);
        if(comp) self.add.text(s.sx+28, s.sy-28,'⭐',{fontSize:'18px'}).setOrigin(0.5).setDepth(6);
        var hit = self.add.circle(s.sx, s.sy, 34);
        self.physics.add.existing(hit, true); hit.setData('stationId', s.id); self.stationGroup.add(hit);
      });
    });

    this.npcGroup = this.physics.add.staticGroup();
    NPCS.forEach(function(n){
      var npc = self.add.sprite(n.x, n.y, 'npc_'+n.id).setDepth(6);
      npc.setInteractive();
      self.add.text(n.x, n.y-38, n.icon+' '+n.name, {fontSize:'12px',fontFamily:'Fredoka,sans-serif',color:'#FFFFFF',fontStyle:'bold',stroke:'#2D1B00',strokeThickness:3}).setOrigin(0.5,1).setDepth(7);
      var bble = self.add.sprite(n.x, n.y-90, 'bubble').setDepth(5).setAlpha(0);
      var bt = self.add.text(n.x-112, n.y-126, n.message, {fontSize:'11px',fontFamily:'Fredoka,sans-serif',color:'#2D1B00',wordWrap:{width:210}}).setDepth(6).setAlpha(0);
      npc.setData('bubble', bble); npc.setData('bubbleText', bt); npc.setData('npcData', n);
      self.npcGroup.add(npc);
      if(n.bounce) self.tweens.add({targets:npc, y:n.y-6, duration:700, ease:'Sine.easeInOut', yoyo:true, repeat:-1});
      npc.on('pointerdown', function(){
        if(self.bubbleVisible && self.bubbleNPC === npc){ self._closeBubble(); }
        else { self._openBubble(npc); }
      });
    });

    console.error('CAMPUS: about to create player');
    this.player = this.physics.add.sprite(MAP_W/2, MAP_H/2, 'player');
    console.error('CAMPUS: player created');
    this.player.setCollideWorldBounds(true); this.player.setDepth(10);
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.overlap(this.player, this.doorGroup, function(p,d){ if(self.cooldown<=0){self._checkDoor(d);} }, null, self);
    this.physics.add.overlap(this.player, this.stationGroup, function(p,s){ self._onStation(s); }, null, self);
    this.physics.add.overlap(this.player, this.npcGroup, function(p,n){ self._onNPC(n); }, null, self);

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(90, 70); this.cameras.main.setZoom(1.1);

    this._createMiniMap();
    if(this.sys.game.device.input.touch) this._createDpad();
    console.error('CAMPUS: create() COMPLETE');
    } catch(e) {
      console.error('CAMPUS EXCEPTION in create:', e.message, e.stack);
      var errDiv = document.createElement('div');
      errDiv.style = 'position:fixed;top:60px;left:0;background:#ff0000;color:white;z-index:99999;padding:20px;width:100vw;font-family:monospace;font-size:14px';
      errDiv.innerHTML = '<b>CAMPUS ERROR:</b><br>' + e.message + '<br><br><pre>' + (e.stack||'').slice(0,800) + '</pre>';
      document.body.appendChild(errDiv);
    }
  };

  SchoolScene.prototype.update = function(time, delta){
    var self = this;
    this.walkTimer += delta;
    if(this.cooldown > 0) this.cooldown -= delta;

    var vposX = 0, vposY = 0;
    var c = this.cursors, w = this.wasd;
    if(c.left.isDown||w.left.isDown){ vposX=-1; this.playerDir=2; }
    else if(c.right.isDown||w.right.isDown){ vposX=1; this.playerDir=3; }
    if(c.up.isDown||w.up.isDown){ vposY=-1; this.playerDir=1; }
    else if(c.down.isDown||w.down.isDown){ vposY=1; this.playerDir=0; }
    if(this._dpadRight) vposX=1; if(this._dpadLeft) vposX=-1;
    if(this._dpadUp) vposY=-1; if(this._dpadDown) vposY=1;
    this.isMoving = vposX!==0 || vposY!==0;
    if(vposX&&vposY){ vposX*=0.707; vposY*=0.707; }
    this.player.setVelocity(vposX*this.moveSpeed, vposY*this.moveSpeed);

    if(this.isMoving){
      if(this.panelActive) this._closePanel();
      if(this.bubbleVisible) this._closeBubble();
      if(this.walkTimer > 160){ this.walkFrame=(this.walkFrame+1)%2; this.walkTimer=0; }
      this.player.setTexture('w'+this.playerDir+'_'+this.walkFrame);
    } else {
      this.player.setTexture('player');
    }

    if((this._eKey.isDown||this._spaceKey.isDown) && this.cooldown<=0){
      var nd = this._nearDoor(); var nn = this._nearNPC();
      if(nd){ this.cooldown=700; this._openDoorAnimation(nd); }
      else if(nn && !this.bubbleVisible){ this.cooldown=600; this._openBubble(nn); }
      else if(nn && this.bubbleVisible){ this.cooldown=600; this._closeBubble(); }
    }
    if(this.bubbleVisible && !this._nearNPC()){ this._closeBubble(); }
  };

  SchoolScene.prototype._nearDoor = function(){
    var best=null, min=999;
    this.doorGroup.getChildren().forEach(function(d){
      var dx=this.player.x-d.x, dy=this.player.y-d.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<50 && dist<min){ min=dist; best=d; }
    }, this);
    return best;
  };

  SchoolScene.prototype._nearNPC = function(){
    var best=null, min=999;
    this.npcGroup.getChildren().forEach(function(n){
      var dx=this.player.x-n.x, dy=this.player.y-n.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<70 && dist<min){ min=dist; best=n; }
    }, this);
    return best;
  };

  SchoolScene.prototype._checkDoor = function(door){
    var bkey = door.getData('bkey');
    var b = BUILDINGS.find(function(x){ return x.key === bkey; });
    if(!b) return;
    // auto-show panel
    this._openDoorAnimation(door);
  };

  SchoolScene.prototype._openDoorAnimation = function(door){
    var self = this;
    var bkey = door.getData('bkey');
    var b = BUILDINGS.find(function(x){ return x.key === bkey; });
    if(!b) return;
    // Camera zoom in then show panel
    this.tweens.add({ targets:this.cameras.main, zoom:1.4, duration:400, ease:'Cubic.easeIn',
      onComplete: function(){
        self.tweens.add({ targets:this.cameras.main, zoom:1.4, duration:1400 });
        self._showDoorPanel(b);
        setTimeout(function(){
          self.tweens.add({ targets:self.cameras.main, zoom:1.1, duration:350, ease:'Cubic.easeOut' });
        }, 900);
      }
    });
  };

  SchoolScene.prototype._showDoorPanel = function(b){
    var self = this;
    var acts = b.stations.map(function(s){ return ACTIVITIES[s.id]; }).filter(Boolean);
    if(!acts.length) return;
    var cam = this.cameras.main;
    var px = cam.scrollX + cam.width/2 - 150;
    var py = cam.scrollY + cam.height/2 - 130;

    // Panel background
    var pan = this.add.graphics();
    pan.fillStyle(0x2D1B00,0.95); pan.fillRoundedRect(px, py, 300, 260, 20);
    pan.lineStyle(3, b.trimColor, 1); pan.strokeRoundedRect(px, py, 300, 260, 20);
    pan.setDepth(150);

    // Title
    var tx = this.add.text(cam.scrollX + cam.width/2, py+20, b.label+': '+b.sublabel, {
      fontSize:'16px', fontFamily:'Fredoka,sans-serif', color:'#FFFFFF',
      fontStyle:'bold', stroke:'#2D1B00', strokeThickness:4, align:'center'
    }).setOrigin(0.5,0).setDepth(151);

    // Activity list
    var rows = [];
    acts.forEach(function(a, i){
      var ry = py+60+i*54;
      // Row background
      var rowG = this.add.graphics();
      rowG.fillStyle(a.icon?0x5C4033:0x5C4033,0.4); rowG.fillRoundedRect(px+10, ry, 280, 48, 8);
      rowG.setDepth(150);
      var rowT = this.add.text(px+20, ry+12, a.icon+' '+a.name, {
        fontSize:'13px', fontFamily:'Fredoka,sans-serif', color:'#FFFFFF', stroke:'#2D1B00', strokeThickness:2
      }).setDepth(151);
      rows.push({g:rowG, t:rowT});
    }, this);

    this.panelActive = true;

    this.tweens.add({ targets:pan, alpha:{from:0,to:1}, duration:200 });
    this.tweens.add({ targets:tx, alpha:{from:0,to:1}, duration:250 });
    rows.forEach(function(r, i){
      setTimeout(function(){
        self.tweens.add({ targets:[r.g, r.t], alpha:{from:0,to:1}, duration:200 });
      }, i*60);
    });

    // Store panel refs for close
    this._panelRefs = { pan:pan, tx:tx, rows:rows, panX:px, panY:py };
  };

  SchoolScene.prototype._closePanel = function(){
    if(!this._panelRefs) return;
    var r = this._panelRefs;
    this.tweens.add({ targets:r.pan, alpha:0, duration:150, onComplete:function(){r.pan.destroy();} });
    this.tweens.add({ targets:r.tx, alpha:0, duration:150, onComplete:function(){r.tx.destroy();} });
    r.rows.forEach(function(row){ row.g.destroy(); row.t.destroy(); });
    this.panelActive = false;
    this._panelRefs = null;
  };

  SchoolScene.prototype._openBubble = function(npc){
    var bble = npc.getData('bubble');
    var bt = npc.getData('bubbleText');
    if(!bble) return;
    bble.setAlpha(1); bt.setAlpha(1);
    this.bubbleNPC = npc; this.bubbleVisible = true;
    this.tweens.add({ targets:bble, alpha:1, duration:200 });
    this.tweens.add({ targets:bt, alpha:1, duration:250 });
    // auto-close after 3.5s
    var self = this;
    this.bubbleTimer = setTimeout(function(){ self._closeBubble(); }, 3500);
  };

  SchoolScene.prototype._closeBubble = function(){
    if(!this.bubbleNPC) return;
    var bble = this.bubbleNPC.getData('bubble');
    var bt = this.bubbleNPC.getData('bubbleText');
    if(bble) this.tweens.add({ targets:bble, alpha:0, duration:150 });
    if(bt) this.tweens.add({ targets:bt, alpha:0, duration:150 });
    if(this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.bubbleNPC = null; this.bubbleVisible = false;
  };

  SchoolScene.prototype._onStation = function(p, station){
    if(this.cooldown > 0) return;
    this.cooldown = 1200;
    var id = station.getData('stationId');
    var act = ACTIVITIES[id]; if(!act) return;
    window.dispatchEvent(new CustomEvent('school_activity', {detail:{room:id, activity:act}}));
  };

  SchoolScene.prototype._onNPC = function(p, npc){
    var self = this;
    if(this.bubbleNPC === npc) return;
    this._openBubble(npc);
  };

  SchoolScene.prototype._createMiniMap = function(){
    var W=180, H=140;
    var bg = this.add.graphics();
    bg.fillStyle(0x2D1B00,0.9); bg.fillRoundedRect(4,4,W,H,10);
    bg.setScrollFactor(0); bg.setDepth(200);
    this._miniDots = this.add.graphics();
    this._miniDots.setScrollFactor(0); this._miniDots.setDepth(201);
    BUILDINGS.forEach(function(b){
      if(b.isCourtyard) return;
      var mx=(b.x+b.w/2)*(W/MAP_W), my=(b.y+b.h/2)*(H/MAP_H);
      this._miniDots.fillStyle(b.trimColor,0.85); this._miniDots.fillCircle(mx+4, my+4, 5);
    }, this);
  };

  SchoolScene.prototype._createDpad = function(){
    var padX=90, padY=this.scale.height-100, gap=68;
    this.add.image(padX, padY, 'dpad_bg').setAlpha(0.88).setDepth(100).setScrollFactor(0);
    var dirs = [{key:'dpad_up',dx:0,dy:-gap},{key:'dpad_down',dx:0,dy:gap},{key:'dpad_left',dx:-gap,dy:0},{key:'dpad_right',dx:gap,dy:0}];
    dirs.forEach(function(o){
      var btn = this.add.image(padX+o.dx, padY+o.dy, o.key).setDepth(101).setScrollFactor(0).setInteractive();
      var d = o.key.replace('dpad_','');
      btn.on('pointerdown', function(){ this['_dpad'+d.charAt(0).toUpperCase()+d.slice(1)]=true; }, this);
      btn.on('pointerup', function(){ this['_dpad'+d.charAt(0).toUpperCase()+d.slice(1)]=false; }, this);
      btn.on('pointerout', function(){ this['_dpad'+d.charAt(0).toUpperCase()+d.slice(1)]=false; }, this);
    }, this);
  };

  SchoolScene.prototype.markComplete = function(stationId){
    this.progress[stationId] = true;
    saveProgress(this.progress);
  };

  // Boot
  var game;
  function bootGame(){
    var cont = document.getElementById('phaser-container');
    if(!cont) return;
    var w = cont.clientWidth || 800, h = cont.clientHeight || 600;
    if(game){ game.destroy(true); game = null; }
    console.error('CAMPUS: Creating Phaser.Game, container size:', w, h);
    try {
      game = new Phaser.Game({
        type:Phaser.AUTO, width:w, height:h, parent:'phaser-container', backgroundColor:'#87CEEB',
        physics:{ default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
        scale:{ mode:Phaser.Scale.RESIZE, autoCenter:Phaser.Scale.CENTER_BOTH },
        scene:SchoolScene,
      });
      console.error('CAMPUS: Phaser.Game created, scenes:', game.scene ? game.scene.count : 0);
    } catch(e) {
      console.error('CAMPUS: Phaser.Game creation failed:', e.message);
      var errDiv = document.createElement('div');
      errDiv.style = 'position:fixed;top:0;left:0;background:#ff0000;color:white;z-index:99999;padding:20px';
      errDiv.textContent = 'Phaser.Game creation failed: ' + e.message;
      document.body.appendChild(errDiv);
    }
  }

  window.__schoolGame = null;
  window.__schoolMarkComplete = function(room){
    game && game.scene.getScene('SchoolScene') && game.scene.getScene('SchoolScene').markComplete(room);
  };

  window.addEventListener('resize', function(){
    if(!document.getElementById('phaser-container') || !game) return;
    game.scale.resize(document.getElementById('phaser-container').clientWidth, document.getElementById('phaser-container').clientHeight);
  });

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';
  script.onload = function(){ bootGame(); window.__schoolGame = game; };
  document.head.appendChild(script);
})();
