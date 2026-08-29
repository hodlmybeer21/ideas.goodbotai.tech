'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Poetry Park — recognize rhyme, rhythm, and the structure of poems.
//   � Easy   (pick the word that rhymes)
//   🌿 Medium (pick the two lines that rhyme in a poem)
//   🌳 Hard   (fill in the missing rhyme; identify poem type)
// CCSS 2.RL.4: Describe how words and phrases (e.g., regular beats,
// alliteration, rhymes, repeated lines) supply rhythm and meaning in a story,
// poem, or song.

type Difficulty = 0 | 1 | 2;

interface Question {
  kind: 'rhyming-word' | 'rhyming-lines' | 'fill-rhyme' | 'poem-type';
  prompt: string;
  promptLines?: string[];
  correct: string;
  choices: string[];
}

const CLASSIC_POEMS: { lines: string[]; type: 'rhyming' | 'alliteration' | 'repetition' }[] = [
  {
    lines: [
      'Roses are red,',
      'Violets are blue,',
      'Sugar is sweet,',
      'And so are you.',
    ],
    type: 'rhyming',
  },
  {
    lines: [
      'Twinkle, twinkle, little star,',
      'How I wonder what you are!',
      'Up above the world so high,',
      'Like a diamond in the sky.',
    ],
    type: 'rhyming',
  },
  {
    lines: [
      'Humpty Dumpty sat on a wall,',
      'Humpty Dumpty had a great fall.',
      "All the king's horses and all the king's men",
      "Couldn't put Humpty together again.",
    ],
    type: 'rhyming',
  },
  {
    lines: [
      'Baa, baa, black sheep,',
      'Have you any wool?',
      'Yes sir, yes sir,',
      'Three bags full.',
    ],
    type: 'rhyming',
  },
  {
    lines: [
      'Jack and Jill went up the hill',
      'To fetch a pail of water.',
      'Jack fell down and broke his crown',
      'And Jill came tumbling after.',
    ],
    type: 'rhyming',
  },
  {
    lines: [
      'Peter, Peter, pumpkin eater,',
      'Had a wife and couldn\'t keep her.',
      'Put her in a pumpkin shell',
      'And there he kept her very well.',
    ],
    type: 'rhyming',
  },
];

const RHYME_PAIRS: { word: string; rhymes: string[] }[] = [
  { word: 'cat',  rhymes: ['bat', 'hat', 'mat', 'rat', 'sat'] },
  { word: 'dog',  rhymes: ['fog', 'hog', 'log', 'jog'] },
  { word: 'tree', rhymes: ['bee', 'key', 'sea', 'me', 'free'] },
  { word: 'star', rhymes: ['car', 'far', 'jar', 'bar'] },
  { word: 'blue', rhymes: ['true', 'you', 'new', 'few', 'grew'] },
  { word: 'red',  rhymes: ['bed', 'head', 'said', 'bread'] },
  { word: 'sun',  rhymes: ['fun', 'run', 'one', 'done'] },
  { word: 'cake', rhymes: ['bake', 'lake', 'make', 'snake'] },
  { word: 'night', rhymes: ['bright', 'light', 'right', 'white', 'kite'] },
  { word: 'rain', rhymes: ['train', 'brain', 'plane', 'main'] },
];

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
  if (difficulty === 0) {
    // Easy: pick the word that rhymes
    const pair = pick(RHYME_PAIRS);
    const correct = pick(pair.rhymes);
    const distractors = shuffle(RHYME_PAIRS.filter(p => p.word !== pair.word).map(p => pick(p.rhymes))).slice(0, 3);
    return {
      kind: 'rhyming-word',
      prompt: `Which word rhymes with "${pair.word}"?`,
      correct,
      choices: shuffle([correct, ...distractors]),
    };
  }

  if (difficulty === 1) {
    // Medium: pick the two lines that rhyme (or pick which words in a line rhyme)
    const poem = pick(CLASSIC_POEMS);
    return {
      kind: 'rhyming-lines',
      prompt: 'Which two lines rhyme in this poem?',
      promptLines: poem.lines,
      correct: 'Lines 1 and 3', // we'll let players pick by tapping two — for now show as multiple choice
      choices: shuffle(['Lines 1 and 3', 'Lines 1 and 2', 'Lines 2 and 4', 'Lines 3 and 4']),
    };
  }

  // Hard: fill in the missing rhyme OR identify poem type
  if (Math.random() < 0.6) {
    // Fill rhyme
    const pair = pick(RHYME_PAIRS);
    const correct = pick(pair.rhymes);
    const distractors = shuffle(RHYME_PAIRS.filter(p => p.word !== pair.word).map(p => pick(p.rhymes))).slice(0, 3);
    return {
      kind: 'fill-rhyme',
      prompt: `Roses are red,\nViolets are blue,\nSugar is sweet,\nAnd so are ___.`,
      correct,
      choices: shuffle([correct, ...distractors]),
    };
  } else {
    // Identify poem type
    const correct = 'rhyming';
    const choices = shuffle([correct, 'alliteration', 'repetition', 'free verse']);
    return {
      kind: 'poem-type',
      prompt: 'Twinkle, twinkle, little star,\nHow I wonder what you are!\n\nWhat kind of poem is this?',
      correct,
      choices,
    };
  }
}

