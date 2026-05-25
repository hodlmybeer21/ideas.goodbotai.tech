'use client';
import { useState, useCallback, useEffect } from 'react';
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

// ─── Stories with Q&A ─────────────────────────────────────────────────────────
type Story = {
  title: string;
  emoji: string;
  paragraphs: string[];
  questions: { q: string; options: string[]; correct: number }[];
};

const STORIES: Story[] = [
  {
    title: 'The Lost Kitten',
    emoji: '🐱',
    paragraphs: [
      'Maya found a small kitten under the big oak tree in her backyard. The kitten was gray with white paws. It meowed softly and looked up at Maya with big green eyes.',
      'Maya ran inside to get a bowl of milk and a soft towel. She put the towel on the ground and set the milk down next to it. The kitten sniffed the milk and started to drink.',
      'Maya named the kitten Biscuit. Every morning, Biscuit would wait by Maya\'s bedroom door. They became best friends.',
    ],
    questions: [
      { q: 'Where did Maya find the kitten?', options: ['Under a tree', 'In the garage', 'At school', 'At the park'], correct: 0 },
      { q: 'What color was the kitten?', options: ['Orange', 'Gray with white paws', 'Black', 'White'], correct: 1 },
      { q: 'What did Maya name the kitten?', options: ['Milo', 'Biscuit', 'Cocoa', 'Shadow'], correct: 1 },
    ],
  },
  {
    title: 'The Science Fair',
    emoji: '🔬',
    paragraphs: [
      'Leo had been working on his science fair project for three weeks. He built a small robot that could follow a black line on the floor. He used a computer chip, two motors, and a light sensor.',
      'On the day of the fair, Leo set up his project at a table. Many students and teachers stopped by to look. Leo explained how the robot worked. His teacher, Ms. Rivera, said it was one of the best projects she had seen.',
      'Leo won first place and got a blue ribbon. He was very proud of what he built.',
    ],
    questions: [
      { q: 'What did Leo build?', options: ['A rocket', 'A robot that follows a line', 'A tree house', 'A painting'], correct: 1 },
      { q: 'How long did Leo work on his project?', options: ['One day', 'One week', 'Three weeks', 'Three months'], correct: 2 },
      { q: 'What did Leo win?', options: ['A trophy', 'A blue ribbon', 'A medal', 'A prize'], correct: 1 },
    ],
  },
  {
    title: 'The Rainy Day',
    emoji: '🌧️',
    paragraphs: [
      'It had been raining all morning. Sophie and her brother Marcus were stuck inside the house. They were bored. "Let\'s build a blanket fort," said Sophie.',
      'They took blankets and pillows from their rooms and put them over two chairs. Their fort had a tunnel entrance and a flag on top. They crawled inside and read books with flashlights.',
      'Their mom called them for lunch. "Our fort is the best thing ever!" said Marcus. Sophie smiled. Even though they couldn\'t go outside, they had fun.',
    ],
    questions: [
      { q: 'Why were Sophie and Marcus stuck inside?', options: ['They were sick', 'It was raining', 'They were grounded', 'It was snowing'], correct: 1 },
      { q: 'What did they build?', options: ['A treehouse', 'A snowman', 'A blanket fort', 'A sandcastle'], correct: 2 },
      { q: 'What did they do inside the fort?', options: ['Watched TV', 'Played video games', 'Read books with flashlights', 'Slept'], correct: 2 },
    ],
  },
  {
    title: 'The Garden Project',
    emoji: '🌱',
    paragraphs: [
      'Emma\'s class decided to plant a garden behind the school. Each student got a small plot of land. Emma chose to grow sunflowers because she loved how tall they could grow.',
      'She planted her seeds in April and watered them every day. Within two weeks, little green shoots appeared. Emma measured her sunflowers every Friday. They grew taller and taller.',
      'By July, Emma\'s sunflowers were taller than she was! She won the contest for the tallest plant in the class.',
    ],
    questions: [
      { q: 'What did Emma plant?', options: ['Tomatoes', 'Sunflowers', 'Carrots', 'Corn'], correct: 1 },
      { q: 'When did Emma plant her seeds?', options: ['January', 'March', 'April', 'June'], correct: 2 },
      { q: 'What did Emma win?', options: ['A trophy', 'A blue ribbon', 'A prize', 'A trophy and a prize'], correct: 1 },
    ],
  },
  {
    title: 'The Big Game',
    emoji: '⚽',
    paragraphs: [
      'It was the last minute of the soccer championship game. Noah\'s team was tied 1-1 with the Red Eagles. Noah was standing near the goal, ready to pass.',
      'The ball came to him. He kicked it hard, and it flew past the goalkeeper into the net. His teammates ran to him and cheered. They had won 2-1!',
      'After the game, Noah\'s coach said, "That was a great shot, Noah!" He felt proud of himself and his team.',
    ],
    questions: [
      { q: 'What was the score when Noah scored?', options: ['0-0', '1-1', '2-1', '0-1'], correct: 2 },
      { q: 'Who scored the winning goal?', options: ['The coach', 'Noah', 'The goalkeeper', 'Noah\'s teammate'], correct: 1 },
      { q: 'What did the coach say about Noah\'s shot?', options: ['It was too hard', 'It was too soft', 'It was great', 'He should have passed'], correct: 2 },
    ],
  },
];

