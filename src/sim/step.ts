import { WorldState, GameCommand, SimEvent } from './types';
import { PRNG } from './rng';
import { ProjectilePool } from './pool';
import { updateShipMovement } from './systems/movement';
import { updateAi } from './systems/ai';
import { updateCombat, firePlayerRocket } from './systems/combat';
import { updateLoot, handleNpcDeathLootAndXp } from './systems/loot';
import { updatePortals, jumpToMap } from './systems/portals';
import { recomputePlayerStats } from './systems/progression';
import { SHIPS } from '../data/ships';
import { LASER_ITEMS, SHIELD_ITEMS, ENGINE_ITEMS, AMMO_OPTIONS } from '../data/items';

export function step(
  world: WorldState,
  dt: number,
  commands: GameCommand[],
  rng: PRNG,
  projectilePool: ProjectilePool
): SimEvent[] {
  // Clear previous frame events
  world.events = [];

  // Update move marker visual timer
  if (world.moveMarker) {
    world.moveMarker.timer += dt;
    if (world.moveMarker.timer > 1.2) {
      world.moveMarker = null;
    }
  }

  // 1. Process player commands
  for (const cmd of commands) {
    processCommand(cmd, world, projectilePool, rng);
  }

  // 2. Player death handling & countdown
  if (world.player.isDead) {
    world.player.deathTimer = Math.max(0, world.player.deathTimer - dt);
    if (world.player.deathTimer <= 0) {
      respawnPlayerAtHomeStation(world, rng);
    }
  } else {
    // 3. Movement
    updateShipMovement(world.player, dt, world.mapWidth, world.mapHeight);
  }

  // 4. Update AI
  updateAi(world, dt, rng, projectilePool);

  // 5. Update Combat
  updateCombat(world, dt, projectilePool);

  // 6. Check for newly dead NPCs to spawn loot and award XP
  for (const npc of world.npcs) {
    if (npc.isDead && npc.deathTimer === 0) {
      npc.deathTimer = 1; // mark that loot has been spawned for this death
      handleNpcDeathLootAndXp(npc, world, rng);
    }
  }

  // 7. Update Loot
  updateLoot(world, dt);

  // 8. Update Portals
  updatePortals(world, dt, rng);

  world.tick++;
  return world.events;
}

