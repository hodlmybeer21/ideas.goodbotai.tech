'use client';

import { useState, useEffect, useCallback } from 'react';

interface Story {
  id: string;
  emoji: string;
  title: string;
  color: string;
  shadowColor: string;
  blanks: Blank[];
  text: string;
}

interface Blank {
  type: string;
  prompt: string;
}

interface WordEntry {
  word: string;
  blank: Blank;
}

// ── STORIES ────────────────────────────────────────────────────────
const STORIES: Story[] = [
  {
    id: 'beach',
    emoji: '🏖️',
    title: 'A Day at the Beach',
    color: '#6BCBFF',
    shadowColor: '#2299CC',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a boy's name!" },
      { type: 'ANIMAL', prompt: 'An animal!' },
      { type: 'FIRST NAME', prompt: 'Another name!' },
      { type: 'ADJECTIVE', prompt: 'A silly word describing something!' },
      { type: 'ADJECTIVE', prompt: 'Another describing word!' },
      { type: 'NUMBER', prompt: 'Pick a number!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'ADJECTIVE', prompt: 'One more describing word!' },
      { type: 'EXCLAMATION', prompt: 'A word you shout when surprised!' },
    ],
    text:
      "Today me and my friend {0} went to the beach. We brought our pet {1} named {2}! The water was {3} and the sand was so {4}. We collected {5} shells and ate {6} for lunch. Then we saw a {7} crab and shouted \"{8}!\" What a fun day at the beach!",
  },
  {
    id: 'space',
    emoji: '🚀',
    title: 'Space Adventure',
    color: '#C084FC',
    shadowColor: '#7C3AED',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a boy's name!" },
      { type: 'ADJECTIVE', prompt: 'A cool adjective!' },
      { type: 'NOUN', prompt: 'A thing!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'ADJECTIVE', prompt: 'A silly word!' },
      { type: 'NUMBER', prompt: 'Pick a big number!' },
      { type: 'PLANET', prompt: 'A planet or place in space!' },
      { type: 'EXCLAMATION', prompt: 'A word you shout when excited!' },
      { type: 'ANIMAL', prompt: 'A space animal (or an Earth one)!' },
    ],
    text:
      "Astronaut {0} zoomed through the {1} galaxy in a {2} spaceship. For lunch they ate {3} sandwiches and drank {4} space juice. They visited planet {5} and counted {6} stars. Suddenly they saw a {7} alien riding a {8} and shouted \"{8}!!!\"",
  },
  {
    id: 'dinosaur',
    emoji: '🦕',
    title: 'Dinosaur Park',
    color: '#6BCB77',
    shadowColor: '#3D8B47',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a boy's name!" },
      { type: 'DINO', prompt: 'A type of dinosaur!' },
      { type: 'ADJECTIVE', prompt: 'A silly word!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'ADJECTIVE', prompt: 'Another describing word!' },
      { type: 'NOUN', prompt: 'A silly thing!' },
      { type: 'NUMBER', prompt: 'Pick a number!' },
      { type: 'EXCLAMATION', prompt: 'A word you shout when surprised!' },
    ],
    text:
      "One sunny day, {0} went to Dinosaur Park. The biggest dinosaur was a {1} named Chompers! It was so {2} that it accidentally ate {3} for breakfast. Then it sneezed and {4} stuff flew everywhere! A tiny {5} ran past with {6} babies. Everyone shouted \"{7}!!!\"",
  },
  {
    id: 'birthday',
    emoji: '🎂',
    title: 'Birthday Party',
    color: '#FF6B9D',
    shadowColor: '#CC3366',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a friend's name!" },
      { type: 'ADJECTIVE', prompt: 'A fun adjective!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'ADJECTIVE', prompt: 'A silly word!' },
      { type: 'NOUN', prompt: 'Something silly!' },
      { type: 'ADJECTIVE', prompt: 'Another describing word!' },
      { type: 'ANIMAL', prompt: 'An animal!' },
      { type: 'EXCLAMATION', prompt: 'A word you shout when excited!' },
    ],
    text:
      "It was {0}'s birthday party! The room was decorated with {1} balloons and a giant {2} cake. Everyone wore {3} hats and danced to {4} music. Then the {5} showed up riding a {6} and everyone shouted \"{7}!!!\"",
  },
  {
    id: 'pirate',
    emoji: '🏴‍☠️',
    title: 'Pirate Treasure',
    color: '#FF9F43',
    shadowColor: '#CC6600',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a pirate's name!" },
      { type: 'ADJECTIVE', prompt: 'A cool adjective!' },
      { type: 'NOUN', prompt: 'A silly thing!' },
      { type: 'ANIMAL', prompt: 'An animal!' },
      { type: 'PLACE', prompt: 'A fun place!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'ADJECTIVE', prompt: 'A silly word!' },
      { type: 'EXCLAMATION', prompt: 'A pirate shout word!' },
      { type: 'NUMBER', prompt: 'Pick a number!' },
    ],
    text:
      "Captain {0} sailed the {1} seas looking for treasure. Their ship was made of {2} and sailed by a {3}. They buried the gold at {4} Island and celebrated with {5} rum! (Don't drink rum, that's for pirates!) Their parrot squawked \"{6}!!!\" They found {7} gold coins!",
  },
  {
    id: 'dragon',
    emoji: '🐉',
    title: 'Dragon Rescue',
    color: '#FFD93D',
    shadowColor: '#CC9900',
    blanks: [
      { type: 'FIRST NAME', prompt: "Give me a hero's name!" },
      { type: 'ADJECTIVE', prompt: 'A cool adjective!' },
      { type: 'ADJECTIVE', prompt: 'A silly word!' },
      { type: 'FOOD', prompt: 'Yummy food!' },
      { type: 'PLACE', prompt: 'A magical place!' },
      { type: 'NOUN', prompt: 'A magical thing!' },
      { type: 'ANIMAL', prompt: 'An animal!' },
      { type: 'EXCLAMATION', prompt: 'A word you shout when excited!' },
    ],
    text:
      "Brave hero {0} rode a {1} dragon to rescue a lost kitten. The dragon was {2} and very hungry — it ate {3} for breakfast! They flew over the {4} mountains and found a magic {5}. Then a tiny {6} appeared and said \"{7}!\"",
  },
];