// ─── Score HUD ─────────────────────────────────────────────────────────────────
function ScoreHUD({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, background: 'white', borderRadius: 16, padding: '10px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Fredoka' }}>Score</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#C084FC', fontFamily: 'Fredoka' }}>{score}</div>
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

// ─── Option button ─────────────────────────────────────────────────────────────
function OptBtn({ text, onTap, color, shadow, disabled, correct, wrong }: {
  text: string; onTap: () => void; color: string; shadow: string;
  disabled?: boolean; correct?: boolean; wrong?: boolean;
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
        background: correct ? '#6BCB77' : wrong ? '#FCA5A5' : disabled ? '#E5E0D8' : color,
        border: 'none', borderRadius: 14, padding: '14px 18px',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: correct ? 'white' : wrong ? 'white' : disabled ? '#94A3B8' : 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 4px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        width: '100%', textAlign: 'left',
      }}
    >
      {text}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function StoryQA({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'menu'|'story'|'win'>('menu');
  const [storyIdx, setStoryIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [wrongIdx, setWrongIdx] = useState<number|null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const story = STORIES[storyIdx];
  const question = story?.questions[qIdx];

  const shuffle = <T,>(a: T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  const startGame = useCallback(() => {
    const shuffledStories = shuffle([...STORIES]);
    setStoryIdx(0);
    setQIdx(0);
    setScore(0); setStreak(0);
    setFeedback(null); setWrongIdx(null);
    setPhase('story');
  }, []);

  const handleAnswer = useCallback((optIdx: number) => {
    if (!question || feedback === 'correct') return;
    if (optIdx === question.correct) {
      playCorrect();
      const ns = streak + 1;
      const nscore = score + 1;
      setStreak(ns); setScore(nscore);
      if (ns > bestStreak) setBestStreak(ns);
      if (nscore % 5 === 0) { playMilestone(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
      setFeedback('correct');
      setTimeout(() => {
        if (qIdx + 1 >= story.questions.length) {
          // Next story
          const nextIdx = storyIdx + 1;
          if (nextIdx >= STORIES.length) { playWin(); setPhase('win'); }
          else { setStoryIdx(nextIdx); setQIdx(0); setFeedback(null); setWrongIdx(null); }
        } else {
          setQIdx(i => i + 1);
          setFeedback(null); setWrongIdx(null);
        }
      }, 900);
    } else {
      playWrong();
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setWrongIdx(optIdx);
      setFeedback('wrong');
      setTimeout(() => { setFeedback(null); setWrongIdx(null); }, 1400);
    }
  }, [question, feedback, streak, score, bestStreak, qIdx, story, storyIdx]);

  // ── MENU ─────────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>📚</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#C084FC', margin: 0 }}>Story Q&A</h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: '8px 0 24px' }}>Read a short story, answer questions!</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#C084FC', fontSize: 18, marginBottom: 12, fontFamily: 'Fredoka' }}>How to Play 📖</h3>
          <p style={{ fontSize: 14, color: '#4B5563', fontFamily: 'Fredoka', lineHeight: 1.6, margin: 0 }}>
            📖 Read the story carefully<br />
            ❓ Answer 3 questions about it<br />
            ⭐ Get points for each correct answer!
          </p>
        </div>

        <div style={{ background: '#F3E8FF', borderRadius: 16, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#7C3AED', fontFamily: 'Fredoka', margin: 0 }}>
            <b>Stories included:</b> The Lost Kitten 🐱 · The Science Fair 🔬 · The Rainy Day 🌧️ · The Garden Project 🌱 · The Big Game ⚽
          </p>
        </div>

        <button
          onClick={startGame}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #C084FC, #FF6B9D)',
            border: 'none', borderRadius: 20, padding: '18px 24px',
            cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 20, color: 'white',
            boxShadow: '0 6px 0 #9660d4', transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
        >
          📖 Start Reading!
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
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#C084FC', margin: '16px 0 8px' }}>Reader Superstar!</h1>
        <p style={{ fontSize: 20, color: '#64748B', margin: '0 0 20px', fontFamily: 'Fredoka' }}>
          You got <strong>{score}/15</strong> questions right!
        </p>
        <div style={{ fontSize: 32, marginBottom: 28 }}>{'⭐'.repeat(Math.ceil(score / 3) || 1)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
          <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #C084FC, #FF6B9D)', border: 'none', borderRadius: 16, padding: '16px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 17, color: 'white', boxShadow: '0 5px 0 #9660d4' }}>
            📖 Read Again!
          </button>
          <button onClick={() => setShowRating(true)} style={{ background: '#FFD93D', border: 'none', borderRadius: 16, padding: '14px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 16, color: '#5a4a00', boxShadow: '0 5px 0 #c9a82e' }}>
            ⭐ Rate This Game
          </button>
          <button onClick={() => setPhase('menu')} style={{ background: '#E5E7EB', border: 'none', borderRadius: 16, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: '#6B7280' }}>
            ← Back to Menu
          </button>
        </div>
        {showRating && <RatingModal activity="story-qa" activityName="Story Q&A" activityEmoji="📚" kidName="Player" onClose={() => setShowRating(false)} />}
      </div>
    );
  }

  // ── STORY PHASE ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, background: '#FFF8F0', minHeight: '100vh' }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setPhase('menu')} className="back-btn">← Menu</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka' }}>Story {storyIdx + 1}/5</span>
        <span style={{ fontSize: 13, color: '#C084FC', fontFamily: 'Fredoka', fontWeight: 600 }}>
          Q{qIdx + 1}/3
        </span>
      </div>

      <ScoreHUD score={score} streak={streak} best={bestStreak} />

      {/* Story card */}
      <div style={{
        background: 'white', borderRadius: 24, padding: '24px 20px', marginBottom: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>{story.emoji}</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#C084FC', fontFamily: 'Fredoka', margin: 0 }}>{story.title}</h2>
        </div>
        {story.paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: 15, color: '#374151', fontFamily: 'Fredoka', lineHeight: 1.7, margin: '0 0 12px' }}>{p}</p>
        ))}
      </div>

      {/* Question card */}
      {question && (
        <div
          key={`${storyIdx}-${qIdx}`}
          style={{
            background: '#F3E8FF', borderRadius: 20, padding: '20px', marginBottom: 16,
            animation: shake ? 'shake 0.4s ease' : feedback === 'correct' ? 'pop 0.3s ease' : 'none',
            border: '2px solid #C084FC33',
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED', fontFamily: 'Fredoka', margin: '0 0 14px' }}>
            ❓ {question.q}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((opt, optIdx) => (
              <OptBtn
                key={optIdx}
                text={opt}
                onTap={() => handleAnswer(optIdx)}
                color="#C084FC"
                shadow="#9660d4"
                disabled={feedback === 'correct'}
                correct={feedback === 'correct' && optIdx === question.correct}
                wrong={wrongIdx === optIdx}
              />
            ))}
          </div>
        </div>
      )}

      {feedback === 'wrong' && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#F87171', fontFamily: 'Fredoka', animation: 'pop 0.3s ease' }}>
          The answer was: <strong>{question.options[question.correct]}</strong> 💪
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        @keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}