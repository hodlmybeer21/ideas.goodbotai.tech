'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import RatingModal from './RatingModal';

// ─── Passages data ────────────────────────────────────────────────────────────
const PASSAGES = [
  {
    id: 1, level: 1, emoji: '☀️', title: 'Simple Sentences',
    color: '#6BCB77', shadow: '#4fa05c',
    sentences: [
      'The big dog ran home.',
      'The sun is bright today.',
      'I like to read books.',
      'Birds can fly in the sky.',
      'The cat sat on the mat.',
    ]
  },
  {
    id: 2, level: 2, emoji: '🌳', title: 'Medium Stories',
    color: '#FFD93D', shadow: '#c9a82e',
    sentences: [
      'The little cat jumped over the big fence.',
      'My mom makes the best pancakes in the morning.',
      'We went to the park and played with our dog.',
      'The bird sat on the branch and sang a sweet song.',
    ]
  },
  {
    id: 3, level: 3, emoji: '🌈', title: 'Longer Sentences',
    color: '#6BCBFF', shadow: '#4a9fd9',
    sentences: [
      'The rain stopped and the rainbow appeared in the big blue sky.',
      'My brother and I built a tall tower with our colorful blocks.',
      'The butterfly flew from flower to flower in the warm summer garden.',
    ]
  },
  {
    id: 4, level: 4, emoji: '🦁', title: 'Animal Facts',
    color: '#FF9F43', shadow: '#cc7a2f',
    sentences: [
      'Birds have feathers. They can fly in the sky.',
      'Fish live in water. They use fins to swim fast.',
      'Dogs are pets. They like to play and run around.',
    ]
  },
  {
    id: 5, level: 5, emoji: '⭐', title: 'Poems & Rhymes',
    color: '#C084FC', shadow: '#9660d4',
    sentences: [
      'Twinkle, twinkle, little star. How I wonder what you are.',
      'Row, row, row your boat. Gently down the stream.',
      'Humpty Dumpty sat on a wall. Humpty Dumpty had a great fall.',
    ]
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
type Screen = 'menu' | 'reading' | 'done';

// ─── Audio helpers ─────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function speakWord(word: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.rate = 0.85;
  utter.pitch = 1.1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

function playArpeggio(ctx: AudioContext) {
  const freqs = [523, 659, 784, 1047]; // C5 E5 G5 C6
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + i * 0.1);
    o.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
}

function playSuccessSound(ctx: AudioContext) {
  // Ascending three-note fanfare
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + i * 0.15);
    o.stop(ctx.currentTime + i * 0.15 + 0.4);
  });
}

// ─── Confetti burst ─────────────────────────────────────────────────────────────
function ConfettiBurst() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.5}s`,
    size: Math.random() * 10 + 8,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: -20,
            background: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size * 2,
            borderRadius: 3,
            animation: `confetti-burst 2.5s ease-out forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-burst {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ count }: { count: number }) {
  const stars = Math.min(3, Math.ceil(count / 2));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} style={{ fontSize: 40, opacity: i < stars ? 1 : 0.3 }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

// ─── Level stars ───────────────────────────────────────────────────────────────
function LevelStars({ level }: { level: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: 12, color: i < level ? '#FFD700' : '#E5E0D8' }}>★</span>
      ))}
    </div>
  );
}