// ── AUDIO ─────────────────────────────────────────────────────────
function playWordSubmit() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const tones = [330, 440];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.08);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.09);
    });
  } catch {}
}

function playStoryReveal() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.16);
    });
  } catch {}
}

function playError() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 180;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.31);
  } catch {}
}

// ── CONFETTI ───────────────────────────────────────────────────────
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43', '#FF8A65', '#80DEEA'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 0.8}s`,
    size: Math.random() * 10 + 8,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 300, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-20px',
            background: p.color,
            width: p.size,
            height: p.size * 2,
            borderRadius: 3,
            animation: `confetti-fall 2.5s ease-in forwards`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── COMPONENT ──────────────────────────────────────────────────────
export default function MadLibs({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  type Phase = 'picker' | 'input' | 'reveal';
  const [phase, setPhase] = useState<Phase>('picker');
  const [storyIndex, setStoryIndex] = useState(0);
  const [blankIndex, setBlankIndex] = useState(0);
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [storiesCompleted, setStoriesCompleted] = useState(0);

  const story = STORIES[storyIndex];
  const blanks = story.blanks;

  useEffect(() => {
    const saved = localStorage.getItem('goodbotkids_madlibs_count');
    if (saved) setStoriesCompleted(parseInt(saved));
  }, []);

  const saveCount = (n: number) => {
    setStoriesCompleted(n);
    localStorage.setItem('goodbotkids_madlibs_count', String(n));
  };

  const pickStory = (idx: number) => {
    setStoryIndex(idx);
    setBlankIndex(0);
    setEntries([]);
    setCurrentWord('');
    setError('');
    setPhase('input');
  };

  const submitWord = () => {
    const trimmed = currentWord.trim();
    if (!trimmed) {
      setError('Type a word first! ✍️');
      playError();
      return;
    }
    setError('');
    playWordSubmit();
    setEntries(prev => [...prev, { word: trimmed, blank: blanks[blankIndex] }]);
    setCurrentWord('');
    if (blankIndex + 1 < blanks.length) {
      setBlankIndex(prev => prev + 1);
    } else {
      setShowConfetti(true);
      playStoryReveal();
      setPhase('reveal');
      saveCount(storiesCompleted + 1);
      setTimeout(() => setShowConfetti(false), 2500);
    }
  };

  const replaySame = () => {
    setBlankIndex(0);
    setEntries([]);
    setCurrentWord('');
    setError('');
    setPhase('input');
  };

  const pickNew = () => {
    setStoryIndex((storyIndex + 1) % STORIES.length);
    setBlankIndex(0);
    setEntries([]);
    setCurrentWord('');
    setError('');
    setPhase('picker');
  };

  const fillStory = (text: string) => {
    let result = text;
    entries.forEach((e, i) => {
      result = result.replace(`{${i}}`, e.word);
    });
    return result;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitWord();
  };

  const currentBlank = blanks[blankIndex];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .slide-up { animation: slide-up 0.35s ease-out; }
        .pop { animation: pop 0.3s ease; }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <ConfettiBurst active={showConfetti} />

      <button onClick={onBack} className="back-btn">← Back</button>

      {/* TITLE */}
      <div className="page-title">
        <span>📝</span>
        <span>Mad Libs!</span>
        <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-medium)', marginLeft: 8 }}>
          {storiesCompleted > 0 ? `✨ ${storiesCompleted} story${storiesCompleted !== 1 ? 's' : ''} completed!` : 'Pick a story!'}
        </span>
      </div>

      {/* ── STORY PICKER ── */}
      {phase === 'picker' && (
        <div className="slide-up">
          <p style={{ fontSize: 16, color: 'var(--text-medium)', marginBottom: 20 }}>
            Hey {kidName}! Pick a story and fill in the blanks to make it silly! 🎭
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {STORIES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => pickStory(idx)}
                style={{
                  background: 'white',
                  border: `3px solid ${s.color}`,
                  borderRadius: 20,
                  padding: '20px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: `0 6px 0 ${s.shadowColor}`,
                  transition: 'transform 0.1s',
                  fontFamily: 'Fredoka, sans-serif',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'translateY(4px)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <span style={{ fontSize: 48 }}>{s.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)', textAlign: 'center' }}>{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── WORD INPUT ── */}
      {phase === 'input' && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Story chip */}
          <div style={{
            background: story.color + '22',
            border: `2px solid ${story.color}`,
            borderRadius: 16,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-dark)',
          }}>
            <span style={{ fontSize: 24 }}>{story.emoji}</span>
            <span>{story.title}</span>
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text-medium)' }}>
              <span>Word {blankIndex + 1} of {blanks.length}</span>
              <span>{Math.round(((blankIndex + 1) / blanks.length) * 100)}%</span>
            </div>
            <div style={{ background: '#E5E0D8', borderRadius: 10, height: 12, overflow: 'hidden' }}>
              <div style={{
                background: `linear-gradient(90deg, ${story.color}, ${story.color}cc)`,
                height: '100%',
                width: `${((blankIndex + 1) / blanks.length) * 100}%`,
                borderRadius: 10,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Current blank */}
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: `3px solid ${story.color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: story.color, textTransform: 'uppercase', letterSpacing: 1 }}>
              {currentBlank.type}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)' }}>
              {currentBlank.prompt}
            </div>
            <input
              autoFocus
              type="text"
              value={currentWord}
              onChange={e => { setCurrentWord(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Type your word here..."
              style={{
                padding: '16px 20px',
                fontSize: 22,
                fontFamily: 'Fredoka, sans-serif',
                border: `3px solid ${error ? '#FF6B9D' : '#E5E0D8'}`,
                borderRadius: 16,
                background: 'var(--bg-primary)',
                color: 'var(--text-dark)',
                outline: 'none',
                textAlign: 'center',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = story.color)}
              onBlur={e => (e.currentTarget.style.borderColor = error ? '#FF6B9D' : '#E5E0D8')}
            />
            {error && (
              <div style={{ color: '#FF6B9D', fontSize: 15, fontWeight: 600 }}>{error}</div>
            )}
            <button
              onClick={submitWord}
              style={{
                padding: '14px 28px',
                fontSize: 18,
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 600,
                background: story.color,
                color: 'white',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: `0 6px 0 ${story.shadowColor}`,
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Go! ➡️
            </button>
          </div>

          {/* Entry chips */}
          {entries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {entries.map((e, i) => (
                <span key={i} style={{
                  background: story.color + '33',
                  border: `2px solid ${story.color}`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}>
                  {e.word}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STORY REVEAL ── */}
      {phase === 'reveal' && (
        <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '32px 28px',
            border: `4px solid ${story.color}`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.12)`,
            position: 'relative',
          }}>
            {/* Speech bubble tail */}
            <div style={{
              position: 'absolute',
              top: -16,
              left: 32,
              width: 0, height: 0,
              borderLeft: '16px solid transparent',
              borderRight: '16px solid transparent',
              borderBottom: `16px solid ${story.color}`,
            }} />

            <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              ✨ Your Story! ✨
            </div>

            <div style={{
              fontSize: 20,
              lineHeight: 1.8,
              color: 'var(--text-dark)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Fredoka, sans-serif',
            }}>
              {fillStory(story.text)}
            </div>
          </div>

          {/* Words summary */}
          <div style={{ background: story.color + '18', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 10 }}>Words you used:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {entries.map((e, i) => (
                <span key={i} style={{
                  background: story.color,
                  color: 'white',
                  borderRadius: 20,
                  padding: '4px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Fredoka, sans-serif',
                }}>
                  {e.word}
                </span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={replaySame}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '14px 20px',
                fontSize: 16,
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 600,
                background: story.color,
                color: 'white',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: `0 6px 0 ${story.shadowColor}`,
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              🔄 Same Story
            </button>
            <button
              onClick={pickNew}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '14px 20px',
                fontSize: 16,
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 600,
                background: 'var(--accent-purple)',
                color: 'white',
                border: 'none',
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: '0 6px 0 #7C3AED',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              📖 New Story
            </button>
          </div>

          {showRating && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowRating(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: 15,
                  fontFamily: 'Fredoka, sans-serif',
                  background: 'var(--accent-yellow)',
                  color: 'var(--text-dark)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #CC9900',
                }}
              >
                ⭐ Rate this activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
