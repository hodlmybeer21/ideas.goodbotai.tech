'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Context Clue Cove — pirate/sea-themed word-meaning game.
// Use sentence-level context as a clue to the meaning of a word or phrase.
// CCSS 2.L.4.a: "Use sentence-level context as a clue to the meaning of a word or a phrase."
//
// Three tiers:
//   Easy   🌱 — definition in the sentence (appositive, "X means Y", synonym)
//   Medium 🌿 — single-sentence inference (cause/effect, example)
//   Hard   🌳 — 2-3 sentence story-style context
//
// Two question types per round:
//   "What does the word ___ mean in this sentence?"   → 4 meaning choices
//   "Which word in the sentence helps you understand ___?" → 4 context-clue choices
//
// 10 rounds per heat. Streak persists across visits in localStorage.

type Difficulty = 0 | 1 | 2;

interface Question {
  sentence: string;        // may contain 1-3 sentences for hard tier
  targetWord: string;       // the bold word the player must understand
  correctMeaning: string;   // the right plain-English meaning
  contextClue: string;      // the specific word/phrase in the sentence that hints at the meaning
  choices: string[];       // 4 multiple-choice options
  mode: 'meaning' | 'clue'; // which question is being asked
  prompt: string;           // shown above the sentence card
}

// ─── POOLS ────────────────────────────────────────────────────────────────────
//
// Each entry: { sentence, targetWord, meaning, clue }
//   - `sentence` includes the target word literally (we render it highlighted).
//   - `meaning` is a short, kid-friendly definition used as the correct choice.
//   - `clue` is the specific word/phrase in the sentence that gives it away.
//     Used as the correct choice for "which word helps you understand ___?" questions
//     AND used to ensure distractors are plausible.
//
// Tier 0 (Easy): definition is right in the sentence.
//   Pattern: "The X, which means Y, …"  OR  "X is a type of Y that …"  OR  "X, also called Y, …"

