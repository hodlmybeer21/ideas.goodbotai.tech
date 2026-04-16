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
  sentence: string;       // e.g. "The dog ___ on the floor."
  blank: string;          // the correct answer word
  options: string[];      // all choices including correct
  funFact?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Question bank ─────────────────────────────────────────────────────────────
// Easy: simple present tense, concrete vocabulary — ages 4-6
const EASY_QUESTIONS: Question[] = [
  { id: 'e1',  emoji: '🐕', topic: 'Animals',    sentence: 'The dog ___ on the floor.', blank: 'sleeps',  options: ['sleeps', 'flies', 'drives', 'sings'] },
  { id: 'e2',  emoji: '🐦', topic: 'Animals',    sentence: 'The bird ___ in the sky.', blank: 'flies',   options: ['flies', 'swims', 'runs', 'dances'] },
  { id: 'e3',  emoji: '🍎', topic: 'Food',       sentence: 'We ___ apples every day.', blank: 'eat',     options: ['eat', 'drive', 'fly', 'sing'] },
  { id: 'e4',  emoji: '📚', topic: 'School',    sentence: 'I ___ books at school.', blank: 'read',    options: ['read', 'drive', 'swim', 'fly'] },
  { id: 'e5',  emoji: '👟', topic: 'Clothes',    sentence: 'I put on my ___ to run.', blank: 'shoes',   options: ['shoes', 'hat', 'book', 'car'] },
  { id: 'e6',  emoji: '🌧️', topic: 'Nature',    sentence: 'When it rains, the ground gets ___.', blank: 'wet', options: ['wet', 'dry', 'hot', 'soft'] },
  { id: 'e7',  emoji: '🐱', topic: 'Animals',    sentence: 'The cat says ___!', blank: 'meow',    options: ['meow', 'woof', 'moo', 'quack'] },
  { id: 'e8',  emoji: '☀️', topic: 'Nature',    sentence: 'The sun shines during the ___.', blank: 'day',   options: ['day', 'night', 'winter', 'moon'] },
  { id: 'e9',  emoji: '🥛', topic: 'Food',       sentence: 'I drink ___ every morning.', blank: 'milk',   options: ['milk', 'water', 'juice', 'soda'] },
  { id: 'e10', emoji: '🎨', topic: 'School',    sentence: 'I use crayons to ___ pictures.', blank: 'draw',   options: ['draw', 'drive', 'eat', 'drink'] },
  { id: 'e11', emoji: '🏠', topic: 'Home',      sentence: 'My ___ is where I sleep.', blank: 'bed',     options: ['bed', 'car', 'tree', 'sky'] },
  { id: 'e12', emoji: '🧸', topic: 'Toys',        sentence: 'The teddy bear is a soft ___.', blank: 'toy',    options: ['toy', 'food', 'car', 'book'] },
  { id: 'e13', emoji: '🐸', topic: 'Animals',    sentence: 'The frog can ___ very high.', blank: 'jump',   options: ['jump', 'fly', 'drive', 'cook'] },
  { id: 'e14', emoji: '🍳', topic: 'Food',       sentence: 'You cook food on the ___.', blank: 'stove',   options: ['stove', 'bed', 'tree', 'car'] },
  { id: 'e15', emoji: '🚗', topic: 'Things',     sentence: 'A ___ has four wheels.', blank: 'car',     options: ['car', 'boat', 'bike', 'plane'] },
  { id: 'e16', emoji: '🌸', topic: 'Nature',    sentence: 'In spring, ___ start to grow.', blank: 'flowers', options: ['flowers', 'snow', 'ice', 'coats'] },
  { id: 'e17', emoji: '👨‍👩‍👧', topic: 'Family',   sentence: 'My mom and dad are my ___.', blank: 'family', options: ['family', 'friends', 'teachers', 'pets'] },
  { id: 'e18', emoji: '🔔', topic: 'Things',     sentence: 'When you ring a bell, it makes a ___.', blank: 'sound', options: ['sound', 'color', 'taste', 'smell'] },
  { id: 'e19', emoji: '🛁', topic: 'Home',      sentence: 'You wash in the ___.', blank: 'bathtub', options: ['bathtub', 'kitchen', 'garden', 'car'] },
  { id: 'e20', emoji: '🌙', topic: 'Nature',    sentence: 'At night, the ___ comes out.', blank: 'moon',   options: ['moon', 'sun', 'rain', 'flower'] },
  { id: 'e21', emoji: '🐄', topic: 'Animals',    sentence: 'The cow says ___.', blank: 'moo',     options: ['moo', 'meow', 'quack', 'bark'] },
  { id: 'e22', emoji: '🚲', topic: 'Things',     sentence: 'I pedal my ___ to go fast.', blank: 'bike',   options: ['bike', 'boat', 'plane', 'train'] },
  { id: 'e23', emoji: '🥕', topic: 'Food',       sentence: 'A ___ is orange and grows in the ground.', blank: 'carrot', options: ['carrot', 'apple', 'banana', 'grape'] },
  { id: 'e24', emoji: '❄️', topic: 'Nature',    sentence: 'When it is very cold, water turns to ___.', blank: 'ice', options: ['ice', 'fire', 'air', 'mud'] },
  { id: 'e25', emoji: '👂', topic: 'Body',        sentence: 'We use our ___ to hear sounds.', blank: 'ears',   options: ['ears', 'eyes', 'nose', 'mouth'] },
  { id: 'e26', emoji: '🌈', topic: 'Nature',    sentence: 'After rain, a ___ might appear.', blank: 'rainbow', options: ['rainbow', 'sun', 'snow', 'storm'] },
  { id: 'e27', emoji: '📖', topic: 'School',    sentence: 'A ___ tells a story.', blank: 'book',   options: ['book', 'car', 'shoe', 'table'] },
  { id: 'e28', emoji: '🏊', topic: 'Action',    sentence: 'You ___ in a pool.', blank: 'swim',   options: ['swim', 'fly', 'drive', 'run'] },
  { id: 'e29', emoji: '🧁', topic: 'Food',       sentence: 'A cupcake is a sweet ___.', blank: 'treat',   options: ['treat', 'toy', 'book', 'animal'] },
  { id: 'e30', emoji: '👟', topic: 'Clothes',    sentence: 'You wear ___ on your feet.', blank: 'shoes',   options: ['shoes', 'hat', 'gloves', 'scarf'] },
];

