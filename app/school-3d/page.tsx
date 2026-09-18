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
import SkyExtras from './components/Sky';
import BuildingLabels from './components/BuildingLabels';
import MiniMap from './components/MiniMap';
import TutorialOverlay from './components/TutorialOverlay';
import QuestTracker from './components/QuestTracker';
import StickerBook from './components/StickerBook';
import Cats from './components/Cats';
import Butterflies from './components/Butterflies';
import { BUILDINGS, type Building as BuildingT } from './buildings.config';
import {
  loadProgress, saveProgress,
  markVisited, markCompleted, markOnboarded,
  type Progress,
} from './lib/progress';
import { getActiveQuest, QUESTS } from './quests';
import { getEarnedStickerIds, diffStickerIds, getSticker } from './stickers';
import { armFirstGesture, playDoorChime, playStickerEarned } from './lib/audio';

const PLAYER_COLORS = [
  { color: '#E8B4A0', label: 'Rose',    emoji: '🩷' },
  { color: '#A8C9D8', label: 'Sky',     emoji: '💙' },
  { color: '#A4B58A', label: 'Sage',    emoji: '💚' },
  { color: '#E8C788', label: 'Wheat',   emoji: '💛' },
  { color: '#C9A6B0', label: 'Mauve',   emoji: '💜' },
  { color: '#D9B082', label: 'Sand',    emoji: '🧡' },
];

const TOAST_DURATION_MS = 3200;

type StickerToast = {
  id: number;
  stickerId: string;
};

