import { WorldState, ShipEntity, ProjectileEntity } from '../sim/types';
import { Camera } from './Camera';
import { Starfield } from './Starfield';
import { ParticleSystem } from './Particles';
import { FloatingNumbersSystem } from './FloatingNumbers';
import { drawShip, drawHomeStation, drawPortal, drawAsteroid, drawLootBox } from './Sprites';
import { MAPS } from '../data/maps';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  camera: Camera;
  starfield: Starfield;
  particles: ParticleSystem;
  floatingNumbers: FloatingNumbersSystem;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D rendering context');
    this.ctx = context;
    this.camera = new Camera(canvas.width, canvas.height);
    this.starfield = new Starfield(350);
    this.particles = new ParticleSystem(500);
    this.floatingNumbers = new FloatingNumbersSystem(80);
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.camera.resize(w, h);
  }

  render(world: WorldState, alpha: number, time: number) {
    const ctx = this.ctx;
    const { offsetX, offsetY } = this.camera.getOffset();
    const mapData = MAPS[world.mapId] || MAPS.map_1;

    // 1. Starfield and background tint
    this.starfield.render(ctx, this.camera, mapData.bgTint, time);

    // Save world space transform
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 2. Map Impassable Boundary Border
    this.drawMapBorders(ctx, world.mapWidth, world.mapHeight, time);

    // 3. Home station & safe zone
    if (world.homeStation) {
      drawHomeStation(ctx, world.homeStation, time);
    }

    // 4. Portals
    for (const portal of world.portals) {
      drawPortal(ctx, portal, world.portalChannel, time);
    }

    // 5. Asteroids
    for (const asteroid of world.asteroids) {
      drawAsteroid(ctx, asteroid);
    }

    // 6. Loot boxes
    for (const box of world.lootBoxes) {
      drawLootBox(ctx, box, time);
    }

    // 7. Move destination marker
    if (world.moveMarker) {
      this.drawMoveMarker(ctx, world.moveMarker.x, world.moveMarker.y, world.moveMarker.timer);
    }

    // 8. NPCs
    for (const npc of world.npcs) {
      if (npc.isDead) continue;
      drawShip(ctx, npc, time);

      // Mini overhead health/shield bar for NPC
      this.drawNpcMiniBars(ctx, npc);
    }

    // 9. Player ship
    if (!world.player.isDead) {
      drawShip(ctx, world.player, time);
    }

    // 10. Target reticle & lock ring on locked target
    if (world.player.targetId) {
      const lockedNpc = world.npcs.find((n) => n.id === world.player.targetId && !n.isDead);
      if (lockedNpc) {
        this.drawTargetLock(ctx, lockedNpc, time);
      }
    }

    // 11. Projectiles (Lasers & Rockets)
    this.drawProjectiles(ctx, world.projectiles, time);

    // 12. Particles
    this.particles.render(ctx, 0, 0);

    // 13. Floating damage & XP numbers
    this.floatingNumbers.render(ctx, 0, 0);

    ctx.restore();
  }

  private drawMapBorders(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number
  ) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -time * 20;

    // Outer perimeter
    ctx.strokeRect(0, 0, w, h);
    ctx.setLineDash([]);

    // Subtle hazard corner brackets
    const bLen = 60;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 4;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(0, bLen);
    ctx.lineTo(0, 0);
    ctx.lineTo(bLen, 0);
    // Top-right
    ctx.moveTo(w - bLen, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, bLen);
    // Bottom-left
    ctx.moveTo(0, h - bLen);
    ctx.lineTo(0, h);
    ctx.lineTo(bLen, h);
    // Bottom-right
    ctx.moveTo(w - bLen, h);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h - bLen);
    ctx.stroke();

    ctx.restore();
  }

  private drawMoveMarker(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number) {
    const radius = Math.max(4, 20 - timer * 14);
    const alpha = Math.max(0, 1 - timer / 1.2);

    ctx.save();
    ctx.strokeStyle = `rgba(255, 138, 31, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    const cSize = radius + 4;
    ctx.beginPath();
    ctx.moveTo(x - cSize, y);
    ctx.lineTo(x + cSize, y);
    ctx.moveTo(x, y - cSize);
    ctx.lineTo(x, y + cSize);
    ctx.stroke();

    ctx.restore();
  }

  private drawTargetLock(ctx: CanvasRenderingContext2D, target: ShipEntity, time: number) {
    const radius = target.npcType === 'warden' ? 70 : 34;
    const rot = time * 2;

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate(rot);

    // 4-bracket tactical targeting reticle
    ctx.strokeStyle = '#ff8a1f';
    ctx.lineWidth = 2;

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, a - 0.25, a + 0.25);
      ctx.stroke();
    }

    // Lead indicator line if target has velocity
    if (Math.hypot(target.vx, target.vy) > 20) {
      ctx.rotate(-rot);
      ctx.strokeStyle = 'rgba(255, 138, 31, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(target.vx * 0.4, target.vy * 0.4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  private drawNpcMiniBars(ctx: CanvasRenderingContext2D, npc: ShipEntity) {
    const barW = npc.npcType === 'warden' ? 80 : 38;
    const barH = 3;
    const x = npc.x - barW / 2;
    const y = npc.y - (npc.npcType === 'warden' ? 55 : 28);

    // Background
    ctx.fillStyle = 'rgba(14, 16, 21, 0.8)';
    ctx.fillRect(x - 1, y - 5, barW + 2, barH * 2 + 5);

    // Shield bar
    if (npc.maxShield > 0) {
      const shieldRatio = Math.max(0, Math.min(1, npc.shield / npc.maxShield));
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(x, y - 3, barW * shieldRatio, barH);
    }

    // Hull bar
    const hullRatio = Math.max(0, Math.min(1, npc.hull / npc.maxHull));
    ctx.fillStyle = hullRatio > 0.4 ? '#eef0f4' : '#ef4444';
    ctx.fillRect(x, y + 1, barW * hullRatio, barH);
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: ProjectileEntity[], time: number) {
    for (const p of projectiles) {
      if (p.kind === 'laser') {
        // High-velocity energy beam
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        const beamLength = 26;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-beamLength, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // White core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-beamLength * 0.7, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.restore();
      } else if (p.kind === 'rocket') {
        // Torpedo missile body with smoke plume
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Rocket body
        ctx.fillStyle = '#eef0f4';
        ctx.fillRect(-10, -2, 10, 4);

        // Warhead nosecone
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();

        // Exhaust flicker
        const fl = 8 + Math.sin(time * 40) * 3;
        ctx.fillStyle = '#ff8a1f';
        ctx.fillRect(-10 - fl, -1.5, fl, 3);

        ctx.restore();
      }
    }
  }
}
