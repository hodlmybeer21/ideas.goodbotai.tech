'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DrawingCanvas from './components/DrawingCanvas';
import StoryMachine from './components/StoryMachine';
import CodeBots from './components/CodeBots';
import AnimalMatch from './components/AnimalMatch';
import SoundLab from './components/SoundLab';
import MathLab from './components/MathLab';
import MadLibs from './components/MadLibs';
import EqualParts from './components/EqualParts';
import SyllableScooper from './components/SyllableScooper';
import ReadAlong from './components/ReadAlong';
import TellTime from './components/TellTime';
import IsTheRobotRight from './components/IsTheRobotRight';
import TrueFalse from './components/TrueFalse';
import SentenceBuilder from './components/SentenceBuilder';
import StateFinder from './components/StateFinder';
import PluralBuilder from './components/PluralBuilder';
import BasewordSorter from './components/BasewordSorter';
import PixelCanvas from './components/PixelCanvas';
import ColorLab from './components/ColorLab';
import TensOnesExplorer from './components/TensOnesExplorer';
import BossyRRacer from './components/BossyRRacer';
import CoinChallenge from './components/CoinChallenge';
import StoryQA from './components/StoryQA';
import SentenceFixer from './components/SentenceFixer';
import PlantLifeCycle from './components/PlantLifeCycle';
import BugCatcher from './components/BugCatcher';
import BunnyHop from './components/BunnyHop';
import PhotoFrameMaker from './components/PhotoFrameMaker';
import MirrorDraw from './components/MirrorDraw';
import NumberBingo from './components/NumberBingo';
import BeatComposer from './components/BeatComposer';
import DotsAndBoxes from './components/DotsAndBoxes';
import TwoDigitSprint from './components/TwoDigitSprint';
import BorrowBay from './components/BorrowBay';
import TimeToFive from './components/TimeToFive';

