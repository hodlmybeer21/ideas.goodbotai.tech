'use client';

import { Suspense, lazy, useMemo, useState } from 'react';
import { ACTIVITY_MAP, COMING_SOON, getMeta, isAvailable } from '../activityMap';

/**
 * ActivityModal — pops the activity React component over the 3D world.
 * Lazy-loads from ACTIVITY_MAP so the 3D world ships lean.
 * Stations in COMING_SOON (or any id not in the map) show a friendly
 * "coming soon" placeholder.
 *
 * Fires `onComplete(stationId)` when the activity calls its `onBack`
 * (i.e. kid finishes). This is the hook for marking the station as
 * completed in progress persistence.
 */
export default function ActivityModal({
  stationId,
  onClose,
  onComplete,
}: {
  stationId: string;
  onClose: () => void;
  onComplete?: (stationId: string) => void;
}) {
  const [celebrate, setCelebrate] = useState(false);
  const meta = getMeta(stationId);
  const available = isAvailable(stationId);

  const LazyActivity = useMemo(() => {
    if (!available) return null;
    const loader = ACTIVITY_MAP[stationId];
    return lazy(loader);
  }, [stationId, available]);

  const handleDone = () => {
    onComplete?.(stationId);
    setCelebrate(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={styles.icon}>{meta.icon}</span>
          <h2 style={styles.title}>{meta.name}</h2>
          <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={styles.body}>
          {!available ? (
            <ComingSoon name={COMING_SOON[stationId] ?? meta.name} onBack={onClose} />
          ) : LazyActivity ? (
            <Suspense fallback={<LoadingActivity name={meta.name} />}>
              <LazyActivity onBack={handleDone} kidName="" />
            </Suspense>
          ) : null}
        </div>
      </div>

      {celebrate && (
        <div style={styles.celebrateOverlay}>
          <div style={styles.celebrateBanner}>
            <span style={{ fontSize: 80, display: 'block' }}>🎉</span>
            <h2 style={{ fontSize: 36, color: '#A04F3F', marginBottom: 4 }}>Great Job!</h2>
            <p style={{ fontSize: 18, color: '#5C4128' }}>You finished an activity!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingActivity({ name }: { name: string }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: '#5C4128' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
      <p style={{ fontSize: 16 }}>Loading {name}...</p>
    </div>
  );
}

function ComingSoon({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: '#5C4128' }}>
      <div style={{ fontSize: 72, marginBottom: 12 }}>🚧</div>
      <h3 style={{ fontSize: 24, marginBottom: 8, color: '#2D1B00' }}>{name} — Coming soon!</h3>
      <p style={{ fontSize: 15, opacity: 0.8, maxWidth: 360, margin: '0 auto' }}>
        We&apos;re building this next. For now, try one of the other activities in this building or
        explore another building on campus.
      </p>
      <button onClick={onBack} style={styles.backBtn}>← Back to Campus</button>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16,
  },
  modal: {
    background: '#FAF1DE', borderRadius: 24,
    width: '100%', maxWidth: 720, maxHeight: '92vh',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '3px solid #D9B082',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px', borderBottom: '3px solid #D9B082',
    flexShrink: 0,
  },
  icon: { fontSize: 28 },
  title: { fontSize: 20, fontWeight: 700, color: '#2D1B00', flex: 1 },
  close: {
    background: 'none', border: 'none', fontSize: 20,
    cursor: 'pointer', color: '#5C4128', padding: 4,
    fontFamily: 'Fredoka, sans-serif',
  },
  body: { overflowY: 'auto' as const, flex: 1, minHeight: 0, background: '#FAF1DE' },
  backBtn: {
    marginTop: 20,
    background: '#E8D4B0', color: '#5C4128',
    border: 'none', borderRadius: 12,
    padding: '10px 24px', fontSize: 16, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Fredoka, sans-serif',
  },
  celebrateOverlay: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(245, 230, 202, 0.94)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300,
  },
  celebrateBanner: { textAlign: 'center' as const, animation: 'pop 0.5s ease' },
};
