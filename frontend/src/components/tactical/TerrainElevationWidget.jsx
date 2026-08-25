import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Mountain, TrendingUp, Compass, Activity, Navigation, ArrowUpRight } from 'lucide-react';

export default function TerrainElevationWidget() {
  const { terrain_profile, tourist, rescue_team, active_incident } = useSystem();

  const profile = terrain_profile || {
    tourist_elevation_m: 1240.0,
    outpost_elevation_m: 1180.0,
    delta_elevation_m: 60.0,
    transit_distance_km: 1.42,
    slope_gradient_deg: 18.4,
    terrain_ruggedness_index: 0.82,
    difficulty_rating: 'GRADE-4 HIGH-CLEARANCE OFF-ROAD',
    canopy_density_pct: 68
  };

  return (
    <div className="tactical-box p-3 rounded border border-tactical-border/90 bg-tactical-dark/95 flex flex-col gap-2 font-mono text-[10px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tactical-border/60 pb-1.5 text-xs font-bold text-slate-200">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Mountain className="w-4 h-4 text-amber-400" />
          <span>TERRAIN ELEVATION & TOPOGRAPHY PROFILE</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold">
          {profile.difficulty_rating}
        </span>
      </div>

      {/* Topographic Visual Slope Chart */}
      <div className="relative w-full h-14 bg-gradient-to-b from-black/80 to-tactical-darkest rounded border border-tactical-border/60 overflow-hidden flex items-end px-3 pb-2">
        {/* Synthetic Elevation Slope Vector */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polygon points="0,85 100,25 100,100 0,100" fill="rgba(245, 158, 11, 0.12)" />
          <line x1="0" y1="85" x2="100" y2="25" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3, 3" />
        </svg>

        <div className="relative z-10 w-full flex justify-between items-center text-[9px] font-bold">
          <div className="bg-black/80 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
            BASE: {profile.outpost_elevation_m}m ASL
          </div>
          <div className="bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-300 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            SLOPE: +{profile.slope_gradient_deg}°
          </div>
          <div className="bg-black/80 px-1.5 py-0.5 rounded border border-cyan-500/50 text-cyan-300">
            VICTIM: {profile.tourist_elevation_m}m ASL
          </div>
        </div>
      </div>

      {/* Numerical Topography Metrics Grid */}
      <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
        <div className="bg-tactical-card p-1.5 rounded border border-tactical-border">
          <div className="text-tactical-muted">DELTA ALT</div>
          <div className="font-bold text-emerald-400">+{profile.delta_elevation_m}m</div>
        </div>
        <div className="bg-tactical-card p-1.5 rounded border border-tactical-border">
          <div className="text-tactical-muted">DISTANCE</div>
          <div className="font-bold text-white">{profile.transit_distance_km} km</div>
        </div>
        <div className="bg-tactical-card p-1.5 rounded border border-tactical-border">
          <div className="text-tactical-muted">TRI INDEX</div>
          <div className="font-bold text-amber-300">{profile.terrain_ruggedness_index}</div>
        </div>
        <div className="bg-tactical-card p-1.5 rounded border border-tactical-border">
          <div className="text-tactical-muted">CANOPY</div>
          <div className="font-bold text-cyan-300">{profile.canopy_density_pct}%</div>
        </div>
      </div>
    </div>
  );
}