// ─── Passage card ──────────────────────────────────────────────────────────────
function PassageCard({
  passage,
  onSelect,
  completed,
}: {
  passage: typeof PASSAGES[0];
  onSelect: () => void;
  completed: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: passage.color,
        border: 'none',
        borderRadius: 20,
        padding: '24px 16px',
        cursor: 'pointer',
        fontFamily: 'Fredoka',
        fontWeight: 700,
        fontSize: 15,
        color: 'white',
        boxShadow: pressed ? `0 2px 0 ${passage.shadow}` : `0 6px 0 ${passage.shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
      }}
    >
      {completed && (
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }}>✅</span>
      )}
      <span style={{ fontSize: 36 }}>{passage.emoji}</span>
      <span style={{ fontSize: 16 }}>{passage.title}</span>
      <LevelStars level={passage.level} />
      <span style={{ fontSize: 11, opacity: 0.8 }}>{passage.sentences.length} stories</span>
    </button>
  );
}

// ─── Reading screen ────────────────────────────────────────────────────────────
function ReadingScreen({
  passage,
  onBack,
  onDone,
  kidName,
}: {
  passage: typeof PASSAGES[0];
  onBack: () => void;
  onDone: (wordsRead: number) => void;
  kidName: string;
}) {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const [wordsRead, setWordsRead] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const wordsReadSet = useRef(new Set<string>());
  const touchMoved = useRef(false);

  const currentSentence = passage.sentences[sentenceIdx];
  const words = currentSentence.split(' ');

  const allWordsRead = words.every((_, i) => wordsReadSet.current.has(`${sentenceIdx}-${i}`));

  const handleWordTouch = useCallback((idx: number, word: string) => {
    if (touchMoved.current) return;
    setHighlightedWord(idx);
    const key = `${sentenceIdx}-${idx}`;
    if (!wordsReadSet.current.has(key)) {
      setWordsRead(w => w + 1);
      wordsReadSet.current.add(key);
    }
    speakWord(word);
  }, [sentenceIdx]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchMoved.current = true;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.dataset.wordIdx !== undefined) {
      const idx = parseInt(el.dataset.wordIdx);
      const word = words[idx];
      if (!isNaN(idx) && word) {
        handleWordTouch(idx, word);
      }
    }
  }, [words, handleWordTouch]);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => { touchMoved.current = false; }, 300);
  }, []);

  const handleWordEnter = useCallback((idx: number, word: string) => {
    handleWordTouch(idx, word);
  }, [handleWordTouch]);

  const readAgain = useCallback(() => {
    setAutoPlaying(true);
    setHighlightedWord(-1);
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        setHighlightedWord(i);
        speakWord(words[i]);
        i++;
      } else {
        clearInterval(interval);
        setAutoPlaying(false);
        setHighlightedWord(-1);
        // Mark all as read
        words.forEach((_, idx) => {
          wordsReadSet.current.add(`${sentenceIdx}-${idx}`);
        });
        setWordsRead(words.length > 0 ? words.length : wordsRead);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [words, sentenceIdx, wordsRead]);

  const goNext = useCallback(() => {
    if (sentenceIdx < passage.sentences.length - 1) {
      setSentenceIdx(s => s + 1);
      setHighlightedWord(-1);
      wordsReadSet.current = new Set();
      setWordsRead(0);
    } else {
      onDone(wordsRead);
    }
  }, [sentenceIdx, passage.sentences.length, wordsRead, onDone]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
          color: '#5C4033',
        }}
      >
        ← Back to Stories
      </button>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 36 }}>{passage.emoji}</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: passage.color, marginTop: 4 }}>
          {passage.title}
        </h2>
        <p style={{ fontFamily: 'Fredoka', fontSize: 14, color: '#94A3B8' }}>
          Story {sentenceIdx + 1} of {passage.sentences.length}
        </p>
      </div>

      {/* Sentence display */}
      <div
        onTouchMove={handleTouchMove}
        onTouchStart={() => { touchMoved.current = false; }}
        onTouchEnd={handleTouchEnd}
        style={{
          background: 'white',
          borderRadius: 20,
          padding: '24px 20px',
          marginBottom: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: `3px solid ${passage.color}33`,
          minHeight: 100,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px 8px',
        }}
      >
        {words.map((word, idx) => {
          const isHighlighted = highlightedWord === idx;
          const isRead = wordsReadSet.current.has(`${sentenceIdx}-${idx}`);
          return (
            <span
              key={idx}
              data-word-idx={idx}
              onMouseEnter={() => handleWordEnter(idx, word)}
              onTouchStart={() => handleWordTouch(idx, word)}
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                fontSize: 28,
                fontFamily: 'Fredoka',
                borderRadius: '8px',
                transition: 'background 0.15s, transform 0.1s, color 0.15s',
                background: isHighlighted ? '#FFD93D' : 'transparent',
                color: isHighlighted ? '#2D1B00' : isRead ? '#2D1B00' : '#999',
                transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Progress */}
      <p style={{ textAlign: 'center', fontFamily: 'Fredoka', fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
        Words read: {wordsRead} / {words.length}
        {allWordsRead && <span style={{ marginLeft: 8, color: '#6BCB77' }}>✓ All done!</span>}
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={readAgain}
          disabled={autoPlaying}
          style={{
            padding: '14px 24px',
            fontSize: 17,
            background: '#6BCBFF',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            cursor: autoPlaying ? 'not-allowed' : 'pointer',
            fontFamily: 'Fredoka',
            fontWeight: 700,
            boxShadow: `0 6px 0 #4a9fd9`,
            transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            opacity: autoPlaying ? 0.6 : 1,
          }}
        >
          🔊 Read It Again
        </button>

        <button
          onClick={goNext}
          style={{
            padding: '14px 24px',
            fontSize: 17,
            background: allWordsRead ? passage.color : '#E5E0D8',
            color: allWordsRead ? 'white' : '#999',
            border: 'none',
            borderRadius: 16,
            cursor: allWordsRead ? 'pointer' : 'not-allowed',
            fontFamily: 'Fredoka',
            fontWeight: 700,
            boxShadow: allWordsRead ? `0 6px 0 ${passage.shadow}` : '0 4px 0 #ccc',
            transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          {sentenceIdx < passage.sentences.length - 1 ? 'Next →' : 'Finish! 🎉'}
        </button>
      </div>
    </div>
  );
}

