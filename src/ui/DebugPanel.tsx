import React from 'react';
import { WorldState } from '../sim/types';

interface DebugPanelProps {
  world: WorldState;
  fps: number;
  tickTimeMs: number;
  alpha: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ world, fps, tickTimeMs, alpha }) => {
  const activeNpcs = world.npcs.filter((n) => !n.isDead).length;

  return (
    <div className="fixed top-14 left-4 z-50 bg-[#14171d]/95 border border-[#ff8a1f]/60 p-3 text-[11px] font-mono text-neutral-300 pointer-events-none select-none shadow-xl w-60">
      <div className="text-[10px] uppercase font-bold text-[#ff8a1f] border-b border-neutral-800 pb-1 mb-2 flex justify-between">
        <span>ENGINE TELEMETRY [F3]</span>
        <span className="text-neutral-500">30HZ SIM</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-neutral-500">RENDER FPS:</span>
          <span className={`font-bold tabular-nums ${fps >= 55 ? 'text-green-400' : 'text-amber-400'}`}>
            {fps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-500">SIM TICK TIME:</span>
          <span className="text-neutral-200 font-bold tabular-nums">{tickTimeMs.toFixed(2)} ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-500">INTERP ALPHA:</span>
          <span className="text-neutral-200 font-bold tabular-nums">{alpha.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-500">TICK INDEX:</span>
          <span className="text-neutral-200 tabular-nums">{world.tick}</span>
        </div>

        <div className="border-t border-neutral-800/80 my-1 pt-1 space-y-1">
          <div className="flex justify-between">
            <span className="text-neutral-500">ACTIVE NPCS:</span>
            <span className="text-neutral-200 tabular-nums">
              {activeNpcs} / {world.npcs.length}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">PROJECTILES:</span>
            <span className="text-neutral-200 tabular-nums">{world.projectiles.length}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">LOOT BOXES:</span>
            <span className="text-neutral-200 tabular-nums">{world.lootBoxes.length}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500">PLAYER POS:</span>
            <span className="text-neutral-200 tabular-nums">
              {Math.round(world.player.x)}, {Math.round(world.player.y)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
