'use client';

import { STICKERS, getEarnedStickerIds, type Sticker } from '../stickers';
import type { Progress } from '../lib/progress';

/**
 * StickerBook — modal showing every sticker the kid can earn.
 *
 * Layout: 3-column CSS grid. Each sticker is a circular badge with the
 * reward emoji + a colored disk. Locked stickers show a 🔒 and grey tint.
 *
 * Earned stickers scale up slightly + brighten on hover for tactile feel.
 */
export default function StickerBook({
  progress,
  onClose,
}: {
  progress: Progress;
  onClose: () => void;
}) {
  const earned = getEarnedStickerIds(progress);
  const totalCount = STICKERS.length;
  const earnedCount = earned.size;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div style={{ flex: 1 }}>
            <h2 style={titleStyle}>Sticker Book</h2>
            <p style={subtitleStyle}>
              {earnedCount} of {totalCount} stickers earned
            </p>
          </div>
          <button style={closeStyle} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={bodyStyle}>
          <div style={progressBarTrackStyle}>
            <div style={{
              ...progressBarFillStyle,
              width: `${Math.round((earnedCount / totalCount) * 100)}%`,
            }} />
          </div>

          {/* Meta / quest rewards */}
          <SectionTitle label="Quest Stickers" />
          <div style={gridStyle}>
            {STICKERS.filter((s) => s.category === 'meta').map((s) => (
              <StickerCell key={s.id} sticker={s} unlocked={earned.has(s.id)} />
            ))}
          </div>

          {/* Building stickers */}
          <SectionTitle label="Building Stickers" />
          <div style={gridStyle}>
            {STICKERS.filter((s) => s.category === 'building').map((s) => (
              <StickerCell key={s.id} sticker={s} unlocked={earned.has(s.id)} />
            ))}
          </div>

          {/* Badge stickers */}
          <SectionTitle label="Special Badges" />
          <div style={gridStyle}>
            {STICKERS.filter((s) => s.category === 'badge').map((s) => (
              <StickerCell key={s.id} sticker={s} unlocked={earned.has(s.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={sectionTitleStyle}>
      <span>{label}</span>
      <span style={sectionLineStyle} />
    </div>
  );
}

function StickerCell({ sticker, unlocked }: { sticker: Sticker; unlocked: boolean }) {
  return (
    <div
      style={{
        ...cellStyle,
        opacity: unlocked ? 1 : 0.55,
        background: unlocked ? sticker.color : '#E5E0D8',
        transform: unlocked ? 'scale(1)' : 'scale(0.94)',
        transition: 'transform 0.15s, background 0.2s, opacity 0.2s',
      }}
      title={unlocked ? `${sticker.name} — ${sticker.description}` : `Locked — ${sticker.description}`}
    >
      <div style={emojiStyle}>{unlocked ? sticker.emoji : '🔒'}</div>
      <div style={nameStyle}>{sticker.name}</div>
      {!unlocked && <div style={descStyle}>{sticker.description}</div>}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(92, 65, 40, 0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 250, padding: 16,
  fontFamily: 'Fredoka, sans-serif',
};

const modalStyle: React.CSSProperties = {
  background: '#FAF1DE',
  borderRadius: 24,
  border: '3px solid #D9B082',
  width: '100%', maxWidth: 640, maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '16px 20px',
  borderBottom: '3px solid #D9B082',
};

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, color: '#A04F3F', margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13, color: '#5C4128', margin: '2px 0 0',
};

const closeStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 22,
  cursor: 'pointer', color: '#5C4128', padding: 4,
  fontFamily: 'Fredoka, sans-serif',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px 20px 24px',
  overflowY: 'auto',
  flex: 1, minHeight: 0,
};

const progressBarTrackStyle: React.CSSProperties = {
  height: 10, background: '#E8D4B0', borderRadius: 999,
  overflow: 'hidden', marginBottom: 18,
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #7A9B6E, #A4B58A)',
  borderRadius: 999,
  transition: 'width 0.4s ease',
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  margin: '18px 0 10px',
  fontSize: 13, fontWeight: 700, color: '#5C4128',
  textTransform: 'uppercase', letterSpacing: 0.8,
};

const sectionLineStyle: React.CSSProperties = {
  flex: 1, height: 1, background: '#D9C9A8',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
  gap: 12,
};

const cellStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: '12px 8px 10px',
  textAlign: 'center',
  border: '2px solid rgba(92, 65, 40, 0.15)',
  cursor: 'default',
};

const emojiStyle: React.CSSProperties = {
  fontSize: 32, lineHeight: 1.1, marginBottom: 4,
};

const nameStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#2D1B00',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

const descStyle: React.CSSProperties = {
  fontSize: 10, color: '#5C4128', opacity: 0.85,
  marginTop: 4, lineHeight: 1.3,
};
