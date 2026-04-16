'use client';
import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

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
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
}

function playWrong() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

// ─── Items ────────────────────────────────────────────────────────────────────
interface PatternItem {
  emoji: string;
  bgColor: string;
  label: string;
}

const COLOR_ITEMS: PatternItem[] = [
  { emoji: '🔴', bgColor: '#FF6B6B', label: 'Red' },
  { emoji: '🔵', bgColor: '#4DABF7', label: 'Blue' },
  { emoji: '🟢', bgColor: '#51CF66', label: 'Green' },
  { emoji: '🟡', bgColor: '#FFD43B', label: 'Yellow' },
  { emoji: '🟣', bgColor: '#C084FC', label: 'Purple' },
  { emoji: '🟠', bgColor: '#FF922B', label: 'Orange' },
];

const SHAPE_ITEMS: PatternItem[] = [
  { emoji: '⬜', bgColor: '#F8F9FA', label: 'White Square' },
  { emoji: '⬛', bgColor: '#495057', label: 'Black Square' },
  { emoji: '🔺', bgColor: '#FF6B6B', label: 'Red Triangle' },
  { emoji: '🔻', bgColor: '#4DABF7', label: 'Blue Triangle' },
  { emoji: '🔷', bgColor: '#C084FC', label: 'Purple Diamond' },
  { emoji: '🔶', bgColor: '#FF922B', label: 'Orange Hexagon' },
  { emoji: '🟩', bgColor: '#51CF66', label: 'Green Square' },
  { emoji: '🟪', bgColor: '#9775FA', label: 'Purple Square' },
];

const ARROW_ITEMS: PatternItem[] = [
  { emoji: '➡️', bgColor: '#339AF0', label: 'Right' },
  { emoji: '⬆️', bgColor: '#FF6B6B', label: 'Up' },
  { emoji: '⬇️', bgColor: '#51CF66', label: 'Down' },
  { emoji: '⬅️', bgColor: '#FFD43B', label: 'Left' },
  { emoji: '↗️', bgColor: '#C084FC', label: 'Up-Right' },
  { emoji: '↘️', bgColor: '#FF922B', label: 'Down-Right' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Level = 'easy' | 'medium' | 'hard';

interface Question {
  shown: PatternItem[];    // 3 items shown in the pattern row
  correct: PatternItem;    // the missing 4th item
  choices: PatternItem[];  // 2-4 answer options
  hint: string;
  ruleLabel: string;
}

// ─── Question generation ───────────────────────────────────────────────────────

function genEasy(): Question {
  // Easy: ABAB or AABB, showing 3 items (the 4th is the "gap")
  // Pattern shows itemA at position 0, itemB at position 1, itemA at position 2
  // Position 3 is missing — for ABAB it cycles back to itemA, for AABB it's itemB
  const rule = Math.random() < 0.6 ? 'abab' : 'aabb';
  const itemA = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];
  let itemB = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];
  while (itemB.label === itemA.label) {
    itemB = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];
  }

  // ABAB: [A, B, A] → next is A (cycles back to start)
  // AABB: [A, A, B] → next is B (continues the pair)
  const nextIsA = rule === 'abab';
  const correct = nextIsA ? itemA : itemB;

  // Wrong answers from the same COLOR pool, never the same bgColor as correct
  const wrongs = shuffle(
    COLOR_ITEMS.filter(it => it.bgColor !== correct.bgColor)
  ).slice(0, 2);

  const choices = shuffle([correct, ...wrongs]);

  const hint = rule === 'abab'
    ? `The pattern goes Red, Blue, Red... what comes next?`
    : `The pattern goes Red, Red, Blue... what comes next?`;

  return {
    shown: [itemA, itemB, itemA],
    correct,
    choices,
    hint,
    ruleLabel: rule === 'abab' ? 'ABAB' : 'AABB',
  };
}

