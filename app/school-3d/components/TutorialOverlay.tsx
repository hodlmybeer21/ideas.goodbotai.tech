'use client';

import { useEffect, useState } from 'react';

type Props = {
  onDismiss: () => void;
};

/**
 * TutorialOverlay — first-time welcome card.
 *
 * Auto-dismisses after 12s, or instantly on button click / backdrop click.
 * Sets `hasOnboarded` via the parent's onDismiss so the card never
 * reappears for the same browser.
 */
export default function TutorialOverlay({ onDismiss }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => triggerDismiss(), 12000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function triggerDismiss() {
    if (fading) return;
    setFading(true);
    setTimeout(onDismiss, 350);
  }

  return (
    <div
      style={{ ...overlayStyle, opacity: fading ? 0 : 1, transition: 'opacity 0.35s ease' }}
      onClick={triggerDismiss}
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={mascotStyle}>🤖</div>
        <h2 style={titleStyle}>Welcome to School 3D!</h2>
        <div style={instructionRow}>
          <span style={kbdStyle}>W</span><span style={kbdStyle}>A</span><span style={kbdStyle}>S</span><span style={kbdStyle}>D</span>
          <span style={instrText}>— walk around the campus</span>
        </div>
        <div style={instructionRow}>
          <span style={{ ...kbdStyle, minWidth: 36 }}>E</span>
          <span style={instrText}>— enter the building you&apos;re standing next to</span>
        </div>
        <div style={instructionRow}>
          <span style={instrText}>📱 On phones, use the joystick in the corner</span>
        </div>
        <div style={tipStyle}>
          💡 Walk close to a building&apos;s door — a prompt will pop up.
        </div>
        <button style={goBtnStyle} onClick={triggerDismiss}>
          Got it! Let&apos;s go 🚀
        </button>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(92, 65, 40, 0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 400, padding: 24,
  fontFamily: 'Fredoka, sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: '#FAF1DE',
  borderRadius: 24,
  border: '3px solid #D9B082',
  padding: '32px 36px 28px',
  textAlign: 'center',
  maxWidth: 420, width: '100%',
  boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
};

const mascotStyle: React.CSSProperties = {
  fontSize: 56, marginBottom: 4, lineHeight: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 700, color: '#A04F3F',
  margin: '0 0 18px',
};

const instructionRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, marginBottom: 8, flexWrap: 'wrap',
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 28, height: 28,
  background: '#F5E6CA',
  border: '2px solid #5C4128',
  borderRadius: 6,
  fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
  color: '#2D1B00',
  boxShadow: '0 2px 0 #5C4128',
  padding: '0 6px',
};

const instrText: React.CSSProperties = {
  fontSize: 14, color: '#5C4128', fontWeight: 600,
};

const tipStyle: React.CSSProperties = {
  margin: '16px 0 20px',
  padding: '10px 14px',
  background: 'rgba(217, 176, 130, 0.25)',
  borderRadius: 12,
  fontSize: 13,
  color: '#5C4128',
  fontWeight: 500,
};

const goBtnStyle: React.CSSProperties = {
  background: '#C99B96',
  color: 'white',
  border: 'none',
  borderRadius: 14,
  padding: '12px 28px',
  fontSize: 16, fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Fredoka, sans-serif',
  boxShadow: '0 3px 0 #8B5A3C',
};