function processCommand(
  cmd: GameCommand,
  world: WorldState,
  projectilePool: ProjectilePool,
  rng: PRNG
) {
  const { player } = world;

  switch (cmd.type) {
    case 'MOVE_TO':
      if (!player.isDead) {
        player.destination = { x: cmd.x, y: cmd.y };
        world.moveMarker = { x: cmd.x, y: cmd.y, timer: 0 };
      }
      break;

    case 'SET_TARGET':
      player.targetId = cmd.targetId;
      if (!cmd.targetId) {
        player.isAttacking = false;
      }
      break;

    case 'TOGGLE_ATTACK':
      if (!player.isDead && !player.inSafeZone) {
        if (player.targetId) {
          player.isAttacking = !player.isAttacking;
        } else {
          // Find closest NPC within 600 range to auto-lock
          const closest = findClosestNpc(world, player.x, player.y, 600);
          if (closest) {
            player.targetId = closest.id;
            player.isAttacking = true;
          }
        }
      }
      break;

    case 'FIRE_ROCKET':
      firePlayerRocket(world, projectilePool);
      break;

    case 'SELECT_AMMO':
      player.activeAmmo = cmd.ammoType;
      break;

    case 'REPAIR_SHIP':
      if (player.inSafeZone && !player.isDead) {
        player.hull = player.maxHull;
        player.shield = player.maxShield;
        world.events.push({
          type: 'REPAIR_COMPLETED',
          hullRepaired: player.maxHull,
        });
      }
      break;

    case 'BUY_SHIP': {
      const shipDef = SHIPS[cmd.shipId];
      if (shipDef && player.inSafeZone) {
        if (player.credits >= shipDef.costCredits && player.ore >= shipDef.costOre) {
          player.credits -= shipDef.costCredits;
          player.ore -= shipDef.costOre;
          player.shipClass = cmd.shipId;
          // Ensure laser slots fit
          while (player.lasersEquipped.length < shipDef.laserSlots) {
            player.lasersEquipped.push(null);
          }
          if (player.lasersEquipped.length > shipDef.laserSlots) {
            player.lasersEquipped = player.lasersEquipped.slice(0, shipDef.laserSlots);
          }
          recomputePlayerStats(player);
        }
      }
      break;
    }

    case 'EQUIP_SHIP': {
      const shipDef = SHIPS[cmd.shipId];
      if (shipDef && player.inSafeZone) {
        player.shipClass = cmd.shipId;
        while (player.lasersEquipped.length < shipDef.laserSlots) {
          player.lasersEquipped.push(null);
        }
        if (player.lasersEquipped.length > shipDef.laserSlots) {
          player.lasersEquipped = player.lasersEquipped.slice(0, shipDef.laserSlots);
        }
        recomputePlayerStats(player);
      }
      break;
    }

    case 'BUY_ITEM': {
      if (!player.inSafeZone) break;
      const laser = LASER_ITEMS[cmd.itemId];
      const shield = SHIELD_ITEMS[cmd.itemId];
      const engine = ENGINE_ITEMS[cmd.itemId];
      const item = laser || shield || engine;
      if (item && player.credits >= item.costCredits && player.ore >= item.costOre) {
        player.credits -= item.costCredits;
        player.ore -= item.costOre;
        // Auto-equip if slot is empty or replace
        if (laser) {
          const emptyIdx = player.lasersEquipped.findIndex((slot) => slot === null);
          if (emptyIdx !== -1) {
            player.lasersEquipped[emptyIdx] = laser.id;
          } else {
            player.lasersEquipped[0] = laser.id;
          }
        } else if (shield) {
          player.shieldEquipped = shield.id;
        } else if (engine) {
          player.engineEquipped = engine.id;
        }
        recomputePlayerStats(player);
      }
      break;
    }

    case 'EQUIP_ITEM': {
      if (!player.inSafeZone) break;
      if (cmd.slotType === 'laser') {
        if (cmd.slotIndex >= 0 && cmd.slotIndex < player.lasersEquipped.length) {
          player.lasersEquipped[cmd.slotIndex] = cmd.itemId;
        }
      } else if (cmd.slotType === 'shield') {
        player.shieldEquipped = cmd.itemId;
      } else if (cmd.slotType === 'engine') {
        player.engineEquipped = cmd.itemId;
      }
      recomputePlayerStats(player);
      break;
    }

    case 'BUY_AMMO': {
      if (!player.inSafeZone) break;
      const option = AMMO_OPTIONS.find((o) => o.type === cmd.ammoType);
      if (option && player.credits >= option.costCredits && player.ore >= option.costOre) {
        player.credits -= option.costCredits;
        player.ore -= option.costOre;
        player.ammo[cmd.ammoType] += option.count;
      }
      break;
    }

    case 'RESPAWN_PLAYER':
      respawnPlayerAtHomeStation(world, rng);
      break;

    case 'SET_MAP':
      jumpToMap(world, cmd.mapId, cmd.spawnX, cmd.spawnY, rng);
      break;
  }
}

function findClosestNpc(world: WorldState, x: number, y: number, maxDist: number) {
  let closest = null;
  let minDist = maxDist;
  for (const npc of world.npcs) {
    if (npc.isDead) continue;
    const dist = Math.hypot(npc.x - x, npc.y - y);
    if (dist < minDist) {
      minDist = dist;
      closest = npc;
    }
  }
  return closest;
}

export function respawnPlayerAtHomeStation(world: WorldState, rng: PRNG) {
  const { player } = world;
  const lostCredits = Math.round(player.credits * 0.1);
  player.credits = Math.max(0, player.credits - lostCredits);

  // Jump to Sector 1 Cradle station if not already there
  if (world.mapId !== 'map_1') {
    jumpToMap(world, 'map_1', 3000, 1800, rng);
  } else {
    player.x = 3000;
    player.y = 1800;
  }

  player.vx = 0;
  player.vy = 0;
  player.speed = 0;
  player.destination = null;
  player.targetId = null;
  player.isAttacking = false;
  player.isDead = false;
  player.deathTimer = 0;
  player.hull = player.maxHull;
  player.shield = player.maxShield;
  player.invulnerableTimer = 3.0; // 3 seconds invulnerability

  world.events.push({
    type: 'PLAYER_RESPAWNED',
    creditsLost: lostCredits,
  });
}