function genMedium(): Question {
  // Medium: ABC (3 unique) or AABB variant (2 pairs)
  const rule = Math.random() < 0.5 ? 'abc' : 'aabb';

  if (rule === 'abc') {
    const pool = shuffle([...COLOR_ITEMS]).slice(0, 3);
    const [A, B, C] = pool;
    const shown = [A, B, C];
    const correct = A; // cycles back

    const wrongs = shuffle(
      COLOR_ITEMS.filter(it => it.bgColor !== correct.bgColor)
    ).slice(0, 2);
    const choices = shuffle([correct, ...wrongs]);

    return {
      shown,
      correct,
      choices,
      hint: `${A.label}, ${B.label}, ${C.label}... what comes next?`,
      ruleLabel: 'ABC',
    };
  } else {
    // AABB: show [A, A, B], next is B
    const pool = shuffle([...COLOR_ITEMS]).slice(0, 2);
    const [A, B] = pool;
    const shown = [A, A, B];
    const correct = B;

    const wrongs = shuffle(
      COLOR_ITEMS.filter(it => it.bgColor !== correct.bgColor)
    ).slice(0, 2);
    const choices = shuffle([correct, ...wrongs]);

    return {
      shown,
      correct,
      choices,
      hint: `${A.label}, ${A.label}, ${B.label}... what comes next?`,
      ruleLabel: 'AABB',
    };
  }
}

function genHard(): Question {
  const type = Math.random();

  if (type < 0.5) {
    // Number sequence
    const countRules = shuffle([
      { step: 2 },
      { step: 3 },
      { step: 5 },
      { step: 10 },
    ])[0];

    const step = countRules.step;
    const start = Math.floor(Math.random() * 5) * step + step;
    const shown = [start, start + step, start + step * 2];
    const correct = start + step * 3;

    function numItem(n: number) {
      return { emoji: String(n), bgColor: '#E9ECEF', label: String(n) };
    }

    // Generate 3 unique wrong numbers close to correct
    const used = new Set<number>([correct]);
    const wrongs: PatternItem[] = [];
    while (wrongs.length < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const candidate = correct + offset;
      if (candidate > 0 && !used.has(candidate)) {
        used.add(candidate);
        wrongs.push(numItem(candidate));
      }
    }

    const choices = shuffle([numItem(correct), ...wrongs]);

    return {
      shown: shown.map(numItem),
      correct: numItem(correct),
      choices,
      hint: `Count by ${step}s — what comes next?`,
      ruleLabel: `Count by ${step}s`,
    };
  } else {
    // Arrow rotation: [A, A, B] → next is A (AB pattern, 3 shown)
    const idxA = Math.floor(Math.random() * ARROW_ITEMS.length);
    const idxB = (idxA + 1) % ARROW_ITEMS.length;
    const A = ARROW_ITEMS[idxA];
    const B = ARROW_ITEMS[idxB];

    const shown = [A, A, B];
    const correct = A; // AB pattern cycles back to A

    const wrongs = shuffle(
      ARROW_ITEMS.filter(it => it.bgColor !== correct.bgColor)
    ).slice(0, 2);
    const choices = shuffle([correct, ...wrongs]);

    return {
      shown,
      correct,
      choices,
      hint: `${A.label}, ${A.label}, ${B.label}... what comes next?`,
      ruleLabel: 'Arrow Pattern',
    };
  }
}

function generateQuestion(level: Level): Question {
  if (level === 'easy') return genEasy();
  if (level === 'medium') return genMedium();
  return genHard();
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  kidName: string;
}

