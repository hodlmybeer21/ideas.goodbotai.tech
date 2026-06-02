// @ts-nocheck
'use client';

declare global {
  interface Window {
    __schoolGame?: unknown;
    __schoolMarkComplete?: (room: string) => void;
  }
}

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import DrawingCanvas from '../components/DrawingCanvas';
import StoryMachine from '../components/StoryMachine';
import AnimalMatch from '../components/AnimalMatch';
import SoundLab from '../components/SoundLab';
import MathLab from '../components/MathLab';
import MadLibs from '../components/MadLibs';
import EqualParts from '../components/EqualParts';
import SyllableScooper from '../components/SyllableScooper';
import ReadAlong from '../components/ReadAlong';
import TellTime from '../components/TellTime';
import CodeBots from '../components/CodeBots';
import BossyRRacer from '../components/BossyRRacer';
import CoinChallenge from '../components/CoinChallenge';
import PlantLifeCycle from '../components/PlantLifeCycle';
import SentenceFixer from '../components/SentenceFixer';
import BasewordSorter from '../components/BasewordSorter';
import PluralBuilder from '../components/PluralBuilder';
import CharacterTraits from '../components/CharacterTraits';
import StoryQA from '../components/StoryQA';
import TrueFalse from '../components/TrueFalse';
import IsTheRobotRight from '../components/IsTheRobotRight';
import StateFinder from '../components/StateFinder';
import ColorLab from '../components/ColorLab';
import PixelCanvas from '../components/PixelCanvas';
import TensOnesExplorer from '../components/TensOnesExplorer';

const PLAYER_COLORS = [
  { color: '#FF6B9D', label: 'Pink', emoji: '🩷' },
  { color: '#6BCBFF', label: 'Blue', emoji: '💙' },
  { color: '#6BCB77', label: 'Green', emoji: '💚' },
  { color: '#FFD93D', label: 'Yellow', emoji: '💛' },
  { color: '#C084FC', label: 'Purple', emoji: '💜' },
  { color: '#FF9F43', label: 'Orange', emoji: '🧡' },
];

