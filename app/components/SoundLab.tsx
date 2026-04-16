'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import RatingModal from './RatingModal';

// ─── Audio helpers ───────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playKick(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
}

function playSnare(ctx: AudioContext) {
  const len = ctx.sampleRate * 0.2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 2500; filter.Q.value = 1;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.type = 'triangle'; osc2.frequency.value = 180;
  g2.gain.setValueAtTime(0.6, ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.1);
  src.start(ctx.currentTime);
}

function playTom(ctx: AudioContext, freqHigh: number, freqLow: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqHigh, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freqLow, ctx.currentTime + dur);
  gain.gain.setValueAtTime(0.9, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
}

function playBongo(ctx: AudioContext, freqHigh: number, freqLow: number, dur: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqHigh, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freqLow, ctx.currentTime + dur);
  gain.gain.setValueAtTime(0.85, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
}

function playHihat(ctx: AudioContext) {
  const len = ctx.sampleRate * 0.08;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 8000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  src.start(ctx.currentTime);
}

function playPluck(freq: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5; lfoGain.gain.value = freq * 0.01;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  filter.type = 'lowpass'; filter.frequency.value = freq * 3;
  gain.gain.setValueAtTime(0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  lfo.start(ctx.currentTime); lfo.stop(ctx.currentTime + 1.5);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.5);
}

function playTrumpetNote(freq: number) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5; lfoGain.gain.value = freq * 0.008;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  filter.type = 'lowpass'; filter.frequency.value = freq * 4;
  gain.gain.setValueAtTime(0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  lfo.start(ctx.currentTime); lfo.stop(ctx.currentTime + 1.2);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.2);
}

function playPianoKey(freq: number) {
  const ctx = getCtx();
  const harmonics = [1, 2, 3];
  const amps = [0.5, 0.25, 0.125];
  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * h;
    gain.gain.setValueAtTime(amps[i], ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2);
  });
}

function playBell(freq: number) {
  const ctx = getCtx();
  const partials = [1, 2.4, 4.2];
  const amps = [0.5, 0.3, 0.15];
  partials.forEach((p, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * p;
    gain.gain.setValueAtTime(amps[i], ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 2.5);
  });
}

function playViolin(freq: number, duration = 1.5) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 5; lfoGain.gain.value = freq * 0.006;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  filter.type = 'lowpass'; filter.frequency.value = freq * 3;
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  lfo.start(ctx.currentTime); lfo.stop(ctx.currentTime + duration);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration);
}

// ─── Valve map for trumpet ────────────────────────────────────────────────────
const VALVE_MAP: Record<string, [string, number]> = {
  '': ['Bb4', 466],
  '1': ['C4', 523],
  '2': ['Bb3', 233],
  '3': ['G3', 196],
  '1,2': ['A3', 220],
  '1,3': ['F3', 175],
  '2,3': ['Eb3', 156],
  '1,2,3': ['G3', 196],
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={onBack} className="back-btn">← Back</button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>{title}</h1>
    </div>
  );
}

