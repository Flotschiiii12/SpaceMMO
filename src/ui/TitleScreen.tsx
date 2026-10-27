import React, { useEffect } from 'react';
import { soundManager } from '../audio/SoundManager';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundManager.playUiClick();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#0a0b0e]/95 text-[#eef0f4] select-none font-mono">
      {/* Top telemetry bar */}
      <div className="w-full flex justify-between items-center text-xs text-neutral-500 border-b border-neutral-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-[#ff8a1f] animate-pulse" />
          <span className="tracking-widest">RUSTLINE SYSTEM PROTOCOL V1.0</span>
        </div>
        <div className="tracking-widest">SECTOR CLUSTER: ALPHA-09</div>
      </div>

      {/* Hero Centerpiece */}
      <div className="flex flex-col items-center text-center my-auto max-w-xl">
        {/* Bespoke inline SVG Logo */}
        <div className="mb-6">
          <svg width="220" height="70" viewBox="0 0 220 70" fill="none" className="mx-auto">
            {/* Hexagon & chevron symbol */}
            <path
              d="M35 10 L60 25 L60 55 L35 70 L10 55 L10 25 Z"
              stroke="#ff8a1f"
              strokeWidth="2.5"
              fill="#14171d"
            />
            <path d="M22 40 L35 22 L48 40" stroke="#ff8a1f" strokeWidth="3" strokeLinecap="round" />
            <circle cx="35" cy="45" r="3" fill="#ff8a1f" />

            {/* Wordmark RUSTLINE */}
            <text
              x="75"
              y="44"
              fill="#eef0f4"
              fontFamily="monospace, sans-serif"
              fontSize="28"
              fontWeight="900"
              letterSpacing="4"
            >
              RUSTLINE
            </text>
            <text
              x="78"
              y="59"
              fill="#ff8a1f"
              fontFamily="monospace, sans-serif"
              fontSize="9"
              fontWeight="700"
              letterSpacing="3"
            >
              2D TACTICAL SPACE COMBAT
            </text>
          </svg>
        </div>

        <p className="text-sm text-neutral-400 mb-8 max-w-md leading-relaxed">
          Pilot your combat chassis across contested star sectors. Acquire tactical targets, manage laser munitions, upgrade hardpoints, and navigate deep-space warp gates.
        </p>

        {/* Start CTA */}
        <button
          onClick={() => {
            soundManager.playUiClick();
            onStart();
          }}
          className="px-8 py-3.5 bg-[#ff8a1f] hover:bg-[#ff9d3f] text-black font-bold text-sm tracking-widest uppercase transition-all cursor-pointer shadow-[0_0_20px_rgba(255,138,31,0.35)] active:scale-98"
        >
          LAUNCH PATROL [ENTER / SPACE]
        </button>
      </div>

      {/* Flat control-hint footer */}
      <div className="w-full flex justify-center items-center text-xs text-neutral-500 border-t border-neutral-800 pt-3">
        <span>Click Move · Left-Click Lock Target · Space Laser · R Torpedo · H Hangar · Esc Menu · F3 Telemetry</span>
      </div>
    </div>
  );
};
