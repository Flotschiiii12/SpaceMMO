# Rustline — 2D Tactical Space Combat MMO Prototype

*Rustline* is a high-performance 2D top-down space combat prototype built with TypeScript, React, and an unassisted HTML5 Canvas game loop. It is engineered to mimic classic browser space MMO dogfighting with crisp vector aesthetics, procedural WebAudio, and a clean client/server simulation separation.

---

## 1. Architecture Overview

To support future real-time multiplayer networking, the codebase strictly decouples **simulation state** from **rendering and user interfaces**:

```
+-------------------------------------------------------------------------+
|                               REACT HUD                                 |
|         (Target Panel, Minimap, Action Bar, Event Log, Hangar)          |
+------------------------------------+------------------------------------+
                                     |
                                 GameCommand
                                     |
                                     v
+-----------------------+   Fixed 30Hz   +--------------------------------+
|      GameClient       | -------------> |          WorldState            |
| (LocalGameClient /    |                | (Entities, Systems, Movement,  |
|  RemoteGameClient)    | <------------- |  Combat, AI, Loot, Portals)    |
+-----------------------+  Interpolated  +--------------------------------+
                               State
                                 |
                                 v
+-------------------------------------------------------------------------+
|                             CANVAS 2D                                   |
|       (Renderer, Camera Lerp, Parallax Starfield, Particle Pools)       |
+-------------------------------------------------------------------------+
```

### Decoupling Rules:
1. **Simulation (`/src/sim`)**: Pure TypeScript without DOM or Canvas references. State is modeled as plain JavaScript data records (`WorldState`, `ShipEntity`, `ProjectileEntity`).
2. **Fixed 30Hz Timestep**: `step(world, dt, commands, rng, pool)` runs deterministically with an accumulator at `1 / 30s` (33.3ms) driven by a seeded PRNG (`PRNG`).
3. **Command Queue**: Input events never mutate entities directly. User inputs create atomic `GameCommand` objects (`MOVE_TO`, `SET_TARGET`, `TOGGLE_ATTACK`, `FIRE_ROCKET`, `SELECT_AMMO`, etc.) queued for the next tick.
4. **Render Interpolation**: The renderer interpolates entity positions and orientations between the previous simulation snapshot (`prevWorld`) and the current tick (`currentWorld`) using snapshot alpha for stutter-free 60+ FPS motion.
5. **Pluggable Assets**: Ships, stations, and portals render through canvas vector math by default, with automatic fallback checks to load PNG files from `/assets/sprites/<name>.png`.

---

## 2. Project Structure

- `/src/sim/`: Core simulation kernel
  - `types.ts`: Domain models, commands, entities, and events
  - `rng.ts`: Deterministic Mulberry32 seeded pseudo-random number generator
  - `world.ts`: World initialization, sector spawning, and procedural asteroid generators
  - `pool.ts`: High-efficiency object pools for projectiles
  - `step.ts`: The fixed 30Hz simulation loop step function
  - `systems/`: Movement physics, AI state machines, combat resolutions, loot pull, and warp portals
- `/src/client/`:
  - `GameClient.ts`: Abstraction contract
  - `LocalGameClient.ts`: Client simulation runner with accumulator and snapshot interpolation
  - `RemoteGameClient.ts`: Architecture stub for future WebSocket server authority
- `/src/render/`:
  - `CanvasRenderer.ts`: Canvas compositor
  - `Camera.ts`: Smooth lerp tracking and decaying screen shake
  - `Starfield.ts`: 3-layer parallax starfield with procedural map nebula tints
  - `Particles.ts`: Pooled visual FX (engine flames, shield rings, explosions)
  - `Sprites.ts`: Vector path definitions for ship classes and space objects
  - `FloatingNumbers.ts`: Pooled floating combat damage and XP text
- `/src/data/`: Centralized balance data tables
  - `ships.ts`: Scout, Corsair, Bulwark stats, hardpoints, and pricing
  - `items.ts`: Lasers, shields, engines, and munitions options
  - `npcs.ts`: Drifter, Raider, Sniper, Warden archetypes and level-scaling formulas
  - `maps.ts`: Sector dimensions, warp portals, safe zones, and palettes
- `/src/audio/`:
  - `SoundManager.ts`: Procedural WebAudio synth for lasers, missiles, impacts, explosions, and UI clicks
- `/src/save/`:
  - `storage.ts`: Versioned `localStorage` profile persistence

---

## 3. How to Tune Balance

All game mechanics and numbers are isolated in `/src/data/`:

1. **Ship Hull & Speed**: Edit `/src/data/ships.ts` to adjust `hull`, `shield`, `maxSpeed`, `turnRate`, or `laserSlots`.
2. **Weapons & Shield Ratings**: Edit `/src/data/items.ts` to tune weapon damage, laser cycle rates, and missile velocities (`ROCKET_BASE_DAMAGE`, `ROCKET_RANGE`, `ROCKET_COOLDOWN`).
3. **Enemy AI & Scaling**:
   - In `/src/data/npcs.ts`, modify `NPC_ARCHETYPES` to change aggro ranges, firing intervals, or base health.
   - Adjust `calculateNpcStats(type, level)` to tweak how enemies scale as the player levels up.
4. **Sector Maps & Danger**: In `/src/data/maps.ts`, change sector sizes, background hues, safe dock radius, and portal coordinates.

---

## 4. Keybind Reference

| Key / Action | Function |
| :--- | :--- |
| **Left Click / Tap Space** | Move ship to coordinates |
| **Left Click / Tap Enemy** | Lock tactical target |
| **Spacebar** | Toggle laser battery auto-firing |
| **1 / 2 / 3** | Switch active ammo tier (x1 / x2 / x3) |
| **R** | Launch homing torpedo (900 range, 4s cooldown) |
| **H** | Open Hangar facility (while in Safe Zone) |
| **Esc** | Toggle Settings / Exit modals |
| **F3** | Toggle Engine Telemetry (FPS, Tick Time, Entity Counts) |
