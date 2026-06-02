'use client';

import { useState } from 'react';

const WORDS = [
  { base: 'bunch', suffix: 'es' },
  { base: 'cake', suffix: 's' },
  { base: 'brush', suffix: 'es' },
  { base: 'fox', suffix: 'es' },
  { base: 'napkin', suffix: 's' },
  { base: 'class', suffix: 'es' },
  { base: 'dish', suffix: 'es' },
  { base: 'box', suffix: 'es' },
  { base: 'cup', suffix: 's' },
  { base: 'bench', suffix: 'es' },
  { base: 'hat', suffix: 's' },
  { base: 'wish', suffix: 'es' },
];

const SUFFIX_OPTIONS = ['s', 'es'];

interface GameState {
  wordIndex: number;
  score: number;
  total: number;
  correct: boolean | null;
  selectedSuffix: string | null;
  streak: number;
  done: boolean;
}

export default function PluralBuilder({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [state, setState] = useState<GameState>({
    wordIndex: 0,
    score: 0,
    total: 0,
    correct: null,
    selectedSuffix: null,
    streak: 0,
    done: false,
  });

  const currentWord = WORDS[state.wordIndex % WORDS.length];

  function handlePick(suffix: string) {
    const correct = suffix === currentWord.suffix;
    const newTotal = state.total + 1;
    const newScore = state.score + (correct ? 1 : 0);
    const newStreak = correct ? state.streak + 1 : 0;
    const newDone = state.wordIndex >= WORDS.length - 1 && newTotal >= 5;

    setState({
      ...state,
      selectedSuffix: suffix,
      correct,
      total: newTotal,
      score: newScore,
      streak: newStreak,
      done: newDone,
    });
  }

  function handleNext() {
    setState({
      ...state,
      wordIndex: state.wordIndex + 1,
      correct: null,
      selectedSuffix: null,
      done: false,
    });
  }

  function handleReset() {
    setState({
      wordIndex: 0,
      score: 0,
      total: 0,
      correct: null,
      selectedSuffix: null,
      streak: 0,
      done: false,
    });
  }

  const emoji = state.correct === true ? '🎉' : state.correct === false ? '😬' : '🤔';

  if (state.done) {
    const pct = Math.round((state.score / state.total) * 100);
    return (
      <div className="activity-container slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}</div>
          <h2 style={{ color: 'var(--accent-pink)', fontSize: 28 }}>Great job, {kidName}!</h2>
          <p style={{ fontSize: 20, color: 'var(--text-dark)' }}>
            You got <strong>{state.score}/{state.total}</strong> right!
          </p>
          <p style={{ color: '#6B7280', fontSize: 16 }}>{pct >= 80 ? "You're a plural pro!" : pct >= 60 ? "Keep practicing!" : "Every try makes you smarter!"}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleReset}>Play Again 🔄</button>
            <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-container slide-up">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 14, background: 'var(--accent-pink)', color: 'white', borderRadius: 20, padding: '4px 16px' }}>Plural Builder 📝</span>
        <h2 style={{ fontSize: 24, marginTop: 12 }}>
          What makes <span style={{ color: 'var(--accent-pink)', fontWeight: 800 }}>{currentWord.base}</span> plural?
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Pick the right suffix!</p>
      </div>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24 }}>
        {SUFFIX_OPTIONS.map(sfx => {
          const disabled = state.selectedSuffix !== null;
          const chosen = state.selectedSuffix === sfx;
          const correct = sfx === currentWord.suffix;
          let bg = 'white';
          let border = '#E5E7EB';
          let opacity = 1;
          if (state.selectedSuffix !== null) {
            if (correct) { bg = '#D1FAE5'; border = '#10B981'; }
            else if (chosen && !correct) { bg = '#FEE2E2'; border = '#EF4444'; }
            else opacity = 0.4;
          }
          return (
            <button
              key={sfx}
              onClick={() => !disabled && handlePick(sfx)}
              disabled={disabled}
              style={{
                width: 100,
                height: 80,
                fontSize: 32,
                fontWeight: 800,
                border: `3px solid ${border}`,
                borderRadius: 16,
                background: bg,
                cursor: disabled ? 'default' : 'pointer',
                opacity,
                transition: 'all 0.2s',
                color: 'var(--text-dark)',
              }}
            >
              -{sfx}
            </button>
          );
        })}
      </div>

      {state.selectedSuffix !== null && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{emoji}</div>
          <p style={{ fontSize: 20, fontWeight: 700, color: state.correct ? '#10B981' : '#EF4444' }}>
            {state.correct
              ? state.streak >= 2
                ? `${state.streak} in a row! Amazing! 🔥`
                : 'Correct! Great job!'
              : `Actually it's <em>${currentWord.base}${currentWord.suffix}</em>`}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            style={{ marginTop: 12 }}
          >
            Next Word →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F3F4F6', borderRadius: 12 }}>
        <span style={{ fontSize: 14, color: '#6B7280' }}>Score: {state.score}/{state.total}</span>
        {state.streak >= 2 && (
          <span style={{ fontSize: 14, color: '#F59E0B', fontWeight: 700 }}>🔥 {state.streak} streak</span>
        )}
        <span style={{ fontSize: 14, color: '#6B7280' }}>{state.wordIndex + 1} / {WORDS.length}</span>
      </div>
    </div>
  );
}