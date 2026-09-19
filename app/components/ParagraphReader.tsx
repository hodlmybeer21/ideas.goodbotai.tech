'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Paragraph Library ───────────────────────────────────────────────────────
//
// Multi-sentence paragraphs (3-5 sentences each) for fluent-reading practice.
// Distinct from ReadAlong's single-sentence PASSAGES — this is the "listen to
// the whole thing and follow along with your eyes" lane. Same passage themes
// as ReadAlong so kids can re-read the same story in either mode.

interface Paragraph {
  id: string;
  emoji: string;
  title: string;
  level: number;
  description: string;
  text: string;          // joined paragraph (with spaces)
  sentences: string[];   // for picker display + completion stats
}

const PARAGRAPHS: Paragraph[] = [
  {
    id: 'big-dog',
    emoji: '🐕',
    title: 'The Big Dog',
    level: 1,
    description: 'A simple story about a dog',
    text: 'The big dog ran home. The sun is bright today. I like to read books.',
    sentences: ['The big dog ran home.', 'The sun is bright today.', 'I like to read books.'],
  },
  {
    id: 'little-cat',
    emoji: '🐱',
    title: 'The Little Cat',
    level: 2,
    description: 'A cat goes on an adventure',
    text: 'The little cat jumped over the big fence. My mom makes the best pancakes in the morning. We went to the park and played with our dog.',
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
    text: 'The rain stopped and the rainbow appeared in the big blue sky. My brother and I built a tall tower with our colorful blocks. The butterfly flew from flower to flower in the warm summer garden.',
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
    text: 'Birds have feathers. They can fly in the sky. Some birds sing songs. Birds build nests in trees. Baby birds hatch from eggs.',
    sentences: [
      'Birds have feathers.',
      'They can fly in the sky.',
      'Some birds sing songs.',
      'Birds build nests in trees.',
      'Baby birds hatch from eggs.',
    ],
  },
  {
    id: 'twinkle',
    emoji: '⭐',
    title: 'Twinkle Star',
    level: 5,
    description: 'A classic rhyme about the night sky',
    text: 'Twinkle, twinkle, little star. How I wonder what you are. Up above the world so high. Like a diamond in the sky.',
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
    text: 'The farm has many happy animals. The cow gives us fresh milk every morning. The chickens run around the yard all day.',
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
    text: 'The ocean is full of colorful fish and friendly dolphins. Whales sing songs that travel for miles underwater. Starfish cling to rocks and sea snails hide in their shells.',
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
    text: 'Spring brings flowers and baby animals. Summer is hot and perfect for swimming. Fall paints the leaves in red and gold. Winter covers everything in soft white snow.',
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

// ─── TTS Helpers ─────────────────────────────────────────────────────────────

function speakWord(word: string, rate = 0.85): void {
  if (typeof window === 'undefined') return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word.replace(/[^a-zA-Z']/g, ''));
    utter.rate = rate;
    utter.pitch = 1.1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  } catch {}
}

/**
 * Speak a whole paragraph and stream word-boundary events to the caller.
 * Uses SpeechSynthesisUtterance.onboundary with event.name='word' and
 * event.charIndex = offset into source text where the next word begins.
 *
 * Returns a cancel function. Fires onEnd on completion OR error (Safari
 * sometimes fires error on cancel).
 */
function speakParagraph(
  text: string,
  rate: number,
  onWord: (idx: number) => void,
  onEnd: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1.1;
    utter.volume = 1;
    utter.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== 'word') return;
      const before = text.substring(0, e.charIndex);
      const idx = before.split(/\s+/).filter(Boolean).length;
      onWord(idx);
    };
    utter.onend = onEnd;
    utter.onerror = onEnd;
    window.speechSynthesis.speak(utter);
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
  } catch {
    onEnd();
    return () => {};
  }
}

// ─── Confetti (inline, no asset deps) ────────────────────────────────────────

function CompletionConfetti() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
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

// ─── Completion fanfare (Web Audio synth) ────────────────────────────────────

function playFanfare() {
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
}

// ─── Picker Screen ───────────────────────────────────────────────────────────

