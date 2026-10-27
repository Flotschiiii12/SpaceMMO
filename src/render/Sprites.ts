import { ShipEntity, AsteroidEntity, LootBoxEntity, PortalEntity, StationEntity, PortalChannelState } from '../sim/types';

/**
 * Pluggable Asset Loader with High-Fidelity Canvas Vector Fallback
 */
export class SpriteManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private failedImages: Set<string> = new Set();

  constructor() {
    // Attempt background loading of standard sprite names (will fail silently and fall back to vector paths)
    const assetNames = ['scout', 'corsair', 'bulwark', 'drifter', 'raider', 'sniper', 'warden', 'station', 'portal'];
    for (const name of assetNames) {
      this.tryLoad(name, `/assets/sprites/${name}.png`);
    }
  }

  tryLoad(name: string, url: string) {
    if (this.images.has(name) || this.failedImages.has(name)) return;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.images.set(name, img);
    };
    img.onerror = () => {
      this.failedImages.add(name);
    };
  }

  hasSprite(name: string): boolean {
    return this.images.has(name);
  }

  getSprite(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }
}

export const spriteManager = new SpriteManager();

// =================== VECTOR DRAWING FUNCTIONS ===================

export function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: ShipEntity,
  time: number
) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.rotation);

  // Invulnerability blink
  if (ship.invulnerableTimer > 0 && Math.floor(time * 12) % 2 === 0) {
    ctx.restore();
    return;
  }

  // Engine exhaust plume if moving
  if (ship.speed > 5) {
    drawEngineFlames(ctx, ship, time);
  }

  // Draw hull by ship class
  if (ship.isPlayer) {
    if (ship.shipClass === 'bulwark') {
      drawPlayerBulwark(ctx);
    } else if (ship.shipClass === 'corsair') {
      drawPlayerCorsair(ctx);
    } else {
      drawPlayerScout(ctx);
    }
  } else {
    // NPC ships
    switch (ship.npcType) {
      case 'drifter':
        drawNpcDrifter(ctx);
        break;
      case 'raider':
        drawNpcRaider(ctx);
        break;
      case 'sniper':
        drawNpcSniper(ctx);
        break;
      case 'warden':
        drawNpcWarden(ctx, time);
        break;
      default:
        drawPlayerScout(ctx);
    }
  }

  // Draw subtle shield bubble if shield > 0
  if (ship.shield > 0) {
    drawShieldEnvelope(ctx, ship);
  }

  ctx.restore();
}

function drawEngineFlames(ctx: CanvasRenderingContext2D, ship: ShipEntity, time: number) {
  const flicker = 0.85 + Math.sin(time * 35) * 0.2;
  const flameLength = (14 + (ship.speed / ship.maxSpeed) * 16) * flicker;

  ctx.save();
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  if (ship.shipClass === 'bulwark') {
    // Twin heavy exhausts
    ctx.moveTo(-28, -9);
    ctx.lineTo(-28 - flameLength, -9);
    ctx.lineTo(-28, -5);
    ctx.moveTo(-28, 5);
    ctx.lineTo(-28 - flameLength, 9);
    ctx.lineTo(-28, 9);
  } else if (ship.shipClass === 'corsair') {
    // Twin exhausts
    ctx.moveTo(-22, -6);
    ctx.lineTo(-22 - flameLength, -6);
    ctx.lineTo(-22, -3);
    ctx.moveTo(-22, 3);
    ctx.lineTo(-22 - flameLength, 6);
    ctx.lineTo(-22, 6);
  } else {
    // Single central exhaust
    ctx.moveTo(-18, -4);
    ctx.lineTo(-18 - flameLength, 0);
    ctx.lineTo(-18, 4);
  }
  ctx.fill();

  // Core white heat
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(-18, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayerScout(ctx: CanvasRenderingContext2D) {
  // Nimble wedge interceptor with orange highlights
  // Base hull
  ctx.beginPath();
  ctx.moveTo(22, 0); // nose
  ctx.lineTo(-16, -15); // port wingtip
  ctx.lineTo(-10, -6); // port indent
  ctx.lineTo(-18, -5); // port thruster
  ctx.lineTo(-18, 5); // star thruster
  ctx.lineTo(-10, 6); // star indent
  ctx.lineTo(-16, 15); // star wingtip
  ctx.closePath();

  ctx.fillStyle = '#1c202a';
  ctx.fill();
  ctx.strokeStyle = '#0e1015';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Asymmetric Armor plates
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -10);
  ctx.lineTo(-8, -3);
  ctx.lineTo(8, -1);
  ctx.closePath();
  ctx.fillStyle = '#2b3240';
  ctx.fill();

  // Signal Orange accents
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(2, -3);
  ctx.lineTo(-4, 0);
  ctx.lineTo(2, 3);
  ctx.closePath();
  ctx.fillStyle = '#ff8a1f';
  ctx.fill();

  // Canopy glass
  ctx.fillStyle = '#eef0f4';
  ctx.fillRect(4, -1.5, 5, 3);
}

function drawPlayerCorsair(ctx: CanvasRenderingContext2D) {
  // Corsair: Twin-prong combat chassis
  ctx.beginPath();
  ctx.moveTo(26, -5);
  ctx.lineTo(26, -9);
  ctx.lineTo(10, -18);
  ctx.lineTo(-18, -20);
  ctx.lineTo(-22, -12);
  ctx.lineTo(-14, 0);
  ctx.lineTo(-22, 12);
  ctx.lineTo(-18, 20);
  ctx.lineTo(10, 18);
  ctx.lineTo(26, 9);
  ctx.lineTo(26, 5);
  ctx.lineTo(12, 0);
  ctx.closePath();

  ctx.fillStyle = '#222733';
  ctx.fill();
  ctx.strokeStyle = '#0e1015';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing armor plates
  ctx.fillStyle = '#323a4d';
  ctx.fillRect(-6, -15, 12, 5);
  ctx.fillRect(-6, 10, 12, 5);

  // Twin gun barrels
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, -8);
  ctx.lineTo(28, -8);
  ctx.moveTo(18, 8);
  ctx.lineTo(28, 8);
  ctx.stroke();

  // Signal Orange hull stripe
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-8, 4);
  ctx.closePath();
  ctx.fill();
}

