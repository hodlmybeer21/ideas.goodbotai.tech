'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Comma Crew — postal-worker themed practice for CCSS 2.L.2.b:
//   "Use commas in greetings and closings of letters."
// Kids pick which fully-punctuated version of a letter is correct:
//   Easy (🌱):   greeting OR closing — one comma to insert
//   Medium (🌿): greeting + date — two commas to insert
//   Hard (🌳):   full friendly letter — greeting, full date, closing
// 10 rounds per heat, streak + best-streak persistence in localStorage.

type Difficulty = 0 | 1 | 2;

interface RawLetter {
  // The "comic book" framing — each tier builds progressively.
  // Each entry produces one letter. We then synthesize distractors that
  // vary only the comma placement so the player really focuses on commas.
  greeting: string;   // e.g. "Dear Sam"   (no trailing comma)
  date: string;       // e.g. "March 5 2026"  (no inner commas). null for tier 0.
  body: string;       // middle line(s) — no commas inside, just friendly text
  closing: string;    // e.g. "Love Tyler"   (no comma)
  signOff: string;    // e.g. "Your friend"  (the closing is "SignOff Name")
}

interface Question {
  text: string;       // what we display: e.g. "Dear Sam, March 5, 2026" — used as the prompt label
  correct: string;    // the FULLY punctuated version, single string with \n
  choices: string[];  // 4 multiple-choice options, exactly one matches `correct`
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Kid-friendly names + situations for letters.
const NAMES = [
  'Sam', 'Mom', 'Dad', 'Grandma', 'Grandpa', 'Aunt Lily', 'Uncle Ben',
  'Coach Mia', 'Mr. Rogers', 'Ms. Patel', 'Pen Pal Jay', 'Cousin Theo',
  'Aunt Rosa', 'Uncle Omar', 'Friend Zoe', 'Nana June', 'Papa Frank',
  'Mr. Lee', 'Mrs. Davis', 'Coach Ben', 'Pen Pal Kai',
];

const SIGN_OFFS = [
  { signOff: 'Love',          letter: 'warm' },
  { signOff: 'Your friend',   letter: 'warm' },
  { signOff: 'Sincerely',     letter: 'formal' },
  { signOff: 'From',          letter: 'warm' },
  { signOff: 'Best wishes',   letter: 'warm' },
  { signOff: 'With love',     letter: 'warm' },
  { signOff: 'Yours truly',   letter: 'formal' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
];

const BODIES_WARM = [
  'Thank you for the birthday present',
  'I had a great time at the park today',
  'Our puppy learned a new trick',
  'I finished reading my book',
  'We are going to the beach this summer',
  'I made a new friend at school',
  'The school play was so much fun',
  'My team won the big game',
];

const BODIES_FORMAL = [
  'I am writing to thank you for your help',
  'Please let me know when you are free',
  'I enjoyed our visit very much',
  'The poster you sent looks great on my wall',
  'I am looking forward to seeing you soon',
];

function makeRawLetter(difficulty: Difficulty): RawLetter {
  const so = pick(SIGN_OFFS);
  const bodyPool = so.letter === 'formal' ? BODIES_FORMAL : BODIES_WARM;
  const date: string | null =
    difficulty === 0
      ? null
      : difficulty === 1
        ? `${pick(MONTHS)} ${randInt(1, 28)} ${randInt(2024, 2027)}`
        : difficulty === 2
          ? `${pick(WEEKDAYS)} ${pick(MONTHS)} ${randInt(1, 28)} ${randInt(2024, 2027)}`
          : null;

  return {
    greeting: `Dear ${pick(NAMES)}`,
    date: date as any,
    body: pick(bodyPool) + '.',
    closing: so.signOff,
    signOff: '',
  };
}

// Build a fully punctuated, multi-line letter.
function punctuate(raw: RawLetter): string {
  // greeting + date line
  const greetingLine = `${raw.greeting},`;
  let dateLine = '';
  if (raw.date) {
    // For tier 2 the date already contains a weekday and we keep it: "Tuesday, March 5, 2026"
    // For tier 1 the date is just month/day/year: "March 5, 2026"
    // The raw.date has no commas — we split on whitespace and inject commas
    // between weekday-month, month-day, day-year.
    const parts = raw.date.split(' ');
    if (parts.length === 4) {
      // [Weekday, Month, Day, Year]
      dateLine = `${parts[0]}, ${parts[1]} ${parts[2]}, ${parts[3]}`;
    } else {
      // [Month, Day, Year]
      dateLine = `${parts[0]} ${parts[1]}, ${parts[2]}`;
    }
  }
  const closingLine = `${raw.closing}, ${pick(NAMES)}`;
  // Title-cased fallback for the signer to avoid repeats if NAME was already used in greeting
  // (looks nicer when it differs slightly)

  return [greetingLine, dateLine, raw.body, closingLine].filter(Boolean).join('\n');
}

// Build 4 multiple-choice options: the correct letter + 3 "wrong" versions
// that misplace the commas. Each wrong version moves commas to wrong spots.
function makeChoices(raw: RawLetter, correct: string): string[] {
  const set = new Set<string>();
  set.add(correct);

  // Distractor 1: no commas at all
  const noCommas = [
    raw.greeting,
    raw.date || '',
    raw.body,
    `${raw.closing} ${pick(NAMES)}`,
  ].filter(Boolean).join('\n');
  set.add(noCommas);

  // Distractor 2: comma after the body sentence instead of greeting/closing
  const bodyComma = [
    raw.greeting,
    raw.date || '',
    raw.body + ',',
    `${raw.closing} ${pick(NAMES)}`,
  ].filter(Boolean).join('\n');
  set.add(bodyComma);

  // Distractor 3: commas flipped — one in the closing prefix, none in greeting
  const flipped = [
    raw.greeting,
    raw.date || '',
    raw.body,
    `${raw.closing}, ${pick(NAMES)}`,
  ].filter(Boolean).join('\n');
  set.add(flipped);

  // If we somehow have duplicates (same signer repeats), keep adding variants.
  let guard = 0;
  while (set.size < 4 && guard++ < 20) {
    // Move a comma to an obviously-wrong position: between greeting word and name
    const wrongGreeting = `${raw.greeting.split(' ')[0]} ${raw.greeting.split(' ').slice(1).join(' ')},`;
    const variant = [wrongGreeting, raw.date || '', raw.body, `${raw.closing} ${pick(NAMES)}`]
      .filter(Boolean).join('\n');
    set.add(variant);
  }

  const arr = Array.from(set).slice(0, 4);
  while (arr.length < 4) {
    arr.push(correct + ' ' + arr.length); // padding, should never happen
  }
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeQuestion(difficulty: Difficulty): Question {
  const raw = makeRawLetter(difficulty);
  const correct = punctuate(raw);
  // For display, show the *un-punctuated* prompt? The spec says "Show the letter text
  // with ___ markers". Easier & cleaner UX: show a small label "Which version uses
  // commas correctly?" plus a tasteful mini "before" view, then 4 choices.
  // We'll display the raw un-punctuated version above the choices so kids see what
  // they're fixing — that's the pedagogical moment.
  const text = [
    raw.greeting,
    raw.date || '',
    raw.body,
    `${raw.closing} ${pick(NAMES)}`,
  ].filter(Boolean).join('\n');

  // We need to ensure the displayed "before" text differs from `correct`:
  // If the random signer happens to put no commas in `text`, the un-punctuated
  // version IS the noCommas distractor, which is fine. If it accidentally
  // matches `correct`, regenerate once.
  let finalCorrect = correct;
  let finalText = text;
  if (finalText === finalCorrect) {
    // force a comma-free display by removing any (shouldn't happen — correct has commas)
    finalText = noCommaText(raw);
  }
  return {
    text: finalText,
    correct: finalCorrect,
    choices: makeChoices(raw, finalCorrect),
  };
}

function noCommaText(raw: RawLetter): string {
  return [
    raw.greeting,
    raw.date || '',
    raw.body,
    `${raw.closing} ${pick(NAMES)}`,
  ].filter(Boolean).join('\n');
}

// ─── Audio (synth, no asset deps) ─────────────────────────────────────────────
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
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    o.start(c.currentTime); o.stop(c.currentTime + 0.24);
  } catch {}
}
function buzz() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 0.22);
    g.gain.setValueAtTime(0.13, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.26);
    o.start(c.currentTime); o.stop(c.currentTime + 0.28);
  } catch {}
}
function fanfare() {
  try {
    const c = ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.28);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.3);
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
          left: `${p.left}%`,
          background: p.color,
          animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 10;

