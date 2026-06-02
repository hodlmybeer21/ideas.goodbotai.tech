// Phaser 3 game for GoodBot Kids School Explorer
// Top-down 2D, camera follows player, touch d-pad, activity stations

(() => {
  const ACTIVITIES = {
    auditorium:    { name: 'Story Machine',     icon: '📖', component: 'story' },
    artroom:       { name: 'Magic Canvas',     icon: '🎨', component: 'draw' },
    library:       { name: 'Read Along',       icon: '📚', component: 'readalong' },
    scienceroom:   { name: 'Sound Lab',         icon: '🎵', component: 'sound' },
    gym:           { name: 'Bossy R Racer',     icon: '🏎️', component: 'bossyr' },
    mathroom:      { name: 'Math Lab',          icon: '🧮', component: 'math' },
    musicroom:     { name: 'Sound Lab',         icon: '🎵', component: 'sound' },
    nurse:         { name: 'Tell Time',         icon: '🕐', component: 'time' },
    office:        { name: 'CodeBots',          icon: '🤖', component: 'codebots' },
    cafeteria:     { name: 'Equal Parts',       icon: '🔴', component: 'equal' },
    playground:    { name: 'Animal Match',     icon: '🧩', component: 'match' },
    greenhouse:    { name: 'Plant Life Cycle',  icon: '🌱', component: 'plantcycle' },
  };

  // Map dimensions (pixels)
  const MAP_W = 1600;
  const MAP_H = 1200;

  // Room definitions: { x, y, w, h, key, label, color }
  const ROOMS = [
    { key: 'auditorium',  x: 0,    y: 0,    w: 500,  h: 400,  label: 'Auditorium',   color: 0xC084FC },
    { key: 'library',     x: 550,  y: 0,    w: 500,  h: 400,  label: 'Library',      color: 0x6BCBFF },
    { key: 'artroom',     x: 1100, y: 0,    w: 500,  h: 400,  label: 'Art Room',    color: 0xFF6B9D },
    { key: 'scienceroom', x: 0,    y: 450,  w: 400,  h: 350,  label: 'Science Room', color: 0x6BCB77 },
    { key: 'mainhall',    x: 450,  y: 450,  w: 700,  h: 350,  label: 'Main Hall',    color: 0xFFD93D },
    { key: 'musicroom',   x: 1200, y: 450,  w: 400,  h: 350,  label: 'Music Room',   color: 0xFF9F43 },
    { key: 'gym',         x: 0,    y: 850,  w: 500,  h: 350,  label: 'Gym',          color: 0x6BCBFF },
    { key: 'cafeteria',   x: 550,  y: 850,  w: 500,  h: 350,  label: 'Cafeteria',   color: 0xFF9F43 },
    { key: 'mathroom',    x: 1100, y: 850,  w: 500,  h: 350,  label: 'Math Room',   color: 0xFF6B9D },
    { key: 'nurse',       x: 0,    y: 1250, w: 350,  h: 300,  label: 'Nurse',       color: 0x6BCB77 },
    { key: 'office',      x: 400,  y: 1250, w: 400,  h: 300,  label: 'Office',      color: 0xC084FC },
    { key: 'playground',  x: 850,  y: 1250, w: 750,  h: 300,  label: 'Playground',  color: 0x6BCBFF },
    { key: 'greenhouse',  x: 0,    y: 1600, w: 1600, h: 200,  label: 'Greenhouse',   color: 0x6BCB77 },
  ];

  // Room centers for station placement
  const STATIONS = [
    { room: 'auditorium',  sx: 250, sy: 200 },
    { room: 'library',     sx: 800, sy: 200 },
    { room: 'artroom',     sx: 1350, sy: 200 },
    { room: 'scienceroom', sx: 200, sy: 625 },
    { room: 'mainhall',    sx: 800, sy: 625 },
    { room: 'musicroom',   sx: 1400, sy: 625 },
    { room: 'gym',         sx: 250, sy: 1025 },
    { room: 'cafeteria',   sx: 800, sy: 1025 },
    { room: 'mathroom',   sx: 1350, sy: 1025 },
    { room: 'nurse',      sx: 175, sy: 1400 },
    { room: 'office',      sx: 600, sy: 1400 },
    { room: 'playground',  sx: 1225, sy: 1400 },
    { room: 'greenhouse',  sx: 800, sy: 1700 },
  ];

  // ── Progress ─────────────────────────────────────────────────────────────
  function getProgress() {
    try { return JSON.parse(localStorage.getItem('school_progress') || '{}'); }
    catch { return {}; }
  }
  function saveProgress(p) { localStorage.setItem('school_progress', JSON.stringify(p)); }

  // ── Texture Factories ────────────────────────────────────────────────────
  function makeRoomTexture(scene, key, color, w, h) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 0.18);
    g.fillRect(0, 0, w, h);
    g.lineStyle(4, color, 0.55);
    g.strokeRect(2, 2, w - 4, h - 4);
    // Subtle floor pattern — horizontal lines
    g.lineStyle(1, color, 0.08);
    for (let y = 32; y < h; y += 32) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.strokePath();
    }
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillRoundedRect(w / 2 - 90, 8, 180, 34, 8);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  function makeStationTexture(scene, key, icon, completed) {
    const size = 88;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Outer glow ring
    g.fillStyle(completed ? 0x6BCB77 : 0xFFD93D, 0.25);
    g.fillCircle(size / 2, size / 2, size / 2);
    // Inner fill
    g.fillStyle(completed ? 0x4CAF50 : 0xFFFFFF, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 8);
    // Ring border
    g.lineStyle(4, completed ? 0x2E7D32 : 0xF59E0B, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - 8);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  function makePlayerTexture(scene, color) {
    const size = 52;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(size / 2 + 2, size - 4, size - 10, size / 4);
    // Body
    g.fillStyle(parseInt(color.replace('#', '0x')), 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 4);
    // White eyes
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(size / 2 - 9, size / 2 - 5, 8);
    g.fillCircle(size / 2 + 9, size / 2 - 5, 8);
    // Pupils
    g.fillStyle(0x2D1B00, 1);
    g.fillCircle(size / 2 - 7, size / 2 - 5, 5);
    g.fillCircle(size / 2 + 11, size / 2 - 5, 5);
    // Smile
    g.lineStyle(3, 0x2D1B00, 1);
    g.beginPath();
    g.arc(size / 2, size / 2 + 2, 11, 0.35, Math.PI - 0.35);
    g.strokePath();
    g.generateTexture('player', size, size);
    g.destroy();
  }

  function makeDpadTextures(scene) {
    const size = 64;
    // Base background
    const bg = scene.make.graphics({ x: 0, y: 0, add: false });
    bg.fillStyle(0xFFFFFF, 0.92);
    bg.fillRoundedRect(0, 0, size, size, 14);
    bg.lineStyle(3, 0xFFD93D, 1);
    bg.strokeRoundedRect(0, 0, size, size, 14);
    bg.generateTexture('dpad_bg', size, size);
    bg.destroy();

    // Direction buttons
    const dirs = [
      { key: 'dpad_up',    r: 0 },
      { key: 'dpad_right', r: Math.PI / 2 },
      { key: 'dpad_down',  r: Math.PI },
      { key: 'dpad_left',  r: -Math.PI / 2 },
    ];
    dirs.forEach(({ key, r }) => {
      const ag = scene.make.graphics({ x: 0, y: 0, add: false });
      ag.fillStyle(0x5C4033, 0.9);
      ag.beginPath();
      ag.moveTo(32 + Math.sin(r) * 18, 32 - Math.cos(r) * 18);
      ag.lineTo(32 + Math.sin(r + 2.5) * 20, 32 - Math.cos(r + 2.5) * 20);
      ag.lineTo(32 + Math.sin(r - 2.5) * 20, 32 - Math.cos(r - 2.5) * 20);
      ag.closePath();
      ag.fill();
      ag.generateTexture(key, size, size);
      ag.destroy();
    });
  }

  // ── Main Scene ───────────────────────────────────────────────────────────
  class SchoolScene extends Phaser.Scene {
    constructor() { super({ key: 'SchoolScene' }); }

    create() {
      this.playerColor = sessionStorage.getItem('school_player_color') || '#FF6B9D';
      this.progress   = getProgress();
      this.cursors    = this.input.keyboard.createCursorKeys();
      this.wasd       = this.input.keyboard.addKeys({
        up:    Phaser.Input.Keyboard.KeyCodes.W,
        down:  Phaser.Input.Keyboard.KeyCodes.S,
        left:  Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });

      this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

      // Build all textures
      ROOMS.forEach(r => makeRoomTexture(this, `room_${r.key}`, r.color, r.w, r.h));
      makeDpadTextures(this);

      // ── Room Sprites ──────────────────────────────────────────────────
      this.roomGroup = this.physics.add.staticGroup();
      ROOMS.forEach(r => {
        // Floor tile
        const spr = this.add.sprite(r.x + r.w / 2, r.y + r.h / 2, `room_${r.key}`).setDepth(0);
        // Label
        const lbl = this.add.text(r.x + r.w / 2, r.y + 14, r.label, {
          fontSize: '17px',
          fontFamily: 'Fredoka, sans-serif',
          color: '#2D1B00',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(2);
        // Collider
        const body = this.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
        this.physics.add.existing(body, true);
        this.roomGroup.add(body);
      });

      // ── Activity Stations ──────────────────────────────────────────────
      this.stationGroup = this.physics.add.staticGroup();
      STATIONS.forEach(s => {
        const act  = ACTIVITIES[s.room];
        if (!act) return;
        const comp = !!this.progress[s.room];
        makeStationTexture(this, `station_${s.room}`, act.icon, comp);

        const spr = this.add.sprite(s.sx, s.sy, `station_${s.room}`).setDepth(3);
        spr.setInteractive({ useHandCursor: true });

        // Icon on top
        this.add.text(s.sx, s.sy - 4, act.icon, { fontSize: '30px' }).setOrigin(0.5, 0.5).setDepth(4);

        // Completion star
        if (comp) {
          this.add.text(s.sx + 30, s.sy - 30, '⭐', { fontSize: '20px' }).setOrigin(0.5).setDepth(5);
        }

        // Label
        this.add.text(s.sx, s.sy + 46, act.name, {
          fontSize: '11px',
          fontFamily: 'Fredoka, sans-serif',
          color: '#ffffff',
          fontStyle: 'bold',
          wordWrap: { width: 88 },
          stroke: '#2D1B00',
          strokeThickness: 3,
        }).setOrigin(0.5, 0).setDepth(4);

        // Hit circle
        const hit = this.add.circle(s.sx, s.sy, 38);
        this.physics.add.existing(hit, true);
        hit.setData('room', s.room);
        this.stationGroup.add(hit);
      });

      // ── Player ────────────────────────────────────────────────────────
      makePlayerTexture(this, this.playerColor);
      this.player = this.physics.add.sprite(MAP_W / 2, MAP_H / 2, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.setDepth(5);
      this.physics.add.collider(this.player, this.roomGroup);

      // ── Camera ────────────────────────────────────────────────────────
      this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.setDeadzone(80, 60);

      // ── Station Interaction ────────────────────────────────────────────
      this.physics.add.overlap(this.player, this.stationGroup, this._onStation, null, this);

      // ── Mobile D-Pad ───────────────────────────────────────────────────
      if (this.sys.game.device.input.touch) {
        this._createDpad();
      }

      this.moveSpeed = 210;
    }

    update() {
      let vx = 0, vy = 0;
      const c = this.cursors, w = this.wasd;

      // Keyboard
      if (c.left.isDown  || w.left.isDown)  vx = -1;
      else if (c.right.isDown || w.right.isDown) vx = 1;
      if (c.up.isDown    || w.up.isDown)    vy = -1;
      else if (c.down.isDown  || w.down.isDown) vy = 1;

      // D-pad overrides (additive so both can work together)
      if (this._dpadRight) vx =  1;
      if (this._dpadLeft)  vx = -1;
      if (this._dpadUp)    vy = -1;
      if (this._dpadDown)  vy =  1;

      // Normalize diagonal
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

      this.player.setVelocity(vx * this.moveSpeed, vy * this.moveSpeed);
    }

    _onStation(player, station) {
      const room = station.getData('room');
      window.dispatchEvent(new CustomEvent('school_activity', {
        detail: { room, activity: ACTIVITIES[room] }
      }));
    }

    _createDpad() {
      const cw = this.scale.width;
      const ch = this.scale.height;
      const padX = 90;
      const padY = ch - 100;
      const gap  = 68;

      this.add.image(padX, padY, 'dpad_bg').setAlpha(0.9).setDepth(100).setScrollFactor(0);
      this.add.image(padX, padY, 'dpad_bg').setAlpha(0.9).setDepth(100).setScrollFactor(0);

      const dirs = [
        { key: 'dpad_up',    dx: 0,     dy: -gap, d: 'Up'    },
        { key: 'dpad_down',  dx: 0,     dy:  gap, d: 'Down'  },
        { key: 'dpad_left',  dx: -gap,  dy: 0,    d: 'Left'  },
        { key: 'dpad_right', dx:  gap,  dy: 0,    d: 'Right' },
      ];

      dirs.forEach(({ key, dx, dy, d }) => {
        const btn = this.add.image(padX + dx, padY + dy, key)
          .setDepth(101)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => { this[`_dpad${d}`] = true; });
        btn.on('pointerup',   () => { this[`_dpad${d}`] = false; });
        btn.on('pointerout',  () => { this[`_dpad${d}`] = false; });
      });
    }

    markComplete(room) {
      this.progress[room] = true;
      saveProgress(this.progress);
      // Refresh station textures
      makeStationTexture(this, `station_${room}`, ACTIVITIES[room].icon, true);
    }
  }

  // ── Boot & Resize ───────────────────────────────────────────────────────
  let game;

  function bootGame() {
    const container = document.getElementById('phaser-container');
    if (!container) return;

    const w = container.clientWidth  || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    if (game) { game.destroy(true); game = null; }

    game = new Phaser.Game({
      type:            Phaser.AUTO,
      width:           w,
      height:          h,
      parent:          'phaser-container',
      backgroundColor: '#D4C4A8',
      physics: {
        default: 'arcade',
        arcade:  { gravity: { y: 0 }, debug: false },
      },
      scale: {
        mode:       Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: SchoolScene,
    });
  }

  // ── Global exports ───────────────────────────────────────────────────────
  window.__schoolGame     = null;
  window.__schoolMarkComplete = (room) => {
    game?.scene.getScene('SchoolScene')?.markComplete(room);
  };

  // ── Bootstrap ───────────────────────────────────────────────────────────
  const script = document.createElement('script');
  script.src   = 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';
  script.onload = () => {
    bootGame();
    window.__schoolGame = game;

    // Re-boot on resize
    window.addEventListener('resize', () => {
      const container = document.getElementById('phaser-container');
      if (!container || !game) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      game.scale.resize(w, h);
    });
  };
  document.head.appendChild(script);
})();
