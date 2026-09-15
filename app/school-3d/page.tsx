'use client';

import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Link from 'next/link';
import * as THREE from 'three';
import CampusGround from './components/CampusGround';
import Building from './components/Building';
import Player from './components/Player';
import NPCs from './components/NPCs';
import ActivityModal from './components/ActivityModal';
import StationPicker from './components/StationPicker';
import TouchJoystick from './components/TouchJoystick';
import BGMPlayer from './components/BGMPlayer';
import { BUILDINGS, type Building as BuildingT } from './buildings.config';

const PLAYER_COLORS = [
  { color: '#FF6B9D', label: 'Pink',   emoji: '🩷' },
  { color: '#6BCBFF', label: 'Blue',   emoji: '💙' },
  { color: '#6BCB77', label: 'Green',  emoji: '💚' },
  { color: '#FFD93D', label: 'Yellow', emoji: '💛' },
  { color: '#C084FC', label: 'Purple', emoji: '💜' },
  { color: '#FF9F43', label: 'Orange', emoji: '🧡' },
];

export default function School3DPage() {
  const [phase, setPhase]                 = useState<'picker' | 'game'>('picker');
  const [playerColor, setPlayerColor]     = useState<string>(PLAYER_COLORS[0].color);
  const [nearBuildingId, setNearBuildingId] = useState<string | null>(null);
  const [pickerBuilding, setPickerBuilding] = useState<BuildingT | null>(null);
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [joystickVec, setJoystickVec]     = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const playerPosRef                      = useRef(new THREE.Vector3(0, 0, 8));

  // E-to-enter handler (keyboard)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && nearBuildingId && !pickerBuilding && !activeStation) {
        const b = BUILDINGS.find((x) => x.id === nearBuildingId);
        if (b) setPickerBuilding(b);
      } else if (e.code === 'Escape') {
        if (activeStation) setActiveStation(null);
        else if (pickerBuilding) setPickerBuilding(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearBuildingId, pickerBuilding, activeStation]);

  const handlePlayerNear = useCallback((buildingId: string, near: boolean) => {
    setNearBuildingId(near ? buildingId : (id) => (id === buildingId ? null : id));
  }, []);

  const handlePickStation = useCallback((stationId: string) => {
    setActiveStation(stationId);
    setPickerBuilding(null);
  }, []);

  const handleCloseActivity = useCallback(() => {
    setActiveStation(null);
  }, []);

  const nearBuilding = nearBuildingId ? BUILDINGS.find((b) => b.id === nearBuildingId) ?? null : null;

  // ── Picker ──────────────────────────────────────────────
  if (phase === 'picker') {
    return <CharacterPicker onStart={(c) => { setPlayerColor(c); setPhase('game'); }} colors={PLAYER_COLORS} />;
  }

  // ── Game ─────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#87CEEB' }}>
      <Canvas
        shadows
        camera={{ position: [0, 10, 18], fov: 55 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Sky sunPosition={[80, 50, 60]} turbidity={5} rayleigh={2} />
          <ambientLight intensity={0.55} />
          <hemisphereLight args={['#FFF8F0', '#7CB342', 0.45]} />
          <directionalLight
            position={[30, 35, 20]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-35}
            shadow-camera-right={35}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
            shadow-camera-near={0.5}
            shadow-camera-far={100}
          />

          <CampusGround />
          {BUILDINGS.map((b) => (
            <Building
              key={b.id}
              building={b}
              playerPosRef={playerPosRef}
              onPlayerNear={handlePlayerNear}
            />
          ))}
          <NPCs />
          <Player color={playerColor} joystick={joystickVec} positionRef={playerPosRef} />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div style={hudStyles.header}>
        <Link href="/" style={hudStyles.backLink}>← GoodBot Kids</Link>
        <span style={hudStyles.title}>🏫 GoodBot School 3D</span>
        <button style={hudStyles.exitBtn} onClick={() => setPhase('picker')}>🔄 New Character</button>
      </div>

      <div style={hudStyles.controls}>
        <strong>Move:</strong> WASD / Arrows / Joystick &nbsp;·&nbsp;
        <strong>Enter:</strong> <kbd style={kbd}>E</kbd> &nbsp;·&nbsp;
        <strong>Close:</strong> <kbd style={kbd}>Esc</kbd>
      </div>

      {nearBuilding && !pickerBuilding && !activeStation && (
        <div style={hudStyles.doorPrompt}>
          <span style={{ fontSize: 28 }}>{nearBuilding.stations[0]?.icon ?? '🏫'}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Press <kbd style={kbdBig}>E</kbd> to enter</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>{nearBuilding.label}</div>
          </div>
          <button style={hudStyles.enterBtn} onClick={() => setPickerBuilding(nearBuilding)}>
            Open →
          </button>
        </div>
      )}

      {pickerBuilding && (
        <StationPicker
          building={pickerBuilding}
          onPick={handlePickStation}
          onClose={() => setPickerBuilding(null)}
        />
      )}

      {activeStation && (
        <ActivityModal stationId={activeStation} onClose={handleCloseActivity} />
      )}

      <TouchJoystick onMove={setJoystickVec} />

      <BGMPlayer audioUrl="/school-3d/bgm.mp3" />
    </div>
  );
}