function PickerScreen({ onPick, onBack }: { onPick: (p: Paragraph) => void; onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', padding: '0 12px 40px' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        button:active { transform: translateY(4px) !important; box-shadow: none !important; }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px 8px' }}>
          <button onClick={onBack} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Fredoka', color: '#6366F1', margin: 0 }}>
              📜 Paragraph Reader
            </h2>
            <p style={{ fontSize: 13, color: '#999', fontFamily: 'Fredoka', margin: 0 }}>
              Listen to the story and follow along!
            </p>
          </div>
          <div style={{ width: 32 }} />
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

        {/* Paragraph Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {PARAGRAPHS.map((p, i) => {
            const lc = LEVEL_COLORS[p.level];
            return (
              <button
                key={p.id}
                onClick={() => onPick(p)}
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
    </div>
  );
}

// ─── Reader Screen ───────────────────────────────────────────────────────────

interface ReaderScreenProps {
  paragraph: Paragraph;
  onBack: () => void;
  onComplete: () => void;
  kidName: string;
}

function ReaderScreen({ paragraph, onBack, onComplete, kidName }: ReaderScreenProps) {
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(0.85);
  const [completedFired, setCompletedFired] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  // Tokenize once. Split on whitespace boundaries but keep whitespace as
  // separate tokens so the rendered layout matches the source text exactly.
  const tokens = paragraph.text.split(/(\s+)/);
  const totalWords = paragraph.text.split(/\s+/).filter(Boolean).length;

  // Pre-compute word index for each token. Whitespace tokens get -1.
  const wordIndexByToken: number[] = [];
  {
    let wi = 0;
    for (const tok of tokens) {
      if (/^\s+$/.test(tok)) {
        wordIndexByToken.push(-1);
      } else {
        wordIndexByToken.push(wi);
        wi++;
      }
    }
  }

  const handlePlay = useCallback(() => {
    cancelRef.current?.();
    setActiveWordIdx(-1);
    setCompletedFired(false);
    setIsPlaying(true);
    cancelRef.current = speakParagraph(
      paragraph.text,
      rate,
      (idx) => setActiveWordIdx(idx),
      () => {
        setIsPlaying(false);
        setActiveWordIdx(-1);
        if (!completedFired) {
          setCompletedFired(true);
          onComplete();
        }
      },
    );
  }, [paragraph.text, rate, completedFired, onComplete]);

  const handlePause = useCallback(() => {
    cancelRef.current?.();
    setIsPlaying(false);
  }, []);

  const handleRestart = useCallback(() => {
    setCompletedFired(false);
    handlePlay();
  }, [handlePlay]);

  const handleWordTap = useCallback((word: string) => {
    cancelRef.current?.();
    setIsPlaying(false);
    speakWord(word, rate);
  }, [rate]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cancelRef.current?.();
      if (typeof window !== 'undefined') {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, []);

  const lc = LEVEL_COLORS[paragraph.level];
  const progressPct = activeWordIdx < 0
    ? 0
    : Math.min(((activeWordIdx + 1) / totalWords) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', padding: '0 12px 40px' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        button:active { transform: translateY(4px) !important; box-shadow: none !important; }
        button:disabled { opacity: 0.5 !important; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '16px 4px 8px' }}>
          <button onClick={onBack} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontFamily: 'Fredoka', color: '#999', marginBottom: 2 }}>
              {paragraph.emoji} {paragraph.title}
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
              Level {paragraph.level}
            </div>
          </div>
          <button onClick={() => setShowRating(true)} style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>⭐</button>
        </div>

        {/* Speed slider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, fontFamily: 'Fredoka', fontSize: 13, color: '#666' }}>
          <span>🐢</span>
          <input
            type="range"
            min="0.5"
            max="1.2"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            style={{ width: 160 }}
            aria-label="Reading speed"
          />
          <span>🐇</span>
          <span style={{ marginLeft: 8, color: '#999' }}>Speed: {rate.toFixed(2)}x</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'Fredoka', color: '#999', marginBottom: 4 }}>
            <span>Progress</span>
            <span>Word {activeWordIdx < 0 ? 0 : Math.min(activeWordIdx + 1, totalWords)} of {totalWords}</span>
          </div>
          <div style={{ background: '#E5E0D8', borderRadius: 20, height: 10, overflow: 'hidden' }}>
            <div style={{
              background: `linear-gradient(90deg, ${lc.bg}, ${lc.bg}cc)`,
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 20,
              transition: 'width 0.2s ease',
            }} />
          </div>
        </div>

        {/* Paragraph card — flowing run of word spans */}
        <div
          onClick={(e) => {
            const target = (e.target as HTMLElement).closest('[data-word-idx]');
            if (target) {
              const idx = parseInt(target.getAttribute('data-word-idx') || '-1', 10);
              if (idx >= 0) {
                const word = tokens.find((_, i) => wordIndexByToken[i] === idx) || '';
                handleWordTap(word);
              }
            }
          }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: '32px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            marginBottom: 20,
            minHeight: 200,
            fontFamily: 'Fredoka',
            fontSize: 22,
            lineHeight: 2.2,
            color: '#666',
            userSelect: 'none',
            cursor: 'default',
          }}
        >
          {tokens.map((tok, i) => {
            if (wordIndexByToken[i] === -1) {
              return <span key={i}>{tok}</span>;
            }
            const wIdx = wordIndexByToken[i];
            const isActive = wIdx === activeWordIdx;
            const isPast = activeWordIdx >= 0 && wIdx < activeWordIdx;
            return (
              <span
                key={i}
                data-word-idx={wIdx}
                style={{
                  display: 'inline-block',
                  padding: isActive ? '2px 8px' : '2px 0',
                  margin: isActive ? '0 2px' : 0,
                  background: isActive
                    ? '#FFD93D'
                    : isPast
                      ? '#FFF7CC'
                      : 'transparent',
                  color: isActive ? '#333' : isPast ? '#555' : '#666',
                  fontWeight: isActive ? 700 : isPast ? 600 : 500,
                  fontSize: isActive ? 26 : 22,
                  borderRadius: isActive ? 10 : 0,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 3px 0 rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tok}
              </span>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isPlaying ? (
            <button onClick={handlePlay} style={bigBtn('#6BCB77', '#3d8f4a')}>
              ▶ Listen
            </button>
          ) : (
            <button onClick={handlePause} style={bigBtn('#FF9F43', '#c4701e')}>
              ⏸ Pause
            </button>
          )}
          <button onClick={handleRestart} style={bigBtn('#94A3B8', '#5a6875')}>
            🔄 Restart
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#999', fontFamily: 'Fredoka' }}>
          Tap any word to hear it. Press Listen to hear the whole paragraph.
        </p>
      </div>

      {showRating && (
        <RatingModal
          activity="paragraph-reader"
          activityName="Paragraph Reader"
          activityEmoji="📜"
          kidName={kidName}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

function bigBtn(bg: string, shadow: string): React.CSSProperties {
  return {
    fontFamily: 'Fredoka',
    fontSize: 18,
    fontWeight: 600,
    background: bg,
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: '12px 24px',
    cursor: 'pointer',
    boxShadow: `0 5px 0 ${shadow}`,
    transform: 'translateY(3px)',
    transition: 'transform 0.1s, box-shadow 0.1s',
  };
}

// ─── Completion Screen ───────────────────────────────────────────────────────

function CompletionScreen({
  paragraph,
  onReadAgain,
  onPickAnother,
  onBack,
}: {
  paragraph: Paragraph;
  onReadAgain: () => void;
  onPickAnother: () => void;
  onBack: () => void;
}) {
  useEffect(() => { playFanfare(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', padding: '0 12px 40px' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', textAlign: 'center', animation: 'pop 0.4s ease' }}>
        <CompletionConfetti />
        <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#6366F1', fontFamily: 'Fredoka', marginBottom: 8 }}>
          Great reading, {paragraph.title}!
        </h2>
        <p style={{ fontSize: 18, color: '#666', fontFamily: 'Fredoka', marginBottom: 24 }}>
          You listened to all {paragraph.sentences.length} sentences!
        </p>

        <div style={{ fontSize: 48, marginBottom: 24 }}>
          <span style={{ margin: '0 4px' }}>⭐</span>
          <span style={{ margin: '0 4px' }}>⭐</span>
          <span style={{ margin: '0 4px' }}>⭐</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 320, margin: '0 auto' }}>
          <button
            onClick={onReadAgain}
            style={{
              fontFamily: 'Fredoka',
              fontSize: 18,
              fontWeight: 600,
              background: '#6BCB77',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '14px 28px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #3d8f4a',
              transform: 'translateY(4px)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
            📖 Read Again
          </button>
          <button
            onClick={onPickAnother}
            style={{
              fontFamily: 'Fredoka',
              fontSize: 18,
              fontWeight: 600,
              background: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '14px 28px',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #4F46E5',
              transform: 'translateY(4px)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
            ✨ Pick Another Story
          </button>
          <button
            onClick={onBack}
            style={{
              fontFamily: 'Fredoka',
              fontSize: 16,
              fontWeight: 600,
              background: 'transparent',
              color: '#666',
              border: 'none',
              padding: '10px',
              cursor: 'pointer',
            }}
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ParagraphReader({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'picker' | 'reader' | 'complete'>('picker');
  const [selected, setSelected] = useState<Paragraph | null>(null);

  const handlePick = (p: Paragraph) => {
    setSelected(p);
    setScreen('reader');
  };

  const handleComplete = () => {
    if (selected) {
      try {
        const saved = localStorage.getItem('goodbotkids_paragraph_v1');
        const history: string[] = saved ? JSON.parse(saved) : [];
        if (!history.includes(selected.id)) {
          history.push(selected.id);
          localStorage.setItem('goodbotkids_paragraph_v1', JSON.stringify(history));
        }
        const completed = parseInt(localStorage.getItem('paragraphreader_count') || '0', 10) + 1;
        localStorage.setItem('paragraphreader_count', String(completed));
      } catch {}
    }
    setScreen('complete');
  };

  if (screen === 'complete' && selected) {
    return (
      <CompletionScreen
        paragraph={selected}
        onReadAgain={() => setScreen('reader')}
        onPickAnother={() => setScreen('picker')}
        onBack={onBack}
      />
    );
  }

  if (screen === 'reader' && selected) {
    return (
      <ReaderScreen
        paragraph={selected}
        onBack={() => setScreen('picker')}
        onComplete={handleComplete}
        kidName={kidName}
      />
    );
  }

  return <PickerScreen onPick={handlePick} onBack={onBack} />;
}
