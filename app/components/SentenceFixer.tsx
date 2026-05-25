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
    id: i, left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 1.2}s`, size: Math.random() * 8 + 8,
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

// ─── Sentence fix problems ─────────────────────────────────────────────────────
type SentenceEntry = { text: string; hasError: boolean; errorType?: string; fix?: string };
type Problem = { sentences: SentenceEntry[]; errorIdx: number };

const PROBLEMS: Problem[] = [
  {
    sentences: [
      { text: 'the cat sat on the mat.', hasError: true, errorType: 'capital', fix: 'The' },
      { text: 'I like to read books.', hasError: false },
      { text: 'It is raining outside today.', hasError: false },
    ],
    errorIdx: 0,
  },
  {
    sentences: [
      { text: 'She loves to play soccer.', hasError: false },
      { text: 'my dog likes to run in the park.', hasError: true, errorType: 'capital', fix: 'My' },
      { text: 'We went to the zoo on Saturday.', hasError: false },
    ],
    errorIdx: 1,
  },
  {
    sentences: [
      { text: 'The sky is blue today.', hasError: false },
      { text: 'jake has a red bicycle.', hasError: true, errorType: 'capital', fix: 'Jake' },
      { text: 'They visited the museum last week.', hasError: false },
    ],
    errorIdx: 1,
  },
  {
    sentences: [
      { text: 'Mom made pancakes for breakfast.', hasError: false },
      { text: 'The birds sang in the trees.', hasError: false },
      { text: 'We played at the playground', hasError: true, errorType: 'punctuation', fix: 'playground.' },
    ],
    errorIdx: 2,
  },
  {
    sentences: [
      { text: 'my sister can ride a bike.', hasError: true, errorType: 'capital', fix: 'My' },
      { text: 'She is very brave.', hasError: false },
      { text: 'She also knows how to swim.', hasError: false },
    ],
    errorIdx: 0,
  },
  {
    sentences: [
      { text: 'The cookies taste delicious.', hasError: false },
      { text: 'dad baked them in the oven.', hasError: true, errorType: 'capital', fix: 'Dad' },
      { text: 'The whole family loved them.', hasError: false },
    ],
    errorIdx: 1,
  },
  {
    sentences: [
      { text: 'it was a sunny day at the beach.', hasError: true, errorType: 'capital', fix: 'It' },
      { text: 'We built a big sandcastle.', hasError: false },
      { text: 'The waves were loud and cold.', hasError: false },
    ],
    errorIdx: 0,
  },
  {
    sentences: [
      { text: 'We walked to the library.', hasError: false },
      { text: 'I found a book about dinosaurs.', hasError: false },
      { text: 'the book had colorful pictures.', hasError: true, errorType: 'capital', fix: 'The' },
    ],
    errorIdx: 2,
  },
  {
    sentences: [
      { text: 'maria plays piano every day.', hasError: true, errorType: 'capital', fix: 'Maria' },
      { text: 'She practices for one hour.', hasError: false },
      { text: 'Her music sounds very beautiful.', hasError: false },
    ],
    errorIdx: 0,
  },
  {
    sentences: [
      { text: 'The butterfly landed on a flower.', hasError: false },
      { text: 'tommy watched it from his window.', hasError: true, errorType: 'capital', fix: 'Tommy' },
      { text: 'He thought it was the prettiest insect ever.', hasError: false },
    ],
    errorIdx: 1,
  },
];

// ─── Score HUD ─────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, background: 'white', borderRadius: 16, padding: '10px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6BCB77', fontFamily: 'Fredoka' }}>{score}</div>
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

// ─── Main component ────────────────────────────────────────────────────────────
export default function SentenceFixer({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu'|'playing'|'win'>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [probIdx, setProbIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [qKey, setQKey] = useState(0);

  const problem = PROBLEMS[probIdx];

  const shuffle = <T,>(a: T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  const startGame = useCallback(() => {
    setProbIdx(0);
    setScore(0); setStreak(0);
    setSelectedIdx(null); setFeedback(null); setWrongIdx(null);
    setQKey(0); setPhase('playing');
  }, []);

  const handleSelect = useCallback((idx: number) => {
    if (feedback === 'correct') return;
    setSelectedIdx(idx);
    const isCorrect = idx === problem.errorIdx;
    if (isCorrect) {
      playCorrect();
      const ns = streak + 1;
      const nscore = score + 1;
      setStreak(ns); setScore(nscore);
      if (ns > bestStreak) setBestStreak(ns);
      if (nscore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => {
        if (probIdx + 1 >= PROBLEMS.length) { playWin(); setPhase('win'); }
        else { setProbIdx(i => i + 1); setSelectedIdx(null); setFeedback(null); setWrongIdx(null); setQKey(k => k + 1); }
      }, 900);
    } else {
      playWrong();
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setWrongIdx(idx);
      setFeedback('wrong');
      setTimeout(() => { setWrongIdx(null); setFeedback(null); setSelectedIdx(null); }, 1400);
    }
  }, [feedback, problem, streak, score, bestStreak, probIdx]);

  // ── MENU ─────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🔧</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#6BCB77', margin: 0 }}>Sentence Fixer</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px' }}>Spot the sentence that has a mistake!</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#6BCB77', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>How to Play 🔧</h3>
          <p style={{ fontSize: 14, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.6, margin: 0 }}>
            👀 Look at each sentence carefully<br />
            👆 Tap the one that has a mistake<br />
            🔤 Mistakes can be missing capitals or missing punctuation<br /><br />
            Get all 10 correct to win!
          </p>
        </div>

        <div style={{ background: '#F0FDF4', borderRadius: 16, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#15803D', fontFamily: 'Fredoka', margin: 0 }}>
            <b>Common mistakes to find:</b><br />
            🔤 Sentence starts with a lowercase letter<br />
            ⚠️ Sentence ends without a period
          </p>
        </div>

        <button
          onClick={startGame}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #6BCB77, #6BCBFF)',
            border: 'none', borderRadius: 20, padding: '18px 24px',
            cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: 'white',
            boxShadow: '0 6px 0 #4fa05c', transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          🔧 Start Fixing!
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
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#6BCB77', margin: '16px 0 8px' }}>Sentence Superstar!</h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You got <strong>{score}/10</strong> sentences right!
        </p>
        <div style={{ fontSize: 32, marginBottom: 28 }}>{'⭐'.repeat(Math.ceil(score / 3) || 1)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #6BCB77, #6BCBFF)', border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: '0 5px 0 #4fa05c' }}>
            🔧 Fix Again!
          </button>
          <button onClick={() => setShowRating(true)} style={{ background: '#FFD93D', border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#5a4a00', boxShadow: '0 5px 0 #c9a82e' }}>
            ⭐ Rate This Game
          </button>
          <button onClick={() => setPhase('menu')} style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Back to Menu
          </button>
        </div>
        {showRating && <RatingModal activity="sentence-fixer" activityName="Sentence Fixer" activityEmoji="🔧" kidName="Player" onClose={() => setShowRating(false)} />}
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>Sentence {probIdx + 1}/10</span>
        <span style={{ fontSize: 13, color: '#6BCB77', fontFamily: 'Fredoka', fontWeight: 600 }}>🔧 Find the mistake</span>
      </div>

      <ScoreHUD score={score} streak={streak} best={bestStreak} />

      <div
        key={qKey}
        style={{
          background: 'white', borderRadius: 24, padding: '24px 20px', marginBottom: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
        }}
      >
        <p style={{ fontSize: 14, color: '#64748B', fontFamily: 'Fredoka', margin: '0 0 16px', textAlign: 'center' }}>
          Tap the sentence that has a mistake 👆
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {problem.sentences.map((sent, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrectTarget = idx === problem.errorIdx;
            const isWrongPick = wrongIdx === idx;

            let bg = isSelected && feedback === 'wrong' ? '#FEE2E2' : isSelected && feedback === 'correct' && isCorrectTarget ? '#F0FDF4' : '#F9FAFB';
            let border = isSelected && feedback === 'wrong' ? '#EF4444' : isSelected && feedback === 'correct' ? '#16A34A' : '#E5E7EB';

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={feedback === 'correct'}
                style={{
                  background: bg,
                  border: `2px solid ${border}`,
                  borderRadius: 14, padding: '14px 18px',
                  cursor: feedback === 'correct' ? 'default' : 'pointer',
                  fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16,
                  color: '#374151', textAlign: 'left', transition: 'all 0.15s',
                  transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Fredoka', marginRight: 8 }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                {sent.text}
              </button>
            );
          })}
        </div>
      </div>

      {feedback === 'correct' && (
        <div style={{
          background: '#F0FDF4', border: '2px solid #16A34A', borderRadius: 14,
          padding: '12px 16px', textAlign: 'center', animation: 'pop 0.3s ease',
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#16A34A', fontFamily: 'Fredoka', margin: 0 }}>
            ✓ Great eye! That sentence has a mistake!
          </p>
        </div>
      )}

      {feedback === 'wrong' && (
        <div style={{
          background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: 14,
          padding: '12px 16px', textAlign: 'center', animation: 'pop 0.3s ease',
        }}>
          <p style={{ fontSize: 14, color: '#EF4444', fontFamily: 'Fredoka', margin: 0 }}>
            That's not the one with the mistake — try again next time! 💪
          </p>
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
