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
  const notes = [523, 659, 784, 1047];
  notes.forEach((hz, i) => {
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

interface PatternItem {
  emoji: string;
  bgColor: string;
  label: string;
  value: string | number;
}

interface Question {
  items: PatternItem[];
  correctAnswer: PatternItem;
  wrongAnswers: PatternItem[];
  hint: string;
  ruleLabel: string;
}

// ─── Data sets ────────────────────────────────────────────────────────────────
const COLOR_ITEMS: PatternItem[] = [
  { emoji: '🔴', bgColor: '#FF6B6B', label: 'Red', value: 'red' },
  { emoji: '🔵', bgColor: '#4DABF7', label: 'Blue', value: 'blue' },
  { emoji: '🟢', bgColor: '#51CF66', label: 'Green', value: 'green' },
  { emoji: '🟡', bgColor: '#FFD43B', label: 'Yellow', value: 'yellow' },
  { emoji: '🟣', bgColor: '#C084FC', label: 'Purple', value: 'purple' },
  { emoji: '🟠', bgColor: '#FF922B', label: 'Orange', value: 'orange' },
];

const SHAPE_ITEMS: PatternItem[] = [
  { emoji: '⬜', bgColor: '#F8F9FA', label: 'White Square', value: 'wsq' },
  { emoji: '⬛', bgColor: '#495057', label: 'Black Square', value: 'bsq' },
  { emoji: '🔺', bgColor: '#FF6B6B', label: 'Red Triangle', value: 'rtri' },
  { emoji: '🔻', bgColor: '#4DABF7', label: 'Blue Triangle', value: 'btri' },
  { emoji: '🔷', bgColor: '#C084FC', label: 'Purple Diamond', value: 'pdia' },
  { emoji: '🔶', bgColor: '#FF922B', label: 'Orange Hexagon', value: 'ohex' },
  { emoji: '🟩', bgColor: '#51CF66', label: 'Green Square', value: 'gsq' },
  { emoji: '🟪', bgColor: '#9775FA', label: 'Purple Square', value: 'psq' },
];

const ARROW_ITEMS: PatternItem[] = [
  { emoji: '➡️', bgColor: '#339AF0', label: 'Right', value: 'right' },
  { emoji: '⬆️', bgColor: '#FF6B6B', label: 'Up', value: 'up' },
  { emoji: '⬇️', bgColor: '#51CF66', label: 'Down', value: 'down' },
  { emoji: '⬅️', bgColor: '#FFD43B', label: 'Left', value: 'left' },
  { emoji: '↗️', bgColor: '#C084FC', label: 'Up-Right', value: 'upright' },
  { emoji: '↘️', bgColor: '#FF922B', label: 'Down-Right', value: 'downright' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeNumberItem(n: number): PatternItem {
  return { emoji: String(n), bgColor: '#E9ECEF', label: String(n), value: n };
}

// ─── Question generation ───────────────────────────────────────────────────────
function generateQuestion(level: Level): Question {
  if (level === 'easy') return generateEasyQuestion();
  if (level === 'medium') return generateMediumQuestion();
  return generateHardQuestion();
}

function generateEasyQuestion(): Question {
  const rule = Math.random() < 0.6 ? 'abab' : 'aabb';
  const pattern = rule === 'abab' ? [0, 1, 0, 1] : [0, 0, 1, 1];

  const useColors = Math.random() < 0.6;
  const pool = useColors ? COLOR_ITEMS : SHAPE_ITEMS;

  const idx1 = Math.floor(Math.random() * pool.length);
  let idx2 = Math.floor(Math.random() * pool.length);
  while (idx2 === idx1) idx2 = Math.floor(Math.random() * pool.length);

  const itemA = pool[idx1];
  const itemB = pool[idx2];
  const itemMap = [itemA, itemB];

  const items = pattern.map(i => itemMap[i]);
  const correctItem = itemMap[pattern[pattern.length - 1]];

  // Wrong answers: first try the OTHER item in itemMap (same visual category),
  // then fill remaining slots from the full pool to keep options related.
  const itemMapWrongs = itemMap.filter(it => it.label !== correctItem.label);
  const poolWrongs = shuffle(pool.filter(it => it.label !== correctItem.label));
  const wrongs = [...itemMapWrongs, ...poolWrongs].slice(0, 3);

  const hint = useColors
    ? `Look at the colors — does it go ${itemA.label}, ${itemB.label}, ${itemA.label}, ${itemB.label}?`
    : `Look at the shapes — does it go ${itemA.label}, ${itemB.label}, ${itemA.label}, ${itemB.label}?`;

  return { items, correctAnswer: correctItem, wrongAnswers: wrongs, hint, ruleLabel: rule === 'abab' ? 'ABAB pattern' : 'AABB pattern' };
}

function generateMediumQuestion(): Question {
  const rules = shuffle(['abcabc', 'aabb', 'abbc']);
  const rule = rules[0];
  const pattern = rule === 'abcabc' ? [0, 1, 2, 0, 1, 2] : rule === 'aabb' ? [0, 0, 1, 1, 0, 1] : [0, 1, 1, 2, 0, 1];

  const useMixed = Math.random() < 0.5;
  let itemMap: PatternItem[];

  if (useMixed) {
    const c1 = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];
    const c2 = COLOR_ITEMS.filter(c => c.label !== c1.label)[Math.floor(Math.random() * (COLOR_ITEMS.length - 1))];
    const s1 = SHAPE_ITEMS[Math.floor(Math.random() * SHAPE_ITEMS.length)];
    itemMap = shuffle([c1, c2, s1]);
  } else {
    const idxs = shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 3);
    itemMap = idxs.map(i => SHAPE_ITEMS[i]);
  }

  const items = pattern.map(i => itemMap[i % itemMap.length]);
  const correctItem = items[items.length - 1];

  const wrongPool = itemMap.filter(it => it.label !== correctItem.label);
  const wrongs = shuffle(wrongPool).slice(0, 3);

  const themeLabel = useMixed ? 'colors and shapes' : 'shapes';
  const hint = `Look at the ${themeLabel} — spot the rule and find what comes next!`;

  return { items, correctAnswer: correctItem, wrongAnswers: wrongs, hint, ruleLabel: `${rule} pattern` };
}

function generateHardQuestion(): Question {
  const type = Math.random();

  if (type < 0.5) {
    // Number sequence
    const countRules = shuffle([
      { rule: 'countBy2', step: 2 },
      { rule: 'countBy3', step: 3 },
      { rule: 'countBy5', step: 5 },
      { rule: 'countBy10', step: 10 },
    ])[0];

    const start = Math.floor(Math.random() * 5) * countRules.step + countRules.step;
    const shown = [start, start + countRules.step, start + countRules.step * 2, start + countRules.step * 3];
    const correct = start + countRules.step * 4;

    const items = shown.map(n => makeNumberItem(n));
    const correctItem = makeNumberItem(correct);

    const step = countRules.step;
    // Generate 3 unique wrong answers, all different from correct
    const usedNums = new Set<number>([correct]);
    const wrongs: PatternItem[] = [];
    while (wrongs.length < 3) {
      // offset from -6 to +6, excluding 0
      const offset = (Math.floor(Math.random() * 12 + 1)) - 6;
      const candidate = correct + offset;
      if (candidate > 0 && !usedNums.has(candidate)) {
        usedNums.add(candidate);
        wrongs.push(makeNumberItem(candidate));
      }
    }

    const hint = `Count the numbers — what do you add each time? Try adding ${step}!`;
    return { items, correctAnswer: correctItem, wrongAnswers: wrongs, hint, ruleLabel: `Count by ${step}s` };
  } else {
    // Arrow rotation
    const arrowIdx = Math.floor(Math.random() * ARROW_ITEMS.length);
    const itemA = ARROW_ITEMS[arrowIdx];
    const itemB = ARROW_ITEMS[(arrowIdx + 1) % ARROW_ITEMS.length];
    const itemMap = [itemA, itemB];

    const pattern = [0, 0, 1, 0, 0];
    const items = pattern.map(i => itemMap[i]);
    const correctItem = items[items.length - 1];

    const itemMapWrongs = itemMap.filter(it => it.label !== correctItem.label);
    const poolWrongs = shuffle(ARROW_ITEMS.filter(it => it.label !== correctItem.label));
    const wrongs = [...itemMapWrongs, ...poolWrongs].slice(0, 3);

    const hint = `Watch the arrows — which direction does it go next?`;
    return { items, correctAnswer: correctItem, wrongAnswers: wrongs, hint, ruleLabel: 'Arrow pattern' };
  }
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
function LevelButton({ label, color, shadowColor, onClick, bestScore }: {
  label: string; color: string; shadowColor: string; onClick: () => void; bestScore?: number;
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
        cursor: 'pointer', transition: 'transform 0.1s',
        width: '100%',
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {label}
      {bestScore !== undefined && bestScore > 0 && (
        <span style={{ marginLeft: 12, opacity: 0.9, fontSize: 16 }}>🏆 {bestScore}</span>
      )}
    </button>
  );
}

// ─── Pattern Slot ─────────────────────────────────────────────────────────────
function PatternSlot({ item, isLast }: { item: PatternItem; isLast?: boolean }) {
  return (
    <div style={{
      width: 60, height: 60,
      borderRadius: 12,
      background: isLast ? '#F3E8FF' : item.bgColor,
      border: isLast ? '3px dashed #C084FC' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 30,
      boxShadow: isLast ? 'none' : '0 3px 8px rgba(0,0,0,0.12)',
      flexShrink: 0,
    }}>
      {isLast ? (
        <span style={{ fontFamily: 'Fredoka', fontSize: 32, fontWeight: 700, color: '#C084FC' }}>?</span>
      ) : (
        item.emoji
      )}
    </div>
  );
}

// ─── Answer Option Button ─────────────────────────────────────────────────────
type AnswerState = 'idle' | 'correct' | 'wrong' | 'revealed';

function AnswerButton({
  item, onClick, state, disabled, isCorrectItem
}: {
  item: PatternItem;
  onClick: () => void;
  state: AnswerState;
  disabled: boolean;
  isCorrectItem: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  let bgColor = '#fff';
  let shadowColor = '#ddd';
  let textColor = '#333';
  let border = '2px solid #eee';

  if (state === 'correct') { bgColor = '#6BCB77'; shadowColor = '#4CAF50'; textColor = '#fff'; border = 'none'; }
  if (state === 'wrong') { bgColor = '#FF6B9D'; shadowColor = '#E91E63'; textColor = '#fff'; border = 'none'; }
  if (state === 'revealed' && isCorrectItem) { bgColor = '#C8F7C5'; shadowColor = '#4CAF50'; textColor = '#2E7D32'; border = '2px solid #6BCB77'; }

  return (
    <button
      style={{
        fontFamily: 'Fredoka',
        fontSize: 16,
        fontWeight: 600,
        padding: '12px 16px',
        border: border,
        borderRadius: 14,
        background: bgColor,
        color: textColor,
        boxShadow: `0 5px 0 ${shadowColor}`,
        transform: pressed && state === 'idle' ? 'translateY(3px)' : 'translateY(0)',
        cursor: disabled && state === 'idle' ? 'default' : 'pointer',
        transition: 'transform 0.1s, background 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        opacity: disabled && state === 'idle' ? 0.6 : 1,
      }}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
    >
      <span style={{ fontSize: 28 }}>{item.emoji}</span>
      <span>{item.label}</span>
      {state === 'correct' && <span style={{ marginLeft: 'auto' }}>✓</span>}
      {state === 'wrong' && <span style={{ marginLeft: 'auto' }}>✗</span>}
      {state === 'revealed' && isCorrectItem && <span style={{ marginLeft: 'auto' }}>✓</span>}
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
  const [selectedAnswer, setSelectedAnswer] = useState<PatternItem | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [hint, setHint] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [totalQuestions] = useState(10);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [options, setOptions] = useState<PatternItem[]>([]);

  const getBestScore = (lvl: Level): number => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(`patternpuzzles_best_${lvl}`) || '0', 10);
  };

  const saveBestScore = (lvl: Level, s: number) => {
    const current = getBestScore(lvl);
    if (s > current) localStorage.setItem(`patternpuzzles_best_${lvl}`, String(s));
  };

  const loadQuestion = useCallback((lvl: Level) => {
    const q = generateQuestion(lvl);
    setQuestion(q);
    setAttempts(0);
    setHint('');
    setSelectedAnswer(null);
    setAnswerState('idle');
    setOptions(shuffle([q.correctAnswer, ...q.wrongAnswers]));
  }, []);

  const startGame = (lvl: Level) => {
    setLevel(lvl);
    setQuestionIndex(0);
    setScore(0);
    loadQuestion(lvl);
    setScreen('game');
  };

  const advanceQuestion = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setScreen('results');
      return;
    }
    setQuestionIndex(i => i + 1);
    loadQuestion(level);
  }, [questionIndex, level, loadQuestion]);

  const handleAnswer = (item: PatternItem) => {
    if (answerState === 'correct' || answerState === 'revealed') return;
    if (!question) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSelectedAnswer(item);

    if (item.label === question.correctAnswer.label) {
      setAnswerState('correct');
      const earned = newAttempts === 1 ? 10 : newAttempts === 2 ? 5 : 2;
      setScore(s => s + earned);
      setHint(newAttempts === 1 ? '🎉 Perfect! +10!' : newAttempts === 2 ? '👍 Good job! +5!' : '✓ You got it! +2!');
      playCorrect();
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        advanceQuestion();
      }, 1500);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      playWrong();

      if (newAttempts >= 3) {
        setAnswerState('revealed');
        setHint(question.hint + ` (The answer was: ${question.correctAnswer.label})`);
        setTimeout(() => advanceQuestion(), 2500);
      } else {
        setAnswerState('wrong');
        setHint(question.hint + ` (Try again! ${3 - newAttempts} tries left)`);
        setTimeout(() => setAnswerState('idle'), 800);
      }
    }
  };

  // Results side effects
  if (screen === 'results' && score > 0) {
    // saved in render below
  }

  const bestEasy = getBestScore('easy');
  const bestMedium = getBestScore('medium');
  const bestHard = getBestScore('hard');

  // ─── MENU ────────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
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

        <div style={{ fontSize: 60, marginBottom: 8 }}>🧩</div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: '#C084FC', margin: '0 0 8px' }}>Pattern Puzzles!</h1>
        <p style={{ fontSize: 17, color: '#888', margin: '0 0 32px', textAlign: 'center' }}>
          What comes next in the pattern?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 300 }}>
          <LevelButton
            label="🌟 Easy — ABAB & AABB"
            color="#C084FC" shadowColor="#7C3AED"
            onClick={() => startGame('easy')}
            bestScore={bestEasy}
          />
          <LevelButton
            label="⭐ Medium — Colors & Shapes"
            color="#FFD93D" shadowColor="#F9A825"
            onClick={() => startGame('medium')}
            bestScore={bestMedium}
          />
          <LevelButton
            label="🚀 Hard — Numbers & Arrows"
            color="#FF6B9D" shadowColor="#E91E63"
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
    const finalScore = score;
    const finalPct = Math.round((finalScore / (totalQuestions * 10)) * 100);
    const stars = finalPct >= 95 ? 3 : finalPct >= 70 ? 2 : finalPct >= 40 ? 1 : 0;
    const correctCount = Math.round(finalScore / 10);

    // Save best score
    if (typeof window !== 'undefined' && finalScore > 0) {
      saveBestScore(level, finalScore);
    }

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
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#333', margin: '0 0 24px', textAlign: 'center' }}>
          {kidName ? `${kidName}, you did it!` : 'You did it!'}
        </h1>

        <div style={{
          background: '#fff', borderRadius: 24, padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', minWidth: 280,
        }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#C084FC' }}>{finalScore}</div>
          <div style={{ fontSize: 18, color: '#888' }}>points</div>

          <div style={{ fontSize: 64, margin: '16px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          <div style={{ fontSize: 20, color: '#555' }}>{correctCount} of {totalQuestions} correct</div>

          {stars === 3 && <div style={{ fontSize: 22, color: '#FFD93D', fontWeight: 700, marginTop: 8 }}>🌟 Perfect! 🌟</div>}
          {stars === 2 && <div style={{ fontSize: 22, color: '#6BCB77', fontWeight: 700, marginTop: 8 }}>Awesome work!</div>}
          {stars === 1 && <div style={{ fontSize: 22, color: '#6BCBFF', fontWeight: 700, marginTop: 8 }}>Good job, keep practicing!</div>}
          {stars === 0 && <div style={{ fontSize: 22, color: '#888', fontWeight: 700, marginTop: 8 }}>Try again, you can do it!</div>}
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
              background: '#FF6B9D', color: '#fff',
              boxShadow: '0 6px 0 #E91E63', cursor: 'pointer',
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

        {finalScore >= 60 && (
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
  if (!question) return null;

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
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD93D' }}>⭐ {score}</div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 320, height: 8, background: '#eee', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#C084FC', borderRadius: 4,
          width: `${(questionIndex / totalQuestions) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Level badge */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#C084FC',
        background: '#F3E8FF', borderRadius: 20, padding: '4px 14px', marginBottom: 12,
      }}>
        {level === 'easy' ? '🌟 Easy' : level === 'medium' ? '⭐ Medium' : '🚀 Hard'} — {question.ruleLabel}
      </div>

      {/* Pattern display */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '20px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 16,
        transform: shake ? 'translateX(-6px)' : 'translateX(0)',
        transition: 'transform 0.1s',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {question.items.map((item, i) => (
            <PatternSlot key={i} item={item} isLast={false} />
          ))}
          <PatternSlot item={question.correctAnswer} isLast={true} />
        </div>
      </div>

      {/* Prompt */}
      <div style={{ fontSize: 17, color: '#888', marginBottom: 12, textAlign: 'center' }}>
        What comes <strong style={{ color: '#C084FC' }}>next</strong>?
      </div>

      {/* Hint */}
      {hint && (
        <div style={{
          background: hint.startsWith('🎉') ? '#E8F5E9' : '#FFF3E0',
          color: hint.startsWith('🎉') ? '#2E7D32' : '#E65100',
          borderRadius: 12, padding: '8px 16px', marginBottom: 12,
          fontSize: 14, fontWeight: 600, textAlign: 'center', maxWidth: 320,
        }}>
          {hint}
        </div>
      )}

      {/* Answer options */}
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((item) => {
          let state: AnswerState = 'idle';
          if (answerState === 'correct' && item.label === question.correctAnswer.label) state = 'correct';
          if (answerState === 'wrong' && selectedAnswer?.label === item.label) state = 'wrong';
          if (answerState === 'revealed' && item.label === question.correctAnswer.label) state = 'revealed';

          const disabled = answerState === 'correct' || answerState === 'revealed' || answerState === 'wrong';

          return (
            <AnswerButton
              key={item.label}
              item={item}
              state={state}
              disabled={disabled}
              isCorrectItem={item.label === question.correctAnswer.label}
              onClick={() => handleAnswer(item)}
            />
          );
        })}
      </div>
    </div>
  );
}
