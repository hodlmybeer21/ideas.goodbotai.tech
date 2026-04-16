'use client';
import { useState, useEffect, useCallback } from 'react';
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
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, ctx.currentTime);
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
}

function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
}

function playArpeggio() {
  const ctx = getCtx();
  [523, 659, 784, 1047].forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Level = 'easy' | 'medium' | 'hard';
type Screen = 'menu' | 'game' | 'results';
type ItemType = 'color' | 'shape' | 'number';

// ─── Item banks ────────────────────────────────────────────────────────────────
const COLOR_ITEMS = [
  { emoji: '🔴', label: 'Red', bg: '#FF6B9D', name: 'red' },
  { emoji: '🔵', label: 'Blue', bg: '#6BCBFF', name: 'blue' },
  { emoji: '🟢', label: 'Green', bg: '#6BCB77', name: 'green' },
  { emoji: '🟡', label: 'Yellow', bg: '#FFD93D', name: 'yellow' },
  { emoji: '🟣', label: 'Purple', bg: '#C084FC', name: 'purple' },
  { emoji: '🟠', label: 'Orange', bg: '#FF9F43', name: 'orange' },
];

const SHAPE_ITEMS = [
  { emoji: '⬜', label: 'Square', bg: '#fff', border: '#ccc', name: 'square' },
  { emoji: '⬛', label: 'Dark Square', bg: '#333', border: '#222', name: 'dark-square' },
  { emoji: '🔺', label: 'Triangle', bg: '#FF6B9D', border: '#e91e63', name: 'triangle' },
  { emoji: '🔻', label: 'Diamond', bg: '#6BCBFF', border: '#4fc3f7', name: 'diamond' },
  { emoji: '🔷', label: 'Gem', bg: '#C084FC', border: '#a855f7', name: 'gem' },
  { emoji: '🔶', label: 'Hexagon', bg: '#FF9F43', border: '#f97316', name: 'hexagon' },
];

// ─── Pattern rules ─────────────────────────────────────────────────────────────
// rule: array of indices into the item bank, where answer index = rule[rule.length-1]
type PR = { rule: number[]; hint: string; isSequence?: boolean; step?: number; isShape?: boolean; };
const PATTERN_RULES: Record<Level, PR[]> = {
  easy: [
    { rule: [0, 1, 0, 1, 0], hint: 'It goes back and forth — first, second, first, second...' },
    { rule: [0, 0, 1, 1, 0], hint: 'Two of the first thing, then two of the second...' },
    { rule: [0, 1, 0, 1, 1], hint: 'Almost alternates, but the last one repeats...' },
    { rule: [1, 0, 1, 0, 1], hint: 'Going back and forth between two things...' },
  ],
  medium: [
    { rule: [0, 1, 2, 0, 1, 2], hint: 'Three things keep repeating in the same order...' },
    { rule: [0, 0, 1, 1, 0, 0], hint: 'Two, two, then back to the start...' },
    { rule: [0, 1, 1, 2, 0, 1], hint: 'The third one appears twice in a row...' },
    { rule: [1, 2, 1, 2, 1, 2], hint: 'Two things keep alternating, but starting with the second one...' },
  ],
  hard: [
    // Number sequences (shown as digit cards)
    { rule: [2, 4, 6, 8, 10], hint: 'What do you add each time?', isSequence: true, step: 2 },
    { rule: [3, 6, 9, 12, 15], hint: 'Counting by the same number each time...', isSequence: true, step: 3 },
    { rule: [5, 10, 15, 20, 25], hint: 'Counting by 5s...', isSequence: true, step: 5 },
    { rule: [10, 20, 30, 40, 50], hint: 'Each number is 10 more than the last...', isSequence: true, step: 10 },
    // Shape + direction patterns
    { rule: [0, 1, 0, 1, 0, 1], hint: 'Two shapes keep swapping places...', isShape: true },
    { rule: [0, 0, 1, 1, 0, 0], hint: 'Two of one, two of the other, then repeats...', isShape: true },
  ],
};

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

// ─── Pattern Item ───────────────────────────────────────────────────────────────
function PatternItem({ item, isQuestion }: { item: { emoji?: string; label: string; bg: string; border?: string; value?: number }; isQuestion?: boolean }) {
  const isNumberItem = item.value !== undefined;
  return (
    <div style={{
      width: 60, height: 60,
      borderRadius: 14,
      background: isNumberItem ? '#fff' : item.bg,
      border: isQuestion ? '3px dashed #C084FC' : (item.border ? `2px solid ${item.border}` : '2px solid #e0e0e0'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka', fontSize: isNumberItem ? 22 : 28, fontWeight: 700,
      color: isNumberItem ? '#333' : 'inherit',
      boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
      flexShrink: 0,
    }}>
      {isQuestion ? (
        <span style={{ fontFamily: 'Fredoka', fontSize: 28, fontWeight: 700, color: '#C084FC' }}>?</span>
      ) : isNumberItem ? (
        <span style={{ fontFamily: 'Fredoka', fontSize: 22, fontWeight: 700, color: '#333' }}>{item.value}</span>
      ) : (
        <span style={{ fontSize: 28 }}>{item.emoji}</span>
      )}
    </div>
  );
}

// Number card for hard level sequences
function NumberCard({ value, isQuestion }: { value?: number; isQuestion?: boolean }) {
  return (
    <div style={{
      width: 60, height: 60,
      borderRadius: 14,
      background: isQuestion ? '#F3E8FF' : '#fff',
      border: isQuestion ? '3px dashed #C084FC' : '2px solid #e0e0e0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka', fontSize: isQuestion ? 28 : 26, fontWeight: 700,
      color: isQuestion ? '#C084FC' : '#333',
      boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
      flexShrink: 0,
    }}>
      {isQuestion ? '?' : value}
    </div>
  );
}

// Question mark slot (dashed box, used for the ? at end of pattern)
function QuestionSlot() {
  return (
    <div style={{
      width: 60, height: 60,
      borderRadius: 14,
      background: '#F3E8FF',
      border: '3px dashed #C084FC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Fredoka', fontSize: 28, fontWeight: 700,
      color: '#C084FC',
      flexShrink: 0,
    }}>
      ?
    </div>
  );
}

// ─── Level Button ─────────────────────────────────────────────────────────────
function LevelButton({ label, color, shadowColor, onClick }: {
  label: string; color: string; shadowColor: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      style={{
        fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
        padding: '16px 32px', border: 'none', borderRadius: 16,
        background: color, color: '#fff',
        boxShadow: `0 6px 0 ${shadowColor}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        cursor: 'pointer', transition: 'transform 0.1s', width: '100%',
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {label}
    </button>
  );
}

// ─── Question generator ───────────────────────────────────────────────────────
interface Question {
  items: Array<{ emoji: string; label: string; bg: string; border?: string; value?: number }>;
  correctAnswer: number;
  options: Array<{ emoji: string; label: string; bg: string; border?: string; value?: number; isCorrect: boolean }>;
  hint: string;
  rule: number[];
  itemBank: Array<{ emoji: string; label: string; bg: string; border?: string }>;
}

function generateQuestion(level: Level): Question {
  const rules = PATTERN_RULES[level];
  const ruleEntry = rules[Math.floor(Math.random() * rules.length)];

  if (ruleEntry.isSequence) {
    // Number sequence pattern
    const step = ruleEntry.step!;
    const startValues = [2, 3, 5, 10];
    let start = startValues[Math.floor(Math.random() * startValues.length)];
    if (step === 3) start = 3;
    if (step === 5) start = 5;
    if (step === 10) start = 10;

    const items = [];
    for (let i = 0; i < 4; i++) {
      items.push({ emoji: '', label: String(start + i * step), bg: '#fff', value: start + i * step });
    }

    const correctAnswer = start + 4 * step;
    const wrongAnswers = [
      correctAnswer - step,
      correctAnswer + step,
      correctAnswer + step * 2,
    ].filter(w => w !== correctAnswer && w > 0);

    const allOptions = [
      { emoji: '', label: String(correctAnswer), bg: '#fff', value: correctAnswer, isCorrect: true },
      ...wrongAnswers.slice(0, 3).map(v => ({ emoji: '', label: String(v), bg: '#fff', value: v, isCorrect: false })),
    ];

    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return {
      items,
      correctAnswer,
      options: allOptions,
      hint: ruleEntry.hint,
      rule: ruleEntry.rule,
      itemBank: [],
    };
  }

  // Color / shape / mixed pattern
  const itemSets = [
    { items: COLOR_ITEMS.slice(0, 3), type: 'color' as ItemType },
    { items: SHAPE_ITEMS.slice(0, 4), type: 'shape' as ItemType },
  ];

  let itemBank: Array<{ emoji: string; label: string; bg: string; border?: string }>;
  if (level === 'easy') {
    itemBank = itemSets[Math.random() < 0.5 ? 0 : 1].items.slice(0, 2);
  } else if (level === 'medium') {
    itemBank = itemSets[Math.random() < 0.5 ? 0 : 1].items.slice(0, 3);
  } else {
    itemBank = itemSets[Math.floor(Math.random() * 2)].items.slice(0, 3);
  }

  const rule = ruleEntry.rule;
  const displayRule = rule.slice(0, rule.length - 1); // show all but last as "?"
  const correctIdx = rule[rule.length - 1];

  const items = displayRule.map(idx => itemBank[idx]);
  const correctItem = itemBank[correctIdx];

  // Wrong options: pick from itemBank but not the correct one
  const wrongOptions = itemBank
    .filter((_, idx) => idx !== correctIdx)
    .map(item => ({ ...item, isCorrect: false }));

  // If we need more wrong options, create plausible variants
  while (wrongOptions.length < 3) {
    const randomItem = itemBank[Math.floor(Math.random() * itemBank.length)];
    wrongOptions.push({ ...randomItem, isCorrect: false, label: randomItem.label + '?' });
  }

  const allOptions = [
    { ...correctItem, isCorrect: true },
    ...wrongOptions.slice(0, 3),
  ];

  // Shuffle options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return {
    items,
    correctAnswer: correctIdx,
    options: allOptions,
    hint: ruleEntry.hint,
    rule,
    itemBank,
  };
}

// ─── Answer option button ───────────────────────────────────────────────────────
function OptionButton({
  option, state, onClick,
}: {
  option: Question['options'][0];
  state: 'idle' | 'correct' | 'wrong' | 'revealed';
  onClick: () => void;
}) {
  const bg = state === 'correct' ? '#6BCB77' : state === 'wrong' ? '#FF6B9D' : state === 'revealed' ? '#FFD93D' : '#fff';
  const shadow = state === 'correct' ? '#4CAF50' : state === 'wrong' ? '#E91E63' : state === 'revealed' ? '#F9A825' : '#ddd';
  const color = state === 'correct' || state === 'wrong' || state === 'revealed' ? '#fff' : '#333';
  const [pressed, setPressed] = useState(false);

  return (
    <button
      style={{
        fontFamily: 'Fredoka', fontSize: 18, fontWeight: 600,
        padding: '14px 16px', border: 'none', borderRadius: 14,
        background: bg, color,
        boxShadow: `0 5px 0 ${shadow}`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        cursor: 'pointer', transition: 'background 0.2s, transform 0.1s',
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', textAlign: 'left',
        animation: state === 'wrong' ? 'shake 0.4s ease' : undefined,
      }}
      onClick={onClick}
      disabled={state === 'correct' || state === 'revealed'}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <span style={{ fontSize: 26 }}>{option.emoji}</span>
      <span>{option.label}</span>
      {state === 'correct' && <span style={{ marginLeft: 'auto' }}>✅</span>}
      {state === 'wrong' && <span style={{ marginLeft: 'auto' }}>❌</span>}
      {state === 'revealed' && <span style={{ marginLeft: 'auto' }}>✅</span>}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PatternPuzzles({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level>('easy');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [optionStates, setOptionStates] = useState<Record<number, 'idle' | 'correct' | 'wrong' | 'revealed'>>({});
  const [hint, setHint] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [totalQuestions] = useState(10);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`pattern_best_${lvl}`) || '0', 10);
  };
  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`pattern_best_${lvl}`, String(s));
  };

  const startGame = (lvl: Level) => {
    setLevel(lvl);
    setQuestion(generateQuestion(lvl));
    setQuestionIndex(0);
    setScore(0);
    setAttempts(0);
    setHint('');
    setIsCorrect(false);
    setOptionStates({});
    setScreen('game');
  };

  const advanceQuestion = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setScreen('results');
      return;
    }
    const q = generateQuestion(level);
    setQuestion(q);
    setQuestionIndex(i => i + 1);
    setAttempts(0);
    setHint('');
    setIsCorrect(false);
    setOptionStates({});
  }, [questionIndex, level]);

  const handleOptionClick = (idx: number) => {
    if (!question || isCorrect) return;
    const option = question.options[idx];
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (option.isCorrect) {
      setOptionStates({ [idx]: 'correct' });
      setIsCorrect(true);
      setShowConfetti(true);
      const earned = newAttempts === 1 ? 10 : newAttempts === 2 ? 5 : 2;
      setScore(s => s + earned);
      setHint('🎉 Correct!');
      playCorrect();
      setTimeout(() => {
        setShowConfetti(false);
        advanceQuestion();
      }, 1500);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      playWrong();
      setOptionStates({ [idx]: 'wrong' });
      setHint(question.hint);
      if (newAttempts >= 3) {
        // Reveal correct answer
        const correctIdx = question.options.findIndex(o => o.isCorrect);
        setTimeout(() => {
          setOptionStates({ [correctIdx]: 'revealed' });
          setHint(`The answer was: ${question.options[correctIdx].label}`);
        }, 600);
      }
    }
  };

  useEffect(() => {
    if (screen === 'results') {
      saveBestScore(level, score);
      if (score >= 80) {
        setShowConfetti(true);
        playArpeggio();
      }
    }
  }, [screen, level, score]);

  const pct = Math.round((score / (totalQuestions * 10)) * 100);
  const stars = pct >= 95 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
  const bestEasy = getBestScore('easy');
  const bestMedium = getBestScore('medium');
  const bestHard = getBestScore('hard');

  // ─── MENU ───────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{
        fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>

        <button onClick={onBack} style={{
          position: 'absolute', top: 20, left: 20,
          fontFamily: 'Fredoka', fontSize: 16, background: 'none',
          border: 'none', cursor: 'pointer', color: '#aaa',
        }}>← Back</button>

        <div style={{ fontSize: 64, marginBottom: 8 }}>🧩</div>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: '#C084FC', margin: '0 0 8px', textAlign: 'center' }}>Pattern Puzzles!</h1>
        <p style={{ fontSize: 17, color: '#888', margin: '0 0 28px', textAlign: 'center' }}>
          What comes next in the pattern?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 300 }}>
          <LevelButton label="🌟 Easy — Colors & Shapes" color="#6BCB77" shadowColor="#4CAF50" onClick={() => startGame('easy')} />
          <LevelButton label="⭐ Medium — ABC Patterns" color="#FFD93D" shadowColor="#F9A825" onClick={() => startGame('medium')} />
          <LevelButton label="🚀 Hard — Number Sequences" color="#C084FC" shadowColor="#9333EA" onClick={() => startGame('hard')} />
        </div>

        {(bestEasy > 0 || bestMedium > 0 || bestHard > 0) && (
          <div style={{ marginTop: 28, background: '#fff', borderRadius: 16, padding: '16px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 14, color: '#aaa', marginBottom: 8, textAlign: 'center' }}>🏆 Best Scores</div>
            <div style={{ display: 'flex', gap: 24 }}>
              {bestEasy > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#6BCB77' }}>{bestEasy}</div><div style={{ fontSize: 12, color: '#aaa' }}>Easy</div></div>}
              {bestMedium > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#FFD93D' }}>{bestMedium}</div><div style={{ fontSize: 12, color: '#aaa' }}>Medium</div></div>}
              {bestHard > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#C084FC' }}>{bestHard}</div><div style={{ fontSize: 12, color: '#aaa' }}>Hard</div></div>}
            </div>
          </div>
        )}

        <button onClick={onBack} style={{
          marginTop: 24, fontFamily: 'Fredoka', fontSize: 15,
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
        <Confetti active={showConfetti} />
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>

        <div style={{ fontSize: 80, marginBottom: 8 }}>{stars === 3 ? '🏆' : stars === 2 ? '🌟' : stars === 1 ? '👍' : '💪'}</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#333', margin: '0 0 24px', textAlign: 'center' }}>
          {kidName ? `${kidName}, ` : ''}{stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : stars === 1 ? 'Good try!' : 'Keep practicing!'}
        </h1>

        <div style={{
          background: '#fff', borderRadius: 24, padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 280,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#C084FC' }}>{score}</div>
          <div style={{ fontSize: 18, color: '#888' }}>points</div>
          <div style={{ fontSize: 64, margin: '16px 0' }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <div style={{ fontSize: 20, color: '#555' }}>{pct}% correct</div>
          {stars === 3 && <div style={{ fontSize: 22, color: '#FFD93D', fontWeight: 700, marginTop: 8 }}>🌟 Pattern Master! 🌟</div>}
          {stars === 2 && <div style={{ fontSize: 22, color: '#6BCB77', fontWeight: 700, marginTop: 8 }}>Awesome pattern spotter!</div>}
          {stars === 1 && <div style={{ fontSize: 22, color: '#6BCBFF', fontWeight: 700, marginTop: 8 }}>Good effort, keep going!</div>}
          {stars === 0 && <div style={{ fontSize: 22, color: '#888', fontWeight: 700, marginTop: 8 }}>You'll get it next time!</div>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#C084FC', color: '#fff',
              boxShadow: '0 6px 0 #9333EA', cursor: 'pointer',
            }}
            onClick={() => { setShowConfetti(false); startGame(level); }}
          >
            Play Again 🔄
          </button>
          <button
            style={{
              fontFamily: 'Fredoka', fontSize: 20, fontWeight: 600,
              padding: '14px 28px', border: 'none', borderRadius: 16,
              background: '#FF6B9D', color: '#fff',
              boxShadow: '0 6px 0 #E91E63', cursor: 'pointer',
            }}
            onClick={() => setScreen('menu')}
          >
            Pick Level 📋
          </button>
        </div>

        <button onClick={onBack} style={{
          marginTop: 24, fontFamily: 'Fredoka', fontSize: 16,
          background: 'none', border: 'none', cursor: 'pointer', color: '#888',
        }}>← Back to Home</button>

        {score >= 60 && (
          <div style={{ marginTop: 20 }}>
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
                activity="pattern-puzzles"
                activityName="Pattern Puzzles"
                activityEmoji="🧩"
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
  return (
    <div style={{
      fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0',
      padding: '16px 16px 32px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 0,
    }}>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
      <Confetti active={showConfetti} />

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => setScreen('menu')} style={{
          fontFamily: 'Fredoka', fontSize: 15, background: 'none',
          border: 'none', cursor: 'pointer', color: '#aaa',
        }}>← Back</button>
        <div style={{ fontSize: 14, color: '#aaa', background: '#fff', borderRadius: 20, padding: '4px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          Q{questionIndex + 1} of {totalQuestions}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD93D' }}>⭐ {score}</div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 400, height: 8, background: '#eee', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#C084FC', borderRadius: 4,
          width: `${((questionIndex + (isCorrect ? 1 : 0)) / totalQuestions) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {question && (
        <>
          {/* Pattern display */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: '20px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: 16,
            transform: shake ? 'translateX(-6px)' : 'translateX(0)',
            transition: 'transform 0.1s',
          }}>
            {/* Pattern row */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              {question.items.map((item, idx) => (
                <PatternItem key={idx} item={item} />
              ))}
              {/* Question mark slot */}
              <QuestionSlot />
            </div>

            <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
              Tap the answer below 👇
            </div>
          </div>

          {/* Hint */}
          {hint && (
            <div style={{
              background: hint.includes('🎉') ? '#E8F5E9' : '#FFF3E0',
              color: hint.includes('🎉') ? '#2E7D32' : '#E65100',
              borderRadius: 12, padding: '8px 16px', marginBottom: 12,
              fontSize: 15, fontWeight: 600, textAlign: 'center',
              maxWidth: 400, width: '100%',
            }}>
              {hint}
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
            {question.options.map((option, idx) => (
              <OptionButton
                key={idx}
                option={option}
                state={optionStates[idx] || 'idle'}
                onClick={() => handleOptionClick(idx)}
              />
            ))}
          </div>

          {/* Attempts indicator */}
          {attempts > 0 && !isCorrect && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#ccc' }}>
              Try {attempts} of 3 — hint above ↑ 
            </div>
          )}
        </>
      )}
    </div>
  );
}
