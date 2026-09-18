'use client';

import type { Quest } from '../quests';

/**
 * QuestTracker — slim strip below the header showing the current quest.
 *
 * Renders nothing when there is no active quest (kid has finished them all).
 * Visited/completed states show a check + fade so the strip feels alive
 * without being noisy.
 */
export default function QuestTracker({
  quest,
  index,
  total,
}: {
  quest: Quest | null;
  index: number;
  total: number;
}) {
  return (
    <div style={wrapStyle}>
      <div style={leftStyle}>
        <span style={iconStyle}>{quest ? quest.emoji : '🏆'}</span>
        <div style={{ minWidth: 0 }}>
          <div style={titleStyle}>
            {quest ? quest.title : 'All quests complete — you rule the campus!'}
          </div>
          {quest && <div style={hintStyle}>{quest.hint}</div>}
        </div>
      </div>
      <div style={progressStyle} aria-label={`Quest ${index + 1} of ${total}`}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              ...dotStyle,
              ...(i < index ? dotDoneStyle : i === index && quest ? dotActiveStyle : dotPendingStyle),
            }}
          />
        ))}
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  position: 'absolute',
  top: 56, left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(245, 230, 202, 0.95)',
  border: '2px solid #D9B082',
  borderRadius: 14,
  padding: '8px 14px',
  fontFamily: 'Fredoka, sans-serif',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  zIndex: 9,
  boxShadow: '0 4px 14px rgba(92, 65, 40, 0.18)',
  maxWidth: 'calc(100vw - 240px)',
  minWidth: 320,
};

const leftStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
};

const iconStyle: React.CSSProperties = {
  fontSize: 26, lineHeight: 1, flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#2D1B00',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

const hintStyle: React.CSSProperties = {
  fontSize: 12, color: '#5C4128', opacity: 0.85,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

const progressStyle: React.CSSProperties = {
  display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0,
};

const dotStyle: React.CSSProperties = {
  width: 8, height: 8, borderRadius: '50%',
  transition: 'background 0.2s',
};

const dotDoneStyle: React.CSSProperties = {
  background: '#7A9B6E',
};

const dotActiveStyle: React.CSSProperties = {
  background: '#E8B57E',
  boxShadow: '0 0 0 3px rgba(232, 181, 126, 0.35)',
};

const dotPendingStyle: React.CSSProperties = {
  background: '#D9C9A8',
};
