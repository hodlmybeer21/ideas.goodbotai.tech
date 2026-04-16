'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Passages ────────────────────────────────────────────────────────────────

interface Passage {
  id: string;
  emoji: string;
  title: string;
  level: number;
  description: string;
  sentences: string[];
}

const PASSAGES: Passage[] = [
  {
    id: 'big-dog',
    emoji: '🐕',
    title: 'The Big Dog',
    level: 1,
    description: 'A simple story about a dog',
    sentences: [
      'The big dog ran home.',
      'The sun is bright today.',
      'I like to read books.',
    ],
  },
  {
    id: 'cat-fence',
    emoji: '🐱',
    title: 'The Little Cat',
    level: 2,
    description: 'A cat goes on an adventure',
    sentences: [
      'The little cat jumped over the big fence.',
      'My mom makes the best pancakes in the morning.',
      'We went to the park and played with our dog.',
    ],
  },
  {
    id: 'rainbow',
    emoji: '🌈',
    title: 'Rainbow Day',
    level: 3,
    description: 'Rain, sun, and a beautiful rainbow',
    sentences: [
      'The rain stopped and the rainbow appeared in the big blue sky.',
      'My brother and I built a tall tower with our colorful blocks.',
      'The butterfly flew from flower to flower in the warm summer garden.',
    ],
  },
  {
    id: 'birds',
    emoji: '🐦',
    title: 'All About Birds',
    level: 4,
    description: 'Learn cool facts about birds',
    sentences: [
      'Birds have feathers.',
      'They can fly in the sky.',
      'Some birds sing songs.',
      'Birds build nests in trees.',
    ],
  },
  {
    id: 'twinkle',
    emoji: '⭐',
    title: 'Twinkle Star',
    level: 5,
    description: 'A classic rhyme about the night sky',
    sentences: [
      'Twinkle, twinkle, little star.',
      'How I wonder what you are.',
      'Up above the world so high.',
      'Like a diamond in the sky.',
    ],
  },
  {
    id: 'farm',
    emoji: '🌻',
    title: 'On the Farm',
    level: 2,
    description: 'A sunny day down on the farm',
    sentences: [
      'The farm has many happy animals.',
      'The cow gives us fresh milk every morning.',
      'The chickens run around the yard all day.',
    ],
  },
  {
    id: 'ocean',
    emoji: '🌊',
    title: 'Ocean Friends',
    level: 3,
    description: 'Discover creatures under the sea',
    sentences: [
      'The ocean is full of colorful fish and friendly dolphins.',
      'Whales sing songs that travel for miles underwater.',
      'Starfish cling to rocks and sea snails hide in their shells.',
    ],
  },
  {
    id: 'seasons',
    emoji: '🍂',
    title: 'Four Seasons',
    level: 4,
    description: 'How nature changes through the year',
    sentences: [
      'Spring brings flowers and baby animals.',
      'Summer is hot and perfect for swimming.',
      'Fall paints the leaves in red and gold.',
      'Winter covers everything in soft white snow.',
    ],
  },
];

const LEVEL_COLORS: Record<number, { bg: string; shadow: string; text: string }> = {
  1: { bg: '#6BCB77', shadow: '#3d8f4a', text: 'white' },
  2: { bg: '#FFD93D', shadow: '#c9a61e', text: '#333' },
  3: { bg: '#FF9F43', shadow: '#c4701e', text: 'white' },
  4: { bg: '#FF6B9D', shadow: '#c9305e', text: 'white' },
  5: { bg: '#C084FC', shadow: '#8b3fc7', text: 'white' },
};

// ─── TTS helper ──────────────────────────────────────────────────────────────

function speakWord(word: string, rate = 0.85): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.rate = rate;
  utter.pitch = 1.1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

function speakSequence(words: string[], gapMs = 800): () => void {
  let cancelled = false;
  let i = 0;
  const next = () => {
    if (cancelled || i >= words.length) return;
    speakWord(words[i], 0.85);
    i++;
    setTimeout(next, gapMs);
  };
  next();
  return () => { cancelled = true; window.speechSynthesis.cancel(); };
}

// ─── Confetti (inline) ───────────────────────────────────────────────────────