// ─── Done screen ───────────────────────────────────────────────────────────────
function DoneScreen({
  passage,
  totalWordsRead,
  onReadAgain,
  onPickNew,
  kidName,
}: {
  passage: typeof PASSAGES[0];
  totalWordsRead: number;
  onReadAgain: () => void;
  onPickNew: () => void;
  kidName: string;
}) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const ctx = getCtx();
    playSuccessSound(ctx);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const starCount = Math.min(3, Math.ceil(passage.sentences.length / 2));

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      {showConfetti && <ConfettiBurst />}

      <div style={{ fontSize: 80, marginBottom: 8, animation: 'bounce 1s ease infinite' }}>🎉</div>

      <h2 style={{ fontSize: 32, fontWeight: 700, color: passage.color, marginBottom: 8 }}>
        You read it all, {kidName}!
      </h2>

      <p style={{ fontFamily: 'Fredoka', fontSize: 18, color: '#5C4033', marginBottom: 16 }}>
        Great job reading <strong>{passage.title}</strong>!
      </p>

      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `3px solid ${passage.color}33`,
      }}>
        <p style={{ fontFamily: 'Fredoka', fontSize: 16, color: '#94A3B8', marginBottom: 8 }}>
          Words you read
        </p>
        <p style={{ fontSize: 48, fontWeight: 700, color: passage.color }}>
          {totalWordsRead}
        </p>
        <StarRating count={starCount} />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onReadAgain}
          style={{
            padding: '14px 28px',
            fontSize: 17,
            background: passage.color,
            color: 'white',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            fontFamily: 'Fredoka',
            fontWeight: 700,
            boxShadow: `0 6px 0 ${passage.shadow}`,
            transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          🔄 Read Again
        </button>

        <button
          onClick={onPickNew}
          style={{
            padding: '14px 28px',
            fontSize: 17,
            background: '#F1F5F9',
            color: '#5C4033',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            fontFamily: 'Fredoka',
            fontWeight: 700,
            boxShadow: '0 4px 0 #ccc',
            transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          📚 Pick New Story
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ReadAlong({
  onBack,
  kidName,
}: {
  onBack: () => void;
  kidName: string;
}) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [passage, setPassage] = useState<typeof PASSAGES[0] | null>(null);
  const [totalWordsRead, setTotalWordsRead] = useState(0);
  const [completedPassages, setCompletedPassages] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('readalong_completed') || '0');
    }
    return 0;
  });
  const [rated, setRated] = useState(false);

  const completedSet = useRef(new Set<number>());

  const handleSelectPassage = useCallback((p: typeof PASSAGES[0]) => {
    setPassage(p);
    setScreen('reading');
    setTotalWordsRead(0);
  }, []);

  const handleDone = useCallback((wordsRead: number) => {
    if (!passage) return;
    setTotalWordsRead(wordsRead);

    if (!completedSet.current.has(passage.id)) {
      completedSet.current.add(passage.id);
      const newCount = completedPassages + 1;
      setCompletedPassages(newCount);
      try {
        localStorage.setItem('readalong_completed', String(newCount));
      } catch {}
    }

    setScreen('done');
  }, [passage, completedPassages]);

  const handleReadAgain = useCallback(() => {
    if (passage) {
      setTotalWordsRead(0);
      setScreen('reading');
    }
  }, [passage]);

  const handlePickNew = useCallback(() => {
    setPassage(null);
    setTotalWordsRead(0);
    setScreen('menu');
  }, []);

  // Menu screen
  if (screen === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
            padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
            fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
            color: '#5C4033',
          }}
        >
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📖</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#C084FC', margin: 0 }}>Read Along</h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 24px', fontFamily: 'Fredoka' }}>
            Slide your finger across words to hear them read!
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}>
          {PASSAGES.map(p => (
            <PassageCard
              key={p.id}
              passage={p}
              onSelect={() => handleSelectPassage(p)}
              completed={completedSet.current.has(p.id)}
            />
          ))}
        </div>

        {completedPassages > 0 && (
          <div style={{
            textAlign: 'center',
            background: '#FFF9E6',
            borderRadius: 16,
            padding: '14px 20px',
            marginBottom: 20,
            fontSize: 17,
            fontFamily: 'Fredoka',
            color: '#8B6914',
          }}>
            📚 Stories completed: <strong>{completedPassages}</strong>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setRated(true)}
            style={{
              padding: '14px 32px',
              fontSize: 18,
              background: '#C084FC',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              fontFamily: 'Fredoka',
              fontWeight: 700,
              boxShadow: '0 6px 0 #9660d4',
              transform: 'translateY(0)',
              transition: 'transform 0.1s, box-shadow 0.1s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ⭐ Rate this Game
          </button>
        </div>

        {rated && (
          <RatingModal
            activity="readalong"
            activityName="Read Along"
            activityEmoji="📖"
            kidName={kidName}
            onClose={() => setRated(true)}
          />
        )}
      </div>
    );
  }

  // Reading screen
  if (screen === 'reading' && passage) {
    return (
      <ReadingScreen
        passage={passage}
        onBack={handlePickNew}
        onDone={handleDone}
        kidName={kidName}
      />
    );
  }

  // Done screen
  if (screen === 'done' && passage) {
    return (
      <DoneScreen
        passage={passage}
        totalWordsRead={totalWordsRead}
        onReadAgain={handleReadAgain}
        onPickNew={handlePickNew}
        kidName={kidName}
      />
    );
  }

  return null;
}