function drawPlayerBulwark(ctx: CanvasRenderingContext2D) {
  // Bulwark: Heavy hexagonal dreadnought
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(18, -18);
  ctx.lineTo(-8, -25);
  ctx.lineTo(-26, -18);
  ctx.lineTo(-28, 0);
  ctx.lineTo(-26, 18);
  ctx.lineTo(-8, 25);
  ctx.lineTo(18, 18);
  ctx.closePath();

  ctx.fillStyle = '#282f3d';
  ctx.fill();
  ctx.strokeStyle = '#0e1015';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Segmented armored plates
  ctx.fillStyle = '#181b24';
  ctx.fillRect(-12, -14, 16, 28);

  // Orange command crest
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(8, -8);
  ctx.lineTo(2, 0);
  ctx.lineTo(8, 8);
  ctx.closePath();
  ctx.fill();

  // 3 Laser hardpoint nozzles
  ctx.fillStyle = '#d4d4d8';
  ctx.fillRect(24, -1, 7, 2);
  ctx.fillRect(16, -14, 6, 2);
  ctx.fillRect(16, 12, 6, 2);
}

function drawNpcDrifter(ctx: CanvasRenderingContext2D) {
  // Junky, asymmetrical salvage drone
  ctx.beginPath();
  ctx.moveTo(14, 4);
  ctx.lineTo(4, -12);
  ctx.lineTo(-14, -8);
  ctx.lineTo(-12, 10);
  ctx.lineTo(2, 14);
  ctx.closePath();

  ctx.fillStyle = '#475569';
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Rusty scrap panel
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-4, -6, 9, 8);

  // Yellow hazard dash
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-8, 2, 6, 3);

  // Scanner dish
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(6, -2, 4, 0, Math.PI * 1.5);
  ctx.stroke();
}

function drawNpcRaider(ctx: CanvasRenderingContext2D) {
  // Aggressive crimson pirate skiff
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, -16);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-8, 4);
  ctx.lineTo(-14, 16);
  ctx.closePath();

  ctx.fillStyle = '#7f1d1d';
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Blood red slash
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(0, -6);
  ctx.lineTo(-6, 0);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();
}

function drawNpcSniper(ctx: CanvasRenderingContext2D) {
  // Long railgun needle chassis
  ctx.beginPath();
  ctx.moveTo(34, 0); // long needle rail
  ctx.lineTo(10, -5);
  ctx.lineTo(-12, -18); // outrigger wing
  ctx.lineTo(-18, -12);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-12, 4);
  ctx.lineTo(-18, 12);
  ctx.lineTo(-12, 18);
  ctx.lineTo(10, 5);
  ctx.closePath();

  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Accelerator rail coil
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(34, 0);
  ctx.stroke();
}

