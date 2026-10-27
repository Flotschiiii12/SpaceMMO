export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'spark' | 'smoke' | 'ring' | 'debris';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 500;

  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#ff8a1f',
        kind: 'spark',
      });
    }
  }

  private spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
    kind: Particle['kind'] = 'spark'
  ) {
    const p = this.particles.find((item) => !item.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.color = color;
    p.kind = kind;
  }

  emitEngineTrail(x: number, y: number, angle: number, speed: number) {
    if (speed < 10) return;
    const backAngle = angle + Math.PI + (Math.random() - 0.5) * 0.4;
    const pSpeed = Math.random() * 80 + 30;
    this.spawn(
      x,
      y,
      Math.cos(backAngle) * pSpeed,
      Math.sin(backAngle) * pSpeed,
      0.35 + Math.random() * 0.25,
      Math.random() * 2.5 + 1.2,
      Math.random() < 0.65 ? '#ff8a1f' : '#f59e0b',
      'spark'
    );
  }

  emitHitSparks(x: number, y: number, count = 8, color = '#ff8a1f') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 240 + 60;
      this.spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.2 + Math.random() * 0.25,
        Math.random() * 2.5 + 1.0,
        color,
        'spark'
      );
    }
  }

  emitShieldImpact(x: number, y: number) {
    this.spawn(x, y, 0, 0, 0.35, 12, '#2dd4bf', 'ring');
    this.emitHitSparks(x, y, 6, '#2dd4bf');
  }

  emitExplosion(x: number, y: number, isLarge = false) {
    const count = isLarge ? 55 : 30;

    // Shockwave ring
    this.spawn(x, y, 0, 0, isLarge ? 0.6 : 0.4, isLarge ? 80 : 45, '#ff8a1f', 'ring');

    // Fire sparks and debris
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 320 + 80) * (isLarge ? 1.4 : 1.0);
      const isDebris = Math.random() < 0.4;
      const color = isDebris
        ? '#94a3b8'
        : Math.random() < 0.5
        ? '#ff8a1f'
        : Math.random() < 0.8
        ? '#ef4444'
        : '#fbbf24';

      this.spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.4 + Math.random() * (isLarge ? 0.8 : 0.45),
        isDebris ? Math.random() * 4 + 2 : Math.random() * 3 + 1.5,
        color,
        isDebris ? 'debris' : 'spark'
      );
    }
  }

  emitWarpVortex(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60 + 20;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const inwardAngle = Math.atan2(y - py, x - px) + 0.5; // spiral inward
      this.spawn(
        px,
        py,
        Math.cos(inwardAngle) * 90,
        Math.sin(inwardAngle) * 90,
        0.4,
        2.5,
        '#60a5fa',
        'spark'
      );
    }
  }

  update(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.kind === 'spark' || p.kind === 'debris') {
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else if (p.kind === 'ring') {
        p.size += 160 * dt; // expanding ring
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      const progress = p.life / p.maxLife; // 1 -> 0
      const screenX = p.x + offsetX;
      const screenY = p.y + offsetY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, progress));

      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3 * progress);
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'debris') {
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX - p.size / 2, screenY - p.size / 2, p.size, p.size);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
