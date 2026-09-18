'use client';

/**
 * Progress persistence for School 3D.
 *
 * Stored in localStorage under `goodbotkids_school3d_v1`:
 *   {
 *     visitedBuildings: string[];   // building ids the player has walked up to
 *     completedStations: string[];  // station ids the player has finished
 *     hasOnboarded: boolean;        // tutorial seen?
 *   }
 *
 * Falls back to empty progress on SSR / parse error / storage disabled
 * (Safari private mode, quota exceeded) — never throws.
 */

export type Progress = {
  visitedBuildings: string[];
  completedStations: string[];
  hasOnboarded: boolean;
};

const STORAGE_KEY = 'goodbotkids_school3d_v1';

const EMPTY: Progress = {
  visitedBuildings: [],
  completedStations: [],
  hasOnboarded: false,
};

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      visitedBuildings: Array.isArray(parsed?.visitedBuildings)
        ? parsed.visitedBuildings.filter((x: unknown) => typeof x === 'string')
        : [],
      completedStations: Array.isArray(parsed?.completedStations)
        ? parsed.completedStations.filter((x: unknown) => typeof x === 'string')
        : [],
      hasOnboarded: !!parsed?.hasOnboarded,
    };
  } catch {
    return EMPTY;
  }
}

export function saveProgress(p: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Storage quota / disabled — silently ignore. We never block gameplay on it.
  }
}

export function markVisited(p: Progress, buildingId: string): Progress {
  if (p.visitedBuildings.includes(buildingId)) return p;
  return { ...p, visitedBuildings: [...p.visitedBuildings, buildingId] };
}

export function markCompleted(p: Progress, stationId: string): Progress {
  if (p.completedStations.includes(stationId)) return p;
  return { ...p, completedStations: [...p.completedStations, stationId] };
}

export function markOnboarded(p: Progress): Progress {
  if (p.hasOnboarded) return p;
  return { ...p, hasOnboarded: true };
}