const POOL: Record<string, Array<{ sentence: string; targetWord: string; meaning: string; clue: string }>> = {
  easy: [
    { sentence: 'The arid desert was very dry, with no water for miles.', targetWord: 'arid',     meaning: 'very dry', clue: 'dry' },
    { sentence: 'The gigantic whale was enormous, bigger than our boat.',          targetWord: 'gigantic', meaning: 'very big', clue: 'enormous' },
    { sentence: 'The tiny seed was minuscule, hardly big enough to see.',           targetWord: 'minuscule', meaning: 'very small', clue: 'tiny' },
    { sentence: 'My brother is a male sibling who shares my parents with me.',       targetWord: 'sibling',  meaning: 'brother or sister', clue: 'brother' },
    { sentence: 'The baby was famished, so she was very hungry for milk.',          targetWord: 'famished', meaning: 'very hungry', clue: 'hungry' },
    { sentence: 'The feline cat purred as it stretched in the sunshine.',           targetWord: 'feline',   meaning: 'cat-like', clue: 'cat' },
    { sentence: 'Sarah felt joyful, which means she was very happy.',               targetWord: 'joyful',   meaning: 'very happy', clue: 'happy' },
    { sentence: 'We packed snacks, or small foods, for the hike.',                  targetWord: 'snacks',   meaning: 'small foods', clue: 'foods' },
    { sentence: 'The freezing pond was icy cold, too cold to swim in.',             targetWord: 'freezing', meaning: 'very cold', clue: 'cold' },
    { sentence: 'Dad shouted, "Quit that racket!" Racket means a loud noise.',      targetWord: 'racket',   meaning: 'loud noise', clue: 'loud noise' },
  ],

  // Tier 1 (Medium): single-sentence inference.
  //   Pattern: action → result, OR description → feeling. The player must infer.
  tier1: [
    { sentence: 'She tiptoed quietly across the floor so she wouldn\'t wake the baby.', targetWord: 'tiptoed',   meaning: 'walked softly', clue: 'quietly' },
    { sentence: 'He devoured the pizza in three bites because he was starving.',     targetWord: 'devoured',  meaning: 'ate quickly',   clue: 'three bites' },
    { sentence: 'The boy shivered under a blanket because he was cold.',             targetWord: 'shivered',  meaning: 'shook from cold', clue: 'cold' },
    { sentence: 'She beamed at her friends when she got an A on the test.',          targetWord: 'beamed',    meaning: 'smiled brightly', clue: 'friends' },
    { sentence: 'The puppy whimpered at the door because it missed its owner.',      targetWord: 'whimpered', meaning: 'cried softly',   clue: 'missed' },
    { sentence: 'He sprinted down the hallway to catch the bus on time.',            targetWord: 'sprinted',  meaning: 'ran very fast',  clue: 'down the hallway' },
    { sentence: 'She giggled at the silly joke her dad told at dinner.',             targetWord: 'giggled',   meaning: 'laughed a little', clue: 'silly' },
    { sentence: 'He glared at his sister after she took his toy.',                   targetWord: 'glared',    meaning: 'looked angrily',  clue: 'took his toy' },
    { sentence: 'The flowers bloomed in spring after the cold winter ended.',        targetWord: 'bloomed',   meaning: 'opened up',       clue: 'spring' },
    { sentence: 'She pondered the math problem for a long time before answering.',   targetWord: 'pondered',  meaning: 'thought deeply',  clue: 'long time' },
  ],

  // Tier 2 (Hard): 2-3 sentence story-style context. Reasoning spans sentences.
  tier2: [
    { sentence: 'The puppy wagged its tail excitedly. It was thrilled to see its owner come home. The puppy was overjoyed.', targetWord: 'wagged', meaning: 'moved back and forth', clue: 'excitedly' },
    { sentence: 'Maria tiptoed into the kitchen. The baby was finally asleep. She didn\'t want to wake him up.', targetWord: 'tiptoed', meaning: 'walked softly', clue: 'didn\'t want to wake' },
    { sentence: 'The log was buoyant in the water. It floated up instead of sinking. That\'s why we could use it as a raft.', targetWord: 'buoyant', meaning: 'able to float', clue: 'floated up' },
    { sentence: 'Jenna was famished after soccer practice. She hadn\'t eaten since breakfast. Now she could eat a whole pizza!', targetWord: 'famished', meaning: 'very hungry', clue: 'hadn\'t eaten since breakfast' },
    { sentence: 'The sky was dim and gray. Soon, droplets began to fall. Everyone reached for their umbrellas.', targetWord: 'droplets', meaning: 'small drops of water', clue: 'umbrellas' },
    { sentence: 'Tim was furious when his sister broke his game. He slammed the door and didn\'t speak for an hour.', targetWord: 'furious', meaning: 'very angry', clue: 'slammed the door' },
    { sentence: 'The detective examined the room closely. He noticed muddy footprints by the window. That was a vital clue.', targetWord: 'vital', meaning: 'very important', clue: 'clue' },
    { sentence: 'Anna was reluctant to jump into the cold pool. She hesitated at the edge. Finally her friend pulled her in.', targetWord: 'reluctant', meaning: 'not wanting to', clue: 'hesitated' },
    { sentence: 'The cave was pitch black inside. We couldn\'t see our hands. Dad turned on his flashlight right away.', targetWord: 'pitch black', meaning: 'completely dark', clue: 'couldn\'t see our hands' },
    { sentence: 'Leo gazed at the stars all night. He wondered how far away they were. He felt very small compared to the universe.', targetWord: 'gazed', meaning: 'looked steadily', clue: 'all night' },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolKey(d: Difficulty): 'easy' | 'tier1' | 'tier2' {
  if (d === 0) return 'easy';
  if (d === 1) return 'tier1';
  return 'tier2';
}

// Pull 3 plausible distractors for the chosen question type, given the correct
// answer and the candidate pool. Falls back to generic pirate-themed decoys
// if the pool is too small to give 3 unique siblings.
const GENERIC_MEANING_DIST = ['happy', 'sad', 'fast', 'slow', 'loud', 'quiet', 'tall', 'short', 'old', 'new', 'kind', 'mean'];
const GENERIC_CLUE_DIST = ['quickly', 'softly', 'yesterday', 'tomorrow', 'never', 'always', 'under', 'over', 'beside', 'between', 'around', 'inside'];

function makeMeaningChoices(correct: string, others: string[], poolAllMeanings: string[]): string[] {
  const set = new Set<string>([correct]);
  for (const o of others) if (!set.has(o)) set.add(o);
  // Pull from siblings, then a generic fallback.
  for (const o of shuffled(poolAllMeanings)) {
    if (set.size >= 4) break;
    if (o !== correct) set.add(o);
  }
  for (const o of shuffled(GENERIC_MEANING_DIST)) {
    if (set.size >= 4) break;
    if (o !== correct) set.add(o);
  }
  // Pad (should never hit in practice)
  while (set.size < 4) set.add(`__pad_m_${set.size}`);
  return shuffled(Array.from(set)).slice(0, 4);
}

function makeClueChoices(correct: string, others: string[], poolAllClues: string[]): string[] {
  const set = new Set<string>([correct]);
  for (const o of others) if (!set.has(o)) set.add(o);
  for (const o of shuffled(poolAllClues)) {
    if (set.size >= 4) break;
    if (o !== correct) set.add(o);
  }
  for (const o of shuffled(GENERIC_CLUE_DIST)) {
    if (set.size >= 4) break;
    if (o !== correct) set.add(o);
  }
  while (set.size < 4) set.add(`__pad_c_${set.size}`);
  return shuffled(Array.from(set)).slice(0, 4);
}

function makeQuestion(difficulty: Difficulty): Question {
  const key = poolKey(difficulty);
  const pool = POOL[key];
  const target = pick(pool);

  // 50/50: ask for the meaning, or for the context clue word.
  const mode: 'meaning' | 'clue' = Math.random() < 0.5 ? 'meaning' : 'clue';

  // Sibling distractors come from the same pool (so they're topically related
  // but wrong). Plus a top-up from across all tiers for variety.
  const allMeanings = [...POOL.easy, ...POOL.tier1, ...POOL.tier2].map(e => e.meaning);
  const allClues    = [...POOL.easy, ...POOL.tier1, ...POOL.tier2].map(e => e.clue);

  const siblingMeanings = pool.filter(e => e.meaning !== target.meaning).map(e => e.meaning);
  const siblingClues    = pool.filter(e => e.clue    !== target.clue).map(e => e.clue);

  if (mode === 'meaning') {
    const correct = target.meaning;
    const choices = makeMeaningChoices(correct, shuffled(siblingMeanings).slice(0, 4), allMeanings);
    return {
      sentence: target.sentence,
      targetWord: target.targetWord,
      correctMeaning: target.meaning,
      contextClue: target.clue,
      choices,
      mode,
      prompt: `What does the word "${target.targetWord}" mean in this sentence?`,
    };
  }

  const correct = target.clue;
  const choices = makeClueChoices(correct, shuffled(siblingClues).slice(0, 4), allClues);
  return {
    sentence: target.sentence,
    targetWord: target.targetWord,
    correctMeaning: target.meaning,
    contextClue: target.clue,
    choices,
    mode,
    prompt: `Which word in the sentence helps you understand "${target.targetWord}"?`,
  };
}

// ─── AUDIO (synth, no asset deps) ─────────────────────────────────────────────

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function ding() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(660, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(990, c.currentTime + 0.18);
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.26);
    o.start(c.currentTime); o.stop(c.currentTime + 0.28);
  } catch {}
}
function buzz() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.22);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.26);
    o.start(c.currentTime); o.stop(c.currentTime + 0.28);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 988, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.3);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.32);
    });
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
    delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left, background: p.color, animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

