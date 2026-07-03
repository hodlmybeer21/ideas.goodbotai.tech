'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import RatingModal from './RatingModal';

// Beat Composer — a tiny step sequencer the kid programs with taps.
// 4 instrument tracks (Kick / Snare / Hi-Hat / Tom) across an 8-step
// (or 4-step compact) grid. Tap cells to toggle steps; press Play to loop.
// Three preset patterns (Rock / Dance / Latin) give an "instant win"
// first impression. Tempo slider 80-180 BPM.
//
// Mirrors the synth voices from SoundLab so the audio quality matches
// the rest of the site (kick = sub-burst, snare = noise + tone, hi-hat
// = filtered noise, tom = pitched sweep).

type InstrumentId = 'kick' | 'snare' | 'hihat' | 'tom';

const STORAGE_KEY = 'beat…ong';
const STORAGE_BEAT_COUNT = 'beatcomposer_count';

const INSTRUMENTS: { id: InstrumentId; label: string; emoji: string; color: string; shadow: string }[] = [
  { id: 'kick',  label: 'Kick',   emoji: '🥁', color: '#FF6B9D', shadow: '#c9456e' },
  { id: 'snare', label: 'Snare',  emoji: '🍮', color: '#FFD93D', shadow: '#c9a82e' },
  { id: 'hihat', label: 'Hi-Hat', emoji: '🎵', color: '#94A3B8', shadow: '#64748B' },
  { id: 'tom',   label: 'Tom',    emoji: '🪘', color: '#C084FC', shadow: '#7c3aed' },
];

// 4-track × 8-step pattern, indexed [trackIndex][stepIndex] = boolean
type Pattern = boolean[][];

// Preset patterns (true = step is active)
const PRESETS: Record<'rock' | 'dance' | 'latin', Pattern> = {
  rock: [
    // kick:    x . . . x . . .
    [true,  false, false, false, true,  false, false, false],
    // snare:   . . x . . . x .
    [false, false, true,  false, false, false, true,  false],
    // hihat:   x x x x x x x x
    [true,  true,  true,  true,  true,  true,  true,  true ],
    // tom:     . . . . . . . .
    [false, false, false, false, false, false, false, false],
  ],
  dance: [
    // kick:    x . . . x . . .
    [true,  false, false, false, true,  false, false, false],
    // snare:   . . . x . . . x
    [false, false, false, true,  false, false, false, true ],
    // hihat:   x . x . x . x .
    [true,  false, true,  false, true,  false, true,  false],
    // tom:     . . x . . . x .
    [false, false, true,  false, false, false, true,  false],
  ],
  latin: [
    // kick:    x . x . . x . .
    [true,  false, true,  false, false, true,  false, false],
    // snare:   . x . . . x . .
    [false, true,  false, false, false, true,  false, false],
    // hihat:   x . x x . . x x
    [true,  false, true,  true,  false, false, true,  true ],
    // tom:     . . . x . . . x
    [false, false, false, true,  false, false, false, true ],
  ],
};

// --- Synth voices (mirrors SoundLab's flavor) ---
let _ctx: AudioContext | null = null;
function ctxA(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function playKick() {
  try {
    const c = ctxA();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.9, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.32);
  } catch {}
}
function playSnare() {
  try {
    const c = ctxA();
    // Noise burst
    const bufLen = 44100 * 0.15;
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const nGain = c.createGain();
    noise.connect(nGain); nGain.connect(c.destination);
    nGain.gain.setValueAtTime(0.4, c.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    noise.start(c.currentTime);
    // Body tone
    const osc = c.createOscillator();
    const gGain = c.createGain();
    osc.connect(gGain); gGain.connect(c.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.05);
    gGain.gain.setValueAtTime(0.3, c.currentTime);
    gGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.12);
  } catch {}
}
function playHihat() {
  try {
    const c = ctxA();
    const bufLen = 44100 * 0.05;
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = c.createGain();
    noise.connect(hp); hp.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    noise.start(c.currentTime);
  } catch {}
}
function playTom() {
  try {
    const c = ctxA();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.42);
  } catch {}
}
function playInstrument(id: InstrumentId) {
  switch (id) {
    case 'kick':  return playKick();
    case 'snare': return playSnare();
    case 'hihat': return playHihat();
    case 'tom':   return playTom();
  }
}

// Lightweight fanfares for win / save
function fanfare() {
  try {
    const c = ctxA();
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.3);
      o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.32);
    });
  } catch {}
}
function tick() {
  try {
    const c = ctxA();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'triangle'; o.frequency.value = 1200;
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    o.start(c.currentTime); o.stop(c.currentTime + 0.05);
  } catch {}
}

