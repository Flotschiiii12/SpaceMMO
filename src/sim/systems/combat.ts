import { WorldState, ShipEntity, ProjectileEntity, SimEvent, AmmoType } from '../types';
import { LASER_ITEMS, AMMO_DAMAGE_MULTIPLIER, AMMO_COST_PER_SHOT, ROCKET_BASE_DAMAGE, ROCKET_RANGE, ROCKET_COOLDOWN, ROCKET_SPEED, ROCKET_HOMING_DURATION } from '../../data/items';
import { ProjectilePool } from '../pool';
import { angleDiff } from './movement';

export function applyDamageToShip(
  ship: ShipEntity,
  rawDamage: number,
  attackerId: string,
  events: SimEvent[]
): boolean {
  if (ship.isDead || ship.invulnerableTimer > 0 || ship.inSafeZone) {
    return false;
  }

  // Shield absorbs 80% while > 0, hull takes 20%
  let shieldDamage = 0;
  let hullDamage = 0;

  if (ship.shield > 0) {
    const intendedShieldDamage = rawDamage * 0.8;
    const intendedHullDamage = rawDamage * 0.2;

    if (ship.shield >= intendedShieldDamage) {
      ship.shield -= intendedShieldDamage;
      shieldDamage = intendedShieldDamage;
      hullDamage = intendedHullDamage;
    } else {
      // Shield broke on this hit
      const shieldRemaining = ship.shield;
      const overflow = intendedShieldDamage - shieldRemaining;
      ship.shield = 0;
      shieldDamage = shieldRemaining;
      hullDamage = intendedHullDamage + overflow;
    }
  } else {
    // Shield empty: hull takes 100%
    hullDamage = rawDamage;
  }

  ship.hull = Math.max(0, ship.hull - hullDamage);
  ship.shieldRegenTimer = 0; // Reset shield regen timer (requires 8s without damage)

  events.push({
    type: 'DAMAGE_DEALT',
    targetId: ship.id,
    x: ship.x,
    y: ship.y,
    shieldDamage: Math.round(shieldDamage),
    hullDamage: Math.round(hullDamage),
    isCrit: rawDamage > 180,
    isPlayerTarget: ship.isPlayer,
  });

  if (ship.hull <= 0) {
    ship.isDead = true;
    ship.deathTimer = ship.isPlayer ? 3.0 : 0;
    events.push({
      type: 'ENTITY_DIED',
      id: ship.id,
      name: ship.name,
      x: ship.x,
      y: ship.y,
      isPlayer: ship.isPlayer,
      killerId: attackerId,
    });
    return true; // died
  }

  return false;
}

export function updateCombat(
  world: WorldState,
  dt: number,
  projectilePool: ProjectilePool
) {
  const { player, npcs, projectiles, events } = world;

  // Check safe zone status for player
  if (world.homeStation) {
    const distStation = Math.hypot(player.x - world.homeStation.x, player.y - world.homeStation.y);
    player.inSafeZone = distStation <= world.homeStation.radius;
  } else {
    player.inSafeZone = false;
  }

  // Update cooldowns & timers for player
  if (player.laserCooldown > 0) player.laserCooldown = Math.max(0, player.laserCooldown - dt);
  if (player.rocketCooldown > 0) player.rocketCooldown = Math.max(0, player.rocketCooldown - dt);
  if (player.invulnerableTimer > 0) player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);

  // Shield regeneration
  updateShieldRegeneration(player, dt);

  // If in safe zone, repair hull and shield rapidly
  if (player.inSafeZone && !player.isDead) {
    if (player.hull < player.maxHull) {
      player.hull = Math.min(player.maxHull, player.hull + 120 * dt);
    }
    if (player.shield < player.maxShield) {
      player.shield = Math.min(player.maxShield, player.shield + 160 * dt);
    }
  }

  // Player attack logic
  if (player.isAttacking && !player.inSafeZone && !player.isDead && player.targetId) {
    const targetNpc = npcs.find((n) => n.id === player.targetId && !n.isDead);
    if (targetNpc) {
      const dist = Math.hypot(targetNpc.x - player.x, targetNpc.y - player.y);

      // Fire equipped lasers
      if (player.laserCooldown <= 0 && dist <= 600) {
        firePlayerLasers(player, targetNpc, world, projectilePool);
      }
    } else {
      // Target no longer valid
      player.targetId = null;
      player.isAttacking = false;
    }
  }

  // Update NPCs combat & cooldowns
  for (const npc of npcs) {
    if (npc.isDead) continue;

    if (npc.laserCooldown > 0) npc.laserCooldown = Math.max(0, npc.laserCooldown - dt);
    if (npc.rocketCooldown > 0) npc.rocketCooldown = Math.max(0, npc.rocketCooldown - dt);

    updateShieldRegeneration(npc, dt);

    // If attacking player and not in safe zone
    if (npc.targetId === 'player' && !player.isDead && !player.inSafeZone && player.invulnerableTimer <= 0) {
      const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
      const attackRange = npc.attackRange || 500;

      if (dist <= attackRange && npc.laserCooldown <= 0) {
        fireNpcLaser(npc, player, world, projectilePool);
      }
    }
  }

  // Update flying projectiles
  updateProjectiles(world, dt, projectilePool);
}

