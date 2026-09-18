'use client';

import { BUILDINGS } from './buildings.config';
import type { Progress } from './lib/progress';
import { QUESTS } from './quests';

export type Sticker = {
  id: string;
  name: string;
  emoji: string;
  color: string;        // background tint of the sticker card
  description: string;
  category: 'meta' | 'building' | 'badge';
};

// Reverse map: stationId -> buildingId, for "complete an activity in
// building X" auto-awards.
export const STATION_TO_BUILDING: Record<string, string> = {};
for (const b of BUILDINGS) {
  for (const s of b.stations) {
    STATION_TO_BUILDING[s.id] = b.id;
  }
}

export const STICKERS: Sticker[] = [
  // ── Meta / quest stickers ─────────────────────────────────
  {
    id: 'visitor',          name: 'First Visit',       emoji: '🚪', color: '#A8C9D8', category: 'meta',
    description: 'Visited your first building',
  },
  {
    id: 'first-activity',   name: 'First Activity',    emoji: '⭐', color: '#E8C788', category: 'meta',
    description: 'Completed your first activity',
  },
  {
    id: 'bellabot-friend',  name: "Bellabot's Friend", emoji: '🤖', color: '#9DB6C9', category: 'meta',
    description: 'Helped Bellabot with code',
  },
  {
    id: 'bookworm',         name: 'Bookworm',          emoji: '📚', color: '#9DB6C9', category: 'meta',
    description: 'Read stories with Book Bot',
  },
  {
    id: 'math-whiz',        name: 'Math Whiz',         emoji: '🔢', color: '#D8B26E', category: 'meta',
    description: 'Counted with Math Bot',
  },
  {
    id: 'badge-explorer',   name: 'Explorer',          emoji: '🗺️', color: '#A4B58A', category: 'badge',
    description: 'Visited every building on campus',
  },
  {
    id: 'badge-scholar',    name: 'Scholar',           emoji: '🎓', color: '#C9A6B0', category: 'badge',
    description: 'Completed 5 activities',
  },
  {
    id: 'badge-master',     name: 'Master',            emoji: '👑', color: '#E8B4A0', category: 'badge',
    description: 'Completed every activity on campus',
  },

  // ── Building stickers ────────────────────────────────────
  ...BUILDINGS.map<Sticker>((b) => ({
    id: `building-${b.id}`,
    name: b.label,
    emoji: b.stations[0]?.icon ?? '🏫',
    color: b.color,
    category: 'building',
    description: `Completed an activity at ${b.label}`,
  })),
];

export const STICKERS_BY_ID: Record<string, Sticker> =
  Object.fromEntries(STICKERS.map((s) => [s.id, s]));

export function getSticker(id: string): Sticker | undefined {
  return STICKERS_BY_ID[id];
}

export function getBuildingStickerId(buildingId: string): string {
  return `building-${buildingId}`;
}

/**
 * Compute the full set of stickers a kid has earned so far.
 * Derived entirely from progress — no separate tracking needed.
 */
export function getEarnedStickerIds(progress: Progress): Set<string> {
  const earned = new Set<string>();

  // Quest rewards
  for (const q of QUESTS) {
    if (q.isComplete(progress)) {
      if (q.reward.kind === 'sticker') earned.add(q.reward.stickerId);
      if (q.reward.kind === 'badge')   earned.add(`badge-${q.reward.label.toLowerCase()}`);
    }
  }

  // Building stickers: any completed station in that building
  for (const stationId of progress.completedStations) {
    const buildingId = STATION_TO_BUILDING[stationId];
    if (buildingId) earned.add(getBuildingStickerId(buildingId));
  }

  return earned;
}

/**
 * Returns sticker IDs that became earned between two progress snapshots —
 * used by the HUD to fire a one-shot "+ Sticker!" toast.
 */
export function diffStickerIds(before: Set<string>, after: Set<string>): string[] {
  const newly: string[] = [];
  for (const id of after) {
    if (!before.has(id)) newly.push(id);
  }
  return newly;
}
