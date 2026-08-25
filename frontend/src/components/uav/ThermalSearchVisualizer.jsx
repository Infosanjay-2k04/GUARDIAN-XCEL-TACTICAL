import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Eye, Crosshair, Sparkles, AlertCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ThermalSearchVisualizer() {
  const { uav, thermal_vision } = useSystem();
  const canvasRef = useRef(null);

  const isLocked = uav.target_locked;
  const isSearching = uav.status === 'SEARCHING';
  const isFlying = uav.status !== 'STANDBY';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const renderThermalFeed = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now() / 1000;

      // 1. Base FLIR Thermal Background (Ironbow spectrum: Indigo -> Purple -> Red -> Amber -> White)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#060214'); // Cold ambient terrain ~12°C
      bgGrad.addColorStop(0.5, '#190633');
      bgGrad.addColorStop(1, '#340a4d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Terrain Heat Background Radiation / Environmental Noise
      ctx.fillStyle = 'rgba(74, 15, 99, 0.25)';
      for (let i = 0; i < 6; i++) {
        const nx = ((Math.sin(now * 0.15 + i * 2.1) + 1) / 2) * width;
        const ny = ((Math.cos(now * 0.2 + i * 1.7) + 1) / 2) * height;
        const r = 35 + i * 12;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Search Sweep Beam Animation (during SEARCHING mode)
      if (isSearching) {
        const sweepY = ((now * 120) % height);
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 15, 0, sweepY + 15);
        sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
        sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 15, width, 30);

        // Candidate Heat Anomaly Blips
        const candX = width * 0.45 + Math.sin(now * 2) * 60;
        const candY = height * 0.5 + Math.cos(now * 1.5) * 40;
        const candGrad = ctx.createRadialGradient(candX, candY, 1, candX, candY, 20);
        candGrad.addColorStop(0, '#ff9800');
        candGrad.addColorStop(0.6, '#e91e63');
        candGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = candGrad;
        ctx.beginPath();
        ctx.arc(candX, candY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Candidate Evaluation Tag
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(candX + 15, candY - 10, 130, 16);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1;
        ctx.strokeRect(candX + 15, candY - 10, 130, 16);
        ctx.fillStyle = '#ffb700';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('CANDIDATE: EVALUATING...', candX + 18, candY + 2);
      }

      // 4. Confirmed Human Heat Signature (when TARGET_LOCKED or Victim found)
      if (isLocked || uav.status === 'TARGET_LOCKED') {
        const targetX = width * 0.5 + Math.sin(now * 1.8) * 3;
        const targetY = height * 0.52 + Math.cos(now * 1.8) * 2;

        // Intense radiant human core heat (36.8°C)
        const heatGrad = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, 50);
        heatGrad.addColorStop(0, '#ffffff'); // 37°C Core White Hot
        heatGrad.addColorStop(0.25, '#fff59d'); // 34°C Yellow
        heatGrad.addColorStop(0.55, '#ff5722'); // 28°C Amber
        heatGrad.addColorStop(0.85, '#ad1457'); // 22°C Magenta
        heatGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 50, 0, Math.PI * 2);
        ctx.fill();

        // 5. AI Detection Bounding Box
        const boxW = 60;
        const boxH = 90;
        const boxX = targetX - boxW / 2;
        const boxY = targetY - boxH / 2;

        // Bounding Box
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Heavy Tactical Corner Brackets
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

        // AI Label Banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY - 24, 180, 20);
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY - 24, 180, 20);

        ctx.fillStyle = '#00ff9d';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`HUMAN_BIO_SIGNATURE [36.8°C]`, boxX + 4, boxY - 11);
        ctx.fillText(`CONF: ${uav.target_confidence || 97.6}% // LOCKED`, boxX + 4, boxY - 2);
      }

      // 6. HUD Center Reticle & Crosshairs
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cx - 24, cy);
      ctx.lineTo(cx - 6, cy);
      ctx.moveTo(cx + 6, cy);
      ctx.lineTo(cx + 24, cy);
      ctx.moveTo(cx, cy - 24);
      ctx.lineTo(cx, cy - 6);
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx, cy + 24);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.stroke();

      // Scanline Texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(renderThermalFeed);
    };

    renderThermalFeed();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [uav.status, uav.target_locked, isSearching, isLocked]);

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Eye className="w-4 h-4 text-tactical-cyan" />
          SIMULATED FLIR THERMAL-SEARCH VISUALIZATION
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-tactical-muted">PALETTE: IRONBOW</span>
          <StatusBadge
            status={isLocked ? 'TARGET_LOCKED' : isSearching ? 'SEARCHING' : isFlying ? 'EN_ROUTE_LKP' : 'STANDBY'}
            label={isLocked ? 'TARGET LOCK' : isSearching ? 'THERMAL SWEEP' : isFlying ? 'EN ROUTE' : 'STANDBY'}
            size="xs"
            pulse={isLocked || isSearching}
          />
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div className="relative w-full h-64 bg-black rounded overflow-hidden border border-tactical-border/80">
        <canvas
          ref={canvasRef}
          width={480}
          height={260}
          className="w-full h-full block"
        />

        {/* HUD Telemetry Top-Left */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300 bg-black/85 p-1.5 rounded border border-cyan-500/30 space-y-0.5 pointer-events-none">
          <div>SCAN STATE: {isLocked ? 'TARGET ACQUIRED' : isSearching ? 'ACTIVE SWEEP' : 'STANDBY'}</div>
          <div>GIMBAL PITCH: {thermal_vision.gimbal_pitch_deg}°</div>
          <div>OPTICAL ZOOM: {thermal_vision.zoom_level}X FLIR</div>
        </div>

        {/* HUD Telemetry Top-Right */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-amber-300 bg-black/85 p-1.5 rounded border border-amber-500/30 space-y-0.5 pointer-events-none text-right">
          <div>AMBIENT: {thermal_vision.ambient_temp_c}°C</div>
          <div className="text-white font-bold">
            PEAK TEMP: {isLocked ? '36.8°C (HUMAN)' : `${thermal_vision.max_detected_temp_c}°C`}
          </div>
          <div className={isLocked ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
            CONFIDENCE: {isLocked ? `${uav.target_confidence || 97.6}%` : isSearching ? '64.2%' : '0.0%'}
          </div>
        </div>

        {/* Temperature Scale Bar on Right */}
        <div className="absolute right-2 bottom-2 top-20 w-3 rounded overflow-hidden border border-slate-700 bg-gradient-to-t from-[#060214] via-[#ff5722] to-[#ffffff] pointer-events-none flex flex-col justify-between py-1 items-center text-[7px] font-mono font-bold text-black select-none">
          <span className="bg-white/90 px-0.5 rounded">38°</span>
          <span className="bg-white/90 px-0.5 rounded">14°</span>
        </div>
      </div>
    </div>
  );
}
