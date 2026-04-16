'use client';
import { useState } from 'react';
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
  topic: string;
  statement: string;
  isTrue: boolean;       // true = statement is TRUE, false = statement is FALSE
  funFact?: string;      // shown when kid gets it right
  explanation?: string;  // shown when kid gets it wrong
}

// ─── Question bank ─────────────────────────────────────────────────────────────
// Easy: simple illustrated facts — ages 4+
const EASY_QUESTIONS: Question[] = [
  { id: 'e1',  emoji: '🌞', topic: 'Nature',     statement: 'The sun shines during the day.', isTrue: true,  funFact: 'The sun always shines during the day!' },
  { id: 'e2',  emoji: '🌙', topic: 'Nature',     statement: 'The moon comes out only at night.', isTrue: true,  funFact: 'You can sometimes see the moon in the daytime too!' },
  { id: 'e3',  emoji: '🐦', topic: 'Animals',     statement: 'Birds have wings.', isTrue: true,  funFact: 'Wings are how birds fly!' },
  { id: 'e4',  emoji: '🐟', topic: 'Animals',     statement: 'Fish can swim.', isTrue: true,  funFact: 'Fish use their fins to swim!' },
  { id: 'e5',  emoji: '🦵', topic: 'Body',        statement: 'People have two legs.', isTrue: true,  funFact: 'Most people have two legs!' },
  { id: 'e6',  emoji: '👃', topic: 'Body',        statement: 'You breathe with your nose.', isTrue: true,  funFact: 'You can also breathe through your mouth!' },
  { id: 'e7',  emoji: '🌧️', topic: 'Nature',     statement: 'Rain makes puddles.', isTrue: true,  funFact: 'Puddles form when rain collects on the ground!' },
  { id: 'e8',  emoji: '🍎', topic: 'Nature',     statement: 'Apples grow on trees.', isTrue: true,  funFact: 'Apple trees grow apples!' },
  { id: 'e9',  emoji: '❄️', topic: 'Nature',     statement: 'Snow is white.', isTrue: true,  funFact: 'Fresh snow looks white!' },
  { id: 'e10', emoji: '🐶', topic: 'Animals',     statement: 'Dogs have four legs.', isTrue: true,  funFact: 'That\'s why dogs can run so fast!' },
  { id: 'e11', emoji: '🦋', topic: 'Animals',     statement: 'Butterflies have wings.', isTrue: true,  funFact: 'Beautiful wings are how butterflies fly!' },
  { id: 'e12', emoji: '🌸', topic: 'Nature',     statement: 'Flowers bloom in spring.', isTrue: true,  funFact: 'Spring is when lots of flowers wake up!' },
  { id: 'e13', emoji: '🐸', topic: 'Animals',     statement: 'Frogs live in or near water.', isTrue: true,  funFact: 'Frogs lay their eggs in water!' },
  { id: 'e14', emoji: '☁️', topic: 'Nature',     statement: 'Clouds float in the sky.', isTrue: true,  funFact: 'Clouds are made of tiny water drops!' },
  { id: 'e15', emoji: '🧁', topic: 'Food',        statement: 'Cupcakes are sweet.', isTrue: true,  funFact: 'Cupcakes have sugar in them!' },
  { id: 'e16', emoji: '🧊', topic: 'Science',     statement: 'Ice is cold.', isTrue: true,  funFact: 'Ice is frozen water — that\'s why it\'s so cold!' },
  { id: 'e17', emoji: '🌈', topic: 'Nature',     statement: 'Rainbows appear after rain.', isTrue: true,  funFact: 'Rainbows need both rain and sunshine!' },
  { id: 'e18', emoji: '🐄', topic: 'Animals',     statement: 'Cows give milk.', isTrue: true,  funFact: 'Farmers milk cows every day!' },
  { id: 'e19', emoji: '🥕', topic: 'Food',        statement: 'Carrots grow underground.', isTrue: true,  funFact: 'The leafy tops grow above the ground!' },
  { id: 'e20', emoji: '👋', topic: 'Body',        statement: 'You have two hands.', isTrue: true,  funFact: 'Each hand has five fingers!' },
  // FALSE statements
  { id: 'e21', emoji: '🐘', topic: 'Animals',     statement: 'Elephants can jump.', isTrue: false, explanation: 'Elephants are too big and heavy to jump!' },
  { id: 'e22', emoji: '🐠', topic: 'Animals',     statement: 'Fish can walk on land.', isTrue: false, explanation: 'Fish swim in water — they can\'t walk!' },
  { id: 'e23', emoji: '🌙', topic: 'Nature',     statement: 'The moon is made of cheese.', isTrue: false, explanation: 'The moon is made of rock!' },
  { id: 'e24', emoji: '🐔', topic: 'Animals',     statement: 'Chickens can fly.', isTrue: false, explanation: 'Chickens can only fly short distances!' },
  { id: 'e25', emoji: '❄️', topic: 'Nature',     statement: 'Snow is hot.', isTrue: false, explanation: 'Snow is frozen — it\'s very cold!' },
  { id: 'e26', emoji: '🐢', topic: 'Animals',     statement: 'Turtles are the fastest animals.', isTrue: false, explanation: 'Turtles are famously slow!' },
  { id: 'e27', emoji: '🌳', topic: 'Nature',     statement: 'Trees have legs.', isTrue: false, explanation: 'Trees have roots, not legs!' },
  { id: 'e28', emoji: '🐱', topic: 'Animals',     statement: 'Cats bark.', isTrue: false, explanation: 'Cats say meow, not bark!' },
  { id: 'e29', emoji: '🍎', topic: 'Food',        statement: 'Apples grow in the ocean.', isTrue: false, explanation: 'Apples grow on trees!' },
  { id: 'e30', emoji: '🌞', topic: 'Nature',     statement: 'The sun is cold.', isTrue: false, explanation: 'The sun is extremely hot!' },
];

