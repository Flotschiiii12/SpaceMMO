import { ShipEntity, ShipClass } from '../types';
import { SHIPS } from '../../data/ships';
import { LASER_ITEMS, SHIELD_ITEMS, ENGINE_ITEMS } from '../../data/items';

export const LEVEL_CAP = 30;

export function getXpRequiredForLevel(level: number): number {
  if (level >= LEVEL_CAP) return Infinity;
  return Math.floor(120 * Math.pow(1.22, level - 1));
}

/**
 * Recomputes player derived stats from ship chassis, equipped items, and level bonuses
 */
export function recomputePlayerStats(player: ShipEntity) {
  const baseChassis = SHIPS[player.shipClass] || SHIPS.scout;
  const levelBonusHull = (player.level - 1) * 60;
  const levelBonusShield = (player.level - 1) * 45;

  let extraShieldCapacity = 0;
  let extraRegenRate = 0;
  if (player.shieldEquipped && SHIELD_ITEMS[player.shieldEquipped]) {
    const shieldItem = SHIELD_ITEMS[player.shieldEquipped];
    extraShieldCapacity = shieldItem.capacity;
    extraRegenRate = shieldItem.regenRate;
  }

  let extraSpeed = 0;
  let extraTurn = 0;
  if (player.engineEquipped && ENGINE_ITEMS[player.engineEquipped]) {
    const engineItem = ENGINE_ITEMS[player.engineEquipped];
    extraSpeed = engineItem.speedBonus;
    extraTurn = engineItem.turnBonus;
  }

  const prevMaxHull = player.maxHull || baseChassis.hull;
  const prevMaxShield = player.maxShield || baseChassis.shield;

  player.maxHull = baseChassis.hull + levelBonusHull;
  player.maxShield = baseChassis.shield + levelBonusShield + extraShieldCapacity;
  player.shieldRegenRate = 30 + extraRegenRate; // base 30/s
  player.maxSpeed = baseChassis.maxSpeed + extraSpeed;
  player.turnRate = baseChassis.turnRate + extraTurn;

  // Maintain health/shield percentage on stat upgrade if already set
  if (prevMaxHull > 0 && player.hull > 0) {
    player.hull = Math.min(player.maxHull, Math.round(player.hull * (player.maxHull / prevMaxHull)));
  } else {
    player.hull = player.maxHull;
  }

  if (prevMaxShield > 0 && player.shield > 0) {
    player.shield = Math.min(player.maxShield, Math.round(player.shield * (player.maxShield / prevMaxShield)));
  } else {
    player.shield = player.maxShield;
  }
}
