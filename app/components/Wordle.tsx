'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Wordle (kid edition) — 4-letter words with the classic green / yellow /
// gray feedback. Pick a target word, type a 4-letter guess, hit Enter
// to see which letters are right. 6 attempts to crack the word. Three
// difficulty tiers: Easy (6 attempts, very common words), Medium
// (5 attempts, common words), Hard (5 attempts, mixed words).
//   🌱 Easy   · 6 attempts, 60+ easy words (CAT, DOG, FISH, BEAR…)
//   🌿 Medium · 5 attempts, 100+ words
//   🌳 Hard   · 5 attempts, 120+ words including compound

type Difficulty = 0 | 1 | 2;
type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

const ROWS_BY_DIFF: Record<Difficulty, number> = { 0: 6, 1: 5, 2: 5 };

// 4-letter word list. Curated for kid-appropriateness and common vocabulary.
const WORDS: Record<Difficulty, string[]> = {
  0: [
    'cat','dog','fish','bear','bird','frog','duck','cake','ball','home',
    'star','moon','sun ','tree','rain','snow','book','milk','play','sing',
    'jump','run ','hop ','skip','fall','wind','kite','duck','bee ','owl ',
    'fox ','ant ','cow ','pig ','seed','leaf','rock','ship','boat','star',
    'fire','snow','wave','camp','tent','tree','baby','sock','shoe','gift',
  ].map(w => w.trim()).filter(w => w.length === 4),
  1: [
    'cat','dog','fish','bear','bird','frog','cake','ball','home','star',
    'moon','tree','rain','snow','book','milk','play','sing','jump','run ',
    'hop ','fall','wind','kite','duck','bee ','owl ','fox ','ant ','cow ',
    'pig ','rock','ship','boat','fire','wave','camp','tent','baby','sock',
    'shoe','gift','bowl','door','desk','lamp','tree','frog','crab','duck',
    'wolf','lion','crab','pear','plum','kiwi','corn','bean','soup','rice',
    'cake','milk','flan','taco','pita','naan','tuna','soda','cola','lemon',
    'lime','mint','sage','plum','pram','bike','sled','skate','canoe','boat',
  ].map(w => w.trim()).filter(w => w.length === 4),
  2: [
    'cat','dog','fish','bear','bird','frog','cake','ball','home','star',
    'moon','tree','rain','snow','book','milk','play','sing','jump','run ',
    'hop ','fall','wind','kite','duck','bee ','owl ','fox ','ant ','cow ',
    'pig ','rock','ship','boat','fire','wave','camp','tent','baby','sock',
    'shoe','gift','bowl','door','desk','lamp','crab','wolf','lion','tiger',
    'panda','zebra','horse','sheep','goose','swan','heron','eagle','snake','lizard',
    'newt ','frog','toad','salamander','gecko','iguana','turtle','snail','slug','worm',
    'ant ','bee ','wasp','beetle','mantis','cricket','aphid','midge','gnat','fly ',
  ].map(w => w.trim()).filter(w => w.length === 4),
};

const QWERTY_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

const TOTAL_ROUNDS = 3; // word-puzzles per match

function pickWord(difficulty: Difficulty): string {
  const list = WORDS[difficulty];
  return list[Math.floor(Math.random() * list.length)];
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(4).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const targetLetterCount: Record<string, number> = {};
  for (const c of targetArr) targetLetterCount[c] = (targetLetterCount[c] || 0) + 1;
  // First pass: greens
  for (let i = 0; i < 4; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetLetterCount[guessArr[i]]--;
    }
  }
  // Second pass: yellows
  for (let i = 0; i < 4; i++) {
    if (result[i] === 'correct') continue;
    const ch = guessArr[i];
    if (targetLetterCount[ch] && targetLetterCount[ch] > 0) {
      result[i] = 'present';
      targetLetterCount[ch]--;
    }
  }
  return result;
}

const COLOR_BG: Record<LetterState, string> = {
  correct: '#3D8B47', // green
  present: '#FFD93D', // yellow
  absent:  '#888888', // gray
  empty:   '#FFFFFF',
  tbd:     '#FFFFFF',
};
const COLOR_FG: Record<LetterState, string> = {
  correct: '#FFFFFF', present: '#2D1B00', absent: '#FFFFFF', empty: '#2D1B00', tbd: '#2D1B00',
};

