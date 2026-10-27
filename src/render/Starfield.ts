import { Camera } from './Camera';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  speed: number;
  twinklePhase: number;
}

export class Starfield {
  private stars: Star[] = [];
  private layer1: Star[] = [];
  private layer2: Star[] = [];
  private layer3: Star[] = [];

  constructor(count = 350) {
    for (let i = 0; i < count; i++) {
      const star: Star = {
        x: Math.random() * 3200,
        y: Math.random() * 2000,
        size: Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 1.5 : 2.2,
        brightness: 0.3 + Math.random() * 0.7,
        speed: 0.1 + Math.random() * 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
      };

      if (i < count * 0.5) {
        star.speed = 0.08; // deep background
        this.layer1.push(star);
      } else if (i < count * 0.82) {
        star.speed = 0.22; // mid ground
        this.layer2.push(star);
      } else {
        star.speed = 0.45; // foreground
        this.layer3.push(star);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera, bgTint: string, time: number) {
    const { viewportWidth: w, viewportHeight: h } = camera;

    // Fill base space background
    ctx.fillStyle = '#0a0b0e';
    ctx.fillRect(0, 0, w, h);

    // Radial nebula backdrop with map tint
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    grad.addColorStop(0, bgTint);
    grad.addColorStop(1, 'rgba(10, 11, 14, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw Parallax Star Layers
    this.drawLayer(ctx, this.layer1, camera.x, camera.y, w, h, time, 0.6);
    this.drawLayer(ctx, this.layer2, camera.x, camera.y, w, h, time, 0.85);
    this.drawLayer(ctx, this.layer3, camera.x, camera.y, w, h, time, 1.0);
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    layer: Star[],
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    time: number,
    baseAlpha: number
  ) {
    const wrapW = viewW + 400;
    const wrapH = viewH + 400;

    for (const star of layer) {
      // Parallax wrap around camera
      const px = ((star.x - camX * star.speed) % wrapW + wrapW) % wrapW - 200;
      const py = ((star.y - camY * star.speed) % wrapH + wrapH) % wrapH - 200;

      const twinkle = Math.sin(time * 2.5 + star.twinklePhase) * 0.25;
      const alpha = Math.max(0.1, Math.min(1.0, star.brightness * baseAlpha + twinkle));

      ctx.fillStyle = `rgba(238, 240, 244, ${alpha.toFixed(2)})`;
      ctx.fillRect(px, py, star.size, star.size);
    }
  }
}
