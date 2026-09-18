'use client';

import type { Progress } from './lib/progress';

export type QuestReward =
  | { kind: 'sticker'; stickerId: string }
  | { kind: 'badge';   label: string };

export type Quest = {
  id: string;
  title: string;
  hint: string;
  emoji: string;
  reward: QuestReward;
  isComplete: (p: Progress) => boolean;
};

/**
 * Sequential quest chain — each quest unlocks once the previous one is
 * complete. Quests are intentionally short and concrete so kids always
 * know what to do next.
 *
 * Reward delivery: rewards are derived at render time (see getEarnedStickerIds
 * in stickers.ts). No separate "rewarded" flag in localStorage needed.
 */
export const QUESTS: Quest[] = [
  {
    id: 'visit-any',
    title: 'Welcome to School 3D!',
    hint: 'Walk to any building and press E to enter',
    emoji: '🚪',
    reward: { kind: 'sticker', stickerId: 'visitor' },
    isComplete: (p) => p.visitedBuildings.length >= 1,
  },
  {
    id: 'first-activity',
    title: 'Earn your first sticker',
    hint: 'Complete an activity in any building',
    emoji: '⭐',
    reward: { kind: 'sticker', stickerId: 'first-activity' },
    isComplete: (p) => p.completedStations.length >= 1,
  },
  {
    id: 'help-bellabot',
    title: 'Help Bellabot with code',
    hint: 'Play CodeBots at the Main Office',
    emoji: '🤖',
    reward: { kind: 'sticker', stickerId: 'bellabot-friend' },
    isComplete: (p) => p.completedStations.includes('codebots'),
  },
  {
    id: 'help-bookbot',
    title: 'Read with Book Bot',
    hint: 'Play Story Machine at the Library',
    emoji: '📚',
    reward: { kind: 'sticker', stickerId: 'bookworm' },
    isComplete: (p) => p.completedStations.includes('storymachine'),
  },
  {
    id: 'help-mathbot',
    title: 'Count with Math Bot',
    hint: 'Play Math Lab at the Math Den',
    emoji: '🔢',
    reward: { kind: 'sticker', stickerId: 'math-whiz' },
    isComplete: (p) => p.completedStations.includes('mathlab'),
  },
  {
    id: 'explorer',
    title: 'Campus Explorer',
    hint: 'Visit every building on campus',
    emoji: '🗺️',
    reward: { kind: 'badge', label: 'Explorer' },
    isComplete: (p) => p.visitedBuildings.length >= 12,
  },
  {
    id: 'scholar',
    title: 'Super Scholar',
    hint: 'Complete 5 activities',
    emoji: '🎓',
    reward: { kind: 'badge', label: 'Scholar' },
    isComplete: (p) => p.completedStations.length >= 5,
  },
  {
    id: 'master',
    title: 'Campus Master',
    hint: 'Complete every activity on campus',
    emoji: '👑',
    reward: { kind: 'badge', label: 'Master' },
    isComplete: (p) => p.completedStations.length >= 24, // 24 real activities (excluding Coming soon)
  },
];

/**
 * The active quest is the first one that's not yet complete.
 * Returns null if every quest is complete (rare — kid has done everything).
 */
export function getActiveQuest(progress: Progress): Quest | null {
  for (const q of QUESTS) {
    if (!q.isComplete(progress)) return q;
  }
  return null;
}

export function getCompletedQuestIds(progress: Progress): Set<string> {
  const ids = new Set<string>();
  for (const q of QUESTS) {
    if (q.isComplete(progress)) ids.add(q.id);
  }
  return ids;
}

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}
