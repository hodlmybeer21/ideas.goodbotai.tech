'use client';

/**
 * Character customization — hats & backpacks.
 *
 * Stored in localStorage under `goodbotkids_school3d_custom_v1`.
 * Persists per browser; no server sync (out of scope for tier 3).
 */

export type AccessoryType = 'hat' | 'backpack';

export type Accessory = {
  id: string;
  type: AccessoryType;
  name: string;
  emoji: string;
  color: string;
};

export const HATS: Accessory[] = [
  { id: 'hat-party',  type: 'hat', name: 'Party Hat',  emoji: '🎉', color: '#E8B4A0' },
  { id: 'hat-wizard', type: 'hat', name: 'Wizard Hat', emoji: '🔮', color: '#9DB6C9' },
  { id: 'hat-straw',  type: 'hat', name: 'Straw Hat',  emoji: '🌾', color: '#D8B26E' },
];

export const BACKPACKS: Accessory[] = [
  { id: 'bp-school', type: 'backpack', name: 'School Bag', emoji: '🎒', color: '#A04F3F' },
];

export type Customization = {
  hat: string | null;       // Accessory.id, or null for no hat
  backpack: string | null;  // Accessory.id, or null for no backpack
};

const STORAGE_KEY = '***';

export const EMPTY_CUSTOMIZATION: Customization = { hat: null, backpack: null };

export function loadCustomization(): Customization {
  if (typeof window === 'undefined') return EMPTY_CUSTOMIZATION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return {
      hat: typeof parsed?.hat === 'string' ? parsed.hat : null,
      backpack: typeof parsed?.backpack === 'string' ? parsed.backpack : null,
    };
  } catch {
    return EMPTY_CUSTOMIZATION;
  }
}

export function saveCustomization(c: Customization): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // private mode / quota — silently ignore
  }
}

export function getAccessory(id: string | null): Accessory | null {
  if (!id) return null;
  return [...HATS, ...BACKPACKS].find((a) => a.id === id) ?? null;
}
