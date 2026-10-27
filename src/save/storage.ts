import { AmmoInventory, ShipClass } from '../sim/types';

export const SAVE_KEY = 'rustline_save_v1';

export interface GameSaveData {
  version: 1;
  player: {
    level: number;
    xp: number;
    credits: number;
    ore: number;
    shipClass: ShipClass;
    lasersEquipped: (string | null)[];
    shieldEquipped: string | null;
    engineEquipped: string | null;
    ammo: AmmoInventory;
  };
  tutorialSeen: boolean;
  settings: {
    soundMuted: boolean;
    volume: number;
  };
}

export const DEFAULT_SAVE_DATA: GameSaveData = {
  version: 1,
  player: {
    level: 1,
    xp: 0,
    credits: 1500,
    ore: 10,
    shipClass: 'scout',
    lasersEquipped: ['laser_t1', null, null],
    shieldEquipped: 'shield_t1',
    engineEquipped: null,
    ammo: {
      x1: 400,
      x2: 100,
      x3: 20,
      rocket: 15,
    },
  },
  tutorialSeen: false,
  settings: {
    soundMuted: false,
    volume: 0.7,
  },
};

export function loadSave(): GameSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE_DATA;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        player: { ...DEFAULT_SAVE_DATA.player, ...parsed.player },
        settings: { ...DEFAULT_SAVE_DATA.settings, ...parsed.settings },
      };
    }
  } catch (err) {
    console.warn('Failed to load save from localStorage', err);
  }
  return DEFAULT_SAVE_DATA;
}

export function saveGame(data: Partial<GameSaveData>) {
  try {
    const current = loadSave();
    const updated = { ...current, ...data };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
}

export function resetGameSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('Failed to reset save', err);
  }
}
