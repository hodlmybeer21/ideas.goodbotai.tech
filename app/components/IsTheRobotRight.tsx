'use client';
import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Audio ────────────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playCorrect() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
}

function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Level = 'easy' | 'medium' | 'hard';
type Screen = 'menu' | 'game' | 'results';

interface Question {
  id: string;
  emoji: string;
  topic: string;           // e.g. "Animals" or "Science"
  robotSays: string;       // the robot's claim
  isSilly: boolean;        // true = robot is wrong (silly), false = robot is right
  whySilly?: string;       // brief explanation for when it's silly
  funFact?: string;       // bonus fact for correct answers
}

// ─── Question bank ─────────────────────────────────────────────────────────────
// Easy: obviously wrong claims any 4-year-old can catch
const EASY_QUESTIONS: Question[] = [
  { id: 'e1', emoji: '🐱', topic: 'Animals', robotSays: 'Cats bark like dogs!', isSilly: true, whySilly: 'Cats say meow, not bark!' },
  { id: 'e2', emoji: '🌞', topic: 'Nature', robotSays: 'The sun is cold!', isSilly: true, whySilly: 'The sun is very, very hot!' },
  { id: 'e3', emoji: '🐦', topic: 'Animals', robotSays: 'Birds live underwater.', isSilly: true, whySilly: 'Birds live in trees and sky!' },
  { id: 'e4', emoji: '🐶', topic: 'Animals', robotSays: 'Dogs say meow.', isSilly: true, whySilly: 'Dogs say woof woof!' },
  { id: 'e5', emoji: '🌳', topic: 'Nature', robotSays: 'Trees have legs.', isSilly: true, whySilly: 'Trees have roots, not legs!' },
  { id: 'e6', emoji: '🐸', topic: 'Animals', robotSays: 'Frogs can fly.', isSilly: true, whySilly: 'Frogs jump but cannot fly!' },
  { id: 'e7', emoji: '🌙', topic: 'Nature', robotSays: 'The moon is made of cheese.', isSilly: true, whySilly: 'The moon is made of rock!' },
  { id: 'e8', emoji: '🐠', topic: 'Animals', robotSays: 'Fish can walk on land.', isSilly: true, whySilly: 'Fish swim in water, not walk!' },
  { id: 'e9', emoji: '🐄', topic: 'Animals', robotSays: 'Cows say oink.', isSilly: true, whySilly: 'Cows say moo!' },
  { id: 'e10', emoji: '🍎', topic: 'Nature', robotSays: 'Apples grow on the ground.', isSilly: true, whySilly: 'Apples grow on trees!' },
  { id: 'e11', emoji: '🐘', topic: 'Animals', robotSays: 'Elephants can jump.', isSilly: true, whySilly: 'Elephants are too big to jump!' },
  { id: 'e12', emoji: '❄️', topic: 'Nature', robotSays: 'Snow is always blue.', isSilly: true, whySilly: 'Snow is white!' },
  { id: 'e13', emoji: '🦋', topic: 'Animals', robotSays: 'Butterflies have 10 wings.', isSilly: true, whySilly: 'Butterflies have 4 wings!' },
  { id: 'e14', emoji: '🐢', topic: 'Animals', robotSays: 'Turtles can run very fast.', isSilly: true, whySilly: 'Turtles are slow and steady!' },
  { id: 'e15', emoji: '🌈', topic: 'Nature', robotSays: 'Rainbows are made of candy.', isSilly: true, whySilly: 'Rainbows are made of light!' },
  { id: 'e16', emoji: '🐰', topic: 'Animals', robotSays: 'Bunnies say woof.', isSilly: true, whySilly: 'Bunnies say thump their feet or squeak!' },
  { id: 'e17', emoji: '🐻', topic: 'Animals', robotSays: 'Bears only eat plants.', isSilly: false, funFact: 'Bears eat fish and honey too!' },
  { id: 'e18', emoji: '🐔', topic: 'Animals', robotSays: 'Chickens can swim.', isSilly: false, funFact: 'Chickens can paddle a little!' },
  { id: 'e19', emoji: '🌸', topic: 'Nature', robotSays: 'Flowers make seeds.', isSilly: false, funFact: 'Seeds grow into new plants!' },
  { id: 'e20', emoji: '⭐', topic: 'Nature', robotSays: 'Stars come out at night.', isSilly: false, funFact: 'Stars are always there — you just see them more at night!' },
];

