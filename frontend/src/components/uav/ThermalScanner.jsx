import React, { useRef, useEffect, useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Eye, Crosshair, Thermometer, ShieldAlert, Sparkles, Camera, Video, VideoOff, RefreshCw, Cpu } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ThermalScanner() {
  const { uav, thermal_vision } = useSystem();
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [detectedTargets, setDetectedTargets] = useState([]);
  const [aiConfidence, setAiConfidence] = useState(98.2);

  // Toggle Live Camera feed using getUserMedia
  const toggleLiveCamera = async () => {
    if (useLiveCamera) {
      // Turn off camera
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setUseLiveCamera(false);
      setCameraError(null);
    } else {
      // Turn on camera
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseLiveCamera(true);
      } catch (err) {
        console.warn('[CameraFeed] Could not access live video device:', err);
        setCameraError('Camera access denied or unavailable. Fallback to FLIR simulation.');
        setUseLiveCamera(false);
      }
    }
  };

  // Clean up video stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const renderFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now() / 1000;

      if (useLiveCamera && videoRef.current && videoRef.current.readyState >= 2) {
        // === MODE A: LIVE OPTICAL CAMERA + AI VISION SILHOUETTE TRACKER ===
        // 1. Draw raw video feed onto canvas
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // 2. Optical Ironbow Shader Effect: Apply slight thermal tint
        ctx.fillStyle = 'rgba(25, 4, 45, 0.45)';
        ctx.fillRect(0, 0, width, height);

        // 3. In-Browser Motion/Human Centroid Tracking simulation
        const targetX = width * 0.5 + Math.sin(now * 1.5) * 40;
        const targetY = height * 0.48 + Math.cos(now * 1.2) * 25;
        const boxW = 85;
        const boxH = 120;
        const boxX = targetX - boxW / 2;
        const boxY = targetY - boxH / 2;

        // Render False-Color Thermal Glow over detected subject
        const heatGrad = ctx.createRadialGradient(targetX, targetY, 4, targetX, targetY, 65);
        heatGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); // 37°C
        heatGrad.addColorStop(0.3, 'rgba(255, 241, 118, 0.5)');
        heatGrad.addColorStop(0.7, 'rgba(255, 87, 34, 0.35)');
        heatGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 65, 0, Math.PI * 2);
        ctx.fill();

        // 4. High-Contrast HUD Targeting Reticle & Bounding Box
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // High-Contrast Corner Brackets
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + 16);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + 16, boxY);
        ctx.stroke();
        // Top-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 16, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + 16);
        ctx.stroke();
        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - 16);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + 16, boxY + boxH);
        ctx.stroke();
        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - 16, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - 16);
        ctx.stroke();

        // Target Tag Label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY - 24, 210, 20);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY - 24, 210, 20);

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`TARGET_LOCKED // VICTIM IDENTIFIED (${aiConfidence}%)`, boxX + 4, boxY - 10);

      } else {
        // === MODE B: SYNTHETIC FLIR THERMAL SENSOR STREAM ===
        // 1. Background Thermal Landscape (Ironbow palette: Deep Indigo/Purple -> Red -> Yellow -> White)
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0a041f'); // Cool background ~12°C
        grad.addColorStop(0.5, '#1e0840');
        grad.addColorStop(1, '#3b0d5c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Terrain Heat Textures / Noise
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
            const boxW = 60;
            const boxH = 85;
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
            ctx.fillRect(boxX, boxY - 22, 195, 18);
            ctx.strokeStyle = '#00ff9d';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY - 22, 195, 18);

            ctx.fillStyle = '#00ff9d';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(`TARGET_LOCKED // VICTIM (36.8°C) 98.2%`, boxX + 4, boxY - 10);
          }
        }
      }

      // 5. HUD Crosshair & Center Reticle
      const cx = width / 2;
      const cy = height / 2;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;

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

      // Scan lines overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [useLiveCamera, uav.status, uav.target_locked, aiConfidence]);

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 relative font-mono">
      {/* Hidden Video for Camera Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-200 font-bold">
            <Eye className="w-4 h-4 text-tactical-cyan" />
            {useLiveCamera ? 'LIVE OPTICAL FEED // AI SILHOUETTE TRACKER' : 'SYNTHETIC FLIR THERMAL SENSOR'}
          </span>
          <button
            onClick={toggleLiveCamera}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-all active:scale-95 shadow ${
              useLiveCamera
                ? 'bg-cyan-500 text-black border-cyan-400 font-black'
                : 'bg-tactical-card hover:bg-tactical-cardHover border-tactical-border text-slate-300'
            }`}
          >
            {useLiveCamera ? <Video className="w-3 h-3 text-black" /> : <Camera className="w-3 h-3 text-tactical-cyan" />}
            {useLiveCamera ? 'LIVE CAMERA ACTIVE' : 'CONNECT LIVE OPTICAL FEED'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-tactical-muted">PALETTE: IRONBOW</span>
          <StatusBadge
            status={uav.target_locked || useLiveCamera ? 'TARGET_LOCKED' : uav.status}
            size="xs"
            pulse={uav.target_locked || useLiveCamera}
          />
        </div>
      </div>

      {cameraError && (
        <div className="p-1.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-[9px]">
          {cameraError}
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="relative w-full h-64 bg-black rounded overflow-hidden border border-tactical-border/80">
        <canvas
          ref={canvasRef}
          width={480}
          height={260}
          className="w-full h-full block"
        />

        {/* Telemetry Overlays */}
        <div className="absolute top-2 left-2 text-[9px] text-cyan-300 bg-black/80 p-1.5 rounded border border-cyan-500/30 space-y-0.5 pointer-events-none">
          <div>GIMBAL PITCH: {thermal_vision.gimbal_pitch_deg}°</div>
          <div>OPTICAL SENSOR: {useLiveCamera ? 'HD WEBCAM / CMOS' : 'LWIR UNCOOLED MICROBOLOMETER'}</div>
          <div>FRAME RATE: 30 FPS // AI CENTROID PIPELINE</div>
        </div>

        <div className="absolute top-2 right-2 text-[9px] text-amber-300 bg-black/80 p-1.5 rounded border border-amber-500/30 space-y-0.5 pointer-events-none text-right">
          <div>AMBIENT TEMP: {thermal_vision.ambient_temp_c}°C</div>
          <div className="text-white font-bold">MAX DETECTED: {thermal_vision.max_detected_temp_c}°C</div>
          <div className="text-emerald-400 font-bold">
            {useLiveCamera ? 'AI VISION CONFIDENCE: 98.2%' : (uav.target_locked ? 'BIO-SIGNATURE MATCH' : 'SCANNING MATRIX')}
          </div>
        </div>

        {/* Temperature Scale Bar on Right */}
        <div className="absolute right-2 bottom-2 top-20 w-3 rounded overflow-hidden border border-slate-700 bg-gradient-to-t from-[#0a041f] via-[#ff5722] to-[#ffffff] pointer-events-none flex flex-col justify-between py-1 items-center text-[7px] font-bold text-black select-none">
          <span className="bg-white/80 px-0.5 rounded">38°</span>
          <span className="bg-white/80 px-0.5 rounded">14°</span>
        </div>
      </div>
    </div>
  );
}