// Medium: trickier facts
const MEDIUM_QUESTIONS: Question[] = [
  { id: 'm1',  emoji: '🦇', topic: 'Animals',     statement: 'Bats are completely blind.', isTrue: false, explanation: 'Bats can see — they just also use sounds to navigate!' },
  { id: 'm2',  emoji: '🐟', topic: 'Animals',     statement: 'Fish sleep with their eyes open.', isTrue: true,  funFact: 'Fish have no eyelids so they can\'t close their eyes!' },
  { id: 'm3',  emoji: '🦉', topic: 'Animals',     statement: 'Owls can turn their heads all the way around.', isTrue: false, explanation: 'Owls can turn about halfway — that\'s still impressive!' },
  { id: 'm4',  emoji: '🧈', topic: 'Food',        statement: 'Butter is made from plants.', isTrue: false, explanation: 'Butter comes from cow\'s milk!' },
  { id: 'm5',  emoji: '🍯', topic: 'Animals',     statement: 'Honey is made by bees.', isTrue: true,  funFact: 'Bees collect nectar and turn it into honey!' },
  { id: 'm6',  emoji: '🌵', topic: 'Nature',     statement: 'Cacti store water inside.', isTrue: true,  funFact: 'That\'s why cacti look so chubby!' },
  { id: 'm7',  emoji: '🦎', topic: 'Animals',     statement: 'Lizards can live forever.', isTrue: false, explanation: 'All animals get older and eventually pass away.' },
  { id: 'm8',  emoji: '🪱', topic: 'Animals',     statement: 'Worms like sunlight.', isTrue: false, explanation: 'Worms stay underground — sunlight dries them out!' },
  { id: 'm9',  emoji: '🦕', topic: 'Animals',     statement: 'All dinosaurs are extinct.', isTrue: false, explanation: 'Birds are actually living dinosaurs!' },
  { id: 'm10', emoji: '🍌', topic: 'Food',        statement: 'Bananas grow on trees.', isTrue: false, explanation: 'Bananas grow on very tall plants, not trees!' },
  { id: 'm11', emoji: '🧊', topic: 'Science',     statement: 'Ice is lighter than water.', isTrue: false, explanation: 'Ice floats on water because it\'s lighter — but it\'s still frozen water!' },
  { id: 'm12', emoji: '🌋', topic: 'Science',     statement: 'Only Earth has volcanoes.', isTrue: false, explanation: 'Other planets like Venus have volcanoes too!' },
  { id: 'm13', emoji: '🌊', topic: 'Nature',     statement: 'The ocean is always blue.', isTrue: false, explanation: 'The ocean can look blue, green, or even reddish!' },
  { id: 'm14', emoji: '🦴', topic: 'Body',        statement: 'Adults have more bones than babies.', isTrue: false, explanation: 'Babies are born with more bones — some fuse together as you grow!' },
  { id: 'm15', emoji: '🍇', topic: 'Food',        statement: 'Grapes grow on vines.', isTrue: true,  funFact: 'Vines climb up and grapes hang down in bunches!' },
];

