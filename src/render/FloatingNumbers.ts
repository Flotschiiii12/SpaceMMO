export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export class FloatingNumbersSystem {
  private items: FloatingText[] = [];

  constructor(maxItems = 80) {
    for (let i = 0; i < maxItems; i++) {
      this.items.push({
        active: false,
        x: 0,
        y: 0,
        vy: -50,
        text: '',
        color: '#eef0f4',
        size: 14,
        life: 0,
        maxLife: 0.8,
        isCrit: false,
      });
    }
  }

  spawnDamage(x: number, y: number, damage: number, isShield = false, isCrit = false) {
    const item = this.items.find((i) => !i.active);
    if (!item) return;

    item.active = true;
    item.x = x + (Math.random() - 0.5) * 20;
    item.y = y - 10 + (Math.random() - 0.5) * 10;
    item.vy = isCrit ? -75 : -45;
    item.text = `${isCrit ? '!' : ''}${damage}`;
    item.color = isShield ? '#2dd4bf' : isCrit ? '#fbbf24' : '#eef0f4';
    item.size = isCrit ? 18 : isShield ? 13 : 14;
    item.life = isCrit ? 0.9 : 0.7;
    item.maxLife = item.life;
    item.isCrit = isCrit;
  }

  spawnText(x: number, y: number, text: string, color = '#4ade80') {
    const item = this.items.find((i) => !i.active);
    if (!item) return;

    item.active = true;
    item.x = x;
    item.y = y - 15;
    item.vy = -35;
    item.text = text;
    item.color = color;
    item.size = 14;
    item.life = 0.9;
    item.maxLife = 0.9;
    item.isCrit = false;
  }

  update(dt: number) {
    for (const item of this.items) {
      if (!item.active) continue;
      item.life -= dt;
      if (item.life <= 0) {
        item.active = false;
        continue;
      }
      item.y += item.vy * dt;
      item.vy *= 0.96;
    }
  }

  render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    ctx.save();
    ctx.textAlign = 'center';

    for (const item of this.items) {
      if (!item.active) continue;
      const alpha = Math.max(0, Math.min(1, item.life / item.maxLife));
      const screenX = Math.round(item.x + offsetX);
      const screenY = Math.round(item.y + offsetY);

      ctx.globalAlpha = alpha;
      ctx.font = `${item.isCrit ? 'bold ' : ''}${item.size}px monospace, sans-serif`;

      // Dark text shadow for high readability against space
      ctx.fillStyle = '#0a0b0e';
      ctx.fillText(item.text, screenX + 1, screenY + 1);

      ctx.fillStyle = item.color;
      ctx.fillText(item.text, screenX, screenY);
    }

    ctx.restore();
  }
}