function updateShieldRegeneration(ship: ShipEntity, dt: number) {
  ship.shieldRegenTimer += dt;
  if (ship.shieldRegenTimer >= 8.0 && ship.shield < ship.maxShield) {
    ship.shield = Math.min(ship.maxShield, ship.shield + ship.shieldRegenRate * dt);
  }
}

function firePlayerLasers(
  player: ShipEntity,
  target: ShipEntity,
  world: WorldState,
  pool: ProjectilePool
) {
  // Determine ammo used
  let effectiveAmmo: AmmoType = player.activeAmmo;
  const cost = AMMO_COST_PER_SHOT[effectiveAmmo];

  if (effectiveAmmo !== 'basic') {
    const key = effectiveAmmo as keyof typeof player.ammo;
    if (player.ammo[key] < cost) {
      // Fallback to basic
      effectiveAmmo = 'basic';
    } else {
      player.ammo[key] -= cost;
    }
  }

  const multiplier = AMMO_DAMAGE_MULTIPLIER[effectiveAmmo];

  // Fire from each equipped laser slot
  let laserCount = 0;
  for (const laserId of player.lasersEquipped) {
    if (!laserId) continue;
    const laserItem = LASER_ITEMS[laserId];
    if (!laserItem) continue;

    laserCount++;
    const damage = Math.round(laserItem.damage * multiplier);
    const proj = pool.acquire();

    // Stagger slightly if multiple hardpoints
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const speed = 1400;

    proj.kind = 'laser';
    proj.ownerId = player.id;
    proj.x = player.x + Math.cos(angle) * 15;
    proj.y = player.y + Math.sin(angle) * 15;
    proj.vx = Math.cos(angle) * speed;
    proj.vy = Math.sin(angle) * speed;
    proj.rotation = angle;
    proj.targetId = target.id;
    proj.targetX = target.x;
    proj.targetY = target.y;
    proj.damage = damage;
    proj.speed = speed;
    proj.maxLifeTime = 0.55;
    proj.color = laserItem.color;
    proj.isNpc = false;

    world.projectiles.push(proj);

    world.events.push({
      type: 'LASER_FIRED',
      x: proj.x,
      y: proj.y,
      targetX: target.x,
      targetY: target.y,
      ammo: effectiveAmmo,
      isPlayer: true,
      color: laserItem.color,
    });
  }

  // Set cooldown (default 1.0s)
  player.laserCooldown = 1.0;
}

function fireNpcLaser(
  npc: ShipEntity,
  player: ShipEntity,
  world: WorldState,
  pool: ProjectilePool
) {
  const angle = Math.atan2(player.y - npc.y, player.x - npc.x);
  const speed = 1100;
  const proj = pool.acquire();

  // NPC damage
  const damage = npc.oreReward ? Math.max(25, Math.round((npc.attackRange || 500) * 0.08 + npc.level * 8)) : 25;

  proj.kind = 'laser';
  proj.ownerId = npc.id;
  proj.x = npc.x + Math.cos(angle) * 15;
  proj.y = npc.y + Math.sin(angle) * 15;
  proj.vx = Math.cos(angle) * speed;
  proj.vy = Math.sin(angle) * speed;
  proj.rotation = angle;
  proj.targetId = player.id;
  proj.targetX = player.x;
  proj.targetY = player.y;
  proj.damage = damage;
  proj.speed = speed;
  proj.maxLifeTime = 0.65;
  proj.color = '#ef4444'; // Red hostile laser
  proj.isNpc = true;

  world.projectiles.push(proj);

  npc.laserCooldown = npc.npcType === 'warden' ? 0.8 : npc.npcType === 'sniper' ? 1.8 : 1.1;

  world.events.push({
    type: 'LASER_FIRED',
    x: proj.x,
    y: proj.y,
    targetX: player.x,
    targetY: player.y,
    ammo: 'x1',
    isPlayer: false,
    color: '#ef4444',
  });
}

