'use client';
import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Audio helpers ─────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function playCorrect() {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
}
function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}
function playMilestone() {
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((hz, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.22);
  });
}
function playWin() {
  const ctx = getCtx();
  [523, 659, 784, 1047, 1319].forEach((hz, i) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.35);
    osc.start(ctx.currentTime + i * 0.13); osc.stop(ctx.currentTime + i * 0.13 + 0.38);
  });
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.2}s`,
    size: Math.random() * 8 + 8,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 200 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: p.left, width: p.size, height: p.size * 2,
          background: p.color, borderRadius: 2,
          animation: `confettiFall 1.5s ease-in ${p.delay} forwards`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Word data: each entry has the rime, correct word, and a sentence that makes sense with that word ─
type WordEntry = {
  rime: string;      // 'ar' | 'or' | 'er' | 'ir' | 'ur'
  word: string;      // the correct answer
  sentence: string;  // sentence with [BLANK] where the word goes
};

const WORDS: WordEntry[] = [
  // ar
  { rime: 'ar', word: 'car',    sentence: 'The [BLANK] zoomed down the road.' },
  { rime: 'ar', word: 'star',   sentence: 'Look at the bright [BLANK] in the sky!' },
  { rime: 'ar', word: 'bar',    sentence: 'The dog chewed on the bone [BLANK].' },
  { rime: 'ar', word: 'far',    sentence: 'The park is too [BLANK] to walk to.' },
  { rime: 'ar', word: 'jar',    sentence: 'Mom opened the cookie [BLANK].' },
  // or
  { rime: 'or', word: 'for',    sentence: 'This present is [BLANK] my birthday.' },
  { rime: 'or', word: 'door',   sentence: 'Please close the [BLANK] quietly.' },
  { rime: 'or', word: 'more',   sentence: 'Can I have [BLANK] juice, please?' },
  { rime: 'or', word: 'store',  sentence: 'Let\'s go to the [BLANK] to buy milk.' },
  // er
  { rime: 'er', word: 'her',    sentence: 'Mom gave the book to [BLANK].' },
  { rime: 'er', word: 'bird',   sentence: 'The little [BLANK] sang a sweet song.' },
  { rime: 'er', word: 'water',  sentence: 'The [BLANK] is cold and fresh.' },
  { rime: 'er', word: 'tiger',  sentence: 'The [BLANK] has orange and black stripes.' },
  // ir
  { rime: 'ir', word: 'bird',   sentence: 'The [BLANK] built a nest in the tree.' },
  { rime: 'ir', word: 'girl',   sentence: 'The [BLANK] wore a red dress to school.' },
  { rime: 'ir', word: 'circle', sentence: 'Draw a [BLANK] around the answer.' },
  { rime: 'ir', word: 'birthday', sentence: 'Today is my [BLANK] party!' },
  // ur
  { rime: 'ur', word: 'turn',    sentence: 'Please [BLANK] the page in your book.' },
  { rime: 'ur', word: 'burn',    sentence: 'Don\'t [BLANK] your hand on the stove!' },
  { rime: 'ur', word: 'purple',  sentence: 'My favorite color is [BLANK]!' },
  { rime: 'ur', word: 'turtle',  sentence: 'The slow [BLANK] crossed the road.' },
  { rime: 'ur', word: 'nurse',   sentence: 'The [BLANK] helped the doctor.' },
];

// ─── Wrong words per rime ────────────────────────────────────────────────────────
const WRONG_BY_RIME: Record<string, string[]> = {
  ar:  ['for', 'bird', 'turn', 'burn'],
  or:  ['car', 'bird', 'turn', 'burn'],
  er:  ['car', 'for', 'turn', 'burn'],
  ir:  ['car', 'for', 'turn', 'burn'],
  ur:  ['car', 'for', 'bird', 'star'],
};

// Generate 4 choices: 1 correct + 3 wrong from other rimes
function genChoices(correct: string, rime: string): string[] {
  const choices = [correct];
  const wrongs = WRONG_BY_RIME[rime] || [];
  for (const w of wrongs) {
    if (choices.length >= 4) break;
    if (w !== correct) choices.push(w);
  }
  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// ─── Score HUD ─────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, background: 'white', borderRadius: 16, padding: '10px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B9D', fontFamily: 'Fredoka' }}>{score}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Streak</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: streak >= 3 ? '#FF9F43' : '#94A3B8', fontFamily: 'Fredoka' }}>{streak >= 3 ? `🔥 ${streak}` : streak}</div>
      </div>
      <div style={{ width: 1, background: '#E5E0D8' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Best</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{best}</div>
      </div>
    </div>
  );
}

// ─── Choice button ─────────────────────────────────────────────────────────────
function CBtn({ value, onTap, color, shadow, disabled }: {
  value: string; onTap: () => void; color: string; shadow: string; disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      style={{
        background: disabled ? '#E5E0D8' : color,
        border: 'none', borderRadius: 16, padding: '16px 24px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: disabled ? '#94A3B8' : 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 5px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        minWidth: 140,
      }}
    >
      {value}
    </button>
  );
}

// ─── Car track ─────────────────────────────────────────────────────────────────
function CarTrack({ progress }: { progress: number }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '12px 16px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Fredoka' }}>START</span>
        <span style={{ fontSize: 20 }}>🏁</span>
        <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Fredoka' }}>FINISH</span>
      </div>
      <div style={{ height: 8, background: '#374151', borderRadius: 4, position: 'relative' }}>
        {[25, 50, 75].map(p => (
          <div key={p} style={{ position: 'absolute', top: 0, left: `${p}%`, width: 2, height: '100%', background: '#6B7280' }} />
        ))}
        <div style={{
          position: 'absolute', top: -10, left: `${Math.min(progress * 100, 92)}%`,
          transition: 'left 0.4s ease',
        }}>
          <div style={{ fontSize: 28, transform: 'scaleX(-1)' }}>🏎️</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function BossyRRacer({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu'|'playing'|'win'>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [wrongChoice, setWrongChoice] = useState<string|null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [qKey, setQKey] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const word = words[wordIdx];

  const shuffle = <T,>(a: T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  const startGame = useCallback(() => {
    const pool = shuffle([...WORDS]).slice(0, 10);
    setWords(pool);
    setWordIdx(0);
    const w = pool[0];
    setChoices(genChoices(w.word, w.rime));
    setScore(0); setStreak(0);
    setFeedback(null); setWrongChoice(null);
    setQKey(0); setPhase('playing');
  }, []);

  const handleAnswer = useCallback((choice: string) => {
    if (!word || feedback === 'correct') return;
    if (choice === word.word) {
      playCorrect();
      const ns = streak + 1;
      const nscore = score + 1;
      setStreak(ns); setScore(nscore);
      if (ns > bestStreak) setBestStreak(ns);
      if (nscore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => {
        if (wordIdx + 1 >= words.length) {
          playWin(); setPhase('win');
        } else {
          const next = words[wordIdx + 1];
          setWordIdx(i => i + 1);
          setChoices(genChoices(next.word, next.rime));
          setFeedback(null); setWrongChoice(null);
          setQKey(k => k + 1);
        }
      }, 800);
    } else {
      playWrong();
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setWrongChoice(choice);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongChoice(null); }, 1400);
    }
  }, [word, feedback, streak, score, bestStreak, wordIdx, words]);

  // ── MENU ─────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🏎️</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Bossy R Racer</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px' }}>Fill in the blank with the right word!</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#FF6B9D', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>How to Play 🏁</h3>
          <p style={{ fontSize: 14, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.6, margin: 0 }}>
            Read the sentence with a missing word.<br />
            Choose the word that completes it.<br />
            Each correct answer zooms your race car forward!
          </p>
        </div>

        <div style={{ background: '#F0F9FF', borderRadius: 16, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#0369A1', fontFamily: 'Fredoka', margin: 0 }}>
            <b>Word families:</b><br />
            🟠 <b>ar</b> (car, star, jar) · 🟢 <b>or</b> (for, door, more) · 🔵 <b>er</b> (her, bird, water) · 🟣 <b>ir</b> (girl, bird, circle) · 🟡 <b>ur</b> (turn, burn, purple)
          </p>
        </div>

        <button
          onClick={startGame}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #FF6B9D, #FF9F43)',
            border: 'none', borderRadius: 20, padding: '18px 24px',
            cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: 'white',
            boxShadow: '0 6px 0 #c9456e', transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          🏁 Start the Race!
        </button>
      </div>
    );
  }

  // ── WIN ─────────────────────────────────────────────────────────────────────
  if (phase === 'win') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh', textAlign: 'center' }}>
        <Confetti active={showConfetti} />
        <div style={{ fontSize: 64, marginTop: 40 }}>🏆</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#FF6B9D', margin: '16px 0 8px' }}>Race Complete!</h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You got <strong>{score}/10</strong> words right!
        </p>
        <div style={{ fontSize: 32, marginBottom: 28 }}>
          {'⭐'.repeat(Math.ceil(score / 3) || 1)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF9F43)', border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: '0 5px 0 #c9456e' }}>
            🏁 Race Again!
          </button>
          <button onClick={() => setShowRating(true)} style={{ background: '#FFD93D', border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#5a4a00', boxShadow: '0 5px 0 #c9a82e' }}>
            ⭐ Rate This Game
          </button>
          <button onClick={() => setPhase('menu')} style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Back to Menu
          </button>
        </div>
        {showRating && <RatingModal activity="bossy-r-racer" activityName="Bossy R Racer" activityEmoji="🏎️" kidName="Player" onClose={() => setShowRating(false)} />}
      </div>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────────────────────────
  if (!word) return null;

  const progress = (wordIdx / words.length);
  const rimeColor = { ar: '#FF6B9D', or: '#6BCB77', er: '#6BCBFF', ir: '#C084FC', ur: '#FF9F43' }[word.rime];
  const sentence = word.sentence.replace('[BLANK]', '____');

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>Word {wordIdx + 1}/10</span>
        <span style={{ fontSize: 13, fontFamily: 'Fredoka', fontWeight: 600, color: rimeColor }}>
          {word.rime.toUpperCase()} family
        </span>
      </div>

      <CarTrack progress={progress} />
      <ScoreHUD score={score} streak={streak} best={bestStreak} />

      <div
        key={qKey}
        style={{
          background: 'white', borderRadius: 24, padding: '28px 20px', marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 18, color: '#374151', fontFamily: 'Fredoka', lineHeight: 1.6, margin: '0 0 20px' }}>
          {sentence}
        </p>

        <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Fredoka', marginBottom: 16 }}>
          Tap the word that completes the sentence:
        </div>

        {/* Blank display */}
        <div style={{
          display: 'inline-block',
          background: '#F3F4F6',
          borderBottom: `3px solid ${rimeColor}`,
          borderRadius: '4px 4px 0 0',
          padding: '4px 24px',
          fontSize: 26, fontWeight: 700, fontFamily: 'Fredoka', color: rimeColor,
          minWidth: 120,
        }}>
          {feedback === 'correct' ? word.word : '????'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {choices.map(choice => (
          <CBtn
            key={choice}
            value={choice}
            onTap={() => handleAnswer(choice)}
            color={feedback === 'correct' && choice === word.word ? '#6BCB77'
              : wrongChoice === choice ? '#FCA5A5'
              : '#FF6B9D'}
            shadow={feedback === 'correct' && choice === word.word ? '#4fa05c'
              : wrongChoice === choice ? '#c95050'
              : '#c9456e'}
            disabled={feedback === 'correct'}
          />
        ))}
      </div>

      {feedback === 'wrong' && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 15, color: '#F87171', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
          The answer was: <strong>{word.word}</strong> ({word.rime} family) 💪
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}