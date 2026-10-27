import { NpcType } from '../sim/types';

export interface NpcArchetype {
  type: NpcType;
  name: string;
  baseHull: number;
  baseShield: number;
  baseSpeed: number;
  turnRate: number;
  baseDamage: number;
  attackRange: number;
  aggroRange: number;
  fireInterval: number;
  creditsMin: number;
  creditsMax: number;
  oreMin: number;
  oreMax: number;
  baseXp: number;
  description: string;
}

export const NPC_ARCHETYPES: Record<NpcType, NpcArchetype> = {
  drifter: {
    type: 'drifter',
    name: 'Scrap Drifter',
    baseHull: 320,
    baseShield: 180,
    baseSpeed: 170,
    turnRate: 2.2,
    baseDamage: 28,
    attackRange: 500,
    aggroRange: 0, // passive unless attacked
    fireInterval: 1.2,
    creditsMin: 45,
    creditsMax: 110,
    oreMin: 0,
    oreMax: 1,
    baseXp: 40,
    description: 'Automated derelict scavenger drone. Neutral until provoked.',
  },
  raider: {
    type: 'raider',
    name: 'Rust Corsair Raider',
    baseHull: 750,
    baseShield: 550,
    baseSpeed: 230,
    turnRate: 3.0,
    baseDamage: 55,
    attackRange: 450,
    aggroRange: 500,
    fireInterval: 1.0,
    creditsMin: 140,
    creditsMax: 320,
    oreMin: 1,
    oreMax: 4,
    baseXp: 110,
    description: 'Aggressive bandit skiff that prowls high-traffic extraction corridors.',
  },
  sniper: {
    type: 'sniper',
    name: 'Ghostline Sniper',
    baseHull: 500,
    baseShield: 350,
    baseSpeed: 260,
    turnRate: 3.4,
    baseDamage: 125,
    attackRange: 720,
    aggroRange: 750,
    fireInterval: 1.8,
    creditsMin: 280,
    creditsMax: 550,
    oreMin: 3,
    oreMax: 8,
    baseXp: 220,
    description: 'Long-range railgun interceptor. Evades and kites close-range brawlers.',
  },
  warden: {
    type: 'warden',
    name: 'Iron Warden',
    baseHull: 9500,
    baseShield: 7000,
    baseSpeed: 130,
    turnRate: 1.5,
    baseDamage: 180,
    attackRange: 650,
    aggroRange: 800,
    fireInterval: 0.9,
    creditsMin: 6500,
    creditsMax: 12000,
    oreMin: 45,
    oreMax: 90,
    baseXp: 3500,
    description: 'Fortress-class sector enforcer. Deploys escorts and saturation missile salvos.',
  },
};

/**
 * Calculates scaled stats for an NPC given its level
 */
export function calculateNpcStats(type: NpcType, level: number) {
  const base = NPC_ARCHETYPES[type];
  // 15% increase per level above level 1
  const scale = 1 + (level - 1) * 0.16;

  return {
    hull: Math.round(base.baseHull * scale),
    shield: Math.round(base.baseShield * scale),
    damage: Math.round(base.baseDamage * (1 + (level - 1) * 0.12)),
    speed: base.baseSpeed,
    turnRate: base.turnRate,
    attackRange: base.attackRange,
    aggroRange: base.aggroRange,
    fireInterval: base.fireInterval,
    credits: Math.round((base.creditsMin + Math.random() * (base.creditsMax - base.creditsMin)) * scale),
    ore: Math.round((base.oreMin + Math.random() * (base.oreMax - base.oreMin)) * scale),
    xp: Math.round(base.baseXp * scale),
  };
}
