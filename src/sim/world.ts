import { WorldState, ShipEntity, MapData, AsteroidEntity, NpcType } from './types';
import { MAPS } from '../data/maps';
import { SHIPS } from '../data/ships';
import { calculateNpcStats } from '../data/npcs';
import { PRNG } from './rng';
import { getXpRequiredForLevel, recomputePlayerStats } from './systems/progression';

export function createInitialPlayer(): ShipEntity {
  const player: ShipEntity = {
    id: 'player',
    name: 'Commander',
    x: 3000,
    y: 1800,
    vx: 0,
    vy: 0,
    rotation: -Math.PI / 2,
    targetRotation: -Math.PI / 2,
    destination: null,
    speed: 0,
    maxSpeed: SHIPS.scout.maxSpeed,
    turnRate: SHIPS.scout.turnRate,
    hull: SHIPS.scout.hull,
    maxHull: SHIPS.scout.hull,
    shield: SHIPS.scout.shield,
    maxShield: SHIPS.scout.shield,
    shieldRegenTimer: 8.0,
    shieldRegenRate: 30,
    targetId: null,
    isAttacking: false,
    laserCooldown: 0,
    rocketCooldown: 0,
    activeAmmo: 'x1',
    ammo: {
      x1: 400,
      x2: 100,
      x3: 20,
      rocket: 15,
    },
    shipClass: 'scout',
    lasersEquipped: ['laser_t1', null, null],
    shieldEquipped: 'shield_t1',
    engineEquipped: null,
    invulnerableTimer: 0,
    isPlayer: true,
    isDead: false,
    deathTimer: 0,
    inSafeZone: true,
    level: 1,
    xp: 0,
    xpToNext: getXpRequiredForLevel(1),
    credits: 1500,
    ore: 10,
  };

  recomputePlayerStats(player);
  return player;
}

