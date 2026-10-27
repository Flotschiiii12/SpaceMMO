import React, { useRef, useEffect } from 'react';
import { WorldState } from '../sim/types';

interface MinimapProps {
  world: WorldState;
  onMapClick?: (worldX: number, worldY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ world, onMapClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / world.mapWidth;
    const scaleY = h / world.mapHeight;

    // Background radar
    ctx.fillStyle = 'rgba(20, 23, 29, 0.9)';
    ctx.fillRect(0, 0, w, h);

    // Subtle radar grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Map boundary border
    ctx.strokeStyle = 'rgba(255, 138, 31, 0.4)';
    ctx.strokeRect(0, 0, w, h);

    // Safe zone
    if (world.homeStation) {
      ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)';
      ctx.beginPath();
      ctx.arc(
        world.homeStation.x * scaleX,
        world.homeStation.y * scaleY,
        world.homeStation.radius * scaleX,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    }

    // Portals
    ctx.fillStyle = '#38bdf8';
    for (const portal of world.portals) {
      const px = portal.x * scaleX;
      const py = portal.y * scaleY;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Loot boxes
    ctx.fillStyle = '#eab308';
    for (const loot of world.lootBoxes) {
      ctx.fillRect(loot.x * scaleX - 1, loot.y * scaleY - 1, 2, 2);
    }

    // NPCs
    for (const npc of world.npcs) {
      if (npc.isDead) continue;
      const nx = npc.x * scaleX;
      const ny = npc.y * scaleY;

      if (npc.npcType === 'warden') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(nx, ny, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.npcType === 'drifter') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(nx - 1.5, ny - 1.5, 3, 3);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(nx - 1.5, ny - 1.5, 3, 3);
      }
    }

    // Player
    if (!world.player.isDead) {
      const px = world.player.x * scaleX;
      const py = world.player.y * scaleY;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(world.player.rotation);
      ctx.fillStyle = '#ff8a1f';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }, [world]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMapClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const worldX = (clickX / rect.width) * world.mapWidth;
    const worldY = (clickY / rect.height) * world.mapHeight;
    onMapClick(worldX, worldY);
  };

  return (
    <div className="relative group border border-neutral-700 bg-[#14171d]/90 shadow-lg select-none">
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-neutral-800 text-[10px] tracking-wider text-neutral-400 font-mono">
        <span>SECTOR RADAR</span>
        <span className="text-[#ff8a1f]">6000x3600</span>
      </div>
      <canvas
        ref={canvasRef}
        width={180}
        height={108}
        onClick={handleClick}
        className="block cursor-crosshair"
      />
    </div>
  );
};
