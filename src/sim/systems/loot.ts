import { WorldState, ShipEntity, LootBoxEntity, SimEvent, AmmoInventory } from '../types';
import { PRNG } from '../rng';
import { LEVEL_CAP, getXpRequiredForLevel, recomputePlayerStats } from './progression';

let lootIdCounter = 1;

export function handleNpcDeathLootAndXp(npc: ShipEntity, world: WorldState, rng: PRNG) {
  const { player, events, lootBoxes } = world;

  // Award XP to player
  const xpReward = npc.xpReward || 50;
  player.xp += xpReward;

  // Check level up
  while (player.level < LEVEL_CAP && player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = getXpRequiredForLevel(player.level);
    recomputePlayerStats(player);
    // Fully heal on level up
    player.hull = player.maxHull;
    player.shield = player.maxShield;

    events.push({
      type: 'LEVEL_UP',
      newLevel: player.level,
    });
  }

  // Spawn loot boxes at NPC position
  // 1. Credits box
  if (npc.creditsReward && npc.creditsReward > 0) {
    const angle = rng.range(0, Math.PI * 2);
    const speed = rng.range(20, 60);
    lootBoxes.push({
      id: `loot_${lootIdCounter++}`,
      x: npc.x,
      y: npc.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      kind: 'credits',
      value: npc.creditsReward,
      lifeTime: 0,
      beingPulled: false,
    });
  }

  // 2. Ore box (if dropped)
  if (npc.oreReward && npc.oreReward > 0) {
    const angle = rng.range(0, Math.PI * 2);
    const speed = rng.range(20, 60);
    lootBoxes.push({
      id: `loot_${lootIdCounter++}`,
      x: npc.x + rng.range(-15, 15),
      y: npc.y + rng.range(-15, 15),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      kind: 'ore',
      value: npc.oreReward,
      lifeTime: 0,
      beingPulled: false,
    });
  }

  // 3. Ammo box (chance based on NPC tier)
  if (rng.chance(npc.npcType === 'warden' ? 1.0 : 0.55)) {
    const angle = rng.range(0, Math.PI * 2);
    const speed = rng.range(20, 60);
    const ammoRoll = rng.next();
    let ammoType: keyof AmmoInventory = 'x1';
    let count = 40;

    if (ammoRoll < 0.45) {
      ammoType = 'x1';
      count = rng.int(40, 80);
    } else if (ammoRoll < 0.8) {
      ammoType = 'x2';
      count = rng.int(20, 45);
    } else if (ammoRoll < 0.93) {
      ammoType = 'x3';
      count = rng.int(10, 25);
    } else {
      ammoType = 'rocket';
      count = rng.int(2, 6);
    }

    lootBoxes.push({
      id: `loot_${lootIdCounter++}`,
      x: npc.x + rng.range(-20, 20),
      y: npc.y + rng.range(-20, 20),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      kind: 'ammo',
      value: count,
      ammoType,
      lifeTime: 0,
      beingPulled: false,
    });
  }
}

export function updateLoot(world: WorldState, dt: number) {
  const { lootBoxes, player, events } = world;
  const PULL_RADIUS = 220;
  const PICKUP_RADIUS = 35; // auto-pickup when within 35 units after pull

  for (let i = lootBoxes.length - 1; i >= 0; i--) {
    const box = lootBoxes[i];
    box.lifeTime += dt;

    // Despawn after 90 seconds
    if (box.lifeTime > 90) {
      lootBoxes.splice(i, 1);
      continue;
    }

    // Gentle friction on initial drift
    box.vx *= 0.95;
    box.vy *= 0.95;

    const dx = player.x - box.x;
    const dy = player.y - box.y;
    const dist = Math.hypot(dx, dy);

    // Auto pull towards player if within 220 units (or 120 units auto-pickup threshold)
    if (!player.isDead && dist < PULL_RADIUS) {
      box.beingPulled = true;
      const pullSpeed = 480;
      const nx = dx / dist;
      const ny = dy / dist;
      box.vx += nx * pullSpeed * dt;
      box.vy += ny * pullSpeed * dt;
    } else {
      box.beingPulled = false;
    }

    box.x += box.vx * dt;
    box.y += box.vy * dt;

    // Collected
    if (!player.isDead && dist <= PICKUP_RADIUS) {
      if (box.kind === 'credits') {
        player.credits += box.value;
      } else if (box.kind === 'ore') {
        player.ore += box.value;
      } else if (box.kind === 'ammo' && box.ammoType) {
        player.ammo[box.ammoType] += box.value;
      }

      events.push({
        type: 'LOOT_COLLECTED',
        kind: box.kind,
        value: box.value,
        ammoType: box.ammoType,
      });

      lootBoxes.splice(i, 1);
    }
  }
}