type Grade = 1 | 2;
type View =
  | 'home' | 'draw' | 'story' | 'match' | 'sound' | 'math' | 'madlib' | 'readalong' | 'time'
  | 'robot' | 'truefalse' | 'sentence' | 'equal' | 'syllable' | 'codebots' | 'statefinder'
  | 'pixelstudio' | 'colorlab' | 'tensones' | 'bossyr' | 'coin' | 'storyqa' | 'sentfix'
  | 'plantcycle' | 'pluralbuilder' | 'basewordsorter' | 'bugcatcher' | 'bunnyhop'
  | 'photoframe' | 'mirrordraw' | 'numberbingo' | 'beatcomposer' | 'dotsandboxes'
  | 'twodigit' | 'borrowbay' | 'timeto5' | 'dashboard';

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [kidName, setKidName] = useState('');
  const [isWelcomed, setIsWelcomed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Default to Grade 1 so existing users / younger siblings keep their games visible on first load.
  const [activeGrade, setActiveGrade] = useState<Grade>(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('goodbotkids_name');
      if (saved) {
        setKidName(saved);
        setIsWelcomed(true);
      }
      const savedGrade = localStorage.getItem('goodbotkids_grade');
      if (savedGrade === '2') setActiveGrade(2);
    } catch {}
  }, []);

  const handleWelcome = (name: string) => {
    try { localStorage.setItem('goodbotkids_name', name); } catch {}
    setKidName(name);
    setIsWelcomed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleNameReset = () => {
    try { localStorage.removeItem('goodbotkids_name'); } catch {}
    setKidName('');
    setIsWelcomed(false);
  };

  if (!isWelcomed) {
    return <WelcomeScreen onEnter={handleWelcome} />;
  }

  if (showConfetti) {
    <Confetti />;
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <header className="app-header">
        <div className="app-logo">
          <span>🤖</span>
          <span>GoodBot Kids</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="app-greeting">Hi, {kidName}! 👋</span>
          <button onClick={handleNameReset} style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            Change name
          </button>
          <Link href="/dashboard" className="parent-link">👨‍👩‍👧 Parent</Link>
        </div>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <HomeScreen
            setView={setView}
            kidName={kidName}
            activeGrade={activeGrade}
            onGradeChange={setActiveGrade}
          />
        )}
        {view === 'draw' && <DrawingCanvas onBack={() => setView('home')} kidName={kidName} />}
        {view === 'story' && <StoryMachine kidName={kidName} onBack={() => setView('home')} />}
        {view === 'match' && <AnimalMatch onBack={() => setView('home')} kidName={kidName} />}
        {view === 'sound' && <SoundLab onBack={() => setView('home')} kidName={kidName} />}
        {view === 'math' && <MathLab onBack={() => setView('home')} kidName={kidName} />}
        {view === 'madlib' && <MadLibs onBack={() => setView('home')} kidName={kidName} />}
        {view === 'readalong' && <ReadAlong onBack={() => setView('home')} kidName={kidName} />}
        {view === 'time' && <TellTime onBack={() => setView('home')} kidName={kidName} />}
        {view === 'robot' && <IsTheRobotRight onBack={() => setView('home')} kidName={kidName} />}
        {view === 'truefalse' && <TrueFalse onBack={() => setView('home')} kidName={kidName} />}
        {view === 'sentence' && <SentenceBuilder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'equal' && <EqualParts />}
        {view === 'syllable' && <SyllableScooper />}
        {view === 'codebots' && <CodeBots onBack={() => setView('home')} kidName={kidName} />}
        {view === 'statefinder' && <StateFinder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'pixelstudio' && <PixelCanvas onBack={() => setView('home')} />}
        {view === 'colorlab' && <ColorLab onBack={() => setView('home')} />}
        {view === 'tensones' && <TensOnesExplorer onBack={() => setView('home')} />}
        {view === 'bossyr' && <BossyRRacer onBack={() => setView('home')} />}
        {view === 'coin' && <CoinChallenge onBack={() => setView('home')} />}
        {view === 'storyqa' && <StoryQA onBack={() => setView('home')} />}
        {view === 'sentfix' && <SentenceFixer onBack={() => setView('home')} />}
        {view === 'plantcycle' && <PlantLifeCycle onBack={() => setView('home')} />}
        {view === 'pluralbuilder' && <PluralBuilder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'basewordsorter' && <BasewordSorter onBack={() => setView('home')} kidName={kidName} />}
        {view === 'bugcatcher' && <BugCatcher onBack={() => setView('home')} kidName={kidName} />}
        {view === 'bunnyhop' && <BunnyHop onBack={() => setView('home')} kidName={kidName} />}
        {view === 'photoframe' && <PhotoFrameMaker onBack={() => setView('home')} kidName={kidName} />}
        {view === 'mirrordraw' && <MirrorDraw onBack={() => setView('home')} kidName={kidName} />}
        {view === 'numberbingo' && <NumberBingo onBack={() => setView('home')} kidName={kidName} />}
        {view === 'beatcomposer' && <BeatComposer onBack={() => setView('home')} kidName={kidName} />}
        {view === 'dotsandboxes' && <DotsAndBoxes onBack={() => setView('home')} kidName={kidName} />}
        {view === 'twodigit' && <TwoDigitSprint onBack={() => setView('home')} kidName={kidName} />}
        {view === 'borrowbay' && <BorrowBay onBack={() => setView('home')} kidName={kidName} />}
        {view === 'timeto5' && <TimeToFive onBack={() => setView('home')} kidName={kidName} />}
      </main>
    </>
  );
}

function WelcomeScreen({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) onEnter(name.trim());
  };

  const emojis = ['🌈', '🚀', '🦄', '⭐', '🎨', '🎮', '🐱', '🐶', '🦊', '🐸'];

  return (
    <div className="welcome-overlay slide-up">
      <div className="welcome-mascot">🤖</div>
      <h1 className="welcome-title">Welcome to GoodBot Kids!</h1>
      <p className="welcome-subtitle">What should I call you?</p>
      <form className="welcome-form" onSubmit={handleSubmit}>
        <input
          className="welcome-input"
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={name.trim().length < 2}>
          Let's go! →
        </button>
      </form>
      <div style={{ display: 'flex', gap: 12, fontSize: 32, opacity: 0.6 }}>
        {emojis.map(e => <span key={e}>{e}</span>)}
      </div>
    </div>
  );
}

interface Activity {
  id: View;
  icon: string;
  name: string;
  desc: string;
  color: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
  grade: Grade;
}