export default function Wordle({ onBack, kidName }: { onBack: () => void; kidName?: string }) {
  const [screen, setScreen] = useState<'menu' | 'play' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [target, setTarget] = useState<string>('');
  const [guesses, setGuesses] = useState<{ word: string; states: LetterState[] }[]>([]);
  const [current, setCurrent] = useState('');
  const [round, setRound] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalRoundsWon, setTotalRoundsWon] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [shake, setShake] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [letterState, setLetterState] = useState<Record<string, LetterState>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(`wordle_best_${difficulty}`);
      if (s) setBestScore(parseInt(s, 10) || 0);
    } catch {}
  }, [difficulty]);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setTarget(pickWord(d));
    setGuesses([]);
    setCurrent('');
    setRound(0);
    setTotalRoundsWon(0);
    setGameOver(false);
    setWon(false);
    setLetterState({});
    setMsg(null);
    setScreen('play');
  }, []);

  const submitGuess = () => {
    if (gameOver || won) return;
    if (current.length !== 4) {
      setShake(true);
      setMsg('4 letters please!');
      setTimeout(() => { setShake(false); setMsg(null); }, 700);
      return;
    }
    if (!/^[a-z]{4}$/.test(current)) {
      setShake(true);
      setMsg('Letters only!');
      setTimeout(() => { setShake(false); setMsg(null); }, 700);
      return;
    }

    const states = evaluateGuess(current, target);
    const newGuesses = [...guesses, { word: current, states }];
    setGuesses(newGuesses);

    // Update letter state map (prioritize best state)
    const newLetterState = { ...letterState };
    for (let i = 0; i < 4; i++) {
      const ch = current[i];
      const cur = newLetterState[ch];
      const next = states[i];
      // Priority: correct > present > absent
      if (cur === 'correct') continue;
      if (cur === 'present' && next !== 'correct') continue;
      newLetterState[ch] = next;
    }
    setLetterState(newLetterState);

    setCurrent('');

    // Check win
    if (current === target) {
      setWon(true);
      setTotalRoundsWon(w => w + 1);
      setMsg('🎉 Got it!');
      setTimeout(() => finishRound(true), 1200);
      return;
    }

    // Check if out of attempts
    if (newGuesses.length >= ROWS_BY_DIFF[difficulty]) {
      setGameOver(true);
      setMsg(`The word was ${target.toUpperCase()}`);
      setTimeout(() => finishRound(false), 1500);
    }
  };

  const finishRound = (didWin: boolean) => {
    const newRoundsWon = totalRoundsWon + (didWin ? 1 : 0);
    // Save best (most rounds won in a row? Or fewest attempts?)
    if (newRoundsWon > bestScore) {
      try {
        localStorage.setItem(`wordle_best_${difficulty}`, String(newRoundsWon));
        setBestScore(newRoundsWon);
      } catch {}
    }
    const isLast = round + 1 >= TOTAL_ROUNDS;
    if (isLast) {
      setTimeout(() => setScreen('results'), 1200);
    } else {
      setTimeout(() => {
        setRound(r => r + 1);
        setTarget(pickWord(difficulty));
        setGuesses([]);
        setCurrent('');
        setLetterState({});
        setGameOver(false);
        setWon(false);
        setMsg(null);
      }, 1500);
    }
  };

  const handleKey = (key: string) => {
    if (gameOver || won) return;
    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      setCurrent(c => c.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key) && current.length < 4) {
      setCurrent(c => c + key.toLowerCase());
    }
  };

  // Keyboard handler
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') return handleKey('Enter');
      if (e.key === 'Backspace') return handleKey('Backspace');
      if (/^[a-zA-Z]$/.test(e.key) && e.key.length === 1) return handleKey(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', e => void 0);
  }, [screen, current, gameOver, won, target]);

  // ─── MENU ───
  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 560 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🟩</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Wordle</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Guess the 4-letter word in <strong>5-6 tries</strong>. After
          each guess, the tiles show: <span style={{ color: '#3D8B47', fontWeight: 700 }}>green</span> = right
          letter right spot, <span style={{ color: '#B89B00', fontWeight: 700 }}>yellow</span> = right letter
          wrong spot, gray = not in the word.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick your challenge:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · 6 tries, simple words</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · 5 tries, common words</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · 5 tries, mixed words</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {bestScore > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best rounds won (this level): <strong>{bestScore}</strong>
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          {TOTAL_ROUNDS} puzzles per match. Use keyboard or tap the keys.
        </p>
      </div>
    );
  }

  // ─── RESULTS ───
  if (screen === 'results') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 90, marginTop: 24 }}>🟩</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-green)', marginTop: 12 }}>
          Match complete!
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
          Rounds won: <strong>{totalRoundsWon}</strong> of {TOTAL_ROUNDS} · Best: <strong>{bestScore}</strong>
        </p>
        <div style={{ fontSize: 56, margin: '12px 0' }}>
          {totalRoundsWon === TOTAL_ROUNDS ? '⭐⭐⭐' : totalRoundsWon >= 2 ? '⭐⭐' : '⭐'}
        </div>

        {!rated && bestScore > 0 && (
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
            activity="wordle"
            activityName="Wordle"
            activityEmoji="🟩"
            kidName={kidName || ''}
            onClose={() => { setRated(true); setShowRating(false); }}
          />
        )}
      </div>
    );
  }

  // ─── PLAY ───
  const rows = ROWS_BY_DIFF[difficulty];

  return (
    <div
      className="canvas-page slide-up"
      style={{
        maxWidth: 720, position: 'relative',
        animation: shake ? 'shake 0.4s' : undefined,
      }}
    >
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ marginBottom: 6 }}>🟩 Wordle</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{round + 1}</strong>/{TOTAL_ROUNDS}</span>
        <span>·</span>
        <span>Rounds won <strong style={{ color: 'var(--accent-green)' }}>{totalRoundsWon}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestScore}</strong></span>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: won ? 'var(--accent-green)' : 'var(--accent-pink)', margin: '8px 0' }}>
          {msg}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Array.from({ length: rows }).map((_, r) => {
            const guess = guesses[r];
            const word = guess ? guess.word : (r === guesses.length ? current.padEnd(4, ' ') : '');
            const states: LetterState[] = guess
              ? guess.states
              : word.split('').map(ch => (ch === ' ' ? 'empty' : 'tbd') as LetterState);
            return (
              <div key={r} style={{ display: 'contents' }}>
                {states.map((state, ci) => {
                  const ch = (word[ci] || '').toLowerCase();
                  const isCurrentRow = r === guesses.length;
                  return (
                    <div
                      key={`${r}-${ci}`}
                      style={{
                        width: 56, height: 56,
                        background: COLOR_BG[state],
                        color: COLOR_FG[state],
                        border: isCurrentRow && ch ? `2px solid var(--accent-blue)` : state === 'empty' ? '2px solid #E5E0D8' : state === 'tbd' ? '2px solid #C5B5A2' : '2px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Fredoka, sans-serif', fontSize: 28, fontWeight: 700,
                        textTransform: 'uppercase',
                        transition: 'background-color 0.2s, transform 0.2s',
                      }}
                    >
                      {ch && ch !== ' ' ? ch.toUpperCase() : ''}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 8 }}>
        {QWERTY_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {ri === 2 && (
              <button
                onClick={() => handleKey('Enter')}
                disabled={gameOver || won || current.length !== 4}
                style={{
                  padding: '0 14px', height: 44, fontSize: 12, fontWeight: 700,
                  fontFamily: 'Fredoka, sans-serif', textTransform: 'uppercase',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: (gameOver || won || current.length !== 4) ? '#ccc' : 'var(--accent-blue)',
                  color: '#fff',
                }}
              >
                Enter
              </button>
            )}
            {row.map(key => {
              const ls = letterState[key] || 'empty';
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  disabled={gameOver || won}
                  style={{
                    width: 34, height: 44,
                    background: ls === 'empty' ? '#E5E0D8' : COLOR_BG[ls],
                    color: ls === 'empty' ? '#2D1B00' : COLOR_FG[ls],
                    border: 'none', borderRadius: 4,
                    fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {key}
                </button>
              );
            })}
            {ri === 2 && (
              <button
                onClick={() => handleKey('Backspace')}
                disabled={gameOver || won}
                style={{
                  padding: '0 10px', height: 44, fontSize: 14,
                  fontFamily: 'Fredoka, sans-serif', fontWeight: 700,
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: '#888', color: '#fff',
                }}
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-medium)', marginTop: 14 }}>
        Tip: type a 4-letter word and press <strong>Enter</strong>. Green = right letter, right spot. Yellow = right letter, wrong spot.
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>

      {showRating && !rated && (
        <RatingModal
          activity="wordle"
          activityName="Wordle"
          activityEmoji="🟩"
          kidName={kidName || ''}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}