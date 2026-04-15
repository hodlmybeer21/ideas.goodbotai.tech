'use client';

import { useState, useEffect } from 'react';

interface FeedbackEntry {
  date: string;
  name: string;
  rating: number;
}

const STAR_MESSAGES = [
  '', '😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🤯', '🤖💖',
];

interface Props {
  kidName: string;
  onRated: (rating: number) => void;
  compact?: boolean;
}

export default function RatingWidget({ kidName, onRated, compact = false }: Props) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('goodbotkids_feedback');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const submit = () => {
    if (rating === 0) return;
    const entry: FeedbackEntry = {
      date: new Date().toISOString(),
      name: kidName,
      rating,
    };
    const newHistory = [entry, ...history].slice(0, 50);
    localStorage.setItem('goodbotkids_feedback', JSON.stringify(newHistory));
    setSubmitted(true);
    onRated(rating);
  };

  const todayKey = new Date().toDateString();
  const alreadyRatedToday = history.some(h => new Date(h.date).toDateString() === todayKey);

  if (compact) {
    return (
      <div className="rating-section" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>⭐ Rate today&apos;s website!</h3>
        <p style={{ fontSize: 13, color: 'var(--text-medium)', marginTop: 4 }}>
          {alreadyRatedToday
            ? `You already rated today: ${'⭐'.repeat(history.find(h => new Date(h.date).toDateString() === todayKey)?.rating || 0)}`
            : 'How much did you like it?'}
        </p>
        {!alreadyRatedToday && (
          <>
            <div className="rating-stars">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} className="star-btn" onClick={() => { setRating(n); }} style={{ color: n <= rating ? 'var(--accent-yellow)' : '#E5E0D8' }}>
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button className="btn btn-primary" onClick={submit} style={{ marginTop: 8, fontSize: 15, padding: '10px 24px' }}>
                Submit {rating}/10 — {STAR_MESSAGES[rating]}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="canvas-page slide-up">
      <h1 className="page-title">⭐ Rate Today&apos;s Website</h1>

      {!submitted && !alreadyRatedToday ? (
        <div className="rating-section">
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Hey {kidName}! How much did you like today&apos;s website?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-medium)', marginTop: 8 }}>
            Tap a number from 1 to 10!
          </p>
          <div className="rating-stars" style={{ marginTop: 20 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                className="star-btn"
                onClick={() => setRating(n)}
                style={{ color: n <= rating ? 'var(--accent-yellow)' : '#E5E0D8' }}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="rating-feedback" style={{ fontSize: 22, marginTop: 12 }}>
              {rating}/10 — {STAR_MESSAGES[rating]}
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={rating === 0}
            style={{ marginTop: 20, fontSize: 18 }}
          >
            Submit Rating! 🚀
          </button>
        </div>
      ) : (
        <div className="rating-section">
          <div style={{ fontSize: 60, marginBottom: 12 }}>
            {submitted || alreadyRatedToday ? '🤖💖' : '🎉'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            {submitted || alreadyRatedToday ? "Thanks, " + kidName + "!" : ""}
          </h2>
          <p style={{ color: 'var(--text-medium)', marginTop: 8 }}>
            Your rating has been saved! GoodBot reads every one. 💛
          </p>
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setRating(0); }} style={{ marginTop: 16 }}>
            Rate Again
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-medium)' }}>
            Recent ratings from {kidName}:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 7).map((h, i) => (
              <div key={i} style={{ background: 'white', padding: '10px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-medium)' }}>
                  {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: 18, color: 'var(--accent-yellow)' }}>
                  {'⭐'.repeat(h.rating)} <span style={{ color: 'var(--text-medium)' }}>{h.rating}/10</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