// ─── Menu cards ───────────────────────────────────────────────────────────────
const MENU_BTNS = [
  { label: 'Drum', emoji: '🥁', color: '#FF6B9D', shadow: '#c9456e', screen: 'drums' as const },
  { label: 'Guitar', emoji: '🎸', color: '#FFD93D', shadow: '#c9a82e', screen: 'guitar' as const },
  { label: 'Trumpet', emoji: '🎺', color: '#6BCBFF', shadow: '#4a9fd9', screen: 'trumpet' as const },
  { label: 'Piano', emoji: '🎹', color: '#6BCB77', shadow: '#4fa05c', screen: 'piano' as const },
  { label: 'Bells', emoji: '🔔', color: '#C084FC', shadow: '#9660d4', screen: 'bells' as const },
  { label: 'Violin', emoji: '🎻', color: '#FF9F43', shadow: '#cc7a2f', screen: 'violin' as const },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function SoundLab({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [activeScreen, setActiveScreen] = useState<'menu'|'drums'|'guitar'|'trumpet'|'piano'|'bells'|'violin'>('menu');
  const [rated, setRated] = useState(false);
  const [played, setPlayed] = useState<string[]>([]);
  const [lastPlayed, setLastPlayed] = useState('');

  const track = useCallback((label: string) => {
    setLastPlayed(label);
    setPlayed(p => [label, ...p].slice(0, 6));
  }, []);

  if (activeScreen === 'menu') return (
    <MenuScreen
      onBack={onBack}
      setActiveScreen={setActiveScreen}
      rated={rated} setRated={setRated}
      lastPlayed={lastPlayed} played={played}
      kidName={kidName}
    />
  );
  if (activeScreen === 'drums') return <DrumScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  if (activeScreen === 'guitar') return <GuitarScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  if (activeScreen === 'trumpet') return <TrumpetScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  if (activeScreen === 'piano') return <PianoScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  if (activeScreen === 'bells') return <BellsScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  if (activeScreen === 'violin') return <ViolinScreen onBack={() => setActiveScreen('menu')} onPlay={track} />;
  return null;
}

// ─── Menu Screen ───────────────────────────────────────────────────────────────
function MenuScreen({ onBack, setActiveScreen, rated, setRated, lastPlayed, played, kidName }: {
  onBack: () => void;
  setActiveScreen: (s: 'menu'|'drums'|'guitar'|'trumpet'|'piano'|'bells'|'violin') => void;
  rated: boolean; setRated: (v: boolean) => void;
  lastPlayed: string; played: string[];
  kidName: string;
}) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <button onClick={onBack} className="back-btn">← Back</button>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Sound Lab</h1>
        <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 24px' }}>Tap an instrument to play!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {MENU_BTNS.map(inst => (
          <InstrumentCard key={inst.screen} {...inst} onTap={() => setActiveScreen(inst.screen)} />
        ))}
      </div>

      {lastPlayed && (
        <div style={{ textAlign: 'center', background: '#FFF9E6', borderRadius: 16, padding: '14px 20px', marginBottom: 20, fontSize: 17, fontFamily: 'Fredoka', color: '#8B6914' }}>
          🔊 You played: <strong>{lastPlayed}</strong>
        </div>
      )}
      {played.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Fredoka', marginBottom: 6 }}>Recent</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {played.map((p, i) => (
              <span key={i} style={{ background: '#F1F0EC', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontFamily: 'Fredoka', color: '#64748B' }}>{p}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => setRated(true)} style={{
          padding: '14px 32px', fontSize: 18, background: '#FF6B9D', color: 'white',
          border: 'none', borderRadius: 16, cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
        }}>
          ⭐ Rate this Game
        </button>
      </div>

      {rated && <RatingModal activity="sound-lab" activityName="Sound Lab" activityEmoji="🎵" kidName={kidName} onClose={() => setRated(true)} />}
    </div>
  );
}

function InstrumentCard({ label, emoji, color, shadow, onTap }: { label: string; emoji: string; color: string; shadow: string; onTap: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onTap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: color, border: 'none', borderRadius: 20, padding: '28px 12px',
        cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 15, color: 'white',
        boxShadow: pressed ? `0 2px 0 ${shadow}` : `0 6px 0 ${shadow}`,
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ fontSize: 36 }}>{emoji}</span>
      <span>{label}</span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>Tap to play!</span>
    </button>
  );
}

// ─── Drum Screen ──────────────────────────────────────────────────────────────
const DRUMS = [
  { label: 'Kick', type: 'kick', freqHigh: 150, freqLow: 50, dur: 0.5, size: 90, color: '#FF6B9D', shadow: '#c9456e', isCircle: true },
  { label: 'Snare', type: 'snare', size: 70, color: '#FFD93D', shadow: '#c9a82e', isCircle: true },
  { label: 'Tom1', type: 'tom1', freqHigh: 200, freqLow: 100, dur: 0.3, size: 60, color: '#6BCBFF', shadow: '#4a9fd9', isCircle: true },
  { label: 'Tom2', type: 'tom2', freqHigh: 180, freqLow: 90, dur: 0.3, size: 60, color: '#6BCB77', shadow: '#4fa05c', isCircle: true },
  { label: 'Bongo1', type: 'bongo1', freqHigh: 300, freqLow: 200, dur: 0.15, size: 50, color: '#C084FC', shadow: '#9660d4', isCircle: true },
  { label: 'Bongo2', type: 'bongo2', freqHigh: 400, freqLow: 250, dur: 0.12, size: 50, color: '#FF9F43', shadow: '#cc7a2f', isCircle: true },
  { label: 'Hi-Hat', type: 'hihat', size: 60, color: '#94A3B8', shadow: '#64748B', isCircle: false },
];

function DrumScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [hitting, setHitting] = useState('');

  const hitDrum = useCallback((type: string) => {
    const ctx = getCtx();
    switch (type) {
      case 'kick': playKick(ctx); break;
      case 'snare': playSnare(ctx); break;
      case 'tom1': playTom(ctx, 200, 100, 0.3); break;
      case 'tom2': playTom(ctx, 180, 90, 0.3); break;
      case 'bongo1': playBongo(ctx, 300, 200, 0.15); break;
      case 'bongo2': playBongo(ctx, 400, 250, 0.12); break;
      case 'hihat': playHihat(ctx); break;
    }
    setHitting(type);
    setTimeout(() => setHitting(''), 150);
    onPlay('🥁 Drum');
  }, [onPlay]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🥁 Drum Kit" onBack={onBack} />

      {/* Hi-hat */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <DrumBtn drum={DRUMS[6]} hitting={hitting} onHit={hitDrum} />
      </div>

      {/* Main kit */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        {[DRUMS[0]].map(d => <DrumBtn key={d.type} drum={d} hitting={hitting} onHit={hitDrum} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
        {DRUMS.slice(1, 6).map(d => <DrumBtn key={d.type} drum={d} hitting={hitting} onHit={hitDrum} />)}
      </div>
    </div>
  );
}

function DrumBtn({ drum, hitting, onHit }: { drum: typeof DRUMS[0]; hitting: string; onHit: (t: string) => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onMouseDown={() => { setPressed(true); onHit(drum.type); }}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => { setPressed(true); onHit(drum.type); }}
        onTouchEnd={() => setPressed(false)}
        style={{
          width: drum.size, height: drum.size,
          background: drum.color,
          border: 'none',
          borderRadius: drum.isCircle ? '50%' : 8,
          cursor: 'pointer',
          transform: (pressed || hitting === drum.type) ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: (pressed || hitting === drum.type) ? `0 2px 0 ${drum.shadow}` : `0 6px 0 ${drum.shadow}`,
          transition: 'transform 0.08s, box-shadow 0.08s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      />
      <span style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#64748B' }}>{drum.label}</span>
    </div>
  );
}

// ─── Guitar Screen ────────────────────────────────────────────────────────────
const GUITAR_STRINGS = [
  { label: 'E2', hz: 82, color: '#7B5E3B' },
  { label: 'A2', hz: 110, color: '#8B6840' },
  { label: 'D3', hz: 147, color: '#9E7848' },
  { label: 'G3', hz: 196, color: '#B8894E' },
  { label: 'B3', hz: 247, color: '#C99A58' },
  { label: 'E4', hz: 330, color: '#D4AA6A' },
];

function GuitarScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [plucking, setPlucking] = useState('');

  const pluck = useCallback((hz: number, label: string) => {
    playPluck(hz);
    setPlucking(label);
    setTimeout(() => setPlucking(''), 300);
    onPlay('🎸 Guitar');
  }, [onPlay]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🎸 Guitar" onBack={onBack} />
      <p style={{ textAlign: 'center', fontFamily: 'Fredoka', fontSize: 14, color: '#64748B', marginBottom: 24 }}>Tap a string to pluck!</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
        {GUITAR_STRINGS.map(s => (
          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => pluck(s.hz, s.label)}
              style={{
                width: 44, height: 170,
                background: `linear-gradient(90deg, ${s.color} 0%, ${s.color}dd 50%, ${s.color} 100%)`,
                border: `2px solid ${s.color}`,
                borderRadius: 8,
                boxShadow: `0 4px 0 ${s.color}88`,
                cursor: 'pointer',
                transform: plucking === s.label ? 'translateY(8px) scaleY(0.94)' : 'translateY(0)',
                transition: 'transform 0.1s',
              }}
            />
            <span style={{ fontFamily: 'Fredoka', fontSize: 14, color: '#64748B', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontFamily: 'Fredoka', fontSize: 11, color: '#94A3B8' }}>{s.hz}Hz</span>
          </div>
        ))}
      </div>

      {/* Fretboard */}
      <div style={{ background: '#8B6840', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#F5E6D0', marginBottom: 10, textAlign: 'center' }}>Fretboard</div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-around', marginBottom: i < 3 ? 14 : 0 }}>
            {[0, 1, 2, 3, 4].map(j => (
              <div key={j} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: (i === 0 && j === 2) || (i === 1 && j === 0) || (i === 1 && j === 3) || (i === 3 && j === 1) ? '#F5E6D0' : '#7B5E3B',
                border: '2px solid #6B4E2B',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trumpet Screen ───────────────────────────────────────────────────────────
function TrumpetScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [valves, setValves] = useState<Record<string, boolean>>({ '1': false, '2': false, '3': false });
  const [lastNote, setLastNote] = useState<[string, number]>(['Bb4', 466]);

  const toggleValve = useCallback((n: string) => {
    setValves(v => {
      const next = { ...v, [n]: !v[n] };
      const key = Object.entries(next).filter(([, on]) => on).map(([k]) => k).join(',');
      const note = VALVE_MAP[key] ?? ['Bb4', 466];
      playTrumpetNote(note[1]);
      setLastNote(note);
      onPlay('🎺 Trumpet');
      return next;
    });
  }, [onPlay]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🎺 Trumpet" onBack={onBack} />

      {/* Note display */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 36, fontWeight: 700, color: '#6BCBFF' }}>{lastNote[0]}</div>
        <div style={{ fontFamily: 'Fredoka', fontSize: 16, color: '#64748B' }}>{lastNote[1]} Hz</div>
      </div>

      {/* Trumpet illustration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ width: 20, height: 28, background: '#C0C0C0', borderRadius: '6px 0 0 6px', border: '2px solid #A0A0A0' }} />
        <div style={{ width: 80, height: 14, background: 'linear-gradient(180deg, #E8C96A 0%, #D4A83A 50%, #E8C96A 100%)', borderTop: '1px solid #C09030', borderBottom: '1px solid #C09030' }} />
        <div style={{ width: 50, height: 54, background: 'linear-gradient(180deg, #E8C96A 0%, #D4A83A 50%, #E8C96A 100%)', border: '1px solid #C09030', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', padding: '4px 0' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ width: 10, height: 10, background: valves[n] ? '#FFD700' : '#A0A0A0', borderRadius: 2, border: '1px solid #888' }} />
          ))}
        </div>
        <div style={{ width: 60, height: 14, background: 'linear-gradient(180deg, #E8C96A 0%, #D4A83A 50%, #E8C96A 100%)', borderTop: '1px solid #C09030', borderBottom: '1px solid #C09030' }} />
        <div style={{ width: 0, height: 0, borderLeft: '40px solid #E8C96A', borderTop: '30px solid transparent', borderBottom: '30px solid transparent', filter: 'drop-shadow(0 2px 0 #C09030)' }} />
      </div>

      {/* Valve buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 32 }}>
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => toggleValve(String(n))}
            style={{
              width: 64, height: 64,
              background: valves[n] ? '#6BCBFF' : '#E5E0D8',
              border: 'none', borderRadius: 12,
              boxShadow: valves[n] ? '0 4px 0 #4a9fd9' : '0 4px 0 #c5c0b8',
              cursor: 'pointer', fontFamily: 'Fredoka', fontSize: 24, fontWeight: 700,
              color: valves[n] ? 'white' : '#64748B',
              transform: valves[n] ? 'translateY(2px)' : 'translateY(0)',
              transition: 'all 0.1s',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Valve chart */}
      <div style={{ background: '#F1F5F9', borderRadius: 16, padding: '16px 20px' }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#64748B', marginBottom: 8, textAlign: 'center' }}>Valve combinations</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {Object.entries(VALVE_MAP).map(([k, [n, h]]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 8, padding: '5px 10px' }}>
              <span style={{ fontFamily: 'Fredoka', fontSize: 12, color: '#94A3B8' }}>{k || 'none'}</span>
              <span style={{ fontFamily: 'Fredoka', fontSize: 13, fontWeight: 600, color: '#6BCBFF' }}>{n}</span>
              <span style={{ fontFamily: 'Fredoka', fontSize: 11, color: '#CBD5E1' }}>{h}Hz</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Piano Screen ──────────────────────────────────────────────────────────────
const PIANO_KEYS = [
  { note: 'C4', freq: 262 }, { note: 'D4', freq: 294 }, { note: 'E4', freq: 330 },
  { note: 'F4', freq: 349 }, { note: 'G4', freq: 392 }, { note: 'A4', freq: 440 },
  { note: 'B4', freq: 494 }, { note: 'C5', freq: 523 }, { note: 'D5', freq: 587 }, { note: 'E5', freq: 659 },
];

function PianoScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [depressing, setDepressing] = useState('');

  const playKey = useCallback((freq: number, note: string) => {
    playPianoKey(freq);
    setDepressing(note);
    setTimeout(() => setDepressing(''), 200);
    onPlay('🎹 Piano');
  }, [onPlay]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🎹 Piano" onBack={onBack} />
      <p style={{ textAlign: 'center', fontFamily: 'Fredoka', fontSize: 14, color: '#64748B', marginBottom: 24 }}>Tap a key to play!</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
        {PIANO_KEYS.map(k => (
          <div key={k.note} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => playKey(k.freq, k.note)}
              style={{
                width: 46, height: 140,
                background: depressing === k.note ? '#E8E0D0' : '#FAFAF8',
                border: '2px solid #D0C8B8',
                borderRadius: '0 0 8px 8px',
                boxShadow: depressing === k.note ? '0 1px 0 #D0C8B8' : '0 4px 0 #C0B8A0',
                cursor: 'pointer',
                transform: depressing === k.note ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 0.06s, box-shadow 0.06s',
              }}
            />
            <span style={{ fontFamily: 'Fredoka', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{k.note}</span>
            <span style={{ fontFamily: 'Fredoka', fontSize: 10, color: '#94A3B8' }}>{k.freq}Hz</span>
          </div>
        ))}
      </div>

      {/* Keyboard visual guide */}
      <div style={{ background: '#2D2D2D', borderRadius: 12, padding: '16px 16px 12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {PIANO_KEYS.map((k, i) => (
            <div key={k.note} style={{ position: 'relative', width: 46, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 70, background: '#1a1a1a', borderRadius: '0 0 4px 4px',
                border: '1px solid #333', zIndex: 2, position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bells Screen ─────────────────────────────────────────────────────────────
const BELL_DATA = [
  { note: 'C4', freq: 262, size: 48, y: 0, type: 'round' as const },
  { note: 'D4', freq: 294, size: 56, y: 8, type: 'round' as const },
  { note: 'F4', freq: 349, size: 64, y: 4, type: 'round' as const },
  { note: 'G4', freq: 392, size: 74, y: 0, type: 'round' as const },
  { note: 'A4', freq: 440, size: 84, y: 0, type: 'tall' as const },
];

function BellsScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [ringing, setRinging] = useState('');

  const ring = useCallback((freq: number, note: string) => {
    playBell(freq);
    setRinging(note);
    setTimeout(() => setRinging(''), 600);
    onPlay('🔔 Bells');
  }, [onPlay]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🔔 Bells" onBack={onBack} />
      <p style={{ textAlign: 'center', fontFamily: 'Fredoka', fontSize: 14, color: '#64748B', marginBottom: 24 }}>Tap a bell to ring it!</p>

      {/* Bell positions */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 32, height: 200 }}>
        {BELL_DATA.map((b, i) => (
          <div key={b.note} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transform: `translateY(${b.y}px)`, animation: ringing === b.note ? 'sway 0.6s ease-in-out' : 'none' }}>
            <svg width={b.size + 20} height={b.size + 24} viewBox={`0 0 ${b.size + 20} ${b.size + 24}`} style={{ cursor: 'pointer', overflow: 'visible' }} onClick={() => ring(b.freq, b.note)}>
              {/* String */}
              <line x1={(b.size + 20) / 2} y1="0" x2={(b.size + 20) / 2} y2="12" stroke="#8B6840" strokeWidth="2" />
              {/* Bell body */}
              {b.type === 'round' ? (
                <ellipse cx={(b.size + 20) / 2} cy={12 + b.size / 2 + 6} rx={b.size / 2} ry={b.size / 2.2}
                  fill="#D4AA6A" stroke="#B8894E" strokeWidth="2"
                  style={{ transformOrigin: `${(b.size + 20) / 2}px ${b.size + 18}px`, transform: ringing === b.note ? 'rotate(15deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease-in-out' }}
                />
              ) : (
                <path d={`M ${(b.size + 20) / 2 - b.size / 3} ${12 + 8}
                          Q ${(b.size + 20) / 2 - b.size / 2.5} ${12 + b.size / 2} ${(b.size + 20) / 2} ${12 + b.size * 0.9}
                          Q ${(b.size + 20) / 2 + b.size / 2.5} ${12 + b.size / 2} ${(b.size + 20) / 2 + b.size / 3} ${12 + 8} Z`}
                  fill="#D4AA6A" stroke="#B8894E" strokeWidth="2"
                  style={{ transformOrigin: `${(b.size + 20) / 2}px ${b.size + 18}px`, transform: ringing === b.note ? 'rotate(15deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease-in-out' }}
                />
              )}
              {/* Crown / loop */}
              <circle cx={(b.size + 20) / 2} cy={12} r={5} fill="#B8894E" />
              {/* Clapper */}
              <circle cx={(b.size + 20) / 2} cy={12 + b.size / 2 + 10} r={4} fill="#8B6840" />
            </svg>
            <span style={{ fontFamily: 'Fredoka', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{b.note}</span>
            <span style={{ fontFamily: 'Fredoka', fontSize: 11, color: '#94A3B8' }}>{b.freq}Hz</span>
          </div>
        ))}
      </div>

      {/* Pentatonic scale info */}
      <div style={{ background: '#FFF9E6', borderRadius: 16, padding: '14px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 13, color: '#8B6914', marginBottom: 4 }}>🔔 Pentatonic Scale</div>
        <div style={{ fontFamily: 'Fredoka', fontSize: 12, color: '#B8900A' }}>C4 – D4 – F4 – G4 – A4 (no half steps!)</div>
      </div>

      <style>{`
        @keyframes sway {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Violin Screen ────────────────────────────────────────────────────────────
const VIOLIN_STRINGS = [
  { label: 'G3', hz: 196, color: '#8B6840' },
  { label: 'D4', hz: 294, color: '#9E7848' },
  { label: 'A4', hz: 440, color: '#B8894E' },
  { label: 'E5', hz: 659, color: '#C99A58' },
];

function ViolinScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (s: string) => void }) {
  const [currentString, setCurrentString] = useState<string | null>(null);
  const [isPlucking, setIsPlucking] = useState<string | null>(null);
  const [bowX, setBowX] = useState(50); // percentage 0-100
  const isDragging = useRef(false);

  const playString = useCallback((hz: number, label: string, duration = 1.5) => {
    playViolin(hz, duration);
    setCurrentString(label);
    onPlay('🎻 Violin');
  }, [onPlay]);

  const pluckString = useCallback((hz: number, label: string) => {
    playViolin(hz, 1.2);
    setIsPlucking(label);
    setCurrentString(label);
    setTimeout(() => setIsPlucking(''), 300);
    setTimeout(() => setCurrentString(null), 1200);
    onPlay('🎻 Violin');
  }, [onPlay]);

  const handleBowMove = useCallback((clientX: number, rect: DOMRect) => {
    const relX = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    setBowX(pct);
    // Determine which string based on Y position of bow
    const stringIndex = Math.floor(pct / (100 / 4));
    const clampedIndex = Math.min(3, stringIndex);
    const str = VIOLIN_STRINGS[clampedIndex];
    playString(str.hz, str.label, 0.1);
  }, [playString]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <ScreenHeader title="🎻 Violin" onBack={onBack} />

      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Fredoka', fontSize: 16, color: '#64748B', minHeight: 24 }}>
          {currentString ? <span style={{ color: '#FF9F43', fontWeight: 700 }}>🎻 Playing: {currentString}</span> : 'Tap a string or drag the bow!'}
        </div>
      </div>

      {/* Violin body */}
      <div style={{
        background: 'linear-gradient(135deg, #C99A58 0%, #8B6840 30%, #B8894E 60%, #7B5E3B 100%)',
        borderRadius: '40% 40% 30% 30% / 50% 50% 30% 30%',
        width: 220, height: 340, margin: '0 auto 24px',
        boxShadow: '0 8px 24px rgba(139,104,64,0.4), inset 0 0 20px rgba(255,255,255,0.1)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* F-holes */}
        <div style={{ position: 'absolute', top: 100, left: 30, width: 14, height: 60, border: '2px solid #5a3e28', borderRadius: '50%', transform: 'rotate(-10deg)' }} />
        <div style={{ position: 'absolute', top: 100, right: 30, width: 14, height: 60, border: '2px solid #5a3e28', borderRadius: '50%', transform: 'rotate(10deg)' }} />
        {/* Bridge */}
        <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', width: 60, height: 6, background: '#5a3e28', borderRadius: 3 }} />
        {/* Chin rest */}
        <div style={{ position: 'absolute', bottom: -10, right: 20, width: 30, height: 20, background: '#4a3020', borderRadius: '0 0 8px 8px' }} />

        {/* Strings (horizontal) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '20px 0' }}>
          {VIOLIN_STRINGS.map((s, i) => (
            <div key={s.label} style={{
              height: isPlucking === s.label ? 3 : 2,
              background: `linear-gradient(90deg, transparent 0%, ${s.color} 20%, ${s.color} 80%, transparent 100%)`,
              margin: '0 25px',
              boxShadow: `0 1px 2px ${s.color}88`,
              transition: 'height 0.1s',
              cursor: 'pointer',
            }}
              onClick={() => pluckString(s.hz, s.label)}
            />
          ))}
        </div>

        {/* Bow */}
        <div
          style={{
            position: 'absolute', bottom: 20, left: `${bowX}%`, transform: 'translateX(-50%)',
            width: 160, height: 8, background: 'linear-gradient(180deg, #F5E6D0 0%, #D4C0A0 50%, #C0A878 100%)',
            borderRadius: 4, cursor: 'grab', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '1px solid #A08860',
          }}
          onMouseDown={e => { isDragging.current = true; handleBowMove(e.clientX, e.currentTarget.getBoundingClientRect()); }}
          onMouseMove={e => { if (isDragging.current) handleBowMove(e.clientX, e.currentTarget.parentElement!.getBoundingClientRect()); }}
          onMouseUp={() => { isDragging.current = false; setCurrentString(null); }}
          onMouseLeave={() => { isDragging.current = false; setCurrentString(null); }}
          onTouchStart={e => { isDragging.current = true; handleBowMove(e.touches[0].clientX, e.currentTarget.parentElement!.getBoundingClientRect()); }}
          onTouchMove={e => { if (isDragging.current) handleBowMove(e.touches[0].clientX, e.currentTarget.parentElement!.getBoundingClientRect()); }}
          onTouchEnd={() => { isDragging.current = false; setCurrentString(null); }}
        >
          {/* Bow hair (thin white lines) */}
          <div style={{ position: 'absolute', top: 2, left: 4, right: 4, height: 1, background: 'rgba(255,255,255,0.6)' }} />
          <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 1, background: 'rgba(255,255,255,0.6)' }} />
        </div>
      </div>

      {/* String labels */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
        {VIOLIN_STRINGS.map(s => (
          <button
            key={s.label}
            onClick={() => pluckString(s.hz, s.label)}
            style={{
              padding: '8px 14px', background: isPlucking === s.label ? s.color : '#F1F0EC',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Fredoka',
              fontSize: 14, fontWeight: 600, color: isPlucking === s.label ? 'white' : '#64748B',
              boxShadow: `0 3px 0 ${s.color}44`,
              transform: isPlucking === s.label ? 'translateY(2px)' : 'translateY(0)',
              transition: 'all 0.1s',
            }}
          >
            🎻 {s.label} · {s.hz}Hz
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'Fredoka', fontSize: 13, color: '#94A3B8' }}>
        Tap a string to pluck • Drag the bow across the violin body
      </div>
    </div>
  );
}