export function generateAsteroids(count: number, width: number, height: number, rng: PRNG): AsteroidEntity[] {
  const asteroids: AsteroidEntity[] = [];
  for (let i = 0; i < count; i++) {
    const radius = rng.range(28, 70);
    const numPoints = rng.int(7, 11);
    const points: { x: number; y: number }[] = [];
    for (let p = 0; p < numPoints; p++) {
      const angle = (p / numPoints) * Math.PI * 2;
      const r = radius * rng.range(0.72, 1.25);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    asteroids.push({
      id: `asteroid_${i}`,
      x: rng.range(200, width - 200),
      y: rng.range(200, height - 200),
      radius,
      rotation: rng.range(0, Math.PI * 2),
      points,
    });
  }
  return asteroids;
}

export function spawnMapNpcs(mapId: string, rng: PRNG): ShipEntity[] {
  const npcs: ShipEntity[] = [];
  const mapData = MAPS[mapId];
  if (!mapData) return npcs;

  let npcId = 1;

  if (mapId === 'map_1') {
    // Cradle: Drifters (lvl 1-3) and a few Raiders (lvl 2-4), ~25 total
    for (let i = 0; i < 18; i++) {
      const level = rng.int(1, 3);
      npcs.push(createNpc(`npc_${npcId++}`, 'drifter', level, mapData, rng));
    }
    for (let i = 0; i < 7; i++) {
      const level = rng.int(2, 4);
      npcs.push(createNpc(`npc_${npcId++}`, 'raider', level, mapData, rng));
    }
  } else if (mapId === 'map_2') {
    // Slagfield: Raiders (lvl 3-8), Snipers (lvl 6-8), one Warden (lvl 8)
    for (let i = 0; i < 14; i++) {
      const level = rng.int(3, 8);
      npcs.push(createNpc(`npc_${npcId++}`, 'raider', level, mapData, rng));
    }
    for (let i = 0; i < 10; i++) {
      const level = rng.int(6, 8);
      npcs.push(createNpc(`npc_${npcId++}`, 'sniper', level, mapData, rng));
    }
    // Boss: Warden
    npcs.push(createNpc(`npc_${npcId++}`, 'warden', 8, mapData, rng, 3000, 1800));
  } else if (mapId === 'map_3') {
    // Ember Reach: Snipers (lvl 8-12), strong Raiders (lvl 8-12), one Warden (lvl 12)
    for (let i = 0; i < 12; i++) {
      const level = rng.int(8, 12);
      npcs.push(createNpc(`npc_${npcId++}`, 'raider', level, mapData, rng));
    }
    for (let i = 0; i < 12; i++) {
      const level = rng.int(9, 13);
      npcs.push(createNpc(`npc_${npcId++}`, 'sniper', level, mapData, rng));
    }
    // Boss: Warden
    npcs.push(createNpc(`npc_${npcId++}`, 'warden', 14, mapData, rng, 3000, 1800));
  }

  return npcs;
}

export function createNpc(
  id: string,
  type: NpcType,
  level: number,
  mapData: MapData,
  rng: PRNG,
  overrideX?: number,
  overrideY?: number
): ShipEntity {
  const stats = calculateNpcStats(type, level);

  let x = overrideX ?? rng.range(300, mapData.width - 300);
  let y = overrideY ?? rng.range(300, mapData.height - 300);

  // If in map_1, don't spawn inside the safe zone radius (450)
  if (mapData.homeStation && !overrideX) {
    const dist = Math.hypot(x - mapData.homeStation.x, y - mapData.homeStation.y);
    if (dist < mapData.homeStation.radius + 150) {
      // push out
      const angle = rng.range(0, Math.PI * 2);
      x = mapData.homeStation.x + Math.cos(angle) * (mapData.homeStation.radius + 300);
      y = mapData.homeStation.y + Math.sin(angle) * (mapData.homeStation.radius + 300);
    }
  }

  const rot = rng.range(0, Math.PI * 2);

  return {
    id,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} [T-${level}]`,
    x,
    y,
    vx: 0,
    vy: 0,
    rotation: rot,
    targetRotation: rot,
    destination: null,
    speed: 0,
    maxSpeed: stats.speed,
    turnRate: stats.turnRate,
    hull: stats.hull,
    maxHull: stats.hull,
    shield: stats.shield,
    maxShield: stats.shield,
    shieldRegenTimer: 8.0,
    shieldRegenRate: Math.max(15, Math.round(stats.shield * 0.04)),
    targetId: null,
    isAttacking: false,
    laserCooldown: rng.range(0, 0.5),
    rocketCooldown: rng.range(0, 3.0),
    activeAmmo: 'x1',
    ammo: { x1: 9999, x2: 0, x3: 0, rocket: type === 'warden' ? 99 : 0 },
    shipClass: type === 'warden' ? 'bulwark' : type === 'sniper' ? 'corsair' : 'scout',
    lasersEquipped: ['laser_t1'],
    shieldEquipped: null,
    engineEquipped: null,
    invulnerableTimer: 0,
    isPlayer: false,
    isDead: false,
    deathTimer: 0,
    inSafeZone: false,
    level,
    xp: 0,
    xpToNext: 0,
    credits: stats.credits,
    ore: stats.ore,
    npcType: type,
    npcState: 'idle',
    baseSpawnX: x,
    baseSpawnY: y,
    patrolTarget: null,
    patrolWaitTimer: rng.range(1, 4),
    aggroRange: stats.aggroRange,
    attackRange: stats.attackRange,
    bossPhase: 1,
    bossMinionsSpawned: false,
    bossRocketsSpreadFired: false,
    fleeTimer: 0,
    respawnTimer: 0,
    xpReward: stats.xp,
    creditsReward: stats.credits,
    oreReward: stats.ore,
  };
}

export function createWorld(mapId = 'map_1', rng = new PRNG(42), existingPlayer?: ShipEntity): WorldState {
  const mapData = MAPS[mapId] || MAPS.map_1;
  const player = existingPlayer || createInitialPlayer();

  const asteroids = generateAsteroids(mapData.asteroidCount, mapData.width, mapData.height, rng);
  const npcs = spawnMapNpcs(mapId, rng);

  return {
    tick: 0,
    mapId,
    mapWidth: mapData.width,
    mapHeight: mapData.height,
    player,
    npcs,
    projectiles: [],
    lootBoxes: [],
    portals: mapData.portals,
    homeStation: mapData.homeStation || null,
    asteroids,
    portalChannel: null,
    moveMarker: null,
    events: [],
  };
}
