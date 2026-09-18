'use client';

/**
 * Shared audio context + procedural sound effects.
 *
 * Browser autoplay rules: AudioContext must be created or resumed inside
 * a user gesture. We arm a one-time listener on click/keydown/touchstart
 * that resumes the context; until then play*() functions are no-ops.
 *
 * All sounds are synthesized on the fly with Web Audio — no assets shipped:
 *   - playFootstep       — short low-pass noise burst (~120ms)
 *   - playDoorChime      — two-note bell on building entry (C5 → E5)
 *   - playStickerEarned  — C major triad (C5 + E5 + G5)
 */

let ctx: AudioContext | null = null;
let armed = true;

function makeContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export function getAudioContext(): AudioContext | null {
  if (!ctx) ctx = makeContext();
  return ctx;
}

/**
 * Register a one-time handler that resumes the audio context on the first
 * user gesture. Safe to call from multiple components — only the first
 * call attaches listeners.
 */
export function armFirstGesture(): void {
  if (typeof window === 'undefined' || !armed) return;
  armed = false;
  const start = () => {
    const c = getAudioContext();
    if (c && c.state === 'suspended') c.resume();
    window.removeEventListener('click', start);
    window.removeEventListener('keydown', start);
    window.removeEventListener('touchstart', start);
  };
  window.addEventListener('click', start);
  window.addEventListener('keydown', start);
  window.addEventListener('touchstart', start);
}

/**
 * Soft footstep on grass — short low-pass noise burst.
 * No-op until the audio context is running (i.e. after first gesture).
 */
export function playFootstep(): void {
  const c = getAudioContext();
  if (!c || c.state !== 'running') return;

  const dur = 0.12;
  const sampleRate = c.sampleRate;
  const buffer = c.createBuffer(1, Math.max(1, Math.floor(sampleRate * dur)), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 22);
  }

  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  filter.Q.value = 0.5;

  const gain = c.createGain();
  gain.gain.value = 0.14;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
}

/**
 * Two-note bell — used when entering a building.
 * C5 then E5, slightly overlapping.
 */
export function playDoorChime(): void {
  const c = getAudioContext();
  if (!c || c.state !== 'running') return;
  playBellNote(c, 523.25, 0.00, 0.28, 0.18);
  playBellNote(c, 659.25, 0.07, 0.32, 0.14);
}

/**
 * Happy C major triad — used when a sticker is earned.
 * C5 + E5 + G5 cascading in over 100ms.
 */
export function playStickerEarned(): void {
  const c = getAudioContext();
  if (!c || c.state !== 'running') return;
  playBellNote(c, 523.25, 0.00, 0.42, 0.11);
  playBellNote(c, 659.25, 0.05, 0.42, 0.11);
  playBellNote(c, 783.99, 0.10, 0.42, 0.11);
}

/**
 * Internal: schedule a single sine bell note with quick attack + exp decay.
 */
function playBellNote(
  c: AudioContext,
  freq: number,
  delay: number,
  duration: number,
  peak: number,
): void {
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = c.createGain();
  const now = c.currentTime + delay;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}