// =============================================================================
export default function BeatComposer({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [pattern, setPattern] = useState<Pattern>(() =>
    JSON.parse(JSON.stringify(PRESETS.rock)) // deep clone
  );
  const [steps, setSteps] = useState<8 | 4>(8);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [songCount, setSongCount] = useState(0);
  const [bestCount, setBestCount] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [activePreset, setActivePreset] = useState<'rock' | 'dance' | 'latin' | 'custom'>('rock');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const playingRef = useRef(playing);
  const patternRef = useRef(pattern);
  const stepsRef = useRef(steps);

  // keep refs in sync with state (so the timer captures the latest values)
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  // Load count from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BEAT_COUNT);
      if (saved) setBestCount(parseInt(saved, 10) || 0);
    } catch {}
  }, []);

  // --- Sequencer engine: fires on every step. Triggers any active instruments
  // at that step, then advances. The step period = (60 / BPM / 2) seconds
  // because each step is an 8th note.
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setCurrentStep(-1);
      return;
    }
    const stepMs = Math.max(60, (60_000 / bpm) / 2);
    // Play the current step immediately, then on each tick
    const fire = (s: number) => {
      const pat = patternRef.current;
      const st  = stepsRef.current;
      for (let track = 0; track < INSTRUMENTS.length; track++) {
        if (pat[track] && pat[track][s]) {
          playInstrument(INSTRUMENTS[track].id);
        }
      }
      setCurrentStep(s);
      tick();
    };
    fire(stepRef.current);
    timerRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % stepsRef.current;
      fire(stepRef.current);
    }, stepMs);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [playing, bpm]);

  const toggleCell = useCallback((trackIdx: number, stepIdx: number) => {
    // Audible feedback: tap also plays the instrument for that track (kids
    // can audition without entering play mode)
    playInstrument(INSTRUMENTS[trackIdx].id);
    setPattern(prev => {
      const next = prev.map(row => [...row]);
      next[trackIdx][stepIdx] = !next[trackIdx][stepIdx];
      return next;
    });
    setActivePreset('custom');
  }, []);

  const playPattern = useCallback((p: 'rock' | 'dance' | 'latin') => {
    setPattern(JSON.parse(JSON.stringify(PRESETS[p])));
    setActivePreset(p);
    tick();
  }, []);

  const clearPattern = useCallback(() => {
    setPattern(INSTRUMENTS.map(() => new Array(steps).fill(false)));
    setActivePreset('custom');
  }, [steps]);

  const saveSong = useCallback(() => {
    try {
      const payload = { pattern, steps, bpm, id: `song_${Date.now()}` };
      const existing: any[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.unshift(payload);
      // keep the last 16
      const trimmed = existing.slice(0, 16);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      const newCount = songCount + 1;
      setSongCount(newCount);
      const newBest = Math.max(bestCount, newCount);
      setBestCount(newBest);
      try { localStorage.setItem(STORAGE_BEAT_COUNT, String(newBest)); } catch {}
      fanfare();
      setFeedback({ kind: 'good', text: '🎵 Song saved!' });
      setTimeout(() => setFeedback(null), 1500);
    } catch {
      setFeedback({ kind: 'bad', text: 'Could not save. Try again.' });
      setTimeout(() => setFeedback(null), 1500);
    }
  }, [pattern, steps, bpm, songCount, bestCount]);

  const totalActive = useMemo(
    () => pattern.reduce((acc, row) => acc + row.filter(Boolean).length, 0),
    [pattern]
  );

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 760 }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title">🎵 Beat Composer</h1>

      {/* Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-medium)' }}>
          <span><strong style={{ color: 'var(--accent-orange)' }}>{bpm}</strong> BPM</span>
          <span>·</span>
          <span><strong style={{ color: 'var(--accent-purple)' }}>{steps}</strong> steps</span>
          <span>·</span>
          <span><strong style={{ color: 'var(--accent-pink)' }}>{totalActive}</strong> cells lit</span>
          <span>·</span>
          <span>🏆 <strong>{bestCount}</strong> saved</span>
        </div>
      </div>

      {/* Tempo + length controls */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap',
        background: 'var(--bg-primary)', padding: 14, borderRadius: 14,
      }}>
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-medium)', marginBottom: 4 }}>
            Tempo: {bpm} BPM
          </div>
          <input
            type="range" min={80} max={180} value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: '100%' }}
            aria-label="Tempo"
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-medium)', marginBottom: 4 }}>
            Loop length
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={steps === 4 ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => {
                setSteps(4);
                setPattern(prev => prev.map(row => row.slice(0, 4)));
                setActivePreset('custom');
              }}
              style={{ fontSize: 14, padding: '8px 14px' }}
            >
              4
            </button>
            <button
              className={steps === 8 ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => {
                setSteps(8);
                setPattern(prev => prev.map(row => {
                  if (row.length >= 8) return row.slice(0, 8);
                  return [...row, ...new Array(8 - row.length).fill(false)];
                }));
                setActivePreset('custom');
              }}
              style={{ fontSize: 14, padding: '8px 14px' }}
            >
              8
            </button>
          </div>
        </div>
      </div>

      {/* Preset patterns */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className={activePreset === 'rock' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => playPattern('rock')}
          style={{ fontSize: 14, padding: '8px 14px' }}
        >🎸 Rock</button>
        <button
          className={activePreset === 'dance' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => playPattern('dance')}
          style={{ fontSize: 14, padding: '8px 14px' }}
        >🎧 Dance</button>
        <button
          className={activePreset === 'latin' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => playPattern('latin')}
          style={{ fontSize: 14, padding: '8px 14px' }}
        >💃 Latin</button>
      </div>

      {/* Sequencer grid: rows = tracks (top-to-bottom), cols = steps */}
      <div style={{
        background: '#1F2937',
        borderRadius: 16,
        padding: '14px 16px 18px',
        marginBottom: 14,
        boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
      }}>
        {/* Step headers (count numbers) */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 6, marginBottom: 6 }}>
          <div />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps}, 1fr)`, gap: 6 }}>
            {Array.from({ length: steps }, (_, i) => (
              <div key={i} style={{
                textAlign: 'center', color: '#9CA3AF', fontSize: 11, fontWeight: 700,
              }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Track rows */}
        {INSTRUMENTS.map((inst, trackIdx) => (
          <div
            key={inst.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr',
              gap: 6,
              marginBottom: 6,
              alignItems: 'center',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'white', fontWeight: 700, fontSize: 14,
            }}>
              <span style={{ fontSize: 18 }}>{inst.emoji}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps}, 1fr)`, gap: 6 }}>
              {Array.from({ length: steps }, (_, stepIdx) => {
                const active = pattern[trackIdx][stepIdx];
                const isCurrent = playing && currentStep === stepIdx;
                return (
                  <button
                    key={stepIdx}
                    onClick={() => toggleCell(trackIdx, stepIdx)}
                    aria-label={`${inst.label} step ${stepIdx + 1} ${active ? 'on' : 'off'}`}
                    style={{
                      aspectRatio: '1 / 1',
                      minHeight: 36,
                      borderRadius: 8,
                      border: isCurrent ? '3px solid white' : '2px solid #374151',
                      background: active
                        ? (isCurrent ? '#FFFFFF' : inst.color)
                        : (isCurrent ? '#4B5563' : '#111827'),
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'background 0.1s, transform 0.05s',
                      transform: isCurrent && active ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: active && !isCurrent ? `0 3px 0 ${inst.shadow}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Transport controls */}
      <div className="canvas-actions">
        <button
          className={playing ? 'btn btn-orange' : 'btn btn-green'}
          onClick={() => setPlaying(p => !p)}
        >
          {playing ? '⏸ Stop' : '▶ Play'}
        </button>
        <button className="btn btn-secondary" onClick={clearPattern}>🗑 Clear</button>
        <button className="btn btn-primary" onClick={saveSong}>💾 Save Song</button>
      </div>

      {feedback && (
        <div
          style={{
            marginTop: 14, padding: '12px 18px', borderRadius: 14, textAlign: 'center',
            fontWeight: 700, fontSize: 17,
            background: feedback.kind === 'good' ? 'var(--accent-green)' : 'var(--accent-pink)',
            color: 'white', boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
            animation: 'pop 0.35s ease',
          }}
        >
          {feedback.text}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap a square to turn a beat on or off. Tap the instruments to audition.
        Try a <strong>preset</strong>, change the <strong>tempo</strong>, then make it your own!
      </p>

      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text-medium)' }}>
        Tap the <strong>Save Song</strong> button a few times and I'll ask how you like Beat Composer ⭐
      </p>

      {songCount >= 3 && !rated && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button onClick={() => setShowRating(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}>
            ⭐ Rate Beat Composer
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal
          activity="beat-composer"
          activityName="Beat Composer"
          activityEmoji="🎵"
          kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }}
        />
      )}
    </div>
  );
}