export default function PatternPuzzles({ onBack, kidName }: Props) {
  const [level, setLevel] = useState<Level>('easy');
  const [q, setQ] = useState<Question>(() => generateQuestion('easy'));
  const [selected, setSelected] = useState<PatternItem | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [kidScore, setKidScore] = useState(0);

  const next = useCallback((lvl: Level) => {
    setQ(generateQuestion(lvl));
    setSelected(null);
    if (lvl !== level) setLevel(lvl);
  }, [level]);

  function handleChoice(c: PatternItem) {
    if (selected) return;
    setSelected(c);
    setTotal(t => t + 1);
    const correct = c.bgColor === q.correct.bgColor;
    if (correct) {
      setScore(s => s + 1);
      setKidScore(k => k + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setTimeout(() => {
      if (total + 1 >= 10) {
        setDone(true);
      } else {
        next(level);
      }
    }, 1000);
  }

  function restart() {
    setScore(0); setTotal(0); setKidScore(0); setDone(false);
    setSelected(null);
    setQ(generateQuestion('easy'));
    setLevel('easy');
  }

  if (done) {
    return <RatingModal
      activity="pattern-puzzles"
      activityName="Pattern Puzzles"
      activityEmoji="🧩"
      onClose={() => { setScore(0); setTotal(0); setKidScore(0); setDone(false); setSelected(null); setQ(generateQuestion("easy")); setLevel("easy"); onBack(); }}
      kidName={kidName}
    />;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.title}>🧩 Pattern Puzzles</div>
        <div style={styles.score}>{score}/{total}</div>
      </div>

      {/* Level selector */}
      <div style={styles.tabs}>
        {(['easy', 'medium', 'hard'] as Level[]).map(l => (
          <button
            key={l}
            style={{ ...styles.tab, ...(level === l ? styles.tabActive : {}) }}
            onClick={() => { setSelected(null); next(l); }}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      {/* Rule label */}
      <div style={styles.ruleLabel}>{q.ruleLabel} pattern</div>

      {/* Pattern row: 3 shown + [?] gap */}
      <div style={styles.patternRow}>
        {q.shown.map((item, i) => (
          <div key={i} style={{ ...styles.patternItem, background: item.bgColor }}>
            <span style={styles.itemEmoji}>{item.emoji}</span>
            <span style={styles.itemLabel}>{item.label}</span>
          </div>
        ))}
        {/* Gap */}
        <div style={{ ...styles.patternItem, ...styles.gapItem }}>
          <span style={styles.gapText}>?</span>
          <span style={styles.itemLabel}>You pick!</span>
        </div>
      </div>

      {/* Hint */}
      <p style={styles.hint}>{q.hint}</p>

      {/* Choices */}
      <div style={styles.choices}>
        {q.choices.map((c, i) => {
          let btn = styles.choiceBtn;
          if (selected) {
            if (c.bgColor === q.correct.bgColor) btn = { ...styles.choiceBtn, ...styles.choiceCorrect };
            else if (c.bgColor === selected.bgColor && c.bgColor !== q.correct.bgColor) btn = { ...styles.choiceBtn, ...styles.choiceWrong };
            else btn = { ...styles.choiceBtn, ...styles.choiceDim };
          }
          return (
            <button key={i} style={btn} onClick={() => handleChoice(c)} disabled={!!selected}>
              <span style={styles.choiceEmoji}>{c.emoji}</span>
              <span style={styles.choiceLabel}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={styles.progress}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(total / 10) * 100}%` }} />
        </div>
        <span style={styles.progressText}>{total}/10</span>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#FFF8F0', fontFamily: 'Fredoka, sans-serif', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  backBtn: { background: '#C084FC', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '22px', fontWeight: 600, color: '#C084FC' },
  score: { fontSize: '18px', fontWeight: 600, color: '#C084FC' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  tab: { padding: '8px 20px', borderRadius: '12px', border: '2px solid #C084FC', background: 'white', color: '#C084FC', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', cursor: 'pointer' },
  tabActive: { background: '#C084FC', color: 'white' },
  ruleLabel: { fontSize: '18px', fontWeight: 600, color: '#C084FC', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  patternRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' },
  patternItem: { width: '80px', height: '80px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  gapItem: { background: '#E9ECEF', border: '3px dashed #C084FC', boxShadow: 'none' },
  gapText: { fontSize: '32px', fontWeight: 700, color: '#C084FC' },
  itemEmoji: { fontSize: '28px', lineHeight: 1 },
  itemLabel: { fontSize: '10px', color: 'rgba(0,0,0,0.6)', textAlign: 'center' },
  hint: { fontSize: '16px', color: '#666', marginBottom: '20px', textAlign: 'center', maxWidth: '400px' },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px' },
  choiceBtn: { background: 'white', border: '3px solid #E9ECEF', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s', minHeight: '90px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  choiceCorrect: { background: '#D3F9D8', borderColor: '#51CF66' },
  choiceWrong: { background: '#FFE3E3', borderColor: '#FF6B6B' },
  choiceDim: { opacity: 0.5 },
  choiceEmoji: { fontSize: '32px' },
  choiceLabel: { fontSize: '14px', fontWeight: 600, color: '#333' },
  progress: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '400px' },
  progressBar: { flex: 1, height: '8px', background: '#E9ECEF', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#C084FC', transition: 'width 0.3s' },
  progressText: { fontSize: '14px', color: '#C084FC', fontWeight: 600 },
};
