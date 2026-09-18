'use client';

import { HATS, BACKPACKS, type Customization, getAccessory } from '../lib/customization';

/**
 * CustomizeModal — pick a hat and/or a backpack for the player.
 *
 * Two sections (Hats / Backpack), each with a "None" option to clear
 * the slot. Selection writes through to localStorage immediately on
 * click, so closing the modal preserves the choice.
 */

type Props = {
  customization: Customization;
  onChange: (next: Customization) => void;
  onClose: () => void;
};

export default function CustomizeModal({ customization, onChange, onClose }: Props) {
  function setHat(id: string | null) {
    onChange({ ...customization, hat: id });
  }
  function setBackpack(id: string | null) {
    onChange({ ...customization, backpack: id });
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: 28 }}>🎩</span>
          <div style={{ flex: 1 }}>
            <h2 style={titleStyle}>Pick Your Style</h2>
            <p style={subtitleStyle}>Choose a hat and a backpack for your character</p>
          </div>
          <button style={closeStyle} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={bodyStyle}>
          <SectionTitle label="Hats" />
          <div style={gridStyle}>
            <AccessoryCell
              label="No hat"
              emoji="🚫"
              color="#E5E0D8"
              selected={customization.hat === null}
              onClick={() => setHat(null)}
            />
            {HATS.map((h) => (
              <AccessoryCell
                key={h.id}
                label={h.name}
                emoji={h.emoji}
                color={h.color}
                selected={customization.hat === h.id}
                onClick={() => setHat(h.id)}
              />
            ))}
          </div>

          <SectionTitle label="Backpack" />
          <div style={gridStyle}>
            <AccessoryCell
              label="No backpack"
              emoji="🚫"
              color="#E5E0D8"
              selected={customization.backpack === null}
              onClick={() => setBackpack(null)}
            />
            {BACKPACKS.map((b) => (
              <AccessoryCell
                key={b.id}
                label={b.name}
                emoji={b.emoji}
                color={b.color}
                selected={customization.backpack === b.id}
                onClick={() => setBackpack(b.id)}
              />
            ))}
          </div>

          {/* Live preview chip showing currently selected accessories */}
          <div style={previewStyle}>
            <span style={previewLabelStyle}>Wearing:</span>
            <span style={previewChipStyle}>
              {customization.hat
                ? `${getAccessory(customization.hat)?.emoji ?? '🎩'} ${getAccessory(customization.hat)?.name ?? 'Hat'}`
                : '🚫 No hat'}
            </span>
            <span style={previewChipStyle}>
              {customization.backpack
                ? `${getAccessory(customization.backpack)?.emoji ?? '🎒'} ${getAccessory(customization.backpack)?.name ?? 'Backpack'}`
                : '🚫 No backpack'}
            </span>
          </div>
        </div>

        <div style={footerStyle}>
          <button style={doneBtnStyle} onClick={onClose}>Done</button>
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

function AccessoryCell({
  label, emoji, color, selected, onClick,
}: {
  label: string;
  emoji: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cellStyle,
        background: color,
        borderColor: selected ? '#5C4128' : 'rgba(92, 65, 40, 0.18)',
        borderWidth: selected ? 3 : 2,
        boxShadow: selected
          ? '0 0 0 4px rgba(232, 181, 126, 0.5), 0 4px 12px rgba(92, 65, 40, 0.2)'
          : '0 3px 10px rgba(92, 65, 40, 0.12)',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={emojiStyle}>{emoji}</div>
      <div style={nameStyle}>{label}</div>
      {selected && <div style={checkStyle}>✓</div>}
    </button>
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
  width: '100%', maxWidth: 520, maxHeight: '92vh',
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
  fontSize: 12, color: '#5C4128', margin: '2px 0 0',
};

const closeStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 22,
  cursor: 'pointer', color: '#5C4128', padding: 4,
  fontFamily: 'Fredoka, sans-serif',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px 20px',
  overflowY: 'auto',
  flex: 1, minHeight: 0,
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  margin: '14px 0 10px',
  fontSize: 13, fontWeight: 700, color: '#5C4128',
  textTransform: 'uppercase', letterSpacing: 0.8,
};

const sectionLineStyle: React.CSSProperties = {
  flex: 1, height: 1, background: '#D9C9A8',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 10,
};

const cellStyle: React.CSSProperties = {
  fontFamily: 'Fredoka, sans-serif',
  borderRadius: 14,
  padding: '14px 10px 12px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
  position: 'relative',
};

const emojiStyle: React.CSSProperties = {
  fontSize: 32, lineHeight: 1.1, marginBottom: 4,
};

const nameStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#2D1B00',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};

const checkStyle: React.CSSProperties = {
  position: 'absolute', top: 6, right: 8,
  background: '#7A9B6E', color: '#FAF1DE',
  borderRadius: 999, width: 22, height: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 13, fontWeight: 700,
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
};

const previewStyle: React.CSSProperties = {
  marginTop: 18, padding: '12px 14px',
  background: 'rgba(92, 65, 40, 0.06)',
  border: '2px dashed #D9B082',
  borderRadius: 12,
  display: 'flex', alignItems: 'center', gap: 10,
  flexWrap: 'wrap',
};

const previewLabelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#5C4128',
};

const previewChipStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#2D1B00',
  background: '#F5E6CA',
  padding: '4px 10px',
  borderRadius: 999,
  border: '2px solid #D9B082',
};

const footerStyle: React.CSSProperties = {
  padding: '12px 20px 16px',
  borderTop: '2px solid #E8D4B0',
  display: 'flex', justifyContent: 'flex-end',
};

const doneBtnStyle: React.CSSProperties = {
  background: '#C99B96',
  color: 'white',
  border: 'none', borderRadius: 12,
  padding: '10px 24px',
  fontSize: 15, fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Fredoka, sans-serif',
  boxShadow: '0 3px 0 #8B5A3C',
};