function CompletionConfetti() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.5}s`,
    size: Math.random() * 10 + 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: p.left,
            width: p.size,
            height: p.size * 2,
            background: p.color,
            borderRadius: 2,
            animation: `confettiFall ${2 + Math.random()}s ease-in forwards`,
            animationDelay: p.delay,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Completion Screen ───────────────────────────────────────────────────────

function CompletionScreen({
  passage,
  sentencesRead,
  onReadAgain,
  onPickAnother,
}: {
  passage: Passage;
  sentencesRead: number;
  onReadAgain: () => void;
  onPickAnother: () => void;
}) {
  const stars = Math.min(3, Math.ceil((sentencesRead / passage.sentences.length) * 3));

  useEffect(() => {
    // C-E-G-C arpeggio
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const note = (freq: number, t: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      };
      const now = ctx.currentTime;
      [261.63, 329.63, 392.0, 523.25].forEach((f, i) => note(f, now + i * 0.18));
    } catch {}
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '24px 16px', animation: 'pop 0.4s ease' }}>
      <CompletionConfetti />
      <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
      <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-pink)', fontFamily: 'Fredoka', marginBottom: 8 }}>
        You read it all, {passage.title}!
      </h2>
      <p style={{ fontSize: 18, color: '#666', fontFamily: 'Fredoka', marginBottom: 20 }}>
        Amazing job reading {sentencesRead} sentence{sentencesRead !== 1 ? 's' : ''}!
      </p>

      <div style={{ fontSize: 48, marginBottom: 24 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} style={{ margin: '0 4px', filter: i < stars ? 'none' : 'grayscale(1)', opacity: i < stars ? 1 : 0.3 }}>
            ⭐
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 320, margin: '0 auto' }}>
        <button
          onClick={onReadAgain}
          style={btnStyle('#6BCB77', '#3d8f4a')}
        >
          📖 Read Again
        </button>
        <button
          onClick={onPickAnother}
          style={btnStyle('#C084FC', '#8b3fc7')}
        >
          ✨ Pick Another Story
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg: string, shadow: string) {
  return {
    fontFamily: 'Fredoka',
    fontSize: 18,
    fontWeight: 600,
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '14px 28px',
    cursor: 'pointer',
    boxShadow: `0 6px 0 ${shadow}`,
    transform: 'translateY(4px)',
    transition: 'transform 0.1s, box-shadow 0.1s',
  } as React.CSSProperties;
}

// ─── Reading Screen ───────────────────────────────────────────────────────────

function ReadingScreen({
  passage,
  sentenceIndex,
  onSentenceComplete,
  onFinish,
  onBack,
}: {
  passage: Passage;
  sentenceIndex: number;
  onSentenceComplete: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const sentence = passage.sentences[sentenceIndex];
  const words = sentence.match(/[\w']+|[.,!?;:'"-]/g) || [];
  const [touchedWords, setTouchedWords] = useState<Set<number>>(new Set());
  const [isReadingAll, setIsReadingAll] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const totalWords = words.length;

  const currentWord = Math.max(...Array.from(touchedWords), -1);
  const allDone = touchedWords.size === totalWords;

  // Reset when sentence changes
  useEffect(() => {
    setTouchedWords(new Set());
    setIsReadingAll(false);
    cancelRef.current?.();
  }, [sentenceIndex, sentence]);

  const handleWordEnter = useCallback((idx: number) => {
    if (isReadingAll) return;
    setTouchedWords(prev => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // Strip punctuation for clean TTS
    const clean = words[idx].replace(/[^a-zA-Z']/g, '');
    if (clean) speakWord(clean);
  }, [isReadingAll, words]);

  const handleReadAgain = () => {
    cancelRef.current?.();
    setTouchedWords(new Set());
    setIsReadingAll(true);
    const cleanWords = words.map(w => w.replace(/[^a-zA-Z']/g, '')).filter(Boolean);
    cancelRef.current = speakSequence(cleanWords, 700);
    // Mark words as touched in sync
    cleanWords.forEach((_, i) => {
      setTimeout(() => {
        setTouchedWords(prev => {
          if (prev.has(i)) return prev;
          return new Set([...prev, i]);
        });
      }, i * 700);
    });
    setTimeout(() => setIsReadingAll(false), cleanWords.length * 700 + 200);
  };

  const handleNext = () => {
    cancelRef.current?.();
    if (sentenceIndex < passage.sentences.length - 1) {
      onSentenceComplete();
    } else {
      onFinish();
    }
  };

  const handlePause = () => {
    cancelRef.current?.();
    setIsReadingAll(false);
    window.speechSynthesis.cancel();
  };

  const handleRestart = () => {
    cancelRef.current?.();
    setTouchedWords(new Set());
    setIsReadingAll(false);
  };

  const lc = LEVEL_COLORS[passage.level];

  return (
    <div style={{ padding: '16px 12px', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
        >
          ←
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontFamily: 'Fredoka', color: '#999', marginBottom: 2 }}>
            {passage.emoji} {passage.title}
          </div>
          <div style={{
            display: 'inline-block',
            background: lc.bg,
            color: lc.text,
            fontFamily: 'Fredoka',
            fontSize: 12,
            fontWeight: 600,
            padding: '2px 10px',
            borderRadius: 20,
            boxShadow: `0 2px 0 ${lc.shadow}`,
          }}>
            Level {passage.level}
          </div>
        </div>
        <div style={{ fontSize: 14, fontFamily: 'Fredoka', color: '#999' }}>
          {sentenceIndex + 1}/{passage.sentences.length}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'Fredoka', color: '#999', marginBottom: 4 }}>
          <span>Progress</span>
          <span>Word {Math.min(currentWord + 2, totalWords)} of {totalWords}</span>
        </div>
        <div style={{ background: '#E5E0D8', borderRadius: 20, height: 10, overflow: 'hidden' }}>
          <div style={{
            background: `linear-gradient(90deg, ${lc.bg}, ${lc.bg}cc)`,
            height: '100%',
            width: `${(touchedWords.size / totalWords) * 100}%`,
            borderRadius: 20,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Sentence card */}
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '28px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        marginBottom: 20,
        minHeight: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '6px 10px',
        cursor: 'default',
      }}>
        {words.map((word, idx) => {
          const isTouched = touchedWords.has(idx);
          const cleanWord = word.replace(/[^a-zA-Z']/g, '');
          return (
            <span
              key={idx}
              onMouseEnter={() => handleWordEnter(idx)}
              onTouchMove={e => {
                e.preventDefault();
                const touch = e.touches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el) {
                  const i = parseInt(el.getAttribute('data-idx') || '-1');
                  if (i >= 0) handleWordEnter(i);
                }
              }}
              data-idx={idx}
              style={{
                fontSize: isTouched ? 34 : 28,
                fontFamily: 'Fredoka',
                fontWeight: isTouched ? 700 : 500,
                color: isTouched ? '#333' : '#bbb',
                background: isTouched ? '#FFD93D' : 'transparent',
                borderRadius: isTouched ? 10 : 0,
                padding: isTouched ? '4px 6px' : '4px 2px',
                transition: 'all 0.15s ease',
                lineHeight: 1.3,
                display: 'inline-block',
                cursor: 'default',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Hint */}
      {touchedWords.size === 0 && (
        <p style={{ textAlign: 'center', fontSize: 15, color: '#aaa', fontFamily: 'Fredoka', marginBottom: 12 }}>
          👆 Slide your finger across the words to read along!
        </p>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleReadAgain}
          style={smallBtn('#6BCB77', '#3d8f4a')}
          disabled={isReadingAll}
        >
          🔊 Read It Again
        </button>
        <button
          onClick={handlePause}
          style={smallBtn('#FF9F43', '#c4701e')}
          disabled={!isReadingAll}
        >
          ⏸ Pause
        </button>
        <button
          onClick={handleRestart}
          style={smallBtn('#94A3B8', '#5a6875')}
        >
          🔄 Restart
        </button>
      </div>

      {allDone && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 18, fontFamily: 'Fredoka', color: '#6BCB77', fontWeight: 600, marginBottom: 8 }}>
            Great reading! 🎉
          </div>
          <button
            onClick={handleNext}
            style={{ ...smallBtn('#6BCB77', '#3d8f4a'), fontSize: 20, padding: '14px 32px' }}
          >
            {sentenceIndex < passage.sentences.length - 1 ? '➡ Next Sentence' : '🏆 Finish!'}
          </button>
        </div>
      )}
    </div>
  );
}

function smallBtn(bg: string, shadow: string): React.CSSProperties {
  return {
    fontFamily: 'Fredoka',
    fontSize: 15,
    fontWeight: 600,
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: '10px 18px',
    cursor: 'pointer',
    boxShadow: `0 5px 0 ${shadow}`,
    transform: 'translateY(3px)',
    transition: 'transform 0.1s, box-shadow 0.1s',
    opacity: 1,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReadAlong({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'picker' | 'reading' | 'complete'>('picker');
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [sentencesRead, setSentencesRead] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const handlePick = (passage: Passage) => {
    setSelectedPassage(passage);
    setSentenceIndex(0);
    setSentencesRead(0);
    setScreen('reading');
  };

  const handleSentenceComplete = () => {
    setSentencesRead(prev => prev + 1);
    setSentenceIndex(prev => prev + 1);
  };

  const handleFinish = () => {
    setSentencesRead(prev => prev + 1);
    setScreen('complete');
    // Save completion
    try {
      const saved = localStorage.getItem('goodbotkids_readalong_v1');
      const history: string[] = saved ? JSON.parse(saved) : [];
      if (selectedPassage && !history.includes(selectedPassage.id)) {
        history.push(selectedPassage.id);
        localStorage.setItem('goodbotkids_readalong_v1', JSON.stringify(history));
      }
    } catch {}
  };

  const handleReadAgain = () => {
    setSentenceIndex(0);
    setSentencesRead(0);
    setScreen('reading');
  };

  if (screen === 'complete' && selectedPassage) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F6FF' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>
          <CompletionScreen
            passage={selectedPassage}
            sentencesRead={sentencesRead}
            onReadAgain={handleReadAgain}
            onPickAnother={() => setScreen('picker')}
          />
        </div>
        <style>{`@keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  if (screen === 'reading' && selectedPassage) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F6FF' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 40px' }}>
          <ReadingScreen
            passage={selectedPassage}
            sentenceIndex={sentenceIndex}
            onSentenceComplete={handleSentenceComplete}
            onFinish={handleFinish}
            onBack={() => setScreen('picker')}
          />
        </div>
        <style>{`@keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
        <style>{`
          button:active { transform: translateY(4px) !important; box-shadow: none !important; }
          button:disabled { opacity: 0.5 !important; cursor: not-allowed; }
        `}</style>
        {showRating && selectedPassage && (
          <RatingModal
            activity="readalong"
            activityName="Read Along"
            activityEmoji="📖"
            kidName={kidName}
            onClose={() => setShowRating(false)}
          />
        )}
      </div>
    );
  }

  // Picker screen
  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', padding: '0 12px 40px' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        button:active { transform: translateY(4px) !important; box-shadow: none !important; }
      `}</style>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px 8px' }}>
          <button
            onClick={onBack}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          >
            ←
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Fredoka', color: 'var(--accent-purple)', margin: 0 }}>
              📖 Read Along
            </h2>
            <p style={{ fontSize: 13, color: '#999', fontFamily: 'Fredoka', margin: 0 }}>
              Slide your finger across words to read!
            </p>
          </div>
          <button
            onClick={() => setShowRating(true)}
            style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          >
            ⭐
          </button>
        </div>

        {/* Level Legend */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 4px 16px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map(l => {
            const lc = LEVEL_COLORS[l];
            return (
              <div key={l} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'white', borderRadius: 20,
                padding: '3px 10px 3px 6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: lc.bg }} />
                <span style={{ fontSize: 12, fontFamily: 'Fredoka', color: '#666' }}>Level {l}</span>
              </div>
            );
          })}
        </div>

        {/* Passage Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {PASSAGES.map((p, i) => {
            const lc = LEVEL_COLORS[p.level];
            return (
              <button
                key={p.id}
                onClick={() => handlePick(p)}
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: 20,
                  padding: '18px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  animation: `pop 0.3s ease ${i * 0.05}s both`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{p.emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Fredoka', color: '#333', marginBottom: 4 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 13, fontFamily: 'Fredoka', color: '#999', marginBottom: 10 }}>
                  {p.description}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    background: lc.bg,
                    color: lc.text,
                    fontFamily: 'Fredoka',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                    boxShadow: `0 3px 0 ${lc.shadow}`,
                  }}>
                    Level {p.level}
                  </div>
                  <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'Fredoka' }}>
                    {p.sentences.length} sentences
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showRating && (
        <RatingModal
          activity="readalong"
          activityName="Read Along"
          activityEmoji="📖"
          kidName={kidName}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
