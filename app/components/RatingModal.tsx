'use client';

import { useState, useEffect } from 'react';

const STAR_MESSAGES = ['', '😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🤯', '🤖💖'];

interface RatingModalProps {
  activity: string;
  activityName: string;
  activityEmoji: string;
  kidName: string;
  onClose: () => void;
}

interface RatingEntry {
  date: string;
  name: string;
  activity: string;
  rating: number;
}

export default function RatingModal({ activity, activityName, activityEmoji, kidName, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitted) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [submitted, onClose]);

  const submit = () => {
    if (rating === 0) return;
    const entry = { date: new Date().toISOString(), name: kidName, activity, rating };
    // Store locally as backup
    try {
      const saved = localStorage.getItem('goodbotkids_ratings_v2');
      const history: RatingEntry[] = saved ? JSON.parse(saved) : [];
      history.unshift(entry);
      localStorage.setItem('goodbotkids_ratings_v2', JSON.stringify(history.slice(0, 200)));
    } catch {}
    // POST to Google Sheets via webhook (best effort — localStorage always works)
    fetch('https://kids-api.187.77.31.89.sslip.io/rating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {}); // swallow — localStorage is the source of truth
    setSubmitted(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '32px 28px',
        maxWidth: 380, width: '90%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'pop 0.3s ease',
      }}>
        {!submitted ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{activityEmoji}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 6 }}>
              How much did you like<br />{activityName}?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-medium)', marginBottom: 16 }}>
              Tap a number from 1 to 10, {kidName}!
            </p>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  style={{
                    fontSize: 36, background: 'none', border: 'none', cursor: 'pointer',
                    color: n <= rating ? 'var(--accent-yellow)' : '#E5E0D8',
                    transition: 'transform 0.1s',
                    transform: n <= rating ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ fontSize: 18, marginTop: 8, color: 'var(--text-medium)' }}>
                {rating}/10 — {STAR_MESSAGES[rating]}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button
                onClick={onClose}
                style={{ padding: '10px 20px', fontSize: 15, background: '#F1F5F9', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Fredoka' }}
              >
                Skip
              </button>
              <button
                onClick={submit}
                disabled={rating === 0}
                style={{
                  padding: '10px 24px', fontSize: 16, background: 'var(--accent-pink)', color: 'white',
                  border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 600,
                  opacity: rating === 0 ? 0.5 : 1,
                }}
              >
                Submit! 🚀
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🤖💖</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-pink)' }}>
              Thanks, {kidName}!
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-medium)', marginTop: 8, marginBottom: 20 }}>
              I read every rating and use it to build cooler stuff for you!
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary"
              style={{ fontSize: 16, padding: '12px 28px' }}
            >
              Back to home 🏠
            </button>
          </>
        )}
      </div>
    </div>
  );
}