export function firePlayerRocket(world: WorldState, pool: ProjectilePool): boolean {
  const { player, npcs } = world;
  if (player.isDead || player.inSafeZone || !player.targetId) return false;
  if (player.rocketCooldown > 0) return false;
  if (player.ammo.rocket <= 0) return false;

  const target = npcs.find((n) => n.id === player.targetId && !n.isDead);
  if (!target) return false;

  const dist = Math.hypot(target.x - player.x, target.y - player.y);
  if (dist > ROCKET_RANGE) return false;

  // Deduct ammo & set cooldown
  player.ammo.rocket--;
  player.rocketCooldown = ROCKET_COOLDOWN;

  const angle = player.rotation;
  const proj = pool.acquire();

  proj.kind = 'rocket';
  proj.ownerId = player.id;
  proj.x = player.x;
  proj.y = player.y;
  proj.vx = Math.cos(angle) * (ROCKET_SPEED * 0.5);
  proj.vy = Math.sin(angle) * (ROCKET_SPEED * 0.5);
  proj.rotation = angle;
  proj.targetId = target.id;
  proj.damage = ROCKET_BASE_DAMAGE + (player.level - 1) * 20;
  proj.speed = ROCKET_SPEED;
  proj.maxLifeTime = 2.8;
  proj.color = '#ff8a1f';
  proj.homingTimer = ROCKET_HOMING_DURATION;
  proj.isNpc = false;

  world.projectiles.push(proj);

  world.events.push({
    type: 'ROCKET_FIRED',
    x: proj.x,
    y: proj.y,
    targetId: target.id,
    isPlayer: true,
  });

  return true;
}

export function fireWardenRocketSpread(warden: ShipEntity, player: ShipEntity, world: WorldState, pool: ProjectilePool) {
  const baseAngle = Math.atan2(player.y - warden.y, player.x - warden.y);
  const angles = [-0.35, -0.12, 0.12, 0.35];

  for (const offset of angles) {
    const angle = baseAngle + offset;
    const proj = pool.acquire();

    proj.kind = 'rocket';
    proj.ownerId = warden.id;
    proj.x = warden.x + Math.cos(angle) * 30;
    proj.y = warden.y + Math.sin(angle) * 30;
    proj.vx = Math.cos(angle) * (ROCKET_SPEED * 0.5);
    proj.vy = Math.sin(angle) * (ROCKET_SPEED * 0.5);
    proj.rotation = angle;
    proj.targetId = player.id;
    proj.damage = 180;
    proj.speed = ROCKET_SPEED * 0.9;
    proj.maxLifeTime = 2.5;
    proj.color = '#dc2626';
    proj.homingTimer = 1.2;
    proj.isNpc = true;

    world.projectiles.push(proj);
  }

  world.events.push({
    type: 'ROCKET_FIRED',
    x: warden.x,
    y: warden.y,
    targetId: player.id,
    isPlayer: false,
  });
}

function updateProjectiles(world: WorldState, dt: number, pool: ProjectilePool) {
  const { projectiles, player, npcs, events } = world;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.lifeTime += dt;

    if (p.lifeTime >= p.maxLifeTime) {
      pool.release(p);
      projectiles.splice(i, 1);
      continue;
    }

    // Rocket homing logic
    if (p.kind === 'rocket' && p.homingTimer && p.homingTimer > 0 && p.targetId) {
      p.homingTimer -= dt;
      const target = p.targetId === player.id ? player : npcs.find((n) => n.id === p.targetId && !n.isDead);
      if (target) {
        const desiredAngle = Math.atan2(target.y - p.y, target.x - p.x);
        const diff = angleDiff(desiredAngle, p.rotation);
        p.rotation += Math.sign(diff) * Math.min(Math.abs(diff), 4.5 * dt);
      }
      p.vx = Math.cos(p.rotation) * p.speed;
      p.vy = Math.sin(p.rotation) * p.speed;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Hit detection
    let hit = false;

    if (p.isNpc) {
      // Hits player
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < 32 && !player.isDead) {
        applyDamageToShip(player, p.damage, p.ownerId, events);
        hit = true;
      }
    } else {
      // Player projectile: test against targeted or any hostile NPC
      for (const npc of npcs) {
        if (npc.isDead) continue;
        const hitRadius = npc.npcType === 'warden' ? 65 : 28;
        const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
        if (dist < hitRadius) {
          applyDamageToShip(npc, p.damage, p.ownerId, events);
          hit = true;
          // Retaliation aggro for passive Drifter if hit
          if (npc.npcType === 'drifter' && !npc.targetId) {
            npc.targetId = 'player';
            npc.npcState = 'aggro';
          }
          break;
        }
      }
    }

    if (hit) {
      pool.release(p);
      projectiles.splice(i, 1);
    }
  }
}
