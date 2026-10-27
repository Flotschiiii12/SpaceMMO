import React, { useState } from 'react';
import { ShipEntity, ShipClass } from '../sim/types';
import { SHIPS } from '../data/ships';
import { LASER_ITEMS, SHIELD_ITEMS, ENGINE_ITEMS, AMMO_OPTIONS, AMMO_DAMAGE_MULTIPLIER } from '../data/items';
import { GameCommand } from '../sim/types';

interface HangarModalProps {
  player: ShipEntity;
  onSendCommand: (cmd: GameCommand) => void;
  onClose: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({ player, onSendCommand, onClose }) => {
  const [tab, setTab] = useState<'ships' | 'equipment' | 'munitions' | 'stats'>('ships');

  const currentChassis = SHIPS[player.shipClass] || SHIPS.scout;

  // Calculate DPS
  let totalDps = 0;
  for (const laserId of player.lasersEquipped) {
    if (laserId && LASER_ITEMS[laserId]) {
      totalDps += LASER_ITEMS[laserId].damage * LASER_ITEMS[laserId].fireRate;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[700px] flex flex-col bg-[#14171d] border border-neutral-700 text-[#eef0f4] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#0e1015]">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-6 bg-[#ff8a1f]" />
            <div>
              <h2 className="text-lg font-bold tracking-wider uppercase font-mono">
                BASTION ALPHA // HANGAR FACILITY
              </h2>
              <p className="text-xs text-neutral-400">SAFE DOCK STATION · SHIPWRIGHT & MUNITIONS</p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm font-mono">
            <div>
              <span className="text-neutral-500 text-xs mr-2">CREDITS</span>
              <span className="text-[#fbbf24] font-bold">{player.credits.toLocaleString()} C</span>
            </div>
            <div>
              <span className="text-neutral-500 text-xs mr-2">ORE</span>
              <span className="text-[#2dd4bf] font-bold">{player.ore.toLocaleString()} UNITS</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs uppercase tracking-wider font-mono cursor-pointer border border-neutral-600"
            >
              EXIT [ESC]
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-neutral-800 bg-[#161a22] text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setTab('ships')}
            className={`px-6 py-3 border-r border-neutral-800 transition-colors cursor-pointer ${
              tab === 'ships'
                ? 'bg-[#14171d] text-[#ff8a1f] border-b-2 border-b-[#ff8a1f] font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            HULL CHASSIS
          </button>
          <button
            onClick={() => setTab('equipment')}
            className={`px-6 py-3 border-r border-neutral-800 transition-colors cursor-pointer ${
              tab === 'equipment'
                ? 'bg-[#14171d] text-[#ff8a1f] border-b-2 border-b-[#ff8a1f] font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            HARDPOINTS & OUTFITTING
          </button>
          <button
            onClick={() => setTab('munitions')}
            className={`px-6 py-3 border-r border-neutral-800 transition-colors cursor-pointer ${
              tab === 'munitions'
                ? 'bg-[#14171d] text-[#ff8a1f] border-b-2 border-b-[#ff8a1f] font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            MUNITIONS RESUPPLY
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`px-6 py-3 transition-colors cursor-pointer ${
              tab === 'stats'
                ? 'bg-[#14171d] text-[#ff8a1f] border-b-2 border-b-[#ff8a1f] font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            TELEMETRY & STATS
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {tab === 'ships' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(Object.keys(SHIPS) as ShipClass[]).map((shipKey) => {
                const s = SHIPS[shipKey];
                const isEquipped = player.shipClass === shipKey;
                const canAfford = player.credits >= s.costCredits && player.ore >= s.costOre;

                return (
                  <div
                    key={s.id}
                    className={`border p-5 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-[#ff8a1f] bg-[#1a1f29]'
                        : 'border-neutral-800 bg-[#12151c] hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-mono text-[#ff8a1f] tracking-wider">
                          {s.id === 'bulwark' ? 'HEAVY CAPITAL' : s.id === 'corsair' ? 'MEDIUM FIGHTER' : 'LIGHT RECON'}
                        </span>
                        {isEquipped && (
                          <span className="text-[10px] bg-[#ff8a1f]/20 text-[#ff8a1f] border border-[#ff8a1f]/40 px-1.5 py-0.5 font-mono">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold font-mono tracking-wide mb-2">{s.name}</h3>
                      <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{s.description}</p>

                      <div className="space-y-1.5 text-xs font-mono border-t border-neutral-800/80 pt-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">BASE HULL</span>
                          <span className="text-neutral-300 font-bold">{s.hull}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">BASE SHIELD</span>
                          <span className="text-neutral-300 font-bold">{s.shield}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">TOP SPEED</span>
                          <span className="text-neutral-300 font-bold">{s.maxSpeed} u/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">LASER SLOTS</span>
                          <span className="text-[#ff8a1f] font-bold">{s.laserSlots}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between py-2 border-t border-neutral-800 text-xs font-mono">
                        <span className="text-neutral-400">COST</span>
                        <div className="text-right">
                          <span className="text-[#fbbf24] font-bold">{s.costCredits.toLocaleString()} C</span>
                          {s.costOre > 0 && <span className="text-[#2dd4bf] ml-2 font-bold">{s.costOre} ORE</span>}
                        </div>
                      </div>

                      <button
                        disabled={isEquipped || (!canAfford && s.costCredits > 0)}
                        onClick={() => onSendCommand({ type: 'BUY_SHIP', shipId: s.id })}
                        className={`w-full py-2.5 mt-2 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                          isEquipped
                            ? 'bg-neutral-800 text-neutral-500 cursor-default'
                            : canAfford
                            ? 'bg-[#ff8a1f] text-black hover:bg-[#ff9d3f] cursor-pointer'
                            : 'bg-neutral-800/50 text-neutral-600 cursor-not-allowed border border-neutral-800'
                        }`}
                      >
                        {isEquipped ? 'MOUNTED' : canAfford ? 'PURCHASE & DOCK' : 'INSUFFICIENT FUNDS'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'equipment' && (
            <div className="space-y-6">
              {/* Laser Hardpoints Outfitting */}
              <div>
                <h3 className="text-xs uppercase font-mono tracking-wider text-[#ff8a1f] mb-3 flex items-center">
                  <span className="w-1.5 h-3 bg-[#ff8a1f] mr-2" />
                  LASER HARDPOINTS ({player.lasersEquipped.filter(Boolean).length}/{currentChassis.laserSlots} SLOTS)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {Array.from({ length: currentChassis.laserSlots }).map((_, idx) => {
                    const equippedId = player.lasersEquipped[idx];
                    const item = equippedId ? LASER_ITEMS[equippedId] : null;

                    return (
                      <div key={idx} className="border border-neutral-800 bg-[#12151c] p-3">
                        <div className="flex justify-between items-center text-xs font-mono text-neutral-500 mb-1">
                          <span>HARDPOINT #{idx + 1}</span>
                          {item && (
                            <button
                              onClick={() => onSendCommand({ type: 'EQUIP_ITEM', slotType: 'laser', slotIndex: idx, itemId: null })}
                              className="text-red-400 hover:text-red-300 text-[10px] cursor-pointer"
                            >
                              UNEQUIP
                            </button>
                          )}
                        </div>
                        {item ? (
                          <div>
                            <div className="font-mono text-sm font-bold text-neutral-200">{item.name}</div>
                            <div className="text-xs text-neutral-400 font-mono mt-1">
                              DMG: <span className="text-[#ff8a1f] font-bold">{item.damage}</span> · RNG: {item.range}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-600 font-mono italic py-2">EMPTY HARDPOINT</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Laser Shop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(LASER_ITEMS).map((item) => {
                    const canAfford = player.credits >= item.costCredits && player.ore >= item.costOre;
                    return (
                      <div key={item.id} className="border border-neutral-800 bg-[#0e1015] p-3 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold text-neutral-300">{item.name}</div>
                          <div className="text-xs text-neutral-400 font-mono mt-1">
                            {item.damage} DMG/s · Range {item.range}
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                          <div className="text-xs font-mono">
                            <span className="text-[#fbbf24]">{item.costCredits.toLocaleString()} C</span>
                            {item.costOre > 0 && <span className="text-[#2dd4bf] ml-1.5">{item.costOre} ORE</span>}
                          </div>
                          <button
                            disabled={!canAfford}
                            onClick={() => onSendCommand({ type: 'BUY_ITEM', itemId: item.id })}
                            className={`px-3 py-1 text-xs font-mono uppercase font-bold cursor-pointer ${
                              canAfford
                                ? 'bg-[#ff8a1f] text-black hover:bg-[#ff9d3f]'
                                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                            }`}
                          >
                            BUY
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Defense & Propulsion Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                {/* Shield Generators */}
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-[#2dd4bf] mb-3 flex items-center">
                    <span className="w-1.5 h-3 bg-[#2dd4bf] mr-2" />
                    SHIELD GENERATOR (EQUIPPED:{' '}
                    {player.shieldEquipped ? SHIELD_ITEMS[player.shieldEquipped]?.name : 'NONE'})
                  </h3>
                  <div className="space-y-2">
                    {Object.values(SHIELD_ITEMS).map((item) => {
                      const isEquipped = player.shieldEquipped === item.id;
                      const canAfford = player.credits >= item.costCredits && player.ore >= item.costOre;
                      return (
                        <div
                          key={item.id}
                          className={`border p-3 flex items-center justify-between ${
                            isEquipped ? 'border-[#2dd4bf] bg-[#102324]' : 'border-neutral-800 bg-[#0e1015]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-mono font-bold text-neutral-200">{item.name}</div>
                            <div className="text-xs text-neutral-400 font-mono">
                              +{item.capacity} CAP · +{item.regenRate}/s REGEN
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-xs font-mono text-right">
                              <div className="text-[#fbbf24]">{item.costCredits.toLocaleString()} C</div>
                              {item.costOre > 0 && <div className="text-[#2dd4bf]">{item.costOre} ORE</div>}
                            </div>
                            <button
                              disabled={isEquipped || !canAfford}
                              onClick={() => onSendCommand({ type: 'BUY_ITEM', itemId: item.id })}
                              className={`px-3 py-1 text-xs font-mono uppercase font-bold ${
                                isEquipped
                                  ? 'bg-neutral-800 text-neutral-500'
                                  : canAfford
                                  ? 'bg-[#2dd4bf] text-black hover:bg-[#5eead4] cursor-pointer'
                                  : 'bg-neutral-800 text-neutral-600'
                              }`}
                            >
                              {isEquipped ? 'EQUIPPED' : 'INSTALL'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Propulsion Thrusters */}
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider text-[#f59e0b] mb-3 flex items-center">
                    <span className="w-1.5 h-3 bg-[#f59e0b] mr-2" />
                    PROPULSION ENGINES (EQUIPPED:{' '}
                    {player.engineEquipped ? ENGINE_ITEMS[player.engineEquipped]?.name : 'STOCK'})
                  </h3>
                  <div className="space-y-2">
                    {Object.values(ENGINE_ITEMS).map((item) => {
                      const isEquipped = player.engineEquipped === item.id;
                      const canAfford = player.credits >= item.costCredits && player.ore >= item.costOre;
                      return (
                        <div
                          key={item.id}
                          className={`border p-3 flex items-center justify-between ${
                            isEquipped ? 'border-[#f59e0b] bg-[#221a0f]' : 'border-neutral-800 bg-[#0e1015]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-mono font-bold text-neutral-200">{item.name}</div>
                            <div className="text-xs text-neutral-400 font-mono">
                              +{item.speedBonus} TOP SPD · +{item.turnBonus} YAW
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-xs font-mono text-right">
                              <div className="text-[#fbbf24]">{item.costCredits.toLocaleString()} C</div>
                              {item.costOre > 0 && <div className="text-[#2dd4bf]">{item.costOre} ORE</div>}
                            </div>
                            <button
                              disabled={isEquipped || !canAfford}
                              onClick={() => onSendCommand({ type: 'BUY_ITEM', itemId: item.id })}
                              className={`px-3 py-1 text-xs font-mono uppercase font-bold ${
                                isEquipped
                                  ? 'bg-neutral-800 text-neutral-500'
                                  : canAfford
                                  ? 'bg-[#f59e0b] text-black hover:bg-[#fbbf24] cursor-pointer'
                                  : 'bg-neutral-800 text-neutral-600'
                              }`}
                            >
                              {isEquipped ? 'EQUIPPED' : 'INSTALL'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'munitions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AMMO_OPTIONS.map((opt) => {
                const canAfford = player.credits >= opt.costCredits && player.ore >= opt.costOre;
                const currentStock = player.ammo[opt.type];

                return (
                  <div key={opt.type} className="border border-neutral-800 bg-[#12151c] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold font-mono text-neutral-200">{opt.name}</span>
                        <span className="text-xs font-mono text-[#ff8a1f] font-bold">
                          STOCK: {currentStock.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mb-3">{opt.description}</p>
                      <div className="text-xs font-mono text-neutral-500">
                        PACK SIZE: <span className="text-neutral-300 font-bold">+{opt.count}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <div className="text-xs font-mono">
                        <span className="text-[#fbbf24] font-bold">{opt.costCredits} C</span>
                        {opt.costOre > 0 && <span className="text-[#2dd4bf] ml-2 font-bold">{opt.costOre} ORE</span>}
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onSendCommand({ type: 'BUY_AMMO', ammoType: opt.type, count: opt.count })}
                        className={`px-4 py-1.5 text-xs font-mono uppercase font-bold cursor-pointer ${
                          canAfford
                            ? 'bg-[#ff8a1f] text-black hover:bg-[#ff9d3f]'
                            : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        REPLENISH (+{opt.count})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-neutral-800 bg-[#12151c] p-4">
                  <span className="text-xs font-mono text-neutral-500 block mb-1">COMBINED LASER DPS</span>
                  <span className="text-2xl font-bold font-mono text-[#ff8a1f]">{totalDps.toFixed(0)}</span>
                  <span className="text-[10px] text-neutral-400 block mt-1">At 100% nominal ammo efficiency</span>
                </div>

                <div className="border border-neutral-800 bg-[#12151c] p-4">
                  <span className="text-xs font-mono text-neutral-500 block mb-1">EFFECTIVE HULL</span>
                  <span className="text-2xl font-bold font-mono text-neutral-200">{player.maxHull}</span>
                  <span className="text-[10px] text-neutral-400 block mt-1">Level bonus: +{(player.level - 1) * 60} HP</span>
                </div>

                <div className="border border-neutral-800 bg-[#12151c] p-4">
                  <span className="text-xs font-mono text-neutral-500 block mb-1">MAX SHIELD CAPACITY</span>
                  <span className="text-2xl font-bold font-mono text-[#2dd4bf]">{player.maxShield}</span>
                  <span className="text-[10px] text-neutral-400 block mt-1">Regen: +{player.shieldRegenRate.toFixed(0)}/s</span>
                </div>

                <div className="border border-neutral-800 bg-[#12151c] p-4">
                  <span className="text-xs font-mono text-neutral-500 block mb-1">MAX FLIGHT VELOCITY</span>
                  <span className="text-2xl font-bold font-mono text-[#f59e0b]">{player.maxSpeed}</span>
                  <span className="text-[10px] text-neutral-400 block mt-1">Yaw agility: {player.turnRate.toFixed(1)} rad/s</span>
                </div>
              </div>

              {/* Combat Rules breakdown */}
              <div className="border border-neutral-800 bg-[#12151c] p-5 font-mono text-xs text-neutral-300 space-y-2">
                <div className="text-xs font-bold uppercase text-[#ff8a1f] tracking-wider mb-2">TACTICAL PROTOCOLS</div>
                <div>• <span className="text-neutral-100 font-bold">Shield Absorption:</span> While shield &gt; 0, 80% of damage is absorbed by shield and 20% leaks into hull. Depleted shield transfers 100% impact directly to hull.</div>
                <div>• <span className="text-neutral-100 font-bold">Shield Recovery:</span> Recharging commences after 8.0 seconds of avoiding hostile damage.</div>
                <div>• <span className="text-neutral-100 font-bold">Laser Range:</span> 600 units with 1.0s cycle time. Triple ammo provides 3.0x damage per volley.</div>
                <div>• <span className="text-neutral-100 font-bold">Torpedo Ordnance:</span> 900 units effective range, 4.0s launcher cycle, with 1.5s active seeker steering.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
