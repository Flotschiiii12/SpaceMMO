import React from 'react';
import { ShipEntity } from '../sim/types';

interface TargetPanelProps {
  target: ShipEntity | null;
  player: ShipEntity;
}

export const TargetPanel: React.FC<TargetPanelProps> = ({ target, player }) => {
  if (!target || target.isDead) return null;

  const dist = Math.round(Math.hypot(target.x - player.x, target.y - player.y));
  const inLaserRange = dist <= 600;
  const inRocketRange = dist <= 900;

  const hullRatio = Math.max(0, Math.min(1, target.hull / target.maxHull));
  const shieldRatio = target.maxShield > 0 ? Math.max(0, Math.min(1, target.shield / target.maxShield)) : 0;

  return (
    <div className="border border-neutral-700 bg-[#14171d]/90 p-3 w-56 select-none font-mono text-xs shadow-xl backdrop-blur-xs">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
        <span className="text-neutral-400 text-[10px] uppercase tracking-wider">LOCKED TARGET</span>
        <span
          className={`text-[10px] px-1 py-0.2 font-bold ${
            inLaserRange
              ? 'text-[#ff8a1f] bg-[#ff8a1f]/20'
              : inRocketRange
              ? 'text-yellow-400 bg-yellow-400/20'
              : 'text-neutral-500 bg-neutral-800'
          }`}
        >
          {inLaserRange ? 'IN LASER RANGE' : inRocketRange ? 'TORPEDO LOCK' : 'OUT OF RANGE'}
        </span>
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <div className="font-bold text-neutral-100 truncate pr-2">{target.name}</div>
        <div className="text-[10px] text-neutral-400">LVL {target.level}</div>
      </div>

      {/* Target Shield Bar */}
      {target.maxShield > 0 && (
        <div className="mb-1.5">
          <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
            <span className="text-[#2dd4bf]">SHIELD</span>
            <span className="tabular-nums">
              {Math.round(target.shield)} / {target.maxShield}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-[#2dd4bf] transition-all duration-75"
              style={{ width: `${shieldRatio * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Target Hull Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
          <span className="text-neutral-300">HULL</span>
          <span className="tabular-nums">
            {Math.round(target.hull)} / {target.maxHull}
          </span>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              hullRatio > 0.35 ? 'bg-neutral-200' : 'bg-red-500'
            }`}
            style={{ width: `${hullRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-neutral-400 border-t border-neutral-800/80 pt-1">
        <span>RANGE DISTANCE</span>
        <span className="text-[#ff8a1f] font-bold tabular-nums">{dist} u</span>
      </div>
    </div>
  );
};
