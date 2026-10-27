import React from 'react';
import { ShipEntity, AmmoType, GameCommand } from '../sim/types';
import { soundManager } from '../audio/SoundManager';

interface ActionBarProps {
  player: ShipEntity;
  onSendCommand: (cmd: GameCommand) => void;
  onOpenHangar: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ player, onSendCommand, onOpenHangar }) => {
  const handleToggleAttack = () => {
    soundManager.playUiClick();
    onSendCommand({ type: 'TOGGLE_ATTACK' });
  };

  const handleCycleAmmo = () => {
    soundManager.playUiClick();
    const cycleMap: Record<AmmoType, AmmoType> = {
      basic: 'x1',
      x1: 'x2',
      x2: 'x3',
      x3: 'x1',
    };
    onSendCommand({ type: 'SELECT_AMMO', ammoType: cycleMap[player.activeAmmo] });
  };

  const handleFireRocket = () => {
    if (player.rocketCooldown <= 0 && player.ammo.rocket > 0 && player.targetId) {
      soundManager.playUiClick();
      onSendCommand({ type: 'FIRE_ROCKET' });
    }
  };

  const handleRepair = () => {
    if (player.inSafeZone) {
      soundManager.playUiClick();
      onSendCommand({ type: 'REPAIR_SHIP' });
    }
  };

  const rocketCooldownPct = player.rocketCooldown > 0 ? player.rocketCooldown / 4.0 : 0;
  const currentAmmoCount = player.activeAmmo === 'basic' ? '∞' : player.ammo[player.activeAmmo];

  return (
    <div className="flex items-center space-x-2 bg-[#14171d]/90 border border-neutral-700 p-1.5 shadow-2xl backdrop-blur-xs select-none font-mono">
      {/* 1. Attack Toggle */}
      <button
        onClick={handleToggleAttack}
        disabled={player.inSafeZone || player.isDead}
        className={`relative px-4 py-2 flex flex-col items-center justify-center border transition-all cursor-pointer min-w-[72px] ${
          player.isAttacking
            ? 'bg-[#ff8a1f] text-black border-[#ff8a1f] font-bold shadow-[0_0_12px_rgba(255,138,31,0.4)]'
            : player.inSafeZone
            ? 'bg-neutral-900/50 text-neutral-600 border-neutral-800 cursor-not-allowed'
            : 'bg-[#1a1f29] text-neutral-200 border-neutral-700 hover:border-[#ff8a1f]'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider">
          {player.isAttacking ? 'ATTACKING' : 'ATTACK'}
        </span>
        <span className="text-[9px] opacity-70 tracking-widest">[SPACE]</span>
      </button>

      {/* 2. Laser Ammo Selector */}
      <button
        onClick={handleCycleAmmo}
        className="px-3.5 py-2 flex flex-col items-center justify-center bg-[#1a1f29] border border-neutral-700 hover:border-[#ff8a1f] text-neutral-200 transition-all cursor-pointer min-w-[68px]"
      >
        <div className="flex items-center space-x-1">
          <span className="text-xs font-bold text-[#ff8a1f] uppercase">{player.activeAmmo.toUpperCase()}</span>
          <span className="text-[10px] text-neutral-400">AMMO</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-bold tabular-nums">
          {typeof currentAmmoCount === 'number' ? currentAmmoCount.toLocaleString() : currentAmmoCount} [1-3]
        </span>
      </button>

      {/* 3. Rocket Torpedo */}
      <button
        onClick={handleFireRocket}
        disabled={player.rocketCooldown > 0 || player.ammo.rocket <= 0 || !player.targetId || player.inSafeZone}
        className={`relative px-3.5 py-2 flex flex-col items-center justify-center border transition-all min-w-[68px] overflow-hidden ${
          player.rocketCooldown > 0 || player.ammo.rocket <= 0 || !player.targetId || player.inSafeZone
            ? 'bg-neutral-900/50 text-neutral-600 border-neutral-800 cursor-not-allowed'
            : 'bg-[#1a1f29] text-neutral-200 border-neutral-700 hover:border-[#ff8a1f] cursor-pointer'
        }`}
      >
        {/* Cooldown sweep overlay */}
        {rocketCooldownPct > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#ff8a1f]/20 pointer-events-none transition-all duration-75"
            style={{ height: `${rocketCooldownPct * 100}%` }}
          />
        )}
        <div className="flex items-center space-x-1">
          <span className="text-xs font-bold uppercase">ROCKET</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-bold tabular-nums">
          {player.rocketCooldown > 0
            ? `${player.rocketCooldown.toFixed(1)}s`
            : `${player.ammo.rocket} [R]`}
        </span>
      </button>

      {/* Separator */}
      <div className="w-[1px] h-8 bg-neutral-800" />

      {/* 4. Repair (Safe Zone Only) */}
      <button
        onClick={handleRepair}
        disabled={!player.inSafeZone || player.hull >= player.maxHull}
        className={`px-3 py-2 flex flex-col items-center justify-center border text-xs uppercase tracking-wider transition-all min-w-[64px] ${
          player.inSafeZone && player.hull < player.maxHull
            ? 'bg-[#102324] border-[#2dd4bf] text-[#2dd4bf] hover:bg-[#163032] cursor-pointer font-bold'
            : 'bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed'
        }`}
      >
        <span>REPAIR</span>
        <span className="text-[9px] opacity-70">{player.inSafeZone ? 'FAST' : 'DOCK REQ'}</span>
      </button>

      {/* 5. Hangar (Safe Zone Only) */}
      <button
        onClick={() => {
          soundManager.playUiClick();
          onOpenHangar();
        }}
        disabled={!player.inSafeZone}
        className={`px-3.5 py-2 flex flex-col items-center justify-center border text-xs uppercase tracking-wider transition-all min-w-[64px] ${
          player.inSafeZone
            ? 'bg-[#261f18] border-[#ff8a1f] text-[#ff8a1f] hover:bg-[#342a20] cursor-pointer font-bold shadow-[0_0_8px_rgba(255,138,31,0.2)]'
            : 'bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed'
        }`}
      >
        <span>HANGAR</span>
        <span className="text-[9px] opacity-70">[H]</span>
      </button>
    </div>
  );
};