export default function School3DPage() {
  const [phase, setPhase]                 = useState<'picker' | 'game'>('picker');
  const [playerColor, setPlayerColor]     = useState<string>(PLAYER_COLORS[0].color);
  const [nearBuildingId, setNearBuildingId] = useState<string | null>(null);
  const [pickerBuilding, setPickerBuilding] = useState<BuildingT | null>(null);
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [joystickVec, setJoystickVec]     = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [showTutorial, setShowTutorial]   = useState(false);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [progress, setProgress]           = useState<Progress>({
    visitedBuildings: [], completedStations: [], hasOnboarded: false,
  });
  const [playerPos, setPlayerPos]         = useState({ x: 0, z: 8 });
  const [stickerToasts, setStickerToasts] = useState<StickerToast[]>([]);

  const playerPosRef                      = useRef(new THREE.Vector3(0, 0, 8));
  const toastIdRef                       = useRef(0);
  const prevEarnedRef                    = useRef<Set<string> | null>(null);

  // Arm audio on first user gesture (browser autoplay rule).
  useEffect(() => {
    armFirstGesture();
  }, []);

  // Load progress on mount, decide whether to show the tutorial.
  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    setShowTutorial(!p.hasOnboarded);
  }, []);

  // Persist progress whenever it changes.
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Poll the player position ref ~10x/sec so the mini-map can render it.
  useEffect(() => {
    if (phase !== 'game') return;
    const id = setInterval(() => {
      setPlayerPos({ x: playerPosRef.current.x, z: playerPosRef.current.z });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Detect newly-earned stickers and fire toasts + sound.
  useEffect(() => {
    const after = getEarnedStickerIds(progress);
    if (prevEarnedRef.current === null) {
      prevEarnedRef.current = after;
      return;
    }
    const newIds = diffStickerIds(prevEarnedRef.current, after);
    prevEarnedRef.current = after;
    if (newIds.length === 0) return;

    playStickerEarned();
    setStickerToasts((prev) => [
      ...prev,
      ...newIds.map((id) => ({ id: ++toastIdRef.current, stickerId: id })),
    ]);

    // Auto-remove each toast after TOAST_DURATION_MS
    const timers = newIds.map((_, i) =>
      setTimeout(() => {
        setStickerToasts((prev) => prev.slice(0, prev.length - newIds.length + i + 1).slice(-prev.length));
      }, TOAST_DURATION_MS),
    );
    // Simpler: schedule removals in order
    newIds.forEach((_, i) => {
      setTimeout(() => {
        setStickerToasts((prev) => prev.slice(i + 1));
      }, TOAST_DURATION_MS + i * 100);
    });
    return () => timers.forEach(clearTimeout);
  }, [progress]);

  // E-to-enter handler (keyboard)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && nearBuildingId && !pickerBuilding && !activeStation) {
        const b = BUILDINGS.find((x) => x.id === nearBuildingId);
        if (b) setPickerBuilding(b);
      } else if (e.code === 'Escape') {
        if (activeStation) setActiveStation(null);
        else if (pickerBuilding) setPickerBuilding(null);
        else if (showStickerBook) setShowStickerBook(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearBuildingId, pickerBuilding, activeStation, showStickerBook]);

  const handlePlayerNear = useCallback((buildingId: string, near: boolean) => {
    setNearBuildingId(near ? buildingId : (id) => (id === buildingId ? null : id));
    if (near) {
      setProgress((prev) => markVisited(prev, buildingId));
    }
  }, []);

  const handlePickStation = useCallback((stationId: string) => {
    playDoorChime();
    setActiveStation(stationId);
    setPickerBuilding(null);
  }, []);

  const handleCloseActivity = useCallback(() => {
    setActiveStation(null);
  }, []);

  const handleActivityComplete = useCallback((stationId: string) => {
    setProgress((prev) => markCompleted(prev, stationId));
  }, []);

  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
    setProgress((prev) => markOnboarded(prev));
  }, []);

  const nearBuilding = nearBuildingId ? BUILDINGS.find((b) => b.id === nearBuildingId) ?? null : null;

  const totalBuildings = BUILDINGS.length;
  const visitedCount = progress.visitedBuildings.length;
  const completedCount = progress.completedStations.length;
  const earnedStickerCount = getEarnedStickerIds(progress).size;

  const activeQuest = getActiveQuest(progress);
  const activeQuestIndex = activeQuest
    ? QUESTS.findIndex((q) => q.id === activeQuest.id)
    : QUESTS.length;

  // ── Picker ──────────────────────────────────────────────
  if (phase === 'picker') {
    return <CharacterPicker onStart={(c) => { setPlayerColor(c); setPhase('game'); }} colors={PLAYER_COLORS} />;
  }

  // ── Game ─────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#E8C9A8' }}>
      <Canvas
        shadows
        camera={{ position: [0, 10, 18], fov: 55 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#E8C9A8', 28, 78]} />
        <color attach="background" args={['#E8C9A8']} />

        <Suspense fallback={null}>
          <Sky
            sunPosition={[60, 8, -50]}
            turbidity={10}
            rayleigh={4}
            mieCoefficient={0.012}
            mieDirectionalG={0.85}
          />
          <SkyExtras />
          <ambientLight intensity={0.55} color="#FFE8C9" />
          <hemisphereLight args={['#FFD89B', '#7A9B6E', 0.5]} />
          <directionalLight
            position={[40, 18, -25]}
            intensity={1.35}
            color="#FFCB85"
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
          <Cats />
          <Butterflies />
          {BUILDINGS.map((b) => (
            <Building
              key={b.id}
              building={b}
              playerPosRef={playerPosRef}
              onPlayerNear={handlePlayerNear}
            />
          ))}
          <BuildingLabels visitedBuildings={new Set(progress.visitedBuildings)} />
          <NPCs />
          <Player color={playerColor} joystick={joystickVec} positionRef={playerPosRef} />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div style={hudStyles.header}>
        <Link href="/" style={hudStyles.backLink}>← GoodBot Kids</Link>
        <div style={hudStyles.progressChip}>
          <span style={hudStyles.progressItem}>
            <span style={hudStyles.progressIcon}>🏛</span>
            <span>{visitedCount}/{totalBuildings}</span>
          </span>
          <span style={hudStyles.progressSep}>·</span>
          <span style={hudStyles.progressItem}>
            <span style={hudStyles.progressIcon}>⭐</span>
            <span>{completedCount}</span>
          </span>
        </div>
        <div style={hudStyles.rightGroup}>
          <button style={hudStyles.stickerBtn} onClick={() => setShowStickerBook(true)} title="Open sticker book">
            📚 <span style={hudStyles.stickerCount}>{earnedStickerCount}</span>
          </button>
          <button style={hudStyles.exitBtn} onClick={() => setPhase('picker')}>🔄 New Character</button>
        </div>
      </div>

      <QuestTracker quest={activeQuest} index={activeQuestIndex} total={QUESTS.length} />

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
        <ActivityModal
          stationId={activeStation}
          onClose={handleCloseActivity}
          onComplete={handleActivityComplete}
        />
      )}

      <TouchJoystick onMove={setJoystickVec} />

      <MiniMap
        playerPos={playerPos}
        visitedBuildings={new Set(progress.visitedBuildings)}
        nearBuildingId={nearBuildingId}
      />

      <BGMPlayer audioUrl="/school-3d/bgm.mp3" />

      {showTutorial && <TutorialOverlay onDismiss={handleDismissTutorial} />}
      {showStickerBook && <StickerBook progress={progress} onClose={() => setShowStickerBook(false)} />}

      <StickerToasts toasts={stickerToasts} />
    </div>
  );
}

// ── Sticker toasts ─────────────────────────────────────────
function StickerToasts({ toasts }: { toasts: StickerToast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div style={toastWrapStyle}>
      {toasts.map((t, i) => {
        const s = getSticker(t.stickerId);
        if (!s) return null;
        return (
          <div key={t.id} style={{ ...toastStyle, top: 8 + i * 70 }}>
            <div style={{ ...toastIconStyle, background: s.color }}>{s.emoji}</div>
            <div>
              <div style={toastTitleStyle}>+ Sticker!</div>
              <div style={toastSubStyle}>{s.name}</div>
            </div>
          </div>
        );
      })}
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
                boxShadow: selected === c.color ? '0 0 0 4px #5C4128' : 'none',
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
        <p style={{ marginTop: 12, fontSize: 13, color: '#5C4128', opacity: 0.75 }}>
          Explore 12 buildings around the courtyard · WASD to move · E to enter
        </p>
      </div>
    </div>
  );
}

