'use client';

/**
 * Season types and per-season particle config.
 *
 * The seasonal weather system drives falling-particle effects:
 *   spring → sakura petals (soft pink)
 *   summer → no particles (clear sky, butterflies still flutter)
 *   autumn → maple leaves (warm orange/red)
 *   winter → snow (white)
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_META: Record<Season, {
  label: string;
  emoji: string;
  color: string;        // particle tint
  particleCount: number;
  fallSpeed: number;    // base Y velocity (negative = down)
  spread: number;       // horizontal velocity range
  windStrength: number; // side-to-side wiggle amplitude
}> = {
  spring: {
    label: 'Spring', emoji: '🌸',
    color: '#F8C8DC',
    particleCount: 70,
    fallSpeed: -0.35,
    spread: 0.6,
    windStrength: 0.45,
  },
  summer: {
    label: 'Summer', emoji: '☀️',
    color: '#FFFFFF', // unused — no particles
    particleCount: 0,
    fallSpeed: 0,
    spread: 0,
    windStrength: 0,
  },
  autumn: {
    label: 'Autumn', emoji: '🍂',
    color: '#D88E3C',
    particleCount: 100,
    fallSpeed: -0.55,
    spread: 0.9,
    windStrength: 0.7,
  },
  winter: {
    label: 'Winter', emoji: '❄️',
    color: '#FFFFFF',
    particleCount: 140,
    fallSpeed: -0.45,
    spread: 0.3,
    windStrength: 0.25,
  },
};

export function nextSeason(s: Season): Season {
  const i = SEASONS.indexOf(s);
  return SEASONS[(i + 1) % SEASONS.length];
}
