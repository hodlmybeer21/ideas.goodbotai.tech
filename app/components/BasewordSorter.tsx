'use client';

import { useState } from 'react';

const WORDS = [
  { word: 'flashes', base: 'flash', suffix: 'es' },
  { word: 'pinches', base: 'pinch', suffix: 'es' },
  { word: 'boxes', base: 'box', suffix: 'es' },
  { word: 'wishes', base: 'wish', suffix: 'es' },
  { word: 'bunches', base: 'bunch', suffix: 'es' },
  { word: 'dishes', base: 'dish', suffix: 'es' },
  { word: 'cakes', base: 'cake', suffix: 's' },
  { word: 'cups', base: 'cup', suffix: 's' },
  { word: 'laps', base: 'lap', suffix: 's' },
  { word: 'hugs', base: 'hug', suffix: 's' },
  { word: 'maps', base: 'map', suffix: 's' },
  { word: 'lids', base: 'lid', suffix: 's' },
  { word: 'benches', base: 'bench', suffix: 'es' },
  { word: 'buses', base: 'bus', suffix: 'es' },
  { word: 'dresses', base: 'dress', suffix: 'es' },
  { word: 'fishes', base: 'fish', suffix: 'es' },
  { word: 'plants', base: 'plant', suffix: 's' },
  { word: 'hats', base: 'hat', suffix: 's' },
];

type GameState = 'playing' | 'done';
type Bucket = 'es' | 's';

interface SortWord {
  word: string;
  suffix: string;
  revealed: boolean;
}

export default function BasewordSorter({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [state, setState] = useState<GameState>('playing');
  const [wordList, setWordList] = useState<SortWord[]>(
    [...WORDS].sort(() => Math.random() - 0.5).map(w => ({ ...w, revealed: false }))
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<{ es: string[]; s: string[] }>({ es: [], s: [] });
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; word: string } | null>(null);

  function handleWordClick(wordObj: SortWord) {
    if (buckets.es.includes(wordObj.word) || buckets.s.includes(wordObj.word)) return;
    setSelectedWord(wordObj.word);
    setFeedback(null);
  }

  function handleBucketClick(bucket: Bucket) {
    if (!selectedWord) return;
    const wordObj = wordList.find(w => w.word === selectedWord)!;
    const correct = wordObj.suffix === bucket;
    const newTotal = total + 1;
    const newScore = score + (correct ? 1 : 0);

    setBuckets(prev => ({ ...prev, [bucket]: [...prev[bucket], selectedWord] }));
    setFeedback({ correct, word: selectedWord });
    setTotal(newTotal);
    setScore(newScore);

    // check if all done
    const allPlaced = [...buckets.es, ...buckets.s, selectedWord];
    if (allPlaced.length >= WORDS.length) {
      setTimeout(() => setState('done'), 1200);
    }

    setSelectedWord(null);
  }

  function handleReset() {
    setWordList([...WORDS].sort(() => Math.random() - 0.5).map(w => ({ ...w, revealed: false })));
    setBuckets({ es: [], s: [] });
    setSelectedWord(null);
    setScore(0);
    setTotal(0);
    setFeedback(null);
    setState('playing');
  }

  const placedCount = buckets.es.length + buckets.s.length;
  const allDone = placedCount >= WORDS.length;

  return (
    <div className="activity-container slide-up">
      <button className="back-btn" onClick={onBack}>← Back</button>

      {state === 'done' ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64 }}>{score / total >= 0.8 ? '🏆' : score / total >= 0.6 ? '👍' : '💪'}</div>
          <h2 style={{ color: 'var(--accent-pink)', fontSize: 28 }}>Amazing, {kidName}!</h2>
          <p style={{ fontSize: 20, color: 'var(--text-dark)' }}>
            You sorted <strong>{score}/{total}</strong> words correctly!
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={handleReset}>Play Again 🔄</button>
            <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, background: 'var(--accent-indigo)', color: 'white', borderRadius: 20, padding: '4px 16px' }}>Baseword Sorter 📚</span>
            <h2 style={{ fontSize: 22, marginTop: 10 }}>
              Tap a word, then tap the bucket to match!
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Words ending in <strong>s</strong> go in the blue bucket. Words ending in <strong>es</strong> go in the purple bucket.</p>
          </div>

          {/* Word bank */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28, padding: '16px', background: '#F9FAFB', borderRadius: 16, minHeight: 80 }}>
            {wordList.map(w => {
              const inBucket = buckets.es.includes(w.word) || buckets.s.includes(w.word);
              const selected = selectedWord === w.word;
              return (
                <button
                  key={w.word}
                  onClick={() => handleWordClick(w)}
                  disabled={inBucket}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    border: selected ? '3px solid var(--accent-pink)' : '2px solid #D1D5DB',
                    background: selected ? '#FEF0F5' : inBucket ? '#E5E7EB' : 'white',
                    fontSize: 18,
                    fontWeight: 700,
                    color: inBucket ? '#9CA3AF' : 'var(--text-dark)',
                    cursor: inBucket ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {w.word}
                </button>
              );
            })}
          </div>

          {/* Buckets */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 24 }}>
            {(['s', 'es'] as Bucket[]).map(b => (
              <div
                key={b}
                onClick={() => handleBucketClick(b)}
                style={{
                  width: 140,
                  minHeight: 120,
                  borderRadius: 16,
                  border: `3px dashed ${b === 'es' ? '#8B5CF6' : '#3B82F6'}`,
                  background: b === 'es' ? '#F5F3FF' : '#EFF6FF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 8px',
                  cursor: selectedWord ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 800, color: b === 'es' ? '#7C3AED' : '#2563EB' }}>
                  -{b}
                </span>
                <span style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>bucket</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                  {buckets[b].map(w => (
                    <span
                      key={w}
                      style={{
                        fontSize: 13,
                        background: b === 'es' ? '#DDD6FE' : '#BFDBFE',
                        color: b === 'es' ? '#5B21B6' : '#1D4ED8',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              borderRadius: 12,
              background: feedback.correct ? '#D1FAE5' : '#FEE2E2',
              color: feedback.correct ? '#065F46' : '#991B1B',
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 16,
              animation: 'pop 0.3s',
            }}>
              {feedback.correct ? '✅ Correct!' : `❌ Oops! "${feedback.word}" needs -${wordList.find(w => w.word === feedback.word)?.suffix}`}
            </div>
          )}

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: '#F3F4F6', borderRadius: 12, fontSize: 14, color: '#6B7280' }}>
            <span>{placedCount} / {WORDS.length} sorted</span>
            <span>Score: {score}/{total}</span>
          </div>
        </>
      )}
    </div>
  );
}