// Medium: trickier or more abstract claims
const MEDIUM_QUESTIONS: Question[] = [
  { id: 'm1', emoji: '🦇', topic: 'Animals', robotSays: 'Bats are totally blind.', isSilly: true, whySilly: 'Bats can see — they just use sounds to find their way too!' },
  { id: 'm2', emoji: '🐟', topic: 'Animals', robotSays: 'Fish sleep with their eyes open.', isSilly: false, funFact: 'Fish don\'t have eyelids so they sleep with eyes open!' },
  { id: 'm3', emoji: '🧈', topic: 'Science', robotSays: 'Butter is made from plants.', isSilly: true, whySilly: 'Butter comes from cow\'s milk!' },
  { id: 'm4', emoji: '🪨', topic: 'Science', robotSays: 'Rocks are always hard.', isSilly: true, whySilly: 'Some rocks like talc are soft!' },
  { id: 'm5', emoji: '🍯', topic: 'Animals', robotSays: 'Honey comes from flowers.', isSilly: true, whySilly: 'Bees make honey from flower nectar!' },
  { id: 'm6', emoji: '🌵', topic: 'Nature', robotSays: 'Cacti store water inside.', isSilly: false, funFact: 'That\'s why they look chubby!' },
  { id: 'm7', emoji: '🦎', topic: 'Animals', robotSays: 'Lizards can live forever.', isSilly: true, whySilly: 'All animals get older and eventually pass away.' },
  { id: 'm8', emoji: '🧊', topic: 'Science', robotSays: 'Ice is frozen water.', isSilly: false, funFact: 'When water gets very cold it turns into ice!' },
  { id: 'm9', emoji: '🦉', topic: 'Animals', robotSays: 'Owls can turn their heads all the way around.', isSilly: true, whySilly: 'Owls can turn halfway around — that\'s still pretty impressive!' },
  { id: 'm10', emoji: '🍌', topic: 'Nature', robotSays: 'Bananas grow on trees.', isSilly: true, whySilly: 'Bananas grow on very tall plants, not trees!' },
  { id: 'm11', emoji: '🪱', topic: 'Animals', robotSays: 'Worms like sunlight.', isSilly: true, whySilly: 'Worms stay underground — sunlight hurts them!' },
  { id: 'm12', emoji: '🌋', topic: 'Science', robotSays: 'Volcanoes are only on Earth.', isSilly: true, whySilly: 'Other planets like Venus have volcanoes too!' },
  { id: 'm13', emoji: '🦕', topic: 'Animals', robotSays: 'No dinosaurs had feathers.', isSilly: true, whySilly: 'Some dinosaurs had feathers — like Velociraptors!' },
  { id: 'm14', emoji: '🌊', topic: 'Nature', robotSays: 'The ocean is only one color.', isSilly: true, whySilly: 'The ocean can be blue, green, even red!' },
  { id: 'm15', emoji: '🍇', topic: 'Nature', robotSays: 'Grapes grow on vines.', isSilly: false, funFact: 'Vines climb up and grapes hang down!' },
];

