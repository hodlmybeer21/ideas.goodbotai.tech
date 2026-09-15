'use client';

import type { Building } from '../buildings.config';

/**
 * StationPicker — modal that appears when the player is near a building's door.
 * Lists the building's stations and lets them pick one to launch.
 */
export default function StationPicker({
  building,
  onPick,
  onClose,
}: {
  building: Building;
  onPick: (stationId: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.icon}>{building.stations[0]?.icon ?? '🏫'}</span>
          <div style={{ flex: 1 }}>
            <h2 style={styles.title}>{building.label}</h2>
            <p style={styles.subtitle}>{building.sublabel}</p>
          </div>
          <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={styles.body}>
          <p style={styles.prompt}>Pick an activity:</p>
          <div style={styles.stationGrid}>
            {building.stations.map((s) => (
              <button
                key={s.id}
                style={{
                  ...styles.stationBtn,
                  background: s.ready ? 'white' : '#F5F5F5',
                  borderColor: building.color,
                  opacity: s.ready ? 1 : 0.65,
                }}
                onClick={() => onPick(s.id)}
              >
                <span style={styles.stationIcon}>{s.icon}</span>
                <span style={styles.stationName}>{s.name}</span>
                {!s.ready && <span style={styles.comingSoon}>Coming soon</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    padding: 16,
  },
  modal: {
    background: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    borderBottom: '3px solid #FFD93D',
  },
  icon: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: 700, color: '#2D1B00', margin: 0 },
  subtitle: { fontSize: 13, color: '#5C4033', margin: '2px 0 0' },
  close: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    color: '#5C4033',
    padding: 4,
    fontFamily: 'Fredoka, sans-serif',
  },
  body: { padding: '20px 24px 24px' },
  prompt: { fontSize: 15, color: '#5C4033', marginBottom: 14, fontWeight: 600 },
  stationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  stationBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    padding: '16px 12px',
    borderRadius: 16,
    border: '3px solid',
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    transition: 'transform 0.1s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  stationIcon: { fontSize: 36 },
  stationName: { fontSize: 14, fontWeight: 600, color: '#2D1B00', textAlign: 'center' as const },
  comingSoon: {
    fontSize: 10,
    fontWeight: 700,
    background: '#FFD93D',
    color: '#2D1B00',
    padding: '2px 8px',
    borderRadius: 999,
    marginTop: 4,
  },
};
