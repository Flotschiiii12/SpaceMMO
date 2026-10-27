import { WorldState, ShipEntity, NpcType } from '../types';
import { PRNG } from '../rng';
import { ProjectilePool } from '../pool';
import { updateShipMovement } from './movement';
import { fireWardenRocketSpread } from './combat';
import { createNpc } from '../world';
import { MAPS } from '../../data/maps';

export function updateAi(world: WorldState, dt: number, rng: PRNG, projectilePool: ProjectilePool) {
  const { player, npcs, mapWidth, mapHeight, mapId } = world;
  const mapData = MAPS[mapId] || MAPS.map_1;

  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];

    // Handle dead NPCs and respawn timers
    if (npc.isDead) {
      npc.respawnTimer = (npc.respawnTimer || 0) + dt;
      const respawnTarget = npc.npcType === 'warden' ? 300.0 : 25.0; // Warden: 5 mins, normal: 25s

      if (npc.respawnTimer >= respawnTarget) {
        // Respawn NPC
        const fresh = createNpc(
          npc.id,
          npc.npcType || 'drifter',
          npc.level,
          mapData,
          rng,
          npc.npcType === 'warden' ? npc.baseSpawnX : undefined,
          npc.npcType === 'warden' ? npc.baseSpawnY : undefined
        );
        npcs[i] = fresh;
      }
      continue;
    }

    const distToPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);
    const playerInSafeZone = player.inSafeZone || player.isDead || player.invulnerableTimer > 0;

    switch (npc.npcType) {
      case 'drifter':
        updateDrifter(npc, player, distToPlayer, playerInSafeZone, dt, rng);
        break;
      case 'raider':
        updateRaider(npc, player, distToPlayer, playerInSafeZone, dt, rng);
        break;
      case 'sniper':
        updateSniper(npc, player, distToPlayer, playerInSafeZone, dt, rng);
        break;
      case 'warden':
        updateWarden(npc, player, distToPlayer, playerInSafeZone, dt, rng, world, projectilePool);
        break;
    }

    // Apply movement physics
    updateShipMovement(npc, dt, mapWidth, mapHeight);
  }
}

function updateDrifter(
  npc: ShipEntity,
  player: ShipEntity,
  distToPlayer: number,
  playerInSafeZone: boolean,
  dt: number,
  rng: PRNG
) {
  // If provoked into fighting
  if (npc.targetId === 'player') {
    if (playerInSafeZone || distToPlayer > 850) {
      npc.targetId = null;
      npc.destination = null;
      npc.npcState = 'idle';
      return;
    }

    // Chase to attack range
    if (distToPlayer > 380) {
      npc.destination = { x: player.x, y: player.y };
    } else {
      npc.destination = null;
      // Face player
      npc.targetRotation = Math.atan2(player.y - npc.y, player.x - npc.x);
    }
    return;
  }

  // Passive wandering / patrol
  npc.patrolWaitTimer = (npc.patrolWaitTimer || 0) - dt;
  if (npc.patrolWaitTimer <= 0) {
    npc.patrolWaitTimer = rng.range(3, 7);
    const wanderDist = rng.range(150, 450);
    const wanderAngle = rng.range(0, Math.PI * 2);
    const originX = npc.baseSpawnX ?? npc.x;
    const originY = npc.baseSpawnY ?? npc.y;
    npc.destination = {
      x: originX + Math.cos(wanderAngle) * wanderDist,
      y: originY + Math.sin(wanderAngle) * wanderDist,
    };
  }
}

function updateRaider(
  npc: ShipEntity,
  player: ShipEntity,
  distToPlayer: number,
  playerInSafeZone: boolean,
  dt: number,
  rng: PRNG
) {
  const aggroRange = npc.aggroRange || 500;

  if (!playerInSafeZone && distToPlayer <= aggroRange) {
    npc.targetId = 'player';
    npc.npcState = 'chase';

    if (distToPlayer > 360) {
      npc.destination = { x: player.x, y: player.y };
    } else if (distToPlayer < 240) {
      // Back off slightly
      const awayAngle = Math.atan2(npc.y - player.y, npc.x - player.x);
      npc.destination = {
        x: npc.x + Math.cos(awayAngle) * 120,
        y: npc.y + Math.sin(awayAngle) * 120,
      };
    } else {
      // Circle or hold position
      npc.destination = null;
      npc.targetRotation = Math.atan2(player.y - npc.y, player.x - npc.x);
    }
  } else if (distToPlayer > 900 || playerInSafeZone) {
    // Drop aggro, return to base
    npc.targetId = null;
    npc.npcState = 'return';
    if (npc.baseSpawnX !== undefined && npc.baseSpawnY !== undefined) {
      npc.destination = { x: npc.baseSpawnX, y: npc.baseSpawnY };
    }
  } else if (!npc.destination) {
    // Wander slowly
    npc.patrolWaitTimer = (npc.patrolWaitTimer || 0) - dt;
    if (npc.patrolWaitTimer <= 0) {
      npc.patrolWaitTimer = rng.range(4, 8);
      const angle = rng.range(0, Math.PI * 2);
      const dist = rng.range(120, 300);
      npc.destination = {
        x: (npc.baseSpawnX ?? npc.x) + Math.cos(angle) * dist,
        y: (npc.baseSpawnY ?? npc.y) + Math.sin(angle) * dist,
      };
    }
  }
}