const TOTAL_ROUNDS = 10;

export default function PoetryPark({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
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
      const s = localStorage.getItem('poetrypark_best_streak');
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
      const expl =
        question.kind === 'rhyming-word'
          ? `✅ Yes! "${question.correct}" rhymes. 🎵`
          : question.kind === 'rhyming-lines'
          ? `✅ The matching rhymes are ${question.correct}.`
          : question.kind === 'fill-rhyme'
          ? `✅ "And so are ${question.correct}." — perfect rhyme! 🎵`
          : `✅ This is a ${question.correct} poem.`;
      setFeedback({ kind: 'good', text: expl });
      const isLast = newCurrent >= TOTAL_ROUNDS;
      setTimeout(() => {
        setFlash(null);
        try {
          if (newStreak > bestStreak) {
            localStorage.setItem('poetrypark_best_streak', String(newStreak));
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
      const expl =
        question.kind === 'rhyming-word'
          ? `Not quite — listen for the ending sound. The answer was "${question.correct}".`
          : question.kind === 'rhyming-lines'
          ? `Not quite — rhymes have the same ending sound. The answer was ${question.correct}.`
          : question.kind === 'fill-rhyme'
          ? `Not quite — the missing rhyme was "${question.correct}".`
          : `Not quite — this is a ${question.correct} poem.`;
      setFeedback({ kind: 'bad', text: expl });
      setTimeout(() => setFlash(null), 380);
    }
  }, [locked, question, streak, score, current, bestStreak, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'play' && current > 0 && current % 7 === 0 && !showRating && !rated) {
      setShowRating(true);
    }
  }, [current, screen, showRating, rated]);

  // ─── MENU ──────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🎭</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Poetry Park</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Poems have rhythm, rhymes, and special sounds! Spot the rhyming words,
          fill in the missing rhyme, and learn about different kinds of poems.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a rhyme level:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · pick the rhyming word</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · find the rhyming lines</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · fill the rhyme + poem types</span>
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
          10 rounds per heat. Speak the rhymes out loud!
        </p>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    const medalEmoji = stars >= 3 ? '🏆🎭' : stars >= 2 ? '🎉🎭' : stars >= 1 ? '👍🎭' : '💪🎭';
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
            activity="poetry-park"
            activityName="Poetry Park"
            activityEmoji="🎭"
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
      <h1 className="page-title" style={{ marginBottom: 6 }}>🎭 Poetry Park</h1>

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
          {question.kind === 'rhyming-word' && question.prompt}
          {question.kind === 'rhyming-lines' && question.prompt}
          {question.kind === 'fill-rhyme' && 'Fill in the missing rhyme:'}
          {question.kind === 'poem-type' && 'What kind of poem is this?'}
        </p>

        {/* Poem display */}
        {question.kind === 'rhyming-lines' && question.promptLines && (
          <div style={{ marginTop: 16, fontFamily: 'Fredoka, sans-serif', fontSize: 18, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            {question.promptLines.map((line, i) => (
              <div key={i} style={{ padding: '2px 0' }}>
                <span style={{ color: 'var(--accent-blue)', fontSize: 14, marginRight: 8 }}>{i + 1}.</span>
                {line}
              </div>
            ))}
          </div>
        )}

        {question.kind === 'fill-rhyme' && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 18px',
              background: '#FFF8E7',
              border: '2px dashed #E5B85A',
              borderRadius: 12,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              lineHeight: 1.7,
              color: 'var(--text-dark)',
              whiteSpace: 'pre-line',
            }}
          >
            {question.prompt}
          </div>
        )}

        {question.kind === 'poem-type' && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 18px',
              background: '#FFF8E7',
              border: '2px dashed #E5B85A',
              borderRadius: 12,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 19,
              lineHeight: 1.6,
              color: 'var(--text-dark)',
              whiteSpace: 'pre-line',
              textAlign: 'left',
            }}
          >
            {question.prompt}
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
              fontSize: 17,
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
        Tip: read the lines out loud. <strong>Rhymes</strong> have the same ending sound.
      </p>

      {showRating && !rated && (
        <RatingModal
          activity="poetry-park"
          activityName="Poetry Park"
          activityEmoji="🎭"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
