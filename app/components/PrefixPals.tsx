'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Prefix Pals — figure out the meaning of a new word when a prefix is added
// to a base word. Highlighted prefix in the question card.
//   🌱 Easy   (re-, un-)
//   🌿 Medium (+ pre-, dis-)
//   🌳 Hard   (+ mis-, non-)
// CCSS 2.L.4.b: Determine the meaning of the new word formed when a known
// prefix is added to a known word (e.g., happy/unhappy, tell/retell).

type Difficulty = 0 | 1 | 2;

interface PrefixEntry {
  base: string;
  prefix: string;
  result: string;
  meaning: string;
}

const POOL: Record<Difficulty, PrefixEntry[]> = {
  0: [
    { base: 'do',    prefix: 're', result: 'redo',     meaning: 'do again' },
    { base: 'tell',  prefix: 're', result: 'retell',   meaning: 'tell again' },
    { base: 'paint', prefix: 're', result: 'repaint',  meaning: 'paint again' },
    { base: 'play',  prefix: 're', result: 'replay',   meaning: 'play again' },
    { base: 'happy', prefix: 'un', result: 'unhappy',  meaning: 'not happy' },
    { base: 'fair',  prefix: 'un', result: 'unfair',   meaning: 'not fair' },
    { base: 'tie',   prefix: 'un', result: 'untie',    meaning: 'to loosen' },
    { base: 'pack',  prefix: 'un', result: 'unpack',   meaning: 'take things out' },
    { base: 'do',    prefix: 'un', result: 'undo',     meaning: 'reverse doing' },
    { base: 'wrap',  prefix: 're', result: 'rewrap',   meaning: 'wrap again' },
  ],
  1: [
    { base: 'heat',  prefix: 'pre', result: 'preheat',  meaning: 'heat before' },
    { base: 'view',  prefix: 'pre', result: 'preview',  meaning: 'see before' },
    { base: 'pay',   prefix: 'pre', result: 'prepay',   meaning: 'pay before' },
    { base: 'test',  prefix: 'pre', result: 'pretest',  meaning: 'test before' },
    { base: 'like',  prefix: 'dis', result: 'dislike',  meaning: 'not like' },
    { base: 'agree', prefix: 'dis', result: 'disagree', meaning: 'not agree' },
    { base: 'connect', prefix: 'dis', result: 'disconnect', meaning: 'to separate' },
    { base: 'appear', prefix: 'dis', result: 'disappear', meaning: 'go away' },
    { base: 'mix',   prefix: 're', result: 'remix',    meaning: 'mix again' },
    { base: 'safe',  prefix: 'un', result: 'unsafe',   meaning: 'not safe' },
  ],
  2: [
    { base: 'place', prefix: 'mis', result: 'misplace',  meaning: 'put in the wrong spot' },
    { base: 'spell', prefix: 'mis', result: 'misspell',  meaning: 'spell wrong' },
    { base: 'behave', prefix: 'mis', result: 'misbehave', meaning: 'behave badly' },
    { base: 'count', prefix: 'mis', result: 'miscount',  meaning: 'count wrong' },
    { base: 'stop',  prefix: 'non', result: 'nonstop',   meaning: 'without stopping' },
    { base: 'fiction', prefix: 'non', result: 'nonfiction', meaning: 'not fiction — true' },
    { base: 'violent', prefix: 'non', result: 'nonviolent', meaning: 'not violent' },
    { base: 'sense', prefix: 'non', result: 'nonsense',  meaning: 'without meaning' },
    { base: 'lead',  prefix: 'mis', result: 'mislead',   meaning: 'lead the wrong way' },
    { base: 'fat',   prefix: 'non', result: 'nonfat',    meaning: 'without fat' },
  ],
};

const PREFIX_COLORS: Record<string, string> = {
  re: 'var(--accent-blue)',
  un: 'var(--accent-orange)',
  pre: 'var(--accent-purple)',
  dis: 'var(--accent-pink)',
  mis: 'var(--accent-yellow)',
  non: 'var(--accent-green)',
};

interface Question {
  entry: PrefixEntry;
  correct: string;
  choices: string[];
  questionKind: 'meaning' | 'which-prefix';
}

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeQuestion(difficulty: Difficulty): Question {
  const pool = POOL[difficulty];
  const entry = pick(pool);
  // Build distractors from same difficulty's other meanings + a couple of plausible wrong ones
  const otherMeanings = pool.filter(p => p.result !== entry.result).map(p => p.meaning);
  const distractors = shuffle(otherMeanings).slice(0, 3);

  // For tier 2, occasionally ask "which prefix means X?" (reverse question)
  const reverse = difficulty === 2 && Math.random() < 0.25;

  if (!reverse) {
    return {
      entry,
      correct: entry.meaning,
      choices: shuffle([entry.meaning, ...distractors]),
      questionKind: 'meaning',
    };
  } else {
    // Reverse: "Which prefix means 'X'?" — give the meaning and pick the right prefix.
    const allPrefixes = ['re', 'un', 'pre', 'dis', 'mis', 'non'];
    const correct = entry.prefix;
    const wrong = allPrefixes.filter(p => p !== correct);
    const choices = shuffle([correct, ...shuffle(wrong).slice(0, 3)]);
    return {
      entry,
      correct,
      choices,
      questionKind: 'which-prefix',
    };
  }
}

const TOTAL_ROUNDS = 10;

