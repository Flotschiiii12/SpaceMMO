import { ShipEntity, Vector2D } from '../types';

/**
 * Normalizes an angle into [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/**
 * Returns the shortest difference between two angles
 */
export function angleDiff(target: number, current: number): number {
  return normalizeAngle(target - current);
}

/**
 * Updates a ship's movement and rotation
 */
export function updateShipMovement(ship: ShipEntity, dt: number, mapWidth: number, mapHeight: number) {
  if (ship.isDead) return;

  if (ship.destination) {
    const dx = ship.destination.x - ship.x;
    const dy = ship.destination.y - ship.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > 15 * 15) {
      const dist = Math.sqrt(distSq);
      ship.targetRotation = Math.atan2(dy, dx);

      // Smooth turn towards targetRotation
      const diff = angleDiff(ship.targetRotation, ship.rotation);
      const maxTurn = ship.turnRate * dt;
      if (Math.abs(diff) < maxTurn) {
        ship.rotation = ship.targetRotation;
      } else {
        ship.rotation += Math.sign(diff) * maxTurn;
      }

      // Deceleration zone within 180 units
      const targetSpeed = dist < 180 ? (dist / 180) * ship.maxSpeed : ship.maxSpeed;
      // Acceleration rate
      const accel = 600 * dt;
      if (ship.speed < targetSpeed) {
        ship.speed = Math.min(targetSpeed, ship.speed + accel);
      } else {
        ship.speed = Math.max(targetSpeed, ship.speed - accel * 1.5);
      }

      // Forward velocity along rotation
      ship.vx = Math.cos(ship.rotation) * ship.speed;
      ship.vy = Math.sin(ship.rotation) * ship.speed;
    } else {
      // Arrived at destination
      ship.destination = null;
      ship.speed = Math.max(0, ship.speed - 800 * dt);
      ship.vx = Math.cos(ship.rotation) * ship.speed;
      ship.vy = Math.sin(ship.rotation) * ship.speed;
    }
  } else {
    // Coast to halt
    ship.speed = Math.max(0, ship.speed - 600 * dt);
    ship.vx = Math.cos(ship.rotation) * ship.speed;
    ship.vy = Math.sin(ship.rotation) * ship.speed;
  }

  // Update position
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Impassable map boundary clamping (with 25 margin for ship radius)
  const margin = 28;
  if (ship.x < margin) {
    ship.x = margin;
    ship.vx = 0;
  } else if (ship.x > mapWidth - margin) {
    ship.x = mapWidth - margin;
    ship.vx = 0;
  }

  if (ship.y < margin) {
    ship.y = margin;
    ship.vy = 0;
  } else if (ship.y > mapHeight - margin) {
    ship.y = mapHeight - margin;
    ship.vy = 0;
  }
}
