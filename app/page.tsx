'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DrawingCanvas from './components/DrawingCanvas';
import StoryMachine from './components/StoryMachine';
import AnimalMatch from './components/AnimalMatch';
import SoundLab from './components/SoundLab';
import MathLab from './components/MathLab';

type View = 'home' | 'draw' | 'story' | 'match' | 'sound' | 'math' | 'dashboard';

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