// Hard: logic puzzles and nuanced statements
const HARD_QUESTIONS: Question[] = [
  { id: 'h1',  emoji: '🔢', topic: 'Math',        statement: 'The number 0 means there is nothing.', isTrue: true,  funFact: 'Zero is one of the most important numbers ever invented!' },
  { id: 'h2',  emoji: '🧠', topic: 'Science',     statement: 'Your brain never stops working, even while you sleep.', isTrue: true,  funFact: 'Your brain keeps you breathing and dreaming all night!' },
  { id: 'h3',  emoji: '🦠', topic: 'Science',     statement: 'All bacteria make you sick.', isTrue: false, explanation: 'Some bacteria are helpful — like the ones that digest your food!' },
  { id: 'h4',  emoji: '⚡', topic: 'Science',     statement: 'Lightning is faster than the fastest spaceship.', isTrue: true,  funFact: 'Lightning travels at 1/3 the speed of light!' },
  { id: 'h5',  emoji: '🌙', topic: 'Science',     statement: 'There is no gravity on the Moon.', isTrue: false, explanation: 'The Moon has gravity — it\'s just 1/6 of Earth\'s!' },
  { id: 'h6',  emoji: '🕷️', topic: 'Animals',     statement: 'Spiders have 6 legs.', isTrue: false, explanation: 'Spiders have 8 legs — that makes them different from insects!' },
  { id: 'h7',  emoji: '🫁', topic: 'Science',     statement: 'You breathe in oxygen and breathe out carbon dioxide.', isTrue: true,  funFact: 'Plants breathe in that CO2 and turn it back into oxygen!' },
  { id: 'h8',  emoji: '🌱', topic: 'Science',     statement: 'Plants eat sunlight to grow.', isTrue: true,  funFact: 'This is called photosynthesis — sunlight becomes plant food!' },
  { id: 'h9',  emoji: '🌍', topic: 'Science',     statement: 'Earth is a perfect sphere.', isTrue: false, explanation: 'Earth is slightly squished — it\'s called a "geoid" shape!' },
  { id: 'h10', emoji: '🦈', topic: 'Animals',     statement: 'All sharks are dangerous to humans.', isTrue: false, explanation: 'Most sharks never encounter humans and avoid us!' },
  { id: 'h11', emoji: '🔭', topic: 'Science',     statement: 'There are more stars in the sky than grains of sand on Earth.', isTrue: true,  funFact: 'There are about 10 billion trillion stars — way more than all the sand!' },
  { id: 'h12', emoji: '🧊', topic: 'Science',     statement: 'Antarctica is the coldest continent.', isTrue: true,  funFact: 'Antarctica can get as cold as -128°F!' },
  { id: 'h13', emoji: '🦕', topic: 'Animals',     statement: 'No dinosaurs had feathers.', isTrue: false, explanation: 'Some dinosaurs like Velociraptors had feathers!' },
  { id: 'h14', emoji: '💧', topic: 'Science',     statement: 'Water can exist as a solid, liquid, and gas.', isTrue: true,  funFact: 'That\'s ice (solid), water (liquid), and steam (gas)!' },
  { id: 'h15', emoji: '🗿', topic: 'History',     statement: 'The ancient Egyptians built the pyramids.', isTrue: true,  funFact: 'The Great Pyramid took about 20 years to build!' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Confetti ────────────────────────────────────────────────────────────────
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
export default function TrueFalse({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [totalQuestions] = useState(10);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`truefalse_best_${lvl}`) || '0', 10);
  };

  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`truefalse_best_${lvl}`, String(s));
  };

  const startGame = (lvl: Level) => {
    const pool = lvl === 'easy' ? EASY_QUESTIONS : lvl === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS;
    setQuestions(pickQuestions(pool, totalQuestions));
    setLevel(lvl);
    setQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setScreen('game');
  };

  const currentQ = questions[questionIndex];

  const handleAnswer = (pickedTrue: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(pickedTrue);

    const isCorrect = pickedTrue === currentQ.isTrue;
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
  };

  const resultsPct = Math.round((correctCount / totalQuestions) * 100);
  const stars = resultsPct >= 90 ? 3 : resultsPct >= 60 ? 2 : resultsPct >= 30 ? 1 : 0;

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

        <div style={{ fontSize: 64, marginBottom: 8 }}>✅❌</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#C084FC', margin: '0 0 8px', textAlign: 'center' }}>
          True or False?
        </h1>
        <p style={{ fontSize: 17, color: '#888', margin: '0 0 8px', textAlign: 'center', maxWidth: 300 }}>
          Is the statement true... or false?
        </p>
        <p style={{ fontSize: 14, color: '#ccc', margin: '0 0 32px', textAlign: 'center' }}>
          Tap ✅ for True · Tap ❌ for False
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          <LevelButton
            label="🌟 Easy — for ages 4+"
            emoji="🌟"
            color="#6BCB77" shadowColor="#388E3C"
            onClick={() => startGame('easy')}
            bestScore={bestEasy}
          />
          <LevelButton
            label="⭐ Medium — trickier facts"
            emoji="⭐"
            color="#C084FC" shadowColor="#7C3AED"
            onClick={() => startGame('medium')}
            bestScore={bestMedium}
          />
          <LevelButton
            label="🚀 Hard — logic puzzles"
            emoji="🚀"
            color="#FF9F43" shadowColor="#D97706"
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

          {stars === 3 && <div style={{ fontSize: 20, color: '#F59E0B', fontWeight: 700 }}>🌟 True/False Master! 🌟</div>}
          {stars === 2 && <div style={{ fontSize: 20, color: '#6BCB77', fontWeight: 700 }}>Great job!</div>}
          {stars === 1 && <div style={{ fontSize: 20, color: '#6BCBFF', fontWeight: 700 }}>Keep practicing!</div>}
          {stars === 0 && <div style={{ fontSize: 20, color: '#888', fontWeight: 700 }}>Try again!</div>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#6BCB77', color: '#fff',
              boxShadow: '0 6px 0 #388E3C', cursor: 'pointer',
            }}
            onClick={() => startGame(level)}
          >
            Play Again 🔄
          </button>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#C084FC', color: '#fff',
              boxShadow: '0 6px 0 #7C3AED', cursor: 'pointer',
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
                activity="true-or-false"
                activityName="True or False?"
                activityEmoji="✅❌"
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

  const isCorrect = selectedAnswer !== null && selectedAnswer === currentQ.isTrue;

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
            {currentQ.isTrue
              ? `True! ${currentQ.funFact}`
              : `True! ${currentQ.funFact}`}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C62828', marginBottom: 4 }}>
            🤖 Oops!
          </div>
          <div style={{ fontSize: 15, color: '#555' }}>
            {currentQ.isTrue
              ? `Nope — that was TRUE! ${currentQ.funFact}`
              : `Nope — that was FALSE! ${currentQ.explanation}`}
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
          background: '#6BCB77', color: '#fff',
          boxShadow: '0 6px 0 #388E3C', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 32 }}>✅</span>
        <span>True!</span>
      </button>
      <button
        onClick={() => handleAnswer(false)}
        style={{
          flex: 1, fontFamily: 'Fredoka', fontSize: 22, fontWeight: 700,
          padding: '20px 12px', border: 'none', borderRadius: 20,
          background: '#FF6B9D', color: '#fff',
          boxShadow: '0 6px 0 #E91E63', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 32 }}>❌</span>
        <span>False!</span>
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

      {/* Statement card */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 16, width: '100%', maxWidth: 340,
        transform: shake ? 'translateX(-6px)' : 'translateX(0)',
        transition: 'transform 0.1s',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>{currentQ.emoji}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#C084FC',
          background: '#F3E8FF', borderRadius: 8, padding: '4px 10px',
          display: 'inline-block', marginBottom: 14,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Is this true?
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>
          "{currentQ.statement}"
        </div>
      </div>

      {resultBanner}
      {answerButtons}
      {nextBtn}

      {/* Progress dots */}
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
