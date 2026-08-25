import React, { useRef, useEffect, useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Eye, Crosshair, Sparkles, AlertCircle, Volume2, VolumeX, Layers } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ThermalSearchVisualizer() {
  const { uav, thermal_vision, tourist, active_incident } = useSystem();
  const canvasRef = useRef(null);
  const [palette, setPalette] = useState('IRONBOW'); // IRONBOW, WHITE_HOT, BLACK_HOT
  const [audioMuted, setAudioMuted] = useState(false);

  const isLocked = uav.target_locked;
  const isSearching = uav.status === 'SEARCHING';
  const isFlying = uav.status !== 'STANDBY';

  const targetLat = active_incident?.target_lat || active_incident?.lkp_lat || tourist.current_lat;
  const targetLon = active_incident?.target_lon || active_incident?.lkp_lon || tourist.current_lon;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const renderThermalFeed = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now() / 1000;

      // 1. Base FLIR Thermal Background Gradient based on chosen palette
      let bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (palette === 'IRONBOW') {
        bgGrad.addColorStop(0, '#060214'); // Cool terrain ~18°C
        bgGrad.addColorStop(0.5, '#190633');
        bgGrad.addColorStop(1, '#340a4d');
      } else if (palette === 'WHITE_HOT') {
        bgGrad.addColorStop(0, '#111111'); // Dark is cold
        bgGrad.addColorStop(0.5, '#222222');
        bgGrad.addColorStop(1, '#333333');
      } else { // BLACK_HOT
        bgGrad.addColorStop(0, '#e5e5e5'); // Bright is cold
        bgGrad.addColorStop(0.5, '#cccccc');
        bgGrad.addColorStop(1, '#b3b3b3');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Terrain Heat Background Noise (18°C - 24°C variation)
      const noiseColor = palette === 'IRONBOW' 
        ? 'rgba(74, 15, 99, 0.25)' 
        : palette === 'WHITE_HOT' 
        ? 'rgba(70, 70, 70, 0.25)' 
        : 'rgba(180, 180, 180, 0.25)';
      ctx.fillStyle = noiseColor;
      for (let i = 0; i < 7; i++) {
        const nx = ((Math.sin(now * 0.15 + i * 2.1) + 1) / 2) * width;
        const ny = ((Math.cos(now * 0.2 + i * 1.7) + 1) / 2) * height;
        const r = 35 + i * 14;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Search Sweep Beam Animation (during SEARCHING mode)
      if (isSearching) {
        const sweepY = ((now * 130) % height);
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 18, 0, sweepY + 18);
        sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 18, width, 36);

        // Candidate Heat Anomaly Blip
        const candX = width * 0.46 + Math.sin(now * 2.2) * 65;
        const candY = height * 0.48 + Math.cos(now * 1.6) * 45;
        const candGrad = ctx.createRadialGradient(candX, candY, 1, candX, candY, 22);
        if (palette === 'IRONBOW') {
          candGrad.addColorStop(0, '#ff9800');
          candGrad.addColorStop(0.6, '#e91e63');
          candGrad.addColorStop(1, 'transparent');
        } else if (palette === 'WHITE_HOT') {
          candGrad.addColorStop(0, '#ffffff');
          candGrad.addColorStop(0.6, '#aaaaaa');
          candGrad.addColorStop(1, 'transparent');
        } else {
          candGrad.addColorStop(0, '#000000');
          candGrad.addColorStop(0.6, '#555555');
          candGrad.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = candGrad;
        ctx.beginPath();
        ctx.arc(candX, candY, 22, 0, Math.PI * 2);
        ctx.fill();

        // Candidate Evaluation Tag
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(candX + 15, candY - 12, 135, 18);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1;
        ctx.strokeRect(candX + 15, candY - 12, 135, 18);
        ctx.fillStyle = '#ffb700';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('HEAT CANDIDATE: EVALUATING...', candX + 18, candY + 1);
      }

      // 4. Confirmed Human Heat Signature (36.8°C - 37.2°C) with Gaussian blur dissipation
      if (isLocked || uav.status === 'TARGET_LOCKED') {
        const targetX = width * 0.5 + Math.sin(now * 1.8) * 3;
        const targetY = height * 0.52 + Math.cos(now * 1.8) * 2;

        // Radiant Core Heat
        const heatGrad = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, 55);
        if (palette === 'IRONBOW') {
          heatGrad.addColorStop(0, '#ffffff'); // 37°C Core White Hot
          heatGrad.addColorStop(0.2, '#fff59d'); // 34°C Yellow
          heatGrad.addColorStop(0.5, '#ff5722'); // 28°C Amber
          heatGrad.addColorStop(0.8, '#ad1457'); // 22°C Magenta
          heatGrad.addColorStop(1, 'transparent');
        } else if (palette === 'WHITE_HOT') {
          heatGrad.addColorStop(0, '#ffffff');
          heatGrad.addColorStop(0.3, '#dddddd');
          heatGrad.addColorStop(0.7, '#888888');
          heatGrad.addColorStop(1, 'transparent');
        } else {
          heatGrad.addColorStop(0, '#000000');
          heatGrad.addColorStop(0.3, '#333333');
          heatGrad.addColorStop(0.7, '#777777');
          heatGrad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 55, 0, Math.PI * 2);
        ctx.fill();

        // 5. AI Detection Bounding Box & Target Lock Banner
        const boxW = 68;
        const boxH = 96;
        const boxX = targetX - boxW / 2;
        const boxY = targetY - boxH / 2;

        // Pulsing Emerald Bounding Box
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // High-vis Tactical Corner Brackets
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + 14);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + 14, boxY);
        ctx.stroke();
        // Top-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 14, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + 14);
        ctx.stroke();
        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - 14);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + 14, boxY + boxH);
        ctx.stroke();
        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 14, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - 14);
        ctx.stroke();

        // AI Detection Header Banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(boxX - 20, boxY - 32, 210, 28);
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(boxX - 20, boxY - 32, 210, 28);

        ctx.fillStyle = '#00ff9d';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`TARGET_ACQUIRED // CONF: ${uav.target_confidence || 97.6}%`, boxX - 14, boxY - 18);
        ctx.fillStyle = '#ffb700';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`T_CORE: 36.8°C | DELTA_T: +14.2°C`, boxX - 14, boxY - 7);
      }

      // 6. HUD Center Reticle & Crosshairs
      const cx = width / 2;
      const cy = height / 2;
      const reticleColor = isLocked ? '#00ff9d' : 'rgba(0, 240, 255, 0.55)';
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 1;

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - 28, cy);
      ctx.lineTo(cx - 8, cy);
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + 28, cy);
      ctx.moveTo(cx, cy - 28);
      ctx.lineTo(cx, cy - 8);
      ctx.moveTo(cx, cy + 8);
      ctx.lineTo(cx, cy + 28);
      ctx.stroke();

      // Outer targeting circle
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.stroke();

      if (isLocked) {
        // Pulsing reticle ring
        const pulseR = 36 + (Math.sin(now * 6) + 1) * 6;
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // CRT Scanline Overlay
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
  }, [uav.status, uav.target_locked, isSearching, isLocked, palette]);

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 relative">
      {/* Header with Palette Switcher */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-slate-200 font-bold">
          <Eye className="w-4 h-4 text-tactical-cyan" />
          AUTONOMOUS FLIR THERMAL-VISION & AI DETECTION
        </span>
        <div className="flex items-center gap-2">
          {/* Palette Selector */}
          <div className="flex items-center gap-1 bg-tactical-card p-0.5 rounded border border-tactical-border text-[9px]">
            <button
              onClick={() => setPalette('IRONBOW')}
              className={`px-1.5 py-0.5 rounded ${palette === 'IRONBOW' ? 'bg-tactical-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              IRONBOW
            </button>
            <button
              onClick={() => setPalette('WHITE_HOT')}
              className={`px-1.5 py-0.5 rounded ${palette === 'WHITE_HOT' ? 'bg-white text-black font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              WHITE-HOT
            </button>
            <button
              onClick={() => setPalette('BLACK_HOT')}
              className={`px-1.5 py-0.5 rounded ${palette === 'BLACK_HOT' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              BLACK-HOT
            </button>
          </div>

          <StatusBadge
            status={isLocked ? 'TARGET_LOCKED' : isSearching ? 'SEARCHING' : isFlying ? 'EN_ROUTE_LKP' : 'STANDBY'}
            label={isLocked ? 'TARGET ACQUIRED' : isSearching ? 'THERMAL SWEEP' : isFlying ? 'EN ROUTE' : 'STANDBY'}
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
          <div>SCAN STATE: {isLocked ? 'TARGET_LOCKED' : isSearching ? 'EXPANDING_SQUARE_SWEEP' : 'STANDBY'}</div>
          <div>GIMBAL PITCH: {thermal_vision.gimbal_pitch_deg}° // ALT: {uav.altitude_agl}m AGL</div>
          <div>TARGET GPS: {Math.abs(targetLat).toFixed(4)}°{targetLat >= 0 ? 'N' : 'S'}, {Math.abs(targetLon).toFixed(4)}°{targetLon >= 0 ? 'E' : 'W'}</div>
        </div>

        {/* HUD Telemetry Top-Right */}
        <div className="absolute top-2 right-2 text-[9px] font-mono text-amber-300 bg-black/85 p-1.5 rounded border border-amber-500/30 space-y-0.5 pointer-events-none text-right">
          <div>AMBIENT TERRAIN: 22.6°C</div>
          <div className="text-white font-bold">
            BODY CORE TEMP: {isLocked ? '36.8°C' : '--.-°C'}
          </div>
          <div className={isLocked ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
            AI CONFIDENCE: {isLocked ? `${uav.target_confidence || 97.6}%` : isSearching ? '64.2%' : '0.0%'}
          </div>
        </div>

        {/* Temperature Scale Bar on Right */}
        <div className="absolute right-2 bottom-2 top-20 w-3 rounded overflow-hidden border border-slate-700 bg-gradient-to-t from-[#060214] via-[#ff5722] to-[#ffffff] pointer-events-none flex flex-col justify-between py-1 items-center text-[7px] font-mono font-bold text-black select-none">
          <span className="bg-white/90 px-0.5 rounded">38°</span>
          <span className="bg-white/90 px-0.5 rounded">18°</span>
        </div>
      </div>
    </div>
  );
}