// Medium: verbs with tense, prepositions, basic grammar — ages 6-8
const MEDIUM_QUESTIONS: Question[] = [
  { id: 'm1',  emoji: '🦷', topic: 'Health',     sentence: 'I ___ my teeth every morning.', blank: 'brush',   options: ['brush', 'drive', 'eat', 'sleep'] },
  { id: 'm2',  emoji: '🎒', topic: 'School',    sentence: 'I carry my books in a ___.', blank: 'backpack', options: ['backpack', 'pocket', 'shoe', 'cup'] },
  { id: 'm3',  emoji: '🌧️', topic: 'Nature',    sentence: 'It ___ a lot in the spring.', blank: 'rains',   options: ['rains', 'snows', 'burns', 'drives'] },
  { id: 'm4',  emoji: '🏀', topic: 'Sports',     sentence: 'You ___ a ball into a hoop.', blank: 'shoots',  options: ['shoots', 'reads', 'cooks', 'draws'] },
  { id: 'm5',  emoji: '🐛', topic: 'Animals',    sentence: 'A caterpillar ___ into a butterfly.', blank: 'changes', options: ['changes', 'swims', 'flies', 'drives'] },
  { id: 'm6',  emoji: '🍳', topic: 'Food',       sentence: 'An egg ___ when you cook it.', blank: 'changes',  options: ['changes', 'sleeps', 'drives', 'flies'] },
  { id: 'm7',  emoji: '📝', topic: 'School',    sentence: 'I ___ my homework at my desk.', blank: 'do',      options: ['do', 'eat', 'play', 'sleep'] },
  { id: 'm8',  emoji: '🌙', topic: 'Nature',    sentence: 'The moon shines at ___.', blank: 'night',   options: ['night', 'morning', 'noon', 'summer'] },
  { id: 'm9',  emoji: '👨‍🍳', topic: 'Food',       sentence: 'A chef ___ delicious food.', blank: 'cooks',   options: ['cooks', 'drives', 'builds', 'sings'] },
  { id: 'm10', emoji: '✏️', topic: 'School',    sentence: 'I use an eraser to ___ mistakes.', blank: 'fix',     options: ['fix', 'make', 'eat', 'drive'] },
  { id: 'm11', emoji: '🚶', topic: 'Action',    sentence: 'A turtle ___ very slowly.', blank: 'walks',   options: ['walks', 'runs', 'flies', 'drives'] },
  { id: 'm12', emoji: '🌡️', topic: 'Science',   sentence: 'When it is hot, ice ___', blank: 'melts',   options: ['melts', 'freezes', 'burns', 'grows'] },
  { id: 'm13', emoji: '🏠', topic: 'Home',      sentence: 'We keep food cold in the ___.', blank: 'fridge',  options: ['fridge', 'oven', 'bathtub', 'garage'] },
  { id: 'm14', emoji: '🎵', topic: 'Music',       sentence: 'A piano can ___ beautiful music.', blank: 'play',    options: ['play', 'cook', 'build', 'draw'] },
  { id: 'm15', emoji: '📅', topic: 'Time',       sentence: 'There are seven days in a ___.', blank: 'week',    options: ['week', 'month', 'year', 'hour'] },
  { id: 'm16', emoji: '🌳', topic: 'Nature',    sentence: 'A tree has a thick ___ in the middle.', blank: 'trunk',  options: ['trunk', 'leaf', 'root', 'branch'] },
  { id: 'm17', emoji: '🔑', topic: 'Home',      sentence: 'You use a ___ to open a door.', blank: 'key',     options: ['key', 'book', 'plate', 'chair'] },
  { id: 'm18', emoji: '🧊', topic: 'Science',   sentence: 'Water freezes and becomes ___.', blank: 'ice',    options: ['ice', 'air', 'mud', 'fire'] },
  { id: 'm19', emoji: '🐟', topic: 'Animals',    sentence: 'Fish ___ with their fins.', blank: 'swim',   options: ['swim', 'walk', 'fly', 'run'] },
  { id: 'm20', emoji: '🥗', topic: 'Food',       sentence: 'A salad is made of fresh ___.', blank: 'vegetables', options: ['vegetables', 'candy', 'bread', 'cheese'] },
  { id: 'm21', emoji: '🌞', topic: 'Nature',    sentence: 'In the morning, the ___ rises.', blank: 'sun',     options: ['sun', 'moon', 'star', 'rain'] },
  { id: 'm22', emoji: '🛏️', topic: 'Home',      sentence: 'You ___ on a mattress when you sleep.', blank: 'lie',    options: ['lie', 'drive', 'eat', 'cook'] },
  { id: 'm23', emoji: '🔨', topic: 'Things',     sentence: 'A carpenter uses a hammer to ___ nails.', blank: 'bang',    options: ['bang', 'eat', 'drink', 'count'] },
  { id: 'm24', emoji: '☂️', topic: 'Weather',    sentence: 'You open an ___ when it rains.', blank: 'umbrella', options: ['umbrella', 'window', 'door', 'book'] },
  { id: 'm25', emoji: '🦋', topic: 'Animals',    sentence: 'A butterfly has colorful ___.', blank: 'wings',   options: ['wings', 'legs', 'teeth', 'tails'] },
];

