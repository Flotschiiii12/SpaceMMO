import { WorldState, PortalEntity, SimEvent } from '../types';
import { MAPS } from '../../data/maps';
import { PRNG } from '../rng';
import { spawnMapNpcs, generateAsteroids } from '../world';

export function updatePortals(world: WorldState, dt: number, rng: PRNG) {
  const { player, portals, events } = world;

  if (player.isDead) {
    if (world.portalChannel) {
      world.portalChannel = null;
      events.push({ type: 'PORTAL_CANCELLED' });
    }
    return;
  }

  // Check if player is near any portal
  let activePortal: PortalEntity | null = null;
  for (const portal of portals) {
    const dist = Math.hypot(player.x - portal.x, player.y - portal.y);
    if (dist <= portal.radius) {
      activePortal = portal;
      break;
    }
  }

  if (activePortal) {
    // Check if player took damage in the last tick
    const recentlyDamaged = world.events.some(
      (e) => e.type === 'DAMAGE_DEALT' && e.targetId === player.id
    );

    if (recentlyDamaged) {
      if (world.portalChannel) {
        world.portalChannel = null;
        events.push({ type: 'PORTAL_CANCELLED' });
      }
      return;
    }

    if (!world.portalChannel || world.portalChannel.portalId !== activePortal.id) {
      world.portalChannel = {
        portalId: activePortal.id,
        timer: 0,
        totalTime: 3.0,
        interrupted: false,
      };
    } else {
      world.portalChannel.timer += dt;
      events.push({
        type: 'PORTAL_CHANNELING',
        progress: Math.min(1.0, world.portalChannel.timer / world.portalChannel.totalTime),
        portalName: activePortal.name,
      });

      if (world.portalChannel.timer >= world.portalChannel.totalTime) {
        // Complete jump
        const targetMapId = activePortal.targetMapId;
        const targetX = activePortal.targetX;
        const targetY = activePortal.targetY;
        const prevMapId = world.mapId;

        // Reset channel
        world.portalChannel = null;

        jumpToMap(world, targetMapId, targetX, targetY, rng);

        events.push({
          type: 'MAP_JUMPED',
          fromMap: prevMapId,
          toMap: targetMapId,
        });
      }
    }
  } else {
    // Left portal area
    if (world.portalChannel) {
      world.portalChannel = null;
      events.push({ type: 'PORTAL_CANCELLED' });
    }
  }
}

export function jumpToMap(
  world: WorldState,
  targetMapId: string,
  targetX: number,
  targetY: number,
  rng: PRNG
) {
  const mapData = MAPS[targetMapId] || MAPS.map_1;

  world.mapId = targetMapId;
  world.mapWidth = mapData.width;
  world.mapHeight = mapData.height;
  world.portals = mapData.portals;
  world.homeStation = mapData.homeStation || null;

  // Move player
  world.player.x = targetX;
  world.player.y = targetY;
  world.player.vx = 0;
  world.player.vy = 0;
  world.player.speed = 0;
  world.player.destination = null;
  world.player.targetId = null;
  world.player.isAttacking = false;
  world.player.invulnerableTimer = 2.0; // short protection upon arrival

  // Refresh world asteroids & NPCs for this sector
  world.asteroids = generateAsteroids(mapData.asteroidCount, mapData.width, mapData.height, rng);
  world.npcs = spawnMapNpcs(targetMapId, rng);
  world.projectiles = [];
  world.lootBoxes = [];
}