export default function SchoolPage() {
  const [phase, setPhase]         = useState('picker'); // 'picker' | 'game'
  const [playerColor, setPlayerColor] = useState(PLAYER_COLORS[0].color);
  const [activeActivity, setActiveActivity] = useState(null); // { room, activity }
  const [showCelebrate, setShowCelebrate] = useState(false);
  const phaserRef = useRef(null);

  // Bootstrap Phaser once in game phase
  useEffect(() => {
    if (phase !== 'game') return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    const init = () => {
      // Inject player color before loading game.js
      sessionStorage.setItem('school_player_color', playerColor);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js';
      script.onload = () => {
        // Load game after Phaser is ready
        const gameScript = document.createElement('script');
        gameScript.src = '/school/game.js';
        gameScript.onload = () => {
          // Phaser attaches to window.__schoolGame
        };
        document.head.appendChild(gameScript);
      };
      document.head.appendChild(script);
    };

    init();

    return () => {
      if (window.__schoolGame) {
        (window.__schoolGame as { destroy: (b: boolean) => void }).destroy(true);
        window.__schoolGame = undefined;
      }
    };
  }, [phase]);

  // Listen for activity station clicks from Phaser
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveActivity((e as CustomEvent).detail);
    };
    window.addEventListener('school_activity', handler);
    return () => window.removeEventListener('school_activity', handler);
  }, []);

  // Handle activity completion (called by RatingWidget inside activities)
  const handleActivityDone = useCallback((room: string): void => {
    setActiveActivity(null);
    setShowCelebrate(true);
    if (window.__schoolMarkComplete) window.__schoolMarkComplete(room);
    setTimeout(() => setShowCelebrate(false), 3000);
  }, []);

  const startGame = (color) => {
    setPlayerColor(color);
    sessionStorage.setItem('school_player_color', color);
    setPhase('game');
  };

  // ── Picker Phase ────────────────────────────────────────────────────────
  if (phase === 'picker') {
    return <CharacterPicker onStart={startGame} colors={PLAYER_COLORS} />;
  }

  // ── Game Phase ──────────────────────────────────────────────────────────
  return (
    <div style={styles.gameShell}>
      {/* Header */}
      <div style={styles.header}>
        <Link href="/" style={styles.backLink}>← GoodBot Kids</Link>
        <span style={styles.headerTitle}>🏫 School Explorer</span>
        <button
          style={styles.exitBtn}
          onClick={() => setPhase('picker')}
        >
          🔄 New Character
        </button>
      </div>

      {/* Phaser canvas container */}
      <div id="phaser-container" ref={phaserRef} style={styles.phaserContainer} />

      {/* Activity Modal */}
      {activeActivity && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <span style={styles.modalIcon}>{activeActivity.activity?.icon}</span>
              <h2 style={styles.modalTitle}>{activeActivity.activity?.name}</h2>
              <button style={styles.modalClose} onClick={() => setActiveActivity(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <ActivityBridge
                component={activeActivity.activity?.component}
                onDone={() => handleActivityDone(activeActivity.room)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebrate && <CelebrationOverlay />}
    </div>
  );
}

// ── Character Picker ────────────────────────────────────────────────────────
function CharacterPicker({ onStart, colors }) {
  const [selected, setSelected] = useState(colors[0].color);

  return (
    <div style={pickerStyles.wrap}>
      <div style={pickerStyles.card}>
        <div style={pickerStyles.mascot}>🤖</div>
        <h1 style={pickerStyles.title}>School Explorer</h1>
        <p style={pickerStyles.subtitle}>Pick your character!</p>
        <div style={pickerStyles.colorRow}>
          {colors.map(c => (
            <button
              key={c.color}
              style={{
                ...pickerStyles.colorBtn,
                background: c.color,
                boxShadow: selected === c.color ? `0 0 0 4px #2D1B00` : 'none',
                transform: selected === c.color ? 'scale(1.15)' : 'scale(1)',
              }}
              onClick={() => setSelected(c.color)}
              title={c.label}
            />
          ))}
        </div>
        <div style={pickerStyles.preview}>
          <div style={{ ...pickerStyles.previewChar, background: selected }}>
            <span style={pickerStyles.previewEmoji}>😊</span>
          </div>
          <span style={pickerStyles.previewLabel}>You</span>
        </div>
        <button style={pickerStyles.goBtn} onClick={() => onStart(selected)}>
          Let's Go! →
        </button>
      </div>
    </div>
  );
}

// ── Activity Router ─────────────────────────────────────────────────────────
function ActivityBridge({ component, onDone }) {
  switch (component) {
    case 'colorlab':      return <ColorLab           onBack={onDone} />;
    case 'pixelcanvas_b': return <PixelCanvas        onBack={onDone} />;
    case 'mathlab':       return <MathLab           onBack={onDone} />;
    case 'syllable_b':    return <SyllableScooper   onBack={onDone} />;
    case 'madlibs':       return <MadLibs           onBack={onDone} />;
    case 'readalong':     return <ReadAlong         onBack={onDone} />;
    case 'animatch':      return <AnimalMatch       onBack={onDone} />;
    case 'storymachine':  return <StoryMachine      onBack={onDone} />;
    case 'sentencefixer': return <SentenceFixer     onBack={onDone} />;
    case 'basewordsorter':return <BasewordSorter     onBack={onDone} />;
    case 'pluralbuilder': return <PluralBuilder     onBack={onDone} />;
    case 'characterraits':return <CharacterTraits    onBack={onDone} />;
    case 'storyqa':       return <StoryQA           onBack={onDone} />;
    case 'equalparts':    return <EqualParts        onBack={onDone} />;
    case 'tensonesexplorer': return <TensOnesExplorer onBack={onDone} />;
    case 'coinchallenge': return <CoinChallenge      onBack={onDone} />;
    case 'telltime':      return <TellTime          onBack={onDone} />;
    case 'codebots':      return <CodeBots          onBack={onDone} />;
    case 'bossyr':        return <BossyRRacer       onBack={onDone} />;
    case 'soundlab':      return <SoundLab          onBack={onDone} />;
    case 'plantcycle':    return <PlantLifeCycle    onBack={onDone} />;
    case 'statefinder':   return <StateFinder       onBack={onDone} />;
    case 'truefalse':     return <TrueFalse         onBack={onDone} />;
    case 'istherobotright': return <IsTheRobotRight onBack={onDone} />;
    case 'drawingcanvas': return <DrawingCanvas     onBack={onDone} />;
    case 'wordsearch':
    case 'vocabventure':
    case 'mathrace':
    case 'readingrace':
      return <div style={{ padding: 32, textAlign: 'center' }}>
        <p>Coming soon! 🎉</p>
        <button style={cancelBtn} onClick={onDone}>Back to Map</button>
      </div>;
    default:
      return <div style={{ padding: 32, textAlign: 'center' }}>
        <p>Coming soon! 🎉</p>
        <button style={cancelBtn} onClick={onDone}>Back to Map</button>
      </div>;
  }
}

// ── Celebration Overlay ────────────────────────────────────────────────────
function CelebrationOverlay() {
  const emojis = ['🎉', '⭐', '🌟', '💪', '🎊'];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
  }));

  return (
    <div style={celebrateStyles.overlay}>
      <div style={celebrateStyles.banner}>
        <span style={celebrateStyles.emoji}>🎉</span>
        <h2 style={celebrateStyles.heading}>Great Job!</h2>
        <p style={celebrateStyles.sub}>You completed the activity!</p>
      </div>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            ...celebrateStyles.confetti,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  gameShell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#D4C4A8',
    fontFamily: 'Fredoka, sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'white',
    borderBottom: '3px solid #FFD93D',
    padding: '8px 16px',
    flexShrink: 0,
    zIndex: 10,
  },
  backLink: {
    fontSize: 14,
    fontWeight: 600,
    color: '#5C4033',
    textDecoration: 'none',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FF6B9D',
  },
  exitBtn: {
    fontSize: 13,
    fontWeight: 600,
    background: 'none',
    border: '2px solid #E5E0D8',
    borderRadius: 10,
    padding: '4px 12px',
    cursor: 'pointer',
    color: '#5C4033',
  },
  phaserContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 16,
  },
  modal: {
    background: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderBottom: '3px solid #FFD93D',
    flexShrink: 0,
  },
  modalIcon: { fontSize: 32 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#2D1B00', flex: 1 },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#5C4033',
    padding: 4,
  },
  modalBody: {
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
};

