import React from 'react';
import { WorldState, GameCommand, ShipEntity } from '../sim/types';
import { Minimap } from './Minimap';
import { TargetPanel } from './TargetPanel';
import { ActionBar } from './ActionBar';
import { EventLog, LogMessage } from './EventLog';
import { MAPS } from '../data/maps';
import { soundManager } from '../audio/SoundManager';

interface HUDProps {
  world: WorldState;
  logs: LogMessage[];
  onSendCommand: (cmd: GameCommand) => void;
  onOpenHangar: () => void;
  onOpenSettings: () => void;
  onMinimapClick: (worldX: number, worldY: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  world,
  logs,
  onSendCommand,
  onOpenHangar,
  onOpenSettings,
  onMinimapClick,
  isMuted,
  onToggleMute,
}) => {
  const { player } = world;
  const currentMap = MAPS[world.mapId] || MAPS.map_1;
  const lockedTarget = player.targetId
    ? world.npcs.find((n) => n.id === player.targetId && !n.isDead) || null
    : null;

  const hullRatio = Math.max(0, Math.min(1, player.hull / player.maxHull));
  const shieldRatio = player.maxShield > 0 ? Math.max(0, Math.min(1, player.shield / player.maxShield)) : 0;
  const xpRatio = player.xpToNext > 0 ? Math.max(0, Math.min(1, player.xp / player.xpToNext)) : 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3.5 z-20 font-mono">
      {/* ================= TOP ROW ================= */}
      <div className="flex justify-between items-start pointer-events-auto">
        {/* Top-Left: Player status cluster */}
        <div className="bg-[#14171d]/90 border border-neutral-700 p-2.5 w-64 shadow-xl backdrop-blur-xs">
          {/* Pilot and level */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#ff8a1f]" />
              <span className="font-bold text-xs text-neutral-100">{player.name}</span>
            </div>
            <div className="text-[11px] text-[#ff8a1f] font-bold">LVL {player.level}</div>
          </div>

          {/* Shield Bar */}
          <div className="mb-1.5">
            <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
              <span className="text-[#2dd4bf] font-bold">SHIELD</span>
              <span className="tabular-nums">
                {Math.round(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-[#2dd4bf] transition-all duration-75"
                style={{ width: `${shieldRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Hull Bar */}
          <div className="mb-1.5">
            <div className="flex justify-between text-[10px] text-neutral-400 mb-0.5">
              <span className="text-neutral-200 font-bold">HULL</span>
              <span className="tabular-nums">
                {Math.round(player.hull)} / {player.maxHull}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  hullRatio > 0.35 ? 'bg-neutral-100' : 'bg-red-500'
                }`}
                style={{ width: `${hullRatio * 100}%` }}
              />
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-[9px] text-neutral-500 mb-0.5">
              <span>EXP</span>
              <span className="tabular-nums">
                {player.xp} / {player.xpToNext === Infinity ? 'MAX' : player.xpToNext}
              </span>
            </div>
            <div className="w-full h-1 bg-neutral-800/80 overflow-hidden">
              <div
                className="h-full bg-[#ff8a1f] transition-all duration-100"
                style={{ width: `${xpRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Safe zone indicator */}
          {player.inSafeZone && (
            <div className="mt-2 pt-1 border-t border-neutral-800 flex items-center justify-between text-[10px] text-[#2dd4bf]">
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 bg-[#2dd4bf] rounded-full mr-1.5 animate-pulse" />
                SAFE DOCKING ZONE
              </span>
              <span>NO COMBAT</span>
            </div>
          )}
        </div>

        {/* Top-Center: Sector details and Currencies */}
        <div className="flex flex-col items-center space-y-1">
          <div className="bg-[#14171d]/90 border border-neutral-700 px-4 py-1.5 shadow-xl backdrop-blur-xs flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500 text-[10px]">SECTOR</span>
              <span className="font-bold text-neutral-100 uppercase tracking-wider">{currentMap.name}</span>
            </div>

            <div className="w-[1px] h-3.5 bg-neutral-800" />

            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500 text-[10px]">CREDITS</span>
              <span className="text-[#fbbf24] font-bold tabular-nums">
                {player.credits.toLocaleString()} C
              </span>
            </div>

            <div className="w-[1px] h-3.5 bg-neutral-800" />

            <div className="flex items-center space-x-1.5">
              <span className="text-neutral-500 text-[10px]">ORE</span>
              <span className="text-[#2dd4bf] font-bold tabular-nums">
                {player.ore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Invulnerability banner */}
          {player.invulnerableTimer > 0 && (
            <div className="px-3 py-0.5 bg-blue-950/80 border border-blue-500/50 text-blue-300 text-[10px] uppercase tracking-wider font-bold animate-pulse">
              ENERGY DEFLECTOR SHIELD ACTIVE ({player.invulnerableTimer.toFixed(1)}s)
            </div>
          )}
        </div>

        {/* Top-Right: Minimap & Quick Settings */}
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-1 bg-[#14171d]/90 border border-neutral-700 p-1">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-1 text-neutral-400 hover:text-neutral-100 cursor-pointer"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onOpenSettings}
              title="System Settings"
              className="px-2 py-0.5 text-xs text-neutral-400 hover:text-neutral-100 cursor-pointer uppercase"
            >
              SYS
            </button>
          </div>
          <Minimap world={world} onMapClick={onMinimapClick} />
        </div>
      </div>

      {/* ================= MIDDLE ROW ================= */}
      <div className="flex justify-between items-center w-full">
        {/* Left-Center: Locked Target Panel */}
        <div className="pointer-events-auto">
          <TargetPanel target={lockedTarget} player={player} />
        </div>

        <div />
      </div>

      {/* ================= BOTTOM ROW ================= */}
      <div className="flex justify-between items-end w-full pointer-events-auto">
        {/* Bottom-Left: Combat Event Log */}
        <div className="pointer-events-none">
          <EventLog logs={logs} />
        </div>

        {/* Bottom-Center: Action Bar */}
        <div className="mx-auto pointer-events-auto pb-1">
          <ActionBar
            player={player}
            onSendCommand={onSendCommand}
            onOpenHangar={onOpenHangar}
          />
        </div>

        {/* Bottom-Right spacer */}
        <div className="w-72" />
      </div>

      {/* Player Death Overlay */}
      {player.isDead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/40 backdrop-blur-sm pointer-events-auto font-mono select-none">
          <div className="bg-[#14171d] border-2 border-red-600 p-8 max-w-md text-center shadow-2xl space-y-4">
            <div className="text-xl font-bold uppercase tracking-widest text-red-500 animate-pulse">
              HULL BREACH // VESSEL DESTROYED
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Tactical pod recovered by Bastion Alpha search-and-rescue. Hull reconstruction in progress.
            </p>
            <div className="text-xs text-amber-400">
              Penalty: 10% salvage levy deducted ({Math.round(player.credits * 0.1).toLocaleString()} C)
            </div>
            <div className="text-xs text-neutral-400 font-bold">
              Respawning at Sector 01 Home Station in {Math.ceil(player.deathTimer)}s...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
