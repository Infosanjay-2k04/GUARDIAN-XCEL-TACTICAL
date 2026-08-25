import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Activity } from 'lucide-react';

export default function TelemetryGraph() {
  const { accelHistory, tourist } = useSystem();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#040914';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#102344';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center baseline
    const midY = height / 2;
    ctx.strokeStyle = '#1a3a6c';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    if (!accelHistory || accelHistory.length < 2) return;

    const stepX = width / Math.max(1, accelHistory.length - 1);

    // Function to draw line series
    const drawSeries = (color, getValue, scale = 25) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      accelHistory.forEach((sample, idx) => {
        const x = idx * stepX;
        const val = getValue(sample);
        const y = midY - val * scale;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw X (Cyan), Y (Amber), Z (Emerald), Total G (Crimson when >2g)
    drawSeries('#00f0ff', s => s.x, 30);
    drawSeries('#ffb700', s => s.y, 30);
    drawSeries('#00ff9d', s => s.z - 1.0, 30); // Center 1g around 0
    drawSeries(tourist.threat_level === 'CRITICAL' ? '#ff2255' : '#e2e8f0', s => s.g - 1.0, 20);

  }, [accelHistory, tourist.threat_level]);

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-tactical-muted border-b border-tactical-border/50 pb-1">
        <span className="flex items-center gap-1 text-slate-300 font-bold">
          <Activity className="w-3.5 h-3.5 text-tactical-cyan" />
          3-AXIS ACCELEROMETER TELEMETRY
        </span>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-tactical-cyan font-bold">X: {tourist.accel_x.toFixed(2)}</span>
          <span className="text-amber-400 font-bold">Y: {tourist.accel_y.toFixed(2)}</span>
          <span className="text-emerald-400 font-bold">Z: {tourist.accel_z.toFixed(2)}</span>
          <span className="text-white font-bold">G: {tourist.g_force.toFixed(2)}g</span>
        </div>
      </div>

      <div className="relative w-full h-24 rounded overflow-hidden border border-tactical-border/60">
        <canvas
          ref={canvasRef}
          width={320}
          height={96}
          className="w-full h-full block"
        />
        {tourist.threat_level === 'CRITICAL' && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-950/80 border border-rose-500 text-rose-400 text-[9px] font-mono font-bold animate-pulse">
            HIGH G SPIKE DETECTED
          </div>
        )}
      </div>
    </div>
  );
}