// ─── SENTENCE RENDERER ────────────────────────────────────────────────────────
// Highlight the target word in a contrasting color so the eye locks on it.
function HighlightedSentence({ sentence, target }: { sentence: string; target: string }) {
  // Case-insensitive split that preserves the original casing of the match.
  const idx = sentence.toLowerCase().indexOf(target.toLowerCase());
  if (idx === -1) {
    return <>{sentence}</>;
  }
  const before = sentence.slice(0, idx);
  const match = sentence.slice(idx, idx + target.length);
  const after = sentence.slice(idx + target.length);
  return (
    <>
      {before}
      <span style={{
        background: 'linear-gradient(180deg, #FFE082 0%, #FFD54F 100%)',
        color: '#5D4037',
        fontWeight: 800,
        padding: '2px 8px',
        borderRadius: 8,
        border: '2px solid #F9A825',
        boxShadow: '0 2px 0 #F9A825',
        whiteSpace: 'nowrap',
      }}>{match}</span>
      {after}
    </>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = 'contextcluecove_best_streak';

export default function ContextClueCove({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string; revealed?: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);
  const [pickedWrong, setPickedWrong] = useState<string | null>(null);

  // Hydrate best streak from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
    setScore(0); setStreak(0); setRound(0);
    setFeedback(null); setLocked(false); setPickedWrong(null);
    setScreen('play');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setFeedback(null); setLocked(false); setPickedWrong(null);
  }, []);

  const choose = useCallback((choice: string) => {
    if (locked) return;
    const isCorrect =
      (question.mode === 'meaning' && choice === question.correctMeaning) ||
      (question.mode === 'clue' && choice === question.contextClue);

    if (isCorrect) {
      const earned = 10;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      setPickedWrong(null);
      ding();
      setFeedback({
        kind: 'good',
        text: question.mode === 'meaning'
          ? `🏴‍☠️ Ahoy! "${question.targetWord}" means "${question.correctMeaning}". ✅`
          : `🏴‍☠️ Ahoy! "${question.contextClue}" is the word that gives it away. "${question.targetWord}" means "${question.correctMeaning}". ✅`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem(STORAGE_KEY, String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1500);
    } else {
      buzz();
      setStreak(0);
      setPickedWrong(choice);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({
        kind: 'bad',
        text: 'Not quite — try again!',
        revealed: question.mode === 'meaning' ? question.correctMeaning : question.contextClue,
      });
    }
  }, [locked, question, streak, bestStreak, round, difficulty, nextRound]);

  // Trigger rating modal every 7 correct answers.
  useEffect(() => {
    if (screen === 'play' && round > 0 && round % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [round, screen, showRating, rated]);

  // ─── MENU ─────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🏴‍☠️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Context Clue Cove</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Ahoy, matey! The words on the high seas can be tricky. Read the sentence — the <strong>other words around it</strong> will tell you what a tricky word means. Pick the meaning, or find the hidden clue!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a difficulty:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · meaning is right in the sentence</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · figure it out from one sentence</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · short story with 2–3 sentences</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best streak: <strong>{bestStreak}</strong>
          </p>
        )}
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 rounds per heat. Get it wrong and your streak resets!
        </p>
      </div>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>
            {stars >= 3 ? '🏆🏴‍☠️' : stars >= 1 ? '🎉🏴‍☠️' : '💪🏴‍☠️'}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
            Voyage complete!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Final streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best streak ever: <strong>{bestStreak}</strong>
          </p>

          {!rated && score >= 50 && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
              📋 Pick Level
            </button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="context-clue-cove"
            activityName="Context Clue Cove"
            activityEmoji="🏴‍☠️"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ────────────────────────────────────────────────
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🏴‍☠️ Context Clue Cove</h1>

      {/* Top status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <p style={{
        fontSize: 17, fontWeight: 700, color: 'var(--text-dark)',
        textAlign: 'center', marginBottom: 14,
      }}>
        {question.prompt}
      </p>

      {/* Sentence card */}
      <div
        style={{
          background: 'white',
          padding: '22px 22px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-blue)',
          marginBottom: 18,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
        }}
      >
        <p style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 22,
          lineHeight: 1.55,
          color: 'var(--text-dark)',
          margin: 0,
          textAlign: 'left',
        }}>
          <HighlightedSentence sentence={question.sentence} target={question.targetWord} />
        </p>
        <div style={{
          marginTop: 12,
          fontSize: 12,
          color: 'var(--text-medium)',
          fontStyle: 'italic',
          textAlign: 'right',
        }}>
          ⛵ {difficulty === 0 ? 'tide pool' : difficulty === 1 ? 'open water' : 'deep ocean'}
        </div>
      </div>

      {/* Choices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 6,
      }}>
        {question.choices.map((c, i) => {
          const isWrongPick = pickedWrong === c && !locked;
          const isTheRightOne = locked && c === (question.mode === 'meaning' ? question.correctMeaning : question.contextClue);
          return (
            <button
              key={`${c}-${i}`}
              onClick={() => choose(c)}
              disabled={locked}
              className="btn"
              style={{
                fontSize: 17,
                fontWeight: 700,
                padding: '16px 12px',
                background: isTheRightOne
                  ? 'var(--accent-green)'
                  : isWrongPick
                    ? '#FECACA'
                    : 'white',
                color: isTheRightOne ? 'white' : 'var(--text-dark)',
                border: isTheRightOne
                  ? '3px solid var(--accent-green)'
                  : isWrongPick
                    ? '3px solid #DC2626'
                    : '3px solid #E5E0D8',
                boxShadow: isTheRightOne
                  ? '0 4px 0 #2E7D32'
                  : isWrongPick
                    ? '0 4px 0 #B91C1C'
                    : '0 4px 0 #C5B5A2',
                cursor: locked ? 'default' : 'pointer',
                opacity: locked && !isTheRightOne ? 0.55 : 1,
                fontFamily: 'Fredoka, sans-serif',
                minHeight: 56,
                textAlign: 'center',
                animation: isWrongPick ? 'shake 0.3s ease' : 'none',
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Hint after a wrong try */}
      {pickedWrong && !locked && (
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Hint: read the sentence slowly. What is happening near <strong>{question.targetWord}</strong>?
        </p>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 14,
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 16,
            animation: 'pop 0.3s ease',
            background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
            color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap an answer. If you get it wrong, your streak resets to zero!
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="context-clue-cove"
          activityName="Context Clue Cove"
          activityEmoji="🏴‍☠️"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