const kbd = {
  display: 'inline-block',
  padding: '1px 7px',
  background: '#F5E6CA',
  border: '2px solid #5C4128',
  borderRadius: 5,
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  color: '#2D1B00',
  boxShadow: '0 2px 0 #5C4128',
};
const kbdBig = { ...kbd, padding: '3px 10px', fontSize: 16 };

const hudStyles = {
  header: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(245, 230, 202, 0.95)',
    borderBottom: '3px solid #D9B082',
    padding: '8px 16px',
    fontFamily: 'Fredoka, sans-serif',
    zIndex: 10,
  },
  backLink: { fontSize: 14, fontWeight: 600, color: '#5C4128', textDecoration: 'none' },
  progressChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(92, 65, 40, 0.08)',
    border: '2px solid #D9B082',
    borderRadius: 999,
    padding: '4px 14px',
    fontSize: 13, fontWeight: 700, color: '#5C4128',
  },
  progressItem: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  progressIcon: { fontSize: 14 },
  progressSep: { opacity: 0.5, margin: '0 2px' },
  rightGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  stickerBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 14, fontWeight: 700,
    background: '#FAF1DE',
    border: '2px solid #D9B082',
    borderRadius: 10, padding: '4px 10px',
    cursor: 'pointer', color: '#5C4128',
    fontFamily: 'Fredoka, sans-serif',
  },
  stickerCount: {
    fontSize: 11, fontWeight: 700,
    background: '#7A9B6E', color: '#FAF1DE',
    borderRadius: 999, padding: '1px 7px',
    minWidth: 18, textAlign: 'center' as const,
  },
  exitBtn: {
    fontSize: 13, fontWeight: 600,
    background: 'none', border: '2px solid #C9A982',
    borderRadius: 10, padding: '4px 12px',
    cursor: 'pointer', color: '#5C4128',
    fontFamily: 'Fredoka, sans-serif',
  },
  controls: {
    position: 'absolute' as const,
    bottom: 16, left: 16,
    background: 'rgba(245, 230, 202, 0.92)',
    border: '2px solid #D9B082',
    borderRadius: 12,
    padding: '8px 14px',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 12,
    color: '#5C4128',
    zIndex: 9,
    maxWidth: 'calc(100vw - 220px)',
  },
  // Door prompt pushed down so it doesn't collide with the QuestTracker strip.
  doorPrompt: {
    position: 'absolute' as const,
    top: 130, left: '50%',
    transform: 'translateX(-50%)',
    background: '#F5E6CA',
    border: '3px solid #D9B082',
    borderRadius: 16,
    padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
    fontFamily: 'Fredoka, sans-serif',
    color: '#2D1B00',
    zIndex: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  enterBtn: {
    background: '#C99B96',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    boxShadow: '0 3px 0 #8B5A3C',
  },
};

const toastWrapStyle: React.CSSProperties = {
  position: 'fixed',
  top: 64, right: 16,
  zIndex: 220,
  display: 'flex', flexDirection: 'column', gap: 8,
  fontFamily: 'Fredoka, sans-serif',
  pointerEvents: 'none',
};

const toastStyle: React.CSSProperties = {
  position: 'absolute', right: 0,
  display: 'flex', alignItems: 'center', gap: 10,
  background: '#FAF1DE',
  border: '2px solid #D9B082',
  borderRadius: 14,
  padding: '10px 14px',
  boxShadow: '0 8px 24px rgba(92, 65, 40, 0.25)',
  minWidth: 200,
  animation: 'slideIn 0.35s ease',
};

const toastIconStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 22,
  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5)',
  flexShrink: 0,
};

const toastTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#A04F3F',
};

const toastSubStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#2D1B00',
};

const pickerStyles = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F5E6CA, #E8D4B0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Fredoka, sans-serif', padding: 24,
  },
  card: {
    background: '#FAF1DE', borderRadius: 28,
    padding: '40px 36px', textAlign: 'center' as const,
    boxShadow: '0 8px 40px rgba(92, 65, 40, 0.18)', border: '3px solid #D9B082',
    maxWidth: 380, width: '100%',
  },
  mascot: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, color: '#A04F3F', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#5C4128', marginBottom: 24 },
  colorRow: {
    display: 'flex', justifyContent: 'center', gap: 14,
    marginBottom: 28, flexWrap: 'wrap' as const,
  },
  colorBtn: {
    width: 52, height: 52, borderRadius: '50%',
    border: '3px solid #FAF1DE', cursor: 'pointer',
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
  previewLabel: { fontSize: 13, color: '#5C4128', fontWeight: 600 },
  goBtn: {
    background: '#C99B96', color: 'white',
    border: 'none', borderRadius: 16,
    padding: '16px 36px', fontSize: 20, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
    boxShadow: '0 4px 0 #8B5A3C',
  },
};