const pickerStyles = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFF8F0, #FFF0E4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Fredoka, sans-serif',
    padding: 24,
  },
  card: {
    background: 'white',
    borderRadius: 28,
    padding: '40px 36px',
    textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
    border: '3px solid #FFD93D',
    maxWidth: 380,
    width: '100%',
  },
  mascot: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, color: '#FF6B9D', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#5C4033', marginBottom: 24 },
  colorRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  colorBtn: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: '3px solid white',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  previewChar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  previewEmoji: { fontSize: 36 },
  previewLabel: { fontSize: 13, color: '#5C4033', fontWeight: 600 },
  goBtn: {
    background: '#FF6B9D',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '16px 36px',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    boxShadow: '0 4px 0 #CC3366',
  },
};

const cancelBtn = {
  background: '#E5E0D8',
  color: '#5C4033',
  border: 'none',
  borderRadius: 12,
  padding: '10px 24px',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'Fredoka, sans-serif',
  marginTop: 16,
};

const celebrateStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(255,248,240,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    flexDirection: 'column',
    gap: 16,
  },
  banner: {
    textAlign: 'center',
    animation: 'pop 0.5s ease',
  },
  emoji: { fontSize: 80, display: 'block', marginBottom: 8 },
  heading: { fontSize: 36, fontWeight: 700, color: '#FF6B9D', marginBottom: 4 },
  sub: { fontSize: 18, color: '#5C4033' },
  confetti: {
    position: 'absolute',
    fontSize: 28,
    animation: 'confetti-fall 2s ease-in forwards',
    pointerEvents: 'none',
  },
};