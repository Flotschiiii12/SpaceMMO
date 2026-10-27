/**
 * Simulation Types for Rustline
 * Pure data objects with no DOM references.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type AmmoType = 'basic' | 'x1' | 'x2' | 'x3';

export interface AmmoInventory {
  x1: number;
  x2: number;
  x3: number;
  rocket: number;
}

export type ShipClass = 'scout' | 'corsair' | 'bulwark';
export type NpcType = 'drifter' | 'raider' | 'sniper' | 'warden';
export type NpcState = 'idle' | 'patrol' | 'aggro' | 'chase' | 'flee' | 'return';

export interface LaserSlotItem {
  id: string;
  name: string;
  tier: number;
  damage: number;
  fireRate: number; // shots per second
  range: number;
  color: string;
  costCredits: number;
  costOre: number;
}

export interface ShieldSlotItem {
  id: string;
  name: string;
  tier: number;
  capacity: number;
  regenRate: number;
  costCredits: number;
  costOre: number;
}

export interface EngineSlotItem {
  id: string;
  name: string;
  tier: number;
  speedBonus: number;
  turnBonus: number;
  costCredits: number;
  costOre: number;
}

export interface ShipDefinition {
  id: ShipClass;
  name: string;
  hull: number;
  shield: number;
  maxSpeed: number;
  turnRate: number;
  laserSlots: number;
  extraSlots: number; // e.g., shield and engine
  costCredits: number;
  costOre: number;
  description: string;
}

export interface ShipEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  targetRotation: number;
  destination: Vector2D | null;
  speed: number;
  maxSpeed: number;
  turnRate: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number; // time since last damage
  shieldRegenRate: number;
  targetId: string | null;
  isAttacking: boolean;
  laserCooldown: number;
  rocketCooldown: number;
  activeAmmo: AmmoType;
  ammo: AmmoInventory;
  shipClass: ShipClass;
  lasersEquipped: (string | null)[];
  shieldEquipped: string | null;
  engineEquipped: string | null;
  invulnerableTimer: number;
  isPlayer: boolean;
  isDead: boolean;
  deathTimer: number;
  inSafeZone: boolean;

  // Progression (player)
  level: number;
  xp: number;
  xpToNext: number;
  credits: number;
  ore: number;

  // NPC specific
  npcType?: NpcType;
  npcState?: NpcState;
  baseSpawnX?: number;
  baseSpawnY?: number;
  patrolTarget?: Vector2D | null;
  patrolWaitTimer?: number;
  aggroRange?: number;
  attackRange?: number;
  bossPhase?: number;
  bossMinionsSpawned?: boolean;
  bossRocketsSpreadFired?: boolean;
  fleeTimer?: number;
  respawnTimer?: number;
  xpReward?: number;
  creditsReward?: number;
  oreReward?: number;
}

export interface ProjectileEntity {
  id: string;
  kind: 'laser' | 'rocket';
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  targetId: string | null;
  targetX?: number;
  targetY?: number;
  damage: number;
  speed: number;
  lifeTime: number;
  maxLifeTime: number;
  color: string;
  homingTimer?: number;
  isNpc?: boolean;
}

export type LootBoxKind = 'credits' | 'ore' | 'ammo';

export interface LootBoxEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: LootBoxKind;
  value: number;
  ammoType?: keyof AmmoInventory;
  lifeTime: number;
  beingPulled: boolean;
}

export interface PortalEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
}

export interface StationEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number; // safe zone radius 400
}

export interface PortalChannelState {
  portalId: string;
  timer: number;
  totalTime: number; // 3.0s
  interrupted: boolean;
}

export interface MoveMarker {
  x: number;
  y: number;
  timer: number;
}

export type SimEvent =
  | { type: 'LASER_FIRED'; x: number; y: number; targetX: number; targetY: number; ammo: AmmoType; isPlayer: boolean; color: string }
  | { type: 'ROCKET_FIRED'; x: number; y: number; targetId: string; isPlayer: boolean }
  | { type: 'DAMAGE_DEALT'; targetId: string; x: number; y: number; shieldDamage: number; hullDamage: number; isCrit: boolean; isPlayerTarget: boolean }
  | { type: 'ENTITY_DIED'; id: string; name: string; x: number; y: number; isPlayer: boolean; killerId?: string }
  | { type: 'LOOT_SPAWNED'; x: number; y: number; kind: LootBoxKind; value: number }
  | { type: 'LOOT_COLLECTED'; kind: LootBoxKind; value: number; ammoType?: keyof AmmoInventory }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'MAP_JUMPED'; fromMap: string; toMap: string }
  | { type: 'PORTAL_CHANNELING'; progress: number; portalName: string }
  | { type: 'PORTAL_CANCELLED' }
  | { type: 'PLAYER_RESPAWNED'; creditsLost: number }
  | { type: 'REPAIR_COMPLETED'; hullRepaired: number };

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  bgTint: string; // hex or rgb tint
  homeStation?: StationEntity;
  portals: PortalEntity[];
  asteroidCount: number;
}

export interface AsteroidEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  points: { x: number; y: number }[];
}

export interface WorldState {
  tick: number;
  mapId: string;
  mapWidth: number;
  mapHeight: number;
  player: ShipEntity;
  npcs: ShipEntity[];
  projectiles: ProjectileEntity[];
  lootBoxes: LootBoxEntity[];
  portals: PortalEntity[];
  homeStation: StationEntity | null;
  asteroids: AsteroidEntity[];
  portalChannel: PortalChannelState | null;
  moveMarker: MoveMarker | null;
  events: SimEvent[];
}

// Commands from client/input
export type GameCommand =
  | { type: 'MOVE_TO'; x: number; y: number }
  | { type: 'SET_TARGET'; targetId: string | null }
  | { type: 'TOGGLE_ATTACK' }
  | { type: 'FIRE_ROCKET' }
  | { type: 'SELECT_AMMO'; ammoType: AmmoType }
  | { type: 'REPAIR_SHIP' }
  | { type: 'BUY_SHIP'; shipId: ShipClass }
  | { type: 'EQUIP_SHIP'; shipId: ShipClass }
  | { type: 'BUY_ITEM'; itemId: string }
  | { type: 'EQUIP_ITEM'; slotType: 'laser' | 'shield' | 'engine'; slotIndex: number; itemId: string | null }
  | { type: 'BUY_AMMO'; ammoType: keyof AmmoInventory; count: number }
  | { type: 'RESPAWN_PLAYER' }
  | { type: 'SET_MAP'; mapId: string; spawnX: number; spawnY: number };
