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

// ─── Pre-authored questions ────────────────────────────────────────────────────
// Each question shows 4 items; the LAST one is the answer. Kid taps the "?" to guess.
// Every question is hand-verified correct. No random generation.

interface Item { emoji: string; bgColor: string; label: string }
interface Q { shown: Item[]; correct: Item; choices: Item[]; hint: string; rule: string }

function item(e: string, bg: string, l: string): Item { return { emoji: e, bgColor: bg, label: l } }

const PURPLE = '#C084FC'
const RED    = '#FF6B6B'
const BLUE   = '#4DABF7'
const GREEN  = '#51CF66'
const YELLOW = '#FFD43B'
const ORANGE = '#FF922B'
const WHITE  = '#F8F9FA'
const DARK   = '#495057'

const EASY_QS: Q[] = [
  // ABAB colors
  { shown: [item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🔴',RED,'Red'),item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green')], hint: 'Red, Blue, Red, Blue... what comes next?', rule: 'ABAB' },
  { shown: [item('🔵',BLUE,'Blue'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🔴',RED,'Red')], correct: item('🔴',RED,'Red'), choices: [item('🔴',RED,'Red'),item('🔵',BLUE,'Blue'),item('🟡',YELLOW,'Yellow')], hint: 'Blue, Red, Blue, Red... what comes next?', rule: 'ABAB' },
  { shown: [item('🟢',GREEN,'Green'), item('🟡',YELLOW,'Yellow'), item('🟢',GREEN,'Green'), item('🟡',YELLOW,'Yellow')], correct: item('🟡',YELLOW,'Yellow'), choices: [item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow'),item('🟠',ORANGE,'Orange')], hint: 'Green, Yellow, Green, Yellow... what comes next?', rule: 'ABAB' },
  { shown: [item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple'), item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple')], correct: item('🟣',PURPLE,'Purple'), choices: [item('🟡',YELLOW,'Yellow'),item('🟣',PURPLE,'Purple'),item('🔴',RED,'Red')], hint: 'Yellow, Purple, Yellow, Purple... what comes next?', rule: 'ABAB' },
  { shown: [item('🟠',ORANGE,'Orange'), item('🔴',RED,'Red'), item('🟠',ORANGE,'Orange'), item('🔴',RED,'Red')], correct: item('🔴',RED,'Red'), choices: [item('🔴',RED,'Red'),item('🟠',ORANGE,'Orange'),item('🔵',BLUE,'Blue')], hint: 'Orange, Red, Orange, Red... what comes next?', rule: 'ABAB' },
  { shown: [item('🔵',BLUE,'Blue'), item('🟢',GREEN,'Green'), item('🔵',BLUE,'Blue'), item('🟢',GREEN,'Green')], correct: item('🟢',GREEN,'Green'), choices: [item('🟢',GREEN,'Green'),item('🔵',BLUE,'Blue'),item('🟡',YELLOW,'Yellow')], hint: 'Blue, Green, Blue, Green... what comes next?', rule: 'ABAB' },
  { shown: [item('🟣',PURPLE,'Purple'), item('🟠',ORANGE,'Orange'), item('🟣',PURPLE,'Purple'), item('🟠',ORANGE,'Orange')], correct: item('🟠',ORANGE,'Orange'), choices: [item('🟠',ORANGE,'Orange'),item('🟣',PURPLE,'Purple'),item('🟢',GREEN,'Green')], hint: 'Purple, Orange, Purple, Orange... what comes next?', rule: 'ABAB' },
  { shown: [item('🔴',RED,'Red'), item('🟣',PURPLE,'Purple'), item('🔴',RED,'Red'), item('🟣',PURPLE,'Purple')], correct: item('🟣',PURPLE,'Purple'), choices: [item('🟣',PURPLE,'Purple'),item('🔴',RED,'Red'),item('🟡',YELLOW,'Yellow')], hint: 'Red, Purple, Red, Purple... what comes next?', rule: 'ABAB' },
  // AABB colors
  { shown: [item('🔴',RED,'Red'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🔴',RED,'Red'),item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green')], hint: 'Red, Red, Blue, Blue... what comes next?', rule: 'AABB' },
  { shown: [item('🟢',GREEN,'Green'), item('🟢',GREEN,'Green'), item('🟡',YELLOW,'Yellow'), item('🟡',YELLOW,'Yellow')], correct: item('🟡',YELLOW,'Yellow'), choices: [item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow'),item('🟠',ORANGE,'Orange')], hint: 'Green, Green, Yellow, Yellow... what comes next?', rule: 'AABB' },
  { shown: [item('🟡',YELLOW,'Yellow'), item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple'), item('🟣',PURPLE,'Purple')], correct: item('🟣',PURPLE,'Purple'), choices: [item('🟡',YELLOW,'Yellow'),item('🟣',PURPLE,'Purple'),item('🔴',RED,'Red')], hint: 'Yellow, Yellow, Purple, Purple... what comes next?', rule: 'AABB' },
  { shown: [item('🟠',ORANGE,'Orange'), item('🟠',ORANGE,'Orange'), item('🟢',GREEN,'Green'), item('🟢',GREEN,'Green')], correct: item('🟢',GREEN,'Green'), choices: [item('🟠',ORANGE,'Orange'),item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow')], hint: 'Orange, Orange, Green, Green... what comes next?', rule: 'AABB' },
  { shown: [item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue'), item('🟠',ORANGE,'Orange'), item('🟠',ORANGE,'Orange')], correct: item('🟠',ORANGE,'Orange'), choices: [item('🔵',BLUE,'Blue'),item('🟠',ORANGE,'Orange'),item('🔴',RED,'Red')], hint: 'Blue, Blue, Orange, Orange... what comes next?', rule: 'AABB' },
  { shown: [item('🟣',PURPLE,'Purple'), item('🟣',PURPLE,'Purple'), item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🟣',PURPLE,'Purple'),item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green')], hint: 'Purple, Purple, Blue, Blue... what comes next?', rule: 'AABB' },
  // ABAB shapes
  { shown: [item('⬜',WHITE,'White Square'), item('⬛',DARK,'Black Square'), item('⬜',WHITE,'White Square'), item('⬛',DARK,'Black Square')], correct: item('⬛',DARK,'Black Square'), choices: [item('⬜',WHITE,'White Square'),item('⬛',DARK,'Black Square'),item('🔺',RED,'Red Triangle')], hint: 'White Square, Black Square, White Square... what comes next?', rule: 'ABAB' },
  { shown: [item('🔺',RED,'Red Triangle'), item('🔻',BLUE,'Blue Triangle'), item('🔺',RED,'Red Triangle'), item('🔻',BLUE,'Blue Triangle')], correct: item('🔻',BLUE,'Blue Triangle'), choices: [item('🔺',RED,'Red Triangle'),item('🔻',BLUE,'Blue Triangle'),item('🔷',PURPLE,'Purple Diamond')], hint: 'Red Triangle, Blue Triangle, Red Triangle... what comes next?', rule: 'ABAB' },
  { shown: [item('🔷',PURPLE,'Purple Diamond'), item('🔶',ORANGE,'Orange Hexagon'), item('🔷',PURPLE,'Purple Diamond'), item('🔶',ORANGE,'Orange Hexagon')], correct: item('🔶',ORANGE,'Orange Hexagon'), choices: [item('🔶',ORANGE,'Orange Hexagon'),item('🔷',PURPLE,'Purple Diamond'),item('⬜',WHITE,'White Square')], hint: 'Purple Diamond, Orange Hexagon, Purple Diamond... what comes next?', rule: 'ABAB' },
  { shown: [item('🟩',GREEN,'Green Square'), item('🟪',PURPLE,'Purple Square'), item('🟩',GREEN,'Green Square'), item('🟪',PURPLE,'Purple Square')], correct: item('🟪',PURPLE,'Purple Square'), choices: [item('🟩',GREEN,'Green Square'),item('🟪',PURPLE,'Purple Square'),item('🔺',RED,'Red Triangle')], hint: 'Green Square, Purple Square, Green Square... what comes next?', rule: 'ABAB' },
]

const MEDIUM_QS: Q[] = [
  // ABC colors
  { shown: [item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🟢',GREEN,'Green'), item('🔴',RED,'Red')], correct: item('🔴',RED,'Red'), choices: [item('🔴',RED,'Red'),item('🔵',BLUE,'Blue'),item('🟡',YELLOW,'Yellow')], hint: 'Red, Blue, Green... what comes next? (it repeats!)', rule: 'ABC' },
  { shown: [item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple'), item('🟠',ORANGE,'Orange'), item('🟡',YELLOW,'Yellow')], correct: item('🟡',YELLOW,'Yellow'), choices: [item('🟡',YELLOW,'Yellow'),item('🟣',PURPLE,'Purple'),item('🟢',GREEN,'Green')], hint: 'Yellow, Purple, Orange... what comes next? (it repeats!)', rule: 'ABC' },
  { shown: [item('🔵',BLUE,'Blue'), item('🟢',GREEN,'Green'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow')], hint: 'Blue, Green, Red... what comes next? (it repeats!)', rule: 'ABC' },
  { shown: [item('🟠',ORANGE,'Orange'), item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple'), item('🟠',ORANGE,'Orange')], correct: item('🟠',ORANGE,'Orange'), choices: [item('🟠',ORANGE,'Orange'),item('🟡',YELLOW,'Yellow'),item('🟢',GREEN,'Green')], hint: 'Orange, Yellow, Purple... what comes next? (it repeats!)', rule: 'ABC' },
  { shown: [item('🟣',PURPLE,'Purple'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🟣',PURPLE,'Purple')], correct: item('🟣',PURPLE,'Purple'), choices: [item('🟣',PURPLE,'Purple'),item('🔴',RED,'Red'),item('🟠',ORANGE,'Orange')], hint: 'Purple, Red, Blue... what comes next? (it repeats!)', rule: 'ABC' },
  // AABB colors
  { shown: [item('🔴',RED,'Red'), item('🔴',RED,'Red'), item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🔴',RED,'Red'),item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green')], hint: 'Red, Red, Blue, Blue... what comes next?', rule: 'AABB' },
  { shown: [item('🟢',GREEN,'Green'), item('🟢',GREEN,'Green'), item('🟡',YELLOW,'Yellow'), item('🟡',YELLOW,'Yellow')], correct: item('🟡',YELLOW,'Yellow'), choices: [item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow'),item('🟠',ORANGE,'Orange')], hint: 'Green, Green, Yellow, Yellow... what comes next?', rule: 'AABB' },
  { shown: [item('🟡',YELLOW,'Yellow'), item('🟡',YELLOW,'Yellow'), item('🟣',PURPLE,'Purple'), item('🟣',PURPLE,'Purple')], correct: item('🟣',PURPLE,'Purple'), choices: [item('🟡',YELLOW,'Yellow'),item('🟣',PURPLE,'Purple'),item('🔴',RED,'Red')], hint: 'Yellow, Yellow, Purple, Purple... what comes next?', rule: 'AABB' },
  { shown: [item('🟠',ORANGE,'Orange'), item('🟠',ORANGE,'Orange'), item('🟢',GREEN,'Green'), item('🟢',GREEN,'Green')], correct: item('🟢',GREEN,'Green'), choices: [item('🟠',ORANGE,'Orange'),item('🟢',GREEN,'Green'),item('🟡',YELLOW,'Yellow')], hint: 'Orange, Orange, Green, Green... what comes next?', rule: 'AABB' },
  { shown: [item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue'), item('🟠',ORANGE,'Orange'), item('🟠',ORANGE,'Orange')], correct: item('🟠',ORANGE,'Orange'), choices: [item('🔵',BLUE,'Blue'),item('🟠',ORANGE,'Orange'),item('🔴',RED,'Red')], hint: 'Blue, Blue, Orange, Orange... what comes next?', rule: 'AABB' },
  { shown: [item('🟣',PURPLE,'Purple'), item('🟣',PURPLE,'Purple'), item('🔵',BLUE,'Blue'), item('🔵',BLUE,'Blue')], correct: item('🔵',BLUE,'Blue'), choices: [item('🟣',PURPLE,'Purple'),item('🔵',BLUE,'Blue'),item('🟢',GREEN,'Green')], hint: 'Purple, Purple, Blue, Blue... what comes next?', rule: 'AABB' },
  // ABC shapes
  { shown: [item('⬜',WHITE,'White Square'), item('⬛',DARK,'Black Square'), item('🔺',RED,'Red Triangle'), item('⬜',WHITE,'White Square')], correct: item('⬜',WHITE,'White Square'), choices: [item('⬜',WHITE,'White Square'),item('⬛',DARK,'Black Square'),item('🔺',RED,'Red Triangle')], hint: 'White Square, Black Square, Red Triangle... what comes next? (it repeats!)', rule: 'ABC' },
  { shown: [item('🔻',BLUE,'Blue Triangle'), item('🔷',PURPLE,'Purple Diamond'), item('🔶',ORANGE,'Orange Hexagon'), item('🔻',BLUE,'Blue Triangle')], correct: item('🔻',BLUE,'Blue Triangle'), choices: [item('🔻',BLUE,'Blue Triangle'),item('🔷',PURPLE,'Purple Diamond'),item('🔶',ORANGE,'Orange Hexagon')], hint: 'Blue Triangle, Purple Diamond, Orange Hexagon... what comes next? (it repeats!)', rule: 'ABC' },
]

const HARD_QS: Q[] = [
  // Count by 2
  { shown: [item('2',WHITE,'2'), item('4',WHITE,'4'), item('6',WHITE,'6'), item('8',WHITE,'8')], correct: item('10',WHITE,'10'), choices: [item('10',WHITE,'10'),item('9',WHITE,'9'),item('12',WHITE,'12')], hint: 'Count by 2s — what comes next?', rule: 'Count by 2' },
  { shown: [item('4',WHITE,'4'), item('6',WHITE,'6'), item('8',WHITE,'8'), item('10',WHITE,'10')], correct: item('12',WHITE,'12'), choices: [item('12',WHITE,'12'),item('11',WHITE,'11'),item('14',WHITE,'14')], hint: 'Count by 2s — what comes next?', rule: 'Count by 2' },
  { shown: [item('10',WHITE,'10'), item('12',WHITE,'12'), item('14',WHITE,'14'), item('16',WHITE,'16')], correct: item('18',WHITE,'18'), choices: [item('18',WHITE,'18'),item('17',WHITE,'17'),item('20',WHITE,'20')], hint: 'Count by 2s — what comes next?', rule: 'Count by 2' },
  // Count by 5
  { shown: [item('5',WHITE,'5'), item('10',WHITE,'10'), item('15',WHITE,'15'), item('20',WHITE,'20')], correct: item('25',WHITE,'25'), choices: [item('25',WHITE,'25'),item('30',WHITE,'30'),item('22',WHITE,'22')], hint: 'Count by 5s — what comes next?', rule: 'Count by 5' },
  { shown: [item('10',WHITE,'10'), item('15',WHITE,'15'), item('20',WHITE,'20'), item('25',WHITE,'25')], correct: item('30',WHITE,'30'), choices: [item('30',WHITE,'30'),item('28',WHITE,'28'),item('35',WHITE,'35')], hint: 'Count by 5s — what comes next?', rule: 'Count by 5' },
  { shown: [item('15',WHITE,'15'), item('20',WHITE,'20'), item('25',WHITE,'25'), item('30',WHITE,'30')], correct: item('35',WHITE,'35'), choices: [item('35',WHITE,'35'),item('33',WHITE,'33'),item('40',WHITE,'40')], hint: 'Count by 5s — what comes next?', rule: 'Count by 5' },
  // Count by 10
  { shown: [item('10',WHITE,'10'), item('20',WHITE,'20'), item('30',WHITE,'30'), item('40',WHITE,'40')], correct: item('50',WHITE,'50'), choices: [item('50',WHITE,'50'),item('45',WHITE,'45'),item('60',WHITE,'60')], hint: 'Count by 10s — what comes next?', rule: 'Count by 10' },
  { shown: [item('20',WHITE,'20'), item('30',WHITE,'30'), item('40',WHITE,'40'), item('50',WHITE,'50')], correct: item('60',WHITE,'60'), choices: [item('60',WHITE,'60'),item('55',WHITE,'55'),item('70',WHITE,'70')], hint: 'Count by 10s — what comes next?', rule: 'Count by 10' },
  { shown: [item('30',WHITE,'30'), item('40',WHITE,'40'), item('50',WHITE,'50'), item('60',WHITE,'60')], correct: item('70',WHITE,'70'), choices: [item('70',WHITE,'70'),item('65',WHITE,'65'),item('80',WHITE,'80')], hint: 'Count by 10s — what comes next?', rule: 'Count by 10' },
  // Count by 3
  { shown: [item('3',WHITE,'3'), item('6',WHITE,'6'), item('9',WHITE,'9'), item('12',WHITE,'12')], correct: item('15',WHITE,'15'), choices: [item('15',WHITE,'15'),item('14',WHITE,'14'),item('18',WHITE,'18')], hint: 'Count by 3s — what comes next?', rule: 'Count by 3' },
  { shown: [item('6',WHITE,'6'), item('9',WHITE,'9'), item('12',WHITE,'12'), item('15',WHITE,'15')], correct: item('18',WHITE,'18'), choices: [item('18',WHITE,'18'),item('16',WHITE,'16'),item('21',WHITE,'21')], hint: 'Count by 3s — what comes next?', rule: 'Count by 3' },
  // Arrow patterns
  { shown: [item('➡️',BLUE,'Right'), item('➡️',BLUE,'Right'), item('⬆️',RED,'Up'), item('➡️',BLUE,'Right')], correct: item('➡️',BLUE,'Right'), choices: [item('➡️',BLUE,'Right'),item('⬆️',RED,'Up'),item('⬇️',GREEN,'Down')], hint: 'Right, Right, Up... what comes next?', rule: 'Arrow Pattern' },
  { shown: [item('⬆️',RED,'Up'), item('⬆️',RED,'Up'), item('⬅️',YELLOW,'Left'), item('⬆️',RED,'Up')], correct: item('⬆️',RED,'Up'), choices: [item('⬆️',RED,'Up'),item('⬅️',YELLOW,'Left'),item('⬇️',GREEN,'Down')], hint: 'Up, Up, Left... what comes next?', rule: 'Arrow Pattern' },
  { shown: [item('⬇️',GREEN,'Down'), item('⬇️',GREEN,'Down'), item('➡️',BLUE,'Right'), item('⬇️',GREEN,'Down')], correct: item('⬇️',GREEN,'Down'), choices: [item('⬇️',GREEN,'Down'),item('➡️',BLUE,'Right'),item('⬆️',RED,'Up')], hint: 'Down, Down, Right... what comes next?', rule: 'Arrow Pattern' },
  { shown: [item('⬅️',YELLOW,'Left'), item('⬅️',YELLOW,'Left'), item('⬇️',GREEN,'Down'), item('⬅️',YELLOW,'Left')], correct: item('⬅️',YELLOW,'Left'), choices: [item('⬅️',YELLOW,'Left'),item('⬇️',GREEN,'Down'),item('➡️',BLUE,'Right')], hint: 'Left, Left, Down... what comes next?', rule: 'Arrow Pattern' },
]

type Level = 'easy' | 'medium' | 'hard';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickLevel(level: Level): Q[] {
  if (level === 'easy') return EASY_QS;
  if (level === 'medium') return MEDIUM_QS;
  return HARD_QS;
}

interface Props { onBack: () => void; kidName: string }

export default function PatternPuzzles({ onBack, kidName }: Props) {
  const [level, setLevel] = useState<Level>('easy');
  const [qs, setQs] = useState<Q[]>(() => shuffle(EASY_QS));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [kidScore, setKidScore] = useState(0);
  const [selected, setSelected] = useState<Item | null>(null);

  const q = qs[idx];

  function nextLevel(l: Level) {
    const bank = pickLevel(l);
    setQs(shuffle(bank));
    setIdx(0);
    setSelected(null);
    setLevel(l);
  }

  function handleChoice(c: Item) {
    if (selected) return;
    setSelected(c);
    setTotal(t => t + 1);
    const correct = c.bgColor === q.correct.bgColor && c.label === q.correct.label;
    if (correct) {
      setScore(s => s + 1);
      setKidScore(k => k + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setTimeout(() => {
      if (total + 1 >= 10) setDone(true);
      else setIdx(i => i + 1);
    }, 1200);
  }

  function restart() {
    setScore(0); setTotal(0); setKidScore(0); setDone(false); setSelected(null);
    setQs(shuffle(EASY_QS)); setIdx(0); setLevel('easy');
  }

  if (done) {
    return (
      <RatingModal
        activity="pattern-puzzles"
        activityName="Pattern Puzzles"
        activityEmoji="🧩"
        onClose={() => { restart(); onBack(); }}
        kidName={kidName}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.title}>🧩 Pattern Puzzles</div>
        <div style={styles.score}>{score}/{total}</div>
      </div>

      <div style={styles.tabs}>
        {(['easy', 'medium', 'hard'] as Level[]).map(l => (
          <button key={l} style={{ ...styles.tab, ...(level === l ? styles.tabActive : {}) }} onClick={() => nextLevel(l)}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.ruleBadge}>{q.rule} pattern</div>

      {/* Pattern row — last item is the "?" to fill */}
      <div style={styles.patternRow}>
        {q.shown.slice(0, 3).map((it, i) => (
          <div key={i} style={{ ...styles.patternItem, background: it.bgColor }}>
            <span style={styles.itemEmoji}>{it.emoji}</span>
            <span style={styles.itemLabel}>{it.label}</span>
          </div>
        ))}
        {/* The "?" box — revealed as the answer */}
        <div style={{ ...styles.patternItem, ...styles.questionBox }}>
          <span style={styles.questionMark}>?</span>
          <span style={styles.itemLabel}>YOU choose!</span>
        </div>
      </div>

      <p style={styles.hint}>{q.hint}</p>

      <div style={styles.choices}>
        {q.choices.map((c, i) => {
          let btn = styles.choiceBtn;
          if (selected) {
            const isCorrect = c.bgColor === q.correct.bgColor && c.label === q.correct.label;
            const isSelected = c.bgColor === selected.bgColor && c.label === selected.label;
            if (isCorrect) btn = { ...styles.choiceBtn, ...styles.choiceCorrect };
            else if (isSelected) btn = { ...styles.choiceBtn, ...styles.choiceWrong };
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

      <div style={styles.progress}>
        <div style={styles.progressBar}><div style={{ ...styles.progressFill, width: `${(total / 10) * 100}%` }} /></div>
        <span style={styles.progressText}>{total}/10</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#FFF8F0', fontFamily: 'Fredoka, sans-serif', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topBar: { width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  backBtn: { background: '#C084FC', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', cursor: 'pointer' },
  title: { fontSize: '22px', fontWeight: 600, color: '#C084FC' },
  score: { fontSize: '18px', fontWeight: 600, color: '#C084FC' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  tab: { padding: '8px 20px', borderRadius: '12px', border: '2px solid #C084FC', background: 'white', color: '#C084FC', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', cursor: 'pointer' },
  tabActive: { background: '#C084FC', color: 'white' },
  ruleBadge: { fontSize: '14px', fontWeight: 600, color: '#C084FC', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' },
  patternRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' },
  patternItem: { width: '80px', height: '80px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  questionBox: { background: '#FFF8F0', border: '3px dashed #C084FC', boxShadow: 'none' },
  questionMark: { fontSize: '36px', fontWeight: 700, color: '#C084FC', lineHeight: 1 },
  itemEmoji: { fontSize: '28px', lineHeight: 1 },
  itemLabel: { fontSize: '10px', color: 'rgba(0,0,0,0.6)', textAlign: 'center' },
  hint: { fontSize: '16px', color: '#666', marginBottom: '20px', textAlign: 'center', maxWidth: '400px' },
  choices: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', maxWidth: '400px' },
  choiceBtn: { background: 'white', border: '3px solid #E9ECEF', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minHeight: '90px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  choiceCorrect: { background: '#D3F9D8', borderColor: '#51CF66' },
  choiceWrong: { background: '#FFE3E3', borderColor: '#FF6B6B' },
  choiceDim: { opacity: 0.4 },
  choiceEmoji: { fontSize: '32px' },
  choiceLabel: { fontSize: '14px', fontWeight: 600, color: '#333' },
  progress: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '400px' },
  progressBar: { flex: 1, height: '8px', background: '#E9ECEF', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#C084FC', transition: 'width 0.3s' },
  progressText: { fontSize: '14px', color: '#C084FC', fontWeight: 600 },
};