const ACTIVITIES: Activity[] = [
  { id: 'draw', icon: '🎨', name: 'Magic Canvas', desc: 'Draw anything you imagine!', color: 'pink', grade: 1 },
  { id: 'story', icon: '📖', name: 'Story Machine', desc: 'Your very own bedtime story', color: 'purple', grade: 1 },
  { id: 'match', icon: '🧩', name: 'Animal Match', desc: 'Find the matching pairs!', color: 'yellow', grade: 1 },
  { id: 'sound', icon: '🎵', name: 'Sound Lab', desc: 'Play instruments and make music!', color: 'orange', grade: 1 },
  { id: 'math', icon: '🧮', name: 'Math Lab', desc: 'Learn math with fun games!', color: 'pink', grade: 1 },
  { id: 'madlib', icon: '📝', name: 'Mad Libs', desc: 'Fill in the blanks for silly stories!', color: 'yellow', grade: 1 },
  { id: 'readalong', icon: '📖', name: 'Read Along', desc: 'Slide across words to read!', color: 'purple', grade: 1 },
  { id: 'time', icon: '🕐', name: 'Tell Time', desc: 'Learn to read the clock!', color: 'blue', grade: 1 },
  { id: 'robot', icon: '🤖', name: 'Is the Robot Right?', desc: 'Is the robot correct or silly?', color: 'purple', grade: 1 },
  { id: 'truefalse', icon: '✅❌', name: 'True or False?', desc: 'Is the statement true or false?', color: 'green', grade: 1 },
  { id: 'sentence', icon: '📝', name: 'Sentence Builder', desc: 'Fill in the missing word!', color: 'yellow', grade: 1 },
  { id: 'equal', icon: '🔴', name: 'Equal Parts', desc: 'Learn about halves and quarters!', color: 'purple', grade: 1 },
  { id: 'syllable', icon: '🔤', name: 'Syllable Scooper', desc: 'Practice breaking words into syllables!', color: 'indigo', grade: 1 },
  { id: 'codebots', icon: '🤖', name: 'CodeBots', desc: 'Program your robot to reach the star!', color: 'blue', grade: 1 },
  { id: 'statefinder', icon: '🗺️', name: 'State Finder', desc: 'Learn the US map one region at a time!', color: 'green', grade: 1 },
  { id: 'pixelstudio', icon: '🎨', name: 'Pixel Studio', desc: 'Color pixel art templates and make masterpieces!', color: 'pink', grade: 1 },
  { id: 'colorlab', icon: '🧪', name: 'Color Lab', desc: 'Mix primary colors and discover new ones!', color: 'blue', grade: 1 },
  { id: 'tensones', icon: '🔢', name: 'Tens & Ones', desc: 'Explore place value with base-10 blocks!', color: 'pink', grade: 1 },
  { id: 'bossyr', icon: '🏎️', name: 'Bossy R Racer', desc: 'Master bossy R words with a race!', color: 'orange', grade: 1 },
  { id: 'coin', icon: '💰', name: 'Coin Challenge', desc: 'Count coins and make change!', color: 'yellow', grade: 1 },
  { id: 'storyqa', icon: '📚', name: 'Story Q&A', desc: 'Read stories and answer questions!', color: 'purple', grade: 1 },
  { id: 'sentfix', icon: '🔧', name: 'Sentence Fixer', desc: 'Find and fix mistakes in sentences!', color: 'green', grade: 1 },
  { id: 'plantcycle', icon: '🌱', name: 'Plant Life Cycle', desc: 'Watch a seed grow into a plant!', color: 'green', grade: 1 },
  { id: 'pluralbuilder', icon: '📝', name: 'Plural Builder', desc: 'Pick the right suffix -s or -es!', color: 'indigo', grade: 1 },
  { id: 'basewordsorter', icon: '🗂️', name: 'Baseword Sorter', desc: 'Sort words into the right bucket!', color: 'blue', grade: 1 },
  { id: 'bugcatcher', icon: '🐛', name: 'Bug Catcher', desc: 'Catch the right sight-word firefly!', color: 'blue', grade: 1 },
  { id: 'bunnyhop', icon: '🐰', name: 'Bunny Hop Counting', desc: 'Hop the bunny to the target number!', color: 'orange', grade: 1 },
  { id: 'photoframe', icon: '🖼️', name: 'Photo Frame Maker', desc: 'Draw, name, and frame your art!', color: 'purple', grade: 1 },
  { id: 'mirrordraw', icon: '🪞', name: 'Mirror Draw', desc: 'Trace shapes by mirroring your strokes!', color: 'blue', grade: 1 },
  { id: 'numberbingo', icon: '🎯', name: 'Number Bingo', desc: 'Listen, match, and call BINGO!', color: 'green', grade: 1 },
  { id: 'beatcomposer', icon: '🎵', name: 'Beat Composer', desc: 'Build your own beats and songs!', color: 'orange', grade: 1 },
  { id: 'dotsandboxes', icon: '📦', name: 'Dots & Boxes', desc: 'Draw lines, claim boxes, win!', color: 'blue', grade: 1 },
  // 2nd Grade — added for back-to-school 2026
  { id: 'twodigit', icon: '🏃', name: 'Two-Digit Sprint', desc: 'Add big numbers with carrying!', color: 'pink', grade: 2 },
  { id: 'borrowbay', icon: '🏴‍☠️', name: 'Borrow Bay', desc: 'Subtract and borrow pirate gold!', color: 'orange', grade: 2 },
  { id: 'timeto5', icon: '⏰', name: 'Time to 5', desc: 'Read clocks to the nearest 5 minutes!', color: 'blue', grade: 2 },
];