export default function PrefixPals({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('prefixpals_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
    } catch {}
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setQuestion(makeQuestion(d));
    setLocked(false);
    setFeedback(null);
    setFlash(null);
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setQuestion(makeQuestion(d));
    setScore(0);
    setStreak(0);
    setCurrent(0);
    setFeedback(null);
    setLocked(false);
    setFlash(null);
    setScreen('play');
  }, []);

  const answer = useCallback((choice: string) => {
    if (locked) return;
    const isCorrect = choice === question.correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      const newScore = score + 10;
      const newCurrent = current + 1;
      setStreak(newStreak);
      setScore(newScore);
      setCurrent(newCurrent);
      setLocked(true);
      setFlash('good');
      const expl = question.questionKind === 'meaning'
        ? `✅ "${question.entry.result}" means "${question.entry.meaning}". The prefix "${question.entry.prefix}-" + base "${question.entry.base}".`
        : `✅ "${question.entry.prefix}-" is the prefix. "${question.entry.result}" means "${question.entry.meaning}".`;
      setFeedback({ kind: 'good', text: expl });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('prefixpals_best_streak', String(newStreak));
            setBestStreak(newStreak);
          }
        } catch {}
        if (isLast) {
          setScreen('results');
        } else {
          nextRound(difficulty);
        }
      }, 1100);
    } else {
      setStreak(0);
      setFlash('bad');
      const expl = question.questionKind === 'meaning'
        ? `Not quite. "${question.entry.result}" = "${question.entry.meaning}". The prefix "${question.entry.prefix}-" + base "${question.entry.base}".`
        : `Not quite. "${question.entry.result}" has the prefix "${question.entry.prefix}-".`;
      setFeedback({ kind: 'bad', text: expl });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, question, streak, score, current, bestStreak, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'play' && current > 0 && current % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [current, screen, showRating, rated]);

  const prefixColor = PREFIX_COLORS[question.entry.prefix] || 'var(--accent-blue)';

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🔑</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Prefix Pals</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          A <strong>prefix</strong> is a piece added to the start of a word that changes its meaning.
          Read the highlighted prefix and figure out what the new word means!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a prefix set:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · <span style={{ color: 'var(--accent-blue)' }}>re-</span> and <span style={{ color: 'var(--accent-orange)' }}>un-</span></span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · + <span style={{ color: 'var(--accent-purple)' }}>pre-</span> and <span style={{ color: 'var(--accent-pink)' }}>dis-</span></span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · + <span style={{ color: 'var(--accent-yellow)' }}>mis-</span> and <span style={{ color: 'var(--accent-green)' }}>non-</span></span>
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
          10 rounds per heat. Crack the codes to be a prefix master!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🔑' : stars >= 2 ? '🎉🔑' : stars >= 1 ? '👍🔑' : '💪🔑';
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>{medalEmoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 12 }}>
          Round complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
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
            🔄 Play Again
          </button>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>
            📋 Pick Level
          </button>
          <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>
            🏠 Home
          </button>
        </div>

        {showRating && !rated && (
          <RatingModal
            activity="prefix-pals"
            activityName="Prefix Pals"
            activityEmoji="🔑"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ──────────────────────────────────────────────
  const flashBg =
    flash === 'good' ? 'rgba(192, 132, 252, 0.32)'
    : flash === 'bad' ? 'rgba(255, 107, 107, 0.32)'
    : 'transparent';

  return (
    <div
      className="canvas-page slide-up"
      style={{ maxWidth: 720, position: 'relative', transition: 'background-color 0.18s', background: flashBg }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🔑 Prefix Pals</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-purple)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🔥 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{current + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div
        style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          border: '3px solid var(--accent-purple)',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text-medium)' }}>
          {question.questionKind === 'meaning' ? (
            <>What does the word mean?</>
          ) : (
            <>Which prefix means <strong>"{question.entry.meaning}"</strong>?</>
          )}
        </p>

        {question.questionKind === 'meaning' && (
          <div
            style={{
              marginTop: 16,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            <span
              style={{
                color: prefixColor,
                background: `${prefixColor.replace(')', ', 0.18)')}` || 'rgba(107, 203, 119, 0.18)',
                padding: '2px 8px',
                borderRadius: 8,
              }}
            >
              {question.entry.prefix}
            </span>
            <span style={{ color: 'var(--text-dark)' }}>
              {question.entry.result.substring(question.entry.prefix.length)}
            </span>
          </div>
        )}

        {question.questionKind === 'which-prefix' && (
          <div
            style={{
              marginTop: 16,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            <span style={{ color: prefixColor }}>?</span>
            <span>{question.entry.result.substring(question.entry.prefix.length)}</span>
            <div style={{ fontSize: 16, color: 'var(--text-medium)', marginTop: 8, fontWeight: 500 }}>
              ({question.entry.result})
            </div>
          </div>
        )}
      </div>

      {/* Choice buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {question.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(c)}
            disabled={locked}
            className="btn"
            style={{
              background: locked && c === question.correct ? 'var(--accent-green)' : locked ? '#E5E0D8' : 'white',
              color: locked && c === question.correct ? 'white' : 'var(--text-dark)',
              border: locked && c === question.correct ? '3px solid #3D8B47' : '2px solid #E5E0D8',
              fontSize: question.questionKind === 'which-prefix' ? 26 : 17,
              fontWeight: 700,
              padding: '14px 12px',
              borderRadius: 14,
              cursor: locked ? 'default' : 'pointer',
              fontFamily: 'Fredoka, sans-serif',
              minHeight: 50,
            }}
          >
            {c}
          </button>
        ))}
      </div>

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
        Tip: prefix <strong style={{ color: 'var(--accent-blue)' }}>re-</strong> means "again". prefix <strong style={{ color: 'var(--accent-orange)' }}>un-</strong> means "not" or "reverse".
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="prefix-pals"
          activityName="Prefix Pals"
          activityEmoji="🔑"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