// ── Character Picker ─────────────────────────────────────
function CharacterPicker({ onStart, colors }: { onStart: (c: string) => void; colors: typeof PLAYER_COLORS }) {
  const [selected, setSelected] = useState(colors[0].color);
  return (
    <div style={pickerStyles.wrap}>
      <div style={pickerStyles.card}>
        <div style={pickerStyles.mascot}>🤖</div>
        <h1 style={pickerStyles.title}>School 3D Explorer</h1>
        <p style={pickerStyles.subtitle}>Pick your character!</p>
        <div style={pickerStyles.colorRow}>
          {colors.map((c) => (
            <button
              key={c.color}
              onClick={() => setSelected(c.color)}
              title={c.label}
              style={{
                ...pickerStyles.colorBtn,
                background: c.color,
                boxShadow: selected === c.color ? '0 0 0 4px #2D1B00' : 'none',
                transform: selected === c.color ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
            </button>
          ))}
        </div>
        <div style={pickerStyles.preview}>
          <div style={{ ...pickerStyles.previewChar, background: selected }}>
            <span style={pickerStyles.previewEmoji}>😊</span>
          </div>
          <span style={pickerStyles.previewLabel}>You</span>
        </div>
        <button style={pickerStyles.goBtn} onClick={() => onStart(selected)}>
          Let&apos;s Go! →
        </button>
        <p style={{ marginTop: 12, fontSize: 13, color: '#5C4033', opacity: 0.7 }}>
          Explore 12 buildings around the courtyard · WASD to move · E to enter
        </p>
      </div>
    </div>
  );
}

const kbd = {
  display: 'inline-block',
  padding: '1px 7px',
  background: 'white',
  border: '2px solid #2D1B00',
  borderRadius: 5,
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  color: '#2D1B00',
  boxShadow: '0 2px 0 #2D1B00',
};
const kbdBig = { ...kbd, padding: '3px 10px', fontSize: 16 };

const hudStyles = {
  header: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.95)',
    borderBottom: '3px solid #FFD93D',
    padding: '8px 16px',
    fontFamily: 'Fredoka, sans-serif',
    zIndex: 10,
  },
  backLink: { fontSize: 14, fontWeight: 600, color: '#5C4033', textDecoration: 'none' },
  title: { fontSize: 18, fontWeight: 700, color: '#FF6B9D' },
  exitBtn: {
    fontSize: 13, fontWeight: 600,
    background: 'none', border: '2px solid #E5E0D8',
    borderRadius: 10, padding: '4px 12px',
    cursor: 'pointer', color: '#5C4033',
    fontFamily: 'Fredoka, sans-serif',
  },
  controls: {
    position: 'absolute' as const,
    bottom: 16, left: 16,
    background: 'rgba(255,255,255,0.92)',
    border: '2px solid #FFD93D',
    borderRadius: 12,
    padding: '8px 14px',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 12,
    color: '#5C4033',
    zIndex: 10,
    maxWidth: 'calc(100vw - 200px)',
  },
  doorPrompt: {
    position: 'absolute' as const,
    top: 80, left: '50%',
    transform: 'translateX(-50%)',
    background: 'white',
    border: '3px solid #FFD93D',
    borderRadius: 16,
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
    fontFamily: 'Fredoka, sans-serif',
    color: '#2D1B00',
    zIndex: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  enterBtn: {
    background: '#FF6B9D',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    boxShadow: '0 3px 0 #CC3366',
  },
};

const pickerStyles = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFF8F0, #FFF0E4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Fredoka, sans-serif', padding: 24,
  },
  card: {
    background: 'white', borderRadius: 28,
    padding: '40px 36px', textAlign: 'center' as const,
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '3px solid #FFD93D',
    maxWidth: 380, width: '100%',
  },
  mascot: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, color: '#FF6B9D', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#5C4033', marginBottom: 24 },
  colorRow: {
    display: 'flex', justifyContent: 'center', gap: 14,
    marginBottom: 28, flexWrap: 'wrap' as const,
  },
  colorBtn: {
    width: 52, height: 52, borderRadius: '50%',
    border: '3px solid white', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  preview: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: 6, marginBottom: 28,
  },
  previewChar: {
    width: 72, height: 72, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  previewEmoji: { fontSize: 36 },
  previewLabel: { fontSize: 13, color: '#5C4033', fontWeight: 600 },
  goBtn: {
    background: '#FF6B9D', color: 'white',
    border: 'none', borderRadius: 16,
    padding: '16px 36px', fontSize: 20, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
    boxShadow: '0 4px 0 #CC3366',
  },
};
