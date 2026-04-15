'use client';
import { useState, useCallback } from 'react';
import RatingModal from './RatingModal';

const INSTRUMENTS = [
  { label: '🥁 Drum', emoji: '🥁', href: 'https://hub.goodbotai.tech/sound-lab#drums', color: '#FF6B9D', shadow: '#c9456e' },
  { label: '🎸 Guitar', emoji: '🎸', href: 'https://hub.goodbotai.tech/sound-lab#guitar', color: '#FFD93D', shadow: '#c9a82e' },
  { label: '🎺 Trumpet', emoji: '🎺', href: 'https://hub.goodbotai.tech/sound-lab#trumpet', color: '#6BCBFF', shadow: '#4a9fd9' },
  { label: '🎹 Piano', emoji: '🎹', href: 'https://hub.goodbotai.tech/sound-lab#piano', color: '#6BCB77', shadow: '#4fa05c' },
  { label: '🔔 Bell', emoji: '🔔', href: 'https://hub.goodbotai.tech/sound-lab#bells', color: '#C084FC', shadow: '#9660d4' },
  { label: '🎻 Violin', emoji: '🎻', href: 'https://hub.goodbotai.tech/sound-lab#violin', color: '#FF9F43', shadow: '#cc7a2f' },
];
}

export default function SoundLab({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [rated, setRated] = useState(false);
  const [played, setPlayed] = useState<string[]>([]);
  const [lastPlayed, setLastPlayed] = useState('');

  const handleTap = useCallback((inst: typeof INSTRUMENTS[0]) => {
    window.open(inst.href, '_blank');
    setLastPlayed(inst.label);
    setPlayed(p => [inst.label, ...p].slice(0, 6));
  }, []);

  return (
    <>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
        {/* Back */}
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid #E5E0D8', borderRadius: 12,
          padding: '8px 16px', cursor: 'pointer', fontFamily: 'Fredoka',
          fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Sound Lab</h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 24px' }}>Tap an instrument to play its sound!</p>
        </div>

        {/* Instruments grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}>
          {INSTRUMENTS.map(inst => (
            <button
              key={inst.label}
              onClick={() => handleTap(inst)}
              style={{
                background: inst.color,
                border: 'none',
                borderRadius: 20,
                padding: '28px 12px',
                cursor: 'pointer',
                fontFamily: 'Fredoka',
                fontWeight: 700,
                fontSize: 15,
                color: 'white',
                boxShadow: `0 6px 0 ${inst.shadow}`,
                transition: 'transform 0.1s, box-shadow 0.1s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseDown={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 0 ${inst.shadow}`;
              }}
              onMouseUp={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 0 ${inst.shadow}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 0 ${inst.shadow}`;
              }}
            >
              <span style={{ fontSize: 36 }}>{inst.emoji}</span>
              <span>{inst.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Last played */}
        {lastPlayed && (
          <div style={{
            textAlign: 'center',
            background: '#FFF9E6',
            borderRadius: 16,
            padding: '14px 20px',
            marginBottom: 20,
            fontSize: 17,
            fontFamily: 'Fredoka',
            color: '#8B6914',
          }}>
            🔊 You played: <strong>{lastPlayed}</strong>
          </div>
        )}

        {/* History */}
        {played.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka', marginBottom: 6 }}>Recent</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {played.map((p, i) => (
                <span key={i} style={{
                  background: '#F1F0EC',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontFamily: 'Fredoka',
                  color: '#64748B',
                }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rate button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setRated(true)}
            style={{
              padding: '14px 32px',
              fontSize: 18,
              background: '#FF6B9D',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              fontFamily: 'Fredoka',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 auto',
            }}
          >
            ⭐ Rate this Game
          </button>
        </div>
      </div>

      {rated && (
        <RatingModal
          activity="sound-lab"
          activityName="Sound Lab"
          activityEmoji="🎵"
          kidName={kidName}
          onClose={() => setRated(true)}
        />
      )}
    </>
  );
}