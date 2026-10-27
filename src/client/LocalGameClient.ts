import { GameClient } from './GameClient';
import { GameCommand, SimEvent, WorldState, ShipEntity, ProjectileEntity } from '../sim/types';
import { PRNG } from '../sim/rng';
import { ProjectilePool } from '../sim/pool';
import { createWorld } from '../sim/world';
import { step } from '../sim/step';
import { normalizeAngle } from '../sim/systems/movement';

export const SIMULATION_TICK_RATE = 30;
export const FIXED_DT = 1 / SIMULATION_TICK_RATE; // 0.033333s

function cloneShip(s: ShipEntity): ShipEntity {
  return {
    ...s,
    ammo: { ...s.ammo },
    lasersEquipped: [...s.lasersEquipped],
    destination: s.destination ? { ...s.destination } : null,
  };
}

function cloneProjectiles(projs: ProjectileEntity[]): ProjectileEntity[] {
  return projs.map((p) => ({ ...p }));
}

function cloneWorld(w: WorldState): WorldState {
  return {
    ...w,
    player: cloneShip(w.player),
    npcs: w.npcs.map(cloneShip),
    projectiles: cloneProjectiles(w.projectiles),
    lootBoxes: w.lootBoxes.map((l) => ({ ...l })),
    portals: [...w.portals],
    homeStation: w.homeStation ? { ...w.homeStation } : null,
    asteroids: [...w.asteroids],
    portalChannel: w.portalChannel ? { ...w.portalChannel } : null,
    moveMarker: w.moveMarker ? { ...w.moveMarker } : null,
    events: [],
  };
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = normalizeAngle(b - a);
  return a + diff * t;
}

export class LocalGameClient implements GameClient {
  private currentWorld: WorldState;
  private prevWorld: WorldState;
  private interpolatedWorld: WorldState;
  private commandQueue: GameCommand[] = [];
  private eventListeners: ((event: SimEvent) => void)[] = [];
  private accumulator = 0;
  private rng = new PRNG(Date.now() & 0xffffff);
  private projectilePool = new ProjectilePool(200);

  constructor(initialMap = 'map_1', savedPlayer?: ShipEntity) {
    this.currentWorld = createWorld(initialMap, this.rng, savedPlayer);
    this.prevWorld = cloneWorld(this.currentWorld);
    this.interpolatedWorld = cloneWorld(this.currentWorld);
  }

  sendCommand(cmd: GameCommand): void {
    this.commandQueue.push(cmd);
  }

  onEvent(listener: (event: SimEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  update(rawDt: number): void {
    // Clamp to prevent spiral of death on lag spikes or tab switch
    const clampedDt = Math.min(rawDt, 0.1);
    this.accumulator += clampedDt;

    while (this.accumulator >= FIXED_DT) {
      this.prevWorld = cloneWorld(this.currentWorld);

      // Drain current commands
      const cmds = this.commandQueue;
      this.commandQueue = [];

      const tickEvents = step(this.currentWorld, FIXED_DT, cmds, this.rng, this.projectilePool);

      // Notify listeners
      if (tickEvents.length > 0) {
        for (const evt of tickEvents) {
          for (const listener of this.eventListeners) {
            listener(evt);
          }
        }
      }

      this.accumulator -= FIXED_DT;
    }
  }

  getInterpolatedState(alpha: number): WorldState {
    const t = Math.max(0, Math.min(1, alpha));
    const curr = this.currentWorld;
    const prev = this.prevWorld;

    // Shallow copy container
    const interp = this.interpolatedWorld;
    interp.tick = curr.tick;
    interp.mapId = curr.mapId;
    interp.mapWidth = curr.mapWidth;
    interp.mapHeight = curr.mapHeight;
    interp.homeStation = curr.homeStation;
    interp.portals = curr.portals;
    interp.asteroids = curr.asteroids;
    interp.portalChannel = curr.portalChannel;
    interp.moveMarker = curr.moveMarker;

    // Interpolate player
    interp.player.x = prev.player.x + (curr.player.x - prev.player.x) * t;
    interp.player.y = prev.player.y + (curr.player.y - prev.player.y) * t;
    interp.player.rotation = lerpAngle(prev.player.rotation, curr.player.rotation, t);
    interp.player.vx = curr.player.vx;
    interp.player.vy = curr.player.vy;
    interp.player.speed = curr.player.speed;
    interp.player.hull = curr.player.hull;
    interp.player.maxHull = curr.player.maxHull;
    interp.player.shield = curr.player.shield;
    interp.player.maxShield = curr.player.maxShield;
    interp.player.credits = curr.player.credits;
    interp.player.ore = curr.player.ore;
    interp.player.level = curr.player.level;
    interp.player.xp = curr.player.xp;
    interp.player.xpToNext = curr.player.xpToNext;
    interp.player.isDead = curr.player.isDead;
    interp.player.targetId = curr.player.targetId;
    interp.player.isAttacking = curr.player.isAttacking;
    interp.player.inSafeZone = curr.player.inSafeZone;
    interp.player.activeAmmo = curr.player.activeAmmo;
    interp.player.ammo = curr.player.ammo;
    interp.player.shipClass = curr.player.shipClass;
    interp.player.lasersEquipped = curr.player.lasersEquipped;
    interp.player.shieldEquipped = curr.player.shieldEquipped;
    interp.player.engineEquipped = curr.player.engineEquipped;
    interp.player.invulnerableTimer = curr.player.invulnerableTimer;
    interp.player.laserCooldown = curr.player.laserCooldown;
    interp.player.rocketCooldown = curr.player.rocketCooldown;

    // Interpolate NPCs
    interp.npcs = curr.npcs.map((currNpc) => {
      const prevNpc = prev.npcs.find((n) => n.id === currNpc.id);
      if (!prevNpc) return currNpc;
      return {
        ...currNpc,
        x: prevNpc.x + (currNpc.x - prevNpc.x) * t,
        y: prevNpc.y + (currNpc.y - prevNpc.y) * t,
        rotation: lerpAngle(prevNpc.rotation, currNpc.rotation, t),
      };
    });

    // Interpolate projectiles
    interp.projectiles = curr.projectiles.map((currProj) => {
      const prevProj = prev.projectiles.find((p) => p.id === currProj.id);
      if (!prevProj) return currProj;
      return {
        ...currProj,
        x: prevProj.x + (currProj.x - prevProj.x) * t,
        y: prevProj.y + (currProj.y - prevProj.y) * t,
      };
    });

    interp.lootBoxes = curr.lootBoxes;

    return interp;
  }

  getRawState(): WorldState {
    return this.currentWorld;
  }

  destroy(): void {
    this.eventListeners = [];
    this.commandQueue = [];
  }
}