function updateSniper(
  npc: ShipEntity,
  player: ShipEntity,
  distToPlayer: number,
  playerInSafeZone: boolean,
  dt: number,
  rng: PRNG
) {
  const aggroRange = npc.aggroRange || 750;
  const isHullLow = npc.hull < npc.maxHull * 0.3;

  if (isHullLow) {
    // Flee away from player
    npc.npcState = 'flee';
    const awayAngle = Math.atan2(npc.y - player.y, npc.x - player.x);
    npc.destination = {
      x: npc.x + Math.cos(awayAngle) * 400,
      y: npc.y + Math.sin(awayAngle) * 400,
    };
    return;
  }

  if (!playerInSafeZone && distToPlayer <= aggroRange) {
    npc.targetId = 'player';
    npc.npcState = 'chase';

    if (distToPlayer > 730) {
      // Close in to sniper range
      npc.destination = { x: player.x, y: player.y };
    } else if (distToPlayer < 580) {
      // Kite away to maintain ~700 distance
      const awayAngle = Math.atan2(npc.y - player.y, npc.x - player.x);
      npc.destination = {
        x: npc.x + Math.cos(awayAngle) * 200,
        y: npc.y + Math.sin(awayAngle) * 200,
      };
    } else {
      npc.destination = null;
      npc.targetRotation = Math.atan2(player.y - npc.y, player.x - npc.x);
    }
  } else if (distToPlayer > 1100 || playerInSafeZone) {
    npc.targetId = null;
    npc.npcState = 'return';
    if (npc.baseSpawnX !== undefined && npc.baseSpawnY !== undefined) {
      npc.destination = { x: npc.baseSpawnX, y: npc.baseSpawnY };
    }
  }
}

function updateWarden(
  npc: ShipEntity,
  player: ShipEntity,
  distToPlayer: number,
  playerInSafeZone: boolean,
  dt: number,
  rng: PRNG,
  world: WorldState,
  projectilePool: ProjectilePool
) {
  const aggroRange = npc.aggroRange || 800;

  // Boss phases check
  const hpRatio = npc.hull / npc.maxHull;

  // Phase 2: at <= 66% HP summon Drifter escorts
  if (hpRatio <= 0.66 && !npc.bossMinionsSpawned) {
    npc.bossMinionsSpawned = true;
    npc.bossPhase = 2;
    const mapData = MAPS[world.mapId] || MAPS.map_1;
    // Spawn 3 escort Drifters
    for (let k = 0; k < 3; k++) {
      const escort = createNpc(`minion_${Date.now()}_${k}`, 'drifter', Math.max(1, npc.level - 2), mapData, rng, npc.x + rng.range(-100, 100), npc.y + rng.range(-100, 100));
      escort.targetId = 'player';
      escort.npcState = 'aggro';
      world.npcs.push(escort);
    }
  }

  // Phase 3: at <= 33% HP fire rocket spread
  if (hpRatio <= 0.33 && !npc.bossRocketsSpreadFired && !playerInSafeZone) {
    npc.bossRocketsSpreadFired = true;
    npc.bossPhase = 3;
    fireWardenRocketSpread(npc, player, world, projectilePool);
  }

  if (!playerInSafeZone && distToPlayer <= aggroRange) {
    npc.targetId = 'player';
    if (distToPlayer > 480) {
      npc.destination = { x: player.x, y: player.y };
    } else {
      npc.destination = null;
      npc.targetRotation = Math.atan2(player.y - npc.y, player.x - npc.x);
    }
  } else if (distToPlayer > 1200 || playerInSafeZone) {
    npc.targetId = null;
    if (npc.baseSpawnX !== undefined && npc.baseSpawnY !== undefined) {
      npc.destination = { x: npc.baseSpawnX, y: npc.baseSpawnY };
    }
  }
}
