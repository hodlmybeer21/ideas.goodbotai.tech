'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * BGMPlayer — auto-starts ambient background music on first user gesture
 * (browser autoplay policy). Provides a bottom-right toggle button for mute.
 */
export default function BGMPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [armed, setArmed] = useState(true);

  // First user gesture → start playing
  useEffect(() => {
    if (!armed) return;
    const start = () => {
      setArmed(false);
      setPlaying(true);
      window.removeEventListener('click', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('touchstart', start);
    };
    window.addEventListener('click', start);
    window.addEventListener('keydown', start);
    window.addEventListener('touchstart', start);
    return () => {
      window.removeEventListener('click', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('touchstart', start);
    };
  }, [armed]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.volume = 0.25; // kid-friendly low volume
      a.play().catch(() => {
        // Couldn't autoplay — fall back to mute
        setPlaying(false);
      });
    } else {
      a.pause();
    }
  }, [playing]);

  return (
    <>
      <audio ref={audioRef} src={audioUrl} loop preload="auto" />
      <button
        onClick={() => setPlaying((p) => !p)}
        title={playing ? 'Mute music' : 'Play music'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: playing
            ? 'linear-gradient(135deg, #FF6B9D, #FFD93D)'
            : 'rgba(255,255,255,0.85)',
          border: '3px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          fontSize: 22,
          zIndex: 100,
          fontFamily: 'Fredoka, sans-serif',
        }}
      >
        {playing ? '🔊' : '🔇'}
      </button>
    </>
  );
}
