import { ProjectileEntity } from './types';

export class ProjectilePool {
  private pool: ProjectileEntity[] = [];
  private nextId = 1;

  constructor(initialSize = 150) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createNew());
    }
  }

  private createNew(): ProjectileEntity {
    return {
      id: `proj_${this.nextId++}`,
      kind: 'laser',
      ownerId: '',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      targetId: null,
      damage: 0,
      speed: 0,
      lifeTime: 0,
      maxLifeTime: 1.0,
      color: '#ff8a1f',
    };
  }

  acquire(): ProjectileEntity {
    const p = this.pool.pop() || this.createNew();
    p.lifeTime = 0;
    p.targetId = null;
    p.homingTimer = undefined;
    p.targetX = undefined;
    p.targetY = undefined;
    return p;
  }

  release(p: ProjectileEntity) {
    this.pool.push(p);
  }
}