// Hard: conjunctions, tense consistency, nuanced vocabulary — ages 7+
const HARD_QUESTIONS: Question[] = [
  { id: 'h1',  emoji: '🌧️', topic: 'Nature',    sentence: 'Although it was raining, we ___ went outside.', blank: 'still',   options: ['still', 'never', 'rarely', 'always'] },
  { id: 'h2',  emoji: '📚', topic: 'Reading',   sentence: 'The boy ran ___ to catch the bus.', blank: 'quickly', options: ['quickly', 'slow', 'sad', 'careful'] },
  { id: 'h3',  emoji: '🍎', topic: 'Science',   sentence: 'An apple a day keeps the doctor ___.', blank: 'away',    options: ['away', 'close', 'sad', 'happy'] },
  { id: 'h4',  emoji: '👣', topic: 'Science',   sentence: 'The footprints in the mud ___ that someone had walked by.', blank: 'showed', options: ['showed', 'hid', 'removed', 'forgot'] },
  { id: 'h5',  emoji: '✈️', topic: 'Travel',    sentence: 'The airplane ___ over the mountains on its way north.', blank: 'flew',    options: ['flew', 'drives', 'swims', 'walks'] },
  { id: 'h6',  emoji: '🥣', topic: 'Food',       sentence: 'The chef added salt until the soup tasted ___.', blank: 'right',   options: ['right', 'wrong', 'bad', 'awful'] },
  { id: 'h7',  emoji: '🌙', topic: 'Nature',   sentence: 'The stars came out ___ it got dark.', blank: 'once',    options: ['once', 'before', 'until', 'while'] },
  { id: 'h8',  emoji: '🐢', topic: 'Animals',    sentence: 'The old turtle moved ___ than the young one.', blank: 'slower',  options: ['slower', 'faster', 'louder', 'quicker'] },
  { id: 'h9',  emoji: '🎁', topic: 'Events',    sentence: 'She was so ___ when she opened her gift.', blank: 'happy',   options: ['happy', 'sad', 'tired', 'bored'] },
  { id: 'h10', emoji: '🏃', topic: 'Sports',    sentence: 'He ran ___ than all the other kids.', blank: 'faster',  options: ['faster', 'slower', 'quieter', 'bigger'] },
  { id: 'h11', emoji: '📖', topic: 'Reading',   sentence: 'The book was so ___ that she read all 300 pages in one sitting.', blank: 'exciting', options: ['exciting', 'boring', 'small', 'thick'] },
  { id: 'h12', emoji: '🏠', topic: 'Home',      sentence: 'The house was warm ___ the fire was burning.', blank: 'because', options: ['because', 'although', 'unless', 'whenever'] },
  { id: 'h13', emoji: '🧪', topic: 'Science',   sentence: 'Water ___ into ice when the temperature drops.', blank: 'turns',   options: ['turns', 'stays', 'boils', 'burns'] },
  { id: 'h14', emoji: '🌱', topic: 'Science',   sentence: 'A seed will ___ into a plant if it has water and sunlight.', blank: 'grow',    options: ['grow', 'die', 'disappear', 'freeze'] },
  { id: 'h15', emoji: '🎭', topic: 'Arts',        sentence: 'The magician made the coin ___ appear and disappear.', blank: 'seemingly', options: ['seemingly', 'slowly', 'angrily', 'sadly'] },
  { id: 'h16', emoji: '🚗', topic: 'Travel',    sentence: 'The car ___ broke down on the highway.', blank: 'suddenly', options: ['suddenly', 'slowly', 'happily', 'quietly'] },
  { id: 'h17', emoji: '👓', topic: 'Health',    sentence: 'She wore glasses so she could see ___.', blank: 'clearly', options: ['clearly', 'badly', 'darkly', 'poorly'] },
  { id: 'h18', emoji: '⏰', topic: 'Time',       sentence: 'He arrived ___ just as the movie was starting.', blank: 'just',    options: ['just', 'already', 'never', 'rarely'] },
  { id: 'h19', emoji: '🌧️', topic: 'Weather',   sentence: 'It was raining, ___ we stayed inside.', blank: 'so',      options: ['so', 'but', 'and', 'or'] },
  { id: 'h20', emoji: '🐶', topic: 'Animals',    sentence: 'The dog barked ___ it heard a strange noise.', blank: 'when',   options: ['when', 'but', 'so', 'or'] },
  { id: 'h21', emoji: '📝', topic: 'School',   sentence: 'I studied ___ I wanted to do well on the test.', blank: 'because', options: ['because', 'but', 'although', 'when'] },
  { id: 'h22', emoji: '🍳', topic: 'Food',       sentence: 'The eggs cooked ___ the pan got hot.', blank: 'after',   options: ['after', 'before', 'until', 'unless'] },
  { id: 'h23', emoji: '🏊', topic: 'Sports',    sentence: 'She swims ___ than her brother.', blank: 'better',  options: ['better', 'worse', 'faster', 'slower'] },
  { id: 'h24', emoji: '🗣️', topic: 'Communication', sentence: 'He spoke so ___ that nobody could hear him.', blank: 'quietly', options: ['quietly', 'loudly', 'clearly', 'happily'] },
  { id: 'h25', emoji: '🌍', topic: 'Science',   sentence: 'The Earth ___ around the sun once every year.', blank: 'travels', options: ['travels', 'stays', 'orbits', 'circles'] },
];

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
export default function SentenceBuilder({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [totalQuestions] = useState(10);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`sentencebuilder_best_${lvl}`) || '0', 10);
  };

  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`sentencebuilder_best_${lvl}`, String(s));
  };

  const startGame = (lvl: Level) => {
    const pool = lvl === 'easy' ? EASY_QUESTIONS : lvl === 'medium' ? MEDIUM_QUESTIONS : HARD_QUESTIONS;
    setQuestions(shuffle(pool).slice(0, totalQuestions));
    setLevel(lvl);
    setQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setScreen('game');
  };

  const currentQ = questions[questionIndex];

  const handleAnswer = (word: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(word);
    const isCorrect = word === currentQ.blank;
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

        <div style={{ fontSize: 64, marginBottom: 8 }}>📝</div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#C084FC', margin: '0 0 8px', textAlign: 'center' }}>
          Sentence Builder
        </h1>
        <p style={{ fontSize: 17, color: '#888', margin: '0 0 8px', textAlign: 'center', maxWidth: 300 }}>
          Complete the sentence with the right word!
        </p>
        <p style={{ fontSize: 14, color: '#ccc', margin: '0 0 32px', textAlign: 'center' }}>
          Pick the word that makes sense
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          <LevelButton
            label="🌟 Easy — simple words"
            emoji="🌟"
            color="#FFD93D" shadowColor="#F9A825"
            onClick={() => startGame('easy')}
            bestScore={bestEasy}
          />
          <LevelButton
            label="⭐ Medium — verbs & tense"
            emoji="⭐"
            color="#C084FC" shadowColor="#7C3AED"
            onClick={() => startGame('medium')}
            bestScore={bestMedium}
          />
          <LevelButton
            label="🚀 Hard — adverbs & conjunctions"
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

          {stars === 3 && <div style={{ fontSize: 20, color: '#F59E0B', fontWeight: 700 }}>📝 Sentence Master! 📝</div>}
          {stars === 2 && <div style={{ fontSize: 20, color: '#6BCB77', fontWeight: 700 }}>Great work!</div>}
          {stars === 1 && <div style={{ fontSize: 20, color: '#6BCBFF', fontWeight: 700 }}>Keep practicing!</div>}
          {stars === 0 && <div style={{ fontSize: 20, color: '#888', fontWeight: 700 }}>Try again!</div>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#FFD93D', color: '#fff',
              boxShadow: '0 6px 0 #F9A825', cursor: 'pointer',
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
                activity="sentence-builder"
                activityName="Sentence Builder"
                activityEmoji="📝"
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

  const isCorrect = selectedAnswer !== null && selectedAnswer === currentQ.blank;

  // Render sentence with blank highlighted
  const parts = currentQ.sentence.split('___');

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
            "{currentQ.blank}" is correct!
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C62828', marginBottom: 4 }}>
            🤖 Oops!
          </div>
          <div style={{ fontSize: 15, color: '#555' }}>
            The answer was "{currentQ.blank}".
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

  const wordButtons = selectedAnswer === null ? (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 340, marginTop: 8 }}>
      {currentQ.options.map((word) => {
        const picked = selectedAnswer === word;
        const wasCorrect = selectedAnswer !== null && word === currentQ.blank;
        let bg = '#fff';
        let shadow = '#ddd';
        let textColor = '#333';
        let border = '2px solid #eee';
        if (wasCorrect) { bg = '#6BCB77'; shadow = '#388E3C'; textColor = '#fff'; border = 'none'; }
        if (picked && !wasCorrect) { bg = '#FF6B9D'; shadow = '#E91E63'; textColor = '#fff'; border = 'none'; }

        return (
          <button
            key={word}
            onClick={() => handleAnswer(word)}
            style={{
              fontFamily: 'Fredoka', fontSize: 18, fontWeight: 600,
              padding: '14px 10px', border: border, borderRadius: 14,
              background: bg, color: textColor,
              boxShadow: `0 5px 0 ${shadow}`,
              cursor: 'pointer',
              transition: 'transform 0.1s, background 0.2s',
            }}
          >
            {word}
          </button>
        );
      })}
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 340, marginTop: 8 }}>
      {currentQ.options.map((word) => {
        const wasCorrect = word === currentQ.blank;
        let bg = '#fff';
        let shadow = '#ddd';
        let textColor = '#333';
        let border = '2px solid #eee';
        if (wasCorrect) { bg = '#6BCB77'; shadow = '#388E3C'; textColor = '#fff'; border = 'none'; }
        if (selectedAnswer === word && !wasCorrect) { bg = '#FF6B9D'; shadow = '#E91E63'; textColor = '#fff'; border = 'none'; }

        return (
          <button
            key={word}
            disabled
            style={{
              fontFamily: 'Fredoka', fontSize: 18, fontWeight: 600,
              padding: '14px 10px', border: border, borderRadius: 14,
              background: bg, color: textColor,
              boxShadow: `0 5px 0 ${shadow}`,
            }}
          >
            {word}
          </button>
        );
      })}
    </div>
  );

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

      {/* Sentence card */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 16, width: '100%', maxWidth: 340,
        transform: shake ? 'translateX(-6px)' : 'translateX(0)',
        transition: 'transform 0.1s',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{currentQ.emoji}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#C084FC',
          background: '#F3E8FF', borderRadius: 8, padding: '4px 10px',
          display: 'inline-block', marginBottom: 14,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Fill in the blank
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1.6 }}>
          {parts[0]}<span style={{ background: '#FFE066', borderRadius: 4, padding: '2px 8px' }}>___</span>{parts[1]}
        </div>
      </div>

      {/* Instruction */}
      <div style={{ fontSize: 14, color: '#aaa', marginBottom: 10, textAlign: 'center' }}>
        Pick the word that makes the sentence make sense
      </div>

      {resultBanner}
      {wordButtons}
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
