'use client';

import { useState, useEffect } from 'react';
import RatingModal from './RatingModal';

const ANIMAL_EMOJIS = ['🐶', '🐱', '🐭', '🦁', '🐯', '🐻', '🐼', '🐨'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AnimalMatch({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [canFlip, setCanFlip] = useState(true);
  const [rated, setRated] = useState(false);

  const init = () => {
    const pairs = [...ANIMAL_EMOJIS.slice(0, 8), ...ANIMAL_EMOJIS.slice(0, 8)];
    setCards(shuffle(pairs));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWon(false);
    setCanFlip(true);
    setRated(false);
  };

  useEffect(() => { init(); }, []);
  useEffect(() => { if (matched.length === 16) setWon(true); }, [matched]);

  const handleFlip = (i: number) => {
    if (!canFlip || flipped.includes(i) || matched.includes(i)) return;
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setCanFlip(false);
      const [a, b] = newFlipped;
      if (cards[a] === cards[b]) {
        setMatched(prev => [...prev, a, b]);
        setFlipped([]);
        setCanFlip(true);
      } else {
        setTimeout(() => { setFlipped([]); setCanFlip(true); }, 900);
      }
    }
  };

  return (
    <>
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🧩 Animal Match</h1>

        <div className="match-score">
          Moves: {moves} &nbsp;|&nbsp; Matched: {matched.length / 2} / 8
        </div>

        <div className="game-grid">
          {cards.map((emoji, i) => (
            <button
              key={i}
              className={`match-card ${flipped.includes(i) ? 'flipped' : ''} ${matched.includes(i) ? 'matched' : ''}`}
              onClick={() => handleFlip(i)}
              style={{
                background: matched.includes(i)
                  ? 'var(--accent-green)'
                  : flipped.includes(i)
                  ? 'white'
                  : 'var(--accent-yellow)',
              }}
            >
              <span className="front">❓</span>
              <span className="back">{emoji}</span>
            </button>
          ))}
        </div>

        {won && !rated && (
          <div className="match-message slide-up">
            🎉 You did it in {moves} moves! You&apos;re amazing! 🌟
          </div>
        )}

        {won && (
          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
            <button className="btn btn-blue" onClick={init}>🔄 Play Again</button>
          </div>
        )}
      </div>

      {won && !rated && (
        <RatingModal
          activity="animal-match"
          activityName="Animal Match"
          activityEmoji="🧩"
          kidName={kidName}
          onClose={() => setRated(true)}
        />
      )}
    </>
  );
}
