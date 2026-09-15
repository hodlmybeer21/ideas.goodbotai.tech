'use client';

import { ComponentType, lazy } from 'react';

/**
 * Maps activity id → dynamic import.
 * Used by ActivityModal to lazy-load the existing React activity components
 * from `app/components/*`. Keeps the initial 3D bundle lean.
 */
type ActivityProps = { onBack: () => void; kidName: string };

export const ACTIVITY_MAP: Record<string, () => Promise<{ default: ComponentType<ActivityProps> }>> = {
  colorlab:           () => import('../components/ColorLab'),
  pixelcanvas_b:      () => import('../components/PixelCanvas'),
  drawingcanvas:      () => import('../components/DrawingCanvas'),
  storymachine:       () => import('../components/StoryMachine'),
  readalong:          () => import('../components/ReadAlong'),
  storyqa:            () => import('../components/StoryQA'),
  plantcycle:         () => import('../components/PlantLifeCycle'),
  soundlab:           () => import('../components/SoundLab'),
  mattermixer:        () => import('../components/MatterMixer'),
  animatch:           () => import('../components/AnimalMatch'),
  characterraits:     () => import('../components/CharacterTraits'),
  sentencefixer:      () => import('../components/SentenceFixer'),
  bossyr:             () => import('../components/BossyRRacer'),
  equalparts:         () => import('../components/EqualParts'),
  coinchallenge:      () => import('../components/CoinChallenge'),
  telltime:           () => import('../components/TellTime'),
  codebots:           () => import('../components/CodeBots'),
  istherobotright:    () => import('../components/IsTheRobotRight'),
  mathlab:            () => import('../components/MathLab'),
  tensonesexplorer:   () => import('../components/TensOnesExplorer'),
  placevaluepirates:  () => import('../components/PlaceValuePirates'),
  syllable_b:         () => import('../components/SyllableScooper'),
  madlibs:            () => import('../components/MadLibs'),
  beatcomposer:       () => import('../components/BeatComposer'),
  statefinder:        () => import('../components/StateFinder'),
  truefalse:          () => import('../components/TrueFalse'),
  basewordsorter:     () => import('../components/BasewordSorter'),
  pluralbuilder:      () => import('../components/PluralBuilder'),
};

/**
 * Stations that are wired up to a building but not yet built as React components.
 * These show a "Coming soon" placeholder modal instead of an activity.
 */
export const COMING_SOON: Record<string, string> = {
  mathrace:     'Math Race',
  vocabventure: 'Vocab Venture',
  wordsearch:   'Word Search',
  readingrace:  'Reading Race',
};

/** Friendly metadata for the activity header shown in ActivityModal. */
export const ACTIVITY_META: Record<string, { icon: string; name: string }> = {
  colorlab:           { icon: '🎨',  name: 'Color Lab' },
  pixelcanvas_b:      { icon: '🎮',  name: 'Pixel Canvas' },
  drawingcanvas:      { icon: '🖌️', name: 'Magic Canvas' },
  storymachine:       { icon: '📖',  name: 'Story Machine' },
  readalong:          { icon: '📖',  name: 'Read Along' },
  storyqa:            { icon: '📚',  name: 'Story Q&A' },
  plantcycle:         { icon: '🌱',  name: 'Plant Life Cycle' },
  soundlab:           { icon: '🎵',  name: 'Sound Lab' },
  mattermixer:        { icon: '🧪',  name: 'Matter Mixer' },
  animatch:           { icon: '🧩',  name: 'Animal Match' },
  characterraits:     { icon: '🎭',  name: 'Character Traits' },
  sentencefixer:      { icon: '✏️',  name: 'Sentence Fixer' },
  bossyr:             { icon: '🏎️', name: 'Bossy R Racer' },
  equalparts:         { icon: '🔴',  name: 'Equal Parts' },
  coinchallenge:      { icon: '🪙',  name: 'Coin Challenge' },
  telltime:           { icon: '🕐',  name: 'Tell Time' },
  codebots:           { icon: '🤖',  name: 'CodeBots' },
  istherobotright:    { icon: '🤖',  name: 'Is the Robot Right?' },
  mathlab:            { icon: '🧮',  name: 'Math Lab' },
  tensonesexplorer:   { icon: '🔢',  name: 'Tens & Ones' },
  placevaluepirates:  { icon: '🏴‍☠️', name: 'Place Value Pirates' },
  syllable_b:         { icon: '🔤',  name: 'Syllable Scooper' },
  madlibs:            { icon: '📝',  name: 'Mad Libs' },
  beatcomposer:       { icon: '🎵',  name: 'Beat Composer' },
  statefinder:        { icon: '🗺️',  name: 'State Finder' },
  truefalse:          { icon: '✅',  name: 'True or False' },
  basewordsorter:     { icon: '🔗',  name: 'Baseword Sorter' },
  pluralbuilder:      { icon: '🔠',  name: 'Plural Builder' },
};

export function getMeta(stationId: string): { icon: string; name: string } {
  return ACTIVITY_META[stationId] ?? { icon: '🎮', name: stationId };
}

export function isAvailable(stationId: string): boolean {
  return stationId in ACTIVITY_MAP;
}
