import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Eye, Crosshair, Thermometer, ShieldAlert, Sparkles } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ThermalScanner() {
  const { uav, thermal_vision } = useSystem();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const renderThermalFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now() / 1000;

      // 1. Background Thermal Landscape (Ironbow palette: Deep Indigo/Purple -> Red -> Yellow -> White)
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0a041f'); // Cool background ~12°C
      grad.addColorStop(0.5, '#1e0840');
      grad.addColorStop(1, '#3b0d5c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Terrain Heat Textures / Subtle Noise
      ctx.fillStyle = 'rgba(74, 15, 99, 0.2)';
      for (let i = 0; i < 8; i++) {
        const nx = ((Math.sin(now * 0.2 + i * 2) + 1) / 2) * width;
        const ny = ((Math.cos(now * 0.3 + i * 1.5) + 1) / 2) * height;
        const r = 40 + i * 15;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Human Heat Signature (if UAV is searching or locked)
      if (uav.status === 'SEARCHING' || uav.status === 'TARGET_LOCKED' || uav.target_locked) {
        const targetX = width * 0.5 + (uav.target_locked ? Math.sin(now * 2) * 4 : Math.sin(now * 1.2) * 50);
        const targetY = height * 0.52 + (uav.target_locked ? Math.cos(now * 2) * 3 : Math.cos(now * 1.2) * 35);

        // Radiant Heat Glow
        const heatGrad = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, 45);
        heatGrad.addColorStop(0, '#ffffff'); // 37°C Core
        heatGrad.addColorStop(0.2, '#fff176'); // 34°C
        heatGrad.addColorStop(0.5, '#ff5722'); // 28°C
        heatGrad.addColorStop(0.8, '#d81b60'); // 22°C
        heatGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 45, 0, Math.PI * 2);
        ctx.fill();

        // 4. AI Target Bounding Box
        if (uav.target_locked || uav.status === 'TARGET_LOCKED') {
          const boxW = 55;
          const boxH = 80;
          const boxX = targetX - boxW / 2;
          const boxY = targetY - boxH / 2;

          // Bounding Box (Emerald Green)
          ctx.strokeStyle = '#00ff9d';
          ctx.lineWidth = 2;
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Corner Brackets
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(boxX, boxY + 12);
          ctx.lineTo(boxX, boxY);
          ctx.lineTo(boxX + 12, boxY);
          ctx.stroke();
          // Top-Right
          ctx.beginPath();
          ctx.moveTo(boxX + boxW - 12, boxY);
          ctx.lineTo(boxX + boxW, boxY);
          ctx.lineTo(boxX + boxW, boxY + 12);
          ctx.stroke();
          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(boxX, boxY + boxH - 12);
          ctx.lineTo(boxX, boxY + boxH);
          ctx.lineTo(boxX + 12, boxY + boxH);
          ctx.stroke();
          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(boxX + boxW - 12, boxY + boxH);
          ctx.lineTo(boxX + boxW, boxY + boxH);
          ctx.lineTo(boxX + boxW, boxY + boxH - 12);
          ctx.stroke();

          // AI Label Tag
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(boxX, boxY - 22, 160, 18);
          ctx.strokeStyle = '#00ff9d';
          ctx.lineWidth = 1;
          ctx.strokeRect(boxX, boxY - 22, 160, 18);

          ctx.fillStyle = '#00ff9d';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`HUMAN [36.8°C] 97.6% LOCK`, boxX + 4, boxY - 10);
        }
      }

      // 5. HUD Crosshair & Grid Lines
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;

      // Center reticle
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - 5, cy);
      ctx.moveTo(cx + 5, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy + 5);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Scan lines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(renderThermalFrame);
    };

    renderThermalFrame();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [uav.status, uav.target_locked]);

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 relative">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Eye className="w-4 h-4 text-tactical-cyan" />
          SYNTHETIC FLIR THERMAL SENSOR STREAM
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-tactical-muted">PALETTE: IRONBOW</span>
          <StatusBadge
            status={uav.target_locked ? 'TARGET_LOCKED' : uav.status}
            size="xs"
            pulse={uav.target_locked}
          />
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full h-64 bg-black rounded overflow-hidden border border-tactical-border/80">
        <canvas
          ref={canvasRef}
          width={480}
          height={260}
          className="w-full h-full block"
        />

        {/* Telemetry Overlays */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300 bg-black/80 p-1.5 rounded border border-cyan-500/30 space-y-0.5 pointer-events-none">
          <div>GIMBAL PITCH: {thermal_vision.gimbal_pitch_deg}°</div>
          <div>FOV ZOOM: {thermal_vision.zoom_level}X OPTICAL</div>
          <div>FRAME RATE: 30 FPS // RTK SYNC</div>
        </div>

        <div className="absolute top-2 right-2 text-[9px] font-mono text-amber-300 bg-black/80 p-1.5 rounded border border-amber-500/30 space-y-0.5 pointer-events-none text-right">
          <div>AMBIENT TEMP: {thermal_vision.ambient_temp_c}°C</div>
          <div className="text-white font-bold">MAX DETECTED: {thermal_vision.max_detected_temp_c}°C</div>
          <div className={uav.target_locked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
            {uav.target_locked ? 'BIO-SIGNATURE MATCH' : 'SCANNING MATRIX'}
          </div>
        </div>

        {/* Temperature Scale Bar on Right */}
        <div className="absolute right-2 bottom-2 top-20 w-3 rounded overflow-hidden border border-slate-700 bg-gradient-to-t from-[#0a041f] via-[#ff5722] to-[#ffffff] pointer-events-none flex flex-col justify-between py-1 items-center text-[7px] font-mono font-bold text-black select-none">
          <span className="bg-white/80 px-0.5 rounded">38°</span>
          <span className="bg-white/80 px-0.5 rounded">14°</span>
        </div>
      </div>
    </div>
  );
}