function drawNpcWarden(ctx: CanvasRenderingContext2D, time: number) {
  // Massive fortress carrier boss
  ctx.beginPath();
  ctx.moveTo(55, 0);
  ctx.lineTo(35, -35);
  ctx.lineTo(-15, -45);
  ctx.lineTo(-45, -30);
  ctx.lineTo(-48, 30);
  ctx.lineTo(-15, 45);
  ctx.lineTo(35, 35);
  ctx.closePath();

  ctx.fillStyle = '#1e1b24';
  ctx.fill();
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Segmented armor slabs
  ctx.fillStyle = '#3f1c24';
  ctx.fillRect(-25, -28, 40, 56);

  // Red command core
  const pulse = 0.7 + Math.sin(time * 6) * 0.3;
  ctx.fillStyle = `rgba(220, 38, 38, ${pulse.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  // Defensive turret pods
  ctx.fillStyle = '#71717a';
  ctx.fillRect(20, -26, 12, 6);
  ctx.fillRect(20, 20, 12, 6);
}

function drawShieldEnvelope(ctx: CanvasRenderingContext2D, ship: ShipEntity) {
  const radius = ship.npcType === 'warden' ? 68 : ship.shipClass === 'bulwark' ? 36 : 26;
  const ratio = ship.shield / ship.maxShield;

  ctx.save();
  ctx.strokeStyle = `rgba(45, 212, 191, ${(0.15 + ratio * 0.35).toFixed(2)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawHomeStation(ctx: CanvasRenderingContext2D, station: StationEntity, time: number) {
  ctx.save();
  ctx.translate(station.x, station.y);

  // Safe Zone perimeter ring
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, station.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Safe zone ambient label
  ctx.fillStyle = 'rgba(45, 212, 191, 0.4)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAFE ZONE / REPAIR DOCK', 0, -station.radius + 20);

  // Station Hub Rotation
  const rot = time * 0.2;
  ctx.rotate(rot);

  // 4 Docking Spokes
  ctx.fillStyle = '#1e2330';
  ctx.fillRect(-90, -12, 180, 24);
  ctx.fillRect(-12, -90, 24, 180);

  // Docking Arm Pads
  ctx.fillStyle = '#ff8a1f';
  ctx.fillRect(-95, -16, 10, 32);
  ctx.fillRect(85, -16, 10, 32);
  ctx.fillRect(-16, -95, 32, 10);
  ctx.fillRect(-16, 85, 32, 10);

  // Central Core Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const r = 45;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#2a3245';
  ctx.fill();
  ctx.strokeStyle = '#ff8a1f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner beacon
  ctx.fillStyle = '#eef0f4';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawPortal(
  ctx: CanvasRenderingContext2D,
  portal: PortalEntity,
  channel: PortalChannelState | null,
  time: number
) {
  ctx.save();
  ctx.translate(portal.x, portal.y);

  // Outer gate ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Swirling vortex inside
  const swirlRot = time * 1.5;
  ctx.rotate(swirlRot);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const r = portal.radius * 0.7;
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 15, Math.sin(a) * 15, r, a, a + Math.PI);
    ctx.stroke();
  }

  // Channel progress indicator ring if actively channeling
  if (channel && channel.portalId === portal.id) {
    const pct = Math.min(1.0, channel.timer / channel.totalTime);
    ctx.rotate(-swirlRot); // counter-rotate
    ctx.strokeStyle = '#ff8a1f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, portal.radius + 10, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff8a1f';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`JUMPING... ${(channel.totalTime - channel.timer).toFixed(1)}s`, 0, portal.radius + 32);
  } else {
    ctx.rotate(-swirlRot);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(portal.name.toUpperCase(), 0, portal.radius + 24);
  }

  ctx.restore();
}

export function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: AsteroidEntity) {
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rotation);

  ctx.beginPath();
  asteroid.points.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();

  ctx.fillStyle = '#1e2025';
  ctx.fill();
  ctx.strokeStyle = '#111317';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Subtle interior crater shading
  ctx.fillStyle = '#14161a';
  ctx.beginPath();
  ctx.arc(-asteroid.radius * 0.25, -asteroid.radius * 0.2, asteroid.radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawLootBox(ctx: CanvasRenderingContext2D, box: LootBoxEntity, time: number) {
  ctx.save();
  ctx.translate(box.x, box.y);

  // Bobbing float
  const bob = Math.sin(time * 4 + box.x) * 3;
  ctx.translate(0, bob);

  // Box dimensions
  const s = 14;

  // Background glow
  let glowColor = '#eab308'; // credits: gold
  if (box.kind === 'ore') glowColor = '#2dd4bf'; // ore: teal
  if (box.kind === 'ammo') glowColor = '#ff8a1f'; // ammo: signal orange

  ctx.fillStyle = glowColor;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(-s - 2, -s - 2, (s + 2) * 2, (s + 2) * 2);

  // Metal crate body
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = '#1e232d';
  ctx.fillRect(-s, -s, s * 2, s * 2);
  ctx.strokeStyle = '#0e1015';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-s, -s, s * 2, s * 2);

  // Glowing center insignia
  ctx.fillStyle = glowColor;
  ctx.fillRect(-s / 2, -s / 2, s, s);

  ctx.restore();
}
