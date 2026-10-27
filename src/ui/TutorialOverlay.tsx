import React from 'react';
import { soundManager } from '../audio/SoundManager';

interface TutorialOverlayProps {
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
  const handleDismiss = () => {
    soundManager.playUiClick();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-lg bg-[#14171d] border border-[#ff8a1f] p-6 shadow-2xl text-[#eef0f4] font-mono">
        <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-4">
          <div className="w-2.5 h-5 bg-[#ff8a1f]" />
          <h2 className="text-base font-bold tracking-wider uppercase text-neutral-100">
            FLIGHT COMMAND // COMBAT BRIEFING
          </h2>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
          <div className="flex items-start space-x-3 bg-[#0e1015] p-3 border border-neutral-800">
            <span className="w-5 h-5 flex items-center justify-center bg-[#ff8a1f] text-black font-bold shrink-0 text-[11px]">
              1
            </span>
            <div>
              <div className="font-bold text-neutral-100 mb-0.5 uppercase tracking-wide">PILOTING & NAVIGATION</div>
              <p className="text-neutral-400">
                Left-click or tap anywhere in space to navigate. Your ship rotates towards the destination marker and smoothly decelerates upon arrival.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-[#0e1015] p-3 border border-neutral-800">
            <span className="w-5 h-5 flex items-center justify-center bg-[#ff8a1f] text-black font-bold shrink-0 text-[11px]">
              2
            </span>
            <div>
              <div className="font-bold text-neutral-100 mb-0.5 uppercase tracking-wide">TARGET LOCK-ON</div>
              <p className="text-neutral-400">
                Left-click or tap an enemy ship to acquire target lock. The targeting reticle displays target distance, shield and hull levels.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-[#0e1015] p-3 border border-neutral-800">
            <span className="w-5 h-5 flex items-center justify-center bg-[#ff8a1f] text-black font-bold shrink-0 text-[11px]">
              3
            </span>
            <div>
              <div className="font-bold text-neutral-100 mb-0.5 uppercase tracking-wide">COMBAT & WEAPONS</div>
              <p className="text-neutral-400">
                Press <span className="text-[#ff8a1f] font-bold">Space</span> or click <span className="text-[#ff8a1f] font-bold">Attack</span> to engage lasers within 600 range. Press <span className="text-[#ff8a1f] font-bold">R</span> to launch homing torpedoes within 900 range. Keys <span className="text-[#ff8a1f] font-bold">1/2/3</span> cycle ammo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 bg-[#ff8a1f] hover:bg-[#ff9d3f] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(255,138,31,0.3)]"
          >
            CONFIRM & COMMENCE PATROL
          </button>
        </div>
      </div>
    </div>
  );
};
