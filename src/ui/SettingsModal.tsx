import React, { useState } from 'react';
import { soundManager } from '../audio/SoundManager';
import { resetGameSave } from '../save/storage';

interface SettingsModalProps {
  onClose: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onResetProgress }) => {
  const [muted, setMutedState] = useState(soundManager.getMuted());
  const [volume, setVolumeState] = useState(soundManager.getVolume());
  const [confirmReset, setConfirmReset] = useState(false);

  const handleToggleMute = () => {
    const next = !muted;
    setMutedState(next);
    soundManager.setMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    soundManager.setVolume(val);
  };

  const handleReset = () => {
    resetGameSave();
    onResetProgress();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="relative w-full max-w-md bg-[#14171d] border border-neutral-700 p-6 shadow-2xl text-[#eef0f4] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-5 bg-[#ff8a1f]" />
            <h2 className="text-base font-bold tracking-wider uppercase text-neutral-100">
              SYSTEM CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer font-mono"
          >
            [CLOSE]
          </button>
        </div>

        {/* Audio settings */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-neutral-300">MASTER AUDIO</span>
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1 text-xs uppercase font-bold cursor-pointer border ${
                muted
                  ? 'border-neutral-700 bg-neutral-800 text-neutral-400'
                  : 'border-[#ff8a1f] bg-[#ff8a1f]/20 text-[#ff8a1f]'
              }`}
            >
              {muted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>VOLUME LEVEL</span>
              <span className="tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              disabled={muted}
              onChange={handleVolumeChange}
              className="w-full accent-[#ff8a1f] cursor-pointer"
            />
          </div>
        </div>

        {/* Controls reference */}
        <div className="border-t border-neutral-800 pt-4 mb-6">
          <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-2">
            FLIGHT CONTROL DIRECTIVES
          </span>
          <div className="space-y-1.5 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>MOVE / NAVIGATE</span>
              <span className="text-neutral-200">LEFT CLICK / TAP SPACE</span>
            </div>
            <div className="flex justify-between">
              <span>ACQUIRE TARGET</span>
              <span className="text-neutral-200">CLICK / TAP ENEMY</span>
            </div>
            <div className="flex justify-between">
              <span>TOGGLE LASER BATTERY</span>
              <span className="text-neutral-200">SPACEBAR</span>
            </div>
            <div className="flex justify-between">
              <span>CYCLE AMMUNITION</span>
              <span className="text-neutral-200">KEYS 1, 2, 3</span>
            </div>
            <div className="flex justify-between">
              <span>FIRE HOMING TORPEDO</span>
              <span className="text-neutral-200">KEY R</span>
            </div>
            <div className="flex justify-between">
              <span>DOCK AT HANGAR</span>
              <span className="text-neutral-200">KEY H (SAFE ZONE)</span>
            </div>
            <div className="flex justify-between">
              <span>TELEMETRY PANEL</span>
              <span className="text-neutral-200">KEY F3</span>
            </div>
          </div>
        </div>

        {/* Progress Reset */}
        <div className="border-t border-neutral-800 pt-4 flex flex-col space-y-3">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              RESET PROFILE PROGRESS
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-red-400 text-center font-bold">
                CONFIRM WIPE ALL CREDITS, ORE & UPGRADES?
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-black text-xs uppercase font-bold cursor-pointer"
                >
                  YES, REINITIALIZE
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs uppercase font-bold cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
