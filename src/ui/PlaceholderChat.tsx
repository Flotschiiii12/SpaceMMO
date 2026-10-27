import React, { useState } from 'react';

export const PlaceholderChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-3 right-4 z-30 select-none font-mono">
      {isOpen ? (
        <div className="w-64 bg-[#14171d]/95 border border-neutral-800 p-2 text-xs shadow-2xl flex flex-col h-44">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-1 mb-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">SECTOR COMMS [LOCAL]</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
            >
              [MINIMIZE]
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] text-neutral-400 pr-1">
            <div className="text-neutral-500 italic">[System] Sub-light relay link established.</div>
            <div>
              <span className="text-[#ff8a1f] font-bold">[Beacon Alpha]:</span> Sector Cradle safe zone online. All docking clamps responsive.
            </div>
            <div>
              <span className="text-neutral-300 font-bold">[Vanguard-7]:</span> Heavy pirate activity reported near Slagfield gate.
            </div>
            <div className="text-neutral-500 italic">[Comms daemon: Multi-pilot mesh available in full release]</div>
          </div>

          <div className="pt-1.5 border-t border-neutral-800 flex items-center">
            <input
              type="text"
              disabled
              placeholder="Chat disabled (Prototype)"
              className="w-full bg-[#0e1015] border border-neutral-800 px-2 py-0.5 text-[10px] text-neutral-600 cursor-not-allowed"
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="px-2.5 py-1 bg-[#14171d]/80 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-[10px] uppercase tracking-wider cursor-pointer font-mono backdrop-blur-xs"
        >
          COMMS [OFFLINE]
        </button>
      )}
    </div>
  );
};
