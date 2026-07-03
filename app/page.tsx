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


type View = 'home' | 'draw' | 'story' | 'match' | 'sound' | 'math' | 'madlib' | 'readalong' | 'time' | 'robot' | 'truefalse' | 'sentence' | 'equal' | 'syllable' | 'codebots' | 'statefinder' | 'pixelstudio' | 'colorlab' | 'tensones' | 'bossyr' | 'coin' | 'storyqa' | 'sentfix' | 'plantcycle' | 'pluralbuilder' | 'basewordsorter' | 'bugcatcher' | 'bunnyhop' | 'dashboard';

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [kidName, setKidName] = useState('');
  const [isWelcomed, setIsWelcomed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('goodbotkids_name');
    if (saved) {
      setKidName(saved);
      setIsWelcomed(true);
    }
  }, []);

  const handleWelcome = (name: string) => {
    localStorage.setItem('goodbotkids_name', name);
    setKidName(name);
    setIsWelcomed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleNameReset = () => {
    localStorage.removeItem('goodbotkids_name');
    setKidName('');
    setIsWelcomed(false);
  };

  // Welcome screen
  if (!isWelcomed) {
    return <WelcomeScreen onEnter={handleWelcome} />;
  }

  // Show confetti
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
        {view === 'home' && <HomeScreen setView={setView} kidName={kidName} />}
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
        {view === 'pixelstudio' && <PixelCanvas onBack={() => setView('home')} kidName={kidName} />}
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

function HomeScreen({ setView, kidName }: { setView: (v: View) => void; kidName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activities = [
    { id: 'draw' as View, icon: '🎨', name: 'Magic Canvas', desc: 'Draw anything you imagine!', color: 'pink' },
    { id: 'story' as View, icon: '📖', name: 'Story Machine', desc: 'Your very own bedtime story', color: 'purple' },
    { id: 'match' as View, icon: '🧩', name: 'Animal Match', desc: 'Find the matching pairs!', color: 'yellow' },
    { id: 'sound' as View, icon: '🎵', name: 'Sound Lab', desc: 'Play instruments and make music!', color: 'orange' },
    { id: 'math' as View, icon: '🧮', name: 'Math Lab', desc: 'Learn math with fun games!', color: 'pink' },
    { id: 'madlib' as View, icon: '📝', name: 'Mad Libs', desc: 'Fill in the blanks for silly stories!', color: 'yellow' },
    { id: 'readalong' as View, icon: '📖', name: 'Read Along', desc: 'Slide across words to read!', color: 'purple' },
    { id: 'time' as View, icon: '🕐', name: 'Tell Time', desc: 'Learn to read the clock!', color: 'blue' },
    { id: 'robot' as View, icon: '🤖', name: 'Is the Robot Right?', desc: 'Is the robot correct or silly?', color: 'purple' },
    { id: 'truefalse' as View, icon: '✅❌', name: 'True or False?', desc: 'Is the statement true or false?', color: 'green' },
    { id: 'sentence' as View, icon: '📝', name: 'Sentence Builder', desc: 'Fill in the missing word!', color: 'yellow' },
    { id: 'equal' as View, icon: '🔴', name: 'Equal Parts', desc: 'Learn about halves and quarters!', color: 'purple' },
    { id: 'syllable' as View, icon: '🔤', name: 'Syllable Scooper', desc: 'Practice breaking words into syllables!', color: 'indigo' },
    { id: 'codebots' as View, icon: '🤖', name: 'CodeBots', desc: 'Program your robot to reach the star!', color: 'blue' },
    { id: 'statefinder' as View, icon: '🗺️', name: 'State Finder', desc: 'Learn the US map one region at a time!', color: 'green' },
    { id: 'pixelstudio' as View, icon: '🎨', name: 'Pixel Studio', desc: 'Color pixel art templates and make masterpieces!', color: 'pink' },
    { id: 'colorlab' as View, icon: '🧪', name: 'Color Lab', desc: 'Mix primary colors and discover new ones!', color: 'blue' },
    { id: 'tensones' as View, icon: '🔢', name: 'Tens & Ones', desc: 'Explore place value with base-10 blocks!', color: 'pink' },
    { id: 'bossyr' as View, icon: '🏎️', name: 'Bossy R Racer', desc: 'Master bossy R words with a race!', color: 'orange' },
    { id: 'coin' as View, icon: '💰', name: 'Coin Challenge', desc: 'Count coins and make change!', color: 'yellow' },
    { id: 'storyqa' as View, icon: '📚', name: 'Story Q&A', desc: 'Read stories and answer questions!', color: 'purple' },
    { id: 'sentfix' as View, icon: '🔧', name: 'Sentence Fixer', desc: 'Find and fix mistakes in sentences!', color: 'green' },
    { id: 'plantcycle' as View, icon: '🌱', name: 'Plant Life Cycle', desc: 'Watch a seed grow into a plant!', color: 'green' },
    { id: 'pluralbuilder' as View, icon: '📝', name: 'Plural Builder', desc: 'Pick the right suffix -s or -es!', color: 'indigo' },
    { id: 'basewordsorter' as View, icon: '🗂️', name: 'Baseword Sorter', desc: 'Sort words into the right bucket!', color: 'blue' },
    { id: 'bugcatcher' as View, icon: '🐛', name: 'Bug Catcher', desc: 'Catch the right sight-word firefly!', color: 'blue' },
    { id: 'bunnyhop' as View, icon: '🐰', name: 'Bunny Hop Counting', desc: 'Hop the bunny to the target number!', color: 'orange' },

  ];

  return (
    <div className="slide-up">
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-pink)' }}>
        {greeting}, {kidName}! 👋
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-medium)', marginTop: 4, marginBottom: 8 }}>
        What would you like to do today?
      </p>

      <div className="activity-grid">
        {activities.map(a => (
          <button
            key={a.id}
            className={`activity-card ${a.color}`}
            onClick={() => setView(a.id)}
          >
            <span className="activity-icon">{a.icon}</span>
            <span className="activity-name">{a.name}</span>
            <span className="activity-desc">{a.desc}</span>
          </button>
        ))}
      </div>

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
