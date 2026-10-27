export class Camera {
  x = 3000;
  y = 1800;
  viewportWidth = 1280;
  viewportHeight = 720;
  scale = 1.0;
  shakeTime = 0;
  shakeIntensity = 0;

  constructor(viewportWidth = 1280, viewportHeight = 720) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  resize(w: number, h: number) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  // Smooth lerp follow
  follow(targetX: number, targetY: number, dt: number) {
    const lerpFactor = 1 - Math.exp(-7.5 * dt);
    this.x += (targetX - this.x) * lerpFactor;
    this.y += (targetY - this.y) * lerpFactor;

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }
  }

  addShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  getOffset(): { offsetX: number; offsetY: number } {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    return {
      offsetX: this.viewportWidth / 2 - this.x + shakeX,
      offsetY: this.viewportHeight / 2 - this.y + shakeY,
    };
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    const { offsetX, offsetY } = this.getOffset();
    return {
      sx: wx + offsetX,
      sy: wy + offsetY,
    };
  }

  screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    const { offsetX, offsetY } = this.getOffset();
    return {
      wx: sx - offsetX,
      wy: sy - offsetY,
    };
  }
}
