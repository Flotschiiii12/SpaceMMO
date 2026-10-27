import { LaserSlotItem, ShieldSlotItem, EngineSlotItem, AmmoType } from '../sim/types';

export const LASER_ITEMS: Record<string, LaserSlotItem> = {
  laser_t1: {
    id: 'laser_t1',
    name: 'Pulse Laser Mk I',
    tier: 1,
    damage: 65,
    fireRate: 1.0,
    range: 600,
    color: '#ff8a1f', // Signal Orange
    costCredits: 2000,
    costOre: 10,
  },
  laser_t2: {
    id: 'laser_t2',
    name: 'Plasma Beam Mk II',
    tier: 2,
    damage: 140,
    fireRate: 1.0,
    range: 620,
    color: '#2dd4bf', // Teal/Cyan
    costCredits: 12000,
    costOre: 60,
  },
  laser_t3: {
    id: 'laser_t3',
    name: 'Void Lance Mk III',
    tier: 3,
    damage: 280,
    fireRate: 1.0,
    range: 650,
    color: '#f43f5e', // Rose Red
    costCredits: 48000,
    costOre: 220,
  },
};

export const SHIELD_ITEMS: Record<string, ShieldSlotItem> = {
  shield_t1: {
    id: 'shield_t1',
    name: 'Deflector Array I',
    tier: 1,
    capacity: 400,
    regenRate: 35,
    costCredits: 2500,
    costOre: 15,
  },
  shield_t2: {
    id: 'shield_t2',
    name: 'Phase Shield II',
    tier: 2,
    capacity: 1000,
    regenRate: 85,
    costCredits: 15000,
    costOre: 75,
  },
  shield_t3: {
    id: 'shield_t3',
    name: 'Aegis Field III',
    tier: 3,
    capacity: 2400,
    regenRate: 180,
    costCredits: 55000,
    costOre: 260,
  },
};

export const ENGINE_ITEMS: Record<string, EngineSlotItem> = {
  engine_t1: {
    id: 'engine_t1',
    name: 'Ion Thruster I',
    tier: 1,
    speedBonus: 40,
    turnBonus: 0.4,
    costCredits: 1800,
    costOre: 10,
  },
  engine_t2: {
    id: 'engine_t2',
    name: 'Fusion Drive II',
    tier: 2,
    speedBonus: 90,
    turnBonus: 0.9,
    costCredits: 10000,
    costOre: 50,
  },
  engine_t3: {
    id: 'engine_t3',
    name: 'Warp Vector III',
    tier: 3,
    speedBonus: 160,
    turnBonus: 1.5,
    costCredits: 40000,
    costOre: 180,
  },
};

export interface AmmoShopOption {
  type: 'x1' | 'x2' | 'x3' | 'rocket';
  name: string;
  count: number;
  costCredits: number;
  costOre: number;
  multiplier: number;
  ammoCostPerShot: number;
  description: string;
}

export const AMMO_OPTIONS: AmmoShopOption[] = [
  {
    type: 'x1',
    name: 'Standard Slug (x1)',
    count: 200,
    costCredits: 200,
    costOre: 0,
    multiplier: 1.0,
    ammoCostPerShot: 1,
    description: 'Reliable military-grade solid ammunition. Standard baseline damage.',
  },
  {
    type: 'x2',
    name: 'Hyper-Dense Round (x2)',
    count: 100,
    costCredits: 500,
    costOre: 2,
    multiplier: 2.0,
    ammoCostPerShot: 2,
    description: 'Double kinetic payload. Consumes 2 cartridges per laser burst.',
  },
  {
    type: 'x3',
    name: 'Antimatter Core (x3)',
    count: 50,
    costCredits: 1200,
    costOre: 6,
    multiplier: 3.0,
    ammoCostPerShot: 3,
    description: 'Devastating unstable payload. Delivers triple baseline damage.',
  },
  {
    type: 'rocket',
    name: 'Homing Torpedo Pod',
    count: 20,
    costCredits: 800,
    costOre: 4,
    multiplier: 1.0,
    ammoCostPerShot: 1,
    description: 'Self-guided micro-torpedoes. 900 range, homing guidance, 4s cooldown.',
  },
];

export const AMMO_DAMAGE_MULTIPLIER: Record<AmmoType, number> = {
  basic: 0.45, // fallback when out of ammo
  x1: 1.0,
  x2: 2.0,
  x3: 3.0,
};

export const AMMO_COST_PER_SHOT: Record<AmmoType, number> = {
  basic: 0,
  x1: 1,
  x2: 2,
  x3: 3,
};

export const ROCKET_BASE_DAMAGE = 350;
export const ROCKET_RANGE = 900;
export const ROCKET_COOLDOWN = 4.0;
export const ROCKET_SPEED = 520;
export const ROCKET_HOMING_DURATION = 1.5;