// Hard: more nuanced or absurdist AI-style claims
const HARD_QUESTIONS: Question[] = [
  { id: 'h1', emoji: '🤖', topic: 'AI', robotSays: 'I learned everything by reading every book in the world in 1 second.', isSilly: true, whySilly: 'Even robots take time to learn!' },
  { id: 'h2', emoji: '🧠', topic: 'Science', robotSays: 'Your brain never stops learning, even while you sleep.', isSilly: false, funFact: 'Your brain keeps making memories while you rest!' },
  { id: 'h3', emoji: '🔢', topic: 'Math', robotSays: 'The number 4 smells like fresh paint.', isSilly: true, whySilly: 'Numbers don\'t have a smell — only things you can touch do!' },
  { id: 'h4', emoji: '🎨', topic: 'AI', robotSays: 'I can draw a picture that makes you feel happy.', isSilly: false, funFact: 'Art can absolutely change how you feel!' },
  { id: 'h5', emoji: '🌍', topic: 'Science', robotSays: 'The Earth is exactly the same shape as a perfect ball.', isSilly: true, whySilly: 'Earth is slightly squished — a "geoid" shape!' },
  { id: 'h6', emoji: '🦠', topic: 'Science', robotSays: 'Bacteria are always bad for you.', isSilly: true, whySilly: 'Some bacteria help us digest food and stay healthy!' },
  { id: 'h7', emoji: '⚡', topic: 'Science', robotSays: 'Lightning is faster than the fastest spaceship.', isSilly: false, funFact: 'Lightning travels at 1/3 the speed of light!' },
  { id: 'h8', emoji: '🌙', topic: 'Science', robotSays: 'There is no gravity on the Moon.', isSilly: true, whySilly: 'The Moon has gravity — it\'s just 1/6 of Earth\'s!' },
  { id: 'h9', emoji: '🤖', topic: 'AI', robotSays: 'I understand what "feeling blue" means because I feel it.', isSilly: true, whySilly: 'Robots don\'t have real feelings — humans do!' },
  { id: 'h10', emoji: '🕷️', topic: 'Animals', robotSays: 'Spiders have 6 legs.', isSilly: true, whySilly: 'Spiders have 8 legs!' },
  { id: 'h11', emoji: '🫁', topic: 'Science', robotSays: 'Humans breathe out more carbon dioxide than oxygen.', isSilly: false, funFact: 'We exhale CO2 and plants turn it back into oxygen!' },
  { id: 'h12', emoji: '🎓', topic: 'AI', robotSays: 'I always tell the truth.', isSilly: true, whySilly: 'AI can make mistakes and say wrong things!' },
  { id: 'h13', emoji: '🗿', topic: 'History', robotSays: 'The ancient Egyptians used smartphones.', isSilly: true, whySilly: 'Smartphones were invented in the 2000s!' },
  { id: 'h14', emoji: '🦈', topic: 'Animals', robotSays: 'All sharks are dangerous to humans.', isSilly: true, whySilly: 'Most sharks never encounter humans and avoid us!' },
  { id: 'h15', emoji: '🌱', topic: 'Science', robotSays: 'Plants eat sunlight to grow.', isSilly: false, funFact: 'This is called photosynthesis — plants turn sunlight into food!' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(pool: Question[], count: number): Question[] {
  return shuffle(pool).slice(0, count);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 0.5}s`,
    size: Math.random() * 8 + 8,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-20px', left: p.left,
          width: p.size, height: p.size * 2, background: p.color,
          borderRadius: 2, animation: `confettiFall 1.5s ${p.delay} forwards`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

// ─── Level button ─────────────────────────────────────────────────────────────
function LevelButton({ label, emoji, color, shadowColor, onClick, bestScore }: {
  label: string; emoji: string; color: string; shadowColor: string; onClick: () => void; bestScore?: number;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      style={{
        fontFamily: 'Fredoka', fontSize: 18, fontWeight: 600,
        padding: '16px 24px', border: 'none', borderRadius: 16,
        background: color, color: '#fff',
        boxShadow: `0 6px 0 ${shadowColor}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        cursor: 'pointer', transition: 'transform 0.1s',
        width: '100%', textAlign: 'left',
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <span style={{ marginRight: 10 }}>{emoji}</span>
      {label}
      {bestScore !== undefined && bestScore > 0 && (
        <span style={{ marginLeft: 12, opacity: 0.9, fontSize: 15 }}>🏆 {bestScore}</span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IsTheRobotRight({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null); // true = right, false = silly
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [totalQuestions] = useState(10);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`robotright_best_${lvl}`) || '0', 10);
  };

  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`robotright_best_${lvl}`, String(s));
  };

  const startGame = (lvl: Level) => {
    const pool = lvl === 'easy' ? EASY_QUESTIONS : lvl === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS;
    setQuestions(pickQuestions(pool, totalQuestions));
    setLevel(lvl);
    setQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScreen('game');
  };

  const currentQ = questions[questionIndex];

  const handleAnswer = (pickedSilly: boolean) => {
    if (showResult) return;
    setSelectedAnswer(pickedSilly);
    setShowResult(true);

    const isCorrect = pickedSilly === currentQ.isSilly;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrectCount(c => c + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      playCorrect();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      playWrong();
    }
  };

  const advanceQuestion = () => {
    if (questionIndex + 1 >= totalQuestions) {
      setScreen('results');
      return;
    }
    setQuestionIndex(i => i + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const resultsPct = Math.round((correctCount / totalQuestions) * 100);
  const stars = resultsPct >= 90 ? 3 : resultsPct >= 60 ? 2 : resultsPct >= 30 ? 1 : 0;

  // Save best score on results
  if (screen === 'results' && correctCount > 0) {
    saveBestScore(level, correctCount);
  }

  // ─── MENU ────────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    const bestEasy = getBestScore('easy');
    const bestMedium = getBestScore('medium');
    const bestHard = getBestScore('hard');

    return (
      <div style={{
        fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 20, left: 20,
          fontFamily: 'Fredoka', fontSize: 16, background: 'none',
          border: 'none', cursor: 'pointer', color: '#aaa',
        }}>← Back</button>

        <div style={{ fontSize: 64, marginBottom: 8 }}>🤖</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#C084FC', margin: '0 0 8px', textAlign: 'center' }}>
          Is the Robot Right?
        </h1>
        <p style={{ fontSize: 17, color: '#888', margin: '0 0 8px', textAlign: 'center', maxWidth: 300 }}>
          The robot says something. Is it right... or silly?
        </p>
        <p style={{ fontSize: 14, color: '#ccc', margin: '0 0 32px', textAlign: 'center' }}>
          Tap ✅ if it's right · Tap ❌ if it's silly
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          <LevelButton
            label="🌟 Easy — for ages 4+"
            emoji="🌟"
            color="#C084FC" shadowColor="#7C3AED"
            onClick={() => startGame('easy')}
            bestScore={bestEasy}
          />
          <LevelButton
            label="⭐ Medium — trickier facts"
            emoji="⭐"
            color="#8B5CF6" shadowColor="#6D28D9"
            onClick={() => startGame('medium')}
            bestScore={bestMedium}
          />
          <LevelButton
            label="🚀 Hard — spot the AI nonsense!"
            emoji="🚀"
            color="#F59E0B" shadowColor="#D97706"
            onClick={() => startGame('hard')}
            bestScore={bestHard}
          />
        </div>

        <button onClick={onBack} style={{
          marginTop: 28, fontFamily: 'Fredoka', fontSize: 15,
          background: 'none', border: 'none', cursor: 'pointer', color: '#ccc',
        }}>← Back to Home</button>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────────
  if (screen === 'results') {
    return (
      <div style={{
        fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <Confetti active={stars === 3} />
        <div style={{ fontSize: 80, marginBottom: 8 }}>
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : stars === 1 ? '👍' : '💪'}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#333', margin: '0 0 24px', textAlign: 'center' }}>
          {kidName ? `${kidName}, ` : ''}You finished!
        </h1>

        <div style={{
          background: '#fff', borderRadius: 24, padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 280,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#C084FC' }}>{correctCount}/{totalQuestions}</div>
          <div style={{ fontSize: 18, color: '#888' }}>correct</div>

          <div style={{ fontSize: 64, margin: '16px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          {stars === 3 && <div style={{ fontSize: 20, color: '#F59E0B', fontWeight: 700 }}>🤖 Robot Master! 🤖</div>}
          {stars === 2 && <div style={{ fontSize: 20, color: '#6BCB77', fontWeight: 700 }}>Great detective work!</div>}
          {stars === 1 && <div style={{ fontSize: 20, color: '#6BCBFF', fontWeight: 700 }}>Keep practicing!</div>}
          {stars === 0 && <div style={{ fontSize: 20, color: '#888', fontWeight: 700 }}>Try again!</div>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#C084FC', color: '#fff',
              boxShadow: '0 6px 0 #7C3AED', cursor: 'pointer',
            }}
            onClick={() => startGame(level)}
          >
            Play Again 🔄
          </button>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#8B5CF6', color: '#fff',
              boxShadow: '0 6px 0 #6D28D9', cursor: 'pointer',
            }}
            onClick={() => setScreen('menu')}
          >
            Pick Level 📋
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{
              fontFamily: 'Fredoka', fontSize: 16, background: 'none',
              border: 'none', cursor: 'pointer', color: '#888',
            }}
          >
            ← Back to Home
          </button>
        </div>

        {correctCount >= 7 && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setRatingModalOpen(true)}
              style={{
                fontFamily: 'Fredoka', fontSize: 15, background: 'none',
                border: 'none', cursor: 'pointer', color: '#ccc', textDecoration: 'underline',
              }}
            >
              Rate this activity
            </button>
            {ratingModalOpen && (
              <RatingModal
                activity="is-the-robot-right"
                activityName="Is the Robot Right?"
                activityEmoji="🤖"
                onClose={() => setRatingModalOpen(false)}
                kidName={kidName}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── GAME ───────────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const resultColor = selectedAnswer !== null
    ? (selectedAnswer === currentQ.isSilly ? '#6BCB77' : '#FF6B9D')
    : undefined;

  // isCorrect: did the kid's answer match reality?
  // selectedAnswer=true  = kid said "robot is silly"
  // selectedAnswer=false = kid said "robot is right"
  // currentQ.isSilly=true  = robot's claim IS wrong
  // currentQ.isSilly=false = robot's claim IS right
  const isCorrect = selectedAnswer === currentQ.isSilly;

  const resultBanner = selectedAnswer !== null ? (
    <div style={{
      background: isCorrect ? '#E8F5E9' : '#FFF0F0',
      borderRadius: 16, padding: '14px 20px', marginBottom: 12,
      textAlign: 'center', width: '100%', maxWidth: 340,
      border: `2px solid ${isCorrect ? '#6BCB77' : '#FF6B9D'}`,
    }}>
      {isCorrect ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>
            🎉 {kidName ? `${kidName}, ` : ''}You got it!
          </div>
          <div style={{ fontSize: 15, color: '#555' }}>
            {currentQ.isSilly
              ? `Silly robot! ${currentQ.whySilly}`
              : `Correct! ${currentQ.funFact}`}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C62828', marginBottom: 4 }}>
            🤖 Oops!
          </div>
          <div style={{ fontSize: 15, color: '#555' }}>
            {currentQ.isSilly
              ? `Nope — the robot was wrong! ${currentQ.whySilly}`
              : `Nope — the robot was right! ${currentQ.funFact}`}
          </div>
        </>
      )}
    </div>
  ) : null;

  const nextBtn = selectedAnswer !== null ? (
    <button
      onClick={advanceQuestion}
      style={{
        fontFamily: 'Fredoka', fontSize: 20, fontWeight: 700,
        padding: '16px 40px', border: 'none', borderRadius: 20,
        background: '#C084FC', color: '#fff',
        boxShadow: '0 6px 0 #7C3AED', cursor: 'pointer',
        marginTop: 8,
      }}
    >
      {questionIndex + 1 >= totalQuestions ? 'See Results 🎉' : 'Next Question →'}
    </button>
  ) : null;

  const answerButtons = selectedAnswer === null ? (
    <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 340, marginTop: 8 }}>
      <button
        onClick={() => handleAnswer(true)}
        style={{
          flex: 1, fontFamily: 'Fredoka', fontSize: 22, fontWeight: 700,
          padding: '20px 12px', border: 'none', borderRadius: 20,
          background: '#FF6B9D', color: '#fff',
          boxShadow: '0 6px 0 #E91E63', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 32 }}>❌</span>
        <span>That's Silly!</span>
      </button>
      <button
        onClick={() => handleAnswer(false)}
        style={{
          flex: 1, fontFamily: 'Fredoka', fontSize: 22, fontWeight: 700,
          padding: '20px 12px', border: 'none', borderRadius: 20,
          background: '#6BCB77', color: '#fff',
          boxShadow: '0 6px 0 #388E3C', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 32 }}>✅</span>
        <span>That's Right!</span>
      </button>
    </div>
  ) : null;

  return (
    <div style={{
      fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
      padding: '16px 16px 32px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 0,
    }}>
      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={() => setScreen('menu')}
          style={{
            fontFamily: 'Fredoka', fontSize: 15, background: 'none',
            border: 'none', cursor: 'pointer', color: '#aaa',
          }}
        >
          ← Back
        </button>
        <div style={{
          fontSize: 14, color: '#aaa',
          background: '#fff', borderRadius: 20, padding: '4px 14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          Q{questionIndex + 1} of {totalQuestions}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>⭐ {score}</div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 320, height: 8, background: '#F3E8FF', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#C084FC', borderRadius: 4,
          width: `${(questionIndex / totalQuestions) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Level badge */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#C084FC',
        background: '#F3E8FF', borderRadius: 20, padding: '4px 14px', marginBottom: 16,
      }}>
        {level === 'easy' ? '🌟 Easy' : level === 'medium' ? '⭐ Medium' : '🚀 Hard'} — {currentQ.topic}
      </div>

      {/* Robot card */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 16, width: '100%', maxWidth: 340,
        transform: shake ? 'translateX(-6px)' : 'translateX(0)',
        transition: 'transform 0.1s',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{currentQ.emoji}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#C084FC',
          background: '#F3E8FF', borderRadius: 8, padding: '4px 10px',
          display: 'inline-block', marginBottom: 14,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          🤖 The Robot Says:
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>
          "{currentQ.robotSays}"
        </div>
      </div>

      {resultBanner}
      {answerButtons}
      {nextBtn}

      {/* Score tracker */}
      <div style={{
        marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {questions.map((q, i) => {
          let dot = '#E2E8F0';
          if (i < questionIndex) dot = '#6BCB77';
          if (i === questionIndex) dot = '#C084FC';
          return (
            <div key={q.id} style={{
              width: 10, height: 10, borderRadius: '50%', background: dot,
            }} />
          );
        })}
      </div>
    </div>
  );
}
