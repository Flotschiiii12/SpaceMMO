/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LocalGameClient } from './client/LocalGameClient';
import { CanvasRenderer } from './render/CanvasRenderer';
import { WorldState, GameCommand, SimEvent, AmmoType } from './sim/types';
import { soundManager } from './audio/SoundManager';
import { loadSave, saveGame, DEFAULT_SAVE_DATA } from './save/storage';
import { HUD } from './ui/HUD';
import { HangarModal } from './ui/HangarModal';
import { TutorialOverlay } from './ui/TutorialOverlay';
import { DebugPanel } from './ui/DebugPanel';
import { SettingsModal } from './ui/SettingsModal';
import { PlaceholderChat } from './ui/PlaceholderChat';
import { TitleScreen } from './ui/TitleScreen';
import { LogMessage } from './ui/EventLog';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHangar, setShowHangar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // HUD sync state (synced at ~15-20Hz to keep React lightweight)
  const [hudState, setHudState] = useState<WorldState | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [fps, setFps] = useState(60);
  const [tickTimeMs, setTickTimeMs] = useState(0);
  const [alphaVal, setAlphaVal] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clientRef = useRef<LocalGameClient | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const isPlayingRef = useRef(false);

  // Helper to append tactical log
  const addLog = useCallback((text: string, color?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev.slice(-20),
      { id: `${Date.now()}_${Math.random()}`, time: timeStr, text, color },
    ]);
  }, []);

  // Initialize Game
  useEffect(() => {
    const savedData = loadSave();
    setIsMuted(savedData.settings.soundMuted);
    soundManager.setMuted(savedData.settings.soundMuted);
    soundManager.setVolume(savedData.settings.volume);

    if (!savedData.tutorialSeen) {
      setShowTutorial(true);
    }

    // Create client
    const client = new LocalGameClient('map_1');

    // Hydrate player from save
    const rawState = client.getRawState();
    rawState.player.credits = savedData.player.credits;
    rawState.player.ore = savedData.player.ore;
    rawState.player.level = savedData.player.level;
    rawState.player.xp = savedData.player.xp;
    rawState.player.shipClass = savedData.player.shipClass;
    rawState.player.lasersEquipped = [...savedData.player.lasersEquipped];
    rawState.player.shieldEquipped = savedData.player.shieldEquipped;
    rawState.player.engineEquipped = savedData.player.engineEquipped;
    rawState.player.ammo = { ...savedData.player.ammo };

    clientRef.current = client;

    // Listen to simulation events
    const unsub = client.onEvent((evt: SimEvent) => {
      const renderer = rendererRef.current;

      switch (evt.type) {
        case 'LASER_FIRED':
          soundManager.playLaser(evt.ammo, evt.isPlayer);
          if (renderer && evt.isPlayer) {
            renderer.particles.emitHitSparks(evt.x, evt.y, 2, evt.color);
          }
          break;

        case 'ROCKET_FIRED':
          soundManager.playRocketLaunch(evt.isPlayer);
          break;

        case 'DAMAGE_DEALT': {
          const isShieldHit = evt.shieldDamage > 0;
          soundManager.playHit(isShieldHit, evt.isPlayerTarget);

          if (renderer) {
            if (isShieldHit) {
              renderer.particles.emitShieldImpact(evt.x, evt.y);
              renderer.floatingNumbers.spawnDamage(evt.x, evt.y, evt.shieldDamage, true, false);
            }
            if (evt.hullDamage > 0) {
              renderer.particles.emitHitSparks(evt.x, evt.y, 8, '#ff8a1f');
              renderer.floatingNumbers.spawnDamage(evt.x, evt.y, evt.hullDamage, false, evt.isCrit);
            }
            if (evt.isCrit || evt.isPlayerTarget) {
              renderer.camera.addShake(evt.isPlayerTarget ? 12 : 5, 0.25);
            }
          }
          break;
        }

        case 'ENTITY_DIED': {
          const isBoss = evt.name.toLowerCase().includes('warden');
          soundManager.playExplosion(isBoss || evt.isPlayer);

          if (renderer) {
            renderer.particles.emitExplosion(evt.x, evt.y, isBoss || evt.isPlayer);
            renderer.camera.addShake(isBoss || evt.isPlayer ? 18 : 8, 0.45);
          }

          if (evt.isPlayer) {
            addLog('HULL DESTROYED! Vessel reconstructed at home station.', '#ef4444');
          } else if (evt.killerId === 'player') {
            addLog(`Destroyed: ${evt.name}`, '#4ade80');
          }
          break;
        }

        case 'LOOT_COLLECTED':
          soundManager.playPickup(evt.kind);
          if (renderer) {
            const raw = clientRef.current?.getRawState();
            if (raw) {
              const label =
                evt.kind === 'credits'
                  ? `+${evt.value} C`
                  : evt.kind === 'ore'
                  ? `+${evt.value} ORE`
                  : `+${evt.value} ${evt.ammoType?.toUpperCase()}`;
              renderer.floatingNumbers.spawnText(raw.player.x, raw.player.y, label, '#eab308');
            }
          }
          break;

        case 'LEVEL_UP':
          soundManager.playLevelUp();
          addLog(`TACTICAL PROMOTION! Achieved Level ${evt.newLevel}`, '#ff8a1f');
          break;

        case 'MAP_JUMPED':
          soundManager.playPortalWarp();
          addLog(`Warp jump completed to ${evt.toMap.toUpperCase()}`, '#38bdf8');
          break;

        case 'PLAYER_RESPAWNED':
          addLog(`Salvage fee deducted: ${evt.creditsLost} C`, '#f59e0b');
          break;
      }
    });

    // Auto-save interval (every 5 seconds)
    const saveInterval = setInterval(() => {
      const raw = clientRef.current?.getRawState();
      if (raw) {
        saveGame({
          player: {
            level: raw.player.level,
            xp: raw.player.xp,
            credits: raw.player.credits,
            ore: raw.player.ore,
            shipClass: raw.player.shipClass,
            lasersEquipped: [...raw.player.lasersEquipped],
            shieldEquipped: raw.player.shieldEquipped,
            engineEquipped: raw.player.engineEquipped,
            ammo: { ...raw.player.ammo },
          },
        });
      }
    }, 5000);

    return () => {
      unsub();
      clearInterval(saveInterval);
      client.destroy();
    };
  }, [addLog]);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Render & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;
    let hudTimer = 0;

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      // FPS tracking
      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 0.5) {
        setFps(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      const client = clientRef.current;
      if (!client) return;

      // Update simulation if tab visible
      if (!document.hidden && isPlayingRef.current) {
        const t0 = performance.now();
        client.update(dt);
        const t1 = performance.now();
        setTickTimeMs(t1 - t0);
      }

      // Camera follow player
      const raw = client.getRawState();
      renderer.camera.follow(raw.player.x, raw.player.y, dt);

      // Update particles and floating numbers
      renderer.particles.update(dt);
      renderer.floatingNumbers.update(dt);

      // Render interpolated state
      const interpolatedState = client.getInterpolatedState(1.0);
      renderer.render(interpolatedState, 1.0, now / 1000);

      // Sync React HUD at ~15Hz
      hudTimer += dt;
      if (hudTimer >= 0.066) {
        hudTimer = 0;
        setHudState({ ...interpolatedState, player: { ...interpolatedState.player } });
        setAlphaVal(1.0);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      const targetAspect = 16 / 9;
      let w = windowW;
      let h = windowH;

      if (windowW / windowH > targetAspect) {
        h = windowH;
        w = Math.floor(windowH * targetAspect);
      } else {
        w = windowW;
        h = Math.floor(windowW / targetAspect);
      }

      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (rendererRef.current) {
        rendererRef.current.resize(1280, 720);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      if (e.key === 'F3') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (showHangar) setShowHangar(false);
        else if (showSettings) setShowSettings(false);
        else setShowSettings((prev) => !prev);
        return;
      }

      // Action bar keys
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        clientRef.current?.sendCommand({ type: 'TOGGLE_ATTACK' });
      } else if (e.key === '1') {
        clientRef.current?.sendCommand({ type: 'SELECT_AMMO', ammoType: 'x1' });
      } else if (e.key === '2') {
        clientRef.current?.sendCommand({ type: 'SELECT_AMMO', ammoType: 'x2' });
      } else if (e.key === '3') {
        clientRef.current?.sendCommand({ type: 'SELECT_AMMO', ammoType: 'x3' });
      } else if (e.key.toLowerCase() === 'r') {
        clientRef.current?.sendCommand({ type: 'FIRE_ROCKET' });
      } else if (e.key.toLowerCase() === 'h') {
        const raw = clientRef.current?.getRawState();
        if (raw?.player.inSafeZone) {
          setShowHangar((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showHangar, showSettings]);

  // Handle Canvas Mouse/Touch Input
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const client = clientRef.current;
    if (!canvas || !renderer || !client) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const worldCoord = renderer.camera.screenToWorld(screenX, screenY);
    const raw = client.getRawState();

    // Check if clicked an NPC to target
    let clickedNpc = null;
    for (const npc of raw.npcs) {
      if (npc.isDead) continue;
      const hitRadius = npc.npcType === 'warden' ? 70 : 38;
      const dist = Math.hypot(npc.x - worldCoord.wx, npc.y - worldCoord.wy);
      if (dist <= hitRadius) {
        clickedNpc = npc;
        break;
      }
    }

    if (clickedNpc) {
      // Lock target
      soundManager.playUiClick();
      client.sendCommand({ type: 'SET_TARGET', targetId: clickedNpc.id });
    } else {
      // Move to space coordinates
      client.sendCommand({ type: 'MOVE_TO', x: worldCoord.wx, y: worldCoord.wy });
    }
  };

  const handleSendCommand = (cmd: GameCommand) => {
    clientRef.current?.sendCommand(cmd);
  };

  const handleMinimapClick = (worldX: number, worldY: number) => {
    clientRef.current?.sendCommand({ type: 'MOVE_TO', x: worldX, y: worldY });
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    saveGame({ tutorialSeen: true });
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    saveGame({ settings: { soundMuted: next, volume: soundManager.getVolume() } });
  };

  const handleResetProgress = () => {
    setShowSettings(false);
    const client = clientRef.current;
    if (client) {
      const raw = client.getRawState();
      raw.player.credits = DEFAULT_SAVE_DATA.player.credits;
      raw.player.ore = DEFAULT_SAVE_DATA.player.ore;
      raw.player.level = DEFAULT_SAVE_DATA.player.level;
      raw.player.xp = DEFAULT_SAVE_DATA.player.xp;
      raw.player.shipClass = DEFAULT_SAVE_DATA.player.shipClass;
      raw.player.lasersEquipped = [...DEFAULT_SAVE_DATA.player.lasersEquipped];
      raw.player.shieldEquipped = DEFAULT_SAVE_DATA.player.shieldEquipped;
      raw.player.engineEquipped = DEFAULT_SAVE_DATA.player.engineEquipped;
      raw.player.ammo = { ...DEFAULT_SAVE_DATA.player.ammo };
      client.sendCommand({ type: 'SET_MAP', mapId: 'map_1', spawnX: 3000, spawnY: 1800 });
      client.sendCommand({ type: 'RESPAWN_PLAYER' });
    }
    addLog('Progress reset to factory parameters.', '#ef4444');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0b0e] flex items-center justify-center select-none">
      {/* 16:9 Canvas container */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onPointerDown={handlePointerDown}
          className="block cursor-crosshair bg-[#0a0b0e]"
          style={{ touchAction: 'none' }}
        />

        {/* Tactical React HUD */}
        {isPlaying && hudState && (
          <HUD
            world={hudState}
            logs={logs}
            onSendCommand={handleSendCommand}
            onOpenHangar={() => setShowHangar(true)}
            onOpenSettings={() => setShowSettings(true)}
            onMinimapClick={handleMinimapClick}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}
      </div>

      {/* Title Screen */}
      {!isPlaying && (
        <TitleScreen
          onStart={() => {
            setIsPlaying(true);
            addLog('Bastion Alpha departure authorized. Weapons online.', '#ff8a1f');
          }}
        />
      )}

      {/* Tutorial Overlay */}
      {isPlaying && showTutorial && <TutorialOverlay onDismiss={handleDismissTutorial} />}

      {/* Hangar Facility Modal */}
      {showHangar && hudState && (
        <HangarModal
          player={hudState.player}
          onSendCommand={handleSendCommand}
          onClose={() => setShowHangar(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* F3 Telemetry Panel */}
      {showDebug && hudState && (
        <DebugPanel
          world={hudState}
          fps={fps}
          tickTimeMs={tickTimeMs}
          alpha={alphaVal}
        />
      )}

      {/* Placeholder Sector Comms */}
      {isPlaying && <PlaceholderChat />}
    </div>
  );
}