function GradeTabs({
  active, onChange, g1Count, g2Count,
}: {
  active: Grade; onChange: (g: Grade) => void; g1Count: number; g2Count: number;
}) {
  const tabBase: React.CSSProperties = {
    flex: 1,
    fontSize: 15,
    padding: '12px 14px',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    fontWeight: 600,
    transition: 'transform 0.1s, background 0.2s, color 0.2s',
  };
  return (
    <div
      role="tablist"
      aria-label="Grade level"
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 18,
        background: 'white',
        padding: 6,
        borderRadius: 18,
        boxShadow: 'var(--shadow)',
        border: '3px solid #E5E0D8',
      }}
    >
      <button
        role="tab"
        aria-selected={active === 1}
        onClick={() => {
          onChange(1);
          try { localStorage.setItem('goodbotkids_grade', '1'); } catch {}
        }}
        className={`activity-card ${active === 1 ? 'green' : ''}`}
        style={{
          ...tabBase,
          background: active === 1 ? 'var(--accent-green)' : 'transparent',
          color: active === 1 ? 'white' : 'var(--text-medium)',
          boxShadow: active === 1 ? '0 4px 0 #3D8B47' : 'none',
          opacity: active === 1 ? 1 : 0.85,
        }}
      >
        🟢 1st Grade <span style={{ fontSize: 12, opacity: 0.85 }}>({g1Count})</span>
      </button>
      <button
        role="tab"
        aria-selected={active === 2}
        onClick={() => {
          onChange(2);
          try { localStorage.setItem('goodbotkids_grade', '2'); } catch {}
        }}
        className={`activity-card ${active === 2 ? 'blue' : ''}`}
        style={{
          ...tabBase,
          background: active === 2 ? 'var(--accent-blue)' : 'transparent',
          color: active === 2 ? 'white' : 'var(--text-medium)',
          boxShadow: active === 2 ? '0 4px 0 #2299CC' : 'none',
          opacity: active === 2 ? 1 : 0.85,
        }}
      >
        🔵 2nd Grade <span style={{ fontSize: 12, opacity: 0.85 }}>({g2Count})</span>
      </button>
    </div>
  );
}

function HomeScreen({
  setView, kidName, activeGrade, onGradeChange,
}: {
  setView: (v: View) => void;
  kidName: string;
  activeGrade: Grade;
  onGradeChange: (g: Grade) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const g1Count = ACTIVITIES.filter(a => a.grade === 1).length;
  const g2Count = ACTIVITIES.filter(a => a.grade === 2).length;
  const visible = ACTIVITIES.filter(a => a.grade === activeGrade);

  return (
    <div className="slide-up">
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-pink)' }}>
        {greeting}, {kidName}! 👋
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-medium)', marginTop: 4, marginBottom: 12 }}>
        What would you like to do today?
      </p>

      <GradeTabs active={activeGrade} onChange={onGradeChange} g1Count={g1Count} g2Count={g2Count} />

      <div className="activity-grid">
        {visible.map(a => (
          <button
            key={a.id}
            className={`activity-card ${a.color}`}
            onClick={() => setView(a.id)}
            data-grade={a.grade}
          >
            <span className="activity-icon">{a.icon}</span>
            <span className="activity-name">{a.name}</span>
            <span className="activity-desc">{a.desc}</span>
            {a.grade === 2 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'var(--accent-blue)', color: 'white',
                padding: '3px 10px', borderRadius: 999, marginTop: 4,
              }}>NEW · 2nd</span>
            )}
          </button>
        ))}
      </div>

      {activeGrade === 1 && g2Count > 0 && (
        <div style={{
          textAlign: 'center', marginTop: 28,
          padding: 16, background: 'white',
          borderRadius: 16, border: '2px dashed var(--accent-blue)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-medium)', margin: 0 }}>
            🆕 Ready for a challenge? Try{' '}
            <button
              onClick={() => onGradeChange(2)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent-blue)', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              2nd Grade games
            </button>!
          </p>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 2}s`,
    size: Math.random() * 8 + 8,
  }));

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size * 2,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