export default function CommaCrew({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(0));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0); // # of correctly solved
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);
  const [delivered, setDelivered] = useState(false);

  const safeKidName = kidName || 'friend';

  // Hydrate best streak
  useEffect(() => {
    try {
      const s = localStorage.getItem('commacrew_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
    setScore(0);
    setStreak(0);
    setRound(0);
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
    setScreen('play');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setAttempts(0);
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((choice: string) => {
    if (locked) return;
    if (choice === question.correct) {
      const earned = attempts === 0 ? 10 : attempts === 1 ? 5 : 2;
      const newStreak = streak + 1;
      setScore(s => s + earned);
      setStreak(newStreak);
      setRound(r => r + 1);
      setLocked(true);
      ding();
      setDelivered(true);
      setTimeout(() => setDelivered(false), 900);
      setFeedback({
        kind: 'good',
        text: `📬 Delivered! Commas placed correctly.`,
      });
      const isLast = round + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('commacrew_best_streak', String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1300);
    } else {
      buzz();
      setStreak(0);
      setAttempts(a => a + 1);
      setShake(true);
      setTimeout(() => setShake(false), 380);
      setFeedback({
        kind: 'bad',
        text: attempts === 0
          ? 'Not quite — look at the envelope again!'
          : 'Still not right. The correct version is highlighted below.',
      });
    }
  }, [locked, question, attempts, streak, bestStreak, round, difficulty, nextRound]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>📬</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Comma Crew</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          You're the postal worker! Letters go in envelopes only when the commas are in the right spot.
          Greetings and closings of friendly letters always need a comma — and so do the parts of a date!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a route:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 1 comma (greeting OR closing)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · greeting + date (2 commas)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · full letter (3+ commas)</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestStreak > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best delivery streak: <strong>{bestStreak}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          10 letters per route. Faster, more accurate deliveries earn more points!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆📬' : stars >= 1 ? '🎉📬' : '💪📬'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 12 }}>
            Route complete!
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>

          {!rated && score >= 50 && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>
              🔄 Deliver Again
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
              📋 New Route
            </button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
              🏠 Home
            </button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal
            activity="comma-crew"
            activityName="Comma Crew"
            activityEmoji="📬"
            kidName={safeKidName}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  // Pre-format the "un-punctuated" letter for display.
  const lines = question.text.split('\n');

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>📬 Comma Crew</h1>

      {/* Top status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Letter <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      {/* Envelope card */}
      <div
        style={{
          background: 'linear-gradient(180deg, #FFF8E7 0%, #FFEFD3 100%)',
          padding: '20px 18px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-orange)',
          marginBottom: 16,
          position: 'relative',
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 0.08s',
          fontFamily: 'Fredoka, sans-serif',
        }}
      >
        {/* Stamp */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 44,
            height: 52,
            background: 'white',
            border: '2px dashed var(--accent-pink)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            transform: 'rotate(6deg)',
          }}
        >
          ✉️
        </div>

        {/* Address label header */}
        <div style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-medium)', marginBottom: 8, letterSpacing: 1 }}>
          TO THE READER:
        </div>

        {/* Letter text with ___ blank markers */}
        <div
          style={{
            textAlign: 'left',
            fontSize: 20,
            lineHeight: 1.55,
            color: 'var(--text-dark)',
            background: 'white',
            padding: '16px 16px',
            borderRadius: 12,
            border: '1px dashed #D9C9A6',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ minHeight: 28 }}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Delivered stamp */}
        {delivered && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-12deg)',
              fontSize: 56,
              fontWeight: 900,
              color: 'var(--accent-green)',
              border: '6px solid var(--accent-green)',
              borderRadius: 12,
              padding: '8px 24px',
              letterSpacing: 4,
              background: 'rgba(255,255,255,0.85)',
              animation: 'pop 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            DELIVERED ✓
          </div>
        )}
      </div>

      {/* Prompt */}
      <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-dark)', margin: '6px 0 12px' }}>
        Which version is stamped correctly?
      </p>

      {/* 4 fully-formed choice buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 6,
          textAlign: 'left',
        }}
      >
        {question.choices.map((c, i) => {
          // Highlight the correct one if the player has tried twice and we're showing the answer.
          const showCorrect = locked && c === question.correct;
          const isWrong = locked && c !== question.correct;
          return (
            <button
              key={`${i}-${c.slice(0, 12)}`}
              onClick={() => choose(c)}
              disabled={locked}
              className="btn"
              style={{
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 14px',
                background: showCorrect ? '#E8F8EE' : 'white',
                color: 'var(--text-dark)',
                border: `3px solid ${showCorrect ? 'var(--accent-green)' : '#E5E0D8'}`,
                boxShadow: showCorrect
                  ? '0 4px 0 var(--accent-green)'
                  : '0 4px 0 #C5B5A2',
                cursor: locked ? 'default' : 'pointer',
                opacity: isWrong ? 0.55 : 1,
                fontFamily: 'Fredoka, sans-serif',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Attempts / hint */}
      {attempts >= 2 && !locked && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
          💡 Hint: a greeting like <em>"Dear Sam"</em> becomes <em>"Dear Sam<strong>,</strong>"</em> — and dates always have a comma between the day and year.
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
            fontSize: 17,
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
        Tap the version with the commas in the right spots. Wrong picks reset your streak!
      </p>

      {/* Quick rate prompt */}
      {round > 0 && round % 7 === 0 && !showRating && !rated && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            onClick={() => setShowRating(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-blue)',
              cursor: 'pointer', fontSize: 14, textDecoration: 'underline',
            }}
          >
            ⭐ Rate Comma Crew
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="comma-crew"
          activityName="Comma Crew"
          activityEmoji="📬"
          kidName={safeKidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